import { getRegionsForSelect } from "@/lib/models/regions"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const regions = await getRegionsForSelect()
  
  console.log('Regions loaded:', regions.length)
  console.log('Sample regions:', regions.slice(0, 5))

  return <HomeClient regions={regions} />
}
