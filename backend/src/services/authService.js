const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { env } = require('../config/env');
const { AppError } = require('../utils/response');
const { logAuditEvent } = require('../utils/audit');

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory lockout tracker: email -> { attempts, lockedUntil }
const loginAttemptTracker = new Map();

function getLockoutState(email) {
  const record = loginAttemptTracker.get(email.toLowerCase());
  if (!record) return { isLocked: false, attempts: 0 };

  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    return { isLocked: true, remainingSeconds, attempts: record.attempts };
  }

  // If lockout expired, reset attempts
  if (record.lockedUntil && record.lockedUntil <= Date.now()) {
    loginAttemptTracker.delete(email.toLowerCase());
    return { isLocked: false, attempts: 0 };
  }

  return { isLocked: false, attempts: record.attempts };
}

function recordFailedAttempt(email) {
  const normEmail = email.toLowerCase();
  const current = loginAttemptTracker.get(normEmail) || { attempts: 0, lockedUntil: null };
  const newAttempts = current.attempts + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    loginAttemptTracker.set(normEmail, {
      attempts: newAttempts,
      lockedUntil: Date.now() + LOCKOUT_DURATION_MS,
    });
    return { locked: true };
  }

  loginAttemptTracker.set(normEmail, {
    attempts: newAttempts,
    lockedUntil: null,
  });
  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts };
}

function resetLoginAttempts(email) {
  loginAttemptTracker.delete(email.toLowerCase());
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

async function registerCustomer({ name, email, password }, reqMeta = {}) {
  const normEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingRes = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [normEmail]);
  if (existingRes.rowCount > 0) {
    throw new AppError('An account with this email already exists', 'EMAIL_ALREADY_EXISTS', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // CRITICAL RULE: Role is strictly forced to 'customer'
  const insertRes = await query(
    `INSERT INTO users (name, email, password_hash, role, active)
     VALUES ($1, $2, $3, 'customer', true)
     RETURNING id, name, email, role, created_at;`,
    [name.trim(), normEmail, passwordHash]
  );

  const newUser = insertRes.rows[0];
  const token = generateToken(newUser);

  await logAuditEvent({
    actorId: newUser.id,
    action: 'REGISTER_CUSTOMER',
    entityType: 'users',
    entityId: newUser.id,
    afterState: { id: newUser.id, email: newUser.email, role: newUser.role },
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent,
  });

  return {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
    token,
  };
}

async function loginUser({ email, password }, reqMeta = {}) {
  const normEmail = email.trim().toLowerCase();

  // 1. Check lockout status
  const lockoutState = getLockoutState(normEmail);
  if (lockoutState.isLocked) {
    await logAuditEvent({
      action: 'LOGIN_BLOCKED_LOCKOUT',
      entityType: 'auth',
      afterState: { email: normEmail, remainingSeconds: lockoutState.remainingSeconds },
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });
    throw new AppError(
      `Account is temporarily locked due to repeated failed attempts. Please try again in ${lockoutState.remainingSeconds} seconds.`,
      'ACCOUNT_LOCKED',
      429,
      { remainingSeconds: lockoutState.remainingSeconds }
    );
  }

  // 2. Query user by email
  const userRes = await query(
    `SELECT id, name, email, password_hash, role, active FROM users WHERE email = $1 LIMIT 1`,
    [normEmail]
  );

  const genericInvalidMessage = 'Invalid email or password';

  if (userRes.rowCount === 0) {
    // Record failed attempt even if user not found to prevent timing-based user enumeration
    recordFailedAttempt(normEmail);
    await logAuditEvent({
      action: 'LOGIN_FAILED_UNKNOWN_USER',
      entityType: 'auth',
      afterState: { email: normEmail },
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });
    throw new AppError(genericInvalidMessage, 'INVALID_CREDENTIALS', 401);
  }

  const user = userRes.rows[0];

  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const attemptResult = recordFailedAttempt(normEmail);
    await logAuditEvent({
      actorId: user.id,
      action: 'LOGIN_FAILED_BAD_PASSWORD',
      entityType: 'auth',
      entityId: user.id,
      afterState: { email: normEmail, locked: attemptResult.locked },
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });

    if (attemptResult.locked) {
      throw new AppError(
        'Account locked due to 5 consecutive failed login attempts. Please wait 15 minutes before retrying.',
        'ACCOUNT_LOCKED',
        429
      );
    }

    throw new AppError(genericInvalidMessage, 'INVALID_CREDENTIALS', 401);
  }

  // 4. Verify account active
  if (!user.active) {
    throw new AppError('This account has been deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED', 401);
  }

  // 5. Success: reset attempts and generate token
  resetLoginAttempts(normEmail);

  const token = generateToken(user);

  await logAuditEvent({
    actorId: user.id,
    action: 'LOGIN_SUCCESS',
    entityType: 'auth',
    entityId: user.id,
    afterState: { email: user.email, role: user.role },
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

module.exports = {
  registerCustomer,
  loginUser,
  generateToken,
  getLockoutState,
  recordFailedAttempt,
  resetLoginAttempts,
};
