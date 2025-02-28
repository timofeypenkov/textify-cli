#!/usr/bin/env ts-node
export declare class Textify {
    private config;
    private gitignore;
    private outputDir;
    private outputFileBase;
    constructor();
    private loadConfig;
    private loadGitignore;
    private getFilesCount;
    private countFilesInDir;
    private shouldSkip;
    private isValidFile;
    private getNextOutputFileName;
    private processFiles;
    private processDir;
    run(): Promise<void>;
}
export declare function main(): Promise<void>;
