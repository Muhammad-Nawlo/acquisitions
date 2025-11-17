import logger from '#config/logger.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const jwtToken = {
  sign: (payload) => {
    try {
      return jwt.sign(payload, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});
    } catch (e) {
      logger.error('Failed to authenticate with JWT', e);
      throw new Error('Failed to authenticate with JWT');
    }
  },
  verify: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Failed to verify with JWT', e);
      throw new Error('Failed to verify with JWT');
    }
  },
};
