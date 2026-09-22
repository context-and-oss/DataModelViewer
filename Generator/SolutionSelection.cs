namespace Generator;

internal static class SolutionSelection
{
    public static string[] Parse(string? value)
    {
        var names = (value ?? string.Empty)
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (names.Length == 0)
        {
            throw new InvalidOperationException(
                "DataverseSolutionNames must contain at least one solution unique name (not its display name).");
        }

        return names;
    }

    public static void ValidateMatches(IEnumerable<string> requestedNames, IEnumerable<string> matchedNames)
    {
        var missing = requestedNames.Except(matchedNames, StringComparer.OrdinalIgnoreCase).ToArray();
        if (missing.Length > 0)
        {
            throw new InvalidOperationException(
                $"DataverseSolutionNames contains solutions not found in the configured Dataverse environment: {string.Join(", ", missing)}. " +
                "Use solution unique names, not display names. Metadata generation has been stopped.");
        }
    }
}
