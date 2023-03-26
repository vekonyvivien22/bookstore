const express = require('express');
const { default: mongoose } = require('mongoose');

const models = {
    book: mongoose.model('book'),
};
  
const templates = {
    book: 'book',
};

const router = express.Router();

module.exports = router;