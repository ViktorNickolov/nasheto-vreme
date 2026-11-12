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

const { clearAuth, refreshToken, setApiBaseUrl, setAuth } = await import("../src/api.js");

setApiBaseUrl("http://localhost:8088/api/v1");
setAuth({
  accessToken: "access-token-before-refresh",
  accessTokenExpiresAt: "2026-11-12T18:00:00Z",
  user: { id: 42 }
});

async function assertRefreshTimeoutError() {
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;

  global.setTimeout = (callback) => {
    queueMicrotask(callback);
    return 1;
  };
  global.clearTimeout = () => {};

  global.fetch = async (url, options = {}) =>
    new Promise((resolve, reject) => {
      options.signal?.addEventListener("abort", () => {
        const abortError = new Error("aborted");
        abortError.name = "AbortError";
        reject(abortError);
      });
    });

  await assert.rejects(
    refreshToken,
    /Request timed out\. Please try again\./,
    "refresh should surface timeout errors"
  );

  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
}

async function assertInvalidJsonError() {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    async text() {
      return "{invalid-json";
    }
  });

  await assert.rejects(
    refreshToken,
    /Server returned invalid JSON response\./,
    "refresh should fail on malformed JSON"
  );
}

async function assertRefreshUnauthorizedError() {
  global.fetch = async () => ({
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    async text() {
      return JSON.stringify({ message: "Refresh token missing" });
    }
  });

  await assert.rejects(
    refreshToken,
    /Refresh token missing/,
    "refresh should surface backend error message"
  );
}

await assertRefreshTimeoutError();
await assertInvalidJsonError();
await assertRefreshUnauthorizedError();

clearAuth();

console.log("Auth error flow integration test passed.");


