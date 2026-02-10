const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user payload.
 * @param {Object} payload - User data to encode in the token.
 * @param {string} secret - JWT secret key.
 * @param {Object} [options] - Optional jwt.sign options (e.g., expiresIn)
 * @returns {string} JWT token
 */
function generateToken(payload, secret, options = { expiresIn: '1h' }) {
  return jwt.sign(payload, secret, options);
}

module.exports = { generateToken };
