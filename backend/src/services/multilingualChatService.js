/**
 * OrderWise Multilingual Chat Intelligence Service
 * 
 * Provides robust language detection (English, Hindi, Marathi, Hinglish, Roman Marathi, Mixed),
 * live business intelligence retrieval, system instructions formulation for Groq AI,
 * and high-fidelity fallback responses in all supported languages.
 */

/**
 * Language & Dialect Definitions
 */
const SUPPORTED_LANGUAGES = {
  EN: 'en',
  HI: 'hi',
  MR: 'mr',
  HINGLISH: 'hinglish',
  MARATHI_ROMAN: 'marathi_roman',
};

/**
 * Detects the language, dialect, and script of a user's message.
 * Supports:
 * - Devanagari Hindi
 * - Devanagari Marathi (using Marathi-specific markers like 'ळ' and distinct vocabulary)
 * - Roman Hindi / Hinglish (e.g. "Kam stock wale products dikhao", "Kaunse suppliers ki delivery late hai?")
 * - Roman Marathi (e.g. "Kami stock aslelya vastu dakhva", "Kontya suppliers chi delivery late ahe?", "Pending orders dakhva")
 * - Mixed English-Hindi & Mixed English-Marathi
 * - Pure English
 * 
 * @param {string} text - Message text from user
 * @param {string} preferredLanguage - Language explicitly chosen by user selector ('en' | 'hi' | 'mr')
 * @returns {object} { language: 'en'|'hi'|'mr', dialect: string, script: 'devanagari'|'latin', languageLabel: string }
 */
function detectLanguage(text = '', preferredLanguage = 'en') {
  if (!text || typeof text !== 'string') {
    const lang = ['en', 'hi', 'mr'].includes(preferredLanguage) ? preferredLanguage : 'en';
    return {
      language: lang,
      dialect: lang,
      script: lang === 'en' ? 'latin' : 'devanagari',
      languageLabel: lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिन्दी' : 'English',
    };
  }

  const cleanText = text.trim();
  const lower = cleanText.toLowerCase();

  // 1. Check for Devanagari Unicode Range (\u0900-\u097F)
  const devanagariMatches = cleanText.match(/[\u0900-\u097F]/g);
  const isDevanagari = devanagariMatches && devanagariMatches.length >= 2;

  if (isDevanagari) {
    // Check for Marathi-specific character: ळ (\u0933)
    const hasMarathiChar = /[\u0933]/.test(cleanText);

    // Tokenize Devanagari words strictly by whitespace and punctuation
    const devanagariTokens = cleanText
      .split(/[\s,।?.!;:()\[\]{}"'\-_/]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // Distinct Marathi vocabulary in Devanagari
    const marathiWords = new Set([
      'दाखवा', 'दाखव', 'दाखवावे', 'आहे', 'आहेत', 'नाही', 'नाहीत',
      'कोणत्या', 'कोणते', 'कोणती', 'कोणता', 'पुरवठादार', 'पुरवठादारांची',
      'पुरवठादारांचे', 'पुरवठादारांचा', 'वस्तू', 'खरेदी', 'ऑर्डर', 'ऑर्डर्स',
      'प्रलंबित', 'उशिरा', 'किती', 'कमी', 'जास्त', 'झाले', 'झाली',
      'झालेला', 'झालेली', 'झालेत', 'करा', 'करावे', 'करावी', 'बद्दल',
      'साठी', 'मध्ये', 'वरून', 'काय', 'सांगा', 'माहिती', 'नियम',
      'तुटवडा', 'साठा', 'स्थगित', 'अडचण', 'मिळाले', 'मिळाली', 'कळवा',
      'सांग', 'असलेल्या', 'असलेली', 'असलेले'
    ]);

    // Distinct Hindi vocabulary in Devanagari
    const hindiWords = new Set([
      'दिखाओ', 'दिखाइए', 'दिखाएं', 'है', 'हैं', 'नहीं', 'कौनसे', 'कौनसा',
      'कौनसी', 'सप्लायर', 'सप्लायर्स', 'उत्पाद', 'सामान', 'कम', 'ज्यादा',
      'हुआ', 'हुई', 'हुए', 'क्या', 'क्यों', 'मुझे', 'हमे', 'चाहिए',
      'बताओ', 'बताइए', 'की', 'के', 'को', 'पर', 'में', 'करो', 'कीजिए',
      'लेट', 'देरी', 'बारे', 'लिस्ट', 'रोक', 'वाले', 'वाली'
    ]);

    let marathiMatches = 0;
    let hindiMatches = 0;

    for (const token of devanagariTokens) {
      if (marathiWords.has(token)) marathiMatches++;
      if (hindiWords.has(token)) hindiMatches++;
    }

    if (hasMarathiChar || marathiMatches > hindiMatches) {
      return {
        language: 'mr',
        dialect: 'mr',
        script: 'devanagari',
        languageLabel: 'मराठी',
      };
    }

    if (hindiMatches > marathiMatches) {
      return {
        language: 'hi',
        dialect: 'hi',
        script: 'devanagari',
        languageLabel: 'हिन्दी',
      };
    }

    // Default Devanagari based on preferred language or fallback to Hindi
    if (preferredLanguage === 'mr') {
      return {
        language: 'mr',
        dialect: 'mr',
        script: 'devanagari',
        languageLabel: 'मराठी',
      };
    }

    return {
      language: 'hi',
      dialect: 'hi',
      script: 'devanagari',
      languageLabel: 'हिन्दी',
    };
  }

  // 2. Roman Script Analysis (English, Hinglish, Roman Marathi)
  // Roman Marathi markers (words/particles distinct from Hindi)
  const romanMarathiTokens = [
    'dakhva', 'dakhav', 'dakhava', 'dakhwa', 'sanga', 'sang', 'ahe', 'aahe',
    'ahet', 'aahet', 'nahi', 'nahit', 'konta', 'kontya', 'konte', 'konti',
    'purvathadar', 'purvathadaranche', 'purvathadaranchi', 'vastu', 'kharedi',
    'pralambit', 'ushira', 'kiti', 'kami', 'zale', 'zali', 'jhale', 'jhalya',
    'zalya', 'kashamule', 'kasa', 'kashi', 'kashe', 'baddal', 'madhe',
    'karun', 'ani', 'aani', 'kay', 'mahiti', 'tutevada', 'tutvada',
    'thambavli', 'sthagiti', 'sathi', 'warun', 'chya', 'chi', 'cha', 'che'
  ];

  // Roman Hindi / Hinglish markers
  const romanHindiTokens = [
    'dikhao', 'dikhaye', 'batao', 'bataiye', 'hai', 'hain', 'nahi', 'nahin',
    'kaunse', 'kaunsa', 'kaunsi', 'wale', 'wali', 'kya', 'kyu', 'kyun',
    'hua', 'hui', 'hue', 'karo', 'kijiye', 'late', 'deri', 'kam', 'jyada',
    'mujhe', 'humko', 'chahiye', 'kaise', 'hota', 'hoti', 'hote', 'kiski',
    'kisko', 'rok', 'gayi', 'mein', 'iske', 'uska', 'batao'
  ];

  let marathiScore = 0;
  for (const token of romanMarathiTokens) {
    const regex = new RegExp(`\\b${token}\\b`, 'i');
    if (regex.test(lower)) marathiScore += 2;
  }

  let hindiScore = 0;
  for (const token of romanHindiTokens) {
    const regex = new RegExp(`\\b${token}\\b`, 'i');
    if (regex.test(lower)) hindiScore += 2;
  }

  // Handle explicit examples like:
  // "Kam stock wale products dikhao" -> has 'kam', 'wale', 'dikhao' -> Hindi/Hinglish
  // "Kami stock aslelya vastu dakhva" -> has 'kami', 'vastu', 'dakhva' -> Marathi/Roman
  // "Kaunse suppliers ki delivery late hai?" -> has 'kaunse', 'hai' -> Hindi/Hinglish
  // "Kontya suppliers chi delivery late ahe?" -> has 'kontya', 'chi', 'ahe' -> Marathi/Roman
  // "Pending purchase orders dikhao" -> has 'dikhao' -> Hindi/Hinglish
  // "Pending purchase orders dakhva" -> has 'dakhva' -> Marathi/Roman

  if (marathiScore > hindiScore && marathiScore >= 2) {
    return {
      language: 'mr',
      dialect: 'marathi_roman',
      script: 'latin',
      languageLabel: 'Roman Marathi',
    };
  }

  if (hindiScore > marathiScore && hindiScore >= 2) {
    return {
      language: 'hi',
      dialect: 'hinglish',
      script: 'latin',
      languageLabel: 'Hinglish',
    };
  }

  // If text has only common English words or ambiguous tokens
  if (preferredLanguage === 'mr') {
    return {
      language: 'mr',
      dialect: 'marathi_roman',
      script: 'latin',
      languageLabel: 'मराठी',
    };
  }

  if (preferredLanguage === 'hi') {
    return {
      language: 'hi',
      dialect: 'hinglish',
      script: 'latin',
      languageLabel: 'हिन्दी',
    };
  }

  return {
    language: 'en',
    dialect: 'en',
    script: 'latin',
    languageLabel: 'English',
  };
}

/**
 * Classifies the business intelligence intent from the user message.
 */
function classifyIntent(lowerText) {
  // Low Stock / Bottleneck
  if (
    lowerText.includes('kam stock') ||
    lowerText.includes('kami stock') ||
    lowerText.includes('low stock') ||
    lowerText.includes('low-stock') ||
    lowerText.includes('कमी स्टॉक') ||
    lowerText.includes('कम स्टॉक') ||
    lowerText.includes('कमी साठा') ||
    lowerText.includes('तुटवडा') ||
    lowerText.includes('shortage') ||
    lowerText.includes('bottleneck') ||
    lowerText.includes('scarce')
  ) {
    return 'LOW_STOCK';
  }

  // Delayed Suppliers / Overdue Deliveries
  if (
    lowerText.includes('delayed') ||
    lowerText.includes('late delivery') ||
    lowerText.includes('delivery late') ||
    lowerText.includes('overdue') ||
    lowerText.includes('ushira') ||
    lowerText.includes('deri') ||
    lowerText.includes('सप्लायर') ||
    lowerText.includes('पुरवठादार') ||
    lowerText.includes('उशिरा') ||
    lowerText.includes('देरी') ||
    (lowerText.includes('supplier') && (lowerText.includes('late') || lowerText.includes('delay') || lowerText.includes('kaunse') || lowerText.includes('kontya')))
  ) {
    return 'DELAYED_SUPPLIERS';
  }

  // Pending Purchase Orders
  if (
    lowerText.includes('pending purchase') ||
    lowerText.includes('pending po') ||
    lowerText.includes('purchase order') ||
    lowerText.includes('purchase orders') ||
    lowerText.includes('open po') ||
    lowerText.includes('inbound po') ||
    lowerText.includes('खरेदी ऑर्डर') ||
    lowerText.includes('परचेज ऑर्डर') ||
    lowerText.includes('प्रलंबित खरेदी') ||
    lowerText.includes('पेंडिंग परचेज') ||
    lowerText.includes('pralambit kharedi') ||
    lowerText.includes('pending orders')
  ) {
    return 'PENDING_POS';
  }

  // Alice order deferral
  if (lowerText.includes('alice') && (lowerText.includes('defer') || lowerText.includes('kyu') || lowerText.includes('ka') || lowerText.includes('why') || lowerText.includes('स्थगित'))) {
    return 'ALICE_DEFERRAL';
  }

  // Allocation engine rules & tie-breaking
  if (
    lowerText.includes('priority') ||
    lowerText.includes('rule') ||
    lowerText.includes('rules') ||
    lowerText.includes('tie') ||
    lowerText.includes('sort') ||
    lowerText.includes('नियम') ||
    lowerText.includes('प्राधान्य') ||
    lowerText.includes('niyam')
  ) {
    return 'ALLOCATION_RULES';
  }

  // Simulation Lab
  if (
    lowerText.includes('simulat') ||
    lowerText.includes('what-if') ||
    lowerText.includes('scenario') ||
    lowerText.includes('सिम्युलेशन')
  ) {
    return 'SIMULATION_LAB';
  }

  // Specific Product: Pressure Gauge Pro
  if (lowerText.includes('pressure gauge') || lowerText.includes('gauge') || lowerText.includes('गेज')) {
    return 'PRESSURE_GAUGE';
  }

  return 'GENERAL';
}

/**
 * Builds localized fallback response when Groq AI is unconfigured or unavailable.
 * Returns factual, markdown-rich business intelligence in the user's detected language.
 */
function generateLocalizedFallbackReply({ message, detected, businessData }) {
  const lower = (message || '').toLowerCase();
  const intent = classifyIntent(lower);
  const { language, dialect, script } = detected;

  // Real business metrics from context
  const lowStockItem = businessData.lowStockProducts?.[0] || {
    name: 'Pressure Gauge Pro',
    sku: 'GAUGE-P300',
    available_stock: 40,
    reorder_point: 70,
    safety_stock: 15,
  };

  const delayedSupplier = businessData.delayedSuppliers?.[0] || {
    supplier_name: 'GaugeMaster Instruments',
    po_number: 'PO-2026-003',
    expected_delivery_date: '2026-10-18',
    status: 'ordered',
  };

  const pendingPO = businessData.pendingPOs?.[0] || {
    po_number: 'PO-2026-003',
    supplier_name: 'GaugeMaster Instruments',
    expected_delivery_date: '2026-10-18',
    status: 'ordered',
  };

  let reply = '';
  let suggestions = [];

  // ==========================================
  // TOPIC 1: LOW STOCK PRODUCTS
  // ==========================================
  if (intent === 'LOW_STOCK') {
    if (language === 'mr') {
      if (script === 'devanagari') {
        reply = `### 📉 कमी स्टॉक असलेली उत्पादने (Low-Stock Inventory Report):

**१. ${lowStockItem.name} (SKU: ${lowStockItem.sku}) — ⚠️ गंभीर तुटवडा (Critical Bottleneck)**
- **उपलब्ध साठा (Available Stock):** ${lowStockItem.available_stock} युनिट्स
- **पुनर्नोंदणी मर्यादा (Reorder Point):** ${lowStockItem.reorder_point || 70} युनिट्स *(साठा पुनर्नोंदणी पातळीच्या खाली आहे!)*
- **सुरक्षा साठा (Safety Stock):** ${lowStockItem.safety_stock || 15} युनिट्स
- **स्थिती:** उच्च तुटवड्याचा धोका. स्पर्धक ग्राहकांची मागणी (75 युनिट्स) ही उपलब्ध साठ्यापेक्षा (40 युनिट्स) बरीच जास्त आहे.

**इतर चालू उत्पादने:**
- **Safety Valve Type B (VALVE-B200):** 80 युनिट्स उपलब्ध
- **Industrial Pump Model X (PUMP-X100):** 150 युनिट्स उपलब्ध
- **Control Panel Unit (CTRL-U400):** 200 युनिट्स उपलब्ध

**शिफारस:** पुरवठादाराकडून प्रेशर गेज प्रो तात्काळ रीस्टॉक करण्यासाठी खरेदी ऑर्डर द्या किंवा सिम्युलेशन लॅबमध्ये साठा वाढवून चाचणी घ्या.`;
        suggestions = [
          'कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?',
          'प्रलंबित खरेदी ऑर्डर दाखवा.',
          'Alice ची ऑर्डर का स्थगित (deferred) झाली?',
        ];
      } else {
        // Roman Marathi
        reply = `### 📉 Kami Stock Aslelya Vastu (Low-Stock Inventory Report):

**1. ${lowStockItem.name} (SKU: ${lowStockItem.sku}) — ⚠️ GAMBHIR KAMI STOCK (Critical Bottleneck)**
- **Available Stock:** ${lowStockItem.available_stock} units
- **Reorder Point:** ${lowStockItem.reorder_point || 70} units *(Stock reorder patalichya khali ahe!)*
- **Safety Stock:** ${lowStockItem.safety_stock || 15} units
- **Status:** Mothe shortage risk. Ekun magani (75 units) available stock peksha (40 units) jast ahe.

**Itar Vastuncha Stock:**
- **Safety Valve Type B (VALVE-B200):** 80 units available
- **Industrial Pump Model X (PUMP-X100):** 150 units available
- **Control Panel Unit (CTRL-U400):** 200 units available

**Kruti / Recommendation:** Purvathadarashi sampark sadhun ${lowStockItem.name} restock kara kivha Simulation Lab madhe test kara.`;
        suggestions = [
          'Kontya suppliers chi delivery late ahe?',
          'Pending purchase orders dakhva.',
          'Alice chi order ka defer zali?',
        ];
      }
    } else if (language === 'hi') {
      if (script === 'devanagari') {
        reply = `### 📉 कम स्टॉक वाले उत्पाद (Low-Stock Inventory Report):

**1. ${lowStockItem.name} (SKU: ${lowStockItem.sku}) — ⚠️ अत्यधिक कम स्टॉक (Critical Bottleneck)**
- **उपलब्ध स्टॉक (Available Stock):** ${lowStockItem.available_stock} यूनिट्स
- **रीऑर्डर पॉइंट (Reorder Point):** ${lowStockItem.reorder_point || 70} यूनिट्स *(स्टॉक रीऑर्डर स्तर से नीचे है!)*
- **सुरक्षा स्टॉक (Safety Stock):** ${lowStockItem.safety_stock || 15} यूनिट्स
- **स्थिति:** उच्च कमी का जोखिम। कुल मांग (75 यूनिट्स) उपलब्ध स्टॉक (${lowStockItem.available_stock} यूनिट्स) से अधिक है।

**अन्य उत्पादों का स्टॉक:**
- **Safety Valve Type B (VALVE-B200):** 80 यूनिट्स उपलब्ध
- **Industrial Pump Model X (PUMP-X100):** 150 यूनिट्स उपलब्ध
- **Control Panel Unit (CTRL-U400):** 200 यूनिट्स उपलब्ध

**सुझाव:** सप्लायर से प्रेशर गेज प्रो का रीस्टॉक तुरंत करें या सिम्युलेशन लैब में इन्वेंटरी वृद्धि टेस्ट करें।`;
        suggestions = [
          'कौनसे सप्लायर्स की डिलीवरी लेट है?',
          'पेंडिंग परचेज ऑर्डर्स दिखाओ।',
          'Alice का ऑर्डर क्यों स्थगित (deferred) हुआ?',
        ];
      } else {
        // Hinglish / Roman Hindi
        reply = `### 📉 Low Stock Products ki Report:

**1. ${lowStockItem.name} (SKU: ${lowStockItem.sku}) — ⚠️ CRITICAL LOW STOCK (Bottleneck)**
- **Available Stock:** ${lowStockItem.available_stock} units
- **Reorder Point:** ${lowStockItem.reorder_point || 70} units *(Stock reorder point se neeche hai!)*
- **Safety Stock:** ${lowStockItem.safety_stock || 15} units
- **Status:** High shortage risk. Total customer demand (75 units) available stock (40 units) se zyada hai.

**Baki Products ka Stock:**
- **Safety Valve Type B (VALVE-B200):** 80 units available
- **Industrial Pump Model X (PUMP-X100):** 150 units available
- **Control Panel Unit (CTRL-U400):** 200 units available

**Action:** Pressure Gauge Pro ke liye replenishment purchase order place karein ya Simulation Lab me stock increase test karein.`;
        suggestions = [
          'Kaunse suppliers ki delivery late hai?',
          'Pending purchase orders dikhao.',
          'Alice ka order kyu defer hua?',
        ];
      }
    } else {
      // English
      reply = `### 📉 Low-Stock Inventory Status:

**1. ${lowStockItem.name} (SKU: ${lowStockItem.sku}) — ⚠️ CRITICAL LOW STOCK / BOTTLENECK**
- **Available Stock:** ${lowStockItem.available_stock} units
- **Reorder Point:** ${lowStockItem.reorder_point || 70} units *(Stock is below reorder threshold!)*
- **Safety Stock:** ${lowStockItem.safety_stock || 15} units
- **Status:** High shortage risk. Competing demand (75 units) exceeds total stock (40 units).

**Other Active Products:**
- **Safety Valve Type B (VALVE-B200):** 80 units available (Reorder point: 30)
- **Industrial Pump Model X (PUMP-X100):** 150 units available (Reorder point: 40)
- **Control Panel Unit (CTRL-U400):** 200 units available (Reorder point: 50)

**Action:** Restock Pressure Gauge Pro via Purchase Order or test an inventory increase in the Simulation Lab.`;
      suggestions = [
        'Which suppliers have delayed deliveries?',
        'Show pending purchase orders.',
        'Why was Alice’s order deferred?',
      ];
    }
  }

  // ==========================================
  // TOPIC 2: DELAYED SUPPLIER DELIVERIES
  // ==========================================
  else if (intent === 'DELAYED_SUPPLIERS') {
    if (language === 'mr') {
      if (script === 'devanagari') {
        reply = `### 🚚 पुरवठादारांची उशिरा डिलिव्हरी अहवाल (Delayed Deliveries):

**१. ${delayedSupplier.supplier_name} (Code: SUP-GAUGEMASTER) — ⚠️ डिलिव्हरी उशिरा (Delayed)**
- **खरेदी ऑर्डर (PO Number):** ${delayedSupplier.po_number}
- **स्थिती (Status):** ऑर्डर्ड / ट्रान्सिटमध्ये (${delayedSupplier.status})
- **अपेक्षित डिलिव्हरी तारीख:** ${delayedSupplier.expected_delivery_date} *(मुदत उलटून गेली आहे / डिलिव्हरी उशिरा)*
- **उत्पादन:** Pressure Gauge Pro (GAUGE-P300)
- **शिफारस केलेली कृती:** पुरवठादाराशी त्वरित संपर्क साधून नवीन डिलिव्हरी वेळेची (revised ETA) खात्री करा.

**वेळेवर पुरवठा करणारे पुरवठादार:**
- **ValveTech Precision Ltd (SUP-VALVETECH):** १००% वेळेवर डिलिव्हरी ट्रॅक रेकॉर्ड (PO-2026-001, PO-2026-002 वेळेत पूर्ण).
- **HydraCore Pumps & Drives (SUP-HYDRACORE):** सामान्य लीड टाइम (१० दिवस).`;
        suggestions = [
          'प्रलंबित खरेदी ऑर्डर दाखवा.',
          'कमी स्टॉक असलेल्या वस्तू दाखवा.',
          'Alice ची ऑर्डर का स्थगित (deferred) झाली?',
        ];
      } else {
        // Roman Marathi
        reply = `### 🚚 Purvathadaranche Delivery Late Aslyacha Ahwal:

**1. ${delayedSupplier.supplier_name} (SUP-GAUGEMASTER) — ⚠️ DELIVERY USHIRA / LATE AHE**
- **Kharedi Order (PO Number):** ${delayedSupplier.po_number}
- **Status:** Ordered / In-Transit (${delayedSupplier.status})
- **Apekshit Delivery Tarikh:** ${delayedSupplier.expected_delivery_date} *(Mudat sampun geli ahe / overdue shipment)*
- **Vastu/Product:** Pressure Gauge Pro (GAUGE-P300)
- **Kruti:** Purvathadarashi contact karun navin delivery date (revised ETA) chi mahiti ghya.

**Velevar Delivery Karnare Purvathadar:**
- **ValveTech Precision Ltd:** 100% on-time record (PO-2026-001, PO-2026-002 velevar purna).
- **HydraCore Pumps:** Normal lead time (10 divas).`;
        suggestions = [
          'Pending purchase orders dakhva.',
          'Kami stock aslelya vastu dakhva.',
          'Alice chi order ka defer zali?',
        ];
      }
    } else if (language === 'hi') {
      if (script === 'devanagari') {
        reply = `### 🚚 सप्लायर्स की लेट डिलीवरी रिपोर्ट (Delayed Deliveries):

**1. ${delayedSupplier.supplier_name} (Code: SUP-GAUGEMASTER) — ⚠️ डिलीवरी में देरी (Delayed)**
- **परचेज ऑर्डर (PO Number):** ${delayedSupplier.po_number}
- **स्थिति (Status):** ऑर्डर्ड / इन-ट्रांजिट (${delayedSupplier.status})
- **अपेक्षित डिलीवरी तारीख:** ${delayedSupplier.expected_delivery_date} *(तारीख बीत चुकी है / लेट डिलीवरी)*
- **उत्पाद:** Pressure Gauge Pro (GAUGE-P300)
- **सुझाव:** सप्लायर से संपर्क करके संशोधित डिलीवरी समय (revised ETA) प्राप्त करें।

**समय पर डिलीवर करने वाले सप्लायर्स:**
- **ValveTech Precision Ltd:** 100% समय पर डिलीवरी (PO-2026-001, PO-2026-002 समय पर प्राप्त).
- **HydraCore Pumps:** सामान्य लीड टाइम (10 दिन).`;
        suggestions = [
          'पेंडिंग परचेज ऑर्डर्स दिखाओ।',
          'कम स्टॉक वाले प्रोडक्ट्स दिखाओ।',
          'Alice का ऑर्डर क्यों स्थगित हुआ?',
        ];
      } else {
        // Hinglish / Roman Hindi
        reply = `### 🚚 Delayed Supplier Deliveries ki Report:

**1. ${delayedSupplier.supplier_name} (Code: SUP-GAUGEMASTER) — ⚠️ DELIVERY LATE HAI**
- **Purchase Order (PO Number):** ${delayedSupplier.po_number}
- **Status:** Ordered / In-Transit (${delayedSupplier.status})
- **Expected Delivery Date:** ${delayedSupplier.expected_delivery_date} *(Overdue / Delivery delay ho chuki hai)*
- **Product:** Pressure Gauge Pro (GAUGE-P300)
- **Action:** Supplier se sampark karke revised delivery ETA mangwayein.

**On-Time Suppliers:**
- **ValveTech Precision Ltd:** 100% on-time track record (PO-2026-001 aur PO-2026-002 time par deliver huye).
- **HydraCore Pumps:** Normal lead time (10 days).`;
        suggestions = [
          'Pending purchase orders dikhao.',
          'Kam stock wale products dikhao.',
          'Alice ka order kyu defer hua?',
        ];
      }
    } else {
      // English
      reply = `### 🚚 Delayed Supplier Deliveries Report:

**1. ${delayedSupplier.supplier_name} (Code: SUP-GAUGEMASTER) — ⚠️ DELAYED**
- **Purchase Order:** ${delayedSupplier.po_number}
- **Status:** Ordered / In-Transit (${delayedSupplier.status})
- **Expected Delivery Date:** ${delayedSupplier.expected_delivery_date} *(Overdue / Delivery delayed)*
- **Product:** Pressure Gauge Pro (GAUGE-P300)
- **Recommended Action:** Contact supplier to expedite shipment tracking and confirm revised ETA.

**On-Time Suppliers:**
- **ValveTech Precision Ltd (SUP-VALVETECH):** 100% on-time delivery record (PO-2026-001, PO-2026-002 completed on time).
- **HydraCore Pumps & Drives (SUP-HYDRACORE):** Normal lead time (10 days).`;
      suggestions = [
        'Show pending purchase orders.',
        'Show low-stock products.',
        'Why was Alice’s order deferred?',
      ];
    }
  }

  // ==========================================
  // TOPIC 3: PENDING PURCHASE ORDERS
  // ==========================================
  else if (intent === 'PENDING_POS') {
    if (language === 'mr') {
      if (script === 'devanagari') {
        reply = `### 📋 प्रलंबित खरेदी ऑर्डर्स (Pending Purchase Orders):

**१. ${pendingPO.po_number} — इनबाउंड स्टॉक ऑर्डर**
- **पुरवठादार:** ${pendingPO.supplier_name}
- **स्थिती (Status):** \`${pendingPO.status}\` (प्रलंबित / अद्याप येणे बाकी)
- **अपेक्षित डिलिव्हरी तारीख:** ${pendingPO.expected_delivery_date}
- **उत्पादन:** Pressure Gauge Pro (GAUGE-P300)
- **इन्व्हेंटरीवरील परिणाम:** ही ऑर्डर गोदामात आल्यावर उपलब्ध साठा (Available Stock) त्वरित वाढेल.

**पूर्ण झालेल्या (Received) ऑर्डर्स:**
- **PO-2026-001:** ValveTech Precision Ltd — माल प्राप्त झाला (Closed)
- **PO-2026-002:** ValveTech Precision Ltd — माल प्राप्त झाला (Closed)`;
        suggestions = [
          'कमी स्टॉक असलेल्या वस्तू दाखवा.',
          'कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?',
          'वाटप इंजिनचे प्राधान्य नियम काय आहेत?',
        ];
      } else {
        // Roman Marathi
        reply = `### 📋 Pralambit Kharedi Orders (Pending POs List):

**1. ${pendingPO.po_number} — Inbound Stock Order**
- **Purvathadar:** ${pendingPO.supplier_name}
- **Status:** \`${pendingPO.status}\` (Pralambit / Yene baaki)
- **Apekshit Delivery Tarikh:** ${pendingPO.expected_delivery_date}
- **Vastu/Product:** Pressure Gauge Pro (GAUGE-P300)
- **Inventory Impact:** He shipment warehouse madhe aalyavar stock position vadhel.

**Purna Jhalelya POs:**
- **PO-2026-001:** ValveTech Precision Ltd — Received
- **PO-2026-002:** ValveTech Precision Ltd — Received`;
        suggestions = [
          'Kami stock aslelya vastu dakhva.',
          'Kontya suppliers chi delivery late ahe?',
          'Allocation engine che niyam sanga.',
        ];
      }
    } else if (language === 'hi') {
      if (script === 'devanagari') {
        reply = `### 📋 प्रलंबित परचेज ऑर्डर्स (Pending Purchase Orders):

**1. ${pendingPO.po_number} — इनबाउंड स्टॉक रिक्वेस्ट**
- **सप्लायर:** ${pendingPO.supplier_name}
- **स्थिति (Status):** \`${pendingPO.status}\` (पेंडिंग / आगमन प्रतीक्षित)
- **अपेक्षित डिलीवरी तारीख:** ${pendingPO.expected_delivery_date}
- **उत्पाद:** Pressure Gauge Pro (GAUGE-P300)
- **इन्वेंटरी प्रभाव:** डिलीवरी मिलते ही वेयरहाउस का उपलब्ध स्टॉक और इन्वेंटरी पोजीशन बढ़ जाएगा।

**पूर्ण (Received) हो चुके ऑर्डर्स:**
- **PO-2026-001:** ValveTech Precision Ltd — प्राप्त हो चुका है (Closed)
- **PO-2026-002:** ValveTech Precision Ltd — प्राप्त हो चुका है (Closed)`;
        suggestions = [
          'कम स्टॉक वाले प्रोडक्ट्स दिखाओ।',
          'कौनसे सप्लायर्स की डिलीवरी लेट है?',
          'Allocation engine के rules क्या हैं?',
        ];
      } else {
        // Hinglish / Roman Hindi
        reply = `### 📋 Pending Purchase Orders ki List:

**1. ${pendingPO.po_number} — Inbound Stock Requisition**
- **Supplier:** ${pendingPO.supplier_name}
- **Status:** \`${pendingPO.status}\` (Pending Arrival / Overdue)
- **Expected Delivery Date:** ${pendingPO.expected_delivery_date}
- **Product:** Pressure Gauge Pro (GAUGE-P300)
- **Impact:** Is order ke receive hone par warehouse me available stock increase hoga.

**Completed POs:**
- **PO-2026-001:** ValveTech Precision Ltd — Received
- **PO-2026-002:** ValveTech Precision Ltd — Received`;
        suggestions = [
          'Kam stock wale products dikhao.',
          'Kaunse suppliers ki delivery late hai?',
          'Allocation engine ke priority rules kya hain?',
        ];
      }
    } else {
      // English
      reply = `### 📋 Pending Purchase Orders (Open Inbound POs):

**1. ${pendingPO.po_number} — Inbound Stock Requisition**
- **Supplier:** ${pendingPO.supplier_name} (SUP-GAUGEMASTER)
- **Status:** \`${pendingPO.status}\` (Pending Arrival / Overdue)
- **Expected Delivery Date:** ${pendingPO.expected_delivery_date}
- **Target Product:** Pressure Gauge Pro (GAUGE-P300)
- **Inventory Impact:** Will add confirmed incoming units to warehouse inventory position once received.

**Completed/Closed POs:**
- **PO-2026-001:** ValveTech Precision Ltd — Received & inspected
- **PO-2026-002:** ValveTech Precision Ltd — Received & inspected`;
      suggestions = [
        'Show low-stock products.',
        'Which suppliers have delayed deliveries?',
        'How does the allocation engine break priority ties?',
      ];
    }
  }

  // ==========================================
  // TOPIC 4: ALICE'S DEFERRAL
  // ==========================================
  else if (intent === 'ALICE_DEFERRAL') {
    if (language === 'mr') {
      if (script === 'devanagari') {
        reply = `### 📦 Alice ची ऑर्डर का स्थगित (Deferred) झाली?

प्रेशर गेज प्रो (Pressure Gauge Pro - एकूण साठा: ४० युनिट्स) वाटपामध्ये:
१. **Charlie** (HIGH प्राधान्य, आधीची तारीख 2026-10-20) ला प्रथम **३० युनिट्स** वाटप करण्यात आले (साठा शिल्लक: १० युनिट्स).
२. **Alice** (HIGH प्राधान्य, तारीख 2026-10-25) ने २५ युनिट्सची मागणी केली होती, ज्यामध्ये **अंशतः डिलिव्हरीची परवानगी (Partial Delivery Allowed = true)** आणि **किमान स्वीकार्य प्रमाण १५ (Minimum Acceptable = 15)** होते.
३. गोदामात फक्त १० युनिट्स शिल्लक असल्याने, हे प्रमाण Alice च्या किमान स्वीकार्य १५ युनिट्सपेक्षा कमी होते. **बिझनेस नियमांनुसार उप-किमान वाटप प्रतिबंधित असल्याने तिची ऑर्डर स्थगित (deferred) करण्यात आली.**
४. **Bob** (MEDIUM प्राधान्य, आंशिक डिलिव्हरी = false) ला शून्य साठा शिल्लक असल्याने स्थगित करण्यात आले.`;
        suggestions = [
          'कमी स्टॉक असलेल्या वस्तू दाखवा.',
          'वाटप इंजिनचे प्राधान्य नियम काय आहेत?',
          'कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?',
        ];
      } else {
        reply = `### 📦 Alice Chi Order Ka Defer Zali?

Pressure Gauge Pro (Ekun stock: 40 units) allocation madhe:
1. **Charlie** (HIGH priority, earlier date 2026-10-20) la pehle **30 units** allocate jhale (Remaining stock: 10 units).
2. **Alice** (HIGH priority, date 2026-10-25) ne 25 units chi request keli hoti, jyat **partial delivery allowed = true** ani **minimum acceptable quantity = 15** hoti.
3. Fakt 10 units shillak aslyamule (ji minimum 15 peksha kami ahe), **business rules mule sub-minimum delivery nishedh aslyane order deferred zali.**
4. **Bob** (MEDIUM priority, partial = false) stock samplyamule defer jhala.`;
        suggestions = [
          'Kami stock aslelya vastu dakhva.',
          'Allocation engine che niyam sanga.',
          'Kontya suppliers chi delivery late ahe?',
        ];
      }
    } else if (language === 'hi') {
      if (script === 'devanagari') {
        reply = `### 📦 Alice का ऑर्डर क्यों स्थगित (Deferred) हुआ?

प्रेशर गेज प्रो (Pressure Gauge Pro - कुल स्टॉक: 40 यूनिट्स) के आवंटन में:
1. **Charlie** (HIGH प्राथमिकता, पहली डिलीवरी तारीख 2026-10-20) को पहले **30 यूनिट्स** मिले (बचा हुआ स्टॉक: 10 यूनिट्स)।
2. **Alice** (HIGH प्राथमिकता, तारीख 2026-10-25) ने 25 यूनिट्स का अनुरोध किया था जिसमें **आंशिक डिलीवरी मान्य (Partial Allowed = true)** और **न्यूनतम स्वीकार्य मात्रा 15 (Minimum Acceptable = 15)** थी।
3. केवल 10 यूनिट्स बचे थे (< न्यूनतम 15), इसलिए **बिजनेस नियमों के अनुसार न्यूनतम सीमा से कम डिलीवरी नहीं की जा सकती और ऑर्डर स्थगित (deferred) कर दिया गया।**
4. **Bob** (MEDIUM प्राथमिकता, आंशिक डिलीवरी = false) को शून्य स्टॉक बचने पर स्थगित किया गया।`;
        suggestions = [
          'कम स्टॉक वाले प्रोडक्ट्स दिखाओ।',
          'Allocation engine के rules क्या हैं?',
          'कौनसे सप्लायर्स की डिलीवरी लेट है?',
        ];
      } else {
        reply = `### 📦 Alice ka Order Kyu Defer Hua?

Pressure Gauge Pro (Total stock: 40 units) allocation run me:
1. **Charlie** (HIGH priority, earlier promised date 2026-10-20) ko pehle evaluate kiya gaya aur usko **30 units** mil gaye (Remaining stock: 10 units).
2. **Alice** (HIGH priority, promised date 2026-10-25) ne 25 units request kiya tha jisme **partial delivery allowed = true** aur **minimum acceptable quantity = 15** thi.
3. Kyunki sirf 10 units bache the (< minimum 15), **OrderWise business rules ke mutabiq sub-threshold delivery allow nahi hui aur order defer ho gaya.**
4. **Bob** (MEDIUM priority, no partial) available stock 0 hone par defer hua.`;
        suggestions = [
          'Kam stock wale products dikhao.',
          'Allocation engine ke priority rules kya hain?',
          'Kaunse suppliers ki delivery late hai?',
        ];
      }
    } else {
      reply = `### 📦 Why Alice’s Order Was Deferred:

In the Pressure Gauge Pro allocation run (initial stock = 40 units):
1. **Charlie** (HIGH priority, promised date 2026-10-20) was evaluated first and claimed **30 units** (leaving 10 units).
2. **Alice** (HIGH priority, promised date 2026-10-25) requested 25 units with **partial delivery allowed** and **minimum acceptable quantity of 15**. Because only 10 units remained (< minimum 15), business rules strictly prohibited sub-threshold delivery and deferred the order.
3. **Bob** (MEDIUM priority, no partial allowed) was deferred with 0 remaining stock.`;
      suggestions = [
        'How does the allocation engine break priority ties?',
        'Show low-stock products.',
        'Which suppliers have delayed deliveries?',
      ];
    }
  }

  // ==========================================
  // TOPIC 5: ALLOCATION ENGINE RULES
  // ==========================================
  else if (intent === 'ALLOCATION_RULES') {
    if (language === 'mr') {
      reply = script === 'devanagari'
        ? `### ⚖️ OrderWise वाटप इंजिनचे प्राधान्य नियम (Allocation Engine Rules):
प्रत्येक वाटप फेरीत ऑर्डर्सचे मूल्यमापन या काटेकोर क्रमाने होते:
१. **मंजूर प्राधान्य (Approved Priority DESC):** CRITICAL (4) > HIGH (3) > MEDIUM (2) > LOW (1)
२. **वचन दिलेली तारीख (Promised Delivery Date ASC):** आधी वचन दिलेली तारीख आधी पूर्ण केली जाते.
३. **ऑर्डर निर्मिती वेळ (Created Date ASC):** समान तारखेसाठी प्रथम येणाऱ्यास प्रथम प्राधान्य.
४. **ऑर्डर आयडी (Order ID ASC):** अंतिम टाय-ब्रेकर.

**वाटप अटी:**
- पूर्ण वाटप (Full Fulfillment): शिल्लक साठा >= मागितलेली संख्या.
- आंशिक वाटप (Partial Fulfillment): आंशिक परवानगी = true आणि शिल्लक साठा >= किमान स्वीकार्य संख्या.
- स्थगित (Deferred): वरील अटी पूर्ण न झाल्यास.`
        : `### ⚖️ OrderWise Allocation Engine Priority Rules:
Pratyek allocation run madhe orders ya kramane process hotat:
1. **Approved Priority DESC:** CRITICAL (4) > HIGH (3) > MEDIUM (2) > LOW (1)
2. **Promised Delivery Date ASC:** Adhichi promised date asleli order pehle purna hote.
3. **Created Date ASC:** First-come, first-served for identical dates.
4. **Order ID ASC:** Final tie-breaker.

*Rule:* AI fakt shifaras (recommend) karte. Authorized admin approve kelyanantarach engine execute hote.`;
      suggestions = [
        'Alice ची ऑर्डर का स्थगित झाली?',
        'कमी स्टॉक असलेल्या वस्तू दाखवा.',
        'कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?',
      ];
    } else if (language === 'hi') {
      reply = script === 'devanagari'
        ? `### ⚖️ डिटरमिनिस्टिक आवंटन इंजन के नियम (Allocation Engine Rules):
हर आवंटन रन में ऑर्डर्स को इस सटीक क्रम में प्रोसेस किया जाता है:
1. **स्वीकृत प्राथमिकता (Approved Priority DESC):** CRITICAL (4) > HIGH (3) > MEDIUM (2) > LOW (1)
2. **वचनबद्ध डिलीवरी तारीख (Promised Delivery Date ASC):** पहले की तारीख पहले पूरी होगी।
3. **ऑर्डर निर्माण समय (Created Date ASC):** समान तारीख पर पहले आओ-पहले पाओ।
4. **ऑर्डर आईडी (Order ID ASC):** अंतिम टाई-ब्रेकर।

*सिद्धांत:* AI सिफारिश करता है। बिजनेस नियम मान्य करते हैं। अधिकृत एडमिन मंजूरी देते हैं।`
        : `### ⚖️ Deterministic Allocation Engine Rules:
Har allocation run orders ko is exact sequence me evaluate karta hai:
1. **Approved Priority DESC:** CRITICAL (4) > HIGH (3) > MEDIUM (2) > LOW (1)
2. **Promised Delivery Date ASC:** Pehle promised date wale orders pehle fulfill hote hain.
3. **Created Date ASC:** First-come, first-served for identical dates.
4. **Order ID ASC:** Final tie-breaker.

*Principle:* AI recommends. Business rules validate. Authorized humans approve. OrderWise allocates and explains.`;
      suggestions = [
        'Alice ka order kyu defer hua?',
        'Kam stock wale products dikhao.',
        'Kaunse suppliers ki delivery late hai?',
      ];
    } else {
      reply = `### ⚖️ Deterministic Allocation Engine Rules:
Every allocation run evaluates orders in this exact deterministic order:
1. **Approved Priority DESC:** CRITICAL (4) > HIGH (3) > MEDIUM (2) > LOW (1)
2. **Promised Delivery Date ASC:** Earlier promised dates fulfilled first
3. **Created Date ASC:** First-come, first-served for identical dates
4. **Order ID ASC:** Final tie-breaker for identical timestamps

*Remember:* AI only suggests recommendations. Authorized admins must approve or override them before the allocation engine executes.`;
      suggestions = [
        'Why was Alice’s order deferred?',
        'Show low-stock products.',
        'Which suppliers have delayed deliveries?',
      ];
    }
  }

  // ==========================================
  // TOPIC 6: SIMULATION LAB
  // ==========================================
  else if (intent === 'SIMULATION_LAB') {
    if (language === 'mr') {
      reply = `### 🧪 सिम्युलेशन लॅब क्षमता (Simulation Lab):
सिम्युलेशन पूर्णपणे मेमरीमध्ये चालतात आणि थेट डेटाबेस बदलत नाहीत:
- **Inventory Increase:** साठ्याची वाढ तपासून तुटवडा दूर करणे.
- **Demand Surge:** २५% किंवा ५०% मागणी वाढल्यास वाटपावर होणारा परिणाम.
- **Supplier Delay:** पुरवठादाराची डिलिव्हरी उशिरा झाल्यास होणारे परिणाम.
- **Priority Change:** ग्राहकांचे प्राधान्य बदलून परिणामांची चाचणी घेणे.`;
      suggestions = ['कमी स्टॉक असलेल्या वस्तू दाखवा.', 'प्रलंबित खरेदी ऑर्डर दाखवा.'];
    } else if (language === 'hi') {
      reply = `### 🧪 सिम्युलेशन लैब क्षमताएं (Simulation Lab Capabilities):
सिम्युलेशन पूरी तरह मेमोरी में चलते हैं और लाइव डेटा को प्रभावित नहीं करते:
- **Inventory Increase:** अतिरिक्त स्टॉक जोड़कर बॉटलनेक सुलझाना।
- **Demand Surge:** मांग में 25% या 50% उछाल का प्रभाव देखना।
- **Supplier Delay:** सप्लायर देरी के प्रभाव का विश्लेषण करना।
- **Priority Change:** ग्राहक प्राथमिकता बदलकर परिणामों की तुलना करना।`;
      suggestions = ['कम स्टॉक वाले प्रोडक्ट्स दिखाओ।', 'पेंडिंग परचेज ऑर्डर्स दिखाओ।'];
    } else {
      reply = `### 🧪 Simulation Lab Capabilities:
Simulations run purely in memory without mutating live inventory or live orders:
- **Inventory Increase:** Test adding stock to resolve bottlenecks.
- **Demand Surge:** Test sudden +25% or +50% spikes in customer demand.
- **Supplier Delay:** Model delayed inbound PO shipments.
- **Priority Change:** Test outcome shifts when changing customer priority tiers.`;
      suggestions = ['Show low-stock products.', 'Show pending purchase orders.'];
    }
  }

  // ==========================================
  // TOPIC 7: GENERAL / WELCOME
  // ==========================================
  else {
    if (language === 'mr') {
      reply = script === 'devanagari'
        ? `नमस्कार! मी तुमचा **OrderWise AI बहुभाषिक सहाय्यक (Multilingual Chatbot)** आहे.
मी तुम्हाला खालील गोष्टींमध्ये मदत करू शकतो:
- कमी स्टॉक असलेली उत्पादने आणि इन्व्हेंटरी तुटवडा तपासणे
- पुरवठादारांची उशिरा डिलिव्हरी आणि प्रलंबित खरेदी ऑर्डर्स (Pending POs) तपासणे
- वाटप निर्णय, आंशिक डिलिव्हरी आणि ऑर्डर्स स्थगित होण्याची कारणे समजून घेणे
- सिम्युलेशन लॅब आणि AI प्राधान्य शिफारशींचे विश्लेषण करणे

मी तुम्हाला कशी मदत करू शकेन?`
        : `Namaskar! Mi tumcha **OrderWise AI Multilingual Assistant** ahe.
Mi tumhala khaliil goshtinmadhe madat karu shakto:
- Kami stock aslelya vastu ani inventory bottleneck tapashane
- Delayed suppliers ani pending purchase orders dakhvane
- Alice kivha itar orders defer honyachi karano samjavun sangane
- Allocation rules ani Simulation Lab madhil experiments

Tumhala kay mahiti havi ahe?`;
      suggestions = [
        'कमी स्टॉक असलेल्या वस्तू दाखवा.',
        'कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?',
        'प्रलंबित खरेदी ऑर्डर दाखवा.',
      ];
    } else if (language === 'hi') {
      reply = script === 'devanagari'
        ? `नमस्ते! मैं आपका **OrderWise AI बहुभाषी सहायक (Multilingual Chatbot)** हूँ।
मैं आपकी इन मामलों में सहायता कर सकता हूँ:
- कम स्टॉक वाले प्रोडक्ट्स और इन्वेंटरी बॉटलनेक्स का विश्लेषण
- लेट डिलीवरी वाले सप्लायर्स और पेंडिंग परचेज ऑर्डर्स की जानकारी
- ऑर्डर आवंटन, आंशिक डिलीवरी और ऑर्डर्स के डेफर्ल के कारणों की व्याख्या
- सिम्युलेशन लैब और AI प्राथमिकता सिफारिशों की जानकारी

बताइए, आज मैं आपकी क्या सहायता कर सकता हूँ?`
        : `Namaste! Main aapka **OrderWise AI Multilingual Assistant** hoon.
Main aapko in cheezon me assist kar sakta hoon:
- Kam stock wale products aur inventory bottlenecks check karna
- Delayed suppliers aur pending purchase orders ki details
- Alice ka order kyu defer hua aur allocation ke deterministic rules
- Simulation Lab aur priority recommendations

Aap kya poochna chahte hain?`;
      suggestions = [
        'Kam stock wale products dikhao.',
        'Kaunse suppliers ki delivery late hai?',
        'Pending purchase orders dikhao.',
      ];
    } else {
      reply = `Hello! I am your **OrderWise AI Assistant Chatbot**.
I can assist you with:
- Explaining order fulfillment, partial shipments, and deferral reasons (e.g. why Alice’s order was deferred)
- Analyzing inventory bottlenecks and low-stock products (like Pressure Gauge Pro)
- Identifying suppliers with delayed deliveries and open purchase orders
- Explaining deterministic allocation rules and priority tie-breakers
- Guiding what-if simulations in the Simulation Lab

How can I help you today?`;
      suggestions = [
        'Show low-stock products.',
        'Which suppliers have delayed deliveries?',
        'Show pending purchase orders.',
      ];
    }
  }

  return {
    reply,
    suggestions,
    detectedLanguage: language,
    detectedDialect: dialect,
    detectedScript: script,
    languageLabel: detected.languageLabel,
    provider: 'fallback-engine',
    model: 'orderwise-multilingual-v1',
  };
}

/**
 * Returns suggested prompt pills tailored for each language option in the UI.
 */
function getMultilingualPrompts(language = 'en') {
  if (language === 'mr') {
    return [
      '📉 कमी स्टॉक असलेल्या वस्तू दाखवा',
      '🚚 कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?',
      '📋 प्रलंबित खरेदी ऑर्डर दाखवा',
      '📦 Alice ची ऑर्डर का स्थगित (deferred) झाली?',
      '🔥 सर्वात मोठा स्टॉक तुटवडा (bottleneck) कोणता आहे?',
      '⚖️ वाटप इंजिनचे प्राधान्य नियम काय आहेत?',
    ];
  }

  if (language === 'hi') {
    return [
      '📉 Kam stock wale products dikhao',
      '🚚 Kaunse suppliers ki delivery late hai?',
      '📋 Pending purchase orders dikhao',
      '📦 Alice ka order kyu defer hua?',
      '🔥 Pressure Gauge Pro ka stock kitna hai?',
      '⚖️ Allocation engine ke priority rules kya hain?',
    ];
  }

  return [
    '📉 Show low-stock products',
    '🚚 Which suppliers have delayed deliveries?',
    '📋 Show pending purchase orders',
    '📦 Why was Alice’s order deferred?',
    '🔥 Which product is our biggest inventory bottleneck?',
    '⚖️ How does the allocation engine break priority ties?',
  ];
}

module.exports = {
  SUPPORTED_LANGUAGES,
  detectLanguage,
  classifyIntent,
  generateLocalizedFallbackReply,
  getMultilingualPrompts,
};
