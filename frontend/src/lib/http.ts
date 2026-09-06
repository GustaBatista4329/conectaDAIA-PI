// Cliente HTTP fino usado pelo api.ts pra falar com o backend real (FastAPI).
// Guarda o JWT no localStorage e injeta no header Authorization automaticamente.

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'conectadaia.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Manda o header Authorization se houver token salvo. Default: true. */
  auth?: boolean
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch {
      // resposta sem corpo JSON — mantém o statusText
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** Igual apiFetch, mas 401/403/404 viram `null` em vez de lançar — combina
 * com o formato que o api.ts (compatível com o mock) já usa nesses casos. */
export async function apiFetchOrNull<T>(path: string, options?: RequestOptions): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options)
  } catch (e) {
    if (e instanceof ApiError && [401, 403, 404].includes(e.status)) return null
    throw e
  }
}
