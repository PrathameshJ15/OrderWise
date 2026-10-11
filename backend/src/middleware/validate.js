const { ZodError } = require('zod');
const { errorResponse } = require('../utils/response');

/**
 * Zod validation middleware factory.
 * @param {Object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
function validateRequest(schemas) {
  return function (req, res, next) {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return errorResponse(res, 'Validation error', 'VALIDATION_ERROR', details, 400);
      }
      next(err);
    }
  };
}

module.exports = { validateRequest };
