const express = require('express');
const { default: mongoose } = require('mongoose');
const Multer = require('multer');

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

//  CSRFPROTECTION , ENSUREADMIN!

router.get('/', async (_req, res) => {
  const books = await models.book.find();
  const users = await models.user.find();
  return res.render(templates.admin, { books, users });
});

router.get('/createBook', async (_req, res) => {
  return res.render(templates.createBook, {});
});

router.get('/manageBooks', async (_req, res) => {
  const books = await models.book.find();
  const users = await models.user.find();
  return res.render(templates.manageBooks, { books, users });
});

router.get('/manageUsers', async (_req, res) => {
  const books = await models.book.find();
  const users = await models.user.find();
  return res.render(templates.manageUsers, { books, users });
});

//CREATE BOOK
router.post(
  '/createBook',
  Multer({ storage: Multer.memoryStorage() }).single('image'),
  async (req, res) => {
    const {
      title,
      description,
      publicationDate,
      numberOfPages,
      price,
      rating,
      publisherName,
      authors,
      categories,
    } = req.body;
    console.log(req.body);
    console.log(req.file.originalname);
    const newBook = new models.book({
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

    try {
      const createdBook = await newBook.save();
      return res.send(createdBook);
    } catch (error) {
      console.log(error);
      return res.send('szia nem sikerult');
    }
  },
);

//CREATE CATEGORY
router.post('/createCategory', async (req, res) => {
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
router.post('/createStore', async (req, res) => {
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

router.get('/delUser/:id', async (req, res) => {
  const id = req.params.id;

  await models.user.deleteOne({ _id: id });

  return res.redirect('/admin/manageUsers');
});

router.get('/delBook/:id', async (req, res) => {
  const id = req.params.id;

  await models.book.deleteOne({ _id: id });

  await models.store.update({ $pull: { storeStock: { bookId: id } } });

  return res.redirect('/admin/manageBooks');
});

module.exports = router;
