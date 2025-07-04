// Simple test function to verify Pages Functions work
export async function onRequestGet(context) {
  const { env, request } = context;
  
  return new Response(JSON.stringify({
    message: "Pages Function is working!",
    url: request.url,
    backendUrl: env.BACKEND_URL,
    timestamp: new Date().toISOString(),
    envKeys: Object.keys(env)
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
} 