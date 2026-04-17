const fs = require('fs');
const path = require('path');
const Datastore = require('nedb-promises');

const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const usersDb = Datastore.create({
  filename: path.join(dataDir, 'users.db'),
  autoload: true,
});

const quizzesDb = Datastore.create({
  filename: path.join(dataDir, 'quizzes.db'),
  autoload: true,
});

const resultsDb = Datastore.create({
  filename: path.join(dataDir, 'results.db'),
  autoload: true,
});

let indexesReady = false;

async function initDb() {
  if (indexesReady) {
    return;
  }

  await usersDb.ensureIndex({ fieldName: 'username', unique: true });
  await quizzesDb.ensureIndex({ fieldName: 'userId' });
  await resultsDb.ensureIndex({ fieldName: 'userId' });
  await resultsDb.ensureIndex({ fieldName: 'quizId', unique: true });

  indexesReady = true;
}

module.exports = {
  usersDb,
  quizzesDb,
  resultsDb,
  initDb,
};
