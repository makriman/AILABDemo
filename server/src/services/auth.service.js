const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const { sanitizeString } = require('../utils/sanitizers');

const BCRYPT_ROUNDS = 10;
const TOKEN_TTL = '24h';

function buildTokenPayload(user) {
  return {
    userId: user._id,
    username: user.username,
  };
}

function createJwtForUser(user) {
  return jwt.sign(buildTokenPayload(user), process.env.JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

async function signup({ username, password, securityQuestion, securityAnswer }) {
  const normalizedUsername = sanitizeString(username).toLowerCase();
  const cleanSecurityQuestion = sanitizeString(securityQuestion, 300);
  const cleanSecurityAnswer = sanitizeString(securityAnswer, 300);

  const existingUser = await userModel.findByUsername(normalizedUsername);
  if (existingUser) {
    const error = new Error('Username already exists.');
    error.statusCode = 409;
    throw error;
  }

  const now = new Date().toISOString();

  const [passwordHash, securityAnswerHash] = await Promise.all([
    bcrypt.hash(password, BCRYPT_ROUNDS),
    bcrypt.hash(cleanSecurityAnswer, BCRYPT_ROUNDS),
  ]);

  const user = await userModel.createUser({
    username: normalizedUsername,
    passwordHash,
    securityQuestion: cleanSecurityQuestion,
    securityAnswerHash,
    createdAt: now,
    updatedAt: now,
  });

  const token = createJwtForUser(user);

  return {
    userId: user._id,
    username: user.username,
    token,
  };
}

async function login({ username, password }) {
  const normalizedUsername = sanitizeString(username).toLowerCase();
  const user = await userModel.findByUsername(normalizedUsername);

  if (!user) {
    const error = new Error('Incorrect username or password.');
    error.statusCode = 401;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    const error = new Error('Incorrect username or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = createJwtForUser(user);

  return {
    userId: user._id,
    username: user.username,
    token,
  };
}

async function getCurrentUser(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    const error = new Error('Unauthorized.');
    error.statusCode = 401;
    throw error;
  }

  return {
    userId: user._id,
    username: user.username,
  };
}

async function getSecurityQuestion(username) {
  const normalizedUsername = sanitizeString(username).toLowerCase();
  const user = await userModel.findByUsername(normalizedUsername);

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    securityQuestion: user.securityQuestion,
  };
}

async function resetPassword({ username, securityAnswer, newPassword }) {
  const normalizedUsername = sanitizeString(username).toLowerCase();
  const cleanSecurityAnswer = sanitizeString(securityAnswer, 300);

  const user = await userModel.findByUsername(normalizedUsername);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const answerMatches = await bcrypt.compare(cleanSecurityAnswer, user.securityAnswerHash);
  if (!answerMatches) {
    const error = new Error('Incorrect answer.');
    error.statusCode = 401;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userModel.updatePassword(user._id, passwordHash);

  return { message: 'Password updated successfully.' };
}

module.exports = {
  signup,
  login,
  getCurrentUser,
  getSecurityQuestion,
  resetPassword,
  createJwtForUser,
};
