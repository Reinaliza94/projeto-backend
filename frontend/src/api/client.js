const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function request(path, { token, ...options } = {}) {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    if (options.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers
    });

    if (response.status === 204) {
        return null;
    }

    const responseText = await response.text();
    let responseBody;
    if (responseText) {
        try {
            responseBody = JSON.parse(responseText);
        } catch {
            responseBody = null;
        }
    }

    if (!response.ok) {
        throw new Error(
            responseBody?.error || `A API respondeu com status ${response.status}.`
        );
    }

    return responseBody;
}

export function getProducts() {
    return request("/v1/product/search?limit=-1");
}

export function getCategories() {
    return request("/v1/category/search?limit=-1");
}

export function registerUser(user) {
    return request("/v1/user", {
        method: "POST",
        body: JSON.stringify(user)
    });
}

export function createSession(credentials) {
    return request("/v1/user/token", {
        method: "POST",
        body: JSON.stringify(credentials)
    });
}

export function getOrders(token) {
    return request("/v1/order", { token });
}

export function createOrder(items, token) {
    return request("/v1/order", {
        method: "POST",
        token,
        body: JSON.stringify({ items })
    });
}
