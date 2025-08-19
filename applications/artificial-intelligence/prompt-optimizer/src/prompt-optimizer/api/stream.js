// api/stream.js
export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  console.log('流式代理请求开始处理:', new Date().toISOString());
  
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    console.log('处理CORS预检请求');
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
      console.error('缺少目标URL参数');
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
      console.error('无效的目标URL:', error);
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
    console.log('请求方法:', req.method);
    console.log('请求头数量:', [...headers.keys()].length);

    // 获取请求体
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
      console.log('请求体长度:', body?.length || 0);
    }

    console.log('开始向目标URL发送请求:', new Date().toISOString());
    // 发送请求到目标URL
    const fetchResponse = await fetch(validTargetUrl, {
      method: req.method,
      headers,
      body,
      duplex: 'half', // 支持流式请求
    });
    console.log('收到目标URL响应:', new Date().toISOString(), '状态码:', fetchResponse.status);

    // 创建响应头
    const responseHeaders = new Headers();
    fetchResponse.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    // 设置CORS头
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
    
    // 检查是否是SSE流
    const contentType = fetchResponse.headers.get('content-type');
    const isEventStream = contentType?.includes('text/event-stream');
    console.log('响应内容类型:', contentType, '是否为SSE流:', isEventStream);
    
    if (isEventStream) {
      responseHeaders.set('Content-Type', 'text/event-stream');
      responseHeaders.set('Cache-Control', 'no-cache');
      responseHeaders.set('Connection', 'keep-alive');
      // 确保不缓冲数据
      responseHeaders.set('X-Accel-Buffering', 'no');
    }

    // 创建并返回流式响应，使用TransformStream确保数据立即传输
    const { readable, writable } = new TransformStream();
    console.log('创建TransformStream完成');
    
    // 启动数据传输过程
    (async () => {
      const writer = writable.getWriter();
      const reader = fetchResponse.body.getReader();
      
      try {
        console.log('开始流式传输数据:', new Date().toISOString());
        let chunkCount = 0;
        let totalBytes = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('流式传输完成:', new Date().toISOString());
            console.log(`总共传输 ${chunkCount} 个数据块，${totalBytes} 字节`);
            await writer.close();
            break;
          }
          
          // 立即写入数据并刷新
          await writer.write(value);
          chunkCount++;
          totalBytes += value.length;
          
          if (chunkCount % 10 === 0) {
            console.log(`已传输 ${chunkCount} 个数据块，${totalBytes} 字节`);
          }
        }
      } catch (error) {
        console.error('流式传输错误:', error);
        writer.abort(error);
      }
    })();

    console.log('返回流式响应');
    return new Response(readable, {
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('流式代理请求失败:', error);
    return new Response(JSON.stringify({ error: `流式代理请求失败: ${error.message}` }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
} 