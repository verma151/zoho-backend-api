import { getZohoAccessToken } from "./auth.js";

export async function zohoRequest(
  path: string,
  options: RequestInit = {}
) {
  const accessToken = await getZohoAccessToken();

  const response = await fetch(
    `${process.env.ZOHO_API_DOMAIN}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  // console.log("Zoho status:", response.status);
  // console.log("Zoho response:", text);

  if (!response.ok) {
    throw new Error(
      `Zoho API error: ${
        text || `HTTP ${response.status}`
      }`
    );
  }

  if (!text.trim()) {
    return {
      success: true,
      data: null,
      message: "Zoho request completed successfully."
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: true,
      data: text
    };
  }
}