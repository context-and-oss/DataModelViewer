using Azure.Core;
using Azure.Identity;
using Generator;
using Generator.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.PowerPlatform.Dataverse.Client;

var configuration =
    new ConfigurationBuilder()
    .AddEnvironmentVariables()
    .AddJsonFile("appsettings.local.json", optional: true)
    .Build();
var verbose = configuration.GetValue("Verbosity", LogLevel.Warning);

// Reject an empty selection before creating a Dataverse client or requesting credentials.
SolutionSelection.Parse(configuration["DataverseSolutionNames"]);

// Set up dependency injection
var services = new ServiceCollection();

// Add logging
services.AddLogging(builder =>
{
    builder
        .SetMinimumLevel(verbose)
        .AddConsole();
});

// Add configuration as a singleton
services.AddSingleton<IConfiguration>(configuration);

// Add ServiceClient as a singleton
services.AddSingleton(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var loggerFactory = sp.GetRequiredService<ILoggerFactory>();
    var logger = loggerFactory.CreateLogger("ServiceClient");
    var cache = new MemoryCache(new MemoryCacheOptions());

    var dataverseUrl = config["DataverseUrl"];
    if (dataverseUrl == null)
    {
        throw new Exception("DataverseUrl is required");
    }

    return new ServiceClient(
        instanceUrl: new Uri(dataverseUrl),
        tokenProviderFunction: async url => await GetTokenAsync(url, cache, logger, config));
});

// Register services
services.AddSingleton<EntityMetadataService>();
services.AddSingleton<SolutionService>();
services.AddSingleton<SecurityRoleService>();
services.AddSingleton<EntityIconService>();
services.AddSingleton<AttributeMappingService>();
services.AddSingleton<RelationshipService>();
services.AddSingleton<RecordMappingService>();
services.AddSingleton<DataverseService>();
services.AddSingleton<WorkflowService>();
services.AddSingleton<SolutionComponentService>();
services.AddSingleton<SolutionComponentExtractor>();

// Build service provider
var serviceProvider = services.BuildServiceProvider();

// Resolve and use DataverseService
var dataverseService = serviceProvider.GetRequiredService<DataverseService>();
var (entities, warnings, solutionComponents, globalOptionSetUsages) = await dataverseService.GetFilteredMetadata();

var websiteBuilder = new WebsiteBuilder(configuration, entities, warnings, globalOptionSetUsages, solutionComponents);
websiteBuilder.AddData();

// Token provider function
static async Task<string> GetTokenAsync(string dataverseUrl, IMemoryCache cache, ILogger logger, IConfiguration configuration)
{
    var cacheKey = $"AccessToken_{dataverseUrl}";

    logger.LogTrace($"Attempting to retrieve access token for {dataverseUrl}");

    return (await cache.GetOrCreateAsync(cacheKey, async cacheEntry =>
    {
        cacheEntry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(50);
        var credential = GetTokenCredential(logger, configuration);
        var scope = BuildScopeString(dataverseUrl);

        return await FetchAccessToken(credential, scope, logger);
    }))!.Token;
}

static TokenCredential GetTokenCredential(ILogger logger, IConfiguration configuration)
{
    if (configuration["DataverseClientId"] != null && configuration["DataverseClientSecret"] != null)
        return new ClientSecretCredential(configuration["TenantId"], configuration["DataverseClientId"], configuration["DataverseClientSecret"]);

    return new DefaultAzureCredential();  // in azure this will be managed identity, locally this depends... se midway of this post for the how local identity is chosen: https://dreamingincrm.com/2021/11/16/connecting-to-dataverse-from-function-app-using-managed-identity/
}

static string BuildScopeString(string dataverseUrl)
{
    return $"{GetCoreUrl(dataverseUrl)}/.default";
}

static string GetCoreUrl(string url)
{
    var uri = new Uri(url);
    return $"{uri.Scheme}://{uri.Host}";
}

static async Task<AccessToken> FetchAccessToken(TokenCredential credential, string scope, ILogger logger)
{
    var tokenRequestContext = new TokenRequestContext(new[] { scope });

    try
    {
        logger.LogTrace("Requesting access token...");
        var accessToken = await credential.GetTokenAsync(tokenRequestContext, CancellationToken.None);
        logger.LogTrace("Access token successfully retrieved.");
        return accessToken;
    }
    catch (Exception ex)
    {
        logger.LogError($"Failed to retrieve access token: {ex.Message}");
        throw;
    }
}

