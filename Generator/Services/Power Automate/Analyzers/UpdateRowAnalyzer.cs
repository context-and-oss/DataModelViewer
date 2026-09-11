using Generator.DTO;
using Generator.Services.PowerAutomate.Models;
using Newtonsoft.Json.Linq;

namespace Generator.Services.PowerAutomate.Analyzers;

/// <summary>
/// Analyzer for Update Row / Update Record operations
/// </summary>
public class UpdateRowAnalyzer : DataverseActionAnalyzerBase
{
    public override IEnumerable<string> SupportedOperationIds => new[]
    {
        "UpdateRow", "UpdateRecord", "UpdateOnlyRecord", "UpdateItem", "PatchItem"
    };

    public override ActionAnalysisResult Analyze(JToken action, string actionName)
    {
        var result = new ActionAnalysisResult { ActionName = actionName };
        var entityName = ExtractEntityName(action);

        if (string.IsNullOrEmpty(entityName))
            return result;

        result.EntityName = entityName;
        result.OperationType = OperationType.Update;

        // Extract fields from the item being updated
        var item = action.SelectToken("inputs.parameters.item") ?? action.SelectToken("inputs.item");
        if (item is JObject itemObj)
        {
            foreach (var prop in itemObj.Properties())
            {
                if (IsLikelyFieldName(prop.Name))
                {
                    result.AddFieldUsage(prop.Name, "Update item property");
                }
            }
        }

        // Also check for item/ prefixed parameters (alternative format)
        var parameters = action.SelectToken("inputs.parameters");
        if (parameters is JObject paramsObj)
        {
            foreach (var prop in paramsObj.Properties())
            {
                if (prop.Name.StartsWith("item/"))
                {
                    var fieldName = prop.Name.Substring("item/".Length);
                    result.AddFieldUsage(fieldName, "Update parameter");
                }
            }
        }

        return result;
    }
}
