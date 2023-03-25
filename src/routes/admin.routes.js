const express = require('express');
const { default: mongoose } = require('mongoose');
const Multer = require('multer');

const models = {
  book: mongoose.model('book'),
};

const templates = {
  book: 'book',
};

const router = express.Router();

router.get('/books', async (_req, res) => {
  // const books = await models.book.find({authors: {$in: ['James', "Pali"]}});
  //
  const books = await models.book.find();

  // return res.send(books);
  return res.render('index', { random: 'hello szia' });
});

router.get('/books/:id', async (req, res) => {
  const id = req.params.id;
  const book = await models.book.findById(id);

  return res.render(templates.book, { book });
});

router.post(
  '/books/create',
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

module.exports = router;
