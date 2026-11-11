import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const html = read("index.html");
assert(html.includes("id=\"root\""), "react root container is missing");
assert(html.includes("src=\"/src/main.jsx\""), "vite entrypoint is missing");

const appJsx = read("src/App.jsx");
assert(appJsx.includes("id=\"authScreen\""), "auth screen is missing");
assert(appJsx.includes("id=\"appScreen\""), "app screen is missing");
assert(appJsx.includes("loginForm"), "login form is missing");
assert(appJsx.includes("registerForm"), "register form is missing");
assert(appJsx.includes("getTodayQuestion"), "today question action is missing");
assert(appJsx.includes("setApiBaseUrl"), "api base url configuration is missing");
assert(appJsx.includes("Logout"), "logout action is missing");

console.log("Smoke tests passed.");
