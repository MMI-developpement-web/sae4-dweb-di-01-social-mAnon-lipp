const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json() as Promise<T>;
}
