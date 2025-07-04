// Universal API proxy middleware
export async function onRequest(context) {
  console.log('🔥🔥 MIDDLEWARE PROXY TRIGGERED! 🔥🔥');
  
  const { request, env } = context;
  const url = new URL(request.url);

  
  console.log('📝 Request details:', {
    method: request.method,
    path: url.pathname,
    search: url.search,
    headers: Object.fromEntries(request.headers.entries()),
    isOAuthCallback: url.pathname.includes('/callback/')
  });
  
  // Get the backend URL from environment variables
  const backendUrl = env.BACKEND_URL;

  // Construct target URL
  const targetUrl = `${backendUrl}${url.pathname}${url.search}`;
  
  console.log('🎯 Forwarding to:', targetUrl);

  // Copy headers from original request
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!key.toLowerCase().startsWith('cf-') && key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  }
  
  // Log cookie information for debugging
  const incomingCookies = request.headers.get('cookie');
  console.log('🍪 Incoming cookies from browser:', incomingCookies ? 'Present' : 'None');
  
  // Set critical headers for OAuth to work correctly
  headers.set('origin', url.origin);
  headers.set('host', new URL(backendUrl).host);
  headers.set('x-forwarded-host', url.hostname);
  headers.set('x-forwarded-proto', url.protocol.slice(0, -1));
  
  // Log what cookies we're forwarding to backend
  const cookiesToBackend = headers.get('cookie');
  console.log('🍪 Cookies forwarded to backend:', cookiesToBackend ? 'Present' : 'None');

  try {
    console.log('📡 Making request to backend...');
    
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH' ? request.body : undefined,
      redirect: 'manual', // DON'T auto-follow redirects - we need to handle them manually,
    });

    console.log('✅ Backend responded:', response.status);
    console.log('📋 Response headers from backend:', Object.fromEntries(response.headers.entries()));

    // Check if this is an OAuth callback that should redirect
    const isRedirectResponse = response.status >= 300 && response.status < 400;
    console.log('🔄 Is redirect response:', isRedirectResponse);
    
    // Create new response
    const responseText = await response.text();
    const proxyResponse = new Response(responseText, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy headers and fix cookie domains
    const backendDomain = new URL(backendUrl).hostname;
    const frontendDomain = url.hostname;
    
    // Collect all Set-Cookie headers first
    const setCookieHeaders = [];
    
    for (const [key, value] of response.headers.entries()) {
      
      if (key.toLowerCase() === 'set-cookie') {
        console.log('🍪 Raw cookie from backend:', value);
        
        // Fix cookie domain properly
        let fixedCookie = value;
        
        // Remove any existing domain attributes (backend or otherwise)
        fixedCookie = fixedCookie.replace(/;\s*[Dd]omain=[^;]*/g, '');
        
        // Remove any existing secure/samesite that might conflict
        fixedCookie = fixedCookie.replace(/;\s*[Ss]ecure/g, '');
        fixedCookie = fixedCookie.replace(/;\s*[Ss]ame[Ss]ite=[^;]*/g, '');
        
        // Add proper attributes for cross-origin cookies
        fixedCookie += '; SameSite=None; Secure';
        
        // Don't set explicit domain - let it default to current domain
        // This is crucial for Pages functions
        
        console.log('🍪 Cookie transformation:', { 
          original: value, 
          fixed: fixedCookie,
          backendDomain,
          frontendDomain
        });
        
        setCookieHeaders.push(fixedCookie);
       } else if (key.toLowerCase() === 'location' && isRedirectResponse) {
         // Fix redirect URLs to point to frontend instead of backend
         let redirectUrl = value;
         if (redirectUrl.startsWith(backendUrl)) {
           redirectUrl = redirectUrl.replace(backendUrl, url.origin);
         }
         console.log('🔀 Redirect URL fixed:', { original: value, fixed: redirectUrl });
         proxyResponse.headers.set(key, redirectUrl);
       } else if (key.toLowerCase() !== 'set-cookie') {
         proxyResponse.headers.set(key, value);
       }
    }
    
    // Set all cookies at once
    setCookieHeaders.forEach(cookie => {
      proxyResponse.headers.append('Set-Cookie', cookie);
    });

    // Set CORS headers
    proxyResponse.headers.set('Access-Control-Allow-Origin', env.FRONTEND_URL);
    proxyResponse.headers.set('Access-Control-Allow-Credentials', 'true');

    console.log('🚀 Final response headers:', Object.fromEntries(proxyResponse.headers.entries()));
    console.log('🍪 Final cookies being sent:', proxyResponse.headers.getSetCookie ? proxyResponse.headers.getSetCookie() : 'getSetCookie not available');

    return proxyResponse;
    
  } catch (error) {
    console.error('💥 PROXY ERROR:', error);
    return new Response(JSON.stringify({ 
      error: 'Proxy failed: ' + error.message,
      targetUrl
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 