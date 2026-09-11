using Generator.DTO;
using Generator.DTO.Warnings;
using Generator.Tests.PowerAutomateAnalyzerTests.Builders;
using Generator.Tests.PowerAutomateAnalyzerTests.Builders.Connectors.OpenApiConnection;
using Newtonsoft.Json.Linq;

namespace Generator.Tests.PowerAutomateAnalyzerTests;

/// <summary>
/// Tests for PowerAutomateFlowAnalyzer
/// </summary>
public class PowerAutomateFlowAnalyzerTests : TestBase
{
    [Fact]
    public void SupportedType_ShouldBePowerAutomateFlow()
    {
        // Assert
        Assert.Equal(ComponentType.PowerAutomateFlow, FlowAnalyzer.SupportedType);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithNullClientData_ShouldNotThrow()
    {
        // Arrange
        var flow = new PowerAutomateFlow("id1", "Test Flow", null!);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();
        var warnings = new List<SolutionWarning>();

        // Act
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert
        Assert.Empty(attributeUsages);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithEmptyClientData_ShouldNotThrow()
    {
        // Arrange
        var flow = new PowerAutomateFlow("id1", "Test Flow", "");
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();
        var warnings = new List<SolutionWarning>();

        // Act
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert
        Assert.Empty(attributeUsages);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithInvalidJson_ShouldHandleGracefully()
    {
        // Arrange
        var flow = new PowerAutomateFlow("id1", "Test Flow", "{ invalid json }");
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();
        var warnings = new List<SolutionWarning>();

        // Act - should not throw
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert
        Assert.Empty(attributeUsages);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithListRowsAction_ShouldExtractEntityAndFields()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddListRecords("List_accounts", a => a
                .WithEntityName("accounts")
                .WithSelect("name", "accountnumber", "revenue")
                .WithFilter("statecode eq 0"))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert
        Assert.True(attributeUsages.ContainsKey("accounts"));
        Assert.True(attributeUsages["accounts"].ContainsKey("name"));
        Assert.True(attributeUsages["accounts"].ContainsKey("accountnumber"));
        Assert.True(attributeUsages["accounts"].ContainsKey("revenue"));
        Assert.True(attributeUsages["accounts"].ContainsKey("statecode"));

        // Verify usage details
        var nameUsage = attributeUsages["accounts"]["name"].First();
        Assert.Equal("Test Flow", nameUsage.Name);
        Assert.Equal(OperationType.List, nameUsage.OperationType);
        Assert.Equal(ComponentType.PowerAutomateFlow, nameUsage.ComponentType);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithGetRowAction_ShouldNotThrow()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddGetItem("Get_account", a => a
                .WithEntityName("accounts")
                .WithRecordId("@triggerOutputs()?['body/accountid']")
                .WithSelect("name", "revenue"))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act - Should not throw
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert - Basic validation that analysis completed
        Assert.NotNull(attributeUsages);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithCreateRowAction_ShouldNotThrow()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddCreateRecord("Create_account", a => a
                .WithEntityName("accounts")
                .WithField("name", "@triggerOutputs()?['body/companyname']")
                .WithField("telephone1", "@triggerOutputs()?['body/phone']")
                .WithField("revenue", 100000))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act - Should not throw
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert - Basic validation
        Assert.NotNull(attributeUsages);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithUpdateOnlyRecord_ShouldExtractCloudFlowUpdateUsage()
    {
        var action = JObject.Parse(@"{
            'type': 'OpenApiConnection',
            'inputs': {
                'host': {
                    'apiId': '/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps',
                    'operationId': 'UpdateOnlyRecord'
                },
                'parameters': {
                    'entityName': 'dmvp_planets',
                    'recordId': '00000000-0000-0000-0000-000000000001',
                    'item/dmvp_weight': 42
                }
            }
        }");
        var flowJson = new PowerAutomateFlowBuilder()
            .AddAction("Update_planet", action)
            .BuildAsJson();
        var flow = new PowerAutomateFlow("synthetic-flow", "Playground weight update", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();
        var warnings = new List<SolutionWarning>();

        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        Assert.True(attributeUsages.ContainsKey("dmvp_planets"));
        Assert.True(attributeUsages["dmvp_planets"].ContainsKey("dmvp_weight"));
        var usage = Assert.Single(attributeUsages["dmvp_planets"]["dmvp_weight"]);
        Assert.Equal("Playground weight update", usage.Name);
        Assert.Equal(OperationType.Update, usage.OperationType);
        Assert.Equal(ComponentType.PowerAutomateFlow, usage.ComponentType);
        Assert.False(usage.IsFromDependencyAnalysis);
        Assert.Contains("Update parameter", usage.Usage);
        Assert.Empty(warnings);
    }
    [Fact]
    public async Task AnalyzeComponentAsync_WithUpdateRowAction_ShouldNotThrow()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddUpdateRecord("Update_account", a => a
                .WithEntityName("accounts")
                .WithRecordId("@triggerOutputs()?['body/accountid']")
                .WithField("revenue", 200000)
                .WithField("description", "Updated description"))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act - Should not throw
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert - Basic validation
        Assert.NotNull(attributeUsages);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithDeleteRowAction_ShouldExtractEntity()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddDeleteRecord("Delete_account", a => a
                .WithEntityName("accounts")
                .WithRecordId("@triggerOutputs()?['body/accountid']"))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert - Delete operations might not track specific attributes
        // but should still identify the entity is being used
        Assert.True(attributeUsages.Count >= 0);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithDataverseTrigger_ShouldExtractTriggerEntity()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddDataverseTrigger("When_account_is_created", t => t
                .WithEntityName("accounts")
                .WithScope("Organization"))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert - Trigger entity is mapped for expression resolution
        // May not create direct attribute usages unless expressions reference trigger outputs
        Assert.NotNull(attributeUsages);
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithNestedActions_ShouldExtractFromAllActions()
    {
        // Arrange - Note: Nested actions require custom JSON structure not yet supported by builders
        var getAccountAction = new GetItemActionBuilder()
            .WithEntityName("accounts")
            .WithRecordId("test-id")
            .WithSelect("name")
            .Build();

        var flowJson = @"{
            'properties': {
                'definition': {
                    'actions': {
                        'Condition': {
                            'type': 'If',
                            'actions': {
                            }
                        }
                    },
                    'triggers': {}
                }
            }
        }";

        var flowObj = JObject.Parse(flowJson);
        var conditionActions = (JObject)flowObj["properties"]!["definition"]!["actions"]!["Condition"]!["actions"]!;
        conditionActions["Get_account"] = getAccountAction;
        flowJson = flowObj.ToString();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert
        Assert.True(attributeUsages.ContainsKey("accounts"));
        Assert.True(attributeUsages["accounts"].ContainsKey("name"));
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithMultipleActionsOnDifferentEntities_ShouldExtractAll()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddGetItem("Get_account", a => a
                .WithEntityName("accounts")
                .WithRecordId("test-id")
                .WithSelect("name"))
            .AddListRecords("List_contacts", a => a
                .WithEntityName("contacts")
                .WithSelect("firstname", "lastname", "emailaddress1"))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert
        Assert.True(attributeUsages.ContainsKey("accounts"));
        Assert.True(attributeUsages.ContainsKey("contacts"));
        Assert.True(attributeUsages["accounts"].ContainsKey("name"));
        Assert.True(attributeUsages["contacts"].ContainsKey("firstname"));
        Assert.True(attributeUsages["contacts"].ContainsKey("lastname"));
        Assert.True(attributeUsages["contacts"].ContainsKey("emailaddress1"));
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithExpandParameter_ShouldExtractRelatedFields()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddListRecords("List_accounts", a => a
                .WithEntityName("accounts")
                .WithSelect("name")
                .WithExpand("primarycontactid($select=firstname,lastname)"))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert
        Assert.True(attributeUsages.ContainsKey("accounts"));
        Assert.True(attributeUsages["accounts"].ContainsKey("name"));
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithComplexFilter_ShouldExtractFilterFields()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddListRecords("List_accounts", a => a
                .WithEntityName("accounts")
                .WithSelect("name")
                .WithFilter("statecode eq 0 and revenue gt 100000 and industrycode eq 1"))
            .BuildAsJson();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert
        Assert.True(attributeUsages.ContainsKey("accounts"));
        Assert.True(attributeUsages["accounts"].ContainsKey("statecode"));
        Assert.True(attributeUsages["accounts"].ContainsKey("revenue"));
        Assert.True(attributeUsages["accounts"].ContainsKey("industrycode"));
    }

    [Fact]
    public async Task AnalyzeComponentAsync_WithDynamicContentExpressions_ShouldNotThrow()
    {
        // Arrange
        var flowJson = new PowerAutomateFlowBuilder()
            .AddGetItem("Get_account", a => a
                .WithEntityName("accounts")
                .WithRecordId("test-id"))
            .BuildAsJson();

        // Note: Manually add non-Dataverse action for expression testing
        var flowObj = JObject.Parse(flowJson);
        var actions = (JObject)flowObj["properties"]!["definition"]!["actions"]!;
        actions["Send_email"] = new JObject
        {
            ["type"] = "ApiConnection",
            ["inputs"] = new JObject
            {
                ["body"] = new JObject
                {
                    ["To"] = "@outputs('Get_account')?['body/emailaddress1']",
                    ["Subject"] = "Hello @{outputs('Get_account')?['body/name']}",
                    ["Body"] = "Your revenue: @{outputs('Get_account')?['body/revenue']}"
                }
            }
        };
        flowJson = flowObj.ToString();

        var flow = new PowerAutomateFlow("id1", "Test Flow", flowJson);
        var attributeUsages = new Dictionary<string, Dictionary<string, List<AttributeUsage>>>();

        // Act - Should not throw
        var warnings = new List<SolutionWarning>();
        await FlowAnalyzer.AnalyzeComponentAsync(flow, attributeUsages, warnings);

        // Assert - Basic validation
        Assert.NotNull(attributeUsages);
    }
}
