# https://www.python-httpx.org/
import httpx
from httpx._config import Limits
from sanic.log import logger

class HTTPX:
    def __init__(self, url, data=None, params=None, headers=None):
        self.url = url
        self.data = data
        self.params = params
        self.headers = headers or {"content-type": "application/json"}
        self.transport = httpx.HTTPTransport(retries=3)
        self.async_transport = httpx.AsyncHTTPTransport(retries=3)

    def get(self):
        client = httpx.Client(transport=self.transport,limits=Limits(max_connections=1000, max_keepalive_connections=200))
        try:
            r = client.get(self.url,params=self.params)
            return r.json()
        except Exception as e:
            logger.error(f"调用{self.url}发生异常, error: {e}")
            return {"error": str(e)}
        finally:
            client.close()

    def post(self):
        client =  httpx.Client(transport=self.transport,limits=Limits(max_connections=1000, max_keepalive_connections=200))
        try:
            r = client.post(self.url, data=self.data, headers=self.headers)
            return r.json()
        except Exception as e:
            logger.error(f"调用{self.url}发生异常, error: {e} data: {self.data} ")
            return {"error": str(e), "code": 1}
        finally:
            client.close()

    async def put(self):
        # client =  httpx.Client(transport=self.transport,limits=Limits(max_connections=1000, max_keepalive_connections=200))
        client =  httpx.AsyncClient(transport=self.async_transport,limits=Limits(max_connections=1000, max_keepalive_connections=200))
        try:
            r = await client.put(self.url, data=self.data, headers=self.headers)
            return r.json()
        except Exception as e:
            logger.error(f"调用{self.url}发生异常, error: {e} data: {self.data} ")
            return {"error": str(e), "code": 1}
        finally:
            # client.close()
            await client.aclose()

