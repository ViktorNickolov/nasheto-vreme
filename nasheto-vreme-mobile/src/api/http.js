import { getApiBaseUrl } from "../config/env";
import { clearSession, getAccessToken, setSession } from "../auth/session";
import { clearRefreshToken, loadRefreshToken, saveRefreshToken } from "../auth/tokenStorage";
import { getApiErrorMessage } from "../i18n/apiErrorMessages";

const JSON_HEADERS = {
  "Content-Type": "application/json"
};

const AUTH_RETRY_EXCLUDED_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];
let apiLanguage = "bg";

export function setMobileApiLanguage(language) {
  apiLanguage = language === "en" ? "en" : "bg";
}

function buildHeaders(headers = {}) {
  const accessToken = getAccessToken();
  return {
    ...JSON_HEADERS,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers
  };
}

function shouldSkipAuthRetry(path) {
  return AUTH_RETRY_EXCLUDED_PATHS.some((excludedPath) => path.startsWith(excludedPath));
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(getApiErrorMessage("invalidJson", apiLanguage));
  }
}

function buildErrorMessage(response, body) {
  if (body?.message) {
    return body.message;
  }
  if (response?.statusText) {
    return `${response.status} ${response.statusText}`;
  }
  return getApiErrorMessage("genericRequestFailed", apiLanguage);
}

async function request(path, options = {}, allowRetry = true) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options.headers)
  });

  if (response.status === 401 && allowRetry && !shouldSkipAuthRetry(path)) {
    const refreshed = await refreshMobileSession();
    if (refreshed) {
      return request(path, options, false);
    }
  }

  const body = await parseJson(response);

  if (!response.ok) {
    const error = new Error(buildErrorMessage(response, body));
    error.status = response.status;
    throw error;
  }

  return body;
}

export async function loginMobile(credentials) {
  const body = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });

  setSession(body);
  if (body?.refreshToken) {
    await saveRefreshToken(body.refreshToken);
  }
  return body;
}

export async function registerMobile(payload) {
  const body = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  setSession(body);
  if (body?.refreshToken) {
    await saveRefreshToken(body.refreshToken);
  }
  return body;
}

export async function refreshMobileSession() {
  try {
    const refreshToken = await loadRefreshToken();
    const payload = refreshToken ? { refreshToken } : {};
    const body = await request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify(payload)
    }, false);

    setSession(body);
    // Backend issues refresh token via HttpOnly cookie in refresh/login responses.
    // Keep secure-storage token only when backend still sends one for compatibility.
    if (body?.refreshToken) {
      await saveRefreshToken(body.refreshToken);
    }
    return true;
  } catch {
    clearSession();
    await clearRefreshToken();
    return false;
  }
}

export async function logoutMobile() {
  try {
    await request("/auth/logout", {
      method: "POST",
      body: "{}"
    }, false);
  } finally {
    clearSession();
    await clearRefreshToken();
  }
}

export function getProfileMobile() {
  return request("/auth/me");
}

export async function uploadProfileImageMobile(fileAsset, allowRetry = true) {
  const formData = new FormData();
  formData.append("file", {
    uri: fileAsset.uri,
    name: fileAsset.name || "profile-photo.jpg",
    type: fileAsset.mimeType || "image/jpeg"
  });

  const response = await fetch(`${getApiBaseUrl()}/auth/me/profile-image`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
    },
    body: formData
  });

  if (response.status === 401 && allowRetry) {
    const refreshed = await refreshMobileSession();
    if (refreshed) {
      return uploadProfileImageMobile(fileAsset, false);
    }
  }

  const body = await parseJson(response);
  if (!response.ok) {
    const error = new Error(buildErrorMessage(response, body));
    error.status = response.status;
    throw error;
  }

  return body;
}

export function getTodayQuestionMobile(language = "bg") {
  return request(`/questions/today?language=${encodeURIComponent(language)}`);
}

export function getFamilyAnswersMobile(familyId) {
  return request(`/families/${familyId}/answers`);
}

export function answerTodayQuestionMobile(questionId, payload) {
  return request(`/questions/${questionId}/answers`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getFamilyMobile(familyId) {
  return request(`/families/${familyId}`);
}

export function getFamilyMembersMobile(familyId) {
  return request(`/families/${familyId}/members`);
}

export function sendFamilyInvitationMobile(familyId, payload) {
  return request(`/families/${familyId}/invitations`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listMomentsMobile(familyId) {
  return request(`/moments?familyId=${familyId}`);
}

export function createMomentMobile(payload) {
  return request("/moments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getTimelineMobile(familyId, type = "ALL", limit = 20) {
  return request(`/timeline?familyId=${familyId}&type=${type}&limit=${limit}`);
}

export async function uploadFamilyFileMobile(familyId, fileAsset, allowRetry = true) {
  const formData = new FormData();
  formData.append("familyId", String(familyId));
  formData.append("file", {
    uri: fileAsset.uri,
    name: fileAsset.name || "attachment.bin",
    type: fileAsset.mimeType || "application/octet-stream"
  });

  const response = await fetch(`${getApiBaseUrl()}/uploads/images`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
    },
    body: formData
  });

  if (response.status === 401 && allowRetry) {
    const refreshed = await refreshMobileSession();
    if (refreshed) {
      return uploadFamilyFileMobile(familyId, fileAsset, false);
    }
  }

  const body = await parseJson(response);
  if (!response.ok) {
    const error = new Error(buildErrorMessage(response, body));
    error.status = response.status;
    throw error;
  }

  return body;
}

async function fetchBinary(path, options = {}, allowRetry = true) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 401 && allowRetry && !shouldSkipAuthRetry(path)) {
    const refreshed = await refreshMobileSession();
    if (refreshed) {
      return fetchBinary(path, options, false);
    }
  }

  if (!response.ok) {
    let body = null;
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      body = await parseJson(response);
    }
    const error = new Error(buildErrorMessage(response, body));
    error.status = response.status;
    throw error;
  }

  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("Content-Type") || "application/octet-stream",
    disposition: response.headers.get("Content-Disposition") || ""
  };
}

export function downloadUploadedFileMobile(relativePath) {
  const raw = String(relativePath || "");
  let pathWithoutMeta = raw;
  let metaRaw = "";

  const hashIndex = raw.indexOf("#");
  if (hashIndex >= 0) {
    pathWithoutMeta = raw.slice(0, hashIndex);
    metaRaw = raw.slice(hashIndex + 1);
  }

  const queryIndex = pathWithoutMeta.indexOf("?");
  if (queryIndex >= 0) {
    metaRaw = `${pathWithoutMeta.slice(queryIndex + 1)}${metaRaw ? `&${metaRaw}` : ""}`;
    pathWithoutMeta = pathWithoutMeta.slice(0, queryIndex);
  }

  const fileName = (pathWithoutMeta || "").split(/[\\/]/).pop();
  if (!fileName) {
    throw new Error(getApiErrorMessage("missingFileReference", apiLanguage));
  }
  const meta = new URLSearchParams(metaRaw);
  const suggestedName = meta.get("orig") || "";

  return fetchBinary(`/uploads/images/${encodeURIComponent(fileName)}`).then((result) => ({
    ...result,
    suggestedName
  }));
}

export function createPdfPreviewMobile(payload) {
  return request("/exports/pdf", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function downloadPdfMobile(payload) {
  return fetchBinary("/exports/pdf/download", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  });
}

export { request };

