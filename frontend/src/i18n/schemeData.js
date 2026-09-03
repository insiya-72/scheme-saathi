// Scheme Saathi - Localized Scheme Data & Explore Localization Module
import { UI_TRANSLATIONS } from "./translations.js";

// Explore-specific UI labels by language
const EXPLORE_UI_TRANSLATIONS = {
  en: {
    primaryEyebrow: "PRIMARY",
    coreSchemesTitle: "PS-Core Schemes",
    coreSchemesBadge: "5 CORE SCHEMES",
    financialRange: "Financial Range",
    eligibilityTitle: "Eligibility",
    indicativeDocuments: "Indicative Documents",
    docRequirementsNote:
      "Final document requirements may vary by the concerned channelizing / lending agency.",
    applicationRoute: "Application route:",
    secondaryEyebrow: "SECONDARY",
    connectedSupportTitle: "Related / Connected Support",
    visvasTitle: "VISVAS — Connected Interest Support",
    visvasDesc:
      "Eligible SC, OBC and Safai Karamchari individual beneficiaries may receive interest subvention support, subject to the separate VISVAS eligibility conditions.",
    interestSupport: "Interest Support",
    visvasInterestValue: "Up to 5%",
    individualLoan: "Individual Loan",
    visvasLoanValue: "Up to ₹5 lakh",
    route: "Route",
    lendingInstitutions: "Lending Institutions",
    visvasDisclaimer:
      "VISVAS is shown as connected support and is not treated as one of the five primary NSFDC scheme recommendations.",
    wantPersonalized: "WANT PERSONALIZED RESULTS?",
    findMatchedSchemes: "Find schemes matched to your personal profile.",
    signInMatchedSchemes: "Sign in to find schemes matched to your profile.",
  },
  hi: {
    primaryEyebrow: "प्राथमिक",
    coreSchemesTitle: "पीएस-कोर मुख्य योजनाएं",
    coreSchemesBadge: "5 मुख्य योजनाएं",
    financialRange: "वित्तीय दायरा",
    eligibilityTitle: "पात्रता मानदंड",
    indicativeDocuments: "संकेतक दस्तावेज",
    docRequirementsNote:
      "अंतिम दस्तावेज़ आवश्यकताएं संबंधित चैनलिंग / ऋणदाता एजेंसी के अनुसार भिन्न हो सकती हैं।",
    applicationRoute: "आवेदन मार्ग:",
    secondaryEyebrow: "द्वितीयक सहायता",
    connectedSupportTitle: "संबद्ध / जुड़ी हुई सहायता",
    visvasTitle: "विश्वास (VISVAS) — संबद्ध ब्याज सहायता",
    visvasDesc:
      "पात्र अनुसूचित जाति, अन्य पिछड़ा वर्ग और सफाई कर्मचारी व्यक्तिगत लाभार्थी ब्याज अनुदान सहायता प्राप्त कर सकते हैं, जो अलग विश्वास पात्रता शर्तों के अधीन है।",
    interestSupport: "ब्याज सहायता",
    visvasInterestValue: "5% तक",
    individualLoan: "व्यक्तिगत ऋण",
    visvasLoanValue: "₹5 लाख तक",
    route: "मार्ग",
    lendingInstitutions: "ऋणदाता संस्थान",
    visvasDisclaimer:
      "विश्वास को संबद्ध सहायता के रूप में दिखाया गया है और इसे एनएसएफडीसी की पांच प्राथमिक योजनाओं में नहीं माना जाता है।",
    wantPersonalized: "व्यक्तिगत परिणाम चाहते हैं?",
    findMatchedSchemes: "अपनी व्यक्तिगत प्रोफ़ाइल से मेल खाने वाली योजनाएं खोजें।",
    signInMatchedSchemes: "अपनी प्रोफ़ाइल से मेल खाने वाली योजनाएं खोजने के लिए साइन इन करें।",
  },
  bn: {
    primaryEyebrow: "প্রাথমিক",
    coreSchemesTitle: "পিএস-কোর মূল স্কিম",
    coreSchemesBadge: "৫টি মূল স্কিম",
    financialRange: "আর্থিক পরিসর",
    eligibilityTitle: "যোগ্যতার মানদণ্ড",
    indicativeDocuments: "প্রয়োজনীয় নির্দেশক নথিপত্র",
    docRequirementsNote:
      "চূড়ান্ত নথির প্রয়োজনীয়তা সংশ্লিষ্ট ঋণ প্রদানকারী সংস্থার ওপর নির্ভর করতে পারে।",
    applicationRoute: "আবেদনের মাধ্যম:",
    secondaryEyebrow: "সংযুক্ত সহায়তা",
    connectedSupportTitle: "সম্পর্কিত / সংযুক্ত সহায়তা",
    visvasTitle: "বিশ্বাস (VISVAS) — সংযুক্ত সুদ সহায়তা",
    visvasDesc:
      "যোগ্য এসসি, ওবিসি এবং সাফাই কর্মচারী ব্যক্তিগত সুবিধাভোগীরা সুদ ভর্তুকি সহায়তা পেতে পারেন।",
    interestSupport: "সুদ সহায়তা",
    visvasInterestValue: "৫% পর্যন্ত",
    individualLoan: "ব্যক্তিগত ঋণ",
    visvasLoanValue: "₹৫ লাখ পর্যন্ত",
    route: "মাধ্যম",
    lendingInstitutions: "ঋণ প্রদানকারী প্রতিষ্ঠান",
    visvasDisclaimer:
      "বিশ্বাস স্কিমটি সংযুক্ত সহায়তা হিসাবে দেখানো হয়েছে এবং এনএসএফডিসির পাঁচটি প্রাথমিক স্কিমে অন্তর্ভুক্ত নয়।",
    wantPersonalized: "ব্যক্তিগতকৃত ফলাফল চান?",
    findMatchedSchemes: "আপনার ব্যক্তিগত প্রোফাইলের সাথে মেলে এমন স্কিম খুঁজুন।",
    signInMatchedSchemes: "আপনার প্রোফাইলের সাথে মেলে এমন স্কিম খুঁজতে সাইন ইন করুন।",
  },
  ta: {
    primaryEyebrow: "முதன்மை",
    coreSchemesTitle: "பிஎஸ்-கோர் முதன்மைத் திட்டங்கள்",
    coreSchemesBadge: "5 முதன்மைத் திட்டங்கள்",
    financialRange: "நிதி வரம்பு",
    eligibilityTitle: "தகுதி வரம்புகள்",
    indicativeDocuments: "தேவையான ஆவணங்கள்",
    docRequirementsNote:
      "இறுதி ஆவணத் தேவைகள் சம்பந்தப்பட்ட கடன் வழங்கும் நிறுவனத்தைப் பொறுத்து மாறுபடலாம்.",
    applicationRoute: "விண்ணப்பிக்கும் வழி:",
    secondaryEyebrow: "கூடுதல் ஆதரவு",
    connectedSupportTitle: "தொடர்புடைய / கூடுதல் ஆதரவு",
    visvasTitle: "விஸ்வாஸ் (VISVAS) — வட்டி மானிய ஆதரவு",
    visvasDesc:
      "தகுதியான எஸ்சி, ஓபிசி மற்றும் தூய்மைப் பணியாளர்கள் வட்டி மானிய ஆதரவைப் பெறலாம்.",
    interestSupport: "வட்டி ஆதரவு",
    visvasInterestValue: "5% வரை",
    individualLoan: "தனிநபர் கடன்",
    visvasLoanValue: "₹5 லட்சம் வரை",
    route: "வழிமுறை",
    lendingInstitutions: "கடன் வழங்கும் நிறுவனங்கள்",
    visvasDisclaimer:
      "விஸ்வாஸ் கூடுதல் ஆதரவாகக் காட்டப்படுகிறது, இது ஐந்து முதன்மைத் திட்டங்களில் ஒன்றாகக் கருதப்படாது.",
    wantPersonalized: "தனிப்பயனாக்கப்பட்ட பரிந்துரைகள் வேண்டுமா?",
    findMatchedSchemes: "உங்கள் சுயவிவரத்திற்குப் பொருத்தமான திட்டங்களைக் கண்டறியவும்.",
    signInMatchedSchemes: "பொருத்தமான திட்டங்களைக் கண்டறிய உள்நுழையவும்.",
  },
  te: {
    primaryEyebrow: "ప్రాథమిక",
    coreSchemesTitle: "పీఎస్-కోర్ ప్రధాన పథకాలు",
    coreSchemesBadge: "5 ప్రధాన పథకాలు",
    financialRange: "ఆర్థిక పరిమితి",
    eligibilityTitle: "అర్హత ప్రమాణాలు",
    indicativeDocuments: "అవసరమైన పత్రాలు",
    docRequirementsNote:
      "తుది పత్రాల అవసరాలు సంబంధిత రుణ సంస్థ నిబంధనలపై ఆధారపడి ఉండవచ్చు.",
    applicationRoute: "దరఖాస్తు మార్గం:",
    secondaryEyebrow: "అనుబంధ మద్దతు",
    connectedSupportTitle: "సంబంధిత / అనుబంధ మద్దతు",
    visvasTitle: "విశ్వాస్ (VISVAS) — వడ్డీ రాయితీ మద్దతు",
    visvasDesc:
      "అర్హులైన ఎస్సీ, ఓబీసీ మరియు సఫాయి కర్మచారి లబ్ధిదారులు వడ్డీ రాయితీ మద్దతు పొందవచ్చు.",
    interestSupport: "వడ్డీ మద్దతు",
    visvasInterestValue: "5% వరకు",
    individualLoan: "వ్యక్తిగత రుణం",
    visvasLoanValue: "₹5 లక్షల వరకు",
    route: "మార్గం",
    lendingInstitutions: "రుణ సంస్థలు",
    visvasDisclaimer:
      "విశ్వాస్ అనుబంధ మద్దతుగా చూపబడింది మరియు ఐదు ప్రాథమిక ఎన్‌ఎస్‌ఎఫ్‌డిసి పథకాలలో ఒకటిగా పరిగణించబడదు.",
    wantPersonalized: "వ్యక్తిగతీకరించిన ఫలితాలు కావాలా?",
    findMatchedSchemes: "మీ ప్రొఫైల్‌కు సరిపోలే పథకాలను కనుగొనండి.",
    signInMatchedSchemes: "సరిపోలే పథకాలను కనుగొనడానికి సైన్ ఇన్ చేయండి.",
  },
  mr: {
    primaryEyebrow: "प्राथमिक",
    coreSchemesTitle: "पीएस-कोर मुख्य योजना",
    coreSchemesBadge: "५ मुख्य योजना",
    financialRange: "आर्थिक मर्यादा",
    eligibilityTitle: "पात्रता निकष",
    indicativeDocuments: "आवश्यक कागदपत्रे",
    docRequirementsNote:
      "अंतिम कागदपत्रांची आवश्यकता संबंधित चॅनेलायझिंग / कर्ज देणाऱ्या संस्थेवर अवलंबून असू शकते.",
    applicationRoute: "अर्ज मार्ग:",
    secondaryEyebrow: "दुय्यम सहाय्य",
    connectedSupportTitle: "संबंधित / जोडलेले सहाय्य",
    visvasTitle: "विश्वास (VISVAS) — जोडलेले व्याज सहाय्य",
    visvasDesc:
      "पात्र एससी, ओबीसी आणि सफाई कर्मचारी वैयक्तिक लाभार्थी व्याज सवलत सहाय्य मिळवू शकतात.",
    interestSupport: "व्याज सहाय्य",
    visvasInterestValue: "५% पर्यंत",
    individualLoan: "वैयक्तिक कर्ज",
    visvasLoanValue: "₹५ लाखांपर्यंत",
    route: "मार्ग",
    lendingInstitutions: "कर्ज देणाऱ्या संस्था",
    visvasDisclaimer:
      "विश्वास ही जोडलेली मदत म्हणून दाखवली आहे आणि पाच प्राथमिक योजनांपैकी एक मानली जात नाही.",
    wantPersonalized: "वैयक्तिकृत निकाल हवे आहेत?",
    findMatchedSchemes: "तुमच्या प्रोफाइलशी जुळणाऱ्या योजना शोधा.",
    signInMatchedSchemes: "जुळणाऱ्या योजना शोधण्यासाठी साइन इन करा.",
  },
  gu: {
    primaryEyebrow: "પ્રાથમિક",
    coreSchemesTitle: "પીએસ-કોર મુખ્ય યોજનાઓ",
    coreSchemesBadge: "5 મુખ્ય યોજનાઓ",
    financialRange: "નાણાકીય મર્યાદા",
    eligibilityTitle: "પાત્રતા માપદંડ",
    indicativeDocuments: "જરૂરી દસ્તાવેજો",
    docRequirementsNote:
      "આખરી દસ્તાવેજ જરૂરિયાતો સંબંધિત ચેનલાઇઝિંગ / ધિરાણ સંસ્થા અનુસાર બદલાઈ શકે છે.",
    applicationRoute: "અરજી માર્ગ:",
    secondaryEyebrow: "ગૌણ સહાય",
    connectedSupportTitle: "સંબંધિત / જોડાયેલ સહાય",
    visvasTitle: "વિશ્વાસ (VISVAS) — વ્યાજ સહાય",
    visvasDesc:
      "પાત્ર અનુસૂચિત જાતિ, ઓબીસી અને સફાઈ કર્મચારી લાભાર્થીઓ વ્યાજ સબવેન્શન સહાય મેળવી શકે છે.",
    interestSupport: "વ્યાજ સહાય",
    visvasInterestValue: "5% સુધી",
    individualLoan: "વ્યક્તિગત લોન",
    visvasLoanValue: "₹5 લાખ સુધી",
    route: "માર્ગ",
    lendingInstitutions: "ધિરાણ સંસ્થાઓ",
    visvasDisclaimer:
      "વિશ્વાસ જોડાયેલ સહાય તરીકે દર્શાવેલ છે અને તેને પ્રાથમિક પાંચ યોજનાઓમાં ગણવામાં આવતી નથી.",
    wantPersonalized: "વ્યક્તિગત પરિણામો જોઈએ છે?",
    findMatchedSchemes: "તમારી પ્રોફાઇલ સાથે મેળ ખાતી યોજનાઓ શોધો.",
    signInMatchedSchemes: "મેળ ખાતી યોજનાઓ શોધવા માટે સાઇન ઇન કરો.",
  },
  kn: {
    primaryEyebrow: "ಪ್ರಾಥಮಿಕ",
    coreSchemesTitle: "ಪಿಎಸ್-ಕೋರ್ ಮುಖ್ಯ ಯೋಜನೆಗಳು",
    coreSchemesBadge: "5 ಮುಖ್ಯ ಯೋಜನೆಗಳು",
    financialRange: "ಹಣಕಾಸು ಶ್ರೇಣಿ",
    eligibilityTitle: "ಅರ್ಹತಾ ಮಾನದಂಡಗಳು",
    indicativeDocuments: "ಅಗತ್ಯ ದಾಖಲೆಗಳು",
    docRequirementsNote:
      "ಅಂತಿಮ ದಾಖಲಾತಿ ಅವಶ್ಯಕತೆಗಳು ಸಂಬಂಧಿತ ಸಾಲ ನೀಡುವ ಸಂಸ್ಥೆಯ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿರುತ್ತವೆ.",
    applicationRoute: "ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಮಾರ್ಗ:",
    secondaryEyebrow: "ಅನುಬಂಧ ಬೆಂಬಲ",
    connectedSupportTitle: "ಸಂಬಂಧಿತ / ಅನುಬಂಧ ಬೆಂಬಲ",
    visvasTitle: "ವಿಶ್ವಾಸ್ (VISVAS) — ಬಡ್ಡಿ ರಿಯಾಯಿತಿ ಬೆಂಬಲ",
    visvasDesc:
      "ಅರ್ಹ ಎಸ್‌ಸಿ, ಒಬಿಸಿ ಮತ್ತು ಸಫಾಯಿ ಕರ್ಮಚಾರಿ ಫಲಾನುಭವಿಗಳು ಬಡ್ಡಿ ಸಬ್ವೆನ್ಷನ್ ಬೆಂಬಲವನ್ನು ಪಡೆಯಬಹುದು.",
    interestSupport: "ಬಡ್ಡಿ ಬೆಂಬಲ",
    visvasInterestValue: "5% ವರೆಗೆ",
    individualLoan: "ವೈಯಕ್ತಿಕ ಸಾಲ",
    visvasLoanValue: "₹5 ಲಕ್ಷದವರೆಗೆ",
    route: "ಮಾರ್ಗ",
    lendingInstitutions: "ಸಾಲ ನೀಡುವ ಸಂಸ್ಥೆಗಳು",
    visvasDisclaimer:
      "ವಿಶ್ವಾಸ್ ಅನ್ನು ಅನುಬಂಧ ಬೆಂಬಲವಾಗಿ ತೋರಿಸಲಾಗಿದೆ ಮತ್ತು ಐದು ಪ್ರಾಥಮಿಕ ಯೋಜನೆಗಳಲ್ಲಿ ಒಂದಾಗಿ ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ.",
    wantPersonalized: "ವೈಯಕ್ತಿಕ ಫಲಿತಾಂಶಗಳು ಬೇಕೇ?",
    findMatchedSchemes: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ಗೆ ಸೂಕ್ತವಾದ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ.",
    signInMatchedSchemes: "ಸೂಕ್ತ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
  },
  ml: {
    primaryEyebrow: "പ്രാഥമികം",
    coreSchemesTitle: "പിഎസ്-കോർ പ്രധാന പദ്ധതികൾ",
    coreSchemesBadge: "5 പ്രധാന പദ്ധതികൾ",
    financialRange: "സാമ്പത്തിക പരിധി",
    eligibilityTitle: "യോഗ്യതാ മാനദണ്ഡങ്ങൾ",
    indicativeDocuments: "ആവശ്യമായ രേഖകൾ",
    docRequirementsNote:
      "അന്തിമ രേഖകളുടെ ആവശ്യകത ബന്ധപ്പെട്ട വായ്പാ ഏജൻസിയെ ആശ്രയിച്ചിരിക്കും.",
    applicationRoute: "അപേക്ഷാ മാർഗ്ഗം:",
    secondaryEyebrow: "അനുബന്ധ പിന്തുണ",
    connectedSupportTitle: "അനുബന്ധ പിന്തുണ",
    visvasTitle: "വിശ്വാസ് (VISVAS) — പലിശ സബ്‌സിഡി പിന്തുണ",
    visvasDesc:
      "അർഹരായ എസ്‌സി, ഒബിസി, സഫായി കർമ്മചാരി ഗുണഭോക്താക്കൾക്ക് പലിശ സബ്‌സിഡി പിന്തുണ ലഭിക്കും.",
    interestSupport: "പലിശ പിന്തുണ",
    visvasInterestValue: "5% വരെ",
    individualLoan: "വ്യക്തിഗത വായ്പ",
    visvasLoanValue: "₹5 ലക്ഷം വരെ",
    route: "മാർഗ്ഗം",
    lendingInstitutions: "വായ്പാ സ്ഥാപനങ്ങൾ",
    visvasDisclaimer:
      "വിശ്വാസ് അനുബന്ധ പിന്തുണയായി കാണിച്ചിരിക്കുന്നു, അഞ്ച് പ്രധാന പദ്ധതികളിൽ ഒന്നായി കണക്കാക്കില്ല.",
    wantPersonalized: "വ്യക്തിഗത ശുപാർശകൾ വേണമോ?",
    findMatchedSchemes: "നിങ്ങളുടെ പ്രൊഫൈലിന് അനുയോജ്യമായ പദ്ധതികൾ കണ്ടെത്തുക.",
    signInMatchedSchemes: "പദ്ധതികൾ കണ്ടെത്തുന്നതിനായി സൈൻ ഇൻ ചെയ്യുക.",
  },
  pa: {
    primaryEyebrow: "ਮੁੱਢਲੀ",
    coreSchemesTitle: "ਪੀਐਸ-ਕੋਰ ਮੁੱਖ ਯੋਜਨਾਵਾਂ",
    coreSchemesBadge: "5 ਮੁੱਖ ਯੋਜਨਾਵਾਂ",
    financialRange: "ਵਿੱਤੀ ਸੀਮਾ",
    eligibilityTitle: "ਯੋਗਤਾ ਦੇ ਮਾਪਦੰਡ",
    indicativeDocuments: "ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼",
    docRequirementsNote:
      "ਅੰਤਿਮ ਦਸਤਾਵੇਜ਼ਾਂ ਦੀ ਲੋੜ ਸਬੰਧਤ ਕਰਜ਼ਾ ਦੇਣ ਵਾਲੀ ਏਜੰਸੀ ਅਨੁਸਾਰ ਵੱਖ ਹੋ ਸਕਦੀ ਹੈ।",
    applicationRoute: "ਅਰਜ਼ੀ ਦਾ ਰਸਤਾ:",
    secondaryEyebrow: "ਸਹਾਇਕ ਸਹਾਇਤਾ",
    connectedSupportTitle: "ਸੰਬੰਧਿਤ / ਸਹਾਇਕ ਸਹਾਇਤਾ",
    visvasTitle: "ਵਿਸ਼ਵਾਸ (VISVAS) — ਵਿਆਜ ਸਹਾਇਤਾ",
    visvasDesc:
      "ਯੋਗ ਅਨੁਸੂਚਿਤ ਜਾਤੀ, ਓਬੀਸੀ ਅਤੇ ਸਫ਼ਾਈ ਕਰਮਚਾਰੀ ਲਾਭਪਾਤਰੀ ਵਿਆਜ ਸਬਸਿਡੀ ਸਹਾਇਤਾ ਪ੍ਰਾਪਤ ਕਰ ਸਕਦੇ ਹਨ।",
    interestSupport: "ਵਿਆਜ ਸਹਾਇਤਾ",
    visvasInterestValue: "5% ਤੱਕ",
    individualLoan: "ਨਿੱਜੀ ਕਰਜ਼ਾ",
    visvasLoanValue: "₹5 ਲੱਖ ਤੱਕ",
    route: "ਰਸਤਾ",
    lendingInstitutions: "ਕਰਜ਼ਾ ਦੇਣ ਵਾਲੇ ਅਦਾਰੇ",
    visvasDisclaimer:
      "ਵਿਸ਼ਵਾਸ ਨੂੰ ਸਹਾਇਕ ਸਹਾਇਤਾ ਵਜੋਂ ਦਿਖਾਇਆ ਗਿਆ ਹੈ ਅਤੇ ਪੰਜ ਮੁੱਖ ਯੋਜਨਾਵਾਂ ਵਿੱਚ ਸ਼ਾਮਲ ਨਹੀਂ ਹੈ।",
    wantPersonalized: "ਨਿੱਜੀ ਨਤੀਜੇ ਚਾਹੁੰਦੇ ਹੋ?",
    findMatchedSchemes: "ਆਪਣੀ ਪ੍ਰੋਫਾਈਲ ਅਨੁਸਾਰ ਢੁਕਵੀਆਂ ਯੋਜਨਾਵਾਂ ਲੱਭੋ।",
    signInMatchedSchemes: "ਯੋਜਨਾਵਾਂ ਲੱਭਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ।",
  },
  ur: {
    primaryEyebrow: "بنیادی",
    coreSchemesTitle: "پی ایس کور بنیادی اسکیمیں",
    coreSchemesBadge: "5 بنیادی اسکیمیں",
    financialRange: "مالیاتی حد",
    eligibilityTitle: "اہلیت کے معیارات",
    indicativeDocuments: "ضروری دستاویزات",
    docRequirementsNote:
      "حتمی دستاویزات کی ضروریات متعلقہ قرض دہندہ ایجنسی کے مطابق مختلف ہو سکتی ہیں۔",
    applicationRoute: "درخواست کا راستہ:",
    secondaryEyebrow: "ثانوی معاونت",
    connectedSupportTitle: "متعلقہ / ثانوی معاونت",
    visvasTitle: "وشواس (VISVAS) — سود میں رعایت کی معاونت",
    visvasDesc:
      "اہل ایس سی، او بی سی اور صفائی کرمچاری افراد سود میں رعایت کی معاونت حاصل کر سکتے ہیں۔",
    interestSupport: "سود کی معاونت",
    visvasInterestValue: "5% تک",
    individualLoan: "انفرادی قرض",
    visvasLoanValue: "₹5 لاکھ تک",
    route: "راستہ",
    lendingInstitutions: "قرض دینے والے ادارے",
    visvasDisclaimer:
      "وشواس کو ثانوی معاونت کے طور پر دکھایا گیا ہے اور اسے این ایس ایف ڈی سی کی پانچ بنیادی اسکیموں میں شمار نہیں کیا جاتا ہے۔",
    wantPersonalized: "ذاتی نوعیت کے نتائج چاہتے ہیں؟",
    findMatchedSchemes: "اپنے پروفائل کے مطابق موزوں اسکیمیں تلاش کریں۔",
    signInMatchedSchemes: "موزوں اسکیمیں تلاش کرنے کے لیے سائن ان کریں۔",
  },
};

const DOC_AND_TRACKING_TRANSLATIONS = {
  en: {
    documentCenter: "Document Center",
    documentCenterTitle: "Centralized Document Center",
    documentCenterSubtitle:
      "Upload, manage, and verify required certificates and documents for government concessional credit schemes.",
    documentChecklist: "Required Documents Checklist",
    completionStatus: "Document Readiness",
    uploadedDocs: "Uploaded Documents",
    noUploadedDocs:
      "No documents uploaded yet. Upload your certificates to speed up application verification.",
    uploadDocument: "Upload Document",
    dragDropNotice: "Click to browse or drag & drop files (PDF, JPG, PNG up to 10MB)",
    uploading: "Uploading...",
    verifiedBadge: "Verified",
    pendingBadge: "Uploaded / Under Review",
    notUploadedBadge: "Not Uploaded",
    mandatoryBadge: "Mandatory",
    optionalBadge: "Optional",
    deleteDoc: "Delete",
    downloadDoc: "Download",
    selectDocType: "Select Document Type",

    trackApplication: "Track Application",
    trackApplicationTitle: "Live Application Tracker",
    trackApplicationSubtitle:
      "Track the status of your concessional loan application in real-time.",
    searchApplicationPlaceholder:
      "Enter Application Number (e.g. SS-2026-MFS-1001) or 10-digit mobile number",
    trackStatusBtn: "Track Status",
    trackingResults: "Application Status Details",
    currentStage: "Current Stage",
    nextStepLabel: "Next Step Guidance",
    progress: "Overall Progress",
    appliedOn: "Applied Date",
    loanAmountRequested: "Requested Loan Amount",
    channelPartnerAssigned: "Assigned Channel Partner",
    schemeNameLabel: "Scheme Name",
    applicantNameLabel: "Applicant Name",
    applicantPhoneLabel: "Mobile Number",
    statusLabel: "Status",
    timelineLabel: "Application Milestones",
    myApplicationsTitle: "My Submitted Applications",
    noApplicationsFound:
      "No application found matching this number or mobile. Please check and try again.",
    applyNowBtn: "Apply for Scheme",
    applySchemeModalTitle: "Submit Concessional Loan Application",
    confirmAndSubmit: "Confirm & Submit Application",
    submitting: "Submitting...",
    applicationSubmittedNotice:
      "Your application has been registered successfully! Note your Application Number for tracking.",
  },
  hi: {
    documentCenter: "दस्तावेज़ केंद्र",
    documentCenterTitle: "केंद्रीकृत दस्तावेज़ केंद्र",
    documentCenterSubtitle:
      "सरकारी रियायती ऋण योजनाओं के लिए आवश्यक प्रमाण पत्र और दस्तावेज़ अपलोड और प्रबंधित करें।",
    documentChecklist: "आवश्यक दस्तावेज़ चेकलिस्ट",
    completionStatus: "दस्तावेज़ तैयारी स्थिति",
    uploadedDocs: "अपलोड किए गए दस्तावेज़",
    noUploadedDocs:
      "अभी तक कोई दस्तावेज़ अपलोड नहीं किया गया है। सत्यापन में तेज़ी लाने के लिए अपने प्रमाण पत्र अपलोड करें।",
    uploadDocument: "दस्तावेज़ अपलोड करें",
    dragDropNotice: "ब्राउज़ करने के लिए क्लिक करें या फ़ाइल खींचें (PDF, JPG, PNG 10MB तक)",
    uploading: "अपलोड हो रहा है...",
    verifiedBadge: "सत्यापित",
    pendingBadge: "अपलोड किया गया / समीक्षाधीन",
    notUploadedBadge: "अपलोड नहीं किया गया",
    mandatoryBadge: "अनिवार्य",
    optionalBadge: "वैकल्पिक",
    deleteDoc: "हटाएं",
    downloadDoc: "डाउनलोड",
    selectDocType: "दस्तावेज़ का प्रकार चुनें",

    trackApplication: "आवेदन ट्रैक करें",
    trackApplicationTitle: "लाइव आवेदन ट्रैकर",
    trackApplicationSubtitle:
      "वास्तविक समय में अपने रियायती ऋण आवेदन की स्थिति ट्रैक करें।",
    searchApplicationPlaceholder:
      "आवेदन नंबर (उदा. SS-2026-MFS-1001) या 10-अंकों का मोबाइल नंबर दर्ज करें",
    trackStatusBtn: "स्थिति देखें",
    trackingResults: "आवेदन स्थिति विवरण",
    currentStage: "वर्तमान चरण",
    nextStepLabel: "अगला कदम मार्गदर्शन",
    progress: "कुल प्रगति",
    appliedOn: "आवेदन तिथि",
    loanAmountRequested: "अनुरोधित ऋण राशि",
    channelPartnerAssigned: "आवंटित चैनल पार्टनर",
    schemeNameLabel: "योजना का नाम",
    applicantNameLabel: "आवेदक का नाम",
    applicantPhoneLabel: "मोबाइल नंबर",
    statusLabel: "स्थिति",
    timelineLabel: "आवेदन मील के पत्थर",
    myApplicationsTitle: "मेरे जमा किए गए आवेदन",
    noApplicationsFound:
      "इस नंबर या मोबाइल से मेल खाता कोई आवेदन नहीं मिला। कृपया जांचें और पुनः प्रयास करें।",
    applyNowBtn: "योजना के लिए आवेदन करें",
    applySchemeModalTitle: "रियायती ऋण आवेदन जमा करें",
    confirmAndSubmit: "पुष्टि करें और आवेदन जमा करें",
    submitting: "जमा हो रहा है...",
    applicationSubmittedNotice:
      "आपका आवेदन सफलतापूर्वक पंजीकृत हो गया है! ट्रैकिंग के लिए अपना आवेदन नंबर नोट कर लें।",
  },
};

// Automatically merge explore and doc/tracking keys into UI_TRANSLATIONS so t(key, lang) works everywhere
[EXPLORE_UI_TRANSLATIONS, DOC_AND_TRACKING_TRANSLATIONS].forEach((sourceDict) => {
  Object.keys(sourceDict).forEach((lang) => {
    if (!UI_TRANSLATIONS[lang]) {
      UI_TRANSLATIONS[lang] = {};
    }
    Object.assign(UI_TRANSLATIONS[lang], sourceDict[lang]);
  });

  const defaultEn = sourceDict.en;
  const defaultHi = sourceDict.hi || defaultEn;
  Object.keys(UI_TRANSLATIONS).forEach((lang) => {
    if (lang !== "en") {
      Object.keys(defaultEn).forEach((key) => {
        if (UI_TRANSLATIONS[lang][key] === undefined) {
          UI_TRANSLATIONS[lang][key] = defaultHi[key] || defaultEn[key];
        }
      });
    }
  });
});

// Detailed scheme data by language
export const PRIMARY_SCHEMES_BY_LANG = {
  en: [
    {
      code: "MFS",
      title: "Micro Finance Scheme",
      rate: "6.5% p.a.",
      limit: "Project cost up to ₹1.40 lakh",
      loan: "Loan up to ₹1.25 lakh",
      eligibility: [
        "Scheduled Caste (SC) applicant",
        "Valid caste certificate required",
        "Annual family income up to ₹5 lakh",
        "Eligible small income-generating activity",
      ],
      documents: [
        "Valid caste certificate",
        "Income proof",
        "Identity / KYC documents",
        "Address proof",
        "Activity / project-related documents",
      ],
      route: "SCAs / CAs",
      description:
        "Concessional financing for eligible small income-generating activities.",
    },
    {
      code: "AMY",
      title: "Aajeevika Micro-Finance Yojana",
      rate: "15% p.a.",
      limit: "Project cost up to ₹1.40 lakh",
      loan: "Loan up to ₹1.25 lakh",
      eligibility: [
        "Scheduled Caste (SC) applicant",
        "Valid caste certificate required",
        "Annual family income up to ₹5 lakh",
        "Eligible small / micro business activity",
      ],
      documents: [
        "Valid caste certificate",
        "Income proof",
        "Identity / KYC documents",
        "Address proof",
        "Business / activity documents",
      ],
      route: "Selected NBFC-MFIs",
      description:
        "Micro-finance support for eligible SC applicants through participating NBFC-MFIs.",
    },
    {
      code: "TL",
      title: "Term Loan",
      rate: "8% p.a.",
      limit: "Project cost above ₹1.40 lakh up to ₹50 lakh",
      loan: "Loan up to ₹45 lakh",
      eligibility: [
        "Scheduled Caste (SC) applicant",
        "Valid caste certificate required",
        "Annual family income up to ₹5 lakh",
        "For eligible larger income-generating projects",
        "Suitable for self-employment / business expansion",
      ],
      documents: [
        "Valid caste certificate",
        "Income proof",
        "Identity / KYC documents",
        "Address proof",
        "Detailed project report / business documents",
        "Quotations / cost estimates where applicable",
      ],
      route: "SCAs / CAs",
      description:
        "Longer-term financing for larger eligible income-generating projects.",
    },
    {
      code: "UNY",
      title: "Udyam Nidhi Yojana",
      rate: "13%–15% p.a.",
      limit: "Project cost up to ₹5 lakh",
      loan: "Loan up to ₹4.50 lakh",
      eligibility: [
        "Scheduled Caste (SC) applicant",
        "Valid caste certificate required",
        "Annual family income up to ₹5 lakh",
        "Eligible small / micro activity",
        "Entrepreneurship-oriented financing",
      ],
      documents: [
        "Valid caste certificate",
        "Income proof",
        "Identity / KYC documents",
        "Address proof",
        "Business / activity documents",
        "Project / cost estimate",
      ],
      route: "Cooperative Societies / Cooperative Banks / SFBs",
      description:
        "Financing support for eligible small activities and entrepreneurship.",
    },
    {
      code: "ELS",
      title: "Educational Loan Scheme",
      rate: "6.5% p.a.",
      limit: "Loan up to ₹40 lakh",
      loan: "Up to 90% of course fee, subject to scheme limit",
      eligibility: [
        "Scheduled Caste (SC) applicant",
        "Valid caste certificate required",
        "Annual family income up to ₹5 lakh",
        "Regular / full-time professional or technical study",
        "Recognized institution in India or abroad",
      ],
      documents: [
        "Valid caste certificate",
        "Income proof",
        "Identity / KYC documents",
        "Admission / offer letter",
        "Course fee structure",
        "Institution / course documents",
      ],
      route: "SCAs / CAs",
      description:
        "Educational financing for eligible professional and technical studies.",
    },
  ],

  hi: [
    {
      code: "MFS",
      title: "माइक्रो फाइनेंस योजना (MFS)",
      rate: "6.5% प्रति वर्ष",
      limit: "परियोजना लागत ₹1.40 लाख तक",
      loan: "ऋण ₹1.25 लाख तक",
      eligibility: [
        "अनुसूचित जाति (SC) आवेदक",
        "वैध जाति प्रमाण पत्र आवश्यक",
        "वार्षिक पारिवारिक आय ₹5 लाख तक",
        "पात्र छोटी आय-सृजन गतिविधि",
      ],
      documents: [
        "वैध जाति प्रमाण पत्र",
        "आय प्रमाण",
        "पहचान / केवाईसी दस्तावेज",
        "पते का प्रमाण",
        "गतिविधि / परियोजना संबंधी दस्तावेज",
      ],
      route: "एससीए / सीए (राज्य चैनलिंग एजेंसियां)",
      description:
        "पात्र छोटी आय-सृजन गतिविधियों के लिए रियायती वित्तपोषण।",
    },
    {
      code: "AMY",
      title: "आजीविका माइक्रो-फाइनेंस योजना (AMY)",
      rate: "15% प्रति वर्ष",
      limit: "परियोजना लागत ₹1.40 लाख तक",
      loan: "ऋण ₹1.25 लाख तक",
      eligibility: [
        "अनुसूचित जाति (SC) आवेदक",
        "वैध जाति प्रमाण पत्र आवश्यक",
        "वार्षिक पारिवारिक आय ₹5 लाख तक",
        "पात्र लघु / सूक्ष्म व्यावसायिक गतिविधि",
      ],
      documents: [
        "वैध जाति प्रमाण पत्र",
        "आय प्रमाण",
        "पहचान / केवाईसी दस्तावेज",
        "पते का प्रमाण",
        "व्यापार / गतिविधि दस्तावेज",
      ],
      route: "चयनित एनबीएफसी-एमएफआई",
      description:
        "भाग लेने वाले एनबीएफसी-एमएफआई के माध्यम से पात्र अनुसूचित जाति आवेदकों के लिए माइक्रो-फाइनेंस सहायता।",
    },
    {
      code: "TL",
      title: "टर्म लोन (सावधि ऋण)",
      rate: "8% प्रति वर्ष",
      limit: "परियोजना लागत ₹1.40 लाख से अधिक ₹50 लाख तक",
      loan: "ऋण ₹45 लाख तक",
      eligibility: [
        "अनुसूचित जाति (SC) आवेदक",
        "वैध जाति प्रमाण पत्र आवश्यक",
        "वार्षिक पारिवारिक आय ₹5 लाख तक",
        "पात्र बड़ी आय-सृजन परियोजनाओं के लिए",
        "स्व-रोजगार / व्यवसाय विस्तार के लिए उपयुक्त",
      ],
      documents: [
        "वैध जाति प्रमाण पत्र",
        "आय प्रमाण",
        "पहचान / केवाईसी दस्तावेज",
        "पते का प्रमाण",
        "विस्तृत परियोजना रिपोर्ट (DPR) / व्यावसायिक दस्तावेज",
        "कोटेशन / लागत अनुमान (जहां लागू हो)",
      ],
      route: "एससीए / सीए (राज्य चैनलिंग एजेंसियां)",
      description:
        "बड़ी पात्र आय-सृजन परियोजनाओं के लिए दीर्घकालिक वित्तपोषण।",
    },
    {
      code: "UNY",
      title: "उद्यम निधि योजना (UNY)",
      rate: "13%–15% प्रति वर्ष",
      limit: "परियोजना लागत ₹5 लाख तक",
      loan: "ऋण ₹4.50 लाख तक",
      eligibility: [
        "अनुसूचित जाति (SC) आवेदक",
        "वैध जाति प्रमाण पत्र आवश्यक",
        "वार्षिक पारिवारिक आय ₹5 लाख तक",
        "पात्र लघु / सूक्ष्म गतिविधि",
        "उद्यमिता-उन्मुख वित्तपोषण",
      ],
      documents: [
        "वैध जाति प्रमाण पत्र",
        "आय प्रमाण",
        "पहचान / केवाईसी दस्तावेज",
        "पते का प्रमाण",
        "व्यापार / गतिविधि दस्तावेज",
        "परियोजना / लागत अनुमान",
      ],
      route: "सहकारी समितियां / सहकारी बैंक / एसएफबी",
      description:
        "पात्र छोटी गतिविधियों और उद्यमिता के लिए वित्तीय सहायता।",
    },
    {
      code: "ELS",
      title: "शिक्षा ऋण योजना (ELS)",
      rate: "6.5% प्रति वर्ष",
      limit: "ऋण ₹40 लाख तक",
      loan: "पाठ्यक्रम शुल्क का 90% तक, योजना सीमा के अधीन",
      eligibility: [
        "अनुसूचित जाति (SC) आवेदक",
        "वैध जाति प्रमाण पत्र आवश्यक",
        "वार्षिक पारिवारिक आय ₹5 लाख तक",
        "नियमित / पूर्णकालिक पेशेवर या तकनीकी अध्ययन",
        "भारत या विदेश में मान्यता प्राप्त संस्थान",
      ],
      documents: [
        "वैध जाति प्रमाण पत्र",
        "आय प्रमाण",
        "पहचान / केवाईसी दस्तावेज",
        "प्रवेश / प्रस्ताव पत्र",
        "पाठ्यक्रम शुल्क संरचना",
        "संस्थान / पाठ्यक्रम दस्तावेज",
      ],
      route: "एससीए / सीए (राज्य चैनलिंग एजेंसियां)",
      description:
        "पात्र पेशेवर और तकनीकी अध्ययन के लिए शैक्षिक वित्तपोषण।",
    },
  ],

  bn: [
    {
      code: "MFS",
      title: "মাইক্রো ফিনান্স স্কিম (MFS)",
      rate: "৬.৫% বার্ষিক",
      limit: "প্রকল্পের খরচ ₹১.৪০ লাখ পর্যন্ত",
      loan: "ঋণ ₹১.২৫ লাখ পর্যন্ত",
      eligibility: [
        "তফসিলি জাতি (SC) আবেদনকারী",
        "বৈধ জাতি শংসাপত্র আবশ্যক",
        "বার্ষিক পারিবারিক আয় ₹৫ লাখ পর্যন্ত",
        "যোগ্য ক্ষুদ্র আয় সৃষ্টিকারী কার্যকলাপ",
      ],
      documents: [
        "বৈধ জাতি শংসাপত্র",
        "আয়ের প্রমাণপত্র",
        "পরিচয়পত্র / কেওয়াইসি নথি",
        "ঠিকানার প্রমাণ",
        "কার্যকলাপ / প্রকল্প সংক্রান্ত নথি",
      ],
      route: "এসসিএ / সিএ (রাজ্য চ্যানেল সংস্থা)",
      description: "ক্ষুদ্র আয়বর্ধক কার্যকলাপের জন্য সহজ শর্তে ঋণ সুবিধা।",
    },
    {
      code: "AMY",
      title: "জীবিকা মাইক্রো-ফিনান্স যোজনা (AMY)",
      rate: "১৫% বার্ষিক",
      limit: "প্রকল্পের খরচ ₹১.৪০ লাখ পর্যন্ত",
      loan: "ঋণ ₹১.২৫ লাখ পর্যন্ত",
      eligibility: [
        "তফসিলি জাতি (SC) আবেদনকারী",
        "বৈধ জাতি শংসাপত্র আবশ্যক",
        "বার্ষিক পারিবারিক আয় ₹৫ লাখ পর্যন্ত",
        "যোগ্য ক্ষুদ্র / অতি ক্ষুদ্র ব্যবসা",
      ],
      documents: [
        "বৈধ জাতি শংসাপত্র",
        "আয়ের প্রমাণপত্র",
        "পরিচয়পত্র / কেওয়াইসি নথি",
        "ঠিকানার প্রমাণ",
        "ব্যবসার নথি",
      ],
      route: "নির্বাচিত এনবিএফসি-এমএফআই",
      description: "এনবিএফসি-এমএফআই-এর মাধ্যমে যোগ্য এসসি আবেদনকারীদের ক্ষুদ্র ঋণ সহায়তা।",
    },
    {
      code: "TL",
      title: "মেয়াদি ঋণ (Term Loan)",
      rate: "৮% বার্ষিক",
      limit: "প্রকল্পের খরচ ₹১.৪০ লাখ থেকে ₹৫০ লাখ পর্যন্ত",
      loan: "ঋণ ₹৪৫ লাখ পর্যন্ত",
      eligibility: [
        "তফসিলি জাতি (SC) আবেদনকারী",
        "বৈধ জাতি শংসাপত্র আবশ্যক",
        "বার্ষিক পারিবারিক আয় ₹৫ লাখ পর্যন্ত",
        "বৃহত্তর আয় সৃষ্টিকারী প্রকল্পের জন্য",
        "স্ব-কর্মসংস্থান / ব্যবসা সম্প্রসারণের জন্য উপযুক্ত",
      ],
      documents: [
        "বৈধ জাতি শংসাপত্র",
        "আয়ের প্রমাণপত্র",
        "পরিচয়পত্র / কেওয়াইসি নথি",
        "ঠিকানার প্রমাণ",
        "বিস্তারিত প্রকল্প প্রতিবেদন (DPR)",
        "কোটেশন / খরচের অনুমান",
      ],
      route: "এসসিএ / সিএ (রাজ্য চ্যানেল সংস্থা)",
      description: "বৃহত্তর আয়বর্ধক প্রকল্পের জন্য দীর্ঘমেয়াদী আর্থিক সহায়তা।",
    },
    {
      code: "UNY",
      title: "উদ্যম নিধি যোজনা (UNY)",
      rate: "১৩%–১৫% বার্ষিক",
      limit: "প্রকল্পের খরচ ₹৫ লাখ পর্যন্ত",
      loan: "ঋণ ₹৪.৫০ লাখ পর্যন্ত",
      eligibility: [
        "তফসিলি জাতি (SC) আবেদনকারী",
        "বৈধ জাতি শংসাপত্র আবশ্যক",
        "বার্ষিক পারিবারিক আয় ₹৫ লাখ পর্যন্ত",
        "ক্ষুদ্র উদ্যোগ কার্যকলাপ",
        "উদ্যোক্তা উন্নয়নমুখী ঋণ",
      ],
      documents: [
        "বৈধ জাতি শংসাপত্র",
        "আয়ের প্রমাণপত্র",
        "পরিচয়পত্র / কেওয়াইসি নথি",
        "ঠিকানার প্রমাণ",
        "ব্যবসার কাগজপত্র",
        "প্রকল্পের খরচের অনুমান",
      ],
      route: "সমবায় সমিতি / সমবায় ব্যাঙ্ক / এসএফবি",
      description: "ক্ষুদ্র উদ্যোগ এবং উদ্যোগপতিদের জন্য আর্থিক সহায়তা।",
    },
    {
      code: "ELS",
      title: "শিক্ষা ঋণ প্রকল্প (ELS)",
      rate: "৬.৫% বার্ষিক",
      limit: "ঋণ ₹৪০ লাখ পর্যন্ত",
      loan: "কোর্স ফি-র ৯০% পর্যন্ত, সর্বোচ্চ প্রকল্প সীমা সাপেক্ষে",
      eligibility: [
        "তফসিলি জাতি (SC) আবেদনকারী",
        "বৈধ জাতি শংসাপত্র আবশ্যক",
        "বার্ষিক পারিবারিক আয় ₹৫ লাখ পর্যন্ত",
        "নিয়মিত পেশাদার বা কারিগরি শিক্ষা",
        "ভারত বা বিদেশের স্বীকৃত শিক্ষা প্রতিষ্ঠান",
      ],
      documents: [
        "বৈধ জাতি শংসাপত্র",
        "আয়ের প্রমাণপত্র",
        "পরিচয়পত্র / কেওয়াইসি নথি",
        "ভর্তির অফার লেটার",
        "কোর্স ফি স্ট্রাকচার",
        "শিক্ষা প্রতিষ্ঠানের নথি",
      ],
      route: "এসসিএ / সিএ (রাজ্য চ্যানেল সংস্থা)",
      description: "উচ্চ ও পেশাদার শিক্ষার জন্য সহজ শর্তে শিক্ষা ঋণ।",
    },
  ],

  ta: [
    {
      code: "MFS",
      title: "மைக்ரோ ஃபைனான்ஸ் திட்டம் (MFS)",
      rate: "ஆண்டுக்கு 6.5%",
      limit: "திட்டச் செலவு ₹1.40 லட்சம் வரை",
      loan: "கடன் ₹1.25 லட்சம் வரை",
      eligibility: [
        "பட்டியலின (SC) விண்ணப்பதாரர்",
        "செல்லுபடியாகும் சாதிச் சான்றிதழ் அவசியம்",
        "ஆண்டு குடும்ப வருமானம் ₹5 லட்சம் வரை",
        "தகுதியான சிறு வருமானம் ஈட்டும் தொழில்",
      ],
      documents: [
        "சாதிச் சான்றிதழ்",
        "வருமானச் சான்று",
        "அடையாளம் / கேஒய்சி ஆவணங்கள்",
        "முகவரிச் சான்று",
        "தொழில் / திட்ட ஆவணங்கள்",
      ],
      route: "எஸ்சிஏ / சிஏ (மாநில முகமைகள்)",
      description: "சிறு வருமானம் ஈட்டும் தொழில்களுக்கான சலுகைக் கடன் உதவி.",
    },
    {
      code: "AMY",
      title: "ஜீவிகா மைக்ரோ ஃபைனான்ஸ் திட்டம் (AMY)",
      rate: "ஆண்டுக்கு 15%",
      limit: "திட்டச் செலவு ₹1.40 லட்சம் வரை",
      loan: "கடன் ₹1.25 லட்சம் வரை",
      eligibility: [
        "பட்டியலின (SC) விண்ணப்பதாரர்",
        "செல்லுபடியாகும் சாதிச் சான்றிதழ் அவசியம்",
        "ஆண்டு குடும்ப வருமானம் ₹5 லட்சம் வரை",
        "சிறு / குறு வணிக நடவடிக்கை",
      ],
      documents: [
        "சாதிச் சான்றிதழ்",
        "வருமானச் சான்று",
        "அடையாளம் / கேஒய்சி ஆவணங்கள்",
        "முகவரிச் சான்று",
        "வணிக ஆவணங்கள்",
      ],
      route: "தேர்ந்தெடுக்கப்பட்ட என்பிஎஃப்சி-எம்எஃப்ஐ",
      description: "என்பிஎஃப்சி-எம்எஃப்ஐ மூலம் தகுதியான எஸ்சி பயனாளிகளுக்கான நுண்கடன் உதவி.",
    },
    {
      code: "TL",
      title: "காலக் கடன் (Term Loan)",
      rate: "ஆண்டுக்கு 8%",
      limit: "திட்டச் செலவு ₹1.40 லட்சம் முதல் ₹50 லட்சம் வரை",
      loan: "கடன் ₹45 லட்சம் வரை",
      eligibility: [
        "பட்டியலின (SC) விண்ணப்பதாரர்",
        "செல்லுபடியாகும் சாதிச் சான்றிதழ் அவசியம்",
        "ஆண்டு குடும்ப வருமானம் ₹5 லட்சம் வரை",
        "பெரிய வருமானம் ஈட்டும் திட்டங்களுக்கு",
        "சுயதொழில் / வணிக விரிவாக்கத்திற்கு ஏற்றது",
      ],
      documents: [
        "சாதிச் சான்றிதழ்",
        "வருமானச் சான்று",
        "அடையாளம் / கேஒய்சி ஆவணங்கள்",
        "முகவரிச் சான்று",
        "விரிவான திட்ட அறிக்கை (DPR)",
        "மதிப்பீட்டு ஆவணங்கள்",
      ],
      route: "எஸ்சிஏ / சிஏ (மாநில முகமைகள்)",
      description: "பெரிய உற்பத்தி மற்றும் வணிகத் திட்டங்களுக்கான நீண்டகாலக் கடன்.",
    },
    {
      code: "UNY",
      title: "உத்யம் நிதி திட்டம் (UNY)",
      rate: "ஆண்டுக்கு 13%–15%",
      limit: "திட்டச் செலவு ₹5 லட்சம் வரை",
      loan: "கடன் ₹4.50 லட்சம் வரை",
      eligibility: [
        "பட்டியலின (SC) விண்ணப்பதாரர்",
        "செல்லுபடியாகும் சாதிச் சான்றிதழ் அவசியம்",
        "ஆண்டு குடும்ப வருமானம் ₹5 லட்சம் வரை",
        "சிறு தொழில் / தொழில்முனைவு நிதி",
      ],
      documents: [
        "சாதிச் சான்றிதழ்",
        "வருமானச் சான்று",
        "அடையாளம் / கேஒய்சி ஆவணங்கள்",
        "முகவரிச் சான்று",
        "வணிக ஆவணங்கள்",
        "திட்ட மதிப்பீடு",
      ],
      route: "கூட்டுறவு சங்கங்கள் / வங்கிகள் / எஸ்எஃப்பி",
      description: "சிறு வணிகம் மற்றும் தொழில்முனைவோருக்கான நிதி ஆதரவு.",
    },
    {
      code: "ELS",
      title: "கல்விக் கடன் திட்டம் (ELS)",
      rate: "ஆண்டுக்கு 6.5%",
      limit: "கடன் ₹40 லட்சம் வரை",
      loan: "கல்விக் கட்டணத்தில் 90% வரை, வரம்பிற்கு உட்பட்டு",
      eligibility: [
        "பட்டியலின (SC) விண்ணப்பதாரர்",
        "செல்லுபடியாகும் சாதிச் சான்றிதழ் அவசியம்",
        "ஆண்டு குடும்ப வருமானம் ₹5 லட்சம் வரை",
        "வழக்கமான தொழில்முறை அல்லது தொழில்நுட்ப படிப்பு",
        "அங்கீகரிக்கப்பட்ட கல்வி நிறுவனம் (இந்தியா அல்லது வெளிநாடு)",
      ],
      documents: [
        "சாதிச் சான்றிதழ்",
        "வருமானச் சான்று",
        "அடையாளம் / கேஒய்சி ஆவணங்கள்",
        "சேர்க்கை கடிதம்",
        "கட்டண விவரம்",
        "கல்வி நிறுவன ஆவணங்கள்",
      ],
      route: "எஸ்சிஏ / சிஏ (மாநில முகமைகள்)",
      description: "தொழில்முறை மற்றும் உயர்கல்வி படிப்புகளுக்கான கல்விக் கடன் உதவி.",
    },
  ],

  te: [
    {
      code: "MFS",
      title: "మైక్రో ఫైనాన్స్ పథకం (MFS)",
      rate: "సంవత్సరానికి 6.5%",
      limit: "ప్రాజెక్ట్ వ్యయం ₹1.40 లక్షల వరకు",
      loan: "రుణం ₹1.25 లక్షల వరకు",
      eligibility: [
        "షెడ్యూల్డ్ కులం (SC) దరఖాస్తుదారు",
        "చెల్లుబాటు అయ్యే కుల ధృవీకరణ పత్రం తప్పనిసరి",
        "వార్షిక కుటుంబ ఆదాయం ₹5 లక్షల వరకు",
        "అర్హత కలిగిన చిన్న ఆదాయ-ఉత్పాదక కార్యకలాపం",
      ],
      documents: [
        "కుల ధృవీకరణ పత్రం",
        "ఆదాయ ధృవీకరణ పత్రం",
        "గుర్తింపు / కేవైసీ పత్రాలు",
        "చిరునామా రుజువు",
        "ప్రాజెక్ట్ పత్రాలు",
      ],
      route: "ఎస్‌సిఎ / సిఎ (రాష్ట్ర ఏజెన్సీలు)",
      description: "చిన్న ఆదాయ-ఉత్పాదక కార్యకలాపాల కోసం రాయితీ ఫైనాన్సింగ్.",
    },
    {
      code: "AMY",
      title: "ఆజీవిక మైక్రో-ఫైనాన్స్ యోజన (AMY)",
      rate: "సంవత్సరానికి 15%",
      limit: "ప్రాజెక్ట్ వ్యయం ₹1.40 లక్షల వరకు",
      loan: "రుణం ₹1.25 లక్షల వరకు",
      eligibility: [
        "షెడ్యూల్డ్ కులం (SC) దరఖాస్తుదారు",
        "చెల్లుబాటు అయ్యే కుల ధృవీకరణ పత్రం తప్పనిసరి",
        "వార్షిక కుటుంబ ఆదాయం ₹5 లక్షల వరకు",
        "చిన్న / సూక్ష్మ వ్యాపార కార్యకలాపం",
      ],
      documents: [
        "కుల ధృవీకరణ పత్రం",
        "ఆదాయ ధృవీకరణ పత్రం",
        "గుర్తింపు / కేవైసీ పత్రాలు",
        "వ్యాపార పత్రాలు",
      ],
      route: "ఎన్‌బిఎఫ్‌సి-ఎంఎఫ్‌ఐలు",
      description: "ఎన్‌బిఎఫ్‌సి-ఎంఎఫ్‌ఐల ద్వారా అర్హులైన ఎస్సీ లబ్ధిదారులకు సూక్ష్మ రుణాలు.",
    },
    {
      code: "TL",
      title: "టర్మ్ లోన్ (కాల పరిమితి రుణం)",
      rate: "సంవత్సరానికి 8%",
      limit: "ప్రాజెక్ట్ వ్యయం ₹1.40 లక్షల నుండి ₹50 లక్షల వరకు",
      loan: "రుణం ₹45 లక్షల వరకు",
      eligibility: [
        "షెడ్యూల్డ్ కులం (SC) దరఖాస్తుదారు",
        "చెల్లుబాటు అయ్యే కుల ధృవీకరణ పత్రం తప్పనిసరి",
        "వార్షిక కుటుంబ ఆదాయం ₹5 లక్షల వరకు",
        "పెద్ద ఆదాయ-ఉత్పాదక ప్రాజెక్టుల కోసం",
        "స్వయం ఉపాధి / వ్యాపార విస్తరణకు అనువైనది",
      ],
      documents: [
        "కుల ధృవీకరణ పత్రం",
        "ఆదాయ ధృవీకరణ పత్రం",
        "గుర్తింపు / కేవైసీ పత్రాలు",
        "వివరణాత్మక ప్రాజెక్ట్ నివేదిక (DPR)",
        "కోట్స్ / ఖర్చు అంచనాలు",
      ],
      route: "ఎస్‌సిఎ / సిఎ (రాష్ట్ర ఏజెన్సీలు)",
      description: "పెద్ద ఆదాయ-ఉత్పాదక ప్రాజెక్టుల కోసం దీర్ఘకాలిక రుణాలు.",
    },
    {
      code: "UNY",
      title: "ఉద్యమ్ నిధి యోజన (UNY)",
      rate: "సంవత్సరానికి 13%–15%",
      limit: "ప్రాజెక్ట్ వ్యయం ₹5 లక్షల వరకు",
      loan: "రుణం ₹4.50 లక్షల వరకు",
      eligibility: [
        "షెడ్యూల్డ్ కులం (SC) దరఖాస్తుదారు",
        "చెల్లుబాటు అయ్యే కుల ధృవీకరణ పత్రం తప్పనిసరి",
        "వార్షిక కుటుంబ ఆదాయం ₹5 లక్షల వరకు",
        "చిన్న కార్యకలాపాలు / వ్యాపారవేత్తల ఫైనాన్సింగ్",
      ],
      documents: [
        "కుల ధృవీకరణ పత్రం",
        "ఆదాయ ధృవీకరణ పత్రం",
        "గుర్తింపు / కేవైసీ పత్రాలు",
        "వ్యాపార పత్రాలు",
        "ప్రాజెక్ట్ ఖర్చు అంచనా",
      ],
      route: "సహకార సంఘాలు / సహకార బ్యాంకులు / ఎస్‌ఎఫ్‌బి",
      description: "చిన్న వ్యాపారాలు మరియు వ్యవస్థాపకత కోసం ఆర్థిక సహాయం.",
    },
    {
      code: "ELS",
      title: "విద్యా రుణ పథకం (ELS)",
      rate: "సంవత్సరానికి 6.5%",
      limit: "రుణం ₹40 లక్షల వరకు",
      loan: "కోర్సు ఫీజులో 90% వరకు, పరిమితికి లోబడి",
      eligibility: [
        "షెడ్యూల్డ్ కులం (SC) దరఖాస్తుదారు",
        "చెల్లుబాటు అయ్యే కుల ధృవీకరణ పత్రం తప్పనిసరి",
        "వార్షిక కుటుంబ ఆదాయం ₹5 లక్షల వరకు",
        "రెగ్యులర్ ప్రొఫెషనల్ లేదా టెక్నికల్ స్టడీ",
        "భారతదేశం లేదా విదేశాలలో గుర్తింపు పొందిన సంస్థ",
      ],
      documents: [
        "కుల ధృవీకరణ పత్రం",
        "ఆదాయ ధృవీకరణ పత్రం",
        "గుర్తింపు పత్రాలు",
        "అడ్మిషన్ లేఖ",
        "ఫీజు వివరాలు",
        "విద్యా సంస్థ పత్రాలు",
      ],
      route: "ఎస్‌సిఎ / సిఎ (రాష్ట్ర ఏజెన్సీలు)",
      description: "వృత్తిపరమైన మరియు సాంకేతిక ఉన్నత విద్య కోసం విద్యా రుణాలు.",
    },
  ],
};

// Returns localized primary schemes array for given language code with fallback
export function getPrimarySchemes(langCode = "en") {
  const code = String(langCode || "en").toLowerCase().trim();
  if (PRIMARY_SCHEMES_BY_LANG[code]) {
    return PRIMARY_SCHEMES_BY_LANG[code];
  }
  // If Hindi requested or Indic script with similar structure, fallback gracefully
  if (
    code === "hi" ||
    code === "ne" ||
    code === "sa" ||
    code === "mai" ||
    code === "doi" ||
    code === "mr" ||
    code === "gu" ||
    code === "pa"
  ) {
    return PRIMARY_SCHEMES_BY_LANG[code] || PRIMARY_SCHEMES_BY_LANG.hi || PRIMARY_SCHEMES_BY_LANG.en;
  }
  return PRIMARY_SCHEMES_BY_LANG.en;
}

// Scheme ID to localized name mapping
export function getLocalizedSchemeName(schemeId, fallbackName = "", langCode = "en") {
  if (!schemeId) return fallbackName || "";
  const code = String(langCode || "en").toLowerCase().trim();
  const schemes = getPrimarySchemes(code);
  const normalizedId = String(schemeId).toUpperCase().trim();

  // Match by code or common variants
  const matched = schemes.find((s) => {
    if (s.code === normalizedId) return true;
    if (normalizedId === "TERM_LOAN" && s.code === "TL") return true;
    if (normalizedId === "TERM LOAN" && s.code === "TL") return true;
    return false;
  });

  if (matched) {
    return matched.title;
  }

  // Check for VISVAS
  if (normalizedId.includes("VISVAS")) {
    if (code === "hi") return "विश्वास (VISVAS) योजना";
    if (code === "bn") return "বিশ্বাস (VISVAS) যোজনা";
    if (code === "ta") return "விஸ்வாஸ் (VISVAS) திட்டம்";
    if (code === "te") return "విశ్వాస్ (VISVAS) పథకం";
    if (code === "mr") return "विश्वास (VISVAS) योजना";
    if (code === "gu") return "વિશ્વાસ (VISVAS) યોજના";
    return "VISVAS Scheme";
  }

  return fallbackName || schemeId;
}

export default {
  getPrimarySchemes,
  getLocalizedSchemeName,
  PRIMARY_SCHEMES_BY_LANG,
};
