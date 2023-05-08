const express = require('express');
const { default: mongoose } = require('mongoose');
const Multer = require('multer');
const { ensureAdmin } = require('../utils/middlewares');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const models = {
  book: mongoose.model('book'),
  category: mongoose.model('category'),
  store: mongoose.model('store'),
  user: mongoose.model('user'),
};

const templates = {
  book: 'book',
  admin: 'admin',
  createBook: 'createBook',
  manageBooks: 'manageBooks',
  manageUsers: 'manageUsers',
};

const router = express.Router();

//  CSRFPROTECTION

router.get('/', ensureAdmin, csrfProtection, async (req, res) => {
  const books = await models.book.find();
  const users = await models.user.find();
  const regUsers = await models.user.find({ 'regularUser.isRegular': true });
  return res.render(templates.admin, { books, users, regUsers, csrfToken: req.csrfToken() });
});

router.get('/createBook', ensureAdmin, csrfProtection, async (req, res) => {
  return res.render(templates.createBook, { error: null });
});

router.get('/manageBooks', ensureAdmin, csrfProtection, async (_req, res) => {
  const books = await models.book.find();
  const users = await models.user.find();
  return res.render(templates.manageBooks, { books, users });
});

router.get('/manageUsers', ensureAdmin, csrfProtection, async (_req, res) => {
  const books = await models.book.find();
  const users = await models.user.find();
  return res.render(templates.manageUsers, { books, users });
});

//CREATE BOOK
router.post(
  '/createBook',
  ensureAdmin,
  Multer({ storage: Multer.memoryStorage() }).single('image'),
  async (req, res) => {
    const {
      title,
      description,
      publicationDate,
      numberOfPages,
      price,
      rating = 0,
      publisherName,
      authors,
      categories,
    } = req.body;
    //console.log(req.body);
    //console.log(req.file.originalname);
    let error;
    let newBook;

    if (!req.file) {
      newBook = new models.book({
        title,
        description,
        publicationDate,
        numberOfPages,
        price,
        rating,
        publisherName,
        authors: authors.split(',').map((author) => {
          return { name: author };
        }),
        categories: categories.split(',').map((category) => ({
          name: category,
        })),
      });
    } else {
      newBook = new models.book({
        title,
        description,
        image: {
          data: req.file.buffer,
          contentType: `image/${req.file.originalname.split('.').slice(-1)}`,
        },
        publicationDate,
        numberOfPages,
        price,
        rating,
        publisherName,
        authors: authors.split(',').map((author) => {
          return { name: author };
        }),
        categories: categories.split(',').map((category) => ({
          name: category,
        })),
      });
    }

    try {
      await newBook.save();
      return res.redirect('/admin/createBook');
    } catch (err) {
      //console.log(err);
      error = 'Error: cannot add book to database.';
      return res.render(templates.createBook, { error });
    }
  },
);

//CREATE CATEGORY
router.post('/createCategory', ensureAdmin, csrfProtection, async (req, res) => {
  const { name } = req.body;
  const newCat = new models.category({
    name,
  });

  try {
    const createdCat = await newCat.save();
    return res.send(createdCat);
  } catch (error) {
    console.log(error);
    return res.send('szia nem sikerult kategoriat letreghozni');
  }
});

// CREATE STORE
router.post('/createStore', ensureAdmin, csrfProtection, async (req, res) => {
  const { name, location, storeStock } = req.body;
  const asd = storeStock.split(';').map((book) => {
    const [bookId, quantity] = book.split(',');
    return { bookId, quantity };
  });
  console.log(asd);
  const newStore = new models.store({
    name,
    location,
    storeStock: asd,
  });

  try {
    const createdStore = await newStore.save();
    return res.send(createdStore);
  } catch (error) {
    console.log(error);
    return res.send('szia nem sikerult boltot letreghozni');
  }
});

router.get('/delUser/:id', ensureAdmin, csrfProtection, async (req, res) => {
  const id = req.params.id;

  await models.user.deleteOne({ _id: id });

  return res.redirect('/admin/manageUsers');
});

router.get('/delBook/:id', ensureAdmin, csrfProtection, async (req, res) => {
  const id = req.params.id;

  await models.book.deleteOne({ _id: id });

  await models.store.updateMany({ $pull: { storeStock: { bookId: id } } });

  return res.redirect('/admin/manageBooks');
});

router.post('/modUser', ensureAdmin, csrfProtection, async (req, res) => {
  const { username, discount } = req.body;

  username.forEach(async function (value, i) {
    const user = await models.user.findOne({
      username: value,
      'regularUser.discount': discount[i],
    });

    if (!user) {
      try {
        await models.user.updateOne(
          { username: value },
          { $set: { 'regularUser.discount': discount[i] } },
        );
      } catch (error) {
        console.log(error);
      }
    }
  });
  return res.redirect('/admin');
});

module.exports = router;
