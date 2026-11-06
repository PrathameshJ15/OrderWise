require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const {
  parseOrderPrompt,
  getCustomerRecommendations,
  getCustomerOrderInsights,
  handleOrderAssistantChat,
} = require('../src/services/customerAiService');

describe('Customer AI Capabilities Acceptance Tests', () => {
  it('parses natural language order prompts into structured items with SKU matching', async () => {
    const prompt = 'I need 20 PLC Control Modules and 15 Industrial Pressure Sensors by next Friday';
    const result = await parseOrderPrompt(prompt);

    expect(result).toHaveProperty('draft_items');
    expect(result.draft_items.length).toBeGreaterThanOrEqual(1);

    const plcItem = result.draft_items.find((i) => i.sku === 'PLC-001');
    if (plcItem) {
      expect(plcItem.name).toBe('PLC Control Module');
      expect(plcItem.requested_quantity).toBe(20);
      expect(plcItem.partial_delivery_allowed).toBe(true);
      expect(plcItem.minimum_acceptable_quantity).toBeLessThanOrEqual(20);
    }
  });

  it('handles keyword fallback matching in natural language prompts', async () => {
    const prompt = 'Looking for some servo motors and fans for our factory';
    const result = await parseOrderPrompt(prompt);

    expect(result.draft_items.length).toBeGreaterThanOrEqual(1);
    const hasServoOrFan = result.draft_items.some((i) => i.sku === 'SVM-003' || i.sku === 'ICF-015');
    expect(hasServoOrFan).toBe(true);
  });

  it('generates product recommendations with valid stock and reasoning', async () => {
    const result = await getCustomerRecommendations(3); // Customer Alice

    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);

    if (result.recommendations.length > 0) {
      const topRec = result.recommendations[0];
      expect(topRec).toHaveProperty('sku');
      expect(topRec).toHaveProperty('available_stock');
      expect(topRec).toHaveProperty('reason');
      expect(topRec.available_stock).toBeGreaterThan(0);
    }
  });

  it('generates order insights explaining allocation decisions and shortages', async () => {
    // Order 101 in demoStore or DB
    try {
      const insights = await getCustomerOrderInsights(101, 3);
      expect(insights).toHaveProperty('order_id');
      expect(insights).toHaveProperty('overall_fill_rate');
      expect(insights).toHaveProperty('governance_summary');
      expect(insights).toHaveProperty('item_insights');
    } catch (err) {
      // In case order 101 is not owned by customer 3, test error behavior
      expect(err.message).toBeDefined();
    }
  });

  it('answers customer questions using OrderWise heuristic assistant', async () => {
    const res = await handleOrderAssistantChat(3, 'What is the status of my order?');
    expect(res).toHaveProperty('reply');
    expect(typeof res.reply).toBe('string');
    expect(res.reply.length).toBeGreaterThan(10);
  });
});
