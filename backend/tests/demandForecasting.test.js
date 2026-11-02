const {
  calculateExponentialSmoothing,
  calculateMovingAverage,
  calculateHorizonForecast,
  assessShortageRisk,
  getDemandForecasts,
} = require('../src/services/intelligenceService');

describe('Phase 17: AI Demand Forecasting Acceptance Tests', () => {
  describe('1. 7-Day and 30-Day Forecast Windows & Widening Bounds', () => {
    it('generates 7-day and 30-day forecasts with valid 95% prediction intervals', () => {
      const historicalDemand = [100, 110, 115, 120, 130, 135];
      const result = calculateHorizonForecast(historicalDemand, 0.3);

      expect(result).toHaveProperty('forecast_7d');
      expect(result).toHaveProperty('forecast_30d');
      expect(result.data_quality).toBe('SUFFICIENT');
      expect(result.confidence).toBe('HIGH');

      const f7 = result.forecast_7d;
      const f30 = result.forecast_30d;

      // Point forecasts are positive numbers
      expect(f7.point_forecast).toBeGreaterThan(0);
      expect(f30.point_forecast).toBeGreaterThan(0);

      // 7-day demand is proportionally less than 30-day demand
      expect(f7.point_forecast).toBeLessThan(f30.point_forecast);

      // Prediction intervals enclose point forecast
      expect(f7.lower_bound_95).toBeLessThanOrEqual(f7.point_forecast);
      expect(f7.upper_bound_95).toBeGreaterThanOrEqual(f7.point_forecast);

      expect(f30.lower_bound_95).toBeLessThanOrEqual(f30.point_forecast);
      expect(f30.upper_bound_95).toBeGreaterThanOrEqual(f30.point_forecast);

      // 30-day margin is wider than 7-day margin due to forecast horizon uncertainty
      const margin7 = f7.upper_bound_95 - f7.lower_bound_95;
      const margin30 = f30.upper_bound_95 - f30.lower_bound_95;
      expect(margin30).toBeGreaterThan(margin7);
    });

    it('correctly handles sparse history (< 5 points) with LOW confidence and explicit disclosure', () => {
      const sparseSeries = [50, 60];
      const result = calculateHorizonForecast(sparseSeries, 0.3);

      expect(result.data_quality).toBe('SPARSE_DATA');
      expect(result.confidence).toBe('LOW');
      expect(result.confidence_explanation).toContain('Sparse order history');
      expect(result.forecast_7d.point_forecast).toBeGreaterThan(0);
      expect(result.forecast_30d.point_forecast).toBeGreaterThan(0);
    });

    it('handles brand new products with zero historical demand gracefully without throwing', () => {
      const result = calculateHorizonForecast([], 0.3);

      expect(result.data_quality).toBe('NO_HISTORICAL_DEMAND');
      expect(result.confidence).toBe('LOW');
      expect(result.forecast_7d.point_forecast).toBe(0);
      expect(result.forecast_30d.point_forecast).toBe(0);
      expect(result.confidence_explanation).toContain('Zero historical order demand');
    });

    it('handles single-point series without NaN or crash', () => {
      const singlePoint = [42];
      const result = calculateHorizonForecast(singlePoint, 0.3);

      expect(result.data_quality).toBe('SPARSE_DATA');
      expect(result.confidence).toBe('LOW');
      expect(Number.isFinite(result.forecast_7d.point_forecast)).toBe(true);
      expect(Number.isFinite(result.forecast_30d.point_forecast)).toBe(true);
    });
  });

  describe('2. Shortage Risk Classification & Deficit Detection', () => {
    it('flags SHORTAGE_RISK_HIGH when available stock is below 7-day projected demand', () => {
      const availableStock = 10;
      const forecast7d = 25;
      const forecast30d = 100;

      const risk = assessShortageRisk(availableStock, forecast7d, forecast30d);

      expect(risk.level).toBe('SHORTAGE_RISK_HIGH');
      expect(risk.projected_deficit).toBe(15);
      expect(risk.message).toContain('Critical shortage risk');
    });

    it('flags SHORTAGE_RISK_MEDIUM when available stock covers 7 days but is below 30 days', () => {
      const availableStock = 40;
      const forecast7d = 25;
      const forecast30d = 100;

      const risk = assessShortageRisk(availableStock, forecast7d, forecast30d);

      expect(risk.level).toBe('SHORTAGE_RISK_MEDIUM');
      expect(risk.projected_deficit).toBe(60);
      expect(risk.message).toContain('Moderate shortage risk');
    });

    it('flags STOCK_ADEQUATE when available stock satisfies 30-day projected demand', () => {
      const availableStock = 150;
      const forecast7d = 25;
      const forecast30d = 100;

      const risk = assessShortageRisk(availableStock, forecast7d, forecast30d);

      expect(risk.level).toBe('STOCK_ADEQUATE');
      expect(risk.projected_surplus).toBe(50);
      expect(risk.message).toContain('Stock is adequate');
    });
  });

  describe('3. Multi-Product Demand Forecasting Integration', () => {
    it('returns structured forecasts with meta disclaimer and classifications', async () => {
      const res = await getDemandForecasts({ alpha: 0.3 });

      expect(res).toHaveProperty('forecasts');
      expect(res).toHaveProperty('meta');
      expect(res.meta.classification).toBe('EXPERIMENTAL_ESTIMATE');
      expect(res.forecasts.length).toBeGreaterThan(0);

      const f = res.forecasts[0];
      expect(f).toHaveProperty('forecast_7d');
      expect(f).toHaveProperty('forecast_30d');
      expect(f).toHaveProperty('shortage_risk');
      expect(f.status_label).toBe('EXPERIMENTAL_ESTIMATE');
      expect(f.disclaimer).toContain('algorithmic estimate');
    });

    it('filters forecasts correctly when specific product_id is requested', async () => {
      const res = await getDemandForecasts({ productId: 3 });

      expect(res.forecasts).toHaveLength(1);
      expect(res.forecasts[0].product_id).toBe(3);
    });
  });
});

