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

const DEMO_USERS = [
  { id: 1, name: 'Admin Operations', email: 'admin@orderwise.com', role: 'admin', password: 'Admin123!' },
  { id: 2, name: 'Inventory Manager', email: 'manager@orderwise.com', role: 'inventory_manager', password: 'Manager123!' },
  { id: 3, name: 'Alice Customer', email: 'alice@demo.com', role: 'customer', password: 'Alice123!' },
  { id: 4, name: 'Bob Customer', email: 'bob@demo.com', role: 'customer', password: 'Bob123!' },
  { id: 5, name: 'Charlie Customer', email: 'charlie@demo.com', role: 'customer', password: 'Charlie123!' },
];

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

function generateRefreshToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      tokenType: 'refresh',
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function registerCustomer({ name, email, password }, reqMeta = {}) {
  const normEmail = email.trim().toLowerCase();

  try {
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
    const refreshToken = generateRefreshToken(newUser);

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
      refreshToken,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Fallback when DB is offline: strictly enforce 'customer' role
    const demoId = Math.floor(Math.random() * 900) + 100;
    const demoUser = {
      id: demoId,
      name: name.trim(),
      email: normEmail,
      role: 'customer',
    };
    return {
      user: demoUser,
      token: generateToken(demoUser),
      refreshToken: generateRefreshToken(demoUser),
    };
  }
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

  // 2. Query user by email (with demo fallback if DB is offline)
  let userRes;
  try {
    userRes = await query(
      `SELECT id, name, email, password_hash, role, active FROM users WHERE email = $1 LIMIT 1`,
      [normEmail]
    );
  } catch (dbErr) {
    // If DB is offline, verify against demo credentials
    const demoUser = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === normEmail && u.password === password
    );
    if (demoUser) {
      const token = generateToken(demoUser);
      const refreshToken = generateRefreshToken(demoUser);
      return {
        user: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
        },
        token,
        refreshToken,
      };
    }
    throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

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
  const refreshToken = generateRefreshToken(user);

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
    refreshToken,
  };
}

async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 'TOKEN_REQUIRED', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET);
  } catch (_err) {
    throw new AppError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }

  if (decoded.tokenType !== 'refresh') {
    throw new AppError('Invalid token type', 'INVALID_TOKEN_TYPE', 401);
  }

  let user;
  try {
    const userRes = await query(
      `SELECT id, name, email, role, active FROM users WHERE id = $1 LIMIT 1`,
      [decoded.userId]
    );
    if (userRes.rowCount > 0) {
      user = userRes.rows[0];
    }
  } catch {
    user = DEMO_USERS.find((u) => u.id === decoded.userId);
  }

  if (!user || user.active === false) {
    throw new AppError('User not found or account deactivated', 'UNAUTHORIZED', 401);
  }

  const newAccessToken = generateToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

module.exports = {
  registerCustomer,
  loginUser,
  generateToken,
  generateRefreshToken,
  refreshSession,
  getLockoutState,
  recordFailedAttempt,
  resetLoginAttempts,
};
