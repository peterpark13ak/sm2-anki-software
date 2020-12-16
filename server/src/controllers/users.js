const Joi = require('joi');
const fetch = require('node-fetch');
const AdminMailer = require('../../mailers/admin_mailer');

const createDefaultDeck = require('../helpers/createDefaultDeck');

const userSchemas = require('./validation/users');

const User = require('../models/user');
const Card = require('../models/card');
const Deck = require('../models/deck');

module.exports.signupUser = async (req, res, next) => {
  try {
    await Joi.validate(req, userSchemas.signupUser, { allowUnknown: true });

    const { name, email, password } = req.body;
    const user = await User.new({ name, email, password });
    const token = await User.generateToken(user);

    await createDefaultDeck(user);
    AdminMailer.sendSignupAlert(user);

    res.set('Authorization', `Bearer ${token}`);
    return res.status(200).json({ user });
  } catch (error) {
    switch (error.message) {
      case 'User already exists':
        return res.status(409).json({ message: error.message });
      case 'Invalid User':
        return res.status(400).json({ message: error.message });
      default:
        return next(error);
    }
  }
};

module.exports.loginUser = async (req, res, next) => {
  try {
    await Joi.validate(req, userSchemas.loginUser, { allowUnknown: true });
    const { email, password } = req.body;
    let wp_membership_plans = [];

    const userOne = await User.findOne({email: email});

    let response = await fetch(process.env.MAINSITE_URL + '/wp-json/jwt-auth/v1/token', {
      method: 'POST',
      body: JSON.stringify({
        username: email == process.env.ADMIN_ID ? process.env.WP_ADMIN_ID : email,
        password: email == process.env.ADMIN_ID ? process.env.WP_ADMIN_PW : password
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    let data = await response.json()
    if (data.token == undefined && email != process.env.ADMIN_ID) {
      res.status(400).json({'error': 'Invalid User'});
    }
    else {
      let wp_token = data.token;
      let user_display_name = data.user_display_name;
      let wp_membership_level = -1;
  
      response = await fetch(process.env.MAINSITE_URL + '/?rest_route=/wp/v2/users', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      let users = await response.json()
      let wp_user_id = -1;
      users && users.map((user) => {
        if (user['name'] === user_display_name) {
          wp_user_id = user['id']
        }
      })

      if (wp_user_id > -1) {
        response = await fetch(process.env.MAINSITE_URL + '/wp-json/rcp/v1/customers/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wp_token}`
          }
        });
        let wp_customers = await response.json()
        let membership_id = -1;
        wp_customers && wp_customers.map((customer) => {
          if (parseInt(customer['user_id']) == wp_user_id) {
            if (customer['memberships'] && customer['memberships'] != undefined && customer['memberships'].length > 0) {
              membership_id = customer['memberships'][0]
            }
          }
        })

        response = await fetch(process.env.MAINSITE_URL + '/wp-json/rcp/v1/memberships/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wp_token}`
          }
        });
        let wp_memberships = await response.json()
        wp_memberships && wp_memberships.map((mem) => {
          if (parseInt(mem['id']) == membership_id) {
            wp_membership_level = parseInt(mem['object_id']);
          }
        })

        response = await fetch(process.env.MAINSITE_URL + '/wp-json/rcp/v1/levels/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wp_token}`
          }
        });
        wp_membership_plans = await response.json()
      }

      if (email != process.env.ADMIN_ID) {
        if (userOne == null) {
          const newUser = await User.new({ name: data.user_display_name, email, password, membership: wp_membership_level });
          await createDefaultDeck(newUser);
          AdminMailer.sendSignupAlert(newUser);
        }
        else {
          await User.updateOne({email: email}, {membership: wp_membership_level});
        }
      }

      const user = await User.authenticateUser(email, password);
      const token = await User.generateToken(user);

      console.log("=======================================")
      console.log(user);

      // When user sign in, to create default decks
      if (email != process.env.ADMIN_ID) {
        var m_admin = await User.findOne({email: process.env.ADMIN_ID});
        var decks = await Deck.find({user: m_admin._id});
        var decks_user = [];
        decks.map(deck => {
          if (deck.membershipLevel.indexOf(wp_membership_level) > -1) {
            decks_user.push(deck);
          }
        });

        var decks_cur_user = await Deck.find({user: user._id});
        await Promise.all(decks_user.map(async (deck) => {
          var flag = 0;
          decks_cur_user.map(cur => {
            if (cur.parentDeck.equals(deck._id)) {
              flag = 1;
            }
          });
          if (flag == 0) {
            const new_deck = await Deck.new(
              {
                title: deck.title,
                description: deck.description,
                notes: deck.notes,
                tags: deck.tags,
                parentDeck: deck._id
              },
              user._id,
            );
            var cards = await Card.find({deck: deck.id});
            // Build default cards
            await Promise.all(cards.map(async ({ front, back }) => {
              const card = await Card.new(
                {
                  front,
                  back,
                  deck: new_deck._id,
                  nextReviewDate: new Date(),
                },
                user._id,
              );
            }));    
          }
        }));
      }
      
      res.set('Authorization', `Bearer ${token}`);
      res.status(200).json({ user, wp_membership_plans });
    }
  } catch (error) {
    console.log(error)
    if (error.message === 'Invalid User' || error.message === 'User does not exist.') {
      res.status(400).json(error);
    } else {
      next(error);
    }
  }
};

module.exports.findUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.user });
    res.send(user);
  } catch (err) {
    next(err);
  }
};

module.exports.updateUser = async (req, res, next) => {
  try {
    await Joi.validate(req, userSchemas.updateUser, { allowUnknown: true });
    const { name, email, prefs } = req.body;

    const user = await User.update({ name, email, prefs }, req.user);
    res.send(user);
  } catch (err) {
    next(err);
  }
};

module.exports.updatePassword = async (req, res, next) => {
  try {
    await Joi.validate(req, userSchemas.updatePassword, { allowUnknown: true });
    const { currentPassword, newPassword } = req.body;

    const user = await User.updatePassword(req.user, currentPassword, newPassword);
    res.send(user);
  } catch (err) {
    next(err);
  }
};

module.exports.deleteUser = async (req, res, next) => {
  try {
    await Deck.remove({ user: req.user });
    await Card.remove({ user: req.user });
    const response = await User.remove({ _id: req.user });

    res.send(response);
  } catch (err) {
    next(err);
  }
};

module.exports.forgotPassword = async (req, res, next) => {
  try {
    await Joi.validate(req, userSchemas.forgotPassword, { allowUnknown: true });
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(422).json({ message: 'User not found' });
    }

    await User.setResetPasswordToken(user._id);

    return res.send({ message: 'Check your email to reset your password' });
  } catch (err) {
    return next(err);
  }
};

module.exports.resetPassword = async (req, res, next) => {
  try {
    await Joi.validate(req, userSchemas.resetPassword, { allowUnknown: true });

    await User.resetPassword({
      id: req.user,
      token: req.headers.authorization,
      newPassword: req.body.newPassword,
      verifyPassword: req.body.verifyPassword,
    });

    res.send({ message: 'Password reset!' });
  } catch (err) {
    next(err);
  }
};

module.exports.findAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    next(err);
  }
};
