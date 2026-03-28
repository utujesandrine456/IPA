const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://iap-l6oe.onrender.com/api";

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

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers: mergedHeaders,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = Array.isArray(errorData.message)
                ? errorData.message[0]
                : errorData.message || errorData.error || "An error occurred";

            if (response.status === 401 && endpoint === "/auth/me") {
                return {
                    ok: false,
                    status: 401,
                    error: "Session expired",
                };
            }

            return {
                ok: false,
                status: response.status,
                error: errorMessage,
                data: errorData,
            };
        }

        const data = await response.json().catch(() => ({}));
        return { ok: true, status: response.status, data };
    } catch (error: any) {
        if (error.name === "TypeError" && error.message === "Failed to fetch") {
            console.error(
                `[apiFetch] Connection Refused: Ensure the backend is running at ${API_URL}`
            );
            return {
                ok: false,
                status: 0,
                error:
                    "Unable to connect to the server. Please check if the backend is running.",
            };
        }
        console.error(`[apiFetch] Error fetching ${fullUrl}:`, error);
        return {
            ok: false,
            status: 0,
            error: error?.message || "An unexpected error occurred",
        };
    }
}
