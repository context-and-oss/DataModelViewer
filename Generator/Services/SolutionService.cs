using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Generator.Services
{
    /// <summary>
    /// Service responsible for solution queries and component mapping
    /// </summary>
    internal class SolutionService
    {
        private readonly ServiceClient client;
        private readonly IConfiguration configuration;
        private readonly ILogger<SolutionService> logger;

        public SolutionService(ServiceClient client, IConfiguration configuration, ILogger<SolutionService> logger)
        {
            this.client = client;
            this.configuration = configuration;
            this.logger = logger;
        }

        /// <summary>
        /// Retrieves solution IDs based on configuration
        /// </summary>
        public async Task<(List<Guid> SolutionIds, List<Entity> SolutionEntities)> GetSolutionIds()
        {
            var solutionNames = SolutionSelection.Parse(configuration["DataverseSolutionNames"]);

            var entities = await client.RetrieveAllAsync(new QueryExpression("solution")
            {
                ColumnSet = new ColumnSet("publisherid", "friendlyname", "uniquename", "solutionid"),
                Criteria = new FilterExpression(LogicalOperator.And)
                {
                    Conditions =
                    {
                        new ConditionExpression("uniquename", ConditionOperator.In, solutionNames)
                    }
                }
            });

            SolutionSelection.ValidateMatches(solutionNames, entities.Select(e => e.GetAttributeValue<string>("uniquename")));

            return (entities.Select(e => e.GetAttributeValue<Guid>("solutionid")).ToList(), entities);
        }

        /// <summary>
        /// Creates Solution DTOs with their components
        /// </summary>
        public async Task<Dictionary<Guid, (string Name, string Prefix)>> GetPublisherMapAsync(
            List<Entity> solutionEntities)
        {
            // Fetch all unique publishers for the solutions
            var publisherIds = solutionEntities
                .Select(s => s.GetAttributeValue<EntityReference>("publisherid").Id)
                .Distinct()
                .ToList();

            var publisherQuery = new QueryExpression("publisher")
            {
                ColumnSet = new ColumnSet("publisherid", "friendlyname", "customizationprefix"),
                Criteria = new FilterExpression(LogicalOperator.And)
                {
                    Conditions =
                    {
                        new ConditionExpression("publisherid", ConditionOperator.In, publisherIds)
                    }
                }
            };

            var publishers = await client.RetrieveAllAsync(publisherQuery);
            return publishers.ToDictionary(
                p => p.GetAttributeValue<Guid>("publisherid"),
                p => (
                    Name: p.GetAttributeValue<string>("friendlyname") ?? "Unknown Publisher",
                    Prefix: p.GetAttributeValue<string>("customizationprefix") ?? string.Empty
                ));
        }

        /// <summary>
        /// Extracts publisher information from schema name
        /// </summary>
        public (string PublisherName, string PublisherPrefix) GetPublisherFromSchemaName(
            string schemaName,
            Dictionary<Guid, (string Name, string Prefix)> publisherLookup)
        {
            // Extract prefix from schema name (e.g., "contoso_entity" -> "contoso")
            var parts = schemaName.Split('_', 2);

            if (parts.Length == 2)
            {
                var prefix = parts[0];

                // Find publisher by matching prefix
                foreach (var publisher in publisherLookup.Values)
                {
                    if (publisher.Prefix.Equals(prefix, StringComparison.OrdinalIgnoreCase))
                    {
                        return (publisher.Name, publisher.Prefix);
                    }
                }
            }

            // Default to Microsoft if no prefix or prefix not found
            return ("Microsoft", "");
        }
    }
}
