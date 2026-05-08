import { SERVER_EXTRA_TRANSLATIONS } from './i18nCoverage.js';

export const SUPPORTED_LANGUAGES = ['en', 'ha', 'ig', 'yo', 'pcm'];

const LANGUAGE_ALIASES = {
  en: 'en',
  english: 'en',
  ha: 'ha',
  hausa: 'ha',
  ig: 'ig',
  igbo: 'ig',
  yo: 'yo',
  yoruba: 'yo',
  pcm: 'pcm',
  pidgin: 'pcm',
  'nigerian pidgin': 'pcm',
  naija: 'pcm',
  'naija pidgin': 'pcm',
};

const LANGUAGE_NAMES = {
  en: 'English',
  ha: 'Hausa',
  ig: 'Igbo',
  yo: 'Yoruba',
  pcm: 'Nigerian Pidgin',
};

const SERVER_TRANSLATIONS = {
  ha: {
    'If an account with that email exists, a password reset link has been sent.':
      'Idan akwai asusu da wannan imel din, an tura hanyar sake saita kalmar sirri.',
    'Reset token is required': 'Ana bukatar reset token',
    'Reset token is valid.': 'Reset token din yana aiki.',
    'Reset link is invalid or has expired.':
      'Hanyar reset din ba ta aiki ko kuma ta kare.',
    'Password reset successful. You can now sign in.':
      'An sake saita kalmar sirri cikin nasara. Yanzu za ka iya shiga.',
    '{appName} password reset': 'Sake saita kalmar sirri ta {appName}',
    'Hello {name},': 'Sannu {name},',
    'We received a request to reset your {appName} password.':
      'Mun samu bukatar sake saita kalmar sirrinka ta {appName}.',
    'Reset your password': 'Sake saita kalmar sirrinka',
    'Reset Password': 'Sake saita kalmar sirri',
    '60 minutes': 'minti 60',
    'This link expires in {value}. If the button does not open, copy and paste this link into your browser:':
      'Wannan hanyar za ta kare cikin {value}. Idan maballin bai bude ba, kwafa ka manna wannan hanyar a cikin burawzarka:',
    'If you have the mobile app installed, you can also open this link:':
      'Idan ka girka manhajar wayar hannu, za ka iya bude wannan hanyar kuma:',
    'If you did not request this reset, you can safely ignore this email.':
      'Idan ba kai ne ka nemi wannan ba, za ka iya watsi da wannan imel cikin aminci.',
  },
  ig: {
    'If an account with that email exists, a password reset link has been sent.':
      'Oburu na akaunti di na email a, e zitela njikọ reset okwuntughe.',
    'Reset token is required': 'A choro reset token',
    'Reset token is valid.': 'Reset token di nma.',
    'Reset link is invalid or has expired.':
      'Njikọ reset ezighi ezi ma obu oge ya agafela.',
    'Password reset successful. You can now sign in.':
      'Emegharila okwuntughe nke oma. I nwere ike ibanye ugbu a.',
    '{appName} password reset': 'Mmeghari okwuntughe {appName}',
    'Hello {name},': 'Ndewo {name},',
    'We received a request to reset your {appName} password.':
      'Anyi natara aririo imeghari okwuntughe gi nke {appName}.',
    'Reset your password': 'Megharia okwuntughe gi',
    'Reset Password': 'Megharia okwuntughe',
    'This link expires in {value}. If the button does not open, copy and paste this link into your browser:':
      'Njikọ a ga-agwụ n’ime {value}. Ọ bụrụ na bọtịnụ ahụ emegheghị, detuo ma mado njikọ a na browser gị:',
    'If you have the mobile app installed, you can also open this link:':
      'Ọ bụrụ na ị tinyela mobile app, i nwekwara ike imeghe njikọ a:',
    'If you did not request this reset, you can safely ignore this email.':
      'Ọ bụrụ na ịrịọghị reset a, ị nwere ike ileghara email a anya n’enweghị nsogbu.',
  },
  yo: {
    'If an account with that email exists, a password reset link has been sent.':
      'Ti akanti kan ba wa pelu imeeli yen, a ti fi ọna asopọ atunse oro asina ranṣẹ.',
    'Reset token is required': 'A nilo reset token',
    'Reset token is valid.': 'Reset token naa wulo.',
    'Reset link is invalid or has expired.':
      'Ọna asopọ reset naa ko wulo tabi akoko re ti pari.',
    'Password reset successful. You can now sign in.':
      'Atunse oro asina ti se tan ni ifowopamo. O le wọle bayi.',
    '{appName} password reset': 'Atunse oro asina {appName}',
    'Hello {name},': 'Pele {name},',
    'We received a request to reset your {appName} password.':
      'A gba ibeere lati tun oro asina {appName} re se.',
    'Reset your password': 'Tun oro asina re se',
    'Reset Password': 'Tun oro asina se',
    'This link expires in {value}. If the button does not open, copy and paste this link into your browser:':
      'Ọna asopọ yi yoo pari ninu {value}. Ti bọtini naa ko ba si, daakọ ki o lẹ mọ browser rẹ:',
    'If you have the mobile app installed, you can also open this link:':
      'Ti o ba ti fi mobile app sori ẹrọ, o tun le si ọna asopọ yi:',
    'If you did not request this reset, you can safely ignore this email.':
      'Ti kii ba se iwo lo beere fun atunse yi, o le foju imeeli yi kọ lailewu.',
  },
  pcm: {
    'If an account with that email exists, a password reset link has been sent.':
      'If account with that email dey, we don send reset link.',
    'Reset token is required': 'Reset token na required',
    'Reset token is valid.': 'Reset token correct.',
    'Reset link is invalid or has expired.':
      'Reset link no valid or e don expire.',
    'Password reset successful. You can now sign in.':
      'Password reset don work. You fit sign in now.',
    '{appName} password reset': '{appName} password reset',
    'Hello {name},': 'How far {name},',
    'We received a request to reset your {appName} password.':
      'We see request to reset your {appName} password.',
    'Reset your password': 'Reset your password',
    'Reset Password': 'Reset password',
    '60 minutes': '60 minutes',
    'This link expires in {value}. If the button does not open, copy and paste this link into your browser:':
      'This link go expire in {value}. If the button no open, copy this link put am for your browser:',
    'If you did not request this reset, you can safely ignore this email.':
      'If no be you request this reset, just ignore this email.',
  },
};

function interpolate(message, params = {}) {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

export function normalizeLanguage(value = '') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return LANGUAGE_ALIASES[normalized] || 'en';
}

export function getLanguageName(language = 'en') {
  return LANGUAGE_NAMES[normalizeLanguage(language)] || LANGUAGE_NAMES.en;
}

export function translateServerText(language = 'en', text = '', params = {}) {
  const normalized = normalizeLanguage(language);
  const raw = String(text || '');
  const dynamicGeminiPrefix = 'Gemini request failed: ';

  let lookupKey = raw;
  let resolvedParams = { ...params };

  if (raw.startsWith(dynamicGeminiPrefix)) {
    lookupKey = 'Gemini request failed: {details}';
    resolvedParams = {
      details: raw.slice(dynamicGeminiPrefix.length).trim(),
      ...resolvedParams,
    };
  }

  const message =
    SERVER_EXTRA_TRANSLATIONS[normalized]?.[lookupKey] ||
    SERVER_TRANSLATIONS[normalized]?.[lookupKey] ||
    raw;

  return interpolate(message, resolvedParams);
}

export function localizeApiPayload(language = 'en', payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const next = { ...payload };

  if (typeof next.message === 'string' && next.message.trim()) {
    next.message = translateServerText(language, next.message);
  }

  if (typeof next.error === 'string' && next.error.trim()) {
    next.error = translateServerText(language, next.error);
  }

  if (Array.isArray(next.errors)) {
    next.errors = next.errors.map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return entry;
      }

      if (typeof entry.msg !== 'string' || !entry.msg.trim()) {
        return entry;
      }

      return {
        ...entry,
        msg: translateServerText(language, entry.msg),
      };
    });
  }

  return next;
}

export function buildDoctorGreetingMessage(
  doctorName = 'Doctor',
  language = 'en',
) {
  const safeName = String(doctorName || 'Doctor').trim() || 'Doctor';

  switch (normalizeLanguage(language)) {
    case 'ha':
      return `Sannu, ni ne ${safeName}. Ka bayyana damuwarka a nan, zan duba ta kai tsaye.`;
    case 'ig':
      return `Ndewo, abu m ${safeName}. Kowa nsogbu gi ebe a ka m wee leba ya anya ozugbo.`;
    case 'yo':
      return `Pele, emi ni ${safeName}. So ohun to n sele fun o nibi, emi yoo wo o taara.`;
    case 'pcm':
      return `How far, I be ${safeName}. Drop your concern here make I fit look am with you direct.`;
    default:
      return `Hello, I am ${safeName}. Share your concern here and I will review it with you directly.`;
  }
}

export function buildHealthSystemPrompt(language = 'en') {
  const normalizedLanguage = normalizeLanguage(language);
  const languageName = getLanguageName(normalizedLanguage);

  return `
You are Aisha, a careful health consultation assistant for OgaDoctor.
Rules:
- Give supportive, concise, practical guidance.
- Ask 1-3 focused follow-up questions when needed.
- Clearly flag emergency red flags (severe chest pain, trouble breathing, stroke signs, severe bleeding, suicidal thoughts) and instruct urgent care immediately.
- Never claim a definitive diagnosis.
- Suggest next steps, home care, and when to seek in-person care.
- Keep responses in plain language.
- Reply in ${languageName} unless the user explicitly asks for another language.
`.trim();
}
