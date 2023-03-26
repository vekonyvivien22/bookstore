const express = require('express');
const { default: mongoose } = require('mongoose');
const { addListener } = require('nodemon');

const models = {
    book: mongoose.model('book'),
    category: mongoose.model('category'),
    store: mongoose.model('store'),
};

const templates = {
    book: 'book',
    books: 'books'
};

const router = express.Router();

router.post('/', async (req, res) => {
    const catName = 0;
    const storeName = 0;
    const data = req.body.data;
    console.log(data);
    const books = await models.book.find({ $or: [{title: {$regex: data}}, {"authors.name": {$regex: data}}]});
    const categories = await models.category.find();
    const stores = await models.store.find();
  
    return res.render(templates.books, { books, categories, stores, catName, storeName });
});

router.get('/cat/:name', async (req, res) => {
    const catName = req.params.name;
    const storeName = 0;
    const sort = req.query.sort;
    let sortFilter = { createdAt: 1};
    if(sort == 1){
        sortFilter = { title: 1};
    } else if(sort == 2){
        sortFilter = { title: -1};
    } else if(sort == 3){
        sortFilter = { rating: 1};
    } else if(sort == 4){
        sortFilter = { rating: -1};
    } 

    const books = await models.book.find({"categories.name": catName}).sort(sortFilter);  

    const categories = await models.category.find();
    const stores = await models.store.find();

    return res.render(templates.books, { books, categories, stores, catName, storeName });
});

router.get('/store/:name', async (req, res) => {
    const storeName = req.params.name;
    const catName = 0;
    const sort = req.query.sort;
    let books = await models.book.find({storeStock: storeName});

    switch(sort){
        case 1:
            books = await models.book.find({storeStock: storeName}).sort({title : 1});
            break;
        case 2:
            books = await models.book.find({storeStock: storeName}).sort({title : -1});
            break;
        case 3:
            books = await models.book.find({storeStock: storeName}).sort({rating : 1});
            break;
        case 4:
            books = await models.book.find({storeStock: storeName}).sort({rating : -1});
            break;
    }
    console.log(books);
    const categories = await models.category.find();
    const stores = await models.store.find();

    return res.render(templates.books, { books, categories, stores, storeName, catName });
});

router.get('/book/:id', async (req, res) => {
    const id = req.params.id;
    const book = await models.book.findById(id);
    const categories = await models.category.find();
    const stores = await models.store.find();
  
    return res.render(templates.book, { book, categories, stores });
});



module.exports = router;