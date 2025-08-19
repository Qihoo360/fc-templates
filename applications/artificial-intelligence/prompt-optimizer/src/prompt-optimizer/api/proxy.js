export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // 解析请求数据
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('targetUrl');
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: '缺少目标URL参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 确保targetUrl是有效的URL
    let validTargetUrl;
    try {
      validTargetUrl = new URL(decodeURIComponent(targetUrl)).toString();
      console.log('目标URL:', validTargetUrl);
    } catch (error) {
      return new Response(JSON.stringify({ error: `无效的目标URL: ${error.message}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 准备请求头
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // 排除一些特定的头，这些头可能会导致问题
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // 获取请求体
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
    }

    // 发送请求到目标URL
    const fetchResponse = await fetch(validTargetUrl, {
      method: req.method,
      headers,
      body,
    });

    // 读取响应数据
    const data = await fetchResponse.text();
    
    // 创建响应头
    const responseHeaders = new Headers();
    fetchResponse.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    // 设置CORS头
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
    
    // 返回响应
    return new Response(data, {
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('代理请求失败:', error);
    return new Response(JSON.stringify({ error: `代理请求失败: ${error.message}` }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
} 