const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const ejs = require('ejs');

const app = express();

const port = process.env.PORT || 3000;
const connectionUri = process.env.MONGODB_CONNECTION_URI;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(connectionUri);

mongoose.connection.on('connected', () => {
  console.log('succesfull db connect');
});

/*mongoose.connection.on('error', (error) => {
  console.log('error', error);
});*/

require('./schemas/book.schema');
require('./schemas/category.schema');
require('./schemas/store.schema');

app.use('/admin', require('./routes/admin.routes'));
app.use('/browse', require('./routes/browse.routes'));
app.use('/user', require('./routes/user.routes'));

const models = {
  book: mongoose.model('book'),
  category: mongoose.model('category'),
  store: mongoose.model('store'),
};

app.get('/', async (req, res) => {
  const categories = await models.category.find();
  const stores = await models.store.distinct("name");
  const newestBooks = await models.book.find().sort({publicationDate : -1});
  const topBooks = await models.book.find().sort({rating : -1}).limit(3);
  
  return res.render('index', { categories, stores, newestBooks, topBooks});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
