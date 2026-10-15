const fc = require('fast-check');
const {
  allocate,
  computeInputHash,
  priorityToRank,
  rankToPriority,
  deriveOrderStatus,
} = require('../src/services/allocationEngine');

describe('Phase 5 Allocation Engine — Pure Layer & Property-Based Tests', () => {
  describe('Helper Functions & Conversions', () => {
    it('maps priority labels to correct integer ranks', () => {
      expect(priorityToRank('critical')).toBe(4);
      expect(priorityToRank('CRITICAL')).toBe(4);
      expect(priorityToRank('high')).toBe(3);
      expect(priorityToRank('medium')).toBe(2);
      expect(priorityToRank('low')).toBe(1);
      expect(priorityToRank(null)).toBe(2);
      expect(priorityToRank('unknown')).toBe(2);
    });

    it('maps ranks to priority strings', () => {
      expect(rankToPriority(4)).toBe('critical');
      expect(rankToPriority(3)).toBe('high');
      expect(rankToPriority(2)).toBe('medium');
      expect(rankToPriority(1)).toBe('low');
      expect(rankToPriority(99)).toBe('medium');
    });

    it('derives order-level status accurately', () => {
      expect(deriveOrderStatus(['fulfilled', 'fulfilled'])).toBe('allocated');
      expect(deriveOrderStatus(['deferred', 'deferred'])).toBe('pending');
      expect(deriveOrderStatus(['fulfilled', 'deferred'])).toBe('partially_allocated');
      expect(deriveOrderStatus(['fulfilled', 'partially_fulfilled'])).toBe('partially_allocated');
      expect(deriveOrderStatus([])).toBe('pending');
    });
  });

  describe('Pure Function Unit Scenarios (Deterministic Verification)', () => {
    it('Case A: Full fulfillment when stock is sufficient', () => {
      const items = [
        {
          id: 1,
          order_id: 101,
          product_id: 1,
          requested_quantity: 50,
          minimum_acceptable_quantity: 20,
          partial_delivery_allowed: true,
          approved_priority: 'medium',
        },
      ];

      const res = allocate(items, 100);
      expect(res.totalAllocated).toBe(50);
      expect(res.remainingStock).toBe(50);
      expect(res.results).toHaveLength(1);
      expect(res.results[0].allocated_quantity).toBe(50);
      expect(res.results[0].status).toBe('fulfilled');
      expect(res.results[0].explanation.reason).toContain('sufficient to fulfill the complete request');
    });

    it('Case B: Partial fulfillment when partial is allowed and stock meets minimum', () => {
      const items = [
        {
          id: 1,
          order_id: 101,
          product_id: 1,
          requested_quantity: 100,
          minimum_acceptable_quantity: 40,
          partial_delivery_allowed: true,
          approved_priority: 'medium',
        },
      ];

      const res = allocate(items, 60);
      expect(res.totalAllocated).toBe(60);
      expect(res.remainingStock).toBe(0);
      expect(res.results[0].allocated_quantity).toBe(60);
      expect(res.results[0].status).toBe('partially_fulfilled');
      expect(res.results[0].explanation.reason).toContain('met your minimum acceptable quantity of 40');
    });

    it('Case C: Deferred when partial delivery is disallowed', () => {
      const items = [
        {
          id: 1,
          order_id: 101,
          product_id: 1,
          requested_quantity: 100,
          minimum_acceptable_quantity: 40,
          partial_delivery_allowed: false,
          approved_priority: 'medium',
        },
      ];

      const res = allocate(items, 60);
      expect(res.totalAllocated).toBe(0);
      expect(res.remainingStock).toBe(60);
      expect(res.results[0].allocated_quantity).toBe(0);
      expect(res.results[0].status).toBe('deferred');
      expect(res.results[0].explanation.reason).toContain('Partial delivery is not permitted');
    });

    it('Case D: Deferred when remaining stock is below minimum acceptable quantity', () => {
      const items = [
        {
          id: 1,
          order_id: 101,
          product_id: 1,
          requested_quantity: 100,
          minimum_acceptable_quantity: 40,
          partial_delivery_allowed: true,
          approved_priority: 'medium',
        },
      ];

      const res = allocate(items, 20);
      expect(res.totalAllocated).toBe(0);
      expect(res.remainingStock).toBe(20);
      expect(res.results[0].allocated_quantity).toBe(0);
      expect(res.results[0].status).toBe('deferred');
      expect(res.results[0].explanation.reason).toContain('below your minimum acceptable quantity of 40');
    });

    it('Respects priority ordering (Critical > High > Medium > Low)', () => {
      const items = [
        {
          id: 1,
          order_id: 101,
          product_id: 1,
          requested_quantity: 40,
          partial_delivery_allowed: true,
          approved_priority: 'medium', // rank 2
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          order_id: 102,
          product_id: 1,
          requested_quantity: 40,
          partial_delivery_allowed: true,
          approved_priority: 'critical', // rank 4
          created_at: '2025-01-05T00:00:00Z', // created later
        },
      ];

      const res = allocate(items, 50);
      // Item 2 (critical) must be processed first despite being created later
      const item2Result = res.results.find((r) => r.order_item_id === 2);
      const item1Result = res.results.find((r) => r.order_item_id === 1);

      expect(item2Result.status).toBe('fulfilled');
      expect(item2Result.allocated_quantity).toBe(40);

      expect(item1Result.status).toBe('partially_fulfilled');
      expect(item1Result.allocated_quantity).toBe(10);
    });

    it('Tie-breaks equal priority with promised_delivery_date ASC NULLS LAST', () => {
      const items = [
        {
          id: 1,
          order_id: 101,
          product_id: 1,
          requested_quantity: 30,
          approved_priority: 'high',
          promised_delivery_date: '2025-02-15',
        },
        {
          id: 2,
          order_id: 102,
          product_id: 1,
          requested_quantity: 30,
          approved_priority: 'high',
          promised_delivery_date: '2025-01-20', // earlier date
        },
        {
          id: 3,
          order_id: 103,
          product_id: 1,
          requested_quantity: 30,
          approved_priority: 'high',
          promised_delivery_date: null, // no date = last
        },
      ];

      const res = allocate(items, 40);
      expect(res.results[0].order_item_id).toBe(2); // earlier date gets full 30
      expect(res.results[0].allocated_quantity).toBe(30);

      expect(res.results[1].order_item_id).toBe(1); // later date gets remaining 10
      expect(res.results[1].allocated_quantity).toBe(10);

      expect(res.results[2].order_item_id).toBe(3); // null date gets 0
      expect(res.results[2].allocated_quantity).toBe(0);
    });

    it('Tie-breaks equal priority and date by order created_at then order id', () => {
      const items = [
        {
          id: 2,
          order_id: 102,
          product_id: 1,
          requested_quantity: 30,
          approved_priority: 'high',
          promised_delivery_date: '2025-02-01',
          created_at: '2025-01-02T10:00:00Z',
        },
        {
          id: 1,
          order_id: 101,
          product_id: 1,
          requested_quantity: 30,
          approved_priority: 'high',
          promised_delivery_date: '2025-02-01',
          created_at: '2025-01-01T10:00:00Z', // older order
        },
      ];

      const res = allocate(items, 30);
      expect(res.results[0].order_item_id).toBe(1);
      expect(res.results[0].allocated_quantity).toBe(30);
      expect(res.results[1].allocated_quantity).toBe(0);
    });

    it('Explains allocation decisions with concrete numbers', () => {
      const items = [
        {
          id: 1,
          order_id: 101,
          product_id: 1,
          requested_quantity: 25,
          minimum_acceptable_quantity: 10,
          partial_delivery_allowed: true,
          approved_priority: 'critical',
        },
        {
          id: 2,
          order_id: 102,
          product_id: 1,
          requested_quantity: 20,
          minimum_acceptable_quantity: 10,
          partial_delivery_allowed: true,
          approved_priority: 'medium',
        },
      ];

      const res = allocate(items, 40);
      const item2 = res.results.find((r) => r.order_item_id === 2);
      expect(item2.allocated_quantity).toBe(15);
      expect(item2.status).toBe('partially_fulfilled');
      // Must include concrete numbers: allocated 15 of 20, higher-priority consumed 25 of 40, met minimum 10
      expect(item2.explanation.reason).toBe(
        'Allocated 15 of 20. Higher-priority orders consumed 25 of 40 units. Remaining 15 met your minimum acceptable quantity of 10.'
      );
      expect(item2.explanation.stock_consumed_prior).toBe(25);
      expect(item2.explanation.stock_remaining_after).toBe(0);
    });

    it('Pressure Gauge Pro 40-unit scenario produces exact documented outcome', () => {
      const items = [
        {
          id: 1, // Alice
          order_id: 101,
          product_id: 3,
          customer_name: 'Alice Johnson',
          requested_quantity: 25,
          minimum_acceptable_quantity: 15,
          partial_delivery_allowed: true,
          approved_priority: 'high', // rank 3
          promised_delivery_date: '2025-02-15',
          created_at: '2025-01-10T10:00:00Z',
        },
        {
          id: 2, // Bob
          order_id: 102,
          product_id: 3,
          customer_name: 'Bob Smith',
          requested_quantity: 20,
          minimum_acceptable_quantity: 20,
          partial_delivery_allowed: false,
          approved_priority: 'medium', // rank 2
          promised_delivery_date: null,
          created_at: '2025-01-11T10:00:00Z',
        },
        {
          id: 3, // Charlie
          order_id: 103,
          product_id: 3,
          customer_name: 'Charlie Davis',
          requested_quantity: 30,
          minimum_acceptable_quantity: 10,
          partial_delivery_allowed: true,
          approved_priority: 'high', // rank 3
          promised_delivery_date: '2025-01-30', // earlier date
          created_at: '2025-01-12T10:00:00Z',
        },
      ];

      const res = allocate(items, 40);

      expect(res.totalAllocated).toBe(30);
      expect(res.remainingStock).toBe(10);

      const charlie = res.results.find((r) => r.customer_name === 'Charlie Davis');
      const alice = res.results.find((r) => r.customer_name === 'Alice Johnson');
      const bob = res.results.find((r) => r.customer_name === 'Bob Smith');

      // 1. Charlie: High priority, earlier date -> gets 30, fulfilled
      expect(charlie.allocated_quantity).toBe(30);
      expect(charlie.status).toBe('fulfilled');

      // 2. Alice: High priority, later date -> remaining 10 is below min acceptable 15 -> deferred
      expect(alice.allocated_quantity).toBe(0);
      expect(alice.status).toBe('deferred');
      expect(alice.explanation.reason).toContain('below your minimum acceptable quantity of 15');

      // 3. Bob: Medium priority, no partial -> remaining 10 < 20 -> deferred
      expect(bob.allocated_quantity).toBe(0);
      expect(bob.status).toBe('deferred');
      expect(bob.explanation.reason).toContain('Partial delivery is not permitted');
    });

    it('Run checksum is strictly deterministic for identical inputs', () => {
      const items = [
        { id: 1, order_id: 10, product_id: 1, requested_quantity: 20, approved_priority: 'high' },
        { id: 2, order_id: 11, product_id: 1, requested_quantity: 15, approved_priority: 'medium' },
      ];

      const hash1 = computeInputHash(items, 50);
      const hash2 = computeInputHash(items, 50);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);

      // Shuffling item array produces same hash because canonical form sorts by id
      const hashShuffled = computeInputHash([items[1], items[0]], 50);
      expect(hashShuffled).toBe(hash1);

      // Changing stock or requested qty alters the hash
      const hashDiffStock = computeInputHash(items, 60);
      expect(hashDiffStock).not.toBe(hash1);
    });
  });

  describe('Property-Based Tests (Invariants via fast-check)', () => {
    // Arbitrary generator for candidate order items
    const orderItemArbitrary = fc.record({
      id: fc.integer({ min: 1, max: 1000 }),
      order_id: fc.integer({ min: 1, max: 500 }),
      product_id: fc.constant(1),
      requested_quantity: fc.integer({ min: 1, max: 200 }),
      minimum_acceptable_quantity: fc.integer({ min: 0, max: 100 }),
      partial_delivery_allowed: fc.boolean(),
      priority_rank: fc.integer({ min: 1, max: 4 }),
      promised_delivery_date: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') }), {
        nil: null,
      }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
    }).map((item) => {
      // Ensure min acceptable quantity does not exceed requested quantity
      if (item.minimum_acceptable_quantity > item.requested_quantity) {
        item.minimum_acceptable_quantity = item.requested_quantity;
      }
      return item;
    });

    it('Invariant 1: Total allocated never exceeds available stock (no over-allocation)', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 30 }),
          fc.integer({ min: 0, max: 1000 }),
          (items, stock) => {
            const res = allocate(items, stock);
            const sumAllocated = res.results.reduce((acc, r) => acc + r.allocated_quantity, 0);

            expect(sumAllocated).toBeLessThanOrEqual(stock);
            expect(res.totalAllocated).toBe(sumAllocated);
            expect(res.remainingStock).toBe(stock - sumAllocated);
            expect(res.remainingStock).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('Invariant 2: Item allocated quantity is non-negative and never exceeds requested quantity', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 30 }),
          fc.integer({ min: 0, max: 1000 }),
          (items, stock) => {
            const res = allocate(items, stock);
            for (const r of res.results) {
              expect(r.allocated_quantity).toBeGreaterThanOrEqual(0);
              expect(r.allocated_quantity).toBeLessThanOrEqual(r.requested_quantity);
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    it('Invariant 3: Partial delivery constraints (0 or >= min acceptable, and partial allowed)', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 30 }),
          fc.integer({ min: 0, max: 1000 }),
          (items, stock) => {
            const res = allocate(items, stock);
            for (const r of res.results) {
              if (r.allocated_quantity > 0 && r.allocated_quantity < r.requested_quantity) {
                expect(r.status).toBe('partially_fulfilled');
                expect(r.explanation.partial_delivery_allowed).toBe(true);
                expect(r.allocated_quantity).toBeGreaterThanOrEqual(r.explanation.minimum_acceptable_quantity);
              }

              if (r.explanation.partial_delivery_allowed === false) {
                // Must be either fully fulfilled or 0
                expect([0, r.requested_quantity]).toContain(r.allocated_quantity);
              }
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    it('Invariant 4: Determinism (identical inputs produce identical results and hash)', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 500 }),
          (items, stock) => {
            const res1 = allocate(items, stock);
            const res2 = allocate(items, stock);

            expect(res1.totalAllocated).toBe(res2.totalAllocated);
            expect(res1.remainingStock).toBe(res2.remainingStock);
            expect(res1.results.map((r) => r.allocated_quantity)).toEqual(
              res2.results.map((r) => r.allocated_quantity)
            );
            expect(res1.results.map((r) => r.status)).toEqual(
              res2.results.map((r) => r.status)
            );

            const hash1 = computeInputHash(items, stock);
            const hash2 = computeInputHash(items, stock);
            expect(hash1).toBe(hash2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Invariant 5: Priority order respected (higher-priority items processed before lower)', () => {
      fc.assert(
        fc.property(
          fc.array(orderItemArbitrary, { minLength: 2, maxLength: 25 }),
          fc.integer({ min: 0, max: 500 }),
          (items, stock) => {
            const res = allocate(items, stock);

            // Verify that if a lower-priority order received stock,
            // all higher-priority orders must have been fulfilled or could not take stock (e.g. partial disallowed / below min)
            for (let i = 0; i < res.results.length; i++) {
              for (let j = i + 1; j < res.results.length; j++) {
                const itemI = res.results[i];
                const itemJ = res.results[j];

                if (itemI.explanation.priority_rank > itemJ.explanation.priority_rank) {
                  // Item I was processed strictly before Item J
                  // Item I had first access to the stock pool
                  expect(itemI.explanation.stock_consumed_prior).toBeLessThanOrEqual(
                    itemJ.explanation.stock_consumed_prior
                  );
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
