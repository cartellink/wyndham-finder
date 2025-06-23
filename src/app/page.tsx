import { getRegionsForSelect } from "@/lib/models/regions"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const regions = await getRegionsForSelect()
  
  return <HomeClient regions={regions} />
}
