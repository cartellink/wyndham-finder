// Test script to verify region mapping functionality
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testRegionMapping() {
  console.log('🧪 Testing region mapping functionality...\n')

  try {
    // Test 1: Check if regions table exists and has data
    console.log('1. Checking regions table...')
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('*')
      .limit(5)

    if (regionsError) {
      console.error('❌ Error fetching regions:', regionsError)
      return
    }

    console.log(`✅ Found ${regions.length} sample regions:`)
    regions.forEach(region => {
      console.log(`   - ${region.name} (ID: ${region.id}, IRIS: ${region.iris_id})`)
    })

    // Test 2: Test region mapping with known values
    console.log('\n2. Testing region mapping...')
    
    // Test California mapping
    const californiaRegionId = await mapRegionToId('993', 'USA', 'California')
    console.log(`   California mapping: ${californiaRegionId}`)

    // Test Australia mapping
    const australiaRegionId = await mapRegionToId('686', 'AUS')
    console.log(`   Australia mapping: ${australiaRegionId}`)

    // Test New South Wales mapping
    const nswRegionId = await mapRegionToId('687', 'AUS', 'New South Wales')
    console.log(`   New South Wales mapping: ${nswRegionId}`)

    // Test 3: Check if any resorts have region_id set
    console.log('\n3. Checking resorts with region_id...')
    const { data: resortsWithRegion, error: resortsError } = await supabase
      .from('resorts')
      .select('id, name, region_id, region:regions(name)')
      .not('region_id', 'is', null)
      .limit(5)

    if (resortsError) {
      console.error('❌ Error fetching resorts:', resortsError)
      return
    }

    console.log(`✅ Found ${resortsWithRegion.length} resorts with region_id:`)
    resortsWithRegion.forEach(resort => {
      console.log(`   - ${resort.name} (ID: ${resort.id}) -> Region: ${resort.region?.name || 'Unknown'} (${resort.region_id})`)
    })

    // Test 4: Check resorts without region_id
    console.log('\n4. Checking resorts without region_id...')
    const { data: resortsWithoutRegion, error: resortsWithoutError } = await supabase
      .from('resorts')
      .select('id, name, region_code, country_code, area_name')
      .is('region_id', null)
      .limit(5)

    if (resortsWithoutError) {
      console.error('❌ Error fetching resorts without region:', resortsWithoutError)
      return
    }

    console.log(`⚠️  Found ${resortsWithoutRegion.length} resorts without region_id:`)
    resortsWithoutRegion.forEach(resort => {
      console.log(`   - ${resort.name} (ID: ${resort.id}) -> ${resort.country_code}-${resort.region_code} ${resort.area_name}`)
    })

    console.log('\n✅ Region mapping test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Helper function to map regions (simplified version for testing)
async function mapRegionToId(regionCode, countryCode, state) {
  try {
    // Try to match by iris_id first (most reliable)
    if (regionCode) {
      const { data: regionByIris } = await supabase
        .from('regions')
        .select('id')
        .eq('iris_id', parseInt(regionCode))
        .single()
      
      if (regionByIris) {
        return regionByIris.id
      }
    }
    
    // Try to match by country and state
    if (countryCode && state) {
      const { data: regionByState } = await supabase
        .from('regions')
        .select('id')
        .eq('country_code', countryCode)
        .eq('sub_region', state)
        .single()
      
      if (regionByState) {
        return regionByState.id
      }
    }
    
    // Try to match by country only (parent region)
    if (countryCode) {
      const { data: regionByCountry } = await supabase
        .from('regions')
        .select('id')
        .eq('country_code', countryCode)
        .is('sub_region', null)
        .single()
      
      if (regionByCountry) {
        return regionByCountry.id
      }
    }
    
    return null
  } catch (error) {
    console.error('Error in mapRegionToId:', error)
    return null
  }
}

// Run the test
testRegionMapping() 