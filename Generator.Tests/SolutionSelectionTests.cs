using Generator.DTO;
using Generator.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace Generator.Tests;

public class SolutionSelectionTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" \t\r\n ")]
    [InlineData(", ,,,\t")]
    public async Task EmptySelectionIsRejectedBeforeDataverseAccess(string? value)
    {
        var config = Configuration(value);
        var service = new SolutionService(null!, config, NullLogger<SolutionService>.Instance);

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetSolutionIds());

        Assert.Contains("DataverseSolutionNames", error.Message);
        Assert.Contains("at least one solution unique name", error.Message);
    }

    [Fact]
    public void SelectionTrimsAndDeduplicatesNamesIgnoringCase()
    {
        Assert.Equal(new[] { "Example", "Other" }, SolutionSelection.Parse(" Example, ,example, Other,EXAMPLE,"));
    }

    [Theory]
    [InlineData("Typo", "Example", "Typo")]
    [InlineData("Example,Typo", "Example", "Typo")]
    [InlineData("First,Second", "", "First, Second")]
    public void MissingSolutionsStopGenerationEvenWhenOtherNamesMatch(string requested, string matched, string missing)
    {
        var error = Assert.Throws<InvalidOperationException>(() =>
            SolutionSelection.ValidateMatches(SolutionSelection.Parse(requested), matched.Split(',')));

        Assert.Contains(missing, error.Message);
        Assert.Contains("unique names, not display names", error.Message);
    }

    [Fact]
    public void MatchingIsCaseInsensitiveAndIndependentOfResultOrder()
    {
        SolutionSelection.ValidateMatches(new[] { "Example", "Other" }, new[] { "OTHER", "example" });
    }

    [Fact]
    public void GeneratedCountUsesDistinctNonemptySolutionNames()
    {
        var output = Path.Combine(Path.GetTempPath(), "dmv-solutions-" + Guid.NewGuid());
        try
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DataverseSolutionNames"] = " Example,example,, Other, ",
                ["OutputFolder"] = output
            }).Build();
            new WebsiteBuilder(config, [], [], new Dictionary<string, GlobalOptionSetUsage>()).AddData();

            Assert.Contains("export const SolutionCount: number = 2;", File.ReadAllText(Path.Combine(output, "Data.ts")));
        }
        finally
        {
            if (Directory.Exists(output)) Directory.Delete(output, recursive: true);
        }
    }

    private static IConfiguration Configuration(string? value) => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { ["DataverseSolutionNames"] = value })
        .Build();
}
