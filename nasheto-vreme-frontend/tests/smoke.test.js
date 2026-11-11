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
assert(appJsx.includes("id=\"loginForm\""), "login form is missing");
assert(appJsx.includes("id=\"registerForm\""), "register form is missing");
assert(appJsx.includes("id=\"answerForm\""), "answer form is missing");
assert(appJsx.includes("id=\"createMomentForm\""), "moments form is missing");
assert(appJsx.includes("id=\"uploadForm\""), "upload form is missing");
assert(appJsx.includes("id=\"pdfExportForm\""), "pdf export form is missing");
assert(appJsx.includes("id=\"downloadPdfBtn\""), "pdf download action is missing");
assert(appJsx.includes("id=\"loadTimelineBtn\""), "timeline action is missing");

assert(appJsx.includes("createPdfPreview"), "pdf preview API action is missing");
assert(appJsx.includes("downloadPdfBook"), "pdf download API action is missing");
assert(appJsx.includes("getTodayQuestion"), "today question API action is missing");
assert(appJsx.includes("answerQuestion"), "answer API action is missing");
assert(appJsx.includes("createMoment"), "create moment API action is missing");
assert(appJsx.includes("uploadImage"), "upload image API action is missing");

console.log("Smoke tests passed.");
