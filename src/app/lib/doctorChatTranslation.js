const SUPPORTED_TRANSLATOR_LANGUAGES = new Set(['en', 'ha', 'ig', 'yo']);
const LIKELY_PIDGIN_TOKENS = [
  'abeg',
  'wetin',
  'wahala',
  'oya',
  'pikin',
  'belle',
  'una',
  'sef',
  'dey',
  'no vex',
  'how far',
];

const ENGLISH_TO_PIDGIN_PHRASES = [
  ['how are you feeling today', 'how you dey feel today'],
  ['how are you feeling', 'how you dey feel'],
  ['how are you today', 'how you dey today'],
  ['how are you', 'how you dey'],
  ['what seems to be the problem', 'wetin be the problem'],
  ['what is the problem', 'wetin be the problem'],
  ['please describe your symptoms', 'abeg describe your symptoms'],
  ['do you have', 'you get'],
  ['you should', 'you suppose'],
  ['i will', 'i go'],
  ['let me know', 'make i know'],
  ['thank you', 'tenk you'],
  ['good morning', 'good morning'],
  ['good afternoon', 'good afternoon'],
  ['good evening', 'good evening'],
  ['as soon as possible', 'as soon as possible'],
  ['right away', 'sharp sharp'],
  ['immediately', 'sharp sharp'],
  ['twice daily', 'two times every day'],
  ['once daily', 'one time every day'],
  ['not feeling well', 'no dey feel fine'],
  ['i am fine', 'i dey fine'],
  ['i have', 'i get'],
  ['there is', 'e get'],
  ['there are', 'e get'],
];

const PIDGIN_TO_ENGLISH_PHRASES = [
  ['how you dey feel today', 'how are you feeling today'],
  ['how you dey feel', 'how are you feeling'],
  ['how you dey today', 'how are you today'],
  ['how you dey', 'how are you'],
  ['wetin be the problem', 'what is the problem'],
  ['abeg describe your symptoms', 'please describe your symptoms'],
  ['you get', 'you have'],
  ['you suppose', 'you should'],
  ['i go', 'i will'],
  ['make i know', 'let me know'],
  ['tenk you', 'thank you'],
  ['sharp sharp', 'immediately'],
  ['two times every day', 'twice daily'],
  ['one time every day', 'once daily'],
  ['no dey feel fine', 'not feeling well'],
  ['i dey fine', 'i am fine'],
  ['i get', 'i have'],
  ['e get', 'there is'],
  ['how far', 'hello'],
  ['no vex', 'please'],
];

const ENGLISH_TO_PIDGIN_WORDS = {
  please: 'abeg',
  hello: 'how far',
  hi: 'how far',
  doctor: 'doctor',
  patient: 'patient',
  have: 'get',
  has: 'get',
  feeling: 'feel',
  feel: 'feel',
  stomach: 'belle',
  child: 'pikin',
  children: 'pikin dem',
  problem: 'wahala',
  know: 'sabi',
  immediately: 'sharp sharp',
  quickly: 'sharp sharp',
  medicine: 'medicine',
  medications: 'medicine',
  drugs: 'drugs',
  rest: 'rest',
  water: 'water',
  food: 'food',
};

const PIDGIN_TO_ENGLISH_WORDS = {
  abeg: 'please',
  belle: 'stomach',
  pikin: 'child',
  wahala: 'problem',
  sabi: 'know',
  dey: 'are',
  dem: 'them',
  no: 'not',
  oya: 'come on',
  sef: 'self',
};

let translatorModulePromise = null;

function normalizeChatLanguage(value, fallback = '') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (normalized === 'english') return 'en';
  if (normalized === 'hausa') return 'ha';
  if (normalized === 'igbo') return 'ig';
  if (normalized === 'yoruba') return 'yo';
  if (normalized === 'pidgin' || normalized === 'pcm') return 'pcm';

  if (SUPPORTED_TRANSLATOR_LANGUAGES.has(normalized) || normalized === 'pcm') {
    return normalized;
  }

  return fallback;
}

function detectLikelySourceLanguage(text = '') {
  const normalizedText = String(text || '')
    .trim()
    .toLowerCase();
  if (!normalizedText) {
    return 'en';
  }

  if (LIKELY_PIDGIN_TOKENS.some((token) => normalizedText.includes(token))) {
    return 'pcm';
  }

  return 'en';
}

function matchLeadingCase(sourceText, replacement) {
  if (!sourceText) {
    return replacement;
  }

  const firstChar = sourceText.charAt(0);
  if (firstChar === firstChar.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

function applyPhraseReplacements(text, replacements = []) {
  return replacements.reduce((currentText, [source, target]) => {
    const pattern = new RegExp(
      source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'gi',
    );
    return currentText.replace(pattern, (match) =>
      matchLeadingCase(match, target),
    );
  }, text);
}

function applyWordReplacements(text, replacements = {}) {
  return text.replace(/\b[\p{L}'][\p{L}'-]*\b/gu, (word) => {
    const replacement = replacements[word.toLowerCase()];
    if (!replacement) {
      return word;
    }

    return matchLeadingCase(word, replacement);
  });
}

function translateEnglishToPidgin(text) {
  const phraseTranslated = applyPhraseReplacements(
    text,
    ENGLISH_TO_PIDGIN_PHRASES,
  );
  return applyWordReplacements(phraseTranslated, ENGLISH_TO_PIDGIN_WORDS);
}

function translatePidginToEnglish(text) {
  const phraseTranslated = applyPhraseReplacements(
    text,
    PIDGIN_TO_ENGLISH_PHRASES,
  );
  return applyWordReplacements(phraseTranslated, PIDGIN_TO_ENGLISH_WORDS);
}

async function loadTranslatorModule() {
  if (!translatorModulePromise) {
    translatorModulePromise = import('nigeria-translator-browser');
  }

  return translatorModulePromise;
}

function getTranslatorFunction(moduleExports, fromLanguage, toLanguage) {
  const translatorMap = {
    'en:ha': moduleExports.englishToHausa,
    'en:ig': moduleExports.englishToIgbo,
    'en:yo': moduleExports.englishToYoruba,
    'ha:en': moduleExports.hausaToEnglish,
    'ig:en': moduleExports.igboToEnglish,
    'yo:en': moduleExports.yorubaToEnglish,
  };

  return translatorMap[`${fromLanguage}:${toLanguage}`] || null;
}

async function translateKnownDirection(text, fromLanguage, toLanguage) {
  const translatorModule = await loadTranslatorModule();
  const translatorFunction = getTranslatorFunction(
    translatorModule,
    fromLanguage,
    toLanguage,
  );

  if (!translatorFunction) {
    return text;
  }

  const translated = await translatorFunction(text);
  return typeof translated === 'string' && translated.trim()
    ? translated
    : text;
}

export async function translateDoctorChatText({
  text,
  fromLanguage,
  toLanguage,
}) {
  const originalText = String(text || '').trim();
  if (!originalText) {
    return '';
  }

  const sourceLanguage = normalizeChatLanguage(
    fromLanguage,
    detectLikelySourceLanguage(originalText),
  );
  const targetLanguage = normalizeChatLanguage(toLanguage, 'en');

  if (!sourceLanguage || sourceLanguage === targetLanguage) {
    return originalText;
  }

  if (sourceLanguage === 'en' && targetLanguage === 'pcm') {
    return translateEnglishToPidgin(originalText);
  }

  if (sourceLanguage === 'pcm' && targetLanguage === 'en') {
    return translatePidginToEnglish(originalText);
  }

  if (sourceLanguage === 'pcm') {
    const englishText = translatePidginToEnglish(originalText);
    if (!SUPPORTED_TRANSLATOR_LANGUAGES.has(targetLanguage)) {
      return englishText;
    }
    return translateKnownDirection(englishText, 'en', targetLanguage);
  }

  if (targetLanguage === 'pcm') {
    if (!SUPPORTED_TRANSLATOR_LANGUAGES.has(sourceLanguage)) {
      return translateEnglishToPidgin(originalText);
    }

    const englishText =
      sourceLanguage === 'en'
        ? originalText
        : await translateKnownDirection(originalText, sourceLanguage, 'en');
    return translateEnglishToPidgin(englishText);
  }

  if (
    !SUPPORTED_TRANSLATOR_LANGUAGES.has(sourceLanguage) ||
    !SUPPORTED_TRANSLATOR_LANGUAGES.has(targetLanguage)
  ) {
    return originalText;
  }

  try {
    if (sourceLanguage === 'en' || targetLanguage === 'en') {
      return translateKnownDirection(
        originalText,
        sourceLanguage,
        targetLanguage,
      );
    }

    const englishText = await translateKnownDirection(
      originalText,
      sourceLanguage,
      'en',
    );
    return translateKnownDirection(englishText, 'en', targetLanguage);
  } catch (_error) {
    return originalText;
  }
}

export function getDoctorChatDisplayText(message, translatedTextMap = {}) {
  if (!message?.id) {
    return message?.message || '';
  }

  return translatedTextMap[message.id] || message.message || '';
}
