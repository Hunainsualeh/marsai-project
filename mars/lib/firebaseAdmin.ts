/**
 * Lightweight server-side token verification using Firebase REST API.
 * This avoids requiring the Firebase Admin SDK (and its Node.js-only dependencies).
 *
 * Returns the Firebase UID on success, or null if the token is invalid/missing.
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  let idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!idToken) {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/__firebase_auth=([^;]+)/);
      if (match) idToken = match[1];
    }
  }

  if (!idToken) return null;

  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error('Missing Firebase API key');

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const uid = data?.users?.[0]?.localId;
    return uid ?? null;
  } catch {
    return null;
  }
}
