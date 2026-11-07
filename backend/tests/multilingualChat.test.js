const {
  detectLanguage,
  classifyIntent,
  generateLocalizedFallbackReply,
  getMultilingualPrompts,
} = require('../src/services/multilingualChatService');
const { chatWithAssistant } = require('../src/services/aiService');

describe('Multilingual AI Chatbot for OrderWise Tests', () => {
  describe('1. Language & Script Detection', () => {
    it('detects English questions accurately', () => {
      const q1 = detectLanguage('Show low-stock products.');
      expect(q1.language).toBe('en');
      expect(q1.script).toBe('latin');

      const q2 = detectLanguage('Which suppliers have delayed deliveries?');
      expect(q2.language).toBe('en');

      const q3 = detectLanguage('Show pending purchase orders.');
      expect(q3.language).toBe('en');
    });

    it('detects Devanagari Hindi accurately', () => {
      const q1 = detectLanguage('कम स्टॉक वाले प्रोडक्ट्स दिखाओ।');
      expect(q1.language).toBe('hi');
      expect(q1.script).toBe('devanagari');
      expect(q1.languageLabel).toBe('हिन्दी');

      const q2 = detectLanguage('कौनसे सप्लायर्स की डिलीवरी लेट है?');
      expect(q2.language).toBe('hi');
      expect(q2.script).toBe('devanagari');

      const q3 = detectLanguage('पेंडिंग परचेज ऑर्डर्स दिखाओ।');
      expect(q3.language).toBe('hi');
    });

    it('detects Devanagari Marathi accurately', () => {
      const q1 = detectLanguage('कमी स्टॉक असलेल्या वस्तू दाखवा.');
      expect(q1.language).toBe('mr');
      expect(q1.script).toBe('devanagari');
      expect(q1.languageLabel).toBe('मराठी');

      const q2 = detectLanguage('कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?');
      expect(q2.language).toBe('mr');
      expect(q2.script).toBe('devanagari');

      const q3 = detectLanguage('प्रलंबित खरेदी ऑर्डर दाखवा.');
      expect(q3.language).toBe('mr');
      expect(q3.script).toBe('devanagari');
    });

    it('detects Roman Hindi / Hinglish accurately', () => {
      const q1 = detectLanguage('Kam stock wale products dikhao.');
      expect(q1.language).toBe('hi');
      expect(q1.dialect).toBe('hinglish');
      expect(q1.languageLabel).toBe('Hinglish');

      const q2 = detectLanguage('Kaunse suppliers ki delivery late hai?');
      expect(q2.language).toBe('hi');
      expect(q2.dialect).toBe('hinglish');

      const q3 = detectLanguage('Pending purchase orders dikhao.');
      expect(q3.language).toBe('hi');
      expect(q3.dialect).toBe('hinglish');

      const q4 = detectLanguage('Alice ka order kyu defer hua?');
      expect(q4.language).toBe('hi');
      expect(q4.dialect).toBe('hinglish');
    });

    it('detects Roman Marathi accurately', () => {
      const q1 = detectLanguage('Kami stock aslelya vastu dakhva.');
      expect(q1.language).toBe('mr');
      expect(q1.dialect).toBe('marathi_roman');
      expect(q1.languageLabel).toBe('Roman Marathi');

      const q2 = detectLanguage('Kontya suppliers chi delivery late ahe?');
      expect(q2.language).toBe('mr');
      expect(q2.dialect).toBe('marathi_roman');

      const q3 = detectLanguage('Pending purchase orders dakhva.');
      expect(q3.language).toBe('mr');
      expect(q3.dialect).toBe('marathi_roman');

      const q4 = detectLanguage('Alice chi order ka defer zali?');
      expect(q4.language).toBe('mr');
      expect(q4.dialect).toBe('marathi_roman');
    });

    it('respects user preferred language selector when message is language-neutral', () => {
      const qMr = detectLanguage('Status', 'mr');
      expect(qMr.language).toBe('mr');

      const qHi = detectLanguage('Status', 'hi');
      expect(qHi.language).toBe('hi');

      const qEn = detectLanguage('Status', 'en');
      expect(qEn.language).toBe('en');
    });
  });

  describe('2. Business Intelligence Intent Classification', () => {
    it('classifies low-stock queries across all dialects', () => {
      expect(classifyIntent('show low-stock products')).toBe('LOW_STOCK');
      expect(classifyIntent('kam stock wale products dikhao')).toBe('LOW_STOCK');
      expect(classifyIntent('कमी स्टॉक असलेल्या वस्तू दाखवा')).toBe('LOW_STOCK');
      expect(classifyIntent('kami stock aslelya vastu dakhva')).toBe('LOW_STOCK');
    });

    it('classifies delayed supplier deliveries across all dialects', () => {
      expect(classifyIntent('which suppliers have delayed deliveries?')).toBe('DELAYED_SUPPLIERS');
      expect(classifyIntent('kaunse suppliers ki delivery late hai?')).toBe('DELAYED_SUPPLIERS');
      expect(classifyIntent('कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?')).toBe('DELAYED_SUPPLIERS');
      expect(classifyIntent('kontya suppliers chi delivery late ahe?')).toBe('DELAYED_SUPPLIERS');
    });

    it('classifies pending purchase orders across all dialects', () => {
      expect(classifyIntent('show pending purchase orders')).toBe('PENDING_POS');
      expect(classifyIntent('pending purchase orders dikhao')).toBe('PENDING_POS');
      expect(classifyIntent('प्रलंबित खरेदी ऑर्डर दाखवा')).toBe('PENDING_POS');
      expect(classifyIntent('pending purchase orders dakhva')).toBe('PENDING_POS');
    });

    it('classifies Alice deferral and allocation rule queries', () => {
      expect(classifyIntent('why was alice’s order deferred?')).toBe('ALICE_DEFERRAL');
      expect(classifyIntent('alice ka order kyu defer hua?')).toBe('ALICE_DEFERRAL');
      expect(classifyIntent('alice chi order ka defer zali?')).toBe('ALICE_DEFERRAL');
      expect(classifyIntent('how does the allocation engine break priority ties?')).toBe('ALLOCATION_RULES');
      expect(classifyIntent('allocation engine ke priority rules kya hain?')).toBe('ALLOCATION_RULES');
      expect(classifyIntent('वाटप इंजिनचे प्राधान्य नियम काय आहेत?')).toBe('ALLOCATION_RULES');
    });
  });

  describe('3. Business Intelligence Responses & Accuracy (chatWithAssistant)', () => {
    const mockBusinessData = {
      lowStockProducts: [
        {
          name: 'Pressure Gauge Pro',
          sku: 'GAUGE-P300',
          available_stock: 40,
          reorder_point: 70,
          safety_stock: 15,
        },
      ],
      delayedSuppliers: [
        {
          supplier_name: 'GaugeMaster Instruments',
          po_number: 'PO-2026-003',
          expected_delivery_date: '2026-10-18',
          status: 'ordered',
        },
      ],
      pendingPOs: [
        {
          po_number: 'PO-2026-003',
          supplier_name: 'GaugeMaster Instruments',
          expected_delivery_date: '2026-10-18',
          status: 'ordered',
        },
      ],
    };

    it('answers Low-Stock in English with factual data', async () => {
      const res = await chatWithAssistant({ message: 'Show low-stock products.' });
      expect(res.reply.length).toBeGreaterThan(30);
      expect(res.detectedLanguage).toBe('en');
      expect(res.suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('answers Low-Stock in Hinglish / Hindi with factual data', async () => {
      const res = await chatWithAssistant({ message: 'Kam stock wale products dikhao.' });
      expect(res.reply.length).toBeGreaterThan(30);
      expect(res.detectedLanguage).toBe('hi');
      expect(res.detectedDialect).toBe('hinglish');
      expect(res.suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('answers Low-Stock in Devanagari Marathi with factual data', async () => {
      const res = await chatWithAssistant({ message: 'कमी स्टॉक असलेल्या वस्तू दाखवा.' });
      expect(res.reply.length).toBeGreaterThan(30);
      expect(res.detectedLanguage).toBe('mr');
      expect(res.detectedScript).toBe('devanagari');
      expect(res.suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('answers Delayed Suppliers in English, Hindi, and Marathi', async () => {
      // English
      const enRes = await chatWithAssistant({ message: 'Which suppliers have delayed deliveries?' });
      expect(enRes.reply).toContain('GaugeMaster Instruments');
      expect(enRes.detectedLanguage).toBe('en');

      // Hinglish
      const hiRes = await chatWithAssistant({ message: 'Kaunse suppliers ki delivery late hai?' });
      expect(hiRes.reply).toContain('GaugeMaster Instruments');
      expect(hiRes.detectedLanguage).toBe('hi');

      // Marathi
      const mrRes = await chatWithAssistant({ message: 'कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?' });
      expect(mrRes.reply).toContain('GaugeMaster Instruments');
      expect(mrRes.detectedLanguage).toBe('mr');
    });

    it('answers Pending Purchase Orders in English, Hindi, and Marathi', async () => {
      // English
      const enRes = await chatWithAssistant({ message: 'Show pending purchase orders.' });
      expect(enRes.reply).toContain('GaugeMaster Instruments');
      expect(enRes.detectedLanguage).toBe('en');

      // Hinglish
      const hiRes = await chatWithAssistant({ message: 'Pending purchase orders dikhao.' });
      expect(hiRes.reply).toContain('GaugeMaster Instruments');
      expect(hiRes.detectedLanguage).toBe('hi');

      // Marathi
      const mrRes = await chatWithAssistant({ message: 'प्रलंबित खरेदी ऑर्डर दाखवा.' });
      expect(mrRes.reply).toContain('GaugeMaster Instruments');
      expect(mrRes.detectedLanguage).toBe('mr');
    });

    it('explains Alice’s deferral with exact business logic in English, Hindi, and Marathi', async () => {
      const enRes = await chatWithAssistant({ message: 'Why was Alice’s order deferred?' });
      expect(enRes.reply).toContain('Charlie');
      expect(enRes.reply).toContain('15');

      const hiRes = await chatWithAssistant({ message: 'Alice ka order kyu defer hua?' });
      expect(hiRes.reply).toContain('Charlie');
      expect(hiRes.reply).toContain('15');

      const mrRes = await chatWithAssistant({ message: 'Alice ची ऑर्डर का स्थगित झाली?' });
      expect(mrRes.reply).toContain('Charlie');
      expect(mrRes.detectedLanguage).toBe('mr');
    });

    it('answers order arrival and delivery questions naturally in Hindi, Hinglish, Marathi, and Roman Marathi', async () => {
      // Devanagari Hindi
      const hiRes = await chatWithAssistant({ message: 'मेरा ऑर्डर कब आएगा?' });
      expect(hiRes.detectedLanguage).toBe('hi');
      expect(hiRes.reply).toMatch(/ऑर्डर|डिलीवरी|OrderWise/);

      // Hinglish
      const hinglishRes = await chatWithAssistant({ message: 'Mera order kab aayega?' });
      expect(hinglishRes.detectedLanguage).toBe('hi');
      expect(hinglishRes.reply).toMatch(/order|delivery|OrderWise/i);

      // Devanagari Marathi
      const mrRes = await chatWithAssistant({ message: 'माझी ऑर्डर कधी येईल?' });
      expect(mrRes.detectedLanguage).toBe('mr');
      expect(mrRes.reply).toMatch(/ऑर्डर|डिलिव्हरी|OrderWise/);

      // Roman Marathi
      const romanMrRes = await chatWithAssistant({ message: 'Majhi order kadhi yeil?' });
      expect(romanMrRes.detectedLanguage).toBe('mr');
      expect(romanMrRes.reply).toMatch(/order|delivery|OrderWise/i);
    });

    it('handles language switching mid-conversation while preserving context', async () => {
      const history = [
        { sender: 'user', text: 'Show low-stock products.' },
        { sender: 'assistant', text: 'Pressure Gauge Pro is scarce.' },
      ];

      // Next user turn switches to Roman Marathi
      const res = await chatWithAssistant({
        message: 'Kontya suppliers chi delivery late ahe?',
        history,
        language: 'mr',
      });
      expect(res.detectedLanguage).toBe('mr');
      expect(res.reply).toContain('GaugeMaster Instruments');
    });
  });

  describe('4. Multilingual Prompts Utility', () => {
    it('returns tailored prompts for English, Hindi, and Marathi', () => {
      const enPrompts = getMultilingualPrompts('en');
      expect(enPrompts).toContain('📉 Show low-stock products');
      expect(enPrompts).toContain('🚚 Which suppliers have delayed deliveries?');

      const hiPrompts = getMultilingualPrompts('hi');
      expect(hiPrompts).toContain('📉 Kam stock wale products dikhao');
      expect(hiPrompts).toContain('🚚 Kaunse suppliers ki delivery late hai?');

      const mrPrompts = getMultilingualPrompts('mr');
      expect(mrPrompts).toContain('📉 कमी स्टॉक असलेल्या वस्तू दाखवा');
      expect(mrPrompts).toContain('🚚 कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे?');
    });
  });
});
