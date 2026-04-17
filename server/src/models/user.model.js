const { usersDb } = require('../config/db');

async function createUser(userData) {
  return usersDb.insert(userData);
}

async function findByUsername(usernameLowercase) {
  return usersDb.findOne({ username: usernameLowercase });
}

async function findById(userId) {
  return usersDb.findOne({ _id: userId });
}

async function updatePassword(userId, passwordHash) {
  const updatedAt = new Date().toISOString();
  await usersDb.update(
    { _id: userId },
    {
      $set: {
        passwordHash,
        updatedAt,
      },
    }
  );

  return findById(userId);
}

module.exports = {
  createUser,
  findByUsername,
  findById,
  updatePassword,
};
