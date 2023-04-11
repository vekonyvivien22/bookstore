const express = require('express');
const { default: mongoose, ObjectId } = require('mongoose');
const { addListener } = require('nodemon');

const models = {
  book: mongoose.model('book'),
  category: mongoose.model('category'),
  store: mongoose.model('store'),
};

const templates = {
  book: 'book',
  books: 'books',
};

const router = express.Router();

router.post('/', async (req, res) => {
  const catName = 0;
  const storeName = 0;
  const data = req.body.data;
  //console.log(data);
  const books = await models.book.find({
    $or: [{ title: { $regex: data } }, { 'authors.name': { $regex: data } }],
  });
  const categories = await models.category.find();
  const stores = await models.store.distinct('name');

  return res.render(templates.books, { books, categories, stores, catName, storeName });
});

router.get('/cat/:name', async (req, res) => {
  const catName = req.params.name;
  const storeName = 0;
  const sort = req.query.sort;

  let priceRange = [0, Infinity];
  let sortFilter = { title: 1 };
  if (sort == 21) {
    sortFilter = { title: 1 };
  } else if (sort == 22) {
    sortFilter = { title: -1 };
  } else if (sort == 23) {
    sortFilter = { rating: 1 };
  } else if (sort == 24) {
    sortFilter = { rating: -1 };
  } else if (sort == 11) {
    priceRange = [0, 2500];
  } else if (sort == 12) {
    priceRange = [2500, 5000];
  } else if (sort == 13) {
    priceRange = [5000, Infinity];
  }

  const books = await models.book
    .find({ 'categories.name': catName, price: { $gte: priceRange[0], $lte: priceRange[1] } })
    .sort(sortFilter);

  const categories = await models.category.find();
  const stores = await models.store.distinct('name');

  return res.render(templates.books, { books, categories, stores, catName, storeName });
});

router.get('/store/:name', async (req, res) => {
  const storeName = req.params.name;
  const catName = 0;
  const sort = req.query.sort;

  let priceRange = [0, Infinity];
  let sortFilter = { title: 1 };
  if (sort == 21) {
    sortFilter = { title: 1 };
  } else if (sort == 22) {
    sortFilter = { title: -1 };
  } else if (sort == 23) {
    sortFilter = { rating: 1 };
  } else if (sort == 24) {
    sortFilter = { rating: -1 };
  } else if (sort == 11) {
    sortFilter = { price: 1 };
    priceRange = [0, 2500];
  } else if (sort == 12) {
    sortFilter = { price: 1 };
    priceRange = [2500, 5000];
  } else if (sort == 13) {
    sortFilter = { price: 1 };
    priceRange = [5000, Infinity];
  }

  const storesStock = (await models.store.find({ name: storeName }, { storeStock: 1 })).map(
    (store) => store.storeStock,
  );

  const bookIds = [];
  for (const storeStock of storesStock) {
    bookIds.push(...storeStock.map((s) => new mongoose.Types.ObjectId(s.bookId)));
  }
  //console.log(bookIds);

  const books = await models.book
    .find({ _id: { $in: bookIds }, price: { $gte: priceRange[0], $lte: priceRange[1] } })
    .sort(sortFilter);

  const categories = await models.category.find();
  const stores = await models.store.distinct('name');

  return res.render(templates.books, { books, categories, stores, storeName, catName });
});

router.get('/book/:id', async (req, res) => {
  const id = req.params.id;
  const book = await models.book.findById(id);
  const categories = await models.category.find();
  const stores = await models.store.distinct('name');
  const storeStock = await models.store.find({ 'storeStock.bookId': id }).distinct('name');

  return res.render(templates.book, { book, categories, stores, storeStock });
});

module.exports = router;
