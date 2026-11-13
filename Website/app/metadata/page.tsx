import { DatamodelView } from "@/components/datamodelview/DatamodelView";
import Layout from "@/components/shared/Layout";
import { Suspense } from "react";
import { DatamodelViewProvider } from "@/contexts/DatamodelViewContext";
import { EntityFiltersProvider } from "@/contexts/EntityFiltersContext";

export default function Data() {
  return (
    <Suspense>
      <DatamodelViewProvider>
        <EntityFiltersProvider>
          <Layout ignoreMargins>
            <DatamodelView />
          </Layout>
        </EntityFiltersProvider>
      </DatamodelViewProvider>
    </Suspense>
  )
}
