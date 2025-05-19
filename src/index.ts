#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import JSZip from 'jszip';
import ora from 'ora';
import pMap from 'p-map';
import {
  getDirectoryContentViaContentsApi,
  getDirectoryContentViaTreesApi,
  type ListGithubDirectoryOptions,
  type TreeResponseObject,
  type ContentsReponseObject,
} from 'list-github-dir-content';

import { downloadFile } from './download.js';
import getRepositoryInfo from './repository-info.js';
import { addCloneCommand } from './clone-command.js';
import logger from './logger.js';

// Define CLI options
program
  .name('github-dir')
  .description('Download GitHub directories directly from terminal')
  .version('1.0.0');

// Add the clone command
addCloneCommand(program);

// Default command (download)
program
  .command('download', { isDefault: true })
  .description('Download a GitHub directory (default command)')
  .argument('<url>', 'GitHub URL of the directory to download')
  .option('-o, --output <path>', 'Output directory or zip file', process.cwd())
  .option('-t, --token <token>', 'GitHub personal access token for private repos')
  .option('-z, --zip', 'Download as zip file instead of extracting files', false)
  .option('-c, --concurrency <number>', 'Number of concurrent downloads', '10')
  .option('-d, --debug', 'Enable debug output', false)
  .option('-p, --plain', 'Display plain output without boxes', false)
  .action((url, options) => {
    // Set debug mode if requested
    logger.setDebugMode(options.debug || false);
    downloadDirectory(url, options);
  });

program.parse(process.argv);

/**
 * Downloads a GitHub directory
 * @param url GitHub URL of the directory to download
 * @param options Command options
 */
async function downloadDirectory(
  url: string,
  options: {
    output?: string;
    token?: string;
    zip?: boolean;
    concurrency?: string;
    debug?: boolean;
    boxed?: boolean;
    plain?: boolean;
  }
): Promise<void> {
  const token = options.token;
  const outputPath = options.output || process.cwd();
  const asZip = options.zip || false;
  const concurrency = parseInt(options.concurrency || '10', 10);
  const usePlainOutput = options.plain || false;
  const useBoxes = !usePlainOutput;
  
  // Set debug mode if requested
  logger.setDebugMode(options.debug || false);

async function listFiles(
  repoListingConfig: ListGithubDirectoryOptions & { getFullData: true }
): Promise<Array<TreeResponseObject | ContentsReponseObject>> {
  const spinner = ora('Fetching file list...').start();
  
  try {
    const files = await getDirectoryContentViaTreesApi(repoListingConfig);

    if (!files.truncated) {
      spinner.succeed(`Found ${files.length} files`);
      return files;
    }

    spinner.info('Warning: It\'s a large repo and this may take a long while just to download the list of files.');
    spinner.start('Fetching complete file list...');
    
    const allFiles = await getDirectoryContentViaContentsApi(repoListingConfig);
    spinner.succeed(`Found ${allFiles.length} files`);
    return allFiles;
  } catch (error) {
    spinner.fail('Failed to fetch file list');
    throw error;
  }
}

async function saveFiles(
  files: Array<TreeResponseObject | ContentsReponseObject & { content: ArrayBuffer }>,
  outputDir: string,
  directoryPrefix: string
): Promise<void> {
  for (const file of files) {
    const filePath = file.path.replace(directoryPrefix, '');
    const fullPath = path.join(outputDir, filePath);
    
    // Create directory if it doesn't exist
    const dirname = path.dirname(fullPath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(fullPath, Buffer.from('content' in file ? file.content : new ArrayBuffer(0)));
  }
}

  
  try {
    // Validate URL
    if (!url.includes('github.com')) {
      logger.error('URL must be a GitHub URL', useBoxes);
      process.exit(1);
    }

    // Get repository info
    const spinner = ora('Analyzing repository...').start();
    const parsedPath = await getRepositoryInfo(url, token);

    if ('error' in parsedPath) {
      spinner.stop();
      logger.error(`Error: ${parsedPath.error}`, useBoxes);
      switch (parsedPath.error) {
        case 'NOT_A_REPOSITORY':
          logger.error('Not a valid GitHub repository URL');
          break;
        case 'NOT_A_DIRECTORY':
          logger.error('URL does not point to a directory');
          break;
        case 'REPOSITORY_NOT_FOUND':
          logger.error('Repository not found. If it\'s private, you need to provide a token with --token');
          break;
        case 'BRANCH_NOT_FOUND':
          logger.error('Branch or reference not found');
          break;
        default:
          logger.error('Unknown error occurred');
      }
      process.exit(1);
    }

    const { user, repository, gitReference, directory, isPrivate } = parsedPath;
    
    // Handle direct repository download
    if ('downloadUrl' in parsedPath) {
      spinner.stop();
      logger.info(`The URL points to an entire repository, not a specific directory`, useBoxes);
      logger.warning('Direct repository download is not supported in this CLI tool.', useBoxes);
      logger.info('Please specify a directory within the repository.');
      process.exit(1);
    }

    spinner.stop();
    
    // Display repository info in a nice box if requested
    if (useBoxes) {
      logger.summary([
        `Repository: ${user}/${repository}`,
        `Branch: ${gitReference || 'default'}`,
        `Directory: /${directory}`
      ]);
    } else {
      logger.success(`Repository: ${user}/${repository}, Branch: ${gitReference || 'default'}, Directory: /${directory}`);
    }

    // Get file list
    const files = await listFiles({
      user,
      repository,
      ref: gitReference,
      directory,
      token,
      getFullData: true,
    });

    if (files.length === 0) {
      logger.info('No files to download', useBoxes);
      process.exit(0);
    }

    // Prepare for download
    const controller = new AbortController();
    const signal = controller.signal;
    
    let downloaded = 0;
    const totalFiles = files.length;
    const progressSpinner = ora(`Downloading 0/${totalFiles} files...`).start();
    
    // Download files
    try {
      // Create an array to store downloaded files with their content
      const downloadedFiles: Array<TreeResponseObject | ContentsReponseObject & { content: ArrayBuffer }> = [];
      
      await pMap(files, async file => {
        try {
          const content = await downloadFile({
            user,
            repository,
            reference: gitReference || '',  // Ensure reference is never undefined
            file,
            isPrivate,
            signal,
            token,
          });
          
          downloaded++;
          progressSpinner.text = `Downloading ${downloaded}/${totalFiles} files... (${file.path})`;
          
          // Add content to the file object
          downloadedFiles.push({ ...file, content });
        } catch (error) {
          logger.error(`Error downloading ${file.path}: ${(error as Error).message}`);
        }
      }, { concurrency });
      
      progressSpinner.stop();
      
      if (useBoxes) {
        logger.success(`Downloaded ${downloaded}/${totalFiles} files`, true);
      } else {
        logger.success(`Downloaded ${downloaded}/${totalFiles} files`);
      }
      
      // Save files
      if (asZip) {
        const zipSpinner = ora('Creating zip file...').start();
        const zip = new JSZip();
        
        // Add files to zip
        for (const file of downloadedFiles) {
          const filePath = file.path.replace(directory ? directory + '/' : '', '');
          zip.file(filePath, 'content' in file ? file.content : new ArrayBuffer(0));
        }
        
        // Generate zip file
        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
        
        // Determine output file path
        let outputFilePath = outputPath;
        if (!outputFilePath.endsWith('.zip')) {
          const defaultName = `${user}-${repository}-${gitReference}${directory ? '-' + directory.replace(/\//g, '-') : ''}`;
          outputFilePath = path.join(outputPath, `${defaultName}.zip`);
        }
        
        // Create directory if it doesn't exist
        const outputDir = path.dirname(outputFilePath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write zip file
        fs.writeFileSync(outputFilePath, zipContent);
        zipSpinner.stop();
        
        if (useBoxes) {
          logger.summary([
            `Successfully created ZIP archive!`,
            `Files: ${downloaded}/${totalFiles}`,
            `Location: ${path.resolve(outputFilePath)}`
          ]);
        } else {
          logger.success(`Saved zip file to ${outputFilePath}`);
        }
      } else {
        const extractSpinner = ora('Extracting files...').start();
        
        // Determine output directory
        let outputDir = outputPath;
        if (fs.existsSync(outputDir) && !fs.statSync(outputDir).isDirectory()) {
          console.error(`Error: Output path ${outputDir} is not a directory`);
          process.exit(1);
        }
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save files to disk
        await saveFiles(downloadedFiles, outputDir, directory ? directory + '/' : '');
        extractSpinner.stop();
        
        if (useBoxes) {
          logger.summary([
            `Successfully extracted files!`,
            `Files: ${downloaded}/${totalFiles}`,
            `Location: ${path.resolve(outputDir)}`
          ]);
        } else {
          logger.success(`Extracted files to ${outputDir}`);
        }
      }
      
    } catch (error) {
      controller.abort();
      progressSpinner.stop();
      logger.error(`Download failed: ${(error as Error).message}`, useBoxes);
      process.exit(1);
    }
    
  } catch (error) {
    logger.error(`Error: ${(error as Error).message}`, useBoxes);
    process.exit(1);
  }
}

// The program.parse() call at the top of the file handles command-line parsing
