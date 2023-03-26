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

mongoose.connection.on('error', (error) => {
  console.log('error', error);
});

require('./schemas/book.schema');
require('./schemas/category.schema');
require('./schemas/store.schema');

app.use('/admin', require('./routes/admin.routes'));
app.use('/browse', require('./routes/browse.routes'));
app.use('/user', require('./routes/user.routes'));

const models = {
  book: mongoose.model('book'),
  category: mongoose.model('category'),
  stores: mongoose.model('store'),
};

app.get('/', (req, res) => {
  const categories = models.category.find();
  const stores = models.store.find();
  const newestBooks = models.book.find();
  const topBooks = models.book.find();
  //return res.send('szia');
  return res.render('index', { categories : categories, stores : stores, newestBooks : newestBooks, topBooks : topBooks});
});

app.post( '/categories', async (req, res) => {
    const { name, } = req.body;
    console.log(req.body);
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
  },
);

app.post( '/stores', async (req, res) => {
  const {
    name, 
    location,
  } = req.body;
  const newStore = new models.store({
    name, location
  });

  try {
    const createdStore = await newStore.save();
    return res.send(createdStore);
  } catch (error) {
    console.log(error);
    return res.send('szia nem sikerult boltot letreghozni');
  }
},
);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
