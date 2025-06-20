import ResultsClient from "@/components/results-client";
import { getRegionsForSelect } from "@/lib/models/regions";
import { Suspense } from "react";

function Page() {
  // This is a server component, but we need to wrap the client component
  // in Suspense because it uses useSearchParams(), which requires it.
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage />
    </Suspense>
  )
}

async function ClientPage() {
  const regions = await getRegionsForSelect()
  return <ResultsClient regions={regions} />
}

export default Page; 