const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const ejs = require('ejs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');
const { ensureAdmin, ensureAuthenticated } = require('./utils/middlewares');
const moment = require('moment/moment');

const app = express();

const port = process.env.PORT || 3000;
const connectionUri = process.env.MONGODB_CONNECTION_URI;
const secret = process.env.SESSION_SECRET;

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
require('./schemas/user.schema');
require('./schemas/order.schema');

const userModel = mongoose.model('user');

passport.use(
  'local',
  new LocalStrategy({ usernameField: 'username', passwordField: 'password' }, async function (
    username,
    password,
    done,
  ) {
    try {
      const user = await userModel.findOne({ username });
      if (!user) return done(null, false);

      user.comparePasswords(password, function (error, isMatch) {
        if (error) return done(error, false);
        if (!isMatch) return done(null, false);
        return done(null, user);
      });
    } catch (err) {
      console.log(err);
      return done('Error during request.', null);
    }
  }),
);

passport.serializeUser((user, done) => {
  if (!user) return done('No user provid  ed', null);
  return done(null, user);
});

passport.deserializeUser((user, done) => {
  if (!user) return done('No user provided', null);
  return done(null, user);
});

app.use(
  expressSession({
    secret,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: connectionUri }),
    cookie: {
      maxAge: 1 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use(async function (req, res, next) {
  const categories = await models.category.find();
  const stores = await models.store.distinct('name');
  res.locals = {
    req,
    categories,
    stores,
  };
  next();
});

app.use('/admin', ensureAdmin, require('./routes/admin.routes'));
app.use('/browse', require('./routes/browse.routes'));
app.use('/user', require('./routes/user.routes'));

const models = {
  book: mongoose.model('book'),
  category: mongoose.model('category'),
  store: mongoose.model('store'),
  order: mongoose.model('order'),
};

app.get('/', async (_req, res) => {
  const newestBooks = await models.book.find().sort({ publicationDate: -1 }).limit(5);
  const topBooks = await models.book.find().sort({ rating: -1 }).limit(5);

  const ordersOfTheMonth = await models.order.find({
    $expr: {
      $and: [
        { $eq: [{ $month: '$createdAt' }, new Date().getMonth() + 1] },
        { $eq: [{ $year: '$createdAt' }, new Date().getFullYear()] },
      ],
    },
  });

  //console.log(ordersOfTheMonth);

  const ordersOfTheWeek = await models.order.find({
    createdAt: {
      $gte: moment().startOf('isoweek').toDate(),
      $lt: moment().endOf('isoweek').toDate(),
    },
  });

  function getBookIds(param) {
    const map = new Map();
    const bookIds = [];
    for (var order in param) {
      for (const item of param[order].items) {
        //console.log(order + 'order -> ' + item.bookId + ' : ' + item.quantity);
        let prevQuantity = map.get(item.bookId);
        //console.log('Prev quantity -> ' + prevQuantity);
        map.set(item.bookId, prevQuantity ? prevQuantity + item.quantity : item.quantity);
      }
    }

    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    //console.log(sorted);

    for (let i = 0; i < sorted.length; i++) {
      bookIds.push(new mongoose.Types.ObjectId(sorted[i][0]));
    }
    //console.log(bookIds);
    return bookIds;
  }

  const booksOfTheMonth = await models.book
    .find({
      _id: { $in: getBookIds(ordersOfTheMonth) },
    })
    .limit(5);

  //console.log(booksOfTheMonth);

  const booksOfTheWeek = await models.book
    .find({
      _id: { $in: getBookIds(ordersOfTheWeek) },
    })
    .limit(5);

  return res.render('index', { newestBooks, topBooks, booksOfTheMonth, booksOfTheWeek });
});

/*const fs = require('fs');
const { parse } = require('csv-parse');

app.get('/loadBooks', async (req, res) => {
  fs.createReadStream('../books.csv')
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', async function (row) {
      const [
        authors,
        categories,
        description,
        numberOfPages,
        price,
        publicationDate,
        publisherName,
        rating,
        title,
        imagePath,
      ] = row;

      const image = fs.readFileSync(imagePath);
      //console.log(image);
      const newBook = new models.book({
        title,
        description,
        image: {
          data: image,
          contentType: `image/${imagePath.split('.').slice(-1)}`,
        },
        publicationDate: +publicationDate,
        numberOfPages: +numberOfPages,
        price: +price,
        rating: +rating,
        publisherName,
        authors: authors.split(',').map((author) => {
          return { name: author };
        }),
        categories: categories.split(',').map((category) => ({
          name: category,
        })),
      });
      try {
        await newBook.save();
      } catch (err) {
        console.log(err);
      }
    })
    .on('error', function (error) {
      console.log(error.message);
    })
    .on('end', function () {
      console.log('finished');
    });
});*/

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
