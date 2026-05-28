const KEY = 'vedaai_token';

export function saveAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(KEY);
  }
  return null;
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(KEY);
  }
}
