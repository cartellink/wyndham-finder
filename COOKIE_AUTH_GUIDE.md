# WordPress Cookie Authentication Guide

## Quick Setup (Recommended)

If you have a working WordPress login cookie, you can bypass the complex 2FA authentication flow by setting it directly.

### Step 1: Get Your WordPress Cookie

1. **Log into Club Wyndham** in your browser manually
2. **Go to the booking page**: https://clubwyndhamsp.com/book-now-new-with-calendar/
3. **Open Developer Tools** (F12)
4. **Go to the Application/Storage tab** → Cookies → https://clubwyndhamsp.com
5. **Find the WordPress cookie** - it will be named something like:
   - `wordpress_logged_in_abcdef123456789` 
   - The exact name varies, but starts with `wordpress_logged_in_`
6. **Copy the cookie value**

### Step 2: Set Environment Variable

Add this to your `.env` file:

```bash
WYNDHAM_WORDPRESS_COOKIE="wordpress_logged_in_abcdef123456789=your_actual_cookie_value_here"
```

**Important**: Include the full cookie name and value, separated by `=`

### Step 3: Test

Run the scraper - it will now use your manual cookie instead of attempting the full login flow.

## How It Works

The enhanced authentication flow now:

1. **First**: Checks for `WYNDHAM_WORDPRESS_COOKIE` environment variable
2. **If found**: Sets the cookie and tests it by accessing the booking page
3. **If successful**: Uses the manual cookie for all requests
4. **If fails**: Falls back to the full authentication system with 2FA

## Advantages

- ✅ **Much faster** - no login or 2FA delays
- ✅ **More reliable** - bypasses complex authentication flows
- ✅ **Easier debugging** - simpler to troubleshoot cookie issues
- ✅ **Maintains fallback** - still works with full auth if cookie fails

## Debugging

The scraper will log:
- `🍪 Using manual WordPress cookie from environment` - when manual cookie is found
- `✅ Manual cookie authentication successful` - when it works
- `⚠️ Manual cookie appears invalid, falling back to full authentication` - when it fails

## Cookie Format

If you need to format the cookie manually, it should look like:
```
wordpress_logged_in_[hash]=[cookie_value]; Domain=clubwyndhamsp.com; Path=/; HttpOnly
```

## Notes

- WordPress cookies typically expire after a certain period (usually days or weeks)
- You'll need to refresh the cookie when it expires
- The cookie hash in the name is unique to your account
- Make sure you're copying from the correct domain (clubwyndhamsp.com) 