# Dependency updates and nightly deployments

The supplied external Azure pipeline runs daily and clones the default branch. A merge can therefore be deployed before a GitHub release is created. A release label is not a deployment gate for these consumers.

## Protect an existing installation

Before adopting a dependency batch, pin the DataModelViewer checkout in the consumer's own pipeline to a reviewed full commit SHA. Use the same SHA in both Build and Deploy, since each stage currently performs its own clone. Keep the previous successful application artifact and its source SHA for rollback. Continue generating fresh metadata from that pinned application revision on the usual schedule.

For example, after each existing clone step:

```sh
git -C "$(Build.SourcesDirectory)" checkout --detach "$(DataModelViewerCommit)"
```

Set `DataModelViewerCommit` to a full reviewed commit SHA in the consumer pipeline. Do not set it to a moving branch. Validate this pipeline change in a nonproduction environment first. Changes to the copied templates in this repository do not automatically update existing consumer pipelines.

The build template uses `npm ci` so the checked-in lockfile determines installed dependency versions. Existing copies using `npm install` should adopt that change. Retain the lockfile in the checkout.

## Review and validation

- Separate compatible utility updates from authentication, framework, native image-processing, and SDK changes. A version number alone does not prove compatibility.
- Review both manifest and lockfile changes, including removed optional peer dependencies.
- Require the aggregate `ci` check: generator build/tests and website clean install, lint, and production build. The Node matrix covers the versions currently used by the build template, local development, and hosting template; it is compatibility coverage, not a recommendation to retain older runtimes indefinitely.
- Test the packaged standalone application with synthetic metadata: password login, rejected login, logout, metadata/search, relationships, diagrams, and image/static assets.
- For authentication/SDK updates, additionally validate Entra ID sign-in, allowed/denied groups, logout, and any wiki or Dataverse integration affected by the change in an authorized nonproduction environment.
- Promote a tested SHA to one canary installation, observe a complete scheduled refresh/deploy cycle, then explicitly advance other pinned installations. Roll back to the previous artifact/SHA if checks fail.

Keep automatic merging disabled until this process has demonstrated reliable coverage. Dependency updates do not require a matching application major/minor version bump; choose the application release type based on its user-visible compatibility.
