// model/poster.js
const { string } = require('joi');
const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  Posterimage: { type: String, required: true },
  usertype: { 
     type: String,
     enum: ['true', 'false'],
     default: 'true',
      required: true 
    }
}, {
  timestamps: true
});

const Poster = mongoose.model('Poster', posterSchema);

module.exports = Poster;
