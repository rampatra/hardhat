import type { HardhatConfig } from "@ignored/hardhat-vnext-core/types/config";
import type { NewTaskActionFunction } from "@ignored/hardhat-vnext-core/types/tasks";

import { resolve } from "node:path";
import { run } from "node:test";
import "tsx";

import hardhatTestReporter from "@ignored/hardhat-vnext-node-test-reporter";
import { getAllFilesMatching } from "@ignored/hardhat-vnext-utils/fs";

interface TestActionArguments {
  testFiles: string[];
  only: boolean;
}

function isTypescriptFile(path: string): boolean {
  return /\.(ts|cts|mts)$/i.test(path);
}

function isJavascriptFile(path: string): boolean {
  return /\.(js|cjs|mjs)$/i.test(path);
}

async function getTestFiles(
  testFiles: string[],
  config: HardhatConfig,
): Promise<string[]> {
  if (testFiles.length !== 0) {
    const testFilesAbsolutePaths = testFiles.map((x) =>
      resolve(process.cwd(), x),
    );

    return testFilesAbsolutePaths;
  }

  return getAllFilesMatching(
    config.paths.tests,
    (f) => isJavascriptFile(f) || isTypescriptFile(f),
  );
}

const runScriptWithHardhat: NewTaskActionFunction<TestActionArguments> = async (
  { testFiles, only },
  hre,
) => {
  const files = await getTestFiles(testFiles, hre.config);

  if (files.some((f) => isTypescriptFile(f))) {
    // @ts-expect-error -- typescript will complain about lack of type info for this import
    // but we don't need it, we just need to load the module to run typescript tests
    await import("ts-node/register/transpile-only");
  }

  run({ files, only }).compose(hardhatTestReporter).pipe(process.stdout);
};

export default runScriptWithHardhat;
