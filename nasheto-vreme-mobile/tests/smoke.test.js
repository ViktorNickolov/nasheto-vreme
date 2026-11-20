const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const pkg = JSON.parse(read("package.json"));
assert(pkg.name === "nasheto-vreme-mobile", "package name must be nasheto-vreme-mobile");
assert(pkg.scripts?.start, "start script is missing");
assert(pkg.dependencies?.expo, "expo dependency is missing");

const app = read("App.js");
assert(app.includes("createNativeStackNavigator"), "stack navigation is missing");
assert(app.includes("LoginScreen"), "Login screen wiring is missing");
assert(app.includes("HomeScreen"), "Home screen wiring is missing");

const api = read("src/api/http.js");
assert(api.includes("refreshMobileSession"), "mobile refresh flow is missing");
assert(api.includes("logoutMobile"), "logout action is missing");

console.log("Mobile smoke checks passed.");

