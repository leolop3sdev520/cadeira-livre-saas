type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

class ApiClient {
  // Usa a URL da Vercel (produção) ou o localhost (desenvolvimento)
  private baseUrl: string =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { body, headers, ...rest } = options;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const requestHeaders = new Headers(headers);

    if (isFormData) {
      requestHeaders.delete("Content-Type");
    } else if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: requestHeaders,
      ...rest,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || "Erro inesperado.",
      };
    }
    return data as T;
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }
  post<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }
  patch<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }
  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
