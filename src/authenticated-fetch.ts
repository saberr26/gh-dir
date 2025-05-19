import logger from './logger.js';

export default async function authenticatedFetch(
  url: string,
  token?: string,
  options: { signal?: AbortSignal; method?: 'HEAD' } = {}
): Promise<Response> {
  const { signal, method } = options;
  
  try {
    logger.debug(`Fetching URL: ${url}`);
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Add a user agent to avoid some API limitations
    headers['User-Agent'] = 'GitHub-Directory-Downloader';
    
    const response = await fetch(url, {
      method,
      signal,
      headers,
    });

    // Log response status
    logger.debug(`Response status for ${url}: ${response.status}`);

    switch (response.status) {
      case 401: {
        throw new Error('Invalid token');
      }

      case 403:
      case 429: {
        // See https://developer.github.com/v3/#rate-limiting
        if (response.headers.get('X-RateLimit-Remaining') === '0') {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          let resetMessage = '';
          
          if (resetTime) {
            const resetDate = new Date(parseInt(resetTime, 10) * 1000);
            const minutes = Math.ceil((resetDate.getTime() - Date.now()) / 60000);
            resetMessage = ` Rate limit will reset in approximately ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
          }
          
          logger.error(`GitHub API rate limit exceeded.${resetMessage} Try using a personal access token with --token option.`);
          throw new Error(`Rate limit exceeded`);
        }
        
        // If it's a 403 but not rate-limited, provide more context
        if (response.status === 403) {
          const responseText = await response.text();
          logger.error(`GitHub API returned 403 Forbidden: ${responseText}`);
          throw new Error(`GitHub API access forbidden: ${responseText}`);
        }
        
        break;
      }

      case 404: {
        logger.error(`Resource not found: ${url}`);
        break;
      }

      default:
        // Log any other non-200 responses
        if (!response.ok) {
          logger.error(`Unexpected response status: ${response.status} for URL: ${url}`);
        }
    }

    return response;
  } catch (error) {
    // Handle network errors and other exceptions
    if (error instanceof Error) {
      logger.error(`Fetch error for ${url}: ${error.message}`);
      throw new Error(`Fetch failed: ${error.message}`);
    }
    throw error;
  }
}
