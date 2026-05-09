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
