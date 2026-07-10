import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const globalsCss = "src/app/styles/globals.css";
const failures = [];

const textExtensions = new Set([".css", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

function toPosix(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function walk(dir) {
  const entries = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      entries.push(...walk(fullPath));
    } else {
      entries.push(fullPath);
    }
  }
  return entries;
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function addFailure(file, reason) {
  failures.push(`${file}: ${reason}`);
}

function getImports(content) {
  const imports = [];
  const importPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']/g;
  let match;
  while ((match = importPattern.exec(content))) {
    imports.push(match[1]);
  }
  return imports;
}

function checkExactCssFile(files) {
  const cssFiles = files
    .filter((file) => file.endsWith(".css"))
    .map(toPosix)
    .sort();

  if (cssFiles.length !== 1 || cssFiles[0] !== globalsCss) {
    addFailure("src", `expected only ${globalsCss}; found ${cssFiles.join(", ") || "none"}`);
  }
}

function checkCssImports(files) {
  for (const file of files.filter((item) => sourceExtensions.has(path.extname(item)))) {
    const rel = toPosix(file);
    for (const source of getImports(read(file))) {
      if (!source.endsWith(".css")) continue;
      if (rel === "src/main.tsx" && source === "./app/styles/globals.css") continue;
      addFailure(rel, `css import is not allowed: ${source}`);
    }
  }
}

function checkForbiddenImports(files) {
  const featureDeepImport = /^@\/features\/([^/]+)\/(ui|model|api|lib)(?:\/|$)/;

  for (const file of files.filter((item) => sourceExtensions.has(path.extname(item)))) {
    const rel = toPosix(file);
    const content = read(file);
    for (const source of getImports(content)) {
      if (source === "antd" || source.startsWith("antd/")) {
        addFailure(rel, `antd import is not allowed: ${source}`);
      }
      if (
        rel.startsWith("src/components/") &&
        (source === "@/features" || source.startsWith("@/features/"))
      ) {
        addFailure(rel, `shared component imports feature code: ${source}`);
      }
      const deepMatch = source.match(featureDeepImport);
      if (deepMatch) {
        const featureRoot = `src/features/${deepMatch[1]}/`;
        if (!rel.startsWith(featureRoot)) {
          addFailure(rel, `feature internal deep import is not allowed: ${source}`);
        }
      }
    }
  }
}

function checkForbiddenText(files) {
  const legacyTokenPattern = /--(?:color-|kds-ui-)/;
  const antSelectorPattern = /\.ant-/;
  const tailwindDirectivePattern = /@tailwind\s+/;
  const legacyClassPattern =
    /\b(?:kds|auth|settings|support|stats|orders|store-status|staff|tasks)-[A-Za-z0-9_-]+/;

  for (const file of files.filter((item) => textExtensions.has(path.extname(item)))) {
    const rel = toPosix(file);
    const content = read(file);

    if (legacyTokenPattern.test(content)) {
      addFailure(rel, "legacy css token pattern is not allowed");
    }
    if (antSelectorPattern.test(content)) {
      addFailure(rel, "Ant Design selector is not allowed");
    }
    if (tailwindDirectivePattern.test(content) && rel !== globalsCss) {
      addFailure(rel, "@tailwind directive is only allowed in globals.css");
    }

    for (const classText of extractClassText(content)) {
      if (legacyClassPattern.test(classText)) {
        addFailure(rel, `legacy styling class is not allowed: ${classText.trim()}`);
      }
    }
  }
}

function extractClassText(content) {
  const values = [];
  const quoted = /className\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  const templated = /className\s*=\s*{`([\s\S]*?)`}/g;
  let match;

  while ((match = quoted.exec(content))) {
    values.push(match[1] ?? match[2] ?? "");
  }
  while ((match = templated.exec(content))) {
    values.push(match[1] ?? "");
  }

  return values;
}

function checkForbiddenDirs() {
  for (const rel of ["src/shared", "src/features/kds", "src/types"]) {
    if (existsSync(path.join(root, rel))) {
      addFailure(rel, "legacy directory must not exist");
    }
  }
}

function checkRawControls(files) {
  const rawControlPattern = /<(?!(?:[A-Z]|\/))(input|select|textarea|button)\b/g;
  const allowlistedFiles = new Map([
    ["src/components/ui/button.tsx", "Button primitive owns the raw button element."],
    ["src/components/ui/input.tsx", "Input primitive owns the raw input element."],
    ["src/components/ui/textarea.tsx", "Textarea primitive owns the raw textarea element."],
  ]);

  for (const file of files.filter((item) => item.endsWith(".tsx"))) {
    const rel = toPosix(file);
    if (allowlistedFiles.has(rel)) continue;

    const content = read(file);
    let match;
    while ((match = rawControlPattern.exec(content))) {
      addFailure(rel, `raw <${match[1]}> control must use components/ui primitive`);
    }
  }
}

function checkPreflight() {
  const configPath = path.join(root, "tailwind.config.js");
  if (existsSync(configPath) && /preflight\s*:\s*false/.test(read(configPath))) {
    addFailure("tailwind.config.js", "preflight must stay enabled");
  }
}

const files = walk(srcDir);

checkExactCssFile(files);
checkCssImports(files);
checkForbiddenImports(files);
checkForbiddenText(files);
checkForbiddenDirs();
checkRawControls(files);
checkPreflight();

if (failures.length > 0) {
  console.error("Frontend architecture check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Frontend architecture check passed.");
