/**
 * Warns when the monorepo path is likely too long for RN New Arch CMake/Ninja on Windows.
 * Informational only — see README (MAX_PATH).
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "win32") {
  process.exit(0);
}

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptsDir, "..");
const repoRoot = path.resolve(appRoot, "..", "..");

/** Ninja-style path segments (colon in drive encoded as '_' + path). */
const driveTag = `${repoRoot[0]}_`;
const middle = repoRoot.slice(2).replace(/\\/g, "/");
const ninjaStyleSource = `${driveTag}${middle}/node_modules/react-native-safe-area-context/common/cpp/react/renderer/components/safeareacontext/RNCSafeAreaViewShadowNode.cpp`;

const cxxPrefix =
  `${appRoot}\\android\\app\\.cxx\\Debug\\ex\\arm64-v8a\\safeareacontext_autolinked_build\\CMakeFiles\\react_codegen_safeareacontext.dir\\`;

const approxObjectPath = `${cxxPrefix}${ninjaStyleSource}.o`;

console.log(`Repo root (${repoRoot.length} chars):\n  ${repoRoot}`);
console.log(
  `\nApproximate worst-case codegen object path (~${approxObjectPath.length} chars; Ninja often hits ~260 on Windows):\n  …${approxObjectPath.slice(-120)}`,
);

const risky = repoRoot.includes("OneDrive") || approxObjectPath.length >= 248;

try {
  const out = execSync(
    `reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem" /v LongPathsEnabled`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true },
  );
  const longPathsEnabled = /LongPathsEnabled\s+REG_DWORD\s+0x1/.test(out);
  console.log(
    `\nWindows LongPathsEnabled (registry): ${longPathsEnabled ? "YES (0x1)" : "NO or not set — enable & reboot per README"}`,
  );
} catch {
  console.log(
    "\nCould not read LongPathsEnabled from registry (run README command as Administrator).",
  );
}

if (risky && approxObjectPath.length >= 240) {
  console.log(`
*** High risk for: Ninja "Filename longer than 260 characters" ***
  Fixes: enable LongPathsEnabled + reboot, subst to drive P:, or clone to e.g. C:\\dev\\Pizza-Ai (avoid OneDrive for native builds).

  See README: "Windows / Android native build (MAX_PATH)".`);
}
