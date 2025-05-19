import { type ContentsReponseObject, type TreeResponseObject } from 'list-github-dir-content';
import pRetry, { type FailedAttemptError } from 'p-retry';
import authenticatedFetch from './authenticated-fetch.js';

function escapeFilepath(path: string) {
  return path.replaceAll('#', '%23');
}

async function maybeResponseLfs(response: Response): Promise<boolean> {
  const length = Number(response.headers.get('content-length'));
  if (length > 128 && length < 140) {
    const contents = await response.clone().text();
    return contents.startsWith('version https://git-lfs.github.com/spec/v1');
  }

  return false;
}

type FileRequest = {
  user: string;
  repository: string;
  reference: string;
  file: TreeResponseObject | ContentsReponseObject;
  signal: AbortSignal;
  token?: string;
};

async function fetchPublicFile({
  user,
  repository,
  reference,
  file,
  signal,
  token,
}: FileRequest) {
  const response = await authenticatedFetch(
    `https://raw.githubusercontent.com/${user}/${repository}/${reference}/${escapeFilepath(file.path)}`,
    token,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.statusText} for ${file.path}`);
  }

  const lfsCompatibleResponse = (await maybeResponseLfs(response))
    ? await authenticatedFetch(
        `https://media.githubusercontent.com/media/${user}/${repository}/${reference}/${escapeFilepath(file.path)}`,
        token,
        { signal }
      )
    : response;

  if (!lfsCompatibleResponse.ok) {
    throw new Error(`HTTP ${lfsCompatibleResponse.statusText} for ${file.path}`);
  }

  return lfsCompatibleResponse.arrayBuffer();
}

async function fetchPrivateFile({
  file,
  signal,
  token,
}: FileRequest) {
  const response = await authenticatedFetch(file.url, token, { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.statusText} for ${file.path}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { content } = await response.json();
  
  // Convert base64 to binary
  const binaryString = atob(content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

export async function downloadFile({
  user,
  repository,
  reference,
  file,
  isPrivate,
  signal,
  token,
}: {
  user: string;
  repository: string;
  reference: string;
  isPrivate: boolean;
  file: TreeResponseObject | ContentsReponseObject;
  signal: AbortSignal;
  token?: string;
}): Promise<ArrayBuffer> {
  const fileRequest = {
    user, repository, reference, file, signal, token,
  };
  
  const localDownload = async () =>
    isPrivate
      ? fetchPrivateFile(fileRequest)
      : fetchPublicFile(fileRequest);
      
  const onFailedAttempt = (error: FailedAttemptError) => {
    console.error(
      `Error downloading ${file.path}. Attempt ${error.attemptNumber}. ${error.retriesLeft} retries left.`,
    );
  };

  return pRetry(localDownload, { onFailedAttempt });
}
