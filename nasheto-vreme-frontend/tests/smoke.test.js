const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const html = read("index.html");
assert(html.includes("id=\"authScreen\""), "auth screen is missing");
assert(html.includes("id=\"appScreen\""), "app screen is missing");
assert(html.includes("id=\"loginForm\""), "login form is missing");
assert(html.includes("id=\"registerForm\""), "register form is missing");
assert(html.includes("id=\"uploadForm\""), "upload form is missing");
assert(html.includes("id=\"loadTimelineBtn\""), "timeline button is missing");
assert(html.includes("id=\"pdfExportForm\""), "pdf export form is missing");
assert(html.includes("id=\"downloadPdfBtn\""), "pdf download button is missing");

const mainJs = read("src/main.js");
assert(mainJs.includes("renderScreenByAuth"), "auth/app screen toggling is missing");
assert(mainJs.includes("logoutBtn"), "logout handler is missing");
assert(mainJs.includes("todayQuestionBtn"), "today question action is missing");
assert(mainJs.includes("createMomentForm"), "moments action is missing");
assert(mainJs.includes("loadTimeline"), "timeline loader is missing");
assert(mainJs.includes("createPdfPreview"), "pdf preview action is missing");
assert(mainJs.includes("downloadPdfBook"), "pdf download action is missing");

console.log("Smoke tests passed.");

