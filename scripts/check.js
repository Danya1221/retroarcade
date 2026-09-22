import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
function walk(p) {
  for (const e of readdirSync(p, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const f = p + "/" + e.name;
    if (e.isDirectory()) walk(f);
    else if (f.endsWith(".js")) execFileSync(process.execPath, ["--check", f]);
  }
}
walk(".");
console.log("Syntax checks passed");
