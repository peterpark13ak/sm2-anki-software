/* eslint-disable no-console */
process.env.NODE_ENV = 'production';
const config = require('../config');
require('../config/env').config();

const Agenda = require('agenda');
const mongoose = require('mongoose');

async function run() {
  mongoose.Promise = global.Promise;
  const db = await mongoose.connect(
    config.database.uri,
    { useNewUrlParser: true, useUnifiedTopology: true },
  );

  const agenda = new Agenda({ db: {address: config.database.uri, collection: 'jobs'}}); 

  /* Define jobs */
  // eslint-disable-next-line global-require
  require('../src/jobs')(agenda);

  await new Promise(resolve => agenda.once('ready', resolve));

  agenda.every('1 hour', 'reviewDecksEmail');
  agenda.every('24 hour', 'dueCardsEmail');
  agenda.start();
}

run().catch((error) => {
  console.log(error);
  process.exit(-1);
});
