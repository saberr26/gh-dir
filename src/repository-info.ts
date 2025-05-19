import authenticatedFetch from './authenticated-fetch.js';
import logger from './logger.js';

function cleanUrl(url: string) {
  // Handle URL properly by creating a URL object
  try {
    // Extract only the pathname from the URL
    const pathname = new URL(url).pathname;
    
    return pathname
      .replace(/[/]{2,}/g, '/') // Drop double slashes (global replacement)
      .replace(/[/]$/, ''); // Drop trailing slash
  } catch (error) {
    // If URL parsing fails, return the original string with basic cleaning
    return url
      .replace(/https?:\/\/github\.com/i, '') // Remove the github.com part
      .replace(/[/]{2,}/g, '/') // Drop double slashes (global replacement)
      .replace(/[/]$/, ''); // Drop trailing slash
  }
}

async function parsePath(
  user: string,
  repo: string,
  parts: string[],
  token?: string
): Promise<{gitReference: string; directory: string} | void> {
  for (let i = 0; i < parts.length; i++) {
    const gitReference = parts.slice(0, i + 1).join('/');
    // eslint-disable-next-line no-await-in-loop -- One at a time
    if (await checkBranchExists(user, repo, gitReference, token)) {
      return {
        gitReference,
        directory: parts.slice(i + 1).join('/'),
      };
    }
  }
}

export default async function getRepositoryInfo(
  url: string,
  token?: string
): Promise<
  | {error: string}
  | {
      user: string;
      repository: string;
      gitReference?: string;
      directory: string;
      downloadUrl: string;
      isPrivate: boolean;
    }
  | {
      user: string;
      repository: string;
      gitReference: string;
      directory: string;
      isPrivate: boolean;
    }
  > {
  // Clean and normalize the URL
  let cleanedUrl;
  try {
    // First, ensure the URL is properly encoded
    // We need to handle spaces and other special characters that might be in the URL
    const urlObj = new URL(url);
    
    // Use decodeURIComponent and then encodeURIComponent to properly handle spaces
    // This ensures that spaces are encoded as %20 and not as literal spaces
    const decodedPath = decodeURIComponent(urlObj.pathname);
    
    // Clean the path to remove any trailing characters that aren't part of the actual path
    // This handles cases where the URL might have extra characters like spaces at the end
    const cleanedPath = decodedPath.trim();
    
    cleanedUrl = cleanUrl(cleanedPath);
  } catch (error) {
    // If URL parsing fails, try a more basic approach
    cleanedUrl = cleanUrl(url);
  }
  
  // Split the path into components
  const pathParts = cleanedUrl.split('/');
  
  // Filter out any empty strings that might result from double slashes or trailing slashes
  const filteredParts = pathParts.filter(part => part.length > 0);
  
  // Now extract the user, repository, type, and remaining parts
  const user = filteredParts[0];
  const repository = filteredParts[1];
  const type = filteredParts[2];
  const parts = filteredParts.slice(3);

  if (!user || !repository) {
    return {error: 'NOT_A_REPOSITORY'};
  }

  if (type && type !== 'tree') {
    return {error: 'NOT_A_DIRECTORY'};
  }

  const repoInfoResponse = await authenticatedFetch(
    `https://api.github.com/repos/${user}/${repository}`,
    token
  );

  if (repoInfoResponse.status === 404) {
    return {error: 'REPOSITORY_NOT_FOUND'};
  }

  const {private: isPrivate} = await repoInfoResponse.json() as {private: boolean};

  if (parts.length === 0) {
    return {
      user,
      repository,
      directory: '',
      isPrivate,
      downloadUrl: `https://api.github.com/repos/${user}/${repository}/zipball`,
    };
  }

  if (parts.length === 1) {
    return {
      user,
      repository,
      gitReference: parts[0],
      directory: '',
      isPrivate,
      downloadUrl: `https://api.github.com/repos/${user}/${repository}/zipball/${parts[0]}`,
    };
  }

  const parsedPath = await parsePath(user, repository, parts, token);
  if (!parsedPath) {
    return {error: 'BRANCH_NOT_FOUND'};
  }

  return {
    user,
    repository,
    isPrivate,
    ...parsedPath,
  };
}

async function checkBranchExists(user: string, repo: string, gitReference: string, token?: string): Promise<boolean> {
  try {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/commits/${gitReference}?per_page=1`;
    logger.debug(`Checking branch existence: ${apiUrl}`);
    const response = await authenticatedFetch(apiUrl, token, {method: 'HEAD'});
    return response.ok;
  } catch (error) {
    logger.debug(`Error checking branch existence: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
