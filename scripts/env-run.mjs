// Cross-platform env-var runner: `node scripts/env-run.mjs KEY=VAL... -- cmd args...`
// Replaces Unix-only `KEY=VAL cmd` syntax in npm scripts so they work on Windows too.
import { spawn } from "node:child_process";

const argv = process.argv.slice(2);
const env = { ...process.env };
let i = 0;
for (; i < argv.length; i++) {
  const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(argv[i]);
  if (!m) break;
  env[m[1]] = m[2];
}
if (argv[i] === "--") i++;
const [cmd, ...args] = argv.slice(i);
if (!cmd) {
  console.error("usage: node scripts/env-run.mjs KEY=VAL... -- <command> [args...]");
  process.exit(1);
}
const child = spawn(cmd, args, { env, stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 0));
