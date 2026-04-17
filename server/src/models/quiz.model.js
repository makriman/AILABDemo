const { quizzesDb, resultsDb } = require('../config/db');

async function createQuiz(quizData) {
  return quizzesDb.insert(quizData);
}

async function findQuizById(quizId) {
  return quizzesDb.findOne({ _id: quizId });
}

async function findQuizzesByUserId(userId) {
  return quizzesDb.find({ userId }).sort({ createdAt: -1 });
}

async function createResult(resultData) {
  return resultsDb.insert(resultData);
}

async function findResultByQuizId(quizId) {
  return resultsDb.findOne({ quizId });
}

async function findResultsByUserId(userId) {
  return resultsDb.find({ userId });
}

module.exports = {
  createQuiz,
  findQuizById,
  findQuizzesByUserId,
  createResult,
  findResultByQuizId,
  findResultsByUserId,
};
