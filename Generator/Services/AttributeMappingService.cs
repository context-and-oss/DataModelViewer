using Generator.DTO;
using Generator.DTO.Attributes;
using Generator.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Xrm.Sdk.Metadata;
using Attribute = Generator.DTO.Attributes.Attribute;

namespace Generator.Services
{
    /// <summary>
    /// Service responsible for mapping Dataverse AttributeMetadata to DTO Attribute objects
    /// </summary>
    internal class AttributeMappingService
    {
        private readonly ILogger<AttributeMappingService> logger;
        private readonly SolutionService solutionService;

        public AttributeMappingService(ILogger<AttributeMappingService> logger, SolutionService solutionService)
        {
            this.logger = logger;
            this.solutionService = solutionService;
        }

        /// <summary>
        /// Maps AttributeMetadata to the appropriate DTO Attribute type
        /// </summary>
        public Attribute MapAttribute(
            AttributeMetadata metadata,
            EntityMetadata entity,
            Dictionary<string, ExtendedEntityInformation> logicalToSchema,
            Dictionary<string, Dictionary<string, List<AttributeUsage>>> attributeUsages,
            Dictionary<Guid, bool> inclusionMap,
            Dictionary<Guid, List<WorkflowInfo>> workflowDependencies,
            Dictionary<Guid, (string Name, string Prefix)> publisherMap,
            Dictionary<Guid, List<SolutionInfo>> componentSolutionMap)
        {
            Attribute attr = metadata switch
            {
                PicklistAttributeMetadata picklist => new ChoiceAttribute(picklist),
                MultiSelectPicklistAttributeMetadata multiSelect => new ChoiceAttribute(multiSelect),
                LookupAttributeMetadata lookup => new LookupAttribute(lookup, logicalToSchema),
                StateAttributeMetadata state => new ChoiceAttribute(state),
                StatusAttributeMetadata status => new StatusAttribute(status, (StateAttributeMetadata)entity.Attributes.First(x => x is StateAttributeMetadata)),
                StringAttributeMetadata stringMetadata => new StringAttribute(stringMetadata),
                IntegerAttributeMetadata integer => new IntegerAttribute(integer),
                DateTimeAttributeMetadata dateTimeAttributeMetadata => new DateTimeAttribute(dateTimeAttributeMetadata),
                MoneyAttributeMetadata money => new DecimalAttribute(money),
                DecimalAttributeMetadata decimalAttribute => new DecimalAttribute(decimalAttribute),
                MemoAttributeMetadata memo => new StringAttribute(memo),
                BooleanAttributeMetadata booleanAttribute => new BooleanAttribute(booleanAttribute),
                FileAttributeMetadata fileAttribute => new FileAttribute(fileAttribute),
                _ => new GenericAttribute(metadata)
            };

            // Get analyzer-based usages
            var schemaname = attributeUsages.GetValueOrDefault(entity.LogicalName)?.GetValueOrDefault(metadata.LogicalName) ?? [];
            // also check the plural name, as some workflows like Power Automate use collectionname
            var pluralname = entity.LogicalCollectionName is not null ? attributeUsages.GetValueOrDefault(entity.LogicalCollectionName)?.GetValueOrDefault(metadata.LogicalName) ?? [] : [];
            var analyzerUsages = new List<AttributeUsage>([.. schemaname, .. pluralname]);

            // Get workflow dependency usages
            var workflowUsages = workflowDependencies
                .GetValueOrDefault(metadata.MetadataId!.Value, [])
                .Select(w => w.ToAttributeUsage())
                .ToList();

            // Combine both sources
            var (pName, pPrefix) = solutionService.GetPublisherFromSchemaName(attr.SchemaName, publisherMap);
            attr.PublisherName = pName;
            attr.PublisherPrefix = pPrefix;
            attr.AttributeUsages = [.. analyzerUsages, .. workflowUsages];
            attr.IsExplicit = inclusionMap.GetValueOrDefault(metadata.MetadataId!.Value, false);
            attr.IsStandardFieldModified = MetadataExtensions.StandardFieldHasChanged(metadata, entity.DisplayName.ToLabelString(), entity.IsCustomEntity ?? false);

            // Get solution info for this attribute
            // If not found directly, inherit from parent entity (for attributes added via RootComponentBehaviour=0)
            attr.Solutions = componentSolutionMap.GetValueOrDefault(metadata.MetadataId!.Value)
                ?? componentSolutionMap.GetValueOrDefault(entity.MetadataId!.Value, new List<SolutionInfo>());

            return attr;
        }
    }
}
