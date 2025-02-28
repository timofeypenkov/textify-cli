#!/usr/bin/env ts-node
import * as fs from "fs";
import * as path from "path";
import ignore from "ignore";
import * as readline from "readline";

interface Config {
  includeExtensions: string[];
  excludeExtensions: string[];
  includeDirs: string[];
  excludeDirs: string[];
  maxFilesWarning: number;
}

const defaultConfig: Config = {
  includeExtensions: [".ts", ".tsx", ".js", ".jsx"],
  excludeExtensions: [".log", ".md"],
  includeDirs: ["."],
  excludeDirs: ["node_modules", ".git", "dist", "build"],
  maxFilesWarning: 100,
};

export class Textify {
  private config: Config = defaultConfig;
  private gitignore: any;
  private outputDir = path.join(process.cwd(), "textify");
  private outputFileBase = "output.txt";

  constructor() {
    this.loadConfig();
    this.loadGitignore();
  }

  private loadConfig() {
    const configPath = path.join(process.cwd(), "textify.config.json");
    try {
      const configData = fs.readFileSync(configPath, "utf-8");
      this.config = { ...defaultConfig, ...JSON.parse(configData) };
    } catch {
      console.log("Config file not found, using defaults");
    }
  }

  private loadGitignore() {
    const gitignorePath = path.join(process.cwd(), ".gitignore");
    this.gitignore = ignore();
    try {
      const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
      this.gitignore.add(gitignoreContent);
    } catch {
      console.log("No .gitignore found, proceeding with config only");
    }
  }

  private async getFilesCount(): Promise<number> {
    let count = 0;
    for (const dir of this.config.includeDirs) {
      const fullPath = path.resolve(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) continue;
      count += await this.countFilesInDir(fullPath);
    }
    return count;
  }

  private async countFilesInDir(dir: string): Promise<number> {
    let count = 0;
    const files = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (this.shouldSkip(fullPath)) continue;

      if (file.isDirectory()) {
        count += await this.countFilesInDir(fullPath);
      } else if (this.isValidFile(fullPath)) {
        count++;
      }
    }
    return count;
  }

  private shouldSkip(filePath: string): boolean {
    const relativePath = path.relative(process.cwd(), filePath);
    if (this.gitignore?.ignores(relativePath)) return true;

    const ext = path.extname(filePath);
    if (this.config.excludeExtensions.includes(ext)) return true;
    if (
      !this.config.includeExtensions.includes(ext) &&
      !fs.statSync(filePath).isDirectory()
    )
      return true;

    const fullPath = path.resolve(process.cwd(), filePath);

    // Сначала проверяем исключения из excludeDirs
    const isExcluded = this.config.excludeDirs.some((excludeDir) => {
      const excludePath = path.resolve(process.cwd(), excludeDir);
      return (
        fullPath === excludePath || fullPath.startsWith(excludePath + path.sep)
      );
    });
    if (isExcluded) return true;

    // Проверяем, входит ли путь в includeDirs
    const isIncluded = this.config.includeDirs.some((includeDir) => {
      const includePath = path.resolve(process.cwd(), includeDir);
      return (
        fullPath.startsWith(includePath + path.sep) || fullPath === includePath
      );
    });

    // Если путь не входит в includeDirs, пропускаем его
    return !isIncluded;
  }

  private isValidFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    return (
      this.config.includeExtensions.includes(ext) &&
      !this.config.excludeExtensions.includes(ext)
    );
  }

  private getNextOutputFileName(): string {
    let counter = 0;
    let fileName = this.outputFileBase;

    while (fs.existsSync(path.join(this.outputDir, fileName))) {
      counter++;
      fileName = `${path.basename(this.outputFileBase, ".txt")}.${counter.toString().padStart(3, "0")}.txt`;
    }
    return fileName;
  }

  private async processFiles(outputStream: fs.WriteStream) {
    console.log("Collecting files:");
    for (const dir of this.config.includeDirs) {
      const fullPath = path.resolve(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        console.log(`Directory ${dir} does not exist, skipping`);
        continue;
      }
      const relativeDir = path.relative(process.cwd(), fullPath) || ".";
      console.log(`${relativeDir}/`);
      await this.processDir(fullPath, outputStream, 1);
    }
  }

  private async processDir(
    dir: string,
    outputStream: fs.WriteStream,
    depth: number,
  ) {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (this.shouldSkip(fullPath)) continue;

      const relativePath = path.relative(process.cwd(), fullPath);
      const indent = "  ".repeat(depth);

      if (file.isDirectory()) {
        console.log(`${indent}${file.name}/`);
        await this.processDir(fullPath, outputStream, depth + 1);
      } else if (this.isValidFile(fullPath)) {
        console.log(`${indent}${file.name}`);
        const content = await fs.promises.readFile(fullPath, "utf-8");
        outputStream.write(`// ${relativePath}\n${content}\n\n`);
      }
    }
  }

  public async run() {
    const totalFiles = await this.getFilesCount();

    if (totalFiles > this.config.maxFilesWarning) {
      console.log(
        `Warning: Found ${totalFiles} files exceeding limit of ${this.config.maxFilesWarning}`,
      );
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) =>
        rl.question("Continue? (y/n): ", resolve),
      );
      rl.close();

      if (answer.toLowerCase() !== "y") {
        console.log("Aborted by user");
        return;
      }
    }

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir);
    }

    const outputFile = path.join(this.outputDir, this.getNextOutputFileName());
    const outputStream = fs.createWriteStream(outputFile);

    await this.processFiles(outputStream);
    outputStream.end();
    console.log(`Output written to ${outputFile}`);
  }
}

export async function main() {
  const textify = new Textify();
  await textify.run();
}

main().catch(console.error);
