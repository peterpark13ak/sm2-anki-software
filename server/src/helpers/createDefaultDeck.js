const User = require('../models/user');
const Card = require('../models/card');
const Deck = require('../models/deck');
const Tag = require('../models/tag');

module.exports = async (user) => {
  var m_admin = await User.findOne({email: process.env.ADMIN_ID});
  var tags = await Tag.find({user: m_admin.id});
  var decks = await Deck.find({user: m_admin.id});

  const new_tags = await Promise.all(tags.map(async ({ value }) => {
    let tag = await Tag.findOne({ value, user });
    if (!tag) {
      tag = await Tag.create({ value, user });
    }
    return tag;
  }));

  const new_decks = await Promise.all(decks.map(async (data) => {
    // Build default tags

      // Build default deck
    const deck = await Deck.new(
      {
        title: data.title,
        description: data.description,
        notes: data.notes,
        tags: data.tags,
        parentDeck: data._id
      },
      user,
    );

    var cards = await Card.find({deck: data.id});

      // Build default cards
    const new_cards = await Promise.all(cards.map(async ({ front, back }) => {
      const card = await Card.new(
        {
          front,
          back,
          deck: deck._id,
          nextReviewDate: new Date(),
        },
        user,
      );
      return card;
    }));

    return { deck, new_cards };
  }));
};
