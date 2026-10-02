using Generator.DTO;
using Generator.DTO.Attributes;
using Generator.DTO.Warnings;
using Generator.Extensions;
using Generator.Queries;
using Generator.Services;
using Generator.Services.Plugins;
using Generator.Services.PowerAutomate;
using Generator.Services.WebResources;
using Microsoft.Extensions.Logging;
using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Metadata;
using System.Diagnostics;

namespace Generator
{
    internal class DataverseService
    {
        private readonly ILogger<DataverseService> logger;
        private readonly EntityMetadataService entityMetadataService;
        private readonly SolutionService solutionService;
        private readonly SecurityRoleService securityRoleService;
        private readonly EntityIconService entityIconService;
        private readonly RecordMappingService recordMappingService;
        private readonly SolutionComponentService solutionComponentService;
        private readonly SolutionComponentExtractor solutionComponentExtractor;
        private readonly WorkflowService workflowService;
        private readonly RelationshipService relationshipService;

        private readonly List<IAnalyzerRegistration> analyzerRegistrations;

        public DataverseService(
            ServiceClient client,
            ILogger<DataverseService> logger,
            EntityMetadataService entityMetadataService,
            SolutionService solutionService,
            SecurityRoleService securityRoleService,
            EntityIconService entityIconService,
            RecordMappingService recordMappingService,
            SolutionComponentService solutionComponentService,
            SolutionComponentExtractor solutionComponentExtractor,
            WorkflowService workflowService,
            RelationshipService relationshipService)
        {
            this.logger = logger;
            this.entityMetadataService = entityMetadataService;
            this.solutionService = solutionService;
            this.securityRoleService = securityRoleService;
            this.entityIconService = entityIconService;
            this.recordMappingService = recordMappingService;
            this.workflowService = workflowService;
            this.relationshipService = relationshipService;
            this.solutionComponentExtractor = solutionComponentExtractor;

            // Register all analyzers with their query functions
            analyzerRegistrations = new List<IAnalyzerRegistration>
            {
                new AnalyzerRegistration<SDKStep>(
                    new PluginAnalyzer(client),
                    solutionIds => client.GetSDKMessageProcessingStepsAsync(solutionIds),
                    "Plugins"),
                new AnalyzerRegistration<PowerAutomateFlow>(
                    new PowerAutomateFlowAnalyzer(client),
                    solutionIds => client.GetPowerAutomateFlowsAsync(solutionIds),
                    "Power Automate Flows"),
                new AnalyzerRegistration<WebResource>(
                    new WebResourceAnalyzer(client),
                    solutionIds => client.GetWebResourcesAsync(solutionIds),
                    "WebResources")
            };
            this.solutionComponentService = solutionComponentService;
        }

        public async Task<(IEnumerable<Record>, IEnumerable<SolutionWarning>, IEnumerable<SolutionComponentCollection>, Dictionary<string, GlobalOptionSetUsage>)> GetFilteredMetadata()
        {
            // used to collect warnings for the insights dashboard
            var warnings = new List<SolutionWarning>();
            var (solutionIds, solutionEntities) = await solutionService.GetSolutionIds();

            /// SOLUTIONS
            IEnumerable<ComponentInfo> solutionComponents;
            try
            {
                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Calling solutionComponentService.GetAllSolutionComponentsAsync()");
                solutionComponents = await solutionComponentService.GetAllSolutionComponentsAsync(solutionIds);
                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Retrieved {solutionComponents.Count()} solution components");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Failed to get solution components");
                throw;
            }

            // Build solution lookup: SolutionId -> SolutionInfo
            var solutionLookup = solutionEntities.ToDictionary(
                s => s.GetAttributeValue<Guid>("solutionid"),
                s => new DTO.SolutionInfo(
                    s.GetAttributeValue<Guid>("solutionid"),
                    s.GetAttributeValue<string>("friendlyname") ?? s.GetAttributeValue<string>("uniquename") ?? "Unknown"
                )
            );

            // Build ObjectId -> List<SolutionInfo> mapping BEFORE creating hashsets
            // This preserves the many-to-many relationship between components and solutions
            var componentSolutionMap = new Dictionary<Guid, List<DTO.SolutionInfo>>();
            foreach (var component in solutionComponents)
            {
                if (!componentSolutionMap.ContainsKey(component.ObjectId))
                {
                    componentSolutionMap[component.ObjectId] = new List<DTO.SolutionInfo>();
                }

                if (solutionLookup.TryGetValue(component.SolutionId, out var solutionInfo))
                {
                    // Only add if not already present (avoid duplicates)
                    if (!componentSolutionMap[component.ObjectId].Any(s => s.Id == solutionInfo.Id))
                    {
                        componentSolutionMap[component.ObjectId].Add(solutionInfo);
                    }
                }
            }
            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Built solution mapping for {componentSolutionMap.Count} unique components");

            var inclusionMap = solutionComponents.ToDictionary(s => s.ObjectId, s => s.IsExplicit);

            /// ENTITIES
            var set = solutionComponents.Select(c => c.ObjectId).ToHashSet();
            IEnumerable<EntityMetadata> entitiesInSolutionMetadata;
            IEnumerable<ComponentInfo> entitiesInSolution;
            try
            {
                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Calling entityMetadataService.GetEntityMetadataByObjectIds()");
                entitiesInSolution = solutionComponents.Where(c => c.ComponentType is 1).DistinctBy(comp => comp.ObjectId);
                entitiesInSolutionMetadata = (await entityMetadataService.GetEntityMetadataByObjectIds(entitiesInSolution.Select(e => e.ObjectId)))
                    .Where(ent => ent.IsIntersect is false); // IsIntersect is true for standard hidden M-M entities
                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Retrieved {entitiesInSolutionMetadata.Count()} entity metadata");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Failed to get entity metadata");
                throw;
            }
            var entityLogicalNamesInSolution = entitiesInSolutionMetadata.Select(e => e.LogicalName).ToHashSet();
            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Found {entityLogicalNamesInSolution.Count} unique entities");
            var entityIconMap = await entityIconService.GetEntityIconMap(entitiesInSolutionMetadata);
            var relatedEntityLogicalNames = new HashSet<string>();
            foreach (var entity in entitiesInSolutionMetadata)
            {
                var entityLogicalNamesOutsideSolution = entity.Attributes
                    .OfType<LookupAttributeMetadata>()
                    .SelectMany(attr => attr.Targets)
                    .Distinct()
                    .Where(target => !entityLogicalNamesInSolution.Contains(target));
                foreach (var target in entityLogicalNamesOutsideSolution) relatedEntityLogicalNames.Add(target);
            }
            logger.LogInformation("There are {Count} entities referenced outside the solution.", relatedEntityLogicalNames.Count);
            var referencedEntityMetadata = await entityMetadataService.GetEntityMetadataByLogicalNames(relatedEntityLogicalNames.ToList());
            var allEntityMetadata = entitiesInSolutionMetadata.Concat(referencedEntityMetadata).ToList();
            var logicalToSchema = allEntityMetadata.ToDictionary(x => x.LogicalName, x => new ExtendedEntityInformation { Name = x.SchemaName, IsInSolution = entitiesInSolutionMetadata.Any(e => e.LogicalName == x.LogicalName) });

            /// PUBLISHERS
            var publisherMap = await solutionService.GetPublisherMapAsync(solutionEntities);

            /// SECURITY ROLES
            var rolesInSolution = solutionComponents.Where(x => x.ComponentType == 20).Select(x => x.ObjectId).Distinct().ToList();
            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Found {rolesInSolution.Count} roles");
            var logicalNameToSecurityRoles = await securityRoleService.GetSecurityRoles(rolesInSolution, entitiesInSolutionMetadata.ToDictionary(x => x.LogicalName, x => x.Privileges));

            /// ATTRIBUTES
            var attributesInSolution = solutionComponents.Where(x => x.ComponentType == 2).Select(x => x.ObjectId).ToHashSet();
            var rootBehaviourEntities = entitiesInSolution.Where(ent => ent.RootComponentBehaviour is 0).Select(e => e.ObjectId).ToHashSet();
            var attributesAllExplicitlyAdded = entitiesInSolutionMetadata.Where(e => rootBehaviourEntities.Contains(e.MetadataId!.Value))
                .SelectMany(e => e.Attributes
                    .Where(a => a.DisplayName.UserLocalizedLabel is not null)) // Sometimes Yomi columns and other hidden attributes are added. These wont have any localized labels.
                    .Select(a => a.MetadataId!.Value);
            foreach (var attr in attributesAllExplicitlyAdded)
            {
                attributesInSolution.Add(attr);
                inclusionMap.TryAdd(attr, true);
            }

            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Found {attributesInSolution.Count} attributes");
            var attributeLogicalToSchema = allEntityMetadata.ToDictionary(x => x.LogicalName, x => x.Attributes?.ToDictionary(attr => attr.LogicalName, attr => attr.DisplayName.ToLabelString() ?? attr.SchemaName) ?? []);

            /// ENTITY RELATIONSHIPS
            var relationshipsInSolution = solutionComponents.Where(x => x.ComponentType == 10).Select(x => x.ObjectId).ToHashSet();
            var relationshipsAllExplicitlyAdded = entitiesInSolutionMetadata.Where(e => rootBehaviourEntities.Contains(e.MetadataId!.Value)).SelectMany(e =>
                e.ManyToManyRelationships.Select(a => a.MetadataId!.Value)
                .Concat(e.OneToManyRelationships.Select(a => a.MetadataId!.Value))
                .Concat(e.ManyToOneRelationships.Select(a => a.MetadataId!.Value)));
            foreach (var rel in relationshipsAllExplicitlyAdded)
            {
                relationshipsInSolution.Add(rel);
                inclusionMap.TryAdd(rel, true);
            }

            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Found {relationshipsInSolution.Count} relations");

            /// KEYS
            var logicalNameToKeys = entitiesInSolutionMetadata.ToDictionary(
                entity => entity.LogicalName,
                entity => entity.Keys.Select(key => new Key(
                    key.DisplayName.ToLabelString(),
                    key.LogicalName,
                    key.KeyAttributes)
                ).ToList());

            /// PROCESS ANALYSERS
            var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();
            foreach (var registration in analyzerRegistrations)
                await registration.RunAnalysisAsync(solutionIds, attributeUsages, warnings, logger, entitiesInSolutionMetadata.ToList());

            /// WORKFLOW DEPENDENCIES
            Dictionary<Guid, List<WorkflowInfo>> workflowDependencies;
            try
            {
                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Getting workflow dependencies for attributes");

                // Get workflow dependencies for attributes (returns attribute ObjectId -> list of workflow ObjectIds)
                // Scan the same attributes we export, including columns included with a whole table.
                var workflowDependencyMap = await solutionComponentService.GetWorkflowDependenciesForAttributesAsync(attributesInSolution);

                // Get workflow details for all unique workflow IDs
                var allWorkflowIds = workflowDependencyMap.Values.SelectMany(ids => ids).Distinct().ToList();
                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Found {allWorkflowIds.Count} unique workflow dependencies");

                var workflowInfoMap = await workflowService.GetWorkflows(allWorkflowIds);

                // Convert to attribute ObjectId -> list of WorkflowInfo
                workflowDependencies = workflowDependencyMap.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Select(wid => workflowInfoMap.GetValueOrDefault(wid)).Where(w => w != null).Select(w => w!).ToList()
                );

                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Mapped workflow information for {workflowDependencies.Count} attributes");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Failed to get workflow dependencies, continuing without them");
                workflowDependencies = new Dictionary<Guid, List<WorkflowInfo>>();
            }

            /// BUILD GLOBAL OPTION SET USAGE MAP
            var globalOptionSetUsages = new Dictionary<string, GlobalOptionSetUsage>();
            foreach (var entMeta in entitiesInSolutionMetadata)
            {
                var relevantAttributes = entMeta.Attributes.Where(attr => attributesInSolution.Contains(attr.MetadataId!.Value));
                foreach (var attr in relevantAttributes)
                {
                    string? globalOptionSetName = null;
                    string? globalOptionSetDisplayName = null;

                    if (attr is PicklistAttributeMetadata picklist && picklist.OptionSet?.IsGlobal == true)
                    {
                        globalOptionSetName = picklist.OptionSet.Name;
                        globalOptionSetDisplayName = picklist.OptionSet.DisplayName.ToLabelString();
                    }
                    else if (attr is MultiSelectPicklistAttributeMetadata multiSelect && multiSelect.OptionSet?.IsGlobal == true)
                    {
                        globalOptionSetName = multiSelect.OptionSet.Name;
                        globalOptionSetDisplayName = multiSelect.OptionSet.DisplayName.ToLabelString();
                    }

                    if (globalOptionSetName != null)
                    {
                        if (!globalOptionSetUsages.ContainsKey(globalOptionSetName))
                        {
                            globalOptionSetUsages[globalOptionSetName] = new GlobalOptionSetUsage(
                                globalOptionSetName,
                                globalOptionSetDisplayName ?? globalOptionSetName,
                                new List<GlobalOptionSetUsageReference>());
                        }

                        globalOptionSetUsages[globalOptionSetName].Usages.Add(new GlobalOptionSetUsageReference(
                            entMeta.SchemaName,
                            entMeta.DisplayName.ToLabelString(),
                            attr.SchemaName,
                            attr.DisplayName.ToLabelString()));
                    }
                }
            }

            var records =
                entitiesInSolutionMetadata
                .Select(entMeta =>
                {
                    var relevantAttributes = entMeta.Attributes.Where(attr => attributesInSolution.Contains(attr.MetadataId!.Value)).ToList();
                    var relevantManyToManyRelations = relationshipService.ConvertManyToManyRelationships(entMeta.ManyToManyRelationships.Where(rel => relationshipsInSolution.Contains(rel.MetadataId!.Value)), entMeta.LogicalName, logicalToSchema, inclusionMap, publisherMap, componentSolutionMap, entMeta.MetadataId!.Value);
                    var relevantOneToManyRelations = relationshipService.ConvertOneToManyRelationships(entMeta.OneToManyRelationships.Where(rel => relationshipsInSolution.Contains(rel.MetadataId!.Value)), true, logicalToSchema, attributeLogicalToSchema, inclusionMap, publisherMap, componentSolutionMap, entMeta.MetadataId!.Value);
                    var relevantManyToOneRelations = relationshipService.ConvertOneToManyRelationships(entMeta.ManyToOneRelationships.Where(rel => relationshipsInSolution.Contains(rel.MetadataId!.Value)), false, logicalToSchema, attributeLogicalToSchema, inclusionMap, publisherMap, componentSolutionMap, entMeta.MetadataId!.Value);
                    var relevantRelationships = relevantManyToManyRelations.Concat(relevantManyToOneRelations).Concat(relevantOneToManyRelations).ToList();

                    logicalNameToSecurityRoles.TryGetValue(entMeta.LogicalName, out var securityRoles);
                    logicalNameToKeys.TryGetValue(entMeta.LogicalName, out var keys);

                    return recordMappingService.CreateRecord(
                        entMeta,
                        relevantAttributes,
                        relevantRelationships,
                        logicalToSchema,
                        securityRoles ?? [],
                        keys ?? [],
                        entityIconMap,
                        attributeUsages,
                        inclusionMap,
                        workflowDependencies,
                        publisherMap,
                        componentSolutionMap);
                })
                .ToList();

            /// SOLUTION COMPONENTS FOR INSIGHTS
            List<SolutionComponentCollection> solutionComponentCollections;
            try
            {
                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Extracting solution components for insights view");

                // Build name lookups from entity metadata for the extractor
                var entityNameLookup = entitiesInSolutionMetadata.ToDictionary(
                    e => e.MetadataId!.Value,
                    e => e.DisplayName.ToLabelString() ?? e.SchemaName);

                var attributeNameLookup = entitiesInSolutionMetadata
                    .SelectMany(e => e.Attributes.Where(a => a.MetadataId.HasValue))
                    .ToDictionary(
                        a => a.MetadataId!.Value,
                        a => a.DisplayName.ToLabelString() ?? a.SchemaName);

                var relationshipNameLookup = entitiesInSolutionMetadata
                    .SelectMany(e => e.ManyToManyRelationships.Cast<RelationshipMetadataBase>()
                        .Concat(e.OneToManyRelationships)
                        .Concat(e.ManyToOneRelationships))
                    .Where(r => r.MetadataId.HasValue)
                    .DistinctBy(r => r.MetadataId!.Value)
                    .ToDictionary(
                        r => r.MetadataId!.Value,
                        r => r.SchemaName);

                // Build entity lookups for attributes, relationships, and keys (maps component ID to parent entity name)
                var attributeEntityLookup = entitiesInSolutionMetadata
                    .SelectMany(e => e.Attributes.Where(a => a.MetadataId.HasValue)
                        .Select(a => (AttributeId: a.MetadataId!.Value, EntityName: e.DisplayName.ToLabelString() ?? e.LogicalName)))
                    .ToDictionary(x => x.AttributeId, x => x.EntityName);

                var relationshipEntityLookup = entitiesInSolutionMetadata
                    .SelectMany(e => e.ManyToManyRelationships.Cast<RelationshipMetadataBase>()
                        .Concat(e.OneToManyRelationships)
                        .Concat(e.ManyToOneRelationships)
                        .Where(r => r.MetadataId.HasValue)
                        .Select(r => (RelationshipId: r.MetadataId!.Value, EntityName: e.DisplayName.ToLabelString() ?? e.LogicalName)))
                    .DistinctBy(x => x.RelationshipId)
                    .ToDictionary(x => x.RelationshipId, x => x.EntityName);

                var keyEntityLookup = entitiesInSolutionMetadata
                    .SelectMany(e => (e.Keys ?? Array.Empty<EntityKeyMetadata>())
                        .Where(k => k.MetadataId.HasValue)
                        .Select(k => (KeyId: k.MetadataId!.Value, EntityName: e.DisplayName.ToLabelString() ?? e.LogicalName)))
                    .ToDictionary(x => x.KeyId, x => x.EntityName);

                // Build solution name lookup
                var solutionNameLookup = solutionLookup.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Name);

                solutionComponentCollections = await solutionComponentExtractor.ExtractSolutionComponentsAsync(
                    solutionIds,
                    solutionNameLookup,
                    entityNameLookup,
                    attributeNameLookup,
                    relationshipNameLookup,
                    attributeEntityLookup,
                    relationshipEntityLookup,
                    keyEntityLookup);

                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Extracted components for {solutionComponentCollections.Count} solutions");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Failed to extract solution components for insights, continuing without them");
                solutionComponentCollections = new List<SolutionComponentCollection>();
            }

            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] GetFilteredMetadata completed");
            return (records, warnings, solutionComponentCollections, globalOptionSetUsages);
        }
    }

    /// <summary>
    /// Interface for analyzer registrations to enable polymorphic execution
    /// </summary>
    internal interface IAnalyzerRegistration
    {
        Task RunAnalysisAsync(
            List<Guid> solutionIds,
            Dictionary<string, Dictionary<string, List<AttributeUsage>>> attributeUsages,
            List<SolutionWarning> warnings,
            ILogger logger,
            List<EntityMetadata> entityMetadata);
    }

    /// <summary>
    /// Generic analyzer registration that pairs an analyzer with its query function
    /// </summary>
    internal class AnalyzerRegistration<T> : IAnalyzerRegistration where T : Analyzeable
    {
        private readonly IComponentAnalyzer<T> analyzer;
        private readonly Func<List<Guid>, Task<IEnumerable<T>>> queryFunc;
        private readonly string componentTypeName;

        public AnalyzerRegistration(
            IComponentAnalyzer<T> analyzer,
            Func<List<Guid>, Task<IEnumerable<T>>> queryFunc,
            string componentTypeName)
        {
            this.analyzer = analyzer;
            this.queryFunc = queryFunc;
            this.componentTypeName = componentTypeName;
        }

        public async Task RunAnalysisAsync(
            List<Guid> solutionIds,
            Dictionary<string, Dictionary<string, List<AttributeUsage>>> attributeUsages,
            List<SolutionWarning> warnings,
            ILogger logger,
            List<EntityMetadata> entityMetadata)
        {
            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Starting {componentTypeName} analysis");
            var stopwatch = Stopwatch.StartNew();

            IEnumerable<T> components;
            try
            {
                logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Querying {componentTypeName} from Dataverse");
                components = await queryFunc(solutionIds);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Failed to query {componentTypeName}");
                throw;
            }

            var componentList = components.ToList();
            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] There are {componentList.Count} {componentTypeName} in the environment.");

            int processedCount = 0;
            foreach (var component in componentList)
            {
                try
                {
                    await analyzer.AnalyzeComponentAsync(component, attributeUsages, warnings, entityMetadata);
                    processedCount++;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Failed to analyze {componentTypeName} component (processed {processedCount}/{componentList.Count})");
                    // Continue with next component instead of throwing
                }
            }

            stopwatch.Stop();
            logger.LogInformation($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] {componentTypeName} analysis completed - processed {processedCount}/{componentList.Count} components in {stopwatch.ElapsedMilliseconds} ms");
        }
    }
}
