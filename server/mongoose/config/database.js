/* eslint-disable no-console */
const chalk = require('chalk');
const mongoose = require('mongoose');
const config = require('../../config');

const User = require('../../src/models/user');
const createDefaultDeck = require('../../src/helpers/createDefaultDeck');

module.exports.connect = () => {
  mongoose.Promise = global.Promise;
  mongoose.connect(config.database.uri, { family: 4 });

  const mongoDB = mongoose.connection;

  return new Promise((success, failure) => {
    mongoDB.on('error', (err) => {
      console.log(chalk.red('🔺  Connection to database failed', err.message));
      failure();
    });
    mongoDB.once('open', async () => {
      console.log(chalk.cyan('✨  Connection to database established'));
      var admin = await User.findOne({email: process.env.ADMIN_ID})
      if (admin == null) {
        const user = await User.new({
          name: "Admin",
          email: process.env.ADMIN_ID,
          password: process.env.ADMIN_PW
        })
        await createDefaultDeck(user);
      }
      success();
    });
  });
};
