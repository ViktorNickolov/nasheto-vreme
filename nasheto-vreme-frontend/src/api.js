const API_URL_KEY = "nv_api_base";
const API_TIMEOUT_MS = 10000;
const AUTH_STATE_KEY = "nv_auth_state";
const AUTH_RETRY_EXCLUDED_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

let authState = null;
let refreshInFlight = null;

function getSessionStorageSafe() {
  if (typeof globalThis === "undefined" || !globalThis.sessionStorage) {
    return null;
  }
  return globalThis.sessionStorage;
}

export function getApiBaseUrl() {
  return localStorage.getItem(API_URL_KEY) || "http://localhost:8088/api/v1";
}

export function setApiBaseUrl(url) {
  localStorage.setItem(API_URL_KEY, url.replace(/\/$/, ""));
}

export function getAuth() {
  const storage = getSessionStorageSafe();
  if (!authState) {
    const stored = storage?.getItem(AUTH_STATE_KEY);
    if (stored) {
      try {
        authState = JSON.parse(stored);
      } catch {
        storage?.removeItem(AUTH_STATE_KEY);
      }
    }
  }
  return authState;
}

export function setAuth(payload) {
  const storage = getSessionStorageSafe();
  authState = payload
    ? {
        accessToken: payload.accessToken,
        accessTokenExpiresAt: payload.accessTokenExpiresAt,
        user: payload.user
      }
    : null;

  if (authState) {
    storage?.setItem(AUTH_STATE_KEY, JSON.stringify(authState));
  } else {
    storage?.removeItem(AUTH_STATE_KEY);
  }
}

export function clearAuth() {
  const storage = getSessionStorageSafe();
  authState = null;
  storage?.removeItem(AUTH_STATE_KEY);
}

function authHeader() {
  const auth = getAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
}

function createApiError(response, body) {
  const error = new Error(body?.message || `${response.status} ${response.statusText}`);
  error.status = response.status;
  return error;
}

function shouldSkipAuthRetry(path) {
  return AUTH_RETRY_EXCLUDED_PATHS.some((excludedPath) => path.startsWith(excludedPath));
}

async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshed = await refreshToken();
      setAuth(refreshed);
      return refreshed;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function api(path, options = {}, allowAuthRetry = true) {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers || {})
    }
  });

  const body = await parseJsonBody(response);

  if (response.status === 401 && allowAuthRetry && !shouldSkipAuthRetry(path)) {
    await refreshSession();
    return api(path, options, false);
  }

  if (!response.ok) {
    throw createApiError(response, body);
  }

  return body;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseJsonBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned invalid JSON response.");
  }
}

export function register(payload) {
  return api("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function login(payload) {
  return api("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function refreshToken() {
  return api("/auth/refresh", {
    method: "POST",
    body: "{}"
  });
}

export function logoutSession() {
  return api("/auth/logout", {
    method: "POST",
    body: "{}"
  });
}

export function me() {
  return api("/auth/me");
}

export function getTodayQuestion() {
  return api("/questions/today");
}

export function getFamily(familyId) {
  return api(`/families/${familyId}`);
}

export function getFamilyMembers(familyId) {
  return api(`/families/${familyId}/members`);
}

export function getFamilyAnswers(familyId) {
  return api(`/families/${familyId}/answers`);
}

export function getTimeline(familyId, type = "ALL", limit = 50) {
  return api(`/timeline?familyId=${familyId}&type=${type}&limit=${limit}`);
}

export function createPdfPreview(payload) {
  return api("/exports/pdf", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getQuestions() {
  return api("/questions");
}

export function answerQuestion(questionId, payload) {
  return api(`/questions/${questionId}/answers`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createMoment(payload) {
  return api("/moments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listMoments(familyId) {
  return api(`/moments?familyId=${familyId}`);
}

export async function uploadImage(familyId, file, allowAuthRetry = true) {
  const formData = new FormData();
  formData.append("familyId", String(familyId));
  formData.append("file", file);

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/uploads/images`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...authHeader()
    },
    body: formData
  });

  if (response.status === 401 && allowAuthRetry) {
    await refreshSession();
    return uploadImage(familyId, file, false);
  }

  const body = await parseJsonBody(response);

  if (!response.ok) {
    throw createApiError(response, body);
  }

  return body;
}

export async function downloadPdfBook(payload, allowAuthRetry = true) {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/exports/pdf/download`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeader()
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401 && allowAuthRetry) {
    await refreshSession();
    return downloadPdfBook(payload, false);
  }

  if (!response.ok) {
    const body = await parseJsonBody(response);
    throw createApiError(response, body);
  }

  return {
    blob: await response.blob(),
    fileName: response.headers.get("Content-Disposition") || "nasheto-vreme.pdf"
  };
}

export async function downloadUploadedFile(filePath, allowAuthRetry = true) {
  const fileName = (filePath || "").split(/[\\/]/).pop();
  if (!fileName) {
    throw new Error("Missing uploaded file reference.");
  }

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/uploads/images/${encodeURIComponent(fileName)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...authHeader()
    }
  });

  if (response.status === 401 && allowAuthRetry) {
    await refreshSession();
    return downloadUploadedFile(filePath, false);
  }

  if (!response.ok) {
    let body = null;
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      body = await parseJsonBody(response);
    }
    throw createApiError(response, body);
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get("Content-Type") || "application/octet-stream",
    fileName
  };
}


