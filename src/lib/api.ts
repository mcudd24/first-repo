// Tiny client-side fetch helper: JSON in/out, throws on { error }.

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // Session expired — bounce to Clerk's sign-in screen.
    window.location.href = "/sign-in";
    return new Promise<T>(() => {}); // never resolves; page is navigating away
  }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data as T;
}
