const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2009/api";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    if (!API_URL) {
        console.error("[apiFetch] Error: NEXT_PUBLIC_API_URL is not defined in environment variables.");
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const mergedHeaders = new Headers(options.headers);
    if (token) {
        mergedHeaders.set("Authorization", `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData)) {
        mergedHeaders.set("Content-Type", "application/json");
    }

    const fullUrl = `${API_URL}${endpoint}`;
    console.log(`[apiFetch] Calling: ${fullUrl}`);

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers: mergedHeaders,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || errorData.message || "An error occurred";

            // Handle Unauthorized globally
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }

            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error: any) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.error(`[apiFetch] Connection Refused: Ensure the backend is running at ${API_URL}`);
            throw new Error("Unable to connect to the server. Please check if the backend is running.");
        }
        console.error(`[apiFetch] Error fetching ${fullUrl}:`, error);
        throw error;
    }
}
