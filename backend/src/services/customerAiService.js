const { query } = require('../config/db');
const { env } = require('../config/env');
const demoStore = require('./demoStore');

/**
 * Customer AI Service for OrderWise
 * Provides:
 *  1. AI Order Assistant (natural language chat on user's orders, allocation results, dates, pending units)
 *  2. AI Product Recommendations (context-aware industrial component suggestions)
 *  3. AI Order Insights (detailed explanation of fulfillment, partial delivery, shortages)
 *  4. AI Order Creation Assistant (draft extraction from natural language prompts)
 */

async function getCustomerOrders(userId) {
  try {
    const res = await query(
      `SELECT 
         o.id,
         o.status,
         o.promised_delivery_date,
         o.business_notes,
         o.created_at,
         op.approved_priority,
         op.priority_rank
       FROM orders o
       LEFT JOIN order_priorities op ON op.order_id = o.id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC
       LIMIT 10;`,
      [userId]
    );

    const orders = res.rows;
    for (const ord of orders) {
      const itemsRes = await query(
        `SELECT 
           oi.id,
           oi.product_id,
           p.sku,
           p.name as product_name,
           p.unit,
           p.category,
           oi.requested_quantity,
           oi.minimum_acceptable_quantity,
           oi.partial_delivery_allowed,
           ar.allocated_quantity,
           ar.status as allocation_status,
           ar.explanation as allocation_explanation
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         LEFT JOIN LATERAL (
           SELECT allocated_quantity, status, explanation
           FROM allocation_results
           WHERE order_item_id = oi.id
           ORDER BY created_at DESC
           LIMIT 1
         ) ar ON true
         WHERE oi.order_id = $1;`,
        [ord.id]
      );
      ord.items = itemsRes.rows;
    }
    return orders;
  } catch (_err) {
    // Demo store fallback
    const all = demoStore.orders.filter((o) => String(o.customer_id) === String(userId));
    return all.map((o) => ({
      ...o,
      items: o.items || [],
    }));
  }
}

/**
 * Feature A: Customer AI Order Assistant
 */
async function handleOrderAssistantChat(userId, message, history = []) {
  const customerOrders = await getCustomerOrders(userId);

  const ordersContext = customerOrders.map((o) => {
    const itemsStr = (o.items || [])
      .map(
        (i) =>
          `[Item: ${i.product_name} (${i.sku}), Requested: ${i.requested_quantity} ${i.unit || 'units'}, Allocated: ${i.allocated_quantity ?? 0}, Status: ${i.allocation_status || o.status}, Min Acceptable: ${i.minimum_acceptable_quantity}, Partial Allowed: ${i.partial_delivery_allowed ? 'Yes' : 'No'}]`
      )
      .join('; ');
    return `Order #${o.id} - Status: ${o.status}, Delivery Date: ${o.promised_delivery_date || 'N/A'}, Priority: ${o.approved_priority || 'Standard'}. Items: ${itemsStr}`;
  });

  const promptSystem = `You are OrderWise AI Assistant, an expert customer-facing assistant for an industrial supply chain platform.
The customer is asking about their orders, inventory allocation, shipment dates, pending units, or shortages.
Answer accurately, politely, and concisely using the provided order records.
If an order was only partially fulfilled or deferred, explain that OrderWise uses deterministic priority-based inventory allocation and that stock was reserved for higher-priority or earlier-committed orders according to strict business rules.
Do not invent order numbers that do not exist in the context.

Current Customer Orders:
${ordersContext.length > 0 ? ordersContext.join('\n') : 'No active orders on record.'}`;

  // Attempt Groq API if key is present
  if (env.GROQ_API_KEY && env.GROQ_API_KEY !== 'placeholder_groq_api_key' && !env.GROQ_API_KEY.includes('your_')) {
    try {
      const messages = [
        { role: 'system', content: promptSystem },
        ...(Array.isArray(history) ? history.slice(-4) : []),
        { role: 'user', content: message },
      ];

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.3,
          max_tokens: 450,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          return {
            reply: text.trim(),
            provider: 'groq',
            model: env.GROQ_MODEL,
          };
        }
      }
    } catch (_err) {
      // Fall through to heuristic
    }
  }

  // Industrial heuristic engine
  const q = (message || '').toLowerCase();
  let reply = '';

  if (customerOrders.length === 0) {
    reply = "You currently don't have any placed orders. You can browse the Industrial Automation catalog and create an order to see real-time allocation in action.";
  } else if (q.includes('status') || q.includes('my order') || q.includes('where is')) {
    const latest = customerOrders[0];
    const itemSummaries = (latest.items || []).map(
      (i) => `${i.product_name} (${i.allocated_quantity ?? 0}/${i.requested_quantity} ${i.unit || 'units'} allocated - ${i.allocation_status || latest.status})`
    );
    reply = `Your most recent order is Order #${latest.id} (Status: ${latest.status.toUpperCase()}). Promised delivery date: ${latest.promised_delivery_date || 'Standard lead time'}. Fulfillment details: ${itemSummaries.join(', ')}.`;
  } else if (q.includes('partial') || q.includes('shortage') || q.includes('deferred') || q.includes('why')) {
    const deferredOrPartial = customerOrders.flatMap((o) =>
      (o.items || [])
        .filter((i) => i.allocation_status === 'partially_fulfilled' || i.allocation_status === 'deferred')
        .map((i) => ({ orderId: o.id, ...i }))
    );
    if (deferredOrPartial.length > 0) {
      const top = deferredOrPartial[0];
      reply = `In Order #${top.orderId}, ${top.product_name} received ${top.allocated_quantity ?? 0} of ${top.requested_quantity} requested units (${top.allocation_status}). Under OrderWise deterministic allocation rules, scarce warehouse stock is distributed by approved priority and promised delivery date. Items below minimum acceptable quantity or with lower priority ranking are deferred until inventory replenishment.`;
    } else {
      reply = "All items in your eligible orders have been fully allocated according to current warehouse inventory!";
    }
  } else if (q.includes('delivery') || q.includes('when') || q.includes('date') || q.includes('arrive')) {
    const dates = customerOrders
      .filter((o) => o.promised_delivery_date)
      .map((o) => `Order #${o.id}: scheduled for ${o.promised_delivery_date}`);
    reply = dates.length > 0 ? `Here are your scheduled delivery dates:\n• ${dates.join('\n• ')}` : "Your orders are currently scheduled under standard operational lead times.";
  } else {
    reply = `I am your OrderWise Assistant. You have ${customerOrders.length} order(s) on file. Your latest order #${customerOrders[0].id} is currently ${customerOrders[0].status}. Feel free to ask about fulfillment status, delivery dates, or allocation breakdown.`;
  }

  return {
    reply,
    provider: 'orderwise-heuristic-engine',
    model: 'deterministic-v1',
  };
}

/**
 * Feature B: Customer AI Product Recommendations
 */
async function getCustomerRecommendations(userId) {
  let customerOrders = [];
  let catalog = [];

  try {
    customerOrders = await getCustomerOrders(userId);
    const prodRes = await query(
      `SELECT p.id, p.sku, p.name, p.category, p.unit, p.price,
              COALESCE(i.on_hand_quantity - i.reserved_quantity, 0) as available_stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.active = true
       ORDER BY p.id ASC;`
    );
    catalog = prodRes.rows;
  } catch (_err) {
    catalog = demoStore.products.map((p) => {
      const inv = demoStore.inventory.find((i) => i.product_id === p.id);
      return {
        ...p,
        price: p.price || 250,
        available_stock: inv ? inv.available_quantity : 50,
      };
    });
  }

  // Find purchased categories
  const purchasedSkus = new Set();
  const categoryCounts = {};

  customerOrders.forEach((o) => {
    (o.items || []).forEach((i) => {
      purchasedSkus.add(i.sku);
      const cat = i.category || 'Industrial Automation';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  // Recommend complementary industrial automation components
  const recommendations = catalog
    .filter((p) => !purchasedSkus.has(p.sku) && Number(p.available_stock) > 0)
    .map((p) => {
      let score = 50;
      let reason = 'Essential industrial component for manufacturing automation.';

      if (categoryCounts[p.category]) {
        score += 30;
        reason = `Matches your frequent category: ${p.category}.`;
      } else if (p.category === 'Industrial Automation' || p.category === 'Sensors') {
        score += 20;
        reason = 'High-compatibility companion for existing control assemblies.';
      }

      if (Number(p.available_stock) > 30) {
        score += 10;
      }

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit || 'Piece',
        price: p.price || '0.00',
        available_stock: Number(p.available_stock),
        recommendation_score: score,
        reason,
      };
    })
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, 4);

  return {
    recommendations,
    purchased_count: purchasedSkus.size,
  };
}

/**
 * Feature C: Customer AI Order Insights
 */
async function getCustomerOrderInsights(orderId, userId) {
  let order;
  try {
    const res = await query(
      `SELECT o.id, o.status, o.promised_delivery_date, o.business_notes, o.created_at,
              op.approved_priority, op.priority_rank
       FROM orders o
       LEFT JOIN order_priorities op ON op.order_id = o.id
       WHERE o.id = $1 AND o.customer_id = $2;`,
      [orderId, userId]
    );
    if (res.rowCount === 0) {
      throw new Error('Order not found or unauthorized');
    }
    order = res.rows[0];

    const itemsRes = await query(
      `SELECT oi.id, oi.product_id, p.sku, p.name as product_name, p.unit, p.price,
              oi.requested_quantity, oi.minimum_acceptable_quantity, oi.partial_delivery_allowed,
              ar.allocated_quantity, ar.status as allocation_status, ar.explanation as allocation_explanation
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN LATERAL (
         SELECT allocated_quantity, status, explanation
         FROM allocation_results
         WHERE order_item_id = oi.id
         ORDER BY created_at DESC
         LIMIT 1
       ) ar ON true
       WHERE oi.order_id = $1;`,
      [orderId]
    );
    order.items = itemsRes.rows;
  } catch (err) {
    const found = demoStore.orders.find((o) => String(o.id) === String(orderId) && String(o.customer_id) === String(userId));
    if (!found) throw new Error('Order not found or unauthorized');
    order = found;
  }

  const items = order.items || [];
  const totalRequested = items.reduce((sum, i) => sum + Number(i.requested_quantity || 0), 0);
  const totalAllocated = items.reduce((sum, i) => sum + Number(i.allocated_quantity || 0), 0);
  const fillRate = totalRequested > 0 ? Math.round((totalAllocated / totalRequested) * 100) : 0;

  const insights = items.map((i) => {
    const req = Number(i.requested_quantity || 0);
    const alloc = Number(i.allocated_quantity || 0);
    const isPartial = alloc > 0 && alloc < req;
    const isDeferred = alloc === 0;

    let narrative = '';
    if (alloc === req) {
      narrative = `Fully fulfilled. Sufficient warehouse stock was secured matching your requested ${req} ${i.unit || 'units'}.`;
    } else if (isPartial) {
      narrative = `Partially fulfilled (${alloc}/${req} ${i.unit || 'units'}). Partial shipments are enabled on this item. The remaining ${req - alloc} units are queued for next scheduled replenishment batch.`;
    } else {
      narrative = i.partial_delivery_allowed
        ? `Deferred: Warehouse on-hand inventory was below your minimum acceptable threshold of ${i.minimum_acceptable_quantity} ${i.unit || 'units'}. Under business integrity rules, partial fulfillment is withheld to protect assembly readiness.`
        : `Deferred: Partial delivery is not permitted for this item and current unreserved stock could not fulfill the full ${req} ${i.unit || 'units'}.`;
    }

    return {
      sku: i.sku,
      product_name: i.product_name,
      requested_quantity: req,
      allocated_quantity: alloc,
      status: i.allocation_status || (alloc === req ? 'fulfilled' : isPartial ? 'partially_fulfilled' : 'deferred'),
      fill_rate_percentage: req > 0 ? Math.round((alloc / req) * 100) : 0,
      narrative,
    };
  });

  return {
    order_id: order.id,
    order_status: order.status,
    priority: order.approved_priority || 'Standard',
    promised_delivery_date: order.promised_delivery_date,
    overall_fill_rate: fillRate,
    total_requested: totalRequested,
    total_allocated: totalAllocated,
    item_insights: insights,
    governance_summary:
      fillRate === 100
        ? 'Full allocation confirmed under verified inventory constraints.'
        : 'Allocation governed by OrderWise deterministic prioritization rules. Stock allocated in strict priority order.',
  };
}

/**
 * Feature D: AI Order Creation Assistant (Draft order from natural language)
 */
async function parseOrderPrompt(prompt) {
  let products = [];
  try {
    const res = await query('SELECT id, sku, name, unit, category, price FROM products WHERE active = true;');
    products = res.rows;
  } catch (_err) {
    products = demoStore.products;
  }

  const promptText = (prompt || '').trim();
  const lowerPrompt = promptText.toLowerCase();

  const draftItems = [];

  // Match items based on name or SKU in prompt
  products.forEach((p) => {
    const nameMatch = lowerPrompt.includes(p.name.toLowerCase());
    const skuMatch = lowerPrompt.includes(p.sku.toLowerCase());

    if (nameMatch || skuMatch) {
      // Look for a quantity preceding or following product name
      let qty = 10;
      const regexPatterns = [
        new RegExp(`(\\d+)\\s*(?:pieces?|units?|x)?\\s*(?:of\\s*)?${p.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
        new RegExp(`${p.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:x|quantity|qty|:)?\\s*(\\d+)`, 'i'),
        new RegExp(`(\\d+)\\s*${p.sku.toLowerCase()}`, 'i'),
      ];

      for (const reg of regexPatterns) {
        const m = promptText.match(reg);
        if (m && m[1]) {
          const parsed = parseInt(m[1], 10);
          if (parsed > 0) qty = parsed;
          break;
        }
      }

      draftItems.push({
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit || 'Piece',
        price: p.price || '0.00',
        requested_quantity: qty,
        minimum_acceptable_quantity: Math.max(1, Math.floor(qty * 0.5)),
        partial_delivery_allowed: true,
      });
    }
  });

  // If no items matched by exact phrase, match keywords
  if (draftItems.length === 0) {
    const keywords = [
      { kw: 'plc', sku: 'PLC-001' },
      { kw: 'pressure', sku: 'IPS-002' },
      { kw: 'sensor', sku: 'PRS-005' },
      { kw: 'servo', sku: 'SVM-003' },
      { kw: 'motor', sku: 'SVM-003' },
      { kw: 'drive', sku: 'VFD-004' },
      { kw: 'vfd', sku: 'VFD-004' },
      { kw: 'pump', sku: 'HPA-011' },
      { kw: 'valve', sku: 'PCV-008' },
      { kw: 'power', sku: 'PSU-007' },
      { kw: 'bearing', sku: 'PBB-010' },
      { kw: 'cylinder', sku: 'PNC-012' },
      { kw: 'circuit', sku: 'ICB-013' },
      { kw: 'gearbox', sku: 'GBA-014' },
      { kw: 'fan', sku: 'ICF-015' },
    ];

    keywords.forEach(({ kw, sku }) => {
      if (lowerPrompt.includes(kw)) {
        const p = products.find((prod) => prod.sku === sku);
        if (p && !draftItems.some((d) => d.sku === p.sku)) {
          draftItems.push({
            product_id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            unit: p.unit || 'Piece',
            price: p.price || '0.00',
            requested_quantity: 15,
            minimum_acceptable_quantity: 10,
            partial_delivery_allowed: true,
          });
        }
      }
    });
  }

  // Calculate suggested delivery date (default 10 days out)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 10);
  const formattedDate = deliveryDate.toISOString().split('T')[0];

  return {
    raw_prompt: promptText,
    matched_items_count: draftItems.length,
    draft_items: draftItems,
    suggested_delivery_date: formattedDate,
    suggested_notes: `AI Order Draft parsed from customer request: "${promptText.slice(0, 100)}"`,
  };
}

module.exports = {
  handleOrderAssistantChat,
  getCustomerRecommendations,
  getCustomerOrderInsights,
  parseOrderPrompt,
};

