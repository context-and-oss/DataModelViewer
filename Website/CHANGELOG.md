## [2.3.7] - 2026-09-23

### Bug Fixes

* fix(website): finish loading on repeated table navigation ([7b0ddb6](https://github.com/context-and-oss/DataModelViewer/commit/7b0ddb6))

## [2.3.6] - 2026-09-15

### Bug Fixes

* fix(website): use columns consistently in UI text ([932862e](https://github.com/context-and-oss/DataModelViewer/commit/932862e))


## [2.3.5] - 2026-06-05

### Other Changes

* changed actions so they are not blocked by branch protection. You must now label PR for release ([7edf131](https://github.com/delegateas/DataModelViewer/commit/7edf131))


No commits found or error getting commits
## [2.3.4] - 2026-04-20

### Changed
- Manual release


## [2.3.1] - 2026-01-13

### Features

* Merge pull request #80 from delegateas/features/globalsearch-changes ([28e6bad](https://github.com/delegateas/DataModelViewer/commit/28e6bad))
* homepage news ([1b40315](https://github.com/delegateas/DataModelViewer/commit/1b40315))
* query params ([ac62371](https://github.com/delegateas/DataModelViewer/commit/ac62371))
* moved security scope search to a multi-select dropdown. ([cb5ab17](https://github.com/delegateas/DataModelViewer/commit/cb5ab17))
* auto open tab and scroll to new relationship search result type ([32058e2](https://github.com/delegateas/DataModelViewer/commit/32058e2))
* Merge remote-tracking branch 'origin/main' into features/globalsearch-changes ([958ddc7](https://github.com/delegateas/DataModelViewer/commit/958ddc7))
* Merge branch 'main' into features/globalsearch-changes ([89137e7](https://github.com/delegateas/DataModelViewer/commit/89137e7))
* search scopes for global search ([e0397fe](https://github.com/delegateas/DataModelViewer/commit/e0397fe))

### Bug Fixes

* minor adjustment and fixes to search scroll and resultorder ([e08b03b](https://github.com/delegateas/DataModelViewer/commit/e08b03b))
* stop some of the unnessecary stale search request ([46d088e](https://github.com/delegateas/DataModelViewer/commit/46d088e))

### Other Changes

* better icons for toggle buttons ([12574ce](https://github.com/delegateas/DataModelViewer/commit/12574ce))


## [2.3.0] - 2025-12-20

### Features

* security headers: 1. X-DNS-Prefetch-Control: on Purpose: Controls DNS prefetching for external resources Protection: Allows the browser to proactively resolve domain names in the background, improving performance while still being safe when set to "on" 2. Strict-Transport-Security: max-age=63072000; includeSubDomains; preload Purpose: Forces browsers to only connect via HTTPS Protection: Prevents man-in-the-middle attacks by ensuring all communication is encrypted Details: max-age=63072000 = 2 years includeSubDomains = applies to all subdomains too preload = allows inclusion in browser HSTS preload lists 3. X-Frame-Options: SAMEORIGIN Purpose: Controls whether your site can be embedded in iframes Protection: Prevents clickjacking attacks where attackers embed your site in a malicious iframe Details: SAMEORIGIN allows framing only from your own domain 4. X-Content-Type-Options: nosniff Purpose: Prevents browsers from MIME-type sniffing Protection: Stops browsers from interpreting files as a different MIME type than declared (e.g., executing a text file as JavaScript) Result: Reduces XSS attack surface 5. X-XSS-Protection: 1; mode=block Purpose: Enables browser's built-in XSS filter Protection: Blocks pages when cross-site scripting attacks are detected Note: Legacy header (modern browsers use CSP instead), but provides defense-in-depth for older browsers 6. Referrer-Policy: strict-origin-when-cross-origin Purpose: Controls what referrer information is sent with requests Protection: Prevents leaking sensitive information in URLs Details: Sends full URL for same-origin requests, only origin for cross-origin HTTPS requests, nothing for HTTP downgrades 7. Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=() Purpose: Controls which browser features and APIs can be used Protection: Disables unnecessary permissions that could be exploited Details: camera=() = no camera access microphone=() = no microphone access geolocation=() = no location tracking interest-cohort=() = disables FLoC tracking (privacy protection) 8. Content-Security-Policy (CSP) This is the most important and complex header. Let me break down each directive: default-src 'self' Default policy: only allow resources from your own domain script-src 'self' 'unsafe-eval' 'unsafe-inline' Scripts: Allow from your domain 'unsafe-eval': Allows eval() - needed for Next.js development/runtime 'unsafe-inline': Allows inline <script> tags - needed for Next.js style-src 'self' 'unsafe-inline' Styles: Allow from your domain and inline styles (needed for React/Next.js) img-src 'self' data: https: Images: Allow from your domain, data URIs (base64 images), and any HTTPS source font-src 'self' data: Fonts: Allow from your domain and data URIs connect-src 'self' API calls/WebSockets: Only allow connections to your own domain frame-ancestors 'self' Embedding: Similar to X-Frame-Options, only allow your own domain to frame your site base-uri 'self' Base tag: Prevent injection of <base> tags that could redirect relative URLs form-action 'self' Form submissions: Only allow forms to submit to your own domain ([68efb5a](https://github.com/delegateas/DataModelViewer/commit/68efb5a))
* rate limit and brute force password protection. ([6eef484](https://github.com/delegateas/DataModelViewer/commit/6eef484))
* carousel item for home page. ([4a60b3e](https://github.com/delegateas/DataModelViewer/commit/4a60b3e))
* Entra security group required authentication ([ec1f11b](https://github.com/delegateas/DataModelViewer/commit/ec1f11b))
* UI indication for slower Entra login ([373a46d](https://github.com/delegateas/DataModelViewer/commit/373a46d))
* use normal grant flow instead of baked in, in the app service. ([226faae](https://github.com/delegateas/DataModelViewer/commit/226faae))
* EntraID authentication ([c2994db](https://github.com/delegateas/DataModelViewer/commit/c2994db))

### Bug Fixes

* changed boolean to string variables in pipelines, as boolean kept breaking in odd ways. ([4c11593](https://github.com/delegateas/DataModelViewer/commit/4c11593))
* coalsace other optional params ([5ebfa31](https://github.com/delegateas/DataModelViewer/commit/5ebfa31))
* coalesce the booleans in pipeline ([4a29b83](https://github.com/delegateas/DataModelViewer/commit/4a29b83))
* Revert "Revert "fix: correct filtered relationship count shown on tab."" ([0fbb482](https://github.com/delegateas/DataModelViewer/commit/0fbb482))
* npm package version bump to remove critial and high vulnerabilities. ([e77783a](https://github.com/delegateas/DataModelViewer/commit/e77783a))
* swapped to correct env variables in auth config and pipelines ([e3721e3](https://github.com/delegateas/DataModelViewer/commit/e3721e3))
* clear Entra cookies and session on logout, like with password authentication ([88d4035](https://github.com/delegateas/DataModelViewer/commit/88d4035))
* save session when logged in with entra ([930a4c7](https://github.com/delegateas/DataModelViewer/commit/930a4c7))
* Revert "fix: correct filtered relationship count shown on tab." ([80dee42](https://github.com/delegateas/DataModelViewer/commit/80dee42))
* always redirect to loign ([275c2d0](https://github.com/delegateas/DataModelViewer/commit/275c2d0))

### Other Changes

* changed naming in pipelines for less confusion ([bb78a32](https://github.com/delegateas/DataModelViewer/commit/bb78a32))
* readme update ([f21be88](https://github.com/delegateas/DataModelViewer/commit/f21be88))
* carousel images also move with the text on home page. ([6facf7b](https://github.com/delegateas/DataModelViewer/commit/6facf7b))
* Revert "Revert "chore: eslint error fixes"" ([3481c24](https://github.com/delegateas/DataModelViewer/commit/3481c24))
* Revert "chore: eslint error fixes" ([a1f56ac](https://github.com/delegateas/DataModelViewer/commit/a1f56ac))
* Microsoft icon for AD login ([f6b7bbb](https://github.com/delegateas/DataModelViewer/commit/f6b7bbb))
* can remove server serialization. Not used clientside ([759d4d5](https://github.com/delegateas/DataModelViewer/commit/759d4d5))
* removed old unused files from root folder ([e417de3](https://github.com/delegateas/DataModelViewer/commit/e417de3))


## [2.2.8] - 2025-12-04

### Features

* removed new markers on sidebar ([8914e33](https://github.com/delegateas/DataModelViewer/commit/8914e33))
* rewamp of the process view. ([ba9dc1f](https://github.com/delegateas/DataModelViewer/commit/ba9dc1f))

### Bug Fixes

* use sdkmessage operationtype for plugin types isntead of just using other. ([e6c7840](https://github.com/delegateas/DataModelViewer/commit/e6c7840))
* correct filtered relationship count shown on tab. ([6b327d1](https://github.com/delegateas/DataModelViewer/commit/6b327d1))

### UI/UX Improvements

* replaced UI facing attribute and entity mentions on insights page with column and tables instead. ([190929d](https://github.com/delegateas/DataModelViewer/commit/190929d))

### Other Changes

* eslint error fixes ([e490b20](https://github.com/delegateas/DataModelViewer/commit/e490b20))
* hide base if show standard not set ([5f77ead](https://github.com/delegateas/DataModelViewer/commit/5f77ead))
* tooltip adjustments for primary column icon. ([a76c613](https://github.com/delegateas/DataModelViewer/commit/a76c613))
* tooltip adjustments ([094ba99](https://github.com/delegateas/DataModelViewer/commit/094ba99))


## [2.2.7] - 2025-11-29

### Bug Fixes

* fix the N:N relationship visualisation, and hide relationships with entities outside solution by standard ([dbfd599](https://github.com/delegateas/DataModelViewer/commit/dbfd599))


## [2.2.6] - 2025-11-27

### Features

* additional activity standard attribute metadata filters ([48e0d48](https://github.com/delegateas/DataModelViewer/commit/48e0d48))
* homepage update and navigation "new" markers ([42a1c5f](https://github.com/delegateas/DataModelViewer/commit/42a1c5f))
* added workflows and business rules to the process view. And fixed the circle size in the card component. ([e3d231a](https://github.com/delegateas/DataModelViewer/commit/e3d231a))
* more relationship logic showing N:1, 1:N correctly. And also using chips that are disabled for targets not in solution ([76b35f0](https://github.com/delegateas/DataModelViewer/commit/76b35f0))
* refactored the MUI matrix into Nivo heatmap ([45d2e83](https://github.com/delegateas/DataModelViewer/commit/45d2e83))
* Added solution information to components and swapped chord chart for an interactive matrix. ([d87a276](https://github.com/delegateas/DataModelViewer/commit/d87a276))
* info texts on graphs in insights ([4f5c326](https://github.com/delegateas/DataModelViewer/commit/4f5c326))
* workflow dependencies from microsoft retrieved in generator. Flag for implicit/explicit components. ([f8d6b8a](https://github.com/delegateas/DataModelViewer/commit/f8d6b8a))
* new generator logic to show inclusion type and visually the same as the make portal ([9492036](https://github.com/delegateas/DataModelViewer/commit/9492036))

### Bug Fixes

* heatmap missing from lock ([02bc756](https://github.com/delegateas/DataModelViewer/commit/02bc756))
* global search disabled pointer events on the table search ([a1d7de2](https://github.com/delegateas/DataModelViewer/commit/a1d7de2))
* build errors ([b969d09](https://github.com/delegateas/DataModelViewer/commit/b969d09))
* unnessecary attribute filters, extension method to fet userlocalized label and exceptions checks for relationships. ([c7a38e9](https://github.com/delegateas/DataModelViewer/commit/c7a38e9))
* Argument exception when no plural name exists for entity ([4142117](https://github.com/delegateas/DataModelViewer/commit/4142117))
* solutiontype in generated data is not the same data in grouptype. Removed the SolutionType and keeping data inside groups. This will break chord chart. ([b951ea4](https://github.com/delegateas/DataModelViewer/commit/b951ea4))
* workflow dependencies incorrectly found ([ae61b86](https://github.com/delegateas/DataModelViewer/commit/ae61b86))

### Code Refactoring

* cleanup in tool scripts and fixed WR description script issue (needed PublishAot=false to construct serviceclient) ([a81323e](https://github.com/delegateas/DataModelViewer/commit/a81323e))
* refactored dataverseservice into smaller services ([698f250](https://github.com/delegateas/DataModelViewer/commit/698f250))

### Other Changes

* Update README.md ([d1aafd9](https://github.com/delegateas/DataModelViewer/commit/d1aafd9))
* missing nivo/heatmap from dependencies ([0d957ff](https://github.com/delegateas/DataModelViewer/commit/0d957ff))
* minor graph adjustments ([77ea09f](https://github.com/delegateas/DataModelViewer/commit/77ea09f))
* TS type changes ([8207554](https://github.com/delegateas/DataModelViewer/commit/8207554))
* adjustments to search box on metadata ([7772903](https://github.com/delegateas/DataModelViewer/commit/7772903))
* tooltips on header buttons ([1d5bfd0](https://github.com/delegateas/DataModelViewer/commit/1d5bfd0))
* hotfix: missing enum value in Types.ts ([522c0e8](https://github.com/delegateas/DataModelViewer/commit/522c0e8))


## [2.2.5] - 2025-11-15

### Features

* Merge pull request #74 from delegateas/features/analyzer-work ([91831d3](https://github.com/delegateas/DataModelViewer/commit/91831d3))
* plot for publishers on the insights page ([f7e36b3](https://github.com/delegateas/DataModelViewer/commit/f7e36b3))
* .NET 10 C# script to read Delegate XrmFramework and XrmBedrock webresource folder structures and analyse more consistently for correct entity schemanames. Enforcment of this new method by deprecation of old method. ([90d0baa](https://github.com/delegateas/DataModelViewer/commit/90d0baa))
* support multiple publishers ([bce76ae](https://github.com/delegateas/DataModelViewer/commit/bce76ae))
* Power Automate analyzer recreation, from Thyge's ExpressionEngine and PA MockUp repos. ([b91c6ec](https://github.com/delegateas/DataModelViewer/commit/b91c6ec))

### Bug Fixes

* moved .NET 10 script to sharedporject to not bug out the entire repo :D ([a969a3b](https://github.com/delegateas/DataModelViewer/commit/a969a3b))
* multiline and xrmquery initial linebreak fixes in regex ([7e97da9](https://github.com/delegateas/DataModelViewer/commit/7e97da9))
* include solutions that just contain flows. ([885132f](https://github.com/delegateas/DataModelViewer/commit/885132f))

### Code Refactoring

* minor refactor of analyzers. ([c7762ea](https://github.com/delegateas/DataModelViewer/commit/c7762ea))
* moved pipelines into Setup Folder to cleanup root git directory ([6302dc0](https://github.com/delegateas/DataModelViewer/commit/6302dc0))

### Other Changes

* fixing tests just 1 left to fix ([f90da97](https://github.com/delegateas/DataModelViewer/commit/f90da97))
* old console job instead of .NET 10 script (serviceclient not yet supported) ([0bbb56c](https://github.com/delegateas/DataModelViewer/commit/0bbb56c))
* gitignore update ([aa373da](https://github.com/delegateas/DataModelViewer/commit/aa373da))
* initial tests for Generator ([2db1b20](https://github.com/delegateas/DataModelViewer/commit/2db1b20))
* gitignore update ([166eb45](https://github.com/delegateas/DataModelViewer/commit/166eb45))


## [2.2.4] - 2025-11-10

### Features

* Added fallback to schema name if there are no labels available ([c2cee2d](https://github.com/delegateas/DataModelViewer/commit/c2cee2d))

### Bug Fixes

* close api endpoints other than login and version ([ebc5f0e](https://github.com/delegateas/DataModelViewer/commit/ebc5f0e))

### UI/UX Improvements

* some styling guidelines ([172fe02](https://github.com/delegateas/DataModelViewer/commit/172fe02))

### Other Changes

* small hook ([9309426](https://github.com/delegateas/DataModelViewer/commit/9309426))
* claude: initial .md files and settings files ([91acbc0](https://github.com/delegateas/DataModelViewer/commit/91acbc0))


## [2.2.3] - 2025-11-06

### Features

* show warning if column audit is enabled, but disabled for table ([3d01192](https://github.com/delegateas/DataModelViewer/commit/3d01192))
* primary name and id details and more padding on home page. ([ec917c2](https://github.com/delegateas/DataModelViewer/commit/ec917c2))
* reduce padding for security model and header ([332a33e](https://github.com/delegateas/DataModelViewer/commit/332a33e))

### Performance Improvements

* catch changes to state and status more frequent. Still not perfect but catches most cases ([7f6cfda](https://github.com/delegateas/DataModelViewer/commit/7f6cfda))

### Other Changes

* better tooltips for security roles ([a03f024](https://github.com/delegateas/DataModelViewer/commit/a03f024))


## [2.2.2] - 2025-11-05

### Features

* additional changes to entityFiltering in global search ([730fb4d](https://github.com/delegateas/DataModelViewer/commit/730fb4d))
* scroll to search result attribute instead of entity section ([783478b](https://github.com/delegateas/DataModelViewer/commit/783478b))

### Bug Fixes

* callbacks to get correct displayed attribute and relationship counts. Also fixed that global search only shows results from displayed attributes. And deleted unused context. ([b30cf31](https://github.com/delegateas/DataModelViewer/commit/b30cf31))
* NODE upgrade ([1a923af](https://github.com/delegateas/DataModelViewer/commit/1a923af))
* cleanup and fix to the scrolladjustments tanstack performs on dynamic height changes ([bbfa6fe](https://github.com/delegateas/DataModelViewer/commit/bbfa6fe))
* remove navigation option menu when focusing searchfield ([45d89b6](https://github.com/delegateas/DataModelViewer/commit/45d89b6))
* index changing when searching ([6cedd78](https://github.com/delegateas/DataModelViewer/commit/6cedd78))

### UI/UX Improvements

* tooltip for show/hide standard uses MUI and is dynamic ([de60c96](https://github.com/delegateas/DataModelViewer/commit/de60c96))

### Other Changes

* ESLint fixes ([f13163d](https://github.com/delegateas/DataModelViewer/commit/f13163d))
* show Status inside Choice type filter ([c34e912](https://github.com/delegateas/DataModelViewer/commit/c34e912))
* fraction in search results ([8e56a59](https://github.com/delegateas/DataModelViewer/commit/8e56a59))


## [2.2.1] - 2025-11-01

### UI/UX Improvements

* tooltip overridden style for better visibility ([ea127be](https://github.com/delegateas/DataModelViewer/commit/ea127be))

### Other Changes

* eslint ([95b1206](https://github.com/delegateas/DataModelViewer/commit/95b1206))
* close helper menu for global search on clear, and disable menu buttons when unvailable ([26b8184](https://github.com/delegateas/DataModelViewer/commit/26b8184))
* better tooltip for process usages. ([92e68a2](https://github.com/delegateas/DataModelViewer/commit/92e68a2))
* disable diagram on mobile ([06b9ff8](https://github.com/delegateas/DataModelViewer/commit/06b9ff8))
* hide navigation for mobile if empty. ([ae53892](https://github.com/delegateas/DataModelViewer/commit/ae53892))
* more control in metadata sidebar. Auto collapsing on group changes and allowance to collapse current group. ([e7f25b8](https://github.com/delegateas/DataModelViewer/commit/e7f25b8))


## [2.2.0] - 2025-10-27

### Features

* Merge pull request #68 from delegateas/features/diagram-2.0.0-patches ([837823f](https://github.com/delegateas/DataModelViewer/commit/837823f))
* customizable labels for links. ([b2486cb](https://github.com/delegateas/DataModelViewer/commit/b2486cb))
* complete removal of links and restoration of them. ([fc2c6d3](https://github.com/delegateas/DataModelViewer/commit/fc2c6d3))
* export diagram to png. ([a52a957](https://github.com/delegateas/DataModelViewer/commit/a52a957))
* control the exclude/include of relationships between entities. See new relations to loaded diagrams. ([0a44fb2](https://github.com/delegateas/DataModelViewer/commit/0a44fb2))
* show multiple relationships between entities in relationship link ([55b7713](https://github.com/delegateas/DataModelViewer/commit/55b7713))
* selfreferencing relationship (minor bug where libavoid likes to move the out port down) ([4fcbef6](https://github.com/delegateas/DataModelViewer/commit/4fcbef6))
* 1-M M-1 indications on relationships. Click to see relationshipproperties. Minor UI adjustments. ([28c2ead](https://github.com/delegateas/DataModelViewer/commit/28c2ead))
* initial libavoid router reimplementation with external worker thread. Also custom defined relationshiplink for future logic ([3c8e3ae](https://github.com/delegateas/DataModelViewer/commit/3c8e3ae))
* Selection properties and first simple gridlayout for entity selection ([4ab492a](https://github.com/delegateas/DataModelViewer/commit/4ab492a))
* remove entity in properties pane ([c7a14b7](https://github.com/delegateas/DataModelViewer/commit/c7a14b7))
* Multiple entity selection and entity properties pane ([f289d7a](https://github.com/delegateas/DataModelViewer/commit/f289d7a))
* selection via paper embeddings and custom class for it ([7f99864](https://github.com/delegateas/DataModelViewer/commit/7f99864))
* selection and multi selection of entities ([96b2d55](https://github.com/delegateas/DataModelViewer/commit/96b2d55))
* rightclick entity event to open contextmenu. ([c1e19a4](https://github.com/delegateas/DataModelViewer/commit/c1e19a4))
* insert new entities in the center of the canvas ([cb1c72e](https://github.com/delegateas/DataModelViewer/commit/cb1c72e))
* peak older version of loaded diagram ([8d11897](https://github.com/delegateas/DataModelViewer/commit/8d11897))
* diagramname textfield & graph state loading (zoom, pan etc) ([bfea9e1](https://github.com/delegateas/DataModelViewer/commit/bfea9e1))
* local development using PAT and readme on it ([8db109d](https://github.com/delegateas/DataModelViewer/commit/8db109d))
* update badges and frontpage news ([d08407b](https://github.com/delegateas/DataModelViewer/commit/d08407b))
* implementation of list and rename of some functions ([a1db5c4](https://github.com/delegateas/DataModelViewer/commit/a1db5c4))
* lock cloud buttons if not configured ([ed749ea](https://github.com/delegateas/DataModelViewer/commit/ed749ea))
* load and save functionality, also download locally to device introduced ([9e3e5dc](https://github.com/delegateas/DataModelViewer/commit/9e3e5dc))
* Diagram header toolbar with actions. Initial attempt at creating documents in ADO. Also a waiting modal. ([299e93d](https://github.com/delegateas/DataModelViewer/commit/299e93d))
* inital attempt at managed identity authentication for digram saving in ADO Repo. ESLINT errors ([c742207](https://github.com/delegateas/DataModelViewer/commit/c742207))
* initial attempt at managed identity setup for save/load of diagram directly to ADO Repository. ([eef0c8c](https://github.com/delegateas/DataModelViewer/commit/eef0c8c))
* add entity functionality & darktheme pane ([1616db1](https://github.com/delegateas/DataModelViewer/commit/1616db1))
* simple canvas movement. zoom, pan and scroll ([6f03fb2](https://github.com/delegateas/DataModelViewer/commit/6f03fb2))

### Bug Fixes

* removed text to show file metadata from load modal. (not available without N requests.) ([cd12214](https://github.com/delegateas/DataModelViewer/commit/cd12214))
* close sidepane if object is null. ([1bc5583](https://github.com/delegateas/DataModelViewer/commit/1bc5583))
* load diagram fixes to looks and data states. ([feb4efb](https://github.com/delegateas/DataModelViewer/commit/feb4efb))
* selection transoformation fixed to be relative to the paper transformation matrix ([bcf1f8a](https://github.com/delegateas/DataModelViewer/commit/bcf1f8a))
* disable entities already in the diagram when inserting from panes ([88322ec](https://github.com/delegateas/DataModelViewer/commit/88322ec))
* minor bug where old selections would be interactive in second selection ([b5e5946](https://github.com/delegateas/DataModelViewer/commit/b5e5946))
* inconsistent envvariable naming. ([743964d](https://github.com/delegateas/DataModelViewer/commit/743964d))
* replaced some queryparams for the load ([55f555e](https://github.com/delegateas/DataModelViewer/commit/55f555e))
* build error fix ([cc74108](https://github.com/delegateas/DataModelViewer/commit/cc74108))
* removed SCM_DO_BUILD_DURING_DEPLOYMENT flag from bicep webservice ([03a5ebc](https://github.com/delegateas/DataModelViewer/commit/03a5ebc))
* build error in deploy step caused by node_modules folder zipping twice. ([423bd9f](https://github.com/delegateas/DataModelViewer/commit/423bd9f))

### Code Refactoring

* refactor relationship logic to seperate file ([bee1324](https://github.com/delegateas/DataModelViewer/commit/bee1324))
* refactored the group/entity accordion to seperate element and reused for the entity picker pane ([1ac3881](https://github.com/delegateas/DataModelViewer/commit/1ac3881))

### Other Changes

* removed branch selection in external pipeline ([1347997](https://github.com/delegateas/DataModelViewer/commit/1347997))
* ESLint & README ([40055ff](https://github.com/delegateas/DataModelViewer/commit/40055ff))
* small disclaimer warning ([eb1e6cb](https://github.com/delegateas/DataModelViewer/commit/eb1e6cb))
* es lint error fixes ([5b811a2](https://github.com/delegateas/DataModelViewer/commit/5b811a2))
* about update ([8d98e7a](https://github.com/delegateas/DataModelViewer/commit/8d98e7a))
* adjustments to the load modal (azure call moved to seperated step) ([bcb0c4f](https://github.com/delegateas/DataModelViewer/commit/bcb0c4f))
* diagram information in the sidebar ([9bb197b](https://github.com/delegateas/DataModelViewer/commit/9bb197b))
* eslint... ([fdd689a](https://github.com/delegateas/DataModelViewer/commit/fdd689a))
* lint failures ([70612d3](https://github.com/delegateas/DataModelViewer/commit/70612d3))
* disabled gutter for layout ([efcac09](https://github.com/delegateas/DataModelViewer/commit/efcac09))
* old diagram deprication ([4989cf6](https://github.com/delegateas/DataModelViewer/commit/4989cf6))


## [2.1.1] - 2025-10-13

### Features

* Merge pull request #67 from delegateas/features/insights-patch-01 ([fb98ecc](https://github.com/delegateas/DataModelViewer/commit/fb98ecc))
* additional pie charts with feature and attribute distributions ([690ae86](https://github.com/delegateas/DataModelViewer/commit/690ae86))

### Bug Fixes

* dont skip labels for small pie bits ([25cfc26](https://github.com/delegateas/DataModelViewer/commit/25cfc26))

### Other Changes

* removed unnes memo dependency ([9b1aff8](https://github.com/delegateas/DataModelViewer/commit/9b1aff8))
* removed textwrap from infocard ([ed96a67](https://github.com/delegateas/DataModelViewer/commit/ed96a67))


## [2.1.0] - 2025-10-04

### Features

* Merge pull request #66 from delegateas/features/insights-page ([0836827](https://github.com/delegateas/DataModelViewer/commit/0836827))
* insights overview page with alerts, and highlight numbers ([33b5cf7](https://github.com/delegateas/DataModelViewer/commit/33b5cf7))
* News post for insights page ([e69bb0f](https://github.com/delegateas/DataModelViewer/commit/e69bb0f))
* Chord diagram to show solution relations ([1914be8](https://github.com/delegateas/DataModelViewer/commit/1914be8))
* frontend preperations for solutions ([8251d81](https://github.com/delegateas/DataModelViewer/commit/8251d81))

### Bug Fixes

* builderror ([9b4afaa](https://github.com/delegateas/DataModelViewer/commit/9b4afaa))
* removed horz scroll overflow on the list component ([0b3289f](https://github.com/delegateas/DataModelViewer/commit/0b3289f))
* security improvement. Redirect to login for ended sessions for all routes ([d353ac8](https://github.com/delegateas/DataModelViewer/commit/d353ac8))

### Other Changes

* description change on solution insight ([968c795](https://github.com/delegateas/DataModelViewer/commit/968c795))
* ESLint fixes and touchups ([b3d9d14](https://github.com/delegateas/DataModelViewer/commit/b3d9d14))


## [2.0.7] - 2025-10-02

### Bug Fixes

* retry scrolls to ensure unmounted sizes are not estimated ([8a2f269](https://github.com/delegateas/DataModelViewer/commit/8a2f269))


## [2.0.6] - 2025-09-28

### Features

* show spinner for when click relationship or lookup ([5c8ba70](https://github.com/delegateas/DataModelViewer/commit/5c8ba70))
* navigation to processes from metadata ([732235c](https://github.com/delegateas/DataModelViewer/commit/732235c))
* removed new flags on navigation for home and processes ([1ea712c](https://github.com/delegateas/DataModelViewer/commit/1ea712c))
* removed new badge and spin animation for settings ([4666d95](https://github.com/delegateas/DataModelViewer/commit/4666d95))
* removed inconsistent smooth scrolling and added spinner on section loading ([d94ece5](https://github.com/delegateas/DataModelViewer/commit/d94ece5))

### Bug Fixes

* dont only show custom M-M, but all if both entities are in the solution. ([a34141e](https://github.com/delegateas/DataModelViewer/commit/a34141e))
* login autocomplete webkit browser styling replaced with MUI colors ([8a768e1](https://github.com/delegateas/DataModelViewer/commit/8a768e1))
* fix default height on homepage and removed ado page error when no page is found ([b6969c7](https://github.com/delegateas/DataModelViewer/commit/b6969c7))
* changed single-select to be radio buttons instead of checkboxes ([c1e352d](https://github.com/delegateas/DataModelViewer/commit/c1e352d))
* removed large logo and used typo instead ([447defb](https://github.com/delegateas/DataModelViewer/commit/447defb))

### Other Changes

* ESLint errors ([05bbc5d](https://github.com/delegateas/DataModelViewer/commit/05bbc5d))
* removed old tab control code. It works if you have the section in view. ([3c67d99](https://github.com/delegateas/DataModelViewer/commit/3c67d99))
* removed next error by checking wiki location first ([f663e65](https://github.com/delegateas/DataModelViewer/commit/f663e65))
* changed alignment of icon and removed large gap between table name and schemaname ([98707d9](https://github.com/delegateas/DataModelViewer/commit/98707d9))


## [2.0.5] - 2025-09-25

### Bug Fixes

* Merge pull request #64 from delegateas/patches/search-bugs ([fa4bac8](https://github.com/delegateas/DataModelViewer/commit/fa4bac8))
* clear menuitem in search info menu ([cdde88a](https://github.com/delegateas/DataModelViewer/commit/cdde88a))
* restore correct location on clear ([10848df](https://github.com/delegateas/DataModelViewer/commit/10848df))
* tablesearch not working after previous version ([7fe1c44](https://github.com/delegateas/DataModelViewer/commit/7fe1c44))
* scroll to wrong section ([579e707](https://github.com/delegateas/DataModelViewer/commit/579e707))


## [2.0.4] - 2025-09-24

### Features

* move key events to become global. ([0bd6803](https://github.com/delegateas/DataModelViewer/commit/0bd6803))
* only show globally searched tables in the sidebar ([1c105ce](https://github.com/delegateas/DataModelViewer/commit/1c105ce))
* smooth scroll operation between section ([66b5c67](https://github.com/delegateas/DataModelViewer/commit/66b5c67))
* restore section location on search clear ([377b6d8](https://github.com/delegateas/DataModelViewer/commit/377b6d8))
* global search look change ([55eede1](https://github.com/delegateas/DataModelViewer/commit/55eede1))

### Bug Fixes

* section markers changing when scrolling list. ([bf92ee2](https://github.com/delegateas/DataModelViewer/commit/bf92ee2))
* stop infinite progress throbber in sidebar ([a9e0dbb](https://github.com/delegateas/DataModelViewer/commit/a9e0dbb))
* performance optimization and cleanup of AI slop in virtualization list ([5c06003](https://github.com/delegateas/DataModelViewer/commit/5c06003))
* restore last section when search is cleared ([c98a34b](https://github.com/delegateas/DataModelViewer/commit/c98a34b))

### Other Changes

* fixed ESLint errors ([af7e99f](https://github.com/delegateas/DataModelViewer/commit/af7e99f))
* small offset ([4855e2d](https://github.com/delegateas/DataModelViewer/commit/4855e2d))


## [2.0.3] - 2025-09-18

### Features

* deeplink to group and sections with snackbar response ([6a7f944](https://github.com/delegateas/DataModelViewer/commit/6a7f944))
* scroll to group functionality ([13175a9](https://github.com/delegateas/DataModelViewer/commit/13175a9))

### Bug Fixes

* stop infinite section spinner ([81e7781](https://github.com/delegateas/DataModelViewer/commit/81e7781))
* remake callback when group changes ([e3ad295](https://github.com/delegateas/DataModelViewer/commit/e3ad295))
* allow accordion in sidebar for datamodel to close ([e73e280](https://github.com/delegateas/DataModelViewer/commit/e73e280))
* simplyfication of postbuild ([fd660da](https://github.com/delegateas/DataModelViewer/commit/fd660da))

### Other Changes

* hotfix: found turbopack issue from next git ([8c4bead](https://github.com/delegateas/DataModelViewer/commit/8c4bead))
* hotfix: removed experimental outputFileTracingIncludes ([c917d2c](https://github.com/delegateas/DataModelViewer/commit/c917d2c))
* hotfix: attempt to fix breaking Next version update ([b7d7e71](https://github.com/delegateas/DataModelViewer/commit/b7d7e71))


## [2.0.2] - 2025-09-15

### Features

* added details icon for other process types to the metadata view ([7fee20f](https://github.com/delegateas/DataModelViewer/commit/7fee20f))
* next upgrade and getcontrol regex added to webresource analyzer ([71e8d58](https://github.com/delegateas/DataModelViewer/commit/71e8d58))

### Bug Fixes

* remove dynamic query analyzer from PA, too ambigous ([68786f3](https://github.com/delegateas/DataModelViewer/commit/68786f3))

### Other Changes

* changed default webresource func ([f40e46f](https://github.com/delegateas/DataModelViewer/commit/f40e46f))
* minor update to attribute usage mesage for WR and frontend tooltip ([435f558](https://github.com/delegateas/DataModelViewer/commit/435f558))


## [2.0.1] - 2025-09-14

### Features

* Merge pull request #60 from delegateas/features/webresource-analyzer ([b5ede2a](https://github.com/delegateas/DataModelViewer/commit/b5ede2a))
* updated the frontpage news ([6d01f40](https://github.com/delegateas/DataModelViewer/commit/6d01f40))
* statcard component and processes adjustments ([5daca50](https://github.com/delegateas/DataModelViewer/commit/5daca50))
* solution warnings and lambda expression for webresource entity name extraction ([5ee3e9c](https://github.com/delegateas/DataModelViewer/commit/5ee3e9c))
* example of how you would read webresource entityname from forms (does not work as many forms are implicitly added - hence doers have solutioncomponent) ([4b2556e](https://github.com/delegateas/DataModelViewer/commit/4b2556e))

### Other Changes

* Update Generator/Services/WebResources/WebResourceAnalyzer.cs ([0249963](https://github.com/delegateas/DataModelViewer/commit/0249963))
* linting error fixes and according for erroneous attributes ([e955b0d](https://github.com/delegateas/DataModelViewer/commit/e955b0d))
* ReadMe and AI-rules update ([51b85bb](https://github.com/delegateas/DataModelViewer/commit/51b85bb))
* attribute warnings on the processes page ([6dae72f](https://github.com/delegateas/DataModelViewer/commit/6dae72f))


## [2.0.0] - 2025-09-10

### Features

* Power Automate Analzyer ([b114b6e](https://github.com/delegateas/DataModelViewer/commit/b114b6e))
* new hightlight in navbar ([7d2117a](https://github.com/delegateas/DataModelViewer/commit/7d2117a))
* initial processes page with serachable information about procceses touching attributes. Also some lucide icons refactor to MUI ([ab501ba](https://github.com/delegateas/DataModelViewer/commit/ab501ba))
* inital process logic ([eccdb43](https://github.com/delegateas/DataModelViewer/commit/eccdb43))
* refactored Magnuses plugin logic for future process logic ([3647b19](https://github.com/delegateas/DataModelViewer/commit/3647b19))
* swaped the font to an online one, due to constant jitter... ([8b0b8a5](https://github.com/delegateas/DataModelViewer/commit/8b0b8a5))
* additional work on login screen, to allow dark mode settings change ([cb06a8c](https://github.com/delegateas/DataModelViewer/commit/cb06a8c))
* initial dark theme implementation ([7bbe528](https://github.com/delegateas/DataModelViewer/commit/7bbe528))
* Carousel component ([491c8a6](https://github.com/delegateas/DataModelViewer/commit/491c8a6))
* initial start on sidebar, header and layout components ([11c7ac5](https://github.com/delegateas/DataModelViewer/commit/11c7ac5))

### Bug Fixes

* package removals/upgrades and lint fixes ([26d0158](https://github.com/delegateas/DataModelViewer/commit/26d0158))
* truncate long groupname ([6b2e2d8](https://github.com/delegateas/DataModelViewer/commit/6b2e2d8))
* only search for attributes with usages ([aacea90](https://github.com/delegateas/DataModelViewer/commit/aacea90))
* show tooltip on nav links ([f8f8e66](https://github.com/delegateas/DataModelViewer/commit/f8f8e66))
* mobile size increased. Close sidebar when section is clicked ([4160c1e](https://github.com/delegateas/DataModelViewer/commit/4160c1e))
* removed overflow in sidebar ([489b5b4](https://github.com/delegateas/DataModelViewer/commit/489b5b4))
* debugging ([667332d](https://github.com/delegateas/DataModelViewer/commit/667332d))
* font preload to remove jitter ([1748e38](https://github.com/delegateas/DataModelViewer/commit/1748e38))
* initial redesign and work on metadata page. Sidebar changed to use correct styling and elements ([8565c8a](https://github.com/delegateas/DataModelViewer/commit/8565c8a))
* mobile sidebar and responsiveness on welcome message. Smooth transition and size adjustments ([38dd443](https://github.com/delegateas/DataModelViewer/commit/38dd443))
* changed authhook to context for faster performance. and Fixed redirect issues on logout ([3aee2e3](https://github.com/delegateas/DataModelViewer/commit/3aee2e3))
* scrolling broken on homepage ([977bd9d](https://github.com/delegateas/DataModelViewer/commit/977bd9d))
* last build errors ([1badd50](https://github.com/delegateas/DataModelViewer/commit/1badd50))
* fixed postcss issues with tailwind ([6c54283](https://github.com/delegateas/DataModelViewer/commit/6c54283))

### Performance Improvements

* performance changes to the sidebar for metadata and also the search bar style changes. ([0f7f1c5](https://github.com/delegateas/DataModelViewer/commit/0f7f1c5))

### UI/UX Improvements

* Merge pull request #59 from delegateas/patches/Context&Design ([f6fe22d](https://github.com/delegateas/DataModelViewer/commit/f6fe22d))
* uninstallation of lucide and refactor to MUI Icons ([5669fd5](https://github.com/delegateas/DataModelViewer/commit/5669fd5))
* chip style changes ([d2bd443](https://github.com/delegateas/DataModelViewer/commit/d2bd443))
* Global search style changing and not visible when settings are ([6a09ddd](https://github.com/delegateas/DataModelViewer/commit/6a09ddd))
* radix to mui migration. tailwind v3 to v4 migration. next-js v13 to v15 migration. lucide icons to mui icons migration ([54b9e6f](https://github.com/delegateas/DataModelViewer/commit/54b9e6f))

### Code Refactoring

* cleaning up the diagram view and ensuring it still works. No mayor changes, will be taken care of when diagram is the focus again ([0296062](https://github.com/delegateas/DataModelViewer/commit/0296062))

### Other Changes

* operationtype other, and final lint error ([9b04832](https://github.com/delegateas/DataModelViewer/commit/9b04832))
* more updates to homepage ([7987467](https://github.com/delegateas/DataModelViewer/commit/7987467))
* homepage change ([0840cc4](https://github.com/delegateas/DataModelViewer/commit/0840cc4))
* removed a-tag from section title ([81ea37e](https://github.com/delegateas/DataModelViewer/commit/81ea37e))
* mobile friendlyness for attributes table. npm audit fix to fix critical vulnerability ([6c7ec96](https://github.com/delegateas/DataModelViewer/commit/6c7ec96))
* About page updated for dark theme ([46a2138](https://github.com/delegateas/DataModelViewer/commit/46a2138))
* adjustments to sidebar and spinner for loading section. ([fcd7dee](https://github.com/delegateas/DataModelViewer/commit/fcd7dee))
* increased mobile feeling ([ff0ecc0](https://github.com/delegateas/DataModelViewer/commit/ff0ecc0))
* section darkmode support (headers, security roles, etc.) ([1bfe555](https://github.com/delegateas/DataModelViewer/commit/1bfe555))
* minor changes to sidebar for metadata view ([7868fbb](https://github.com/delegateas/DataModelViewer/commit/7868fbb))
* minro dark mode and settings pane settings ([00a4d99](https://github.com/delegateas/DataModelViewer/commit/00a4d99))
* slide animation out for carousel ([060a159](https://github.com/delegateas/DataModelViewer/commit/060a159))
* replaced notchbox with svg clip-path logic ([ee362bf](https://github.com/delegateas/DataModelViewer/commit/ee362bf))
* working notch Box ([82131d6](https://github.com/delegateas/DataModelViewer/commit/82131d6))
* removed hook and moved logic to context ([a726dc9](https://github.com/delegateas/DataModelViewer/commit/a726dc9))
* starting on the main layout components ([77b3389](https://github.com/delegateas/DataModelViewer/commit/77b3389))
* loading state and beautify login/loading ([312963c](https://github.com/delegateas/DataModelViewer/commit/312963c))
* login touches ([abab4cf](https://github.com/delegateas/DataModelViewer/commit/abab4cf))
* loginpage recreated ([2e429ad](https://github.com/delegateas/DataModelViewer/commit/2e429ad))
* initial instructions ([7401a63](https://github.com/delegateas/DataModelViewer/commit/7401a63))


## [1.4.1] - 2025-09-01

### Features

* added mapped path ([d6f34c7](https://github.com/delegateas/DataModelViewer/commit/d6f34c7))

### Other Changes

* updated stub introduction ([f25fb88](https://github.com/delegateas/DataModelViewer/commit/f25fb88))
* gitignore update, and moved attachment folder to public for easier image src reference ([41ebbb2](https://github.com/delegateas/DataModelViewer/commit/41ebbb2))
* handle no repository property in response ([305ebb0](https://github.com/delegateas/DataModelViewer/commit/305ebb0))
* missing get endpoint meant change from wiki to git endpoint ([bbbeea1](https://github.com/delegateas/DataModelViewer/commit/bbbeea1))
* initial attempt at downloading attachments ([ca2c030](https://github.com/delegateas/DataModelViewer/commit/ca2c030))
* hotfix: yaml creates file with wrong name ([ae5b54a](https://github.com/delegateas/DataModelViewer/commit/ae5b54a))


## [1.4.0] - 2025-08-27

### Features

* Merge pull request #55 from delegateas/features/home-page ([d4a3e51](https://github.com/delegateas/DataModelViewer/commit/d4a3e51))
* newlines in markdown not being newlines fixed ([bfe78b0](https://github.com/delegateas/DataModelViewer/commit/bfe78b0))
* added card to the wiki page ([170cb67](https://github.com/delegateas/DataModelViewer/commit/170cb67))
* updated README with new variables ([a3cfd87](https://github.com/delegateas/DataModelViewer/commit/a3cfd87))

### Bug Fixes

* introduced ESLint error ([d49a704](https://github.com/delegateas/DataModelViewer/commit/d49a704))
* fallback to stub ([4c0e9bc](https://github.com/delegateas/DataModelViewer/commit/4c0e9bc))

### Other Changes

* updated copystub script to include all files in stubs ([283d626](https://github.com/delegateas/DataModelViewer/commit/283d626))
* navbar changes ([5039239](https://github.com/delegateas/DataModelViewer/commit/5039239))
* installation of markdown parser ([944987f](https://github.com/delegateas/DataModelViewer/commit/944987f))
* Introduction stumb ([de30aee](https://github.com/delegateas/DataModelViewer/commit/de30aee))
* pipeline changes to copy wiki page into Website project ([dab220a](https://github.com/delegateas/DataModelViewer/commit/dab220a))
* inital homepage setup ([9a52836](https://github.com/delegateas/DataModelViewer/commit/9a52836))
* imports wrong ([f2b46ac](https://github.com/delegateas/DataModelViewer/commit/f2b46ac))
* folder renaming / reorder ([a104379](https://github.com/delegateas/DataModelViewer/commit/a104379))


## [1.3.6] - 2025-08-24

### Features

* added naivgation via url (query params avail are section, group, globalsearch) ([38b76af](https://github.com/delegateas/DataModelViewer/commit/38b76af))

### Bug Fixes

* build error ([3868cdf](https://github.com/delegateas/DataModelViewer/commit/3868cdf))
* moved initialocalvalue up ([c242f9e](https://github.com/delegateas/DataModelViewer/commit/c242f9e))
* ESLint ([24cca18](https://github.com/delegateas/DataModelViewer/commit/24cca18))

### Other Changes

* moved datamodel relevant files into folder for datamodel ([4001e1e](https://github.com/delegateas/DataModelViewer/commit/4001e1e))


## [1.3.5] - 2025-08-24

### Features

* selection changes. Multiple entity selection, adding and removing entities from selection via ctrl click. ([4ed27ae](https://github.com/delegateas/DataModelViewer/commit/4ed27ae))

### Bug Fixes

* ESLint errors ([0b90976](https://github.com/delegateas/DataModelViewer/commit/0b90976))
* allow multi selection of squares and texts as well ([413fb54](https://github.com/delegateas/DataModelViewer/commit/413fb54))
* correct scale delta for quare resize ([aad29d0](https://github.com/delegateas/DataModelViewer/commit/aad29d0))

### Other Changes

* warning regarding limitations ([af930e4](https://github.com/delegateas/DataModelViewer/commit/af930e4))
* removed help banner and action banner ([9b815de](https://github.com/delegateas/DataModelViewer/commit/9b815de))
* removed some console.logs fixed some styling issues with selection vs. hover ([a54e6c4](https://github.com/delegateas/DataModelViewer/commit/a54e6c4))


## [1.3.4] - 2025-08-16

### Features

* Add solution filtering and plugin type names to plugin step indicators ([e6dda88](https://github.com/delegateas/DataModelViewer/commit/e6dda88))
* Implement plugin step indicators for attributes ([22259f3](https://github.com/delegateas/DataModelViewer/commit/22259f3))

### Code Refactoring

* Refactor GetPluginStepAttributes to use entity logical names and streamline metadata mapping ([49ddc39](https://github.com/delegateas/DataModelViewer/commit/49ddc39))

### Other Changes

* Use object type codes from entity metadata instead of hardcoded list ([cc0d929](https://github.com/delegateas/DataModelViewer/commit/cc0d929))
* Initial plan ([f208144](https://github.com/delegateas/DataModelViewer/commit/f208144))


## [1.3.3] - 2025-08-16

### Bug Fixes

* handle state as choice instead of generic ([34d45b2](https://github.com/delegateas/DataModelViewer/commit/34d45b2))

### Other Changes

* hide keys when none exists ([9367b4e](https://github.com/delegateas/DataModelViewer/commit/9367b4e))
* show sync time in CEST/CET ([987133c](https://github.com/delegateas/DataModelViewer/commit/987133c))


## [1.3.2] - 2025-08-14

### Bug Fixes

* stop scrollposition change when changing tab ([9321fd7](https://github.com/delegateas/DataModelViewer/commit/9321fd7))
* search now includes all chunks, not just last ([7e6f8af](https://github.com/delegateas/DataModelViewer/commit/7e6f8af))

### Other Changes

* ESLINT ([802eb73](https://github.com/delegateas/DataModelViewer/commit/802eb73))


## [1.3.1] - 2025-08-12

### Features

* rewrote the searchworker to by typesafe. Added global search for more columns. ([ec699d7](https://github.com/delegateas/DataModelViewer/commit/ec699d7))
* local search for attributes, relationships and keys. With clear option and small indication for active globalsearch. Also small warning if both search options are being used. ([c5bb874](https://github.com/delegateas/DataModelViewer/commit/c5bb874))

### Bug Fixes

* ESLint lint errors ([4f92f9b](https://github.com/delegateas/DataModelViewer/commit/4f92f9b))
* dont search before 3 characters ([39b7b09](https://github.com/delegateas/DataModelViewer/commit/39b7b09))

### Other Changes

* PR change requests applied ([f117508](https://github.com/delegateas/DataModelViewer/commit/f117508))
* instead of skeletons, show "no attributes found..." ([c76483a](https://github.com/delegateas/DataModelViewer/commit/c76483a))
* scroll top when searching instead of jumping around randomly ([44867a3](https://github.com/delegateas/DataModelViewer/commit/44867a3))
* ESC clears searchfields ([f231d8e](https://github.com/delegateas/DataModelViewer/commit/f231d8e))


## [1.3.0] - 2025-08-10

### Features

* Merge pull request #49 from delegateas/feature/ER-Diagram ([57bf47a](https://github.com/delegateas/DataModelViewer/commit/57bf47a))
* fixed newly introduced ESLint errors and logs ([40d0ceb](https://github.com/delegateas/DataModelViewer/commit/40d0ceb))
* removed reset of layout when new entities or existing are edited ([84c29c5](https://github.com/delegateas/DataModelViewer/commit/84c29c5))
* added /diagram to middleware. And made loading indication on diagram loading. Fixed text alignment and added open beta disclaimer. ([10f9588](https://github.com/delegateas/DataModelViewer/commit/10f9588))
* added new icon to the diagram nav ([9189e9b](https://github.com/delegateas/DataModelViewer/commit/9189e9b))
* added reset functionality to reset to a single group and clear entire diagram. ([43b9635](https://github.com/delegateas/DataModelViewer/commit/43b9635))
* load/save of diagrams using JSON format ([0e8a082](https://github.com/delegateas/DataModelViewer/commit/0e8a082))
* text element and property pane ([c78482c](https://github.com/delegateas/DataModelViewer/commit/c78482c))
* link/path/relationship options for chaning style and color and label ([4b12030](https://github.com/delegateas/DataModelViewer/commit/4b12030))
* attribute selection mode added to "add group" ([dc4a621](https://github.com/delegateas/DataModelViewer/commit/dc4a621))
* square element for colorfull grouping ([68624b0](https://github.com/delegateas/DataModelViewer/commit/68624b0))
* add entire group to diagram option ([ba84e1c](https://github.com/delegateas/DataModelViewer/commit/ba84e1c))
* new sidebar and add/remove entity functionality. Also moved "add attribute" logic to entitypane ([e2a0c51](https://github.com/delegateas/DataModelViewer/commit/e2a0c51))
* Merge remote-tracking branch 'origin/main' into feature/ER-Diagram ([d03ecb4](https://github.com/delegateas/DataModelViewer/commit/d03ecb4))
* refactor avoid router code into TS and applying to newer JointJS ([88f60be](https://github.com/delegateas/DataModelViewer/commit/88f60be))
* moved diagram sidebar to new navigation ([e837122](https://github.com/delegateas/DataModelViewer/commit/e837122))
* add attribute working ([9326613](https://github.com/delegateas/DataModelViewer/commit/9326613))
* more diagram work. Better grid layout, working on add attribute ([cdb76d9](https://github.com/delegateas/DataModelViewer/commit/cdb76d9))
* addition work on digram page ([192e141](https://github.com/delegateas/DataModelViewer/commit/192e141))

### Bug Fixes

* do recalculation on diagramtype swap ([9430078](https://github.com/delegateas/DataModelViewer/commit/9430078))
* dont use full sized entities for grid layout when using simple diagram type. ([e766180](https://github.com/delegateas/DataModelViewer/commit/e766180))
* fixing linting errors and removeing old console.logs from earlier debugging ([1504f4e](https://github.com/delegateas/DataModelViewer/commit/1504f4e))
* fixed bug when navigating from diagram to datamodel ([1b82413](https://github.com/delegateas/DataModelViewer/commit/1b82413))
* minor issue with attribute hightlight ([1320478](https://github.com/delegateas/DataModelViewer/commit/1320478))
* detailed attribute highlight working again ([79ac552](https://github.com/delegateas/DataModelViewer/commit/79ac552))
* simple entity attrbiute management not working bugfix ([8760bd9](https://github.com/delegateas/DataModelViewer/commit/8760bd9))

### Code Refactoring

* more housecleaning ([ccf61dd](https://github.com/delegateas/DataModelViewer/commit/ccf61dd))
* refactor diagramview into abstraction renderes ([0746342](https://github.com/delegateas/DataModelViewer/commit/0746342))
* AI rules and diagram refactor using them ([6da3414](https://github.com/delegateas/DataModelViewer/commit/6da3414))

### Other Changes

* copilot suggestions ([cc4d309](https://github.com/delegateas/DataModelViewer/commit/cc4d309))
* chroe: lint error... ([3f255b5](https://github.com/delegateas/DataModelViewer/commit/3f255b5))
* minor change to default diagratype and fix to loading diagram spinner ([d11a904](https://github.com/delegateas/DataModelViewer/commit/d11a904))
* removed old cursor file, altered copilot instructions ([4c12e27](https://github.com/delegateas/DataModelViewer/commit/4c12e27))
* package lock changes & minor change to relationship label element ([3d560b5](https://github.com/delegateas/DataModelViewer/commit/3d560b5))
* mobile disclaimer ([ddaf306](https://github.com/delegateas/DataModelViewer/commit/ddaf306))
* more attribute control. Choose initial attributes. And remove attributes option ([887b771](https://github.com/delegateas/DataModelViewer/commit/887b771))
* hover indication on entities ([26f52dc](https://github.com/delegateas/DataModelViewer/commit/26f52dc))
* jumpover and work on simple self referencing ([e534974](https://github.com/delegateas/DataModelViewer/commit/e534974))
* hotfix ([6616482](https://github.com/delegateas/DataModelViewer/commit/6616482))
* Minor tweaks for README. ([8476deb](https://github.com/delegateas/DataModelViewer/commit/8476deb))
* gridlayout changes more dynamic spacing ([df9344f](https://github.com/delegateas/DataModelViewer/commit/df9344f))
* chore. selected attribute color stylings ([ed81c27](https://github.com/delegateas/DataModelViewer/commit/ed81c27))
* redid creation of background dots ([daea0e2](https://github.com/delegateas/DataModelViewer/commit/daea0e2))
* click highlight keys ([456d1e7](https://github.com/delegateas/DataModelViewer/commit/456d1e7))
* canvas now able to render again ([5ddd936](https://github.com/delegateas/DataModelViewer/commit/5ddd936))
* update from main ([6c80231](https://github.com/delegateas/DataModelViewer/commit/6c80231))
* merga main into branch ([00d8588](https://github.com/delegateas/DataModelViewer/commit/00d8588))
* playing around with attribute filtering ([ee1185c](https://github.com/delegateas/DataModelViewer/commit/ee1185c))
* merge with other branch ([feb17cc](https://github.com/delegateas/DataModelViewer/commit/feb17cc))
* first draft of links (cant seem to make the router work though) ([490d060](https://github.com/delegateas/DataModelViewer/commit/490d060))
* nexjs routing instead of client side react router. Initial work to Datamodelview page ([2adc6bb](https://github.com/delegateas/DataModelViewer/commit/2adc6bb))
* react-router installation, jointjs installation, nextjs upgrade to remove  DDoS vulnerability ([9118406](https://github.com/delegateas/DataModelViewer/commit/9118406))


## [1.2.4] - 2025-07-29

### Features

* PBI 119607 - Optional organisation logo ([3a4d5f7](https://github.com/delegateas/DataModelViewer/commit/3a4d5f7))

### Bug Fixes

* searchbar z-index lowered, so sidebar is not overlapped ([3aa15be](https://github.com/delegateas/DataModelViewer/commit/3aa15be))
* BUG 119281 - allow to generate with no security roles in solution ([04bff3d](https://github.com/delegateas/DataModelViewer/commit/04bff3d))

### Other Changes

* clear search input button ([1efbc9e](https://github.com/delegateas/DataModelViewer/commit/1efbc9e))
* removed unnes package jsons in root folder ([27c4431](https://github.com/delegateas/DataModelViewer/commit/27c4431))
* Update README.md ([08b19c7](https://github.com/delegateas/DataModelViewer/commit/08b19c7))
* patched empty searching glitch ([403be6e](https://github.com/delegateas/DataModelViewer/commit/403be6e))


## [1.2.3] - 2025-07-28

### Features

* tiny padding added to scroll, to ensure correct section is found in the list ([9fd4e94](https://github.com/delegateas/DataModelViewer/commit/9fd4e94))

### UI/UX Improvements

* ui adjustments to section and group selection ([759966e](https://github.com/delegateas/DataModelViewer/commit/759966e))


## [1.2.2] - 2025-07-28

### Features

* PBI 119268 - password field marked password, and UI reimplementation ([f8c8259](https://github.com/delegateas/DataModelViewer/commit/f8c8259))

### Code Refactoring

* restructureing release pipeline ([63f5b60](https://github.com/delegateas/DataModelViewer/commit/63f5b60))

### Other Changes

* changed gradient ([25fa000](https://github.com/delegateas/DataModelViewer/commit/25fa000))


## [1.2.1] - 2025-07-26

### Changed
- Changes since 1.2.0:
- Merge pull request #43 from delegateas/patch/latest-update-date
- fix: added lastsync to stub
- chore: moved show element to sidebar state and auto collapse on info.
- chore: PBI 119274 - Last Synched on about page
- chore: manually altered changelog

## [1.2.0] - 2025-07-26

### Changed
- Manual minor release

### Features

* High-performance search system with Web Worker-based processing ([5b5837b](https://github.com/delegateas/DataModelViewer/commit/5b5837b))
* Portal-isolated search component for 60fps input responsiveness ([4385826](https://github.com/delegateas/DataModelViewer/commit/4385826))
* Next/previous navigation with keyboard shortcuts (Enter, Shift+Enter, Ctrl+↑↓) ([5b5837b](https://github.com/delegateas/DataModelViewer/commit/5b5837b))
* Auto-jump to first search result functionality ([5b5837b](https://github.com/delegateas/DataModelViewer/commit/5b5837b))
* Real-time search progress indication with loading bar ([3800fda](https://github.com/delegateas/DataModelViewer/commit/3800fda))
* Global search on attributes and entities ([3800fda](https://github.com/delegateas/DataModelViewer/commit/3800fda))
* Collapsible sidebar with minimize functionality - PBI 119531 ([0d0f57f](https://github.com/delegateas/DataModelViewer/commit/0d0f57f))
* Auto-collapse sidebar on off-content click for mobile - PBI 119536 ([39726df](https://github.com/delegateas/DataModelViewer/commit/39726df))
* Direct group navigation links to first section in group - PBI 119537 ([ac13fcb](https://github.com/delegateas/DataModelViewer/commit/ac13fcb))

### Performance Improvements

* Time-sliced input processing maintains 60fps during heavy operations ([4385826](https://github.com/delegateas/DataModelViewer/commit/4385826))
* Web Worker isolation prevents main thread blocking ([4385826](https://github.com/delegateas/DataModelViewer/commit/4385826))
* Context-based performance scheduling for priority updates ([4385826](https://github.com/delegateas/DataModelViewer/commit/4385826))
* Progressive result loading for large datasets ([3800fda](https://github.com/delegateas/DataModelViewer/commit/3800fda))
* Enhanced virtualization for better handling of large data sets ([5a2e8a5](https://github.com/delegateas/DataModelViewer/commit/5a2e8a5))

### Bug Fixes

* Prevented screen jumping during tab changes - PBI 119533 ([5a2e8a5](https://github.com/delegateas/DataModelViewer/commit/5a2e8a5))
* Fixed sidebar selection to follow scroll position more accurately - PBI 119535 ([6e4f3ba](https://github.com/delegateas/DataModelViewer/commit/6e4f3ba))
* Fixed item counts to show only visible items - PBI 119588 ([fa450b5](https://github.com/delegateas/DataModelViewer/commit/fa450b5))

### UI/UX Improvements

* Replaced "entity" terminology with "table" throughout UI - PBI 119532 ([f5c8719](https://github.com/delegateas/DataModelViewer/commit/f5c8719))
* Enhanced status attribute styling for better visual hierarchy ([543d453](https://github.com/delegateas/DataModelViewer/commit/543d453))
* Added search icon and modernized search interface ([59aaaa7](https://github.com/delegateas/DataModelViewer/commit/59aaaa7))
* Improved mobile responsiveness and touch interactions

### Code Refactoring

* Moved search functionality into dedicated data context ([6dfde36](https://github.com/delegateas/DataModelViewer/commit/6dfde36))
* Separated search bar and progress bar into independent DOM trees ([4385826](https://github.com/delegateas/DataModelViewer/commit/4385826))
* Added SearchPerformanceContext for coordinated update scheduling ([4385826](https://github.com/delegateas/DataModelViewer/commit/4385826))
* Enhanced data loading with dedicated worker processing

## [1.1.5] - 2025-07-11

### Changed
- Manual patch release

# Changelog

## [1.1.4](https://github.com/delegateas/DataModelViewer/compare/website-v1.1.3...website-v1.1.4) (2025-07-10)


### Features

* about page ([f063a7e](https://github.com/delegateas/DataModelViewer/commit/f063a7e0cd20cf1a94adc6a394920368ed6203bd))
* integrate HybridTooltip and add Popover component for improved mobile experience ([9f6ea55](https://github.com/delegateas/DataModelViewer/commit/9f6ea55503ee5cd626a92f03ba8d91420f8a8c31))
* integrate HybridTooltip and add Popover component for improved tooltip functionality ([cc95331](https://github.com/delegateas/DataModelViewer/commit/cc95331d5032bad1d78674f86b7d507cd211301e))
* virtualization on sections - not quite satisfied with "jumpto" lag ([ac8d11e](https://github.com/delegateas/DataModelViewer/commit/ac8d11e2be93c698416cdfa8c2ec29c1f00b2931))


### Bug Fixes

* Default empty Data.ts file to enable build in CI without running generator ([ab259b9](https://github.com/delegateas/DataModelViewer/commit/ab259b985adfd3748917b118fa6d2e12ed96a93c))
* ESLint errors ([d1d51bb](https://github.com/delegateas/DataModelViewer/commit/d1d51bb3585c2bfea483fdab40c7b2c2cd7315e0))
* ESLint errors removed ([d1fb07a](https://github.com/delegateas/DataModelViewer/commit/d1fb07a05c00dc95620ae692a1230408ef7553e5))
* fixed all ESLint errors that was causing pipeline issues ([9d0d034](https://github.com/delegateas/DataModelViewer/commit/9d0d034daa7b986e84347aa982e045db22a8605a))
* icon colors removed by accident in PR merge ([004d3dc](https://github.com/delegateas/DataModelViewer/commit/004d3dcb8a9c4555fb60e1511da104fc27bfad17))
* lookup from link to button ([6fa20ad](https://github.com/delegateas/DataModelViewer/commit/6fa20adaef32c84c0f73e7b898b4e3aa98d76bb7))
* missing sidebar control on mobile ([61f6457](https://github.com/delegateas/DataModelViewer/commit/61f645744b06d9c5db2c08fabad3cc7b284e0254))
* reimplemented mobile sidebar ([fc0f104](https://github.com/delegateas/DataModelViewer/commit/fc0f10421a865f1b4345e1b7cea20a7234079dc7))

## [1.1.3](https://github.com/delegateas/DataModelViewer/compare/v1.1.2...v1.1.3) (2025-07-10)

### Features

* New navigation menu and about page with UI improvements
* Added virtualization on sections for better performance
* Implemented mobile sidebar functionality

### Bug Fixes

* Fixed scrollbar issues by removing overflow-x-auto and truncate classes
* Resolved ESLint errors and code quality issues
* Fixed lookup component from link to button

### Code Refactoring

* Created state context for datamodel view management
* Improved scroll logic and navigation behavior
