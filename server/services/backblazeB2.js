import crypto from 'node:crypto';

const DEFAULT_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_REQUEST_RETRIES = 2;
const DATA_URL_PATTERN =
  /^data:(image\/(?:jpeg|jpg|png|webp|svg\+xml));base64,([A-Za-z0-9+/=]+)$/i;

function readConfig() {
  return {
    keyId: String(
      process.env.B2_APPLICATION_KEY_ID ||
        process.env.BACKBLAZE_B2_APPLICATION_KEY_ID ||
        process.env.B2_KEY_ID ||
        '',
    ).trim(),
    applicationKey: String(
      process.env.B2_APPLICATION_KEY ||
        process.env.BACKBLAZE_B2_APPLICATION_KEY ||
        process.env.B2_KEY ||
        '',
    ).trim(),
    bucketId: String(
      process.env.B2_BUCKET_ID || process.env.BACKBLAZE_B2_BUCKET_ID || '',
    ).trim(),
    bucketName: String(
      process.env.B2_BUCKET_NAME || process.env.BACKBLAZE_B2_BUCKET_NAME || '',
    )
      .trim()
      .replace(/\s+/g, ''),
    publicBaseUrl: String(
      process.env.B2_PUBLIC_BASE_URL ||
        process.env.BACKBLAZE_B2_PUBLIC_BASE_URL ||
        '',
    ).trim(),
    filePrefix: String(
      process.env.B2_FILE_PREFIX ||
        process.env.BACKBLAZE_B2_FILE_PREFIX ||
        'doctor-avatars',
    )
      .trim()
      .replace(/^\/+|\/+$/g, ''),
    maxImageBytes: Number(
      process.env.B2_MAX_IMAGE_BYTES || DEFAULT_MAX_IMAGE_BYTES,
    ),
    requestTimeoutMs: Number(
      process.env.B2_REQUEST_TIMEOUT_MS || DEFAULT_REQUEST_TIMEOUT_MS,
    ),
    requestRetries: Number(
      process.env.B2_REQUEST_RETRIES || DEFAULT_REQUEST_RETRIES,
    ),
  };
}

export function getBackblazeConfig() {
  return readConfig();
}

export function isBackblazeConfigured() {
  const config = readConfig();
  return Boolean(
    config.keyId &&
    config.applicationKey &&
    config.bucketId &&
    config.bucketName,
  );
}

function parseJsonResponse(response, fallbackMessage) {
  return response.text().then((rawText) => {
    let payload = null;
    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch (_error) {
        payload = null;
      }
    }

    if (!response.ok) {
      const detail =
        payload?.message ||
        payload?.code ||
        payload?.status ||
        rawText ||
        fallbackMessage;
      throw new Error(String(detail || fallbackMessage));
    }

    return payload || {};
  });
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createTimeoutSignal(timeoutMs) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function isBackblazeNetworkError(error) {
  const code = String(error?.code || '')
    .trim()
    .toUpperCase();
  const causeCode = String(error?.cause?.code || '')
    .trim()
    .toUpperCase();
  const name = String(error?.name || '')
    .trim()
    .toLowerCase();
  const causeName = String(error?.cause?.name || '')
    .trim()
    .toLowerCase();
  const message = String(error?.message || '')
    .trim()
    .toLowerCase();
  const causeMessage = String(error?.cause?.message || '')
    .trim()
    .toLowerCase();

  return (
    [code, causeCode].some((value) =>
      [
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        'EHOSTUNREACH',
        'ENETUNREACH',
        'EAI_AGAIN',
        'UND_ERR_CONNECT_TIMEOUT',
        'UND_ERR_HEADERS_TIMEOUT',
        'UND_ERR_BODY_TIMEOUT',
      ].includes(value),
    ) ||
    name.includes('timeout') ||
    causeName.includes('timeout') ||
    message.includes('fetch failed') ||
    message.includes('timeout') ||
    causeMessage.includes('timeout') ||
    causeMessage.includes('fetch failed')
  );
}

function toBackblazeServiceError(error, fallbackMessage) {
  if (error?.service === 'backblaze' && error?.statusCode) {
    return error;
  }

  const message = isBackblazeNetworkError(error)
    ? 'Doctor image storage is temporarily unreachable. Check the server internet connection and Backblaze availability, then try again.'
    : fallbackMessage;

  const wrappedError = new Error(message);
  wrappedError.cause = error;
  wrappedError.statusCode = 503;
  wrappedError.exposeMessage = true;
  wrappedError.service = 'backblaze';
  return wrappedError;
}

async function fetchBackblaze(url, options = {}, fallbackMessage) {
  const config = readConfig();
  const timeoutMs =
    Number.isFinite(config.requestTimeoutMs) && config.requestTimeoutMs > 0
      ? config.requestTimeoutMs
      : DEFAULT_REQUEST_TIMEOUT_MS;
  const retries =
    Number.isFinite(config.requestRetries) && config.requestRetries >= 0
      ? config.requestRetries
      : DEFAULT_REQUEST_RETRIES;

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, {
        ...options,
        signal: options.signal || createTimeoutSignal(timeoutMs),
      });
    } catch (error) {
      lastError = error;

      if (!isBackblazeNetworkError(error) || attempt >= retries) {
        throw toBackblazeServiceError(error, fallbackMessage);
      }

      await delay(Math.min(750 * (attempt + 1), 2500));
    }
  }

  throw toBackblazeServiceError(lastError, fallbackMessage);
}

async function requestBackblazeJson(url, options = {}, fallbackMessage) {
  try {
    const response = await fetchBackblaze(url, options, fallbackMessage);
    return await parseJsonResponse(response, fallbackMessage);
  } catch (error) {
    throw toBackblazeServiceError(error, fallbackMessage);
  }
}

function parseImageDataUrl(
  dataUrl = '',
  maxImageBytes = DEFAULT_MAX_IMAGE_BYTES,
) {
  const match = String(dataUrl || '').match(DATA_URL_PATTERN);
  if (!match) {
    throw new Error('Use a valid JPG, PNG, WEBP, or SVG image.');
  }

  const contentType =
    match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) {
    throw new Error('Selected image is empty.');
  }

  if (buffer.length > maxImageBytes) {
    throw new Error('Use a smaller image before uploading.');
  }

  return { buffer, contentType };
}

function extensionForType(contentType = 'image/jpeg') {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/svg+xml') return 'svg';
  return 'jpg';
}

function buildFileName(prefix = 'doctor-avatars', contentType = 'image/jpeg') {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const extension = extensionForType(contentType);
  const safePrefix = prefix || 'doctor-avatars';
  return `${safePrefix}/${year}/${month}/${crypto.randomUUID()}.${extension}`;
}

async function authorizeAccount(config) {
  const credentials = Buffer.from(
    `${config.keyId}:${config.applicationKey}`,
  ).toString('base64');

  return requestBackblazeJson(
    'https://api.backblazeb2.com/b2api/v3/b2_authorize_account',
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    },
    'Doctor image storage is temporarily unavailable. Please try again.',
  );
}

function resolveDownloadUrl(auth = {}) {
  return String(
    auth?.apiInfo?.storageApi?.downloadUrl || auth?.downloadUrl || '',
  )
    .trim()
    .replace(/\/+$/, '');
}

async function getUploadTarget(
  apiUrl = '',
  authorizationToken = '',
  bucketId = '',
) {
  const endpoint = `${apiUrl}/b2api/v4/b2_get_upload_url?bucketId=${encodeURIComponent(
    bucketId,
  )}`;

  return requestBackblazeJson(
    endpoint,
    {
      method: 'GET',
      headers: {
        Authorization: authorizationToken,
        Accept: 'application/json',
      },
    },
    'Doctor image storage is temporarily unavailable. Please try again.',
  );
}

async function listFileNames(
  apiUrl = '',
  authorizationToken = '',
  bucketId = '',
  { startFileName = '', prefix = '', maxFileCount = 100 } = {},
) {
  const params = new URLSearchParams({
    bucketId,
    maxFileCount: String(maxFileCount),
  });

  if (startFileName) {
    params.set('startFileName', startFileName);
  }

  if (prefix) {
    params.set('prefix', prefix);
  }

  return requestBackblazeJson(
    `${apiUrl}/b2api/v4/b2_list_file_names?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: authorizationToken,
        Accept: 'application/json',
      },
    },
    'Doctor image storage is temporarily unavailable. Please try again.',
  );
}

async function deleteFileVersion(
  apiUrl = '',
  authorizationToken = '',
  { fileName = '', fileId = '' } = {},
) {
  return requestBackblazeJson(
    `${apiUrl}/b2api/v4/b2_delete_file_version`,
    {
      method: 'POST',
      headers: {
        Authorization: authorizationToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, fileId }),
    },
    'Doctor image storage is temporarily unavailable. Please try again.',
  );
}

function buildPublicUrl({
  publicBaseUrl = '',
  downloadUrl = '',
  bucketName = '',
  fileName = '',
}) {
  const baseUrl = String(publicBaseUrl || downloadUrl || '')
    .trim()
    .replace(/\/+$/, '');
  if (!baseUrl || !bucketName || !fileName) {
    return '';
  }

  return `${baseUrl}/file/${encodeURIComponent(bucketName)}/${fileName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
}

export function extractBackblazeFileNameFromUrl(fileUrl = '') {
  const config = readConfig();
  const url = String(fileUrl || '').trim();
  if (!url || !config.bucketName) {
    return '';
  }

  try {
    const parsed = new URL(url);
    const marker = `/file/${encodeURIComponent(config.bucketName)}/`;
    const pathname = parsed.pathname || '';
    const index = pathname.indexOf(marker);
    if (index === -1) {
      return '';
    }

    const encodedPath = pathname.slice(index + marker.length);
    return encodedPath
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
  } catch (_error) {
    return '';
  }
}

export function buildBackblazeProxyUrl(fileName = '', version = '') {
  const normalized = String(fileName || '')
    .trim()
    .replace(/^\/+/, '');
  if (!normalized) {
    return '';
  }

  const search = new URLSearchParams({
    file: normalized,
  });

  const normalizedVersion = String(version || '').trim();
  if (normalizedVersion) {
    search.set('v', normalizedVersion);
  }

  return `/api/doctor/avatar-file?${search.toString()}`;
}

export async function downloadBackblazeFileByName(fileName = '') {
  const config = readConfig();
  if (!isBackblazeConfigured()) {
    throw new Error(
      'Doctor image storage is not configured. Add your Backblaze B2 keys first.',
    );
  }

  const normalizedFileName = String(fileName || '')
    .trim()
    .replace(/^\/+/, '');
  if (!normalizedFileName) {
    throw new Error('Avatar file path is required.');
  }

  const auth = await authorizeAccount(config);
  const downloadUrl = resolveDownloadUrl(auth);
  if (!downloadUrl || !config.bucketName) {
    throw new Error('Backblaze download URL is not available.');
  }

  const encodedFileName = normalizedFileName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const response = await fetchBackblaze(
    `${downloadUrl}/file/${encodeURIComponent(config.bucketName)}/${encodedFileName}`,
    {
      method: 'GET',
      headers: {
        Authorization: auth.authorizationToken || '',
      },
    },
    'Doctor image storage is temporarily unavailable. Please try again.',
  );

  if (!response.ok) {
    const rawText = await response.text().catch(() => '');
    throw new Error(rawText || 'Backblaze file download failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType:
      response.headers.get('content-type') || 'application/octet-stream',
    cacheControl:
      response.headers.get('cache-control') || 'public, max-age=3600',
  };
}

export async function deleteBackblazeFileByName(fileName = '') {
  const config = readConfig();
  if (!isBackblazeConfigured()) {
    throw new Error(
      'Doctor image storage is not configured. Add your Backblaze B2 keys first.',
    );
  }

  const normalizedFileName = String(fileName || '')
    .trim()
    .replace(/^\/+/, '');
  if (!normalizedFileName) {
    throw new Error('Avatar file path is required.');
  }

  const auth = await authorizeAccount(config);
  const apiUrl = auth.apiInfo?.storageApi?.apiUrl || '';
  if (!apiUrl) {
    throw new Error('Backblaze API URL is not available.');
  }

  const listing = await listFileNames(
    apiUrl,
    auth.authorizationToken || '',
    config.bucketId,
    {
      startFileName: normalizedFileName,
      prefix: normalizedFileName,
      maxFileCount: 10,
    },
  );

  const target = (listing?.files || []).find(
    (file) => file?.fileName === normalizedFileName,
  );

  if (!target?.fileId) {
    return { deleted: false, fileName: normalizedFileName };
  }

  await deleteFileVersion(apiUrl, auth.authorizationToken || '', {
    fileName: normalizedFileName,
    fileId: target.fileId,
  });

  return {
    deleted: true,
    fileName: normalizedFileName,
    fileId: target.fileId,
  };
}

export async function uploadDoctorAvatarToBackblaze({
  imageDataUrl,
  filePrefix,
} = {}) {
  const config = readConfig();
  if (!isBackblazeConfigured()) {
    throw new Error(
      'Doctor image storage is not configured. Add your Backblaze B2 keys first.',
    );
  }

  const { buffer, contentType } = parseImageDataUrl(
    imageDataUrl,
    config.maxImageBytes,
  );
  const fileName = buildFileName(filePrefix || config.filePrefix, contentType);
  const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');

  const auth = await authorizeAccount(config);
  const uploadTarget = await getUploadTarget(
    auth.apiInfo?.storageApi?.apiUrl || '',
    auth.authorizationToken || '',
    config.bucketId,
  );

  const response = await fetchBackblaze(
    uploadTarget.uploadUrl,
    {
      method: 'POST',
      headers: {
        Authorization:
          uploadTarget.authorizationToken ||
          uploadTarget.uploadAuthorizationToken ||
          '',
        'Content-Type': contentType,
        'Content-Length': String(buffer.length),
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'X-Bz-Content-Sha1': sha1,
        'X-Bz-Info-b2-cache-control': encodeURIComponent(
          'public,max-age=31536000,immutable',
        ),
      },
      body: buffer,
    },
    'Doctor image storage is temporarily unavailable. Please try again.',
  );

  const uploadResult = await parseJsonResponse(
    response,
    'Backblaze file upload failed',
  );
  const publicUrl = buildPublicUrl({
    publicBaseUrl: config.publicBaseUrl,
    downloadUrl: resolveDownloadUrl(auth),
    bucketName: config.bucketName,
    fileName,
  });

  return {
    fileId: uploadResult.fileId || '',
    fileName,
    contentType,
    size: buffer.length,
    url: publicUrl,
  };
}
