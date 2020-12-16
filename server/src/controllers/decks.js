const Joi = require('joi');

const Deck = require('../models/deck');
const Card = require('../models/card');
const getCardAverage = require('../helpers/getCardAverage');
const deckSchemas = require('./validation/decks');

module.exports.find = async (req, res, next) => {
  try {
    await Joi.validate(req, deckSchemas.find, { allowUnknown: true });
    console.log(req.user)
    let decks = await Deck.find({ user: req.user }).populate('tags');

    decks = await Promise.all(decks.map(async (deck) => {
      const cards = await Card.find({ user: req.user, deck });

      // eslint-disable-next-line no-param-reassign
      deck.recallRate = getCardAverage(cards);
      // eslint-disable-next-line no-param-reassign
      deck.cardsCount = cards.length;

      return deck;
    }));

    res.send(decks);
  } catch (err) {
    next(err);
  }
};

module.exports.create = async (req, res, next) => {
  try {
    await Joi.validate(req, deckSchemas.create, { allowUnknown: true });

    const { title, description, notes, tags } = req.body;
    const deck = await Deck.new({ title, description, notes, tags, parentDeck: 0 }, req.user);

    res.send(deck);
  } catch (err) {
    next(err);
  }
};

module.exports.findDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Joi.validate(req, deckSchemas.findDeck, { allowUnknown: true });

    const deck = await Deck.findOne({ _id: id }).populate('tags');

    if (!deck) {
      return res.status(403).json({ message: 'Cannot access deck' });
    }

    const cards = await Card.find({ user: req.user, deck });

    // eslint-disable-next-line no-param-reassign
    deck.recallRate = getCardAverage(cards);
    // eslint-disable-next-line no-param-reassign
    deck.cardsCount = cards.length;

    return res.send(deck);
  } catch (err) {
    return next(err);
  }
};

module.exports.updateDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Joi.validate(req, deckSchemas.updateDeck, { allowUnknown: true });

    const { title, description, notes, tags, membershipLevel } = req.body;
    console.log(membershipLevel)
    const deck = await Deck.updateDeck(id, { title, description, notes, tags, membershipLevel }, req.user);

    res.send(deck);
  } catch (err) {
    next(err);
  }
};

module.exports.deleteDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Joi.validate(req, deckSchemas.deleteDeck, { allowUnknown: true });

    await Deck.deleteOne({ _id: id});
    const response = await Card.bulkWrite([
      {
        deleteMany: { filter: { deck: id } },
      },
    ]);

    res.send(response);
  } catch (err) {
    next(err);
  }
};

module.exports.resetDeck = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Joi.validate(req, deckSchemas.resetDeck, { allowUnknown: true });

    await Card.resetAllByDeck(id, req.user);
    const cards = await Card.find({ deck: id });

    res.send(cards);
  } catch (err) {
    next(err);
  }
};

module.exports.findDecksByTag = async (req, res, next) => {
  try {
    const { tag } = req.query;
    await Joi.validate(req, deckSchemas.findDecksByTag, { allowUnknown: true });

    const decks = await Deck.find({ user: req.user }).populate('tags');

    if (!decks || decks.length == 0) {
      return res.status(403).json({ message: 'Cannot access deck' });
    }

    var result = decks[0]

    result.title = tag
    result.notes = ""
    result.description = ""
    result.tag = [tag]
    result.hidden = false
    result.recallRate = 0
    result.cardsCount = 0

    var cnt = 0
    await Promise.all(decks.map(async (deck) => {
      var flag = 0
      deck.tags.map((cur) => {
        if (cur.value == tag)
          flag = 1
      })
      if (flag == 1) {
        const cards = await Card.find({ user: req.user, deck });

        // eslint-disable-next-line no-param-reassign
        result.notes = result.notes + deck.notes;
        result.recallRate += getCardAverage(cards);
        // eslint-disable-next-line no-param-reassign
        result.cardsCount += cards.length;
        cnt ++
  
        return deck;  
      }
      else return null
    }));

    result.recallRate /= cnt

    return res.send(result);
  } catch (err) {
    return next(err);
  }
};

module.exports.findAllDecks = async (req, res, next) => {
  try {
    await Joi.validate(req, deckSchemas.find, { allowUnknown: true });
    let decks = await Deck.find({}).populate('tags');

    decks = await Promise.all(decks.map(async (deck) => {
      const cards = await Card.find({ deck });

      // eslint-disable-next-line no-param-reassign
      deck.recallRate = getCardAverage(cards);
      // eslint-disable-next-line no-param-reassign
      deck.cardsCount = cards.length;

      return deck;
    }));

    res.send(decks);
  } catch (err) {
    next(err);
  }
};
