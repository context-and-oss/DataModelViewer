<p align="center">
  <img src="https://raw.githubusercontent.com/delegateas/DataModelViewer/main/Website/public/DMVLOGO.svg" alt="logo" width="120" />
</p>

<p align="center">
  <a href="https://www.buymeacoffee.com/VishwaGauravIn" target="_blank">
    <img alt="" src="https://skillicons.dev/icons?i=ts,html,css,react,tailwind,cs,nextjs" />
  </a>
</p>

> [!NOTE]
> The README is slowly being moved to [Git Wiki](https://github.com/delegateas/DataModelViewer/wiki). Newer features are documented in the wiki whilst older ones are documented in this Readme.

# 👋 Introduction

<p className="text-gray-700 mb-4">
  <strong>Data Model Viewer</strong> is your centralized tool for exploring and understanding your Dataverse metadata. Designed with clarity and efficiency in mind, it gives you a single, streamlined access point to view and navigate your data tables.
</p>

<img width="1917" height="920" alt="image" src="https://github.com/user-attachments/assets/6be34fb3-09a9-4aad-b250-8f150897efd2" />

The documentation follows this structure:

- **[Installation of the tool](#installation-of-the-tool)**
  - [Settings (ADO variables)](#settings-ado-variables)
  - [Configuration of pipeline](#configuration-of-pipeline)
    - [Notes](#notes)
  - [After deployment](#after-deployment)
- **[Optional features](#optional-features)**
  - [Table grouping](#table-grouping)
  - [ADO page embedding](#ado-page-embedding)
- **[Running the tool locally (optional)](#running-the-tool-locally-optional)**
  - [Setup Generator](#setup-generator)
  - [Setup Website](#setup-website)
  - [Running it](#running-it)


---

# Installation of the tool

The `azure-pipelines-external.yml` file is a reusable Azure DevOps pipeline template designed to simplify building and deploying DataModelViewer from other Azure DevOps projects. This allows you to integrate DataModelViewer deployment into your own pipelines with minimal setup.

## Settings (ADO variables)
The pipeline expects a variable group called `DataModel`. It must have the following variables. The app user only requires the `Environment Maker` security role.

* AzureClientId: Client id for an Azure App Registration with access to the Dataverse Environment.
* AzureClientSecret: Client Secret for the above. Remember to set its variable type to "Secret"! 
* AzureTenantId: Azure Tenant ID (where your App Regustration is placed and resource group will be placed).
* AzureServiceConnectionName: Name of the Azure Resource Manager service connection created from ADO to Azure.
* AzureLocation: Name of the location for the resource group in Azure (e.g. "westeurope" - not the display name which is "West Europe").
* AzureResourceGroupName: Name of the Resource Group in Azure. If this matches an existing group in the location above that will be used for the DMV resources, if not a new resource group will be created.
* DataverseUrl: URL for the Dataverse environment which the data model will be based on (e.g. "https://mySystem-dev.crm4.dynamics.com/").
* DataverseSolutionNames: Required comma-separated list of solution unique names (not display names). Whitespace, empty entries between commas, and duplicate names are ignored. Generation stops if no names remain or any requested solution cannot be found in the configured Dataverse environment.
* WebsiteName: Used for the url of the web app presenting the data model to the user. The full URL will be in the format "https://wa-{WebsiteName}.azurewebsites.net/" and must be globally unique. 
* WebsitePassword: Password used by DMV users to login to the generated site.
* WebsiteSessionSecret: Key to encrypt the session token with (You can set it to whatever you like, but recommended 32 random characters).
* (Optional) TableGroups: Enter a semi-colon separated list of group names and for each group a comma-separated list of table schema names within that group. Then this configuration will be used to order the tables in groups in the DMV side-menu. Example: `Org. tables: team, systemuser, businessunit; Sales: opportunity, lead`
* (Optional) AdoWikiName: Name of your wiki found under "Overview -> Wiki" in ADO. (will be encoded so dont worry about space)
* (Optional) AdoWikiPagePath: Path to the introduction page you wish to show in DMV. (will also be encoded so dont worry about spaces)
* (Optional) WebResourceNameFunc: Function to fetch the entity logicalname from a webresource. The function must be a valid C# LINQ expression that works on the `name` input parameter. Default: `np(name.Split('/').LastOrDefault()).Split('.').Reverse().Skip(1).FirstOrDefault()`
* (Optional) AdoRepositoryName: Name of the existing repo to store diagrams. A folder will be created called `diagrams` first time being used.

## Configuration of pipeline
Once you have created the variable group mentioned in the previous section, next steps will be to configure the pipeline.

1. **Copy Required Files**  
   Copy the following files from this repository into your Azure DevOps project repository:
   - `azure-pipelines-build-jobs.yml`
   - `azure-pipelines-deploy-jobs.yml`
   - `azure-pipelines-external.yml`

2. **Configure the Pipeline**  
   - Add a new "Azure Repos Git" pipeline in Azure DevOps and choose the `azure-pipelines-external.yml` file from your repository as the "Existing Azure Pipelines YAML file" to base the pipeline on.
   - Adjust the parameters in the YAML file as needed for your environment (usually only if you chose another name for the variable group than "Datamodel").

> [!NOTE]
> YAML file contains two properties you may want to change:
> 1. Name of your ADO wiki repository
> 2. Name of your variable group

3. **Pipeline Execution**  
   - The first time the pipeline is run you will see a "This pipeline needs permission to access a resource..." click "View" and give it permission to access the variable group you have created.
   - The pipeline will clone the public DataModelViewer repository, build the application, and deploy it using the shared templates.
   - The pipeline is scheduled to run daily at 03:00 AM by default. You can adjust or remove the schedule as needed. You can of course also run the pipeline ad-hoc if you wish.

4. **Possible Additional Steps**
   - The Build Service needs at least READ-access to the repo (check at: Project Settings > Repositories > 'wiki-repo' > Security)
     - In the same location also add the pipeline to the "Pipeline permissions" (this will stop any permission prompts on pipeline runs)

### Notes

- The used Azure subscription must have "Microsoft.Web" registered as a "Resource provider" (namespace) otherwise the deploy will fail.
- The external pipeline expects the same variable group and variables as described in the "Setting in pipeline" section.
- You can further customize the pipeline by editing the YAML files as needed for your organization's requirements.
- For more details, see the comments at the top of `azure-pipelines-external.yml`.

## After deployment
* Go to portal.azure.com 
* Find the App Service under your specified resource group and open it
* Go to "Settings" -> "Configuration" and set the Startup Command to ``node server.js``
![image](https://github.com/user-attachments/assets/0d7a3511-ffa2-4013-b403-7da10b49e817)
* Go back to Overview and click Browse


---

# Optional features

## Table grouping
To create a group for a subset of tables, you must simply add a "#" at the start of your table description. See below:

> [!NOTE]
> Some tables do not have descriptions - e.g. Team.
> For these tables use the Environment variable `TableGroups`.
> Alternatively use only the env. variable.

<img width="638" height="481" alt="image" src="https://github.com/user-attachments/assets/0b95e0a3-9710-464d-ac6c-205f14ddf0c2" />

## ADO page embedding
In 2.2.0 you can integrate with ADO to save/load diagrams. The 2.2.0 pipelines automatically creates a Managed Identity (MI) to the web service, so configuration is minimal to enable this integration.

1. Go to your Azure Dev Ops `Organization Settings > Users`.
2. Click `Add users` and search for `wa-<<WebsiteName>>` where `<<WebsiteName>>` is the environment variable you use for the website name.
3. Select the principle-user/MI from the search result, give `Basic` access level, add to correct ADO project, and UNTICK the `send email invites`.
4. Navigate to your ADO project.
5. Inside `Project Settings > Permissions > Users (at the top) > (Click on the MI) > Member of > Add > (e.g. Constributor)` (The MI should have at least read/write to your DataModelViewer repo)

> Note: Constributor gives additional unnecessary permissions. We suggest a least priviledges role.

---

# Running the tool locally (optional)

## Setup Generator
Add `Generator/appsettings.local.json` as a file and paste your environment and solutions. Remember that the solutions must have the same publisher prefix.

```
{
  "DataverseUrl": "https://xxx.crm4.dynamics.com",
  "DataverseSolutionNames": "solutionuniquename,othersolution"
}
```

Remember to set the file to Copy If Newer

Authentication is handled using `DefaultAzureCredential`. If you are using Visual Studio you can select a user that is used for all of these credentials. Go to Tools -> Options -> Search for Azure -> Account Selection. Login and select a user that has access to that Dataverse Environment.
 
## Setup Website
Add `Website/.env` file to run this locally.

```
{
    WebsitePassword=YourPassword
    WebsiteSessionSecret=YourSecret
}
```

`WebsitePassword` is the login password for the site. Set it to what you want end users to input.

`WebsiteSessionSecret` is a key used to encrypt the session cookie. Generate one with openssl, found in Git Bash or as a download on the web.

```
openssl rand -base64 32
```

## Running it
Generate data by running the Generator project from Visual Studio. 
Afterwards go into the "Website"-folder from VS Code and open the terminal (of the "Command Prompt" type). If this the first time running it, type `npm install` (you need to have installed node.js first: https://nodejs.org/en/download/). Start the website on localhost by running `npm run dev`. Click the link in the terminal to view the website.

To use a different local port, run `npm run dev -- --port 3017`. Login redirects use the request origin unless `AUTH_URL` or `NEXTAUTH_URL` overrides it (`AUTH_URL` takes precedence). If a redirect points to an old host or port, check these environment settings and restart the website after changing them.

When hosting behind a reverse proxy or using a custom domain, set `AUTH_URL` to the public website origin, including its scheme and any non-default port. Do not use the internal application server address or rely on forwarded host headers alone. The supplied Azure infrastructure sets `NEXTAUTH_URL` to the generated App Service HTTPS address; update the auth URL setting when using a different public domain.
