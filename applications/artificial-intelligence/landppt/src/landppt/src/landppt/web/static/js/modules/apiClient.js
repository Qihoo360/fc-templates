const defaultHeaders = {
    'Content-Type': 'application/json'
};

async function request(url, options = {}) {
    const { method = 'GET', body, headers = {}, signal, responseType, returnResponse = false } = options;
    const init = {
        method,
        headers: body instanceof FormData ? headers : { ...defaultHeaders, ...headers },
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        signal,
        credentials: 'same-origin'
    };

    const response = await fetch(url, init);
    const contentType = response.headers.get('content-type') || '';
    const expectedType = responseType || (contentType.includes('application/json') ? 'json' : 'text');
    let payload;

    if (expectedType === 'blob') {
        payload = await response.blob();
    } else if (expectedType === 'json') {
        payload = await response.json();
    } else {
        payload = await response.text();
    }

    if (!response.ok) {
        const message = payload?.message || response.statusText;
        throw new Error(message);
    }

    if (returnResponse) {
        return { data: payload, headers: response.headers, status: response.status };
    }

    return payload;
}

const withQuery = (url, params) => {
    if (!params) return url;
    const search = new URLSearchParams(params);
    return `${url}?${search.toString()}`;
};

export const apiClient = {
    request,
    get: (url, params, options = {}) => request(withQuery(url, params), { ...options, method: 'GET' }),
    post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
    put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body }),
    del: (url, options = {}) => request(url, { ...options, method: 'DELETE' })
};

export default apiClient;
