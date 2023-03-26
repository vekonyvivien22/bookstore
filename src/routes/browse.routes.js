const express = require('express');
const { default: mongoose } = require('mongoose');

const models = {
    book: mongoose.model('book'),
    category: mongoose.model('category'),
    stores: mongoose.model('store'),
};

const templates = {
    book: 'book'
};

const router = express.Router();

router.get('/booksByCat:name', async (_req, res) => {
    const catName = req.params.name;
    //a category kilistázva a másik táblából, ugyanaz e az id-ja mint amit a book táblába tettünk bele?
    const books = await models.book.find({categories: catName});
    return res.render(templates.book, { books });
});

router.get('/booksByStore:name', async (_req, res) => {
    const storeName = req.params.name;
    //a category kilistázva a másik táblából, ugyanaz e az id-ja mint amit a book táblába tettünk bele?
    const books = await models.book.find({storeStock: storeName});
    return res.render(templates.book, { books });
});

router.get('/books/:id', async (req, res) => {
    const id = req.params.id;
    const book = await models.book.findById(id);
  
    return res.render(templates.book, { book });
});

module.exports = router;