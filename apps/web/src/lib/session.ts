export async function setFrontendSession(token: string): Promise<void> {
    const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    if (!res.ok) {
        throw new Error('Failed to establish session');
    }
}
export async function clearFrontendSession(): Promise<void> {
    await fetch('/api/session', { method: 'DELETE' });
}
