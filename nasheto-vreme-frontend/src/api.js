const TOKEN_KEY = "nv_auth";
const API_URL_KEY = "nv_api_base";

export function getApiBaseUrl() {
  return localStorage.getItem(API_URL_KEY) || "http://localhost:8088/api/v1";
}

export function setApiBaseUrl(url) {
  localStorage.setItem(API_URL_KEY, url.replace(/\/$/, ""));
}

export function getAuth() {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(payload) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(payload));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeader() {
  const auth = getAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
}

async function api(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.message || `${response.status} ${response.statusText}`);
  }

  return body;
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
  const auth = getAuth();
  if (!auth?.refreshToken) {
    throw new Error("No refresh token available.");
  }

  return api("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: auth.refreshToken })
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

  const response = await fetch(`${getApiBaseUrl()}/uploads/images`, {
    method: "POST",
    headers: {
      ...authHeader()
    },
    body: formData
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.message || `${response.status} ${response.statusText}`);
  }

  return body;
}

export async function downloadPdfBook(payload) {
  const response = await fetch(`${getApiBaseUrl()}/exports/pdf/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader()
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    throw new Error(body?.message || `${response.status} ${response.statusText}`);
  }

  return {
    blob: await response.blob(),
    fileName: response.headers.get("Content-Disposition") || "nasheto-vreme.pdf"
  };
}


