# Textify-CLI

A command-line utility to concatenate source files from specified project directories into a single text file. Useful for creating a unified view of your codebase, documentation, or analysis.

# Features

- Recursively scans directories for files with specified extensions.
- Supports inclusion/exclusion of directories and file types.
- Integrates with .gitignore to skip ignored files.
- Warns when processing a large number of files, with an option to confirm or abort.
- Outputs results to a numbered file in the textify directory.

# Installation

You can install textify-cli globally to use it across projects or locally within a specific project.

## Global Installation

`npm install -g textify-cli`

## Local Installation

`npm install textify-cli`

Then add a script to your package.json:

```
{

"scripts": {

"textify": "textify-cli"

}

}
```

# Usage

Run the utility in your project directory:

### Global Usage

`textify-cli`

### Local Usage

`npm run textify`

The utility will:

1. Scan the directories specified in the config (defaults to the current directory).
2. Collect files matching the included extensions (e.g., .ts, .js).
3. Skip excluded directories (e.g., node_modules, .git) and file types (e.g., .log, .md).
4. Write the contents to a file in the textify directory (e.g., textify/output.txt).

If more than 50 files are found (configurable), it will prompt for confirmation.

# Configuration

You can customize the behavior by creating a `textify.config.json` file in your project root. If no config file is found, defaults
are used.

## Default Configuration

```json
{
  "includeExtensions": [".ts", ".tsx", ".js", ".jsx", ".json"],
  "excludeExtensions": [".log", ".md"],
  "includeDirs": ["."],
  "excludeDirs": ["textify", "node_modules", ".git", "dist", "build"],
  "maxFilesWarning": 50
}
```

## Custom Configuration Example

To scan only a src directory and increase the warning threshold:

```json
{
  "includeExtensions": [".ts", ".js"],
  "excludeExtensions": [".log"],
  "includeDirs": ["src"],
  "excludeDirs": ["node_modules", "dist"],
  "maxFilesWarning": 100
}
```

- includeExtensions: File extensions to process.
- excludeExtensions: File extensions to skip.
- includeDirs: Directories to scan (relative to project root).
- excludeDirs: Directories to exclude.
- maxFilesWarning: Number of files triggering a confirmation prompt.

The utility also respects your .gitignore file, skipping any ignored paths.

# Example Output

For a project structure like this:

```text
my-project/
src/
index.ts
utils/
helper.ts
node_modules/
textify.config.json
```

Running textify-cli with the custom config above produces:

```text
Collecting files:

src/
index.ts
utils/
helper.ts

Output written to textify/output.txt

The textify/output.txt file will contain:

// src/index.ts
[contents of index.ts]

// src/utils/helper.ts
[contents of helper.ts]

If output.txt already exists, it will create output.001.txt, output.002.txt, etc.
```

# Development

To contribute or modify the utility:

1. Clone the repository: `git clone [https://github.com/timofeypenkov/textify-cli.git](https://github.com/timofeypenkov/textify-cli.git) cd textify-cli`
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Test locally: `npm link textify-cli`

# License

MIT License. See LICENSE for details.

# Issues

Report bugs or suggest features at [https://github.com/timofeypenkov/textify-cli/issues](https://github.com/timofeypenkov/textify-cli/issues).
