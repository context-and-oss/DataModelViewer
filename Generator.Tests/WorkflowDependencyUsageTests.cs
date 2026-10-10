using Generator.DTO;
using Generator.Services;

namespace Generator.Tests;

public class WorkflowDependencyUsageTests
{
    [Theory]
    [InlineData(0, "Workflow", ComponentType.ClassicWorkflow)]
    [InlineData(1, "Dialog", ComponentType.ClassicWorkflow)]
    [InlineData(2, "Business Rule", ComponentType.BusinessRule)]
    [InlineData(3, "Action", ComponentType.ClassicWorkflow)]
    [InlineData(4, "Business Process Flow", ComponentType.ClassicWorkflow)]
    [InlineData(5, "Power Automate Flow", ComponentType.PowerAutomateFlow)]
    [InlineData(99, "Workflow", ComponentType.ClassicWorkflow)]
    public void DependencyUsagePreservesWorkflowCategory(int category, string label, ComponentType componentType)
    {
        var workflow = new WorkflowInfo(Guid.NewGuid(), "Playground process", category, 1);

        var usage = workflow.ToAttributeUsage();

        Assert.Equal("Playground process", usage.Name);
        Assert.Equal(label, usage.Usage);
        Assert.Equal(componentType, usage.ComponentType);
        Assert.Equal(OperationType.Other, usage.OperationType);
        Assert.True(usage.IsFromDependencyAnalysis);
    }
}
