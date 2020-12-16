const mongoose = require('mongoose');

const removeEmpty = require('../helpers/removeEmpty');

const createDefaultNotes = deck => `## ${deck.title}\n\n${deck.description}`;

const DeckSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    notes: { type: String },
    description: { type: String },
    cardsCount: { type: Number },
    recallRate: { type: Number },
    hidden: { type: Boolean, default: false },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    parentDeck: {type: mongoose.Schema.Types.ObjectId, ref: 'Deck'},
    membershipLevel: [{type: mongoose.Schema.Types.Number}]
  },
  {
    timestamps: true,
  },
);

class DeckClass {
  static new(body, user) {
    return this.create({
      user,
      title: body.title,
      description: body.description,
      tags: body.tags,
      notes: body.notes || createDefaultNotes(body),
      parentDeck: body.parentDeck,
    });
  }

  static updateDeck(id, body, user) {
    return this.findOneAndUpdate(
      { _id: id },
      removeEmpty({
        title: body.title,
        description: body.description,
        tags: body.tags,
        notes: body.notes,
        membershipLevel: body.membershipLevel
      }),
      { new: true },
    ).populate('tags');
  }
}

DeckSchema.loadClass(DeckClass);

module.exports = mongoose.model('Deck', DeckSchema);
