using Generator.DTO;
using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Generator.Services
{
    /// <summary>
    /// Service responsible for querying workflow details
    /// </summary>
    internal class WorkflowService
    {
        private readonly ServiceClient client;

        public WorkflowService(ServiceClient client)
        {
            this.client = client;
        }

        /// <summary>
        /// Retrieves workflow details for specified workflow IDs
        /// </summary>
        /// <param name="workflowIds">List of workflow IDs to query</param>
        /// <returns>Dictionary mapping workflow ID to WorkflowInfo</returns>
        public async Task<Dictionary<Guid, WorkflowInfo>> GetWorkflows(List<Guid> workflowIds)
        {
            if (workflowIds.Count == 0)
                return [];

            var query = new QueryExpression("workflow")
            {
                ColumnSet = new ColumnSet("workflowid", "name", "category", "type"),
                Criteria = new FilterExpression(LogicalOperator.And)
                {
                    Conditions =
                    {
                        new ConditionExpression("workflowid", ConditionOperator.In, workflowIds)
                    }
                }
            };

            var results = await client.RetrieveAllAsync(query);

            return results.ToDictionary(
                e => e.Id,
                e => new WorkflowInfo(
                    e.Id,
                    e.GetAttributeValue<string>("name"),
                    e.GetAttributeValue<OptionSetValue>("category").Value,
                    e.GetAttributeValue<OptionSetValue>("type").Value
                )
            );
        }
    }

    /// <summary>
    /// Represents workflow information
    /// </summary>
    /// <param name="WorkflowId">Unique identifier of the workflow</param>
    /// <param name="Name">Display name of the workflow</param>
    /// <param name="Category">Workflow category (2 = Business Rule, 0 = Workflow, etc.)</param>
    /// <param name="Type">Workflow type (1 = Definition, 2 = Activation, etc.)</param>
    public record WorkflowInfo(
        Guid WorkflowId,
        string Name,
        int Category,
        int Type
    )
    {
        public AttributeUsage ToAttributeUsage()
        {
            // Dataverse category 1 is Dialog; category 5 is Modern Flow.
            // https://learn.microsoft.com/en-us/power-automate/manage-flows-with-code
            var (usage, componentType) = Category switch
            {
                1 => ("Dialog", ComponentType.ClassicWorkflow),
                2 => ("Business Rule", ComponentType.BusinessRule),
                3 => ("Action", ComponentType.ClassicWorkflow),
                4 => ("Business Process Flow", ComponentType.ClassicWorkflow),
                5 => ("Power Automate Flow", ComponentType.PowerAutomateFlow),
                _ => ("Workflow", ComponentType.ClassicWorkflow)
            };

            return new AttributeUsage(Name, usage, OperationType.Other, componentType,
                IsFromDependencyAnalysis: true);
        }
    }
}
