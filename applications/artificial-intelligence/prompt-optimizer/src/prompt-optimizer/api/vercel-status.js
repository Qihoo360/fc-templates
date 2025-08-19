export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  return new Response(
    JSON.stringify({
      status: 'available',
      environment: 'vercel',
      proxySupport: true,
      version: '1.0.0'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
} 