export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL - use local login page for standalone deployment
export const getLoginUrl = () => {
  // Check if OAuth is configured (Manus environment)
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // If OAuth is not configured, use local login
  if (!oauthPortalUrl || !appId) {
    return "/login";
  }
  
  // OAuth flow for Manus environment
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
