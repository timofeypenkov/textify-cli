import * as fs from "fs";
import * as path from "path";
import { Textify } from "./textify";

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(), // Добавляем мок для statSync
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
  },
}));

describe("Textify", () => {
  let textify: Textify;
  let mockReaddir: jest.Mock;
  let mockReadFile: jest.Mock;
  let mockExistsSync: jest.Mock;
  let mockStatSync: jest.Mock;

  beforeEach(() => {
    textify = new Textify();
    mockReaddir = fs.promises.readdir as jest.Mock;
    mockReadFile = fs.promises.readFile as jest.Mock;
    mockExistsSync = fs.existsSync as jest.Mock;
    mockStatSync = fs.statSync as jest.Mock;
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error("File not found");
    }); // Мок для config и gitignore
    jest.clearAllMocks();
  });

  test("loads default config when no config file exists", () => {
    expect(textify["config"]).toEqual({
      includeExtensions: [".ts", ".tsx", ".js", ".jsx"],
      excludeExtensions: [".log", ".md"],
      includeDirs: ["."],
      excludeDirs: ["node_modules", ".git", "dist", "build"],
      maxFilesWarning: 100,
    });
  });

  test("shouldSkip returns true for excluded extensions", () => {
    expect(textify["shouldSkip"]("test.log")).toBe(true);
    expect(textify["shouldSkip"]("test.md")).toBe(true);
  });

  test("shouldSkip returns false for included extensions", () => {
    mockStatSync.mockReturnValue({
      isDirectory: () => false,
      isFile: () => true,
    });
    expect(textify["shouldSkip"]("test.ts")).toBe(false);
    expect(textify["shouldSkip"]("test.tsx")).toBe(false);
  });

  test("shouldSkip returns true for gitignore", () => {
    textify["gitignore"] = { ignores: jest.fn().mockReturnValue(true) };
    expect(textify["shouldSkip"]("ignored/file.ts")).toBe(true);
  });

  test("shouldSkip returns true for excludeDirs", () => {
    textify["config"] = {
      ...textify["config"],
      includeDirs: ["src"],
      excludeDirs: ["src/api", "node_modules"],
    };
    mockStatSync.mockReturnValue({ isDirectory: () => true });
    expect(textify["shouldSkip"](path.resolve("src/api/test.ts"))).toBe(true);
    expect(textify["shouldSkip"](path.resolve("node_modules/test.ts"))).toBe(
      true,
    );
  });

  test("shouldSkip returns false for nested files within includeDirs", () => {
    textify["config"] = {
      ...textify["config"],
      includeDirs: ["src"],
      excludeDirs: ["src/api", "node_modules"],
    };
    mockStatSync.mockReturnValue({
      isDirectory: () => false,
      isFile: () => true,
    });
    expect(textify["shouldSkip"](path.resolve("src/utils/test.ts"))).toBe(
      false,
    );
  });

  test("getNextOutputFileName increments filename when file exists", () => {
    (fs.existsSync as jest.Mock)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const result = textify["getNextOutputFileName"]();
    expect(result).toBe("output.002.txt");
  });

  test("isValidFile validates file extensions correctly", () => {
    expect(textify["isValidFile"]("test.ts")).toBe(true);
    expect(textify["isValidFile"]("test.log")).toBe(false);
    expect(textify["isValidFile"]("test.xyz")).toBe(false);
  });

  test("processFiles and processDir outputs correct structure with spaces", () => {
    const mockOutputStream = {
      write: jest.fn(),
      end: jest.fn(),
    };
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Имитация существования директории src
    mockExistsSync.mockReturnValue(true);

    // Настройка mockStatSync для разных путей
    mockStatSync.mockImplementation((filePath: string) => {
      const relativePath = path.relative(process.cwd(), filePath);
      if (
        relativePath === "src" ||
        relativePath.startsWith("src/utils") ||
        relativePath.startsWith("src/api")
      ) {
        return { isDirectory: () => true, isFile: () => false };
      } else if (
        relativePath === "src/index.ts" ||
        relativePath === "src/utils/helper.ts"
      ) {
        return { isDirectory: () => false, isFile: () => true };
      }
      return { isDirectory: () => false, isFile: () => false };
    });

    // Настройка mockReaddir для src
    mockReaddir.mockImplementation((dirPath: string) => {
      const relativePath = path.relative(process.cwd(), dirPath);
      if (relativePath === "src") {
        return Promise.resolve([
          { name: "index.ts", isDirectory: () => false, isFile: () => true },
          { name: "utils", isDirectory: () => true, isFile: () => false },
          { name: "api", isDirectory: () => true, isFile: () => false },
        ]);
      } else if (relativePath === "src/utils") {
        return Promise.resolve([
          { name: "helper.ts", isDirectory: () => false, isFile: () => true },
        ]);
      } else if (relativePath === "src/api") {
        return Promise.resolve([]); // Пустой массив для api, так как исключено
      }
      return Promise.resolve([]);
    });

    mockReadFile.mockResolvedValue("content");

    textify["config"] = {
      ...textify["config"],
      includeDirs: ["src"],
      excludeDirs: ["src/api", "node_modules"],
    };

    return textify["processFiles"](mockOutputStream as any).then(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith("Collecting files:");
      expect(consoleLogSpy).toHaveBeenCalledWith("src/");
      expect(consoleLogSpy).toHaveBeenCalledWith("  index.ts");
      expect(consoleLogSpy).toHaveBeenCalledWith("  utils/");
      expect(consoleLogSpy).toHaveBeenCalledWith("    helper.ts");
      expect(consoleLogSpy).not.toHaveBeenCalledWith("  api/"); // Исключено
      expect(mockOutputStream.write).toHaveBeenCalledWith(
        "// src/index.ts\ncontent\n\n",
      );
      expect(mockOutputStream.write).toHaveBeenCalledWith(
        "// src/utils/helper.ts\ncontent\n\n",
      );
      expect(mockOutputStream.write).not.toHaveBeenCalledWith(
        expect.stringContaining("src/api"),
      );
    });
  });
});
