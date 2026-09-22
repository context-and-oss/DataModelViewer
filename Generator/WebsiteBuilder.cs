using Generator.DTO;
using Generator.DTO.Warnings;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Text;

namespace Generator;

internal class WebsiteBuilder
{
    private readonly IConfiguration configuration;
    private readonly IEnumerable<Record> records;
    private readonly IEnumerable<SolutionWarning> warnings;
    private readonly IEnumerable<SolutionComponentCollection> solutionComponents;
    private readonly Dictionary<string, GlobalOptionSetUsage> globalOptionSetUsages;
    private readonly string OutputFolder;

    public WebsiteBuilder(
        IConfiguration configuration,
        IEnumerable<Record> records,
        IEnumerable<SolutionWarning> warnings,
        Dictionary<string, GlobalOptionSetUsage> globalOptionSetUsages,
        IEnumerable<SolutionComponentCollection>? solutionComponents = null)
    {
        this.configuration = configuration;
        this.records = records;
        this.warnings = warnings;
        this.solutionComponents = solutionComponents ?? Enumerable.Empty<SolutionComponentCollection>();
        this.globalOptionSetUsages = globalOptionSetUsages;

        // Assuming execution in bin/xxx/net8.0
        OutputFolder = configuration["OutputFolder"] ?? Path.Combine(System.Reflection.Assembly.GetExecutingAssembly().Location, "../../../../../Website/generated");
        Directory.CreateDirectory(OutputFolder);
    }
    internal void AddData()
    {
        var sb = new StringBuilder();
        sb.AppendLine("import { GroupType, SolutionWarningType, SolutionComponentCollectionType } from \"@/lib/Types\";");
        sb.AppendLine("");
        sb.AppendLine($"export const LastSynched: Date = new Date('{DateTimeOffset.UtcNow:yyyy-MM-ddTHH:mm:ss.fffZ}');");
        var logoUrl = configuration.GetValue<string?>("Logo", defaultValue: null);
        var jsValue = logoUrl != null ? $"\"{logoUrl}\"" : "null";
        sb.AppendLine($"export const Logo: string | null = {jsValue};");
        sb.AppendLine($"export const SolutionCount: number = {SolutionSelection.Parse(configuration["DataverseSolutionNames"]).Length};");
        sb.AppendLine("");

        // ENTITIES
        sb.AppendLine("export let Groups: GroupType[] = [");
        var groups = records.GroupBy(x => x.Group).OrderBy(x => x.Key);
        foreach (var group in groups)
        {
            var groupName = group.Key ?? "Ungrouped";

            sb.AppendLine("  {");
            sb.AppendLine($"    \"Name\":\"{groupName}\",");

            sb.AppendLine("    \"Entities\":[");
            foreach (var entity in group.OrderBy(x => x.DisplayName))
            {
                sb.AppendLine($"      {JsonConvert.SerializeObject(entity)},");
            }
            sb.AppendLine("    ]");
            sb.AppendLine("  },");
        }

        sb.AppendLine("] as const;");

        // WARNINGS
        sb.AppendLine("");
        sb.AppendLine("export let SolutionWarnings: SolutionWarningType[] = [");
        foreach (var warning in warnings)
        {
            sb.AppendLine($"  {JsonConvert.SerializeObject(warning)},");
        }
        sb.AppendLine("] as const;");

        // SOLUTION COMPONENTS (for insights)
        sb.AppendLine("");
        sb.AppendLine("export let SolutionComponents: SolutionComponentCollectionType[] = [");
        foreach (var collection in solutionComponents)
        {
            sb.AppendLine($"  {JsonConvert.SerializeObject(collection)},");
        }
        sb.AppendLine("] as const;");

        // GLOBAL OPTION SETS
        sb.AppendLine("");
        sb.AppendLine("export const GlobalOptionSets: Record<string, { Name: string; DisplayName: string; Usages: { EntitySchemaName: string; EntityDisplayName: string; AttributeSchemaName: string; AttributeDisplayName: string }[] }> = {");
        foreach (var (key, usage) in globalOptionSetUsages)
        {
            sb.AppendLine($"  \"{key}\": {JsonConvert.SerializeObject(usage)},");
        }
        sb.AppendLine("};");

        File.WriteAllText(Path.Combine(OutputFolder, "Data.ts"), sb.ToString());
    }
}
