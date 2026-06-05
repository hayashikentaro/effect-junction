import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

type SourceFile = {
  path: string;
  content: string;
};

type ForbiddenImport = {
  label: string;
  matches: (specifier: string) => boolean;
};

const repoRoot = process.cwd();

function listTsFiles(root: string): SourceFile[] {
  const files: SourceFile[] = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      if (["dist", "node_modules"].includes(entry.name)) {
        continue;
      }

      files.push(...listTsFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push({
        path: entryPath,
        content: fs.readFileSync(entryPath, "utf8"),
      });
    }
  }

  return files;
}

function extractImportSpecifiers(content: string): string[] {
  const importPattern =
    /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
  const specifiers: string[] = [];

  for (const match of content.matchAll(importPattern)) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function assertNoForbiddenImports(
  files: SourceFile[],
  forbidden: ForbiddenImport[],
): void {
  const failures: string[] = [];

  for (const file of files) {
    const relativePath = path.relative(repoRoot, file.path).split(path.sep).join("/");

    for (const specifier of extractImportSpecifiers(file.content)) {
      for (const rule of forbidden) {
        if (rule.matches(specifier)) {
          failures.push(
            `Forbidden import in ${relativePath}: "${specifier}" (${rule.label})`,
          );
        }
      }
    }
  }

  assert.deepEqual(failures, []);
}

function importsPathSegment(segment: string): (specifier: string) => boolean {
  return (specifier) =>
    specifier.startsWith(`./${segment}/`) ||
    specifier.startsWith(`../${segment}/`) ||
    specifier.includes(`/${segment}/`);
}

function importsDemo(specifier: string): boolean {
  return (
    specifier === "./demo.js" ||
    specifier === "../samples/demo.js" ||
    specifier.endsWith("/demo.js") ||
    specifier.endsWith("/demo.ts")
  );
}

test("core does not import runtime, samples, tests, or demo", () => {
  const coreFiles = listTsFiles(path.join(repoRoot, "src/core"));

  assertNoForbiddenImports(coreFiles, [
    {
      label: "core must not import runtime",
      matches: importsPathSegment("runtime"),
    },
    {
      label: "core must not import samples",
      matches: importsPathSegment("samples"),
    },
    {
      label: "core must not import tests",
      matches: importsPathSegment("tests"),
    },
    {
      label: "core must not import CLI/demo",
      matches: importsDemo,
    },
  ]);
});

test("non-demo samples do not import runtime", () => {
  const sampleFiles = listTsFiles(path.join(repoRoot, "src/samples")).filter(
    (file) => path.basename(file.path) !== "demo.ts",
  );

  assertNoForbiddenImports(sampleFiles, [
    {
      label: "non-demo samples must not import runtime",
      matches: importsPathSegment("runtime"),
    },
  ]);
});

test("runtime does not import tests", () => {
  const runtimeFiles = listTsFiles(path.join(repoRoot, "src/runtime"));

  assertNoForbiddenImports(runtimeFiles, [
    {
      label: "runtime must not import tests",
      matches: importsPathSegment("tests"),
    },
  ]);
});
