import assert from "node:assert";

function createStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    }
  };
}

global.localStorage = createStorage();

const {
  clearAuth,
  getAuth,
  logoutSession,
  refreshToken,
  setApiBaseUrl,
  setAuth
} = await import("../src/api.js");

clearAuth();
setApiBaseUrl("http://localhost:8088/api/v1");
setAuth({
  accessToken: "access-token-before-refresh",
  accessTokenExpiresAt: "2026-11-12T18:00:00Z",
  refreshToken: "this-should-not-be-used",
  user: { id: 1 }
});

const calls = [];
global.fetch = async (url, options = {}) => {
  calls.push({ url, options });

  if (url.endsWith("/auth/refresh")) {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      async text() {
        return JSON.stringify({
          accessToken: "access-token-after-refresh",
          accessTokenExpiresAt: "2026-11-12T19:00:00Z",
          refreshToken: null,
          refreshTokenExpiresAt: null,
          user: { id: 1, email: "parent@example.com" }
        });
      }
    };
  }

  if (url.endsWith("/auth/logout")) {
    return {
      ok: true,
      status: 204,
      statusText: "No Content",
      async text() {
        return "";
      }
    };
  }

  throw new Error(`Unexpected fetch URL: ${url}`);
};

const refreshPayload = await refreshToken();
assert.equal(refreshPayload.accessToken, "access-token-after-refresh");

const refreshCall = calls.find((entry) => entry.url.endsWith("/auth/refresh"));
assert(refreshCall, "refresh endpoint should be called");
assert.equal(refreshCall.options.method, "POST");
assert.equal(refreshCall.options.credentials, "include");
assert.equal(refreshCall.options.body, "{}");
assert.equal(
  refreshCall.options.headers.Authorization,
  "Bearer access-token-before-refresh",
  "refresh should still use in-memory access token header if present"
);

const logoutPayload = await logoutSession();
assert.equal(logoutPayload, null, "logout should return null on empty response body");

const logoutCall = calls.find((entry) => entry.url.endsWith("/auth/logout"));
assert(logoutCall, "logout endpoint should be called");
assert.equal(logoutCall.options.method, "POST");
assert.equal(logoutCall.options.credentials, "include");
assert.equal(logoutCall.options.body, "{}");

clearAuth();
assert.equal(getAuth(), null);

console.log("Auth cookie flow integration test passed.");

