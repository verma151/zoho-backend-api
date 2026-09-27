let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

export async function getZohoAccessToken(): Promise<string> {
  const now = Date.now();

  // Reuse token if it is still valid
  if (
    cachedAccessToken &&
    now < tokenExpiresAt - 60_000
  ) {
    return cachedAccessToken;
  }

  const response = await fetch(
    "https://accounts.zoho.in/oauth/v2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Zoho OAuth failed: ${error}`
    );
  }

  const data = await response.json();

  cachedAccessToken = data.access_token;

  tokenExpiresAt =
    Date.now() + (data.expires_in ?? 3600) * 1000;

  return cachedAccessToken;
}