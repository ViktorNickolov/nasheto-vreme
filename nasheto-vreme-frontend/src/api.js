const API_URL_KEY = "nv_api_base";
const API_TIMEOUT_MS = 10000;

let authState = null;

export function getApiBaseUrl() {
  return localStorage.getItem(API_URL_KEY) || "http://localhost:8088/api/v1";
}

export function setApiBaseUrl(url) {
  localStorage.setItem(API_URL_KEY, url.replace(/\/$/, ""));
}

export function getAuth() {
  return authState;
}

export function setAuth(payload) {
  authState = payload
    ? {
        accessToken: payload.accessToken,
        accessTokenExpiresAt: payload.accessTokenExpiresAt,
        user: payload.user
      }
    : null;
}

export function clearAuth() {
  authState = null;
}

function authHeader() {
  const auth = getAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
}

async function api(path, options = {}) {
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

  if (!response.ok) {
    throw new Error(body?.message || `${response.status} ${response.statusText}`);
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

export async function uploadImage(familyId, file) {
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

  const body = await parseJsonBody(response);

  if (!response.ok) {
    throw new Error(body?.message || `${response.status} ${response.statusText}`);
  }

  return body;
}

export async function downloadPdfBook(payload) {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/exports/pdf/download`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeader()
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await parseJsonBody(response);
    throw new Error(body?.message || `${response.status} ${response.statusText}`);
  }

  return {
    blob: await response.blob(),
    fileName: response.headers.get("Content-Disposition") || "nasheto-vreme.pdf"
  };
}


