var acorn = require("acorn");
var fs = require("fs");
var path = require("path");

var errors = 0;

function check(dir, label) {
  var files = fs.readdirSync(dir).filter(function(f) { return f.endsWith(".js"); }).sort();
  files.forEach(function(f) {
    var fp = path.join(dir, f);
    var code = fs.readFileSync(fp, "utf-8");
    try {
      acorn.parse(code, { ecmaVersion: 2020, sourceType: "script" });
      console.log("  OK  " + label + "/" + f + " (" + code.split("\n").length + " lines)");
    } catch(e) {
      console.error("  ERR " + label + "/" + f + ": " + e.message);
      errors++;
    }
  });
}

console.log("Core modules:");
check("src/core", "core");
console.log("Page modules:");
check("src/pages", "pages");

// Also check main.js as ES module
try {
  var main = fs.readFileSync("src/main.js", "utf-8");
  acorn.parse(main, { ecmaVersion: 2020, sourceType: "module" });
  console.log("  OK  main.js (" + main.split("\n").length + " lines)");
} catch(e) {
  console.error("  ERR main.js: " + e.message);
  errors++;
}

if (errors > 0) {
  console.error("\n" + errors + " file(s) FAILED.");
  process.exit(1);
} else {
  console.log("\nAll files pass acorn syntax check.");
}
