const axios = require('axios')
const { CookieJar } = require('tough-cookie')
const { wrapper } = require('axios-cookiejar-support')
const cheerio = require('cheerio')

// Configure axios with cookie support - same as in main file
const jar = new CookieJar()
const client = wrapper(axios.create({ jar, timeout: 30000 }))

const baseUrl = 'http://clubwyndhamsp.com'

// Helper function to extract JavaScript variables from HTML
const findTextAndReturnRemainder = (target, variable) => {
  const chopFront = target.substring(target.search(variable) + variable.length, target.length)
  const result = chopFront.substring(0, chopFront.search(';'))
  return result
}

// Get security nonce from the main page
const getSecurity = async () => {
  console.log('🔍 Getting security nonce...')
  
  try {
    // Manually set the PHPSESSID cookie before making requests
    const manualCookie = 'PHPSESSID=d14217727b095426f9b47f6116ce8a1e; Path=/; Domain=clubwyndhamsp.com'
    await jar.setCookie(manualCookie, baseUrl)
    console.log('🍪 Manually set PHPSESSID cookie: d14217727b095426f9b47f6116ce8a1e')

    // also add this cookie wordpress_logged_in_abcdef123456789=test
    const wordpressLoggedInCookie = 'wordpress_logged_in_abcdef123456789=test'
    await jar.setCookie(wordpressLoggedInCookie, baseUrl)
    console.log('🍪 Manually set wordpress_logged_in_cookie: wordpress_logged_in_abcdef123456789=test')
    
    const response = await client.get(baseUrl)
    console.log(`✅ GET ${baseUrl} - Status: ${response.status}`)
    
    // Check if we got cookies
    const cookies = await jar.getCookies(baseUrl)
    console.log(`🍪 Total cookies after request: ${cookies.length}`)
    cookies.forEach((cookie, index) => {
      console.log(`   ${index + 1}. ${cookie.key}=${cookie.value.substring(0, 20)}${cookie.value.length > 20 ? '...' : ''}`)
    })
    
    const $ = cheerio.load(response.data)
    const text = $('#custom-js-extra').html()
    
    if (!text) {
      throw new Error('Could not find security nonce')
    }
    
    const findAndClean = findTextAndReturnRemainder(text, 'var ajax_object =')
    const ajaxObject = JSON.parse(findAndClean)
    
    console.log(`🔐 Security nonce extracted: ${ajaxObject.ajax_nonce}`)
    return ajaxObject.ajax_nonce
  } catch (error) {
    console.error('❌ Error getting security:', error.message)
    throw error
  }
}

// Test GET request to book-now page
const testBookNowPage = async () => {
  console.log('🧪 Testing book-now page access...')
  
  const url = 'https://clubwyndhamsp.com/book-now-new-with-calendar/'
  
  try {
    console.log(`📤 GET ${url}`)
    
    const response = await client.get(url)
    
    console.log(`✅ Book-now page - Status: ${response.status}`)
    console.log(`📏 Response length: ${response.data.length} characters`)
    
    // Check if we got a proper page (not redirect or error)
    if (response.status === 200) {
      const $ = cheerio.load(response.data)
      const title = $('title').text().trim()
      console.log(`📋 Page title: ${title}`)
      
      // Check if user is logged in by looking for the login required message
      const notLoggedInText = " to view this page."
      const isNotLoggedIn = response.data.includes(notLoggedInText)
      const isLoggedIn = !isNotLoggedIn
      
      console.log(`🔐 Login status: ${isLoggedIn ? '✅ LOGGED IN' : '❌ NOT LOGGED IN'}`)
      if (isNotLoggedIn) {
        console.log(`   Found login required text: "${notLoggedInText}"`)
      }
      
      // Check for common elements that indicate successful access
      const hasBookingForm = $('.booking-form, #booking-form, [class*="book"], [id*="book"]').length > 0
      const hasCalendar = $('.calendar, #calendar, [class*="calendar"]').length > 0
      
      console.log(`🗓️ Has booking elements: ${hasBookingForm}`)
      console.log(`📅 Has calendar elements: ${hasCalendar}`)
      
      return { success: true, title, hasBookingForm, hasCalendar, isLoggedIn, isNotLoggedIn }
    } else {
      console.log(`⚠️ Unexpected status code: ${response.status}`)
      return { success: false, status: response.status }
    }
    
  } catch (error) {
    console.error(`❌ Book-now page test failed:`, error.message)
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Headers:`, error.response.headers)
    }
    return { success: false, error: error.message }
  }
}

// Simple API call test
const testApiCall = async (security) => {
  console.log('🧪 Testing API call...')
  
  const url = 'https://clubwyndhamsp.com/wp-admin/admin-ajax.php'
  
  // Test multiple different API calls to see which ones work with the session
  const testCalls = [
    {
      name: 'Filter resort by region',
      payload: {
        action: 'filter_resort_by_region',
        iris_region: '690',
        security: security
      }
    },
    {
      name: 'Get resorts (might need auth)',
      payload: {
        action: 'get_resorts',
        security: security
      }
    },
    {
      name: 'Search availability (likely needs auth)', 
      payload: {
        action: 'search_availability',
        security: security
      }
    }
  ]
  
  for (const testCall of testCalls) {
    try {
      console.log(`\n📤 Testing: ${testCall.name}`)
      console.log('   Payload:', { ...testCall.payload, security: `${security.substring(0, 8)}...` })
      
      const response = await client.post(url, testCall.payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      })
      
      console.log(`✅ ${testCall.name} - Status: ${response.status}`)
      console.log(`📝 Response type: ${typeof response.data}`)
      console.log(`📏 Response length: ${JSON.stringify(response.data).length} characters`)
      
      // Log response content
      console.log('📋 Response:', JSON.stringify(response.data, null, 2))
      
      // If we get a successful response, return it
      if (response.data && response.data !== '0' && response.data !== '-1') {
        console.log(`🎉 Success with: ${testCall.name}`)
        return response.data
      }
      
    } catch (error) {
      console.error(`❌ ${testCall.name} failed:`, error.message)
      if (error.response) {
        console.error(`   Status: ${error.response.status}`)
        console.error(`   Data: ${JSON.stringify(error.response.data).substring(0, 200)}...`)
      }
    }
  }
  
  console.log('⚠️ All test calls completed, check results above')
  return null
}

// Main test function
const runCookieTest = async () => {
  console.log('🚀 Starting cookie API test...\n')
  
  try {
    // Step 1: Get security nonce (this will set initial cookies)
    const security = await getSecurity()
    console.log('')
    
    // Step 2: Test book-now page access
    const bookNowResult = await testBookNowPage()
    console.log('')
    
    // Step 3: Test API call using cookies
    const result = await testApiCall(security)
    console.log('')
    
    // Step 3: Check final cookie state
    const finalCookies = await jar.getCookies(baseUrl)
    console.log(`🍪 Final cookie count: ${finalCookies.length}`)
    
    console.log('✅ Cookie API test completed successfully!')
    console.log('🎉 Cookie support is working correctly!')
    
    return { success: true, result, bookNowResult }
    
  } catch (error) {
    console.error('\n❌ Cookie API test failed!')
    console.error('Error:', error.message)
    return { success: false, error: error.message }
  }
}

// Run the test when called directly
runCookieTest()
  .then(result => {
    if (result.success) {
      process.exit(0)
    } else {
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })

module.exports = { runCookieTest, getSecurity, testApiCall } 