import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import ora from 'ora';
import {
  getDirectoryContentViaContentsApi,
  getDirectoryContentViaTreesApi,
  type ListGithubDirectoryOptions,
  type TreeResponseObject,
  type ContentsReponseObject,
} from 'list-github-dir-content';
import pMap from 'p-map';

import { downloadFile } from './download.js';
import getRepositoryInfo from './repository-info.js';
import logger from './logger.js';

/**
 * Adds the clone command to the provided commander program
 * @param program The commander program to add the clone command to
 */
export function addCloneCommand(program: Command): void {
  program
    .command('clone')
    .description('Clone a GitHub directory to a specific folder')
    .argument('<url>', 'GitHub URL of the directory to clone')
    .argument('[destination]', 'Destination folder (defaults to current directory)')
    .option('-t, --token <token>', 'GitHub personal access token for private repos')
    .option('-c, --concurrency <number>', 'Number of concurrent downloads', '10')
    .option('-f, --force', 'Overwrite existing files', false)
    .option('-d, --debug', 'Enable debug output', false)
    .option('-p, --plain', 'Display plain output without boxes', false)
    .action(async (url, destination, options) => {
      logger.setDebugMode(options.debug || false);
      await cloneDirectory(url, destination, options);
    });
}

/**
 * Clones a GitHub directory to a specific folder
 * @param url GitHub URL of the directory to clone
 * @param destination Destination folder (defaults to current directory)
 * @param options Command options
 */
export async function cloneDirectory(
  url: string,
  destination?: string,
  options: {
    token?: string;
    concurrency?: string | number;
    force?: boolean;
    debug?: boolean;
    boxed?: boolean;
    plain?: boolean;
  } = {}
): Promise<void> {
  const token = options.token;
  const concurrency = typeof options.concurrency === 'string' 
    ? parseInt(options.concurrency, 10) 
    : (options.concurrency || 10);
  const force = options.force || false;
  const usePlainOutput = options.plain || false;
  const useBoxes = !usePlainOutput;
  
  logger.setDebugMode(options.debug || false);
  
  try {
    if (!url.includes('github.com')) {
      logger.error('URL must be a GitHub URL', useBoxes);
      process.exit(1);
    }

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
    
    if ('downloadUrl' in parsedPath) {
      spinner.stop();
      logger.info(`The URL points to an entire repository, not a specific directory`, useBoxes);
      logger.warning('This tool is designed to download specific directories. Please specify a directory within the repository.', useBoxes);
      process.exit(1);
    }

    spinner.stop();
    
    if (useBoxes) {
      logger.summary([
        `Repository: ${user}/${repository}`,
        `Branch: ${gitReference || 'default'}`,
        `Directory: /${directory}`
      ]);
    } else {
      logger.success(`Repository: ${user}/${repository}, Branch: ${gitReference || 'default'}, Directory: /${directory}`);
    }

    let destFolder = destination || '.';
    
    if (!destination) {
      const dirName = directory.split('/').pop() || repository;
      destFolder = path.join('.', dirName);
    }
    
    if (fs.existsSync(destFolder)) {
      if (!fs.statSync(destFolder).isDirectory()) {
        logger.error(`Destination ${destFolder} exists and is not a directory`, useBoxes);
        process.exit(1);
      }
      
      const files = fs.readdirSync(destFolder);
      if (files.length > 0 && !force) {
        logger.error(`Destination directory ${destFolder} is not empty. Use --force to overwrite.`, useBoxes);
        process.exit(1);
      }
    } else {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    spinner.text = 'Fetching file list...';
    spinner.start();
    
    const files = await listFiles({
      user,
      repository,
      ref: gitReference || '',
      directory,
      token,
      getFullData: true,
    });

    spinner.stop();
    
    if (files.length === 0) {
      logger.info('No files to download', useBoxes);
      process.exit(0);
    }

    if (useBoxes) {
      logger.info(`Found ${files.length} files to download`, true);
    } else {
      logger.success(`Found ${files.length} files`);
    }

    const controller = new AbortController();
    const signal = controller.signal;
    
    let downloaded = 0;
    const totalFiles = files.length;
    const progressSpinner = ora(`Downloading 0/${totalFiles} files...`).start();
    
    try {
      await pMap(files, async file => {
        try {
          const content = await downloadFile({
            user,
            repository,
            reference: gitReference || '',
            file,
            isPrivate,
            signal,
            token,
          });
          
          const filePath = file.path.replace(directory ? directory + '/' : '', '');
          const fullPath = path.join(destFolder, filePath);
          
          const dirname = path.dirname(fullPath);
          if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
          }
          
          fs.writeFileSync(fullPath, Buffer.from(content));
          
          downloaded++;
          progressSpinner.text = `Downloading ${downloaded}/${totalFiles} files... (${file.path})`;
        } catch (error) {
          console.error(`\nError downloading ${file.path}: ${(error as Error).message}`);
        }
      }, { concurrency });
      
      progressSpinner.stop();
      
      if (useBoxes) {
        logger.summary([
          `Successfully cloned GitHub directory!`,
          `Files: ${downloaded}/${totalFiles}`,
          `Location: ${path.resolve(destFolder)}`
        ]);
      } else {
        logger.success(`Cloned ${downloaded}/${totalFiles} files to ${destFolder}`);
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

/**
 * Lists files in a GitHub directory
 * @param repoListingConfig Configuration for listing files
 * @returns Array of file objects
 */
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
