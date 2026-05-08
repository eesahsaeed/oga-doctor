/* eslint-disable no-dupe-keys */
import { PIDGIN_EXTRA_TRANSLATIONS, PIDGIN_TRANSLATIONS } from './pidginI18n';
import { I18N_COVERAGE_TRANSLATIONS } from './i18nCoverage';

const LANGUAGE_STORAGE_KEY = 'ogadoctor_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', locale: 'en-NG' },
  { code: 'ha', label: 'Hausa', nativeLabel: 'Hausa', locale: 'ha-NG' },
  { code: 'ig', label: 'Igbo', nativeLabel: 'Igbo', locale: 'ig-NG' },
  { code: 'yo', label: 'Yoruba', nativeLabel: 'Yoruba', locale: 'yo-NG' },
  {
    code: 'pcm',
    label: 'Nigerian Pidgin',
    nativeLabel: 'Naija Pidgin',
    locale: 'en-NG',
  },
];

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

const TRANSLATIONS = {
  ha: {
    Language: 'Harshe',
    'Choose language': 'Zabi harshe',
    English: 'Turanci',
    Hausa: 'Hausa',
    Igbo: 'Igbo',
    Yoruba: 'Yoruba',
    Home: 'Gida',
    About: 'Game da Mu',
    Services: 'Ayyuka',
    Contact: 'Tuntube Mu',
    Blog: 'Shafin Labarai',
    Messages: 'Sakonni',
    Dashboard: 'Babban Shafi',
    Doctors: 'Likitoci',
    Specialists: 'Kwararru',
    'Doctor Messages': 'Sakon Likita',
    'AI Chat': 'Hirar AI',
    'Video Visit': 'Ziyarar Bidiyo',
    Schedule: 'Jadawali',
    Notifications: 'Sanarwa',
    Reports: 'Rahotanni',
    Profile: 'Bayanan Kai',
    Settings: 'Saituna',
    'Sign In': 'Shiga',
    'Sign Up': 'Yi Rijista',
    'Sign Out': 'Fita',
    'Create Account': 'Kirkiro Asusun',
    'Full name': 'Cikakken suna',
    Email: 'Imel',
    Password: 'Kalmar sirri',
    'Confirm password': 'Tabbatar da kalmar sirri',
    'Welcome Back': 'Barka da dawowa',
    'Access your appointments, reports, and consultations.':
      'Shiga alawuranka, rahotanni, da shawarwari.',
    'Signing in...': 'Ana shiga...',
    'New to OgaDoctor?': 'Sabon mai amfani da OgaDoctor?',
    'Create your account': 'Kirkiro asusunka',
    'Create Account': 'Kirkiro Asusun',
    'Start consultations, scheduling, and health tracking.':
      'Fara shawarwari, tsara lokaci, da bibiyar lafiya.',
    'John Doe': 'Ali Musa',
    'you@example.com': 'ka@misali.com',
    'Your password': 'Kalmar sirrinka',
    'At least 6 characters': 'Akalla haruffa 6',
    'Repeat your password': 'Sake rubuta kalmar sirri',
    'Creating account...': 'Ana kirkiro asusu...',
    'Already have an account?': 'Kana da asusu tuni?',
    'Sign in': 'Shiga',
    'Email and password are required.': 'Ana bukatar imel da kalmar sirri.',
    'Unable to sign in right now.': 'Ba a iya shiga yanzu ba.',
    'Full name is required.': 'Ana bukatar cikakken suna.',
    'Email is required.': 'Ana bukatar imel.',
    'Password must be at least 6 characters long.':
      'Kalmar sirri ta zama akalla haruffa 6.',
    'Passwords do not match.': 'Kalmomin sirri ba su yi daidai ba.',
    'Unable to create account right now.': 'Ba a iya kirkiro asusu yanzu ba.',
    'Complete Your Onboarding': 'Kammala saitin farko',
    'We use this to personalize consultations and recommendations.':
      'Muna amfani da wannan domin daidaita shawarwari da bayanai gare ka.',
    'You already completed onboarding. You can still update it below.':
      'Ka riga ka kammala saitin farko. Har yanzu za ka iya sabunta shi a kasa.',
    Gender: 'Jinsi',
    Select: 'Zabi',
    Male: 'Namiji',
    Female: 'Mace',
    Age: 'Shekaru',
    'Main Health Focus': 'Babban bukatar lafiya',
    'General Health': 'Lafiya gaba daya',
    "Women's Health": 'Lafiyar mata',
    'Mental Health': 'Lafiyar kwakwalwa',
    Cardiology: 'Lafiyar zuciya',
    'Consultation Preference': 'Nauin shawara',
    'Chat with a Doctor': 'Yi hira da likita',
    'Consult a Specialist Doctor': 'Tuntu?i kwararren likita',
    'AI Chat with Aisha': 'Hirar AI tare da Aisha',
    'Video Consultation': 'Shawarar bidiyo',
    'In-Person': 'A zahiri',
    "Women's Stage": 'Matakin kula da mata',
    General: 'Na gama gari',
    'Trying to Conceive': 'Ana kokarin samun ciki',
    Pregnant: 'Mai ciki',
    Postpartum: 'Bayan haihuwa',
    'Pregnancy Weeks (if relevant)': 'Makon ciki (idan ya dace)',
    'Current Conditions': 'Halin rashin lafiya na yanzu',
    'First pregnancy (if applicable)': 'Ciki na farko (idan ya dace)',
    'Skip for now': 'Tsallake yanzu',
    'Saving...': 'Ana adanawa...',
    'Save & Continue': 'Ajiye ka ci gaba',
    'Welcome to OgaDoctor Care': 'Barka da zuwa OgaDoctor Care',
    'Book consultations, message doctors directly, chat with Aisha AI, and join video visits from one place.':
      'Yi booking na shawarwari, aika sako kai tsaye ga likitoci, yi hira da Aisha AI, kuma shiga ganawar bidiyo daga wuri guda.',
    'Start AI Consultation': 'Fara shawarar AI',
    'Consult a Doctor': 'Tuntu?i likita',
    'Consult Specialist Doctor': 'Tuntu?i kwararren likita',
    'Join Video Consultation': 'Shiga shawarar bidiyo',
    'Care Path': 'Hanyar kulawa',
    'Open this area of your care dashboard.':
      'Bude wannan bangaren kulawar ka.',
    'Open now': 'Bude yanzu',
    'Search records and symptoms': 'Binciki bayanai da alamomi',
    Search: 'Bincika',
    'e.g. chest pain, blood pressure, appointment':
      'misali ciwon kirji, hawan jini, alawari',
    'Upcoming Appointments': 'Alawura masu zuwa',
    'Care Plan': 'Tsarin kulawa',
    Membership: 'Membobanci',
    Premium: 'Na musamman',
    Standard: 'Na yau da kullum',
    "Today's Tip": 'Shawarar yau',
    'Refreshing...': 'Ana sabuntawa...',
    Refresh: 'Sabunta',
    'Recent Vitals': 'Sabbin bayanan jiki',
    'No vitals yet.': 'Babu bayanan jiki tukuna.',
    'Recommended Articles': 'Makalolin da aka ba da shawara',
    'Failed to load dashboard data.': 'An kasa loda bayanan dashboard.',
    'Enter a symptom or condition to search.':
      'Shigar da alama ko yanayi domin bincike.',
    'Found {count} result{suffix} for "{query}".':
      'An samu sakamako {count}{suffix} don "{query}".',
    Schedule: 'Jadawali',
    'Sync Upcoming to Calendar': 'Daidaita masu zuwa da kalanda',
    'Video Consultation': 'Shawarar bidiyo',
    'Book and auto-download calendar invite':
      'Yi booking kuma sauke gayyatar kalanda kai tsaye',
    'In-Person Visit': 'Ziyara a zahiri',
    'Book clinic appointment': 'Yi booking din asibiti',
    'Lab Visit': 'Ziyara dakin gwaje-gwaje',
    'Book routine diagnostics': 'Yi booking na gwaje-gwajen yau da kullum',
    'Add to Calendar': 'Kara zuwa kalanda',
    'Mark Complete': 'Alama a matsayin an gama',
    'Past Appointments': 'Alawuran da suka wuce',
    'No past appointments yet.': 'Babu tsoffin alawura tukuna.',
    'Appointment Reminders': 'Tunatarwar alawari',
    'Get reminder notifications before scheduled visits.':
      'Samu tunatarwa kafin ziyarar da aka tsara.',
    Enabled: 'A kunne',
    Disabled: 'A kashe',
    Notifications: 'Sanarwa',
    'Mark All Read': 'Sanya duka an karanta',
    All: 'Duka',
    Unread: 'Wanda ba a karanta ba',
    'Push On': 'Push a kunne',
    'Push Off': 'Push a kashe',
    'No notifications in this filter.': 'Babu sanarwa a wannan tacewar.',
    'Reports & Records': 'Rahotanni da bayanai',
    'Track vitals, labs, documents, and screening history.':
      'Bibiyi bayanan jiki, gwaje-gwaje, takardu, da tarihin bincike.',
    'Refresh Data': 'Sabunta bayanai',
    'Avg Heart Rate': 'Matsakaicin bugun zuciya',
    'Blood Pressure': 'Hawan jini',
    Weight: 'Nauyi',
    Hydration: 'Ruwan jiki',
    'Lab Results': 'Sakamakon gwaje-gwaje',
    'No lab results available.': 'Babu sakamakon gwaji a yanzu.',
    'Medical Documents': 'Takardun lafiya',
    'No medical documents uploaded yet.':
      'Ba a loda takardun lafiya ba tukuna.',
    'Vaccinations & Screenings': 'Rigakafi da bincike',
    'No vaccination history available.': 'Babu tarihin rigakafi a yanzu.',
    Profile: 'Bayanan kai',
    'Manage personal, emergency, and medical profile details across web and mobile.':
      'Sarrafa bayanan kai, gaggawa, da lafiyarka a yanar gizo da wayar hannu.',
    'Account Email': 'Imel na asusu',
    Joined: 'An shiga',
    'Last Updated': 'An sabunta na karshe',
    'Health Onboarding Summary': 'Takaitaccen bayanin saitin lafiya',
    'Consultation preference': 'Zabin shawara',
    Conditions: 'Matsaloli',
    'No conditions added': 'Ba a kara matsaloli ba',
    Phone: 'Waya',
    'Date of birth': 'Ranar haihuwa',
    Address: 'Adireshi',
    'Blood group': 'Rukunin jini',
    'Select blood group': 'Zabi rukunin jini',
    Genotype: 'Genotype',
    'Select genotype': 'Zabi genotype',
    'Height (cm)': 'Tsawo (cm)',
    'Weight (kg)': 'Nauyi (kg)',
    'Emergency contact name': 'Sunan wanda za a kira na gaggawa',
    'Emergency contact phone': 'Wayar wanda za a kira na gaggawa',
    Allergies: 'Abubuwan da ke tayar da rashin jituwa',
    'Current medications': 'Magungunan da ake sha yanzu',
    'Premium membership': 'Membobancin premium',
    'Save Changes': 'Ajiye canje-canje',
    'Profile updated successfully.': 'An sabunta bayanan kai cikin nasara.',
    'Failed to update profile.': 'An kasa sabunta bayanan kai.',
    'N/A': 'Babu',
    'AI Consultation': 'Shawarar AI',
    'Chat with Gemini health guidance powered by your backend integration.':
      'Yi hira da jagorancin lafiya na Gemini ta hanyar hadin backend naka.',
    'Hi, I am Aisha, your Gemini health assistant. Share your symptoms and I will guide your next steps.':
      'Sannu, ni ce Aisha, mai taimakon lafiyarka na Gemini. Bayyana alamunka zan jagorance ka zuwa mataki na gaba.',
    'Ask Aisha a health question to get started.':
      'Tambayi Aisha tambayar lafiya domin farawa.',
    'Describe your symptoms...': 'Bayyana alamunka...',
    'Please type a question so I can help you.':
      'Da fatan a rubuta tambaya domin in taimaka.',
    'I could not generate a response right now. Please try again.':
      'Ba na iya samar da amsa yanzu. Da fatan a sake gwadawa.',
    Send: 'Aika',
    'AI guidance only. For emergencies, seek urgent in-person care immediately.':
      'Jagorancin AI ne kawai. Idan gaggawa ne, nemi kulawar gaggawa a zahiri nan take.',
    'Consult a Doctor': 'Tuntu?i likita',
    'Choose a licensed doctor, start a direct conversation, and continue care inside the app.':
      'Zabi likita mai lasisi, fara hira kai tsaye, sannan ka ci gaba da kulawa a cikin app.',
    'Talk to a general doctor for everyday symptoms, follow-ups, and preventive care.':
      'Yi magana da likitan gama gari don alamun yau da kullum, bibiyar jinya, da kariya.',
    'Connect with specialist doctors for focused care, second opinions, and ongoing treatment plans.':
      'Hadu da kwararrun likitoci domin kulawa ta musamman, karin raayi, da tsarin jinya mai dorewa.',
    'AI chat and video consultation remain available whenever you need instant support or a live visit.':
      'Har yanzu hirar AI da shawarar bidiyo suna nan idan kana bukatar taimako nan take ko ziyara kai tsaye.',
    'Search doctor, specialty, or care area':
      'Binciki likita, kwarewa, ko bangaren kulawa',
    'Direct doctor messaging': 'Sakon kai tsaye ga likita',
    'Specialist matching': 'Daidaita kwararre',
    'Video consultation available': 'Shawarar bidiyo tana samuwa',
    'Loading doctors...': 'Ana loda likitoci...',
    'No doctors matched your search. Try another specialty or switch between general doctors and specialists.':
      'Babu likita da ya dace da bincikenka. Gwada wata kwarewa ko sauya tsakanin likitocin gama gari da kwararru.',
    Specialist: 'Kwararre',
    'General Care': 'Kulawa ta gama gari',
    Experience: 'Kwarewa',
    years: 'shekaru',
    Response: 'Amsa',
    'Reply time varies': 'Lokacin amsa ya bambanta',
    'Next Available': 'Lokaci na gaba da ake samu',
    'To be confirmed': 'Za a tabbatar daga baya',
    Consultation: 'Shawara',
    'Pricing on request': 'Farashi idan an nema',
    'Opening...': 'Ana budewa...',
    'Continue Doctor Chat': 'Ci gaba da hirar likita',
    'Chat with Doctor': 'Yi hira da likita',
    'Start Video Consultation': 'Fara shawarar bidiyo',
    'Existing conversation found. Your last message thread is ready to continue.':
      'An sami tsohuwar hira. Zaren sakonka na baya a shirye yake domin ci gaba.',
    'Continue direct conversations with your doctors and specialists.':
      'Ci gaba da hirar kai tsaye da likitocinka da kwararru.',
    'Find Doctors': 'Nemi likitoci',
    'Loading conversations...': 'Ana loda hirarraki...',
    'No doctor chats yet. Start with a general doctor or choose a specialist.':
      'Babu hirar likita tukuna. Fara da likitan gama gari ko zabi kwararre.',
    'Consult a Specialist': 'Tuntu?i kwararre',
    'Start your first doctor conversation': 'Fara hirarka ta farko da likita',
    'Choose a doctor or specialist and your message thread will be ready here.':
      'Zabi likita ko kwararre sannan zaren sakonka zai kasance a nan.',
    'Doctor Conversation': 'Hirar likita',
    'Next available: {value}': 'Lokaci na gaba: {value}',
    'Loading conversation...': 'Ana loda hira...',
    You: 'Kai',
    'Send a direct message': 'Aika sakon kai tsaye',
    'Describe your symptoms, ask a follow-up question, or share an update...':
      'Bayyana alamunka, yi tambayar bibiyar jinya, ko ka bada sabon bayani...',
    'Sending...': 'Ana aikawa...',
    'Send Message': 'Aika sako',
    'Your On-the-Go Virtual Doctor': 'Likitanka na tafi-da-gidanka',
    'OgaDoctor brings certified medical doctors right to your phone - consult anytime, anywhere in Nigeria, without queues or travel stress.':
      'OgaDoctor yana kawo likitoci masu lasisi kai tsaye zuwa wayarka - ka tuntubi likita kowane lokaci, a koina a Najeriya, ba tare da layi ko wahalar tafiya ba.',
    'OgaDoctor - Your Virtual Clinic': 'OgaDoctor - Asibitin ka na intanet',
    'Download the app for instant access to licensed doctors, virtual consultations, prescriptions, and health advice - all from the comfort of home or on the move. No more long waits at hospitals.':
      'Sauke app din don samun damar kai tsaye ga likitoci masu lasisi, shawarar intanet, takardun magani, da shawarwarin lafiya - duka daga jin dadin gida ko kana tafiya. Babu sake dogon jira a asibiti.',
    'Why Choose OgaDoctor?': 'Me ya sa za ka zabi OgaDoctor?',
    'Get certified medical advice, prescriptions, and care without leaving home. OgaDoctor brings quality healthcare directly to your phone - fast, secure, and stress-free across Nigeria.':
      'Samu shawarar lafiya daga kwararru, takardun magani, da kulawa ba tare da barin gida ba. OgaDoctor yana kawo ingantacciyar lafiya kai tsaye zuwa wayarka - cikin sauri, aminci, kuma babu damuwa a Najeriya.',
    'On-the-Go Access': 'Samun dama a koina',
    'Consult certified doctors anytime, anywhere in Nigeria - right from your phone. No travel, no queues, just instant care when you need it.':
      'Tuntu?i likitoci masu lasisi kowane lokaci, a koina a Najeriya - daga wayarka kai tsaye. Babu tafiya, babu layi, kawai kulawa nan take idan kana bukata.',
    'Multiple Consultation Modes': 'Hanyoyin shawara da yawa',
    'Choose text chat, voice calls, or full video consultations. Connect seamlessly with doctors through our mobile app or website.':
      'Zabi hirar rubutu, kiran murya, ko cikakkiyar shawarar bidiyo. Hadu da likitoci cikin sauki ta app ko shafinmu.',
    'Secure & Private': 'Aminci da sirri',
    'Your health data is protected with end-to-end encryption. Access your personal health records and consultation history safely.':
      'Ana kare bayanan lafiyarka da tsaron end-to-end. Shiga bayanan lafiyarka da tarihin shawarwari cikin aminci.',
    'Fast & Convenient': 'Sauri da sauki',
    'Quick scheduling, real-time notifications, and 24/7 availability for urgent concerns - healthcare that fits your busy life.':
      'Tsara lokaci cikin sauri, sanarwa kai tsaye, da samuwa awa 24/7 don damuwar gaggawa - lafiya da ta dace da rayuwar ka mai aiki.',
    'Healthcare in Your Pocket': 'Lafiya a aljihunka',
    'Get the App': 'Samu app din',
    'Available now for iOS and Android - Free to download - No registration required for first consultation':
      'Akwai yanzu a iOS da Android - Saukewa kyauta - Ba a bukatar rijista don shawarar farko',
    'What Nigerians Are Saying': 'Abin da yan Najeriya ke fada',
    'Real stories from people across Nigeria who have experienced faster, easier, and more convenient healthcare with OgaDoctor - no queues, no stress, just quality care when they need it.':
      'Labarai na gaskiya daga mutane a Najeriya da suka samu kulawar lafiya mai sauri, sauki, da dacewa tare da OgaDoctor - babu layi, babu damuwa, kawai ingantacciyar kulawa lokacin da suke bukata.',
    'Join 12,000+ happy users who trust OgaDoctor for their health needs':
      'Kasance tare da masu amfani sama da 12,000 da suka yarda da OgaDoctor don bukatun lafiyarsu',
    'Frequently asked questions': 'Tambayoyin da ake yawan yi',
    "Got questions? We've got clear answers. Find quick help about how OgaDoctor works, payments, doctors, privacy, and more.":
      'Kana da tambayoyi? Muna da amsoshi masu bayyana. Sami taimako da sauri kan yadda OgaDoctor ke aiki, biyan kudi, likitoci, sirri, da sauransu.',
    'About OgaDoctor': 'Game da OgaDoctor',
    'OgaDoctor provides trusted digital healthcare access in Nigeria with licensed doctors, virtual consultations, and personalized support.':
      'OgaDoctor yana bayar da amintacciyar damar kula da lafiya ta dijital a Najeriya tare da likitoci masu lasisi, shawarwari ta intanet, da tallafi na musamman.',
    Mission: 'Manufa',
    'Make quality care accessible with fast, secure, and reliable digital health services.':
      'Sanya ingantacciyar kulawa ta zama mai saukin samu tare da ayyukan lafiya na dijital masu sauri, aminci, da tabbaci.',
    'Care Team': 'Kungiyar kulawa',
    'Our platform connects you with vetted doctors and specialists for continuity of care.':
      'Dandalinmu yana hada ka da likitoci da kwararru da aka tantance domin ci gaba da kulawa.',
    Technology: 'Fasaha',
    'Built for secure communication, appointment management, and real-time consultation support.':
      'An gina shi don sadarwa mai aminci, sarrafa alawura, da tallafin shawara a ainihin lokaci.',
    Services: 'Ayyuka',
    'Choose from consultation, diagnostics, and continuous health management services.':
      'Zabi daga cikin shawarwari, gwaje-gwaje, da ayyukan kula da lafiya na dindindin.',
    'Video Consultation': 'Shawarar bidiyo',
    'Meet a doctor remotely with live consultation and follow-up recommendations.':
      'Hadu da likita daga nesa tare da shawara kai tsaye da shawarwarin bibiyar jinya.',
    'Book Video Visit': 'Yi booking din ziyarar bidiyo',
    'AI Health Chat': 'Hirar lafiya ta AI',
    'Get quick symptom guidance and care direction powered by our AI assistant.':
      'Samu jagoranci cikin sauri kan alamomi da hanya ta kulawa daga mai taimakon AI dinmu.',
    'Start AI Chat': 'Fara hirar AI',
    'Lab Scheduling': 'Tsara gwaje-gwaje',
    'Book lab visits and keep your test timeline organized in one care workspace.':
      'Yi booking din ziyarar dakin gwaje-gwaje kuma ka tsara lokacin gwajinka a wuri guda.',
    'Schedule Lab Visit': 'Tsara ziyarar gwaji',
    'Health Records': 'Bayanan lafiya',
    'Access reports, prescriptions, and medical history from your dashboard.':
      'Shiga rahotanni, takardun magani, da tarihin lafiya daga dashboard dinka.',
    'View Care Workspace': 'Duba wurin kulawa',
    'Reach OgaDoctor support for onboarding help, account questions, and consultation guidance.':
      'Tuntu?i tallafin OgaDoctor don taimakon onboarding, tambayoyin asusu, da jagorancin shawara.',
    Phone: 'Waya',
    'Office Hours': 'Lokutan aiki',
    'Mon - Sat, 8:00 AM to 8:00 PM (WAT)':
      'Litinin - Asabar, 8:00 na safe zuwa 8:00 na dare (WAT)',
    'Your name': 'Sunanka',
    Message: 'Sako',
    'Thanks, your message has been queued. Our team will respond shortly.':
      'Na gode, an jera sakonka. Kungiyarmu za ta amsa ba da jimawa ba.',
    'Health insights and practical guidance from the OgaDoctor care team.':
      'Bayanan lafiya da jagoranci masu anfani daga kungiyar kulawar OgaDoctor.',
    'Read Article': 'Karanta makala',
    'Use your care workspace inbox for care updates, reminders, and support messages.':
      'Yi amfani da akwatin sakonnin kulawarka don sabuntawa, tunatarwa, da sakonnin tallafi.',
    'Care Inbox': 'Akwatin kulawa',
    'Sign in to view appointment reminders, lab updates, and provider communication.':
      'Shiga don duba tunatarwar alawari, sabuntawar gwaje-gwaje, da sadarwar masu bada kulawa.',
    'Open Notifications': 'Bude sanarwa',
    'Need Help?': 'Kana bukatar taimako?',
    'If you are having account issues, contact support immediately.':
      'Idan kana da matsalar asusu, tuntubi tallafi nan take.',
    'Email Support': 'Tallafi ta imel',
    'Privacy Policy': 'Manufar tsare sirri',
    'Terms of Service': 'Sharuddan sabis',
    'Last updated: March 1, 2025': 'An sabunta na karshe: 1 Maris 2025',
    'Reports & Records': 'Rahotanni da bayanai',
    'Doctor Access': 'Samun likita',
    'Talk to Aisha': 'Yi magana da Aisha',
    'Start Health Chat': 'Fara hirar lafiya',
    'Consultation Paths': 'Hanyoyin shawara',
    'Consult Specialist': 'Tuntu?i kwararre',
    'Doctor Access': 'Samun likita',
    'Doctor Access': 'Samun likita',
    'Doctor Access': 'Samun likita',
    'All caught up': 'Komai ya daidaita',
    'Push Notifications': 'Sanarwar push',
    'Receive alerts for appointments, results and reminders':
      'Karbi sanarwa kan alawura, sakamako da tunatarwa',
    'Hello,': 'Sannu,',
    Patient: 'Mara lafiya',
    'Signed in': 'An shiga',
    'Ready. Join a consultation room to begin.':
      'A shirye. Shiga dakin shawara domin farawa.',
    Month: 'Wata',
    Week: 'Mako',
    Back: 'Baya',
    Continue: 'Ci gaba',
    'Finish Setup': 'Kammala saitin',
    'Step {step} of {total}': 'Mataki na {step} cikin {total}',
    "Let's set up your care profile": 'Mu saita bayanin kulawarka',
    'This takes less than a minute and helps us match you to the right consultation path.':
      'Wannan bai wuce minti daya ba kuma yana taimaka mana mu hada ka da hanyar shawara mai dacewa.',
    'What you get': 'Abin da za ka samu',
    'Faster triage, better doctor matching, and personalized reminders.':
      'Tantancewa cikin sauri, dacewar likita mafi kyau, da tunatarwa na musamman.',
    'What do you need today?': 'Me kake bukata yau?',
    'General Care': 'Kulawa ta gama gari',
    'Chronic Condition': 'Cuta mai dorewa',
    'Pregnancy Care': 'Kulawar ciki',
    'Choose your consultation preference': 'Zabi irin shawarar da ka fi so',
    'Non-binary': 'Ba namiji ko mace kadai ba',
    'Prefer not to say': 'Ba na son fada',
    'Medical basics': 'Muhimman bayanan lafiya',
    'Review and finish': 'Duba kuma kammala',
    'Goal: {value}': 'Manufa: {value}',
    'Consultation: {value}': 'Shawara: {value}',
    'Gender: {value}': 'Jinsi: {value}',
    'Age: {value}': 'Shekaru: {value}',
    'Language: {value}': 'Harshe: {value}',
    'By continuing, you understand AI guidance is informational and doctor chat replies may take time depending on availability.':
      'Ta ci gaba, ka fahimci cewa jagorancin AI na bada bayani ne kawai kuma amsar hirar likita na iya daukar lokaci gwargwadon samuwa.',
    'Search symptoms, conditions, doctors...':
      'Binciki alamomi, yanayi, likitoci...',
    'Enter a search term first': 'Shigar da abin da za a bincika da farko',
    'Search failed': 'Bincike ya gaza',
    'AI guidance, real doctor access, and specialist care from one home screen.':
      'Jagorancin AI, samun likita na gaske, da kulawar kwararre daga shafin gida guda daya.',
    'Start Video Consultation': 'Fara shawarar bidiyo',
    'Start a direct consultation with a general doctor.':
      'Fara shawara kai tsaye da likitan gama gari.',
    'Browse specialists for focused care and follow-up.':
      'Duba kwararru domin kulawa ta musamman da bibiyar jinya.',
    'Continue direct conversations with your doctors in-app.':
      'Ci gaba da hirar kai tsaye da likitocinka a cikin app.',
    "Your Women's Health Update": 'Sabuntawar lafiyar matanki',
    'Stage: {stage}': 'Mataki: {stage}',
    'Upgrade to Premium for more': 'Ha?aka zuwa Premium don karin anfani',
    'Our Services': 'Ayyukanmu',
    'Health Articles': 'Makalolin lafiya',
    'See all': 'Duba duka',
    'Pregnancy Progress': 'Ci gaban ciki',
    'Current Gestational Week': 'Makon ciki na yanzu',
    'Health Overview': 'Takaitaccen bayanin lafiya',
    'Vital Trends': 'Canjin bayanan jiki',
    'Heart Rate (mock preview)': 'Bugun zuciya (samfurin dubawa)',
    'View all': 'Duba duka',
    Export: 'Fitarwa',
    'Last 30 days': 'Kwanaki 30 da suka wuce',
    'Last 90 days': 'Kwanaki 90 da suka wuce',
    'All time': 'Duk lokaci',
    'Previous month coming soon': 'Watan baya zai zo nan ba da jimawa ba',
    'Next month coming soon': 'Watan gaba zai zo nan ba da jimawa ba',
    'Past Appointments': 'Alawuran da suka wuce',
    'Reminders & Notifications': 'Tunatarwa da sanarwa',
    'Appointment Reminders': 'Tunatarwar alawari',
    'Get notified 24h and 1h before':
      'Sami sanarwa awa 24 da awa 1 kafin lokaci',
    'Sync Upcoming to Calendar': 'Daidaita masu zuwa da kalanda',
    'Push notifications enabled': 'An kunna sanarwar push',
    'Push notifications disabled': 'An kashe sanarwar push',
    'Failed to load notifications': 'An kasa loda sanarwa',
    'Failed to load reports': 'An kasa loda rahotanni',
    'Failed to load appointments': 'An kasa loda alawura',
    'Failed to load dashboard data': 'An kasa loda bayanan dashboard',
    'Found {count} result': 'An samu sakamako {count}',
    'Found {count} results': 'An samu sakamako {count}',
    'No upcoming appointments.': 'Babu alawura masu zuwa.',
    'Appointment Confirmed': 'An tabbatar da alawari',
    'Video consultation booked successfully.':
      'An yi booking na shawarar bidiyo cikin nasara.',
    'View details': 'Duba cikakkun bayanai',
    'Lab Results Available': 'Sakamakon gwaji ya fito',
    'Your latest CBC report is now available.':
      'Rahoton CBC naka na baya-bayan nan ya samu.',
    'View report': 'Duba rahoto',
    'Heart Rate': 'Bugun zuciya',
    'Water Intake': 'Shan ruwa',
    'Full Blood Count (FBC)': 'Cikakken kirgen jini (FBC)',
    'Normal - Reviewed by Dr. Sarah': 'Na alada - Dr. Sarah ta duba',
    'Cholesterol slightly elevated': 'Cholesterol ya dan tashi kadan',
    '5.6% - Good control': '5.6% - Kyakkyawan sarrafawa',
    'Chest X-Ray Report': 'Rahoton hoton X-Ray na kirji',
    'ECG Summary': 'Takaitaccen ECG',
    'Prescription - Jan 2026': 'Takardar magani - Jan 2026',
    'COVID-19 Booster (Pfizer) - Oct 2025':
      'Karin allurar COVID-19 (Pfizer) - Oktoba 2025',
    'Influenza (Flu) - Sep 2025': 'Mura (Flu) - Satumba 2025',
    'Hepatitis B (3rd dose) - Mar 2025':
      'Hepatitis B (kashi na 3) - Maris 2025',
    'General Practitioner': 'Likitan gama gari',
    'Primary Care Doctor': 'Likitan kulawa ta farko',
    'Consultant Cardiologist': 'Kwararren likitan zuciya',
    'Consultant Pediatrician': 'Kwararren likitan yara',
    'General Medicine': 'Maganin gaba daya',
    'Internal Medicine': 'Magungunan cikin jiki',
    Pediatrics: 'Lafiyar yara',
    'Experienced family physician focused on everyday care, preventive medicine, and follow-up consultations.':
      'Gogaggen likitan iyali mai mayar da hankali kan kulawar yau da kullum, rigakafi, da bibiyar shawarwari.',
    'Primary care doctor helping patients manage recurring symptoms, medications, and general health concerns.':
      'Likitan kulawa ta farko da ke taimakawa marasa lafiya sarrafa alamomi masu maimaituwa, magunguna, da matsalolin lafiya na gaba daya.',
    'Cardiology specialist for chest pain reviews, hypertension management, and long-term heart care.':
      'Kwararren zuciya don duba ciwon kirji, kula da hawan jini, da kulawar zuciya na dogon lokaci.',
    'Pediatric specialist supporting parents with urgent child health concerns, growth reviews, and follow-up care.':
      'Kwararren lafiyar yara mai taimaka wa iyaye da damuwar lafiyar yara ta gaggawa, duba ci gaba, da bibiyar kulawa.',
    'Replies in about 10 mins': 'Yana amsawa cikin kusan minti 10',
    'Replies in about 15 mins': 'Yana amsawa cikin kusan minti 15',
    'Replies in about 12 mins': 'Yana amsawa cikin kusan minti 12',
    'Replies in about 8 mins': 'Yana amsawa cikin kusan minti 8',
    'Today, 3:30 PM': 'Yau, 3:30 PM',
    'Today, 5:00 PM': 'Yau, 5:00 PM',
    'Tomorrow, 9:00 AM': 'Gobe, 9:00 AM',
    'Today, 6:15 PM': 'Yau, 6:15 PM',
    'From NGN 8,000': 'Daga NGN 8,000',
    'From NGN 10,000': 'Daga NGN 10,000',
    'From NGN 18,000': 'Daga NGN 18,000',
    'From NGN 16,000': 'Daga NGN 16,000',
    "Today's Health Tip": 'Shawarar lafiyar yau',
    'Drinking 2-3 liters of water daily supports healthy blood pressure and kidney function.':
      'Shan lita 2 zuwa 3 na ruwa kullum yana taimakawa lafiyayyen hawan jini da aikin koda.',
    'Browse general doctors and start a direct consultation.':
      'Duba likitocin gama gari ka fara shawara kai tsaye.',
    'Consult a Specialist': 'Tuntu?i kwararre',
    'Connect with specialist doctors for focused care and follow-up.':
      'Hadu da kwararrun likitoci domin kulawa ta musamman da bibiyar jinya.',
    'Chat with a Doctor': 'Yi hira da likita',
    'Send your concerns directly to a doctor and continue the conversation in-app.':
      'Aika damuwarka kai tsaye ga likita ka ci gaba da hirar a cikin app.',
    'Review your reports, lab results, and saved health files.':
      'Duba rahotanninka, sakamakon gwaje-gwaje, da fayilolin lafiyar da aka ajiye.',
    'Managing Stress in Busy Lagos Life':
      'Yadda ake sarrafa damuwa a rayuwar Legas mai aiki',
    'Mental Health': 'Lafiyar kwakwalwa',
    'Why Blood Pressure Matters After 40':
      'Dalilin da ya sa hawan jini yake da muhimmanci bayan shekaru 40',
    Cardiology: 'Lafiyar zuciya',
    'Routine physical examination': 'Duba jiki na yau da kullum',
    'Depression follow-up & medication review':
      'Bibiyar damuwa da duba magunguna',
    'Initial depression screening': 'Binciken farko na damuwa',
    Confirmed: 'An tabbatar',
    Pending: 'Ana jira',
    Completed: 'An gama',
    Scheduled: 'An tsara',
    'Routine diagnostics': 'Gwaje-gwaje na yau da kullum',
    'Doctor consultation': 'Shawarar likita',
    'General consultation': 'Shawara ta gama gari',
    '12. Acceptance of Terms': '12. Amincewa da sharudda',
    '1. Acceptance of Terms': '1. Amincewa da sharudda',
    '1. Introduction': '1. Gabatarwa',
    '12. Contact': '12. Tuntuba',
    '12. Contact Us': '12. Tuntube mu',
    '2. Description of Service': '2. Bayanin sabis',
    '2. Information We Collect': '2. Bayanan da muke tattarawa',
    '2.1 Information you voluntarily provide':
      '2.1 Bayanai da ka bayar da kanka',
    '2.2 Automatically collected information':
      '2.2 Bayanai da ake tattarawa ta atomatik',
    '2.3 We do NOT collect': '2.3 Ba ma tattarawa',
    '3. How We Use Your Information': '3. Yadda muke amfani da bayananka',
    '3. No Medical Advice - Important Disclaimer':
      '3. Ba shawarar likita ba - Muhimmin gargadi',
    'Add important spoken notes here so the consultation is saved as a transcript.':
      'Kara muhimman bayanan da aka fada a nan domin a ajiye shawarar a matsayin rubutaccen bayani.',
    'Call ended. You can rejoin any room.':
      'Kiran ya kare. Za ka iya sake shiga kowanne daki.',
    'Close join consultation modal': 'Rufe allon shiga shawara',
    'Connected to room {room}.': 'An hade zuwa daki {room}.',
    'Connecting to room {room}...': 'Ana hada kai da daki {room}...',
    Connected: 'An hade',
    'Copy ID': 'Kwafi ID',
    'Copy Room ID': 'Kwafi ID na daki',
    'Created room {room}. Share it and tap Join Room.':
      'An kirkiro daki {room}. Raba shi sannan ka taba Join Room.',
    'Disconnected from room. Rejoin to continue.':
      'An katse daga dakin. Sake shiga domin ci gaba.',
    'End Call': 'Kare kira',
    'Exit Full Screen': 'Fita daga cikakken allo',
    'File is too large. Max size is {size}.':
      'Fayil din ya yi girma sosai. Matsakaicin girma {size} ne.',
    'File received: {name}': 'An karbi fayil: {name}',
    'Focused selected participant.':
      'An mayar da hankali kan mahalarcin da aka zaba.',
    'Go Full Screen': 'Je zuwa cikakken allo',
    'Hand raised': 'An daga hannu',
    Idle: 'A tsaye',
    'Invitation details ready. Share room ID {room}.':
      'Bayanan gayyata sun shirya. Raba ID na daki {room}.',
    'Join Consultation': 'Shiga shawara',
    'Join Now': 'Shiga yanzu',
    'Join a room before adding transcript entries.':
      'Shiga daki kafin kara shigar rubutaccen bayani.',
    'Join failed: {message}': 'Shiga ya gaza: {message}',
    'Join video consultation': 'Shiga shawarar bidiyo',
    'LiveKit token service returned an invalid response.':
      'Sabis din token na LiveKit ya dawo da amsa mara inganci.',
    'Low (360p)': 'Kasa (360p)',
    'Balanced (540p)': 'Matsakaici (540p)',
    'High (720p)': 'Sama (720p)',
    'Mic off': 'Makirufo a kashe',
    'Mic on': 'Makirufo a kunne',
    'More Controls': 'Karin sarrafawa',
    'Mute Microphone': 'Kashe makirufo',
    'No files shared yet.': 'Babu fayil da aka raba tukuna.',
    'Nobody else has joined yet.': 'Babu wani da ya shiga tukuna.',
    Offline: 'Ba ya kan layi',
    Online: 'A kan layi',
    'Open transcript': 'Bude rubutaccen bayani',
    'Participant name is required.': 'Ana bukatar sunan mahalarta.',
    People: 'Mutane',
    'People in Room ({count})': 'Mutanen da ke daki ({count})',
    'Questions about these Terms should be sent to:':
      'A aika tambayoyi game da wadannan sharudda zuwa:',
    'Reconnecting call...': 'Ana sake hada kiran...',
    'Re-send Invite': 'Sake aika gayyata',
    'Requesting secure room access...':
      'Ana neman amintacciyar damar shiga daki...',
    Room: 'Daki',
    'Room ID copied: {room}': 'An kwafi ID na daki: {room}',
    'Room ID is required before copying.':
      'Ana bukatar ID na daki kafin a kwafa.',
    Secure: 'Amintacce',
    'Secure one-on-one and group video consultations.':
      'Amintattun shawarwarin bidiyo na mutum daya-da-daya da na rukuni.',
    'Share File': 'Raba fayil',
    'Share a file': 'Raba fayil',
    'Shared file': 'Fayil da aka raba',
    'Show people': 'Nuna mutane',
    Status: 'Matsayi',
    'This Privacy Policy explains what information we collect, how we use it, who we share it with, and what rights you have regarding your personal data.':
      'Wannan Dokar Sirri tana bayyana bayanan da muke tattarawa, yadda muke amfani da su, wanda muke raba su da shi, da hakkokinka kan bayananka.',
    'This uses the same backend token endpoint as web: `/consultation/livekit/token`.':
      'Wannan yana amfani da token endpoint iri daya na backend kamar yanar gizo: `/consultation/livekit/token`.',
    'Transcript saved and consultation closed.':
      'An ajiye rubutaccen bayanin kuma an rufe shawarar.',
    'Transcript saved.': 'An ajiye rubutaccen bayanin.',
    'Transcript updated.': 'An sabunta rubutaccen bayanin.',
    'Unable to access camera or microphone.':
      'Ba a iya samun damar kyamara ko makirufo ba.',
    'Unable to change video quality.': 'Ba a iya canza ingancin bidiyo ba.',
    'Unable to copy room ID. Please copy manually.':
      'Ba a iya kwafa ID na daki ba. Da fatan a kwafa da hannu.',
    'Unable to join room.': 'Ba a iya shiga dakin ba.',
    'Unable to load saved transcript.':
      'Ba a iya loda rubutaccen bayanin da aka ajiye ba.',
    'Unable to read selected file.':
      'Ba a iya karanta fayil din da aka zaba ba.',
    'Unable to send chat message.': 'Ba a iya aika sakon hira ba.',
    'Unable to share file.': 'Ba a iya raba fayil ba.',
    'Unable to share transcript entry.':
      'Ba a iya raba shigar rubutaccen bayani ba.',
    'Unable to update camera state.': 'Ba a iya sabunta halin kyamara ba.',
    'Unable to update microphone state.': 'Ba a iya sabunta halin makirufo ba.',
    'Use of Service': 'Amfani da sabis',
    Video: 'Bidiyo',
    'Video Quality': 'Ingancin bidiyo',
    'Video quality set to {quality}.': 'An sa ingancin bidiyo zuwa {quality}.',
    'Video quality switched to {quality}.':
      'An sauya ingancin bidiyo zuwa {quality}.',
    'Waiting for participant video': 'Ana jiran bidiyon mahalarta',
    Website: 'Yanar gizo',
    'YOU ACKNOWLEDGE AND AGREE THAT:': 'KA AMINCE KUMA KA FAHIMCI CEWA:',
    'You raised your hand.': 'Ka daga hannunka.',
    'You lowered your hand.': 'Ka sauke hannunka.',
    'Room ID is required.': 'Ana bukatar ID na daki.',
    'By using the Service you agree to the collection and use of information in accordance with this policy.':
      'Ta amfani da sabis din ka amince da tattarawa da amfani da bayanai daidai da wannan doka.',
    'By accessing or using the Aisha AI Health Assistant chat widget at ogadoctor.com.ng ("Service"), you agree to be bound by these Terms of Service ("Terms").':
      'Ta shiga ko amfani da widget din hirar Aisha AI Health Assistant a ogadoctor.com.ng ("Sabis"), ka amince da bin wadannan Sharuddan Sabis ("Sharudda").',
    'If you do not agree, you must not use the Service.':
      'Idan ba ka yarda ba, bai kamata ka yi amfani da sabis din ba.',
    'The Service is an AI-powered chat interface that provides general health-related information and conversation.':
      'Sabis din hanyar hira ce ta AI wadda ke bayar da bayanai na kiwon lafiya gaba daya da tattaunawa.',
    'It is not a substitute for professional medical advice, diagnosis, or treatment.':
      'Ba ya maye gurbin shawarar likita, gano cuta, ko magani na kwararru.',
    'OgaDoctor ("we", "us", "our") operates the Aisha AI Health Assistant chat widget available at ogadoctor.com.ng (the "Service").':
      'OgaDoctor ("mu", "namu") yana gudanar da widget din hirar Aisha AI Health Assistant da ake samu a ogadoctor.com.ng ("Sabis").',
    'Messages you send in the chat (health symptoms, questions, etc.)':
      'Sakonnin da ka aika a hira (alamomin lafiya, tambayoyi, da sauransu).',
    'Any personal details you choose to include in messages (name, age, gender, location, medical history, etc.)':
      'Duk wani bayanin kai da ka zaba ka saka a sakonni (suna, shekaru, jinsi, wuri, tarihin lafiya, da sauransu).',
    'Contact information if you explicitly provide it':
      'Bayanan tuntuba idan ka bayar da su kai tsaye.',
    'Technical data: IP address, browser type and version, device type, operating system, approximate location (derived from IP)':
      'Bayanan fasaha: adireshin IP, naui da sigar burauza, nauin naura, tsarin aiki, da kusan wurin da aka samo daga IP.',
    'Usage data: timestamps of messages, chat open/close events, session duration':
      'Bayanan amfani: lokacin sakonni, bude da rufe hira, da tsawon zaman amfani.',
    'Cookies / similar technologies (if implemented later): small data files used for functionality':
      'Cookies ko makamantansu (idan an aiwatar daga baya): kananan fayilolin bayanai da ake amfani da su don aiki.',
    'Precise geolocation (unless you explicitly tell us in chat)':
      'Takamaiman wurin da kake (sai idan ka fada mana kai tsaye a hira).',
    'Payment information (we do not process payments)':
      'Bayanin biyan kudi (ba mu sarrafa biyan kudi).',
    'Health insurance numbers, passport numbers, or government IDs (unless you voluntarily type them)':
      'Lambobin inshorar lafiya, fasfo, ko katin gwamnati (sai idan ka rubuta su da kanka).',
    'We use the collected information to:':
      'Muna amfani da bayanan da aka tattara domin:',
    'Provide, maintain and improve the Aisha AI Health Assistant':
      'Bayarwa, kula da, da inganta Aisha AI Health Assistant.',
    'Understand and respond to your health-related questions':
      'Fahimta da amsa tambayoyinka na kiwon lafiya.',
    'Generate analytics about usage patterns (aggregated / anonymized)':
      'Samar da nazari kan yadda ake amfani da sabis (a dunkule ko ba tare da suna ba).',
    'Detect abuse, spam or technical issues':
      'Gano cin zarafi, sakonnin banza, ko matsalolin fasaha.',
    'Comply with legal obligations': 'Cika wajibai na doka.',
    'For any questions about this Privacy Policy, contact:':
      'Idan kana da tambaya game da wannan Dokar Sirri, tuntube:',
    'The Service is for informational and educational purposes only':
      'An yi sabis din ne domin bayani da ilimantarwa kawai.',
    'Aisha is not a doctor, nurse, or licensed healthcare provider':
      'Aisha ba likita ba ce, ba nas ba ce, kuma ba mai kula da lafiya mai lasisi ba ce.',
    'No doctor-patient relationship is created by using the Service':
      'Amfani da sabis din ba ya haifar da alakar likita da mara lafiya.',
    'Never ignore or delay seeking professional medical advice because of something you read or were told in the chat':
      'Kada ka yi watsi ko jinkirta neman shawarar likita saboda wani abu da ka karanta ko aka fada maka a hira.',
    'In case of emergency, call emergency services immediately (112 in Nigeria)':
      'Idan gaggawa ce, kira hukumomin agaji nan take (112 a Najeriya).',
  },
  ig: {
    Language: 'Asusu',
    English: 'Bekee',
    Hausa: 'Hausa',
    Igbo: 'Igbo',
    Yoruba: 'Yoruba',
    Home: 'Ulo',
    About: 'Banyere',
    Services: 'Oru',
    Contact: 'Kpoturu anyi',
    Blog: 'Blogu',
    Messages: 'Ozi',
    Dashboard: 'Dashboard',
    Doctors: 'Dokita',
    Specialists: 'Okachamara',
    'Doctor Messages': 'Ozi Dokita',
    'AI Chat': 'Mkparita uka AI',
    'Video Visit': 'Nleta Video',
    Schedule: 'Nhazi oge',
    Notifications: 'Okwa',
    Reports: 'Akuko',
    Profile: 'Profaịlụ',
    'Sign In': 'Banye',
    'Sign Up': 'Debanye aha',
    'Sign Out': 'Puo',
    'Create Account': 'Mepu akauntu',
    'Full name': 'Aha zuru ezu',
    Email: 'Imel',
    Password: 'Okwuntughe',
    'Confirm password': 'Kwenye okwuntughe',
    'Welcome Back': 'Nnọọ ozo',
    Language: 'Asusu',
    Gender: 'Okike',
    Age: 'Afo',
    Male: 'Nwoke',
    Female: 'Nwanyi',
    Select: 'Horo',
    'Complete Your Onboarding': 'Mezuo nhazi mbu gi',
    'Save & Continue': 'Chekwaa gaa nihu',
    'Saving...': 'Na echekwa...',
    'Skip for now': 'Hapu ya ugbu a',
    'Welcome to OgaDoctor Care': 'Nnọọ na OgaDoctor Care',
    'Start AI Consultation': 'Malite mkparita uka AI',
    'Consult a Doctor': 'Gakwuru dokita',
    'Consult Specialist Doctor': 'Gakwuru dokita okachamara',
    'Join Video Consultation': 'Soro na mkparita uka video',
    Search: 'Choo',
    'Upcoming Appointments': 'Nhọpụta na abia',
    'Care Plan': 'Atumatu nlekota',
    Membership: 'Ndi otu',
    Premium: 'Premium',
    Standard: 'Nkịtị',
    "Today's Tip": 'Ndumodu taa',
    Refresh: 'Megharia',
    'Recent Vitals': 'Nsonaazu nso a',
    'No upcoming appointments.': 'Enweghi nhoputa na abia.',
    'No vitals yet.': 'Enweghi vitals ugbua.',
    'Recommended Articles': 'Edemede akwadoro',
    'Reports & Records': 'Akuko na ndekọ',
    'Refresh Data': 'Megharia data',
    'Lab Results': 'Nsonaazu ule',
    'Medical Documents': 'Akwukwo ahuike',
    'Vaccinations & Screenings': 'Ogwu mgbochi na nyocha',
    'Profile updated successfully.': 'Emelitere profaịlụ nke oma.',
    'Save Changes': 'Chekwaa mgbanwe',
    'AI Consultation': 'Mkparita uka AI',
    'Describe your symptoms...': 'Kowa mgbaàmà gi...',
    Send: 'Zipu',
    'Doctor Access': 'Inweta dokita',
    'Talk to Aisha': 'Kwuo okwu na Aisha',
    'Start Health Chat': 'Malite mkparita uka ahuike',
    'Consultation Paths': 'Uzo mkparita uka',
    'Doctor Messages': 'Ozi Dokita',
    'Our Services': 'Oru anyi',
    'Health Articles': 'Edemede ahuike',
    'See all': 'Lee ha nile',
    Back: 'Laa azu',
    Continue: 'Gaa nihu',
    'Finish Setup': 'Mechaa nhazi',
    'Get the App': 'Nweta app',
    'App Store': 'App Store',
    'Google Play': 'Google Play',
    'Privacy Policy': 'Iwu nzuzo',
    'Terms of Service': 'Usoro oru',
    'Hello,': 'Ndewo,',
  },
  yo: {
    Language: 'Ede',
    English: 'Geesi',
    Hausa: 'Hausa',
    Igbo: 'Igbo',
    Yoruba: 'Yoruba',
    Home: 'Ile',
    About: 'Nipa',
    Services: 'Ise',
    Contact: 'Kan si wa',
    Blog: 'Bulogi',
    Messages: 'Ifiranse',
    Dashboard: 'Dashboard',
    Doctors: 'Dokita',
    Specialists: 'Amoja',
    'Doctor Messages': 'Ifiranse Dokita',
    'AI Chat': 'Ijororo AI',
    'Video Visit': 'Abewo Video',
    Schedule: 'Iseto',
    Notifications: 'Ikilo',
    Reports: 'Iroyin',
    Profile: 'Profaili',
    'Sign In': 'Wole',
    'Sign Up': 'Forukosile',
    'Sign Out': 'Jade',
    'Create Account': 'Seda akanti',
    'Full name': 'Oruko kikun',
    Email: 'Imeeli',
    Password: 'Oro asina',
    'Confirm password': 'Jerii oro asina',
    'Welcome Back': 'Kaabo pada',
    Gender: 'Abo',
    Age: 'Ojo ori',
    Male: 'Okunrin',
    Female: 'Obinrin',
    Select: 'Yan',
    'Complete Your Onboarding': 'Pari eto ibere re',
    'Save & Continue': 'Fipamo ki o tesiwaju',
    'Saving...': 'N fipamo...',
    'Skip for now': 'Foju ko bayi',
    'Welcome to OgaDoctor Care': 'Kaabo si OgaDoctor Care',
    'Start AI Consultation': 'Bere AI consultation',
    'Consult a Doctor': 'Kan si dokita',
    'Consult Specialist Doctor': 'Kan si dokita amoja',
    'Join Video Consultation': 'Darapo mo consultation video',
    Search: 'Wa',
    'Upcoming Appointments': 'Ipade to n bo',
    'Care Plan': 'Eto itoju',
    Membership: 'Iforukosile',
    Premium: 'Premium',
    Standard: 'Bo se wa',
    "Today's Tip": 'Imoran oni',
    Refresh: 'Tun se',
    'Recent Vitals': 'Vitals to sese waye',
    'No upcoming appointments.': 'Ko si ipade to n bo.',
    'No vitals yet.': 'Ko si vitals sibesibe.',
    'Recommended Articles': 'Awon atokoo to dara',
    'Reports & Records': 'Iroyin ati awon igbasilẹ',
    'Refresh Data': 'Tun data se',
    'Lab Results': 'Abajade idanwo',
    'Medical Documents': 'Iwe egbogi',
    'Vaccinations & Screenings': 'Ajesara ati ayewo',
    'Profile updated successfully.': 'A ti se atunse profaili re daada.',
    'Save Changes': 'Fipamo awon ayipada',
    'AI Consultation': 'AI Consultation',
    'Describe your symptoms...': 'So awon aami aisan re...',
    Send: 'Firansẹ',
    'Doctor Access': 'Wiwọle si dokita',
    'Talk to Aisha': 'Ba Aisha soro',
    'Start Health Chat': 'Bere iwiregbe ilera',
    'Consultation Paths': 'Ona consultation',
    'Our Services': 'Awon ise wa',
    'Health Articles': 'Awon nkan ilera',
    'See all': 'Wo gbogbo re',
    Back: 'Pada',
    Continue: 'Tesiwaju',
    'Finish Setup': 'Pari eto',
    'Get the App': 'Gba app',
    'App Store': 'App Store',
    'Google Play': 'Google Play',
    'Privacy Policy': 'Ilana asiri',
    'Terms of Service': 'Ofin ise',
    'Hello,': 'Pele,',
  },
};

const EXTRA_TRANSLATIONS = {
  ha: {
    'All notifications marked as read.':
      'An sanya duk sanarwa a matsayin an karanta.',
    'All rights reserved. Made with care in Nigeria.':
      'An tanadi dukkan hakkoki. An yi shi da kulawa a Najeriya.',
    'Appointment marked as completed.': 'An sanya alawari a matsayin an gama.',
    'Appointment reminders disabled.': 'An kashe tunatarwar alawari.',
    'Appointment reminders enabled.': 'An kunna tunatarwar alawari.',
    'Back to Sign In': 'Koma zuwa shiga',
    'Checking reset link...': 'Ana duba hanyar reset...',
    'Choose a new password for your OgaDoctor account.':
      'Zabi sabuwar kalmar sirri don asusun OgaDoctor dinka.',
    'Confirm Password': 'Tabbatar da kalmar sirri',
    'Secure patient access': 'Shiga mara lafiya cikin tsaro',
    'Your Virtual Clinic': 'Asibitinka na intanet',
    'Trusted healthcare access designed for clarity, speed, and confidence.':
      'Samun kulawar lafiya da aka tsara domin fahimta, sauri, da kwarin gwiwa.',
    'Manage consultations, messages, appointments, and recovery flows in one calm, secure place.':
      'Sarrafa shawarwari, sakonni, alawura, da dawowar lafiya a wuri daya mai natsuwa da tsaro.',
    'Confirm your new password': 'Tabbatar da sabuwar kalmar sirrinka',
    'Development reset link': 'Hanyar reset ta development',
    Doctor: 'Likita',
    'Enter your new password': 'Shigar da sabuwar kalmar sirrinka',
    'Failed to book appointment.': 'An kasa yin booking din alawari.',
    'Failed to update appointment.': 'An kasa sabunta alawari.',
    'Failed to update reminder settings.': 'An kasa sabunta saitin tunatarwa.',
    'Forgot password?': 'Ka manta da kalmar sirri?',
    'My Profile': 'Bayanan martabata',
    'New Password': 'Sabuwar kalmar sirri',
    'No upcoming appointments to sync.':
      'Babu alawura masu zuwa da za a daidaita.',
    'Open this chat to continue.': 'Bude wannan hira domin ci gaba.',
    'Password is required.': 'Ana bukatar kalmar sirri.',
    'Password reset successful. Sign in with your new password.':
      'An sake saita kalmar sirri cikin nasara. Shiga da sabuwar kalmar sirrinka.',
    'Password reset successful. You can now sign in.':
      'An sake saita kalmar sirri cikin nasara. Yanzu za ka iya shiga.',
    'Paste your reset token': 'Manna reset token dinka',
    'Pick a doctor to view your conversation history.':
      'Zabi likita domin duba tarihin hirarka.',
    'Push notifications disabled.': 'An kashe sanarwar push.',
    'Push notifications enabled.': 'An kunna sanarwar push.',
    'Request a new reset link': 'Nemi sabuwar hanyar reset',
    'Reset Password': 'Sake saita kalmar sirri',
    'Reset link is invalid or has expired.':
      'Hanyar reset din ba ta aiki ko kuma ta kare.',
    'Reset token': 'Reset token',
    'Reset token is required.': 'Ana bukatar reset token.',
    'Resetting password...': 'Ana sake saita kalmar sirri...',
    'Search failed.': 'Bincike ya gaza.',
    'Send Reset Link': 'Aika hanyar reset',
    'Sending reset link...': 'Ana aika hanyar reset...',
    'Unable to load doctor conversations.':
      'Ba a iya loda hirarrakin likita ba.',
    'Unable to load doctors right now.': 'Ba a iya loda likitoci yanzu ba.',
    'Unable to load this doctor chat.': 'Ba a iya loda wannan hirar likita ba.',
    'Unable to mark notifications as read.':
      'Ba a iya sanya sanarwa a matsayin an karanta ba.',
    'Unable to reset password right now.':
      'Ba a iya sake saita kalmar sirri yanzu ba.',
    'Unable to save onboarding right now.':
      'Ba a iya adana onboarding yanzu ba.',
    'Unable to send message right now.': 'Ba a iya aika sako yanzu ba.',
    'Unable to start doctor chat right now.':
      'Ba a iya fara hirar likita yanzu ba.',
    'Unable to start password reset right now.':
      'Ba a iya fara sake saita kalmar sirri yanzu ba.',
    'Unable to update push notification settings.':
      'Ba a iya sabunta saitin sanarwar push ba.',
    'Aisha Health AI': 'AI na lafiyar Aisha',
    'Secure assistant chat': 'Hirar mataimaki mai tsaro',
    Close: 'Rufe',
    'Close Aisha chat backdrop': 'Rufe bangon hirar Aisha',
    'Type your health question...': 'Rubuta tambayar lafiyarka...',
    'Open full chat': 'Bude cikakkiyar hira',
    'Hide Aisha chat': 'Boye hirar Aisha',
    'Open Aisha chat': 'Bude hirar Aisha',
    Transcript: 'Rubutaccen bayani',
    Chat: 'Hira',
    'Shared Files': 'Fayilolin da aka raba',
    Save: 'Ajiye',
    'Saving...': 'Ana ajiyewa...',
    'Add important spoken notes here so the consultation is saved as a transcript.':
      'Kara muhimman bayanan da aka fada a nan domin a ajiye shawarar a matsayin rubutaccen bayani.',
    'Add a transcript line or consultation note':
      'Kara layin rubutaccen bayani ko bayanin shawara',
    'Add line': 'Kara layi',
    'Update record': 'Sabunta rikodi',
    'Save transcript': 'Ajiye rubutaccen bayani',
    'Start Live Transcript': 'Fara rubutaccen bayani kai tsaye',
    'Stop Live Transcript': 'Dakatar da rubutaccen bayani kai tsaye',
    'Listening for speech...': 'Ana sauraron magana...',
    'Automatic transcript stays off until you start it.':
      'Rubutaccen bayani na atomatik zai kasance a kashe har sai ka fara shi.',
    'Live transcript unavailable on this browser.':
      'Rubutaccen bayani kai tsaye ba ya samuwa a wannan burauzar.',
    'Live transcript started.': 'An fara rubutaccen bayani kai tsaye.',
    'Live transcript stopped.': 'An dakatar da rubutaccen bayani kai tsaye.',
    'Join a room before starting live transcript.':
      'Shiga daki kafin fara rubutaccen bayani kai tsaye.',
    'Speech recognition permission is required for live transcript.':
      'Ana bukatar izinin gane magana domin rubutaccen bayani kai tsaye.',
    'Speech recognition is not available in {language} on this device.':
      "Ba a samun gane magana na {language} a wannan na'urar.",
    'Unable to start live transcript.':
      'Ba a iya fara rubutaccen bayani kai tsaye ba.',
    'No messages yet.': 'Babu sakonni tukuna.',
    'Type a message': 'Rubuta sako',
    'Share New File': 'Raba sabon fayil',
  },
  ig: {
    'Back to Sign In': 'Laghachi na mbanye',
    'Checking reset link...': 'Na-enyocha njikọ reset...',
    'Choose a new password for your OgaDoctor account.':
      'Horo okwuntughe ohuru maka akauntu OgaDoctor gi.',
    'Confirm Password': 'Kwenye okwuntughe',
    'Secure patient access': 'Nbanye onye oria echekwara',
    'Your Virtual Clinic': 'Ulo ogwu gi na intanet',
    'Trusted healthcare access designed for clarity, speed, and confidence.':
      'Nnweta nlekota ahuike e mere maka ido anya, osooso, na obi ike.',
    'Manage consultations, messages, appointments, and recovery flows in one calm, secure place.':
      'Jikwaa mkparita uka, ozi, nhoputa, na uzo mgbake na otu ebe di juru obi ma chekwaa.',
    'Confirm your new password': 'Kwenye okwuntughe ohuru gi',
    'Development reset link': 'Njikọ reset development',
    Doctor: 'Dọkita',
    'Enter your new password': 'Tinye okwuntughe ohuru gi',
    'Forgot password?': 'I chefuru okwuntughe?',
    'New Password': 'Okwuntughe ohuru',
    'Password is required.': 'A choro okwuntughe.',
    'Password reset successful. Sign in with your new password.':
      'Mmeghari okwuntughe gara nke oma. Jiri okwuntughe ohuru gi banye.',
    'Password reset successful. You can now sign in.':
      'Mmeghari okwuntughe gara nke oma. I nwere ike ibanye ugbu a.',
    'Paste your reset token': 'Mado reset token gi',
    'Request a new reset link': 'Rịọ njikọ reset ohuru',
    'Reset Password': 'Megharia okwuntughe',
    'Reset link is invalid or has expired.':
      'Njikọ reset ezighi ezi ma obu oge ya agafela.',
    'Reset token': 'Reset token',
    'Reset token is required.': 'A choro reset token.',
    'Resetting password...': 'Na-emeghari okwuntughe...',
    'Send Reset Link': 'Zipu njikọ reset',
    'Sending reset link...': 'Na-ezipu njikọ reset...',
    'Unable to reset password right now.':
      'Enweghị ike imeghari okwuntughe ugbu a.',
    'Unable to start password reset right now.':
      'Enweghị ike ibido mmeghari okwuntughe ugbu a.',
    'Aisha Health AI': 'AI Ahụike Aisha',
    'Secure assistant chat': 'Mkparịta ụka enyemaka echekwara',
    Close: 'Mechie',
    'Type your health question...': 'Dee ajụjụ ahụike gị...',
    'Open full chat': 'Mepee mkparịta ụka zuru ezu',
    'Hide Aisha chat': 'Zoo mkparịta ụka Aisha',
    'Open Aisha chat': 'Mepee mkparịta ụka Aisha',
    Transcript: 'Ndekọ mkparịta ụka',
    Chat: 'Mkparịta ụka',
    'Shared Files': 'Faịlụ e kesara',
    Save: 'Chekwaa',
    'Saving...': 'Na-echekwa...',
    'Add line': 'Tinye ahiri',
    'Update record': 'Melite ndekọ',
    'Save transcript': 'Chekwaa ndekọ',
    'Start Live Transcript': 'Bido ndekọ ndụ',
    'Stop Live Transcript': 'Kwụsị ndekọ ndụ',
    'Listening for speech...': 'Na-ege okwu...',
    'Automatic transcript stays off until you start it.':
      'Ndekọ akpaka ga-anọ gbanyụọ ruo mgbe ị malitere ya.',
    'Live transcript unavailable on this browser.':
      'Ndekọ ndụ adịghị na ihe nchọgharị a.',
    'Live transcript started.': 'Ebidola ndekọ ndụ.',
    'Live transcript stopped.': 'Akwụsịla ndekọ ndụ.',
    'Join a room before starting live transcript.':
      'Soro ulo tupu ibido ndekọ ndụ.',
    'Speech recognition permission is required for live transcript.':
      'Achọrọ ikike ịmata okwu maka ndekọ ndụ.',
    'Speech recognition is not available in {language} on this device.':
      'Ịmata okwu maka {language} adịghị na ngwaọrụ a.',
    'Unable to start live transcript.': 'Enweghị ike ibido ndekọ ndụ.',
    'No messages yet.': 'Enweghị ozi ugbu a.',
    'Type a message': 'Dee ozi',
    'Share New File': 'Kesaa faịlụ ohuru',
  },
  yo: {
    'Back to Sign In': 'Pada si oju-iwe iwole',
    'Checking reset link...': 'N ṣayẹwo ọna asopọ reset...',
    'Choose a new password for your OgaDoctor account.':
      'Yan oro asina tuntun fun akanti OgaDoctor re.',
    'Confirm Password': 'Jerii oro asina',
    'Secure patient access': 'Wiwole alaisan to ni aabo',
    'Your Virtual Clinic': 'Ile iwosan ayelujara re',
    'Trusted healthcare access designed for clarity, speed, and confidence.':
      'Iwole itoju ilera ti a se fun alaye kedere, iyara, ati igbekele.',
    'Manage consultations, messages, appointments, and recovery flows in one calm, secure place.':
      'Se amojuto ijumoran, ifiranse, ipade, ati imularada ni ibi kan to dake ati to ni aabo.',
    'Confirm your new password': 'Jerii oro asina tuntun re',
    'Development reset link': 'Ọna asopọ reset development',
    Doctor: 'Dọkita',
    'Enter your new password': 'Tẹ oro asina tuntun re sii',
    'Forgot password?': 'O gbagbe oro asina bi?',
    'New Password': 'Oro asina tuntun',
    'Password is required.': 'A nilo oro asina.',
    'Password reset successful. Sign in with your new password.':
      'Atunse oro asina ti se tan. Wole pelu oro asina tuntun re.',
    'Password reset successful. You can now sign in.':
      'Atunse oro asina ti se tan. O le wole bayi.',
    'Paste your reset token': 'Fi reset token re sii',
    'Request a new reset link': 'Beere fun ọna asopọ reset tuntun',
    'Reset Password': 'Tun oro asina se',
    'Reset link is invalid or has expired.':
      'Ọna asopọ reset naa ko wulo tabi akoko re ti pari.',
    'Reset token': 'Reset token',
    'Reset token is required.': 'A nilo reset token.',
    'Resetting password...': 'N tun oro asina se...',
    'Send Reset Link': 'Fi ọna asopọ reset ranṣẹ',
    'Sending reset link...': 'N fi ọna asopọ reset ranṣẹ...',
    'Unable to reset password right now.': 'Ko ṣee tun oro asina se bayii.',
    'Unable to start password reset right now.':
      'Ko ṣee bẹrẹ atunse oro asina bayii.',
    'Aisha Health AI': 'AI Ilera Aisha',
    'Secure assistant chat': 'Iwiregbe oluranlọwọ to ni aabo',
    Close: 'Pa a',
    'Type your health question...': 'Ko ibeere ilera re...',
    'Open full chat': 'Ṣii iwiregbe kikun',
    'Hide Aisha chat': 'Fi iwiregbe Aisha pamọ',
    'Open Aisha chat': 'Ṣii iwiregbe Aisha',
    Transcript: 'Akọsilẹ iwiregbe',
    Chat: 'Iwiregbe',
    'Shared Files': 'Awon faili ti a pín',
    Save: 'Fipamo',
    'Saving...': 'N fipamo...',
    'Add line': 'Fi ila kun',
    'Update record': 'Tun igbasilẹ se',
    'Save transcript': 'Fipamo akọsilẹ',
    'Start Live Transcript': 'Bere akọsilẹ laaye',
    'Stop Live Transcript': 'Da akọsilẹ laaye duro',
    'Listening for speech...': 'N gbọ ọrọ...',
    'Automatic transcript stays off until you start it.':
      'Akọsilẹ aladaaṣe yoo wa ni pipa titi ti o fi bẹrẹ rẹ.',
    'Live transcript unavailable on this browser.':
      'Akọsilẹ laaye ko si lori burausa yii.',
    'Live transcript started.': 'Akọsilẹ laaye ti bẹrẹ.',
    'Live transcript stopped.': 'A ti da akọsilẹ laaye duro.',
    'Join a room before starting live transcript.':
      'Darapọ mọ yara ki o to bẹrẹ akọsilẹ laaye.',
    'Speech recognition permission is required for live transcript.':
      'A nilo aṣẹ idanimọ ọrọ fun akọsilẹ laaye.',
    'Speech recognition is not available in {language} on this device.':
      'Idanimọ ọrọ fun {language} ko si lori ẹrọ yii.',
    'Unable to start live transcript.': 'Ko ṣeé bẹrẹ akọsilẹ laaye.',
    'No messages yet.': 'Ko si ifiranse sibesibe.',
    'Type a message': 'Ko ifiranse',
    'Share New File': 'Pin faili tuntun',
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

export function getLanguageMeta(language = 'en') {
  return (
    SUPPORTED_LANGUAGES.find(
      (item) => item.code === normalizeLanguage(language),
    ) || SUPPORTED_LANGUAGES[0]
  );
}

export function getStoredLanguage() {
  if (typeof window === 'undefined') return null;
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedLanguage ? normalizeLanguage(storedLanguage) : null;
}

export function saveStoredLanguage(language = 'en') {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    LANGUAGE_STORAGE_KEY,
    normalizeLanguage(language),
  );
}

export function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  return normalizeLanguage(
    navigator.language || navigator.languages?.[0] || 'en',
  );
}

export function translateText(language = 'en', text = '', params = {}) {
  const normalized = normalizeLanguage(language);
  const message =
    I18N_COVERAGE_TRANSLATIONS[normalized]?.[text] ||
    (normalized === 'pcm'
      ? PIDGIN_TRANSLATIONS[text] || PIDGIN_EXTRA_TRANSLATIONS[text]
      : undefined) ||
    TRANSLATIONS[normalized]?.[text] ||
    EXTRA_TRANSLATIONS[normalized]?.[text] ||
    text;
  return interpolate(message, params);
}
