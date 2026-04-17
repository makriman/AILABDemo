const authService = require('../services/auth.service');

function handleError(res, error) {
  const status = error.statusCode || 500;
  return res.status(status).json({
    error: error.message || 'Something went wrong.',
  });
}

async function signup(req, res) {
  try {
    const response = await authService.signup(req.body);
    return res.status(201).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

async function login(req, res) {
  try {
    const response = await authService.login(req.body);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

async function me(req, res) {
  try {
    const response = await authService.getCurrentUser(req.user.userId);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

async function getResetQuestion(req, res) {
  try {
    const response = await authService.getSecurityQuestion(req.body.username);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

async function verifyReset(req, res) {
  try {
    const response = await authService.resetPassword(req.body);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  signup,
  login,
  me,
  getResetQuestion,
  verifyReset,
};
