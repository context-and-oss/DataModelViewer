# Bug-hunt reviewer build

This review branch combines the column search formatting, column terminology, repeated table navigation, keyboard scrolling, dependency maintenance, lookup navigation, relationship behavior, process classification, and scoped global-search fixes. It is a combined test build; its component changes remain independently reviewable.

## Start on Windows

Clone this reviewer branch into a new folder (requires Git), then run the launcher:

```powershell
git clone --branch test/bug-hunt-review --single-branch https://github.com/context-and-oss/DataModelViewer.git DataModelViewer-review
cd DataModelViewer-review
```

Start the review:

```powershell
powershell -ExecutionPolicy Bypass -File .\Setup\review.ps1
```

The first run downloads dependencies and can take several minutes. The launcher downloads checksum-verified Node **22.23.2** into this checkout, installs the lockfile dependencies, and copies the included synthetic sample into the generated folder. It prints a locally generated password. Open **http://localhost:3001/metadata** after Next reports Ready; the first page may take a minute to compile. Stop with **Ctrl+C**. Use `-Port 3002` if needed.

No Dataverse account, tenant configuration, or generator run is needed. The included sample contains synthetic metadata for reviewer testing. The launcher stores its runtime, cache, and generated password under ignored `.review/`; it does not change the system Node installation.

Run checks with the preview stopped:

```powershell
powershell -ExecutionPolicy Bypass -File .\Setup\review.ps1 -Check
```

## Manual setup on other systems

Use Node **22.23.2**, then run `npm ci` inside `Website`. Copy `Setup/review-sample/Data.ts` to `Website/generated/Data.ts` and `Website/stubs/Introduction.md` to `Website/generated/Introduction.md` (create the generated directory if needed). Set `WebsitePassword` to a local test password and set `WebsiteSessionSecret` and `AUTH_SECRET` to newly generated random secrets. Set `AUTH_TRUST_HOST=true`, `ENABLE_ENTRAID_AUTH=false`, and `DISABLE_PASSWORD_AUTH=false`. Run `npm run dev -- --hostname 127.0.0.1 --port 3001` inside `Website`.

Do not run `prepipeline` for this sample: it replaces generated metadata with the empty stub.

## Things to review

- In a table's column search, search for an email format: the result should contain readable highlighted text.
- Select the same table twice: loading should finish both times.
- Click a blank metadata margin, then press Page Down and Page Up. The table area should scroll. Tab can also focus the metadata region.
- Search for a lookup column globally, then follow its related-table link: search should clear and the target should open.
- Open Relationships and hover or keyboard-focus the behavior label. Referential, Parental, or Custom should have all eight cascade settings available in the tooltip.
- Open a column's process dependencies: cloud flows should be grouped as Power Automate Flow rather than Dialog.
- In global-search options, select only data types and search `DateOnly`: matching columns should appear. Selecting only names should not match datatype-only text.

The scoped-search change covers column matching and filtering; it does not expand global search to every metadata field. Record the selected scope and exact search text when reporting remaining gaps.

## Included pull requests

| Change | Pull request |
| --- | --- |
| Column search formatting | [#90](https://github.com/context-and-oss/DataModelViewer/pull/90) |
| Column terminology | [#91](https://github.com/context-and-oss/DataModelViewer/pull/91) |
| Dependency maintenance and runtime fixes | [#92](https://github.com/context-and-oss/DataModelViewer/pull/92), [#93](https://github.com/context-and-oss/DataModelViewer/pull/93) |
| Repeated table navigation | [#94](https://github.com/context-and-oss/DataModelViewer/pull/94) |
| Metadata keyboard scrolling | [#96](https://github.com/context-and-oss/DataModelViewer/pull/96) |
| Lookup navigation outside search results | [#97](https://github.com/context-and-oss/DataModelViewer/pull/97) |
| Relationship behavior labels and details | [#98](https://github.com/context-and-oss/DataModelViewer/pull/98) |
| Scoped global column search | [#99](https://github.com/context-and-oss/DataModelViewer/pull/99) |
| Cloud-flow and classic-workflow classification | [#100](https://github.com/context-and-oss/DataModelViewer/pull/100) |


## Live-created synthetic process examples

- [Planet Name dependencies](http://localhost:3001/processes?attr=dmvp_Name&ent=dmvp_Planet): `Playground-test-flow` should be shown as **Classic Workflow**.
- [Planet Weight dependencies](http://localhost:3001/processes?attr=dmvp_Weight&ent=dmvp_Planet): `Planet create - set weight 1234` should be shown as **Power Automate**.

These examples are included in the cached sample and do not execute either process. If you selected another port, change the links to that port.
