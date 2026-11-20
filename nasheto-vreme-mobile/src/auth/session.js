let accessToken = null;
let accessTokenExpiresAt = null;
let userProfile = null;

export function setSession(payload) {
  accessToken = payload?.accessToken || null;
  accessTokenExpiresAt = payload?.accessTokenExpiresAt || null;
  userProfile = payload?.user || null;
}

export function clearSession() {
  accessToken = null;
  accessTokenExpiresAt = null;
  userProfile = null;
}

export function getAccessToken() {
  return accessToken;
}

export function getSessionUser() {
  return userProfile;
}

export function hasValidSession() {
  return Boolean(accessToken && accessTokenExpiresAt);
}

