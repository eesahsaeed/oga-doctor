import crypto from 'node:crypto';

const DEFAULT_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
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

  const response = await fetch(
    'https://api.backblazeb2.com/b2api/v3/b2_authorize_account',
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    },
  );

  return parseJsonResponse(response, 'Backblaze authorization failed');
}

async function getUploadTarget(
  apiUrl = '',
  authorizationToken = '',
  bucketId = '',
) {
  const endpoint = `${apiUrl}/b2api/v4/b2_get_upload_url?bucketId=${encodeURIComponent(
    bucketId,
  )}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: authorizationToken,
      Accept: 'application/json',
    },
  });

  return parseJsonResponse(response, 'Backblaze upload URL request failed');
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

  const response = await fetch(
    `${apiUrl}/b2api/v4/b2_list_file_names?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: authorizationToken,
        Accept: 'application/json',
      },
    },
  );

  return parseJsonResponse(response, 'Backblaze file listing failed');
}

async function deleteFileVersion(
  apiUrl = '',
  authorizationToken = '',
  { fileName = '', fileId = '' } = {},
) {
  const response = await fetch(`${apiUrl}/b2api/v4/b2_delete_file_version`, {
    method: 'POST',
    headers: {
      Authorization: authorizationToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName, fileId }),
  });

  return parseJsonResponse(response, 'Backblaze file deletion failed');
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

export function buildBackblazeProxyUrl(fileName = '') {
  const normalized = String(fileName || '')
    .trim()
    .replace(/^\/+/, '');
  if (!normalized) {
    return '';
  }

  return `/api/doctor/avatar-file?file=${encodeURIComponent(normalized)}`;
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
  const downloadUrl = String(auth.downloadUrl || '')
    .trim()
    .replace(/\/+$/, '');
  if (!downloadUrl || !config.bucketName) {
    throw new Error('Backblaze download URL is not available.');
  }

  const encodedFileName = normalizedFileName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const response = await fetch(
    `${downloadUrl}/file/${encodeURIComponent(config.bucketName)}/${encodedFileName}`,
    {
      method: 'GET',
      headers: {
        Authorization: auth.authorizationToken || '',
      },
    },
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

  const response = await fetch(uploadTarget.uploadUrl, {
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
  });

  const uploadResult = await parseJsonResponse(
    response,
    'Backblaze file upload failed',
  );
  const publicUrl = buildPublicUrl({
    publicBaseUrl: config.publicBaseUrl,
    downloadUrl: auth.downloadUrl,
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
