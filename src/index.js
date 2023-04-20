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
const { ensureAdmin } = require('./utils/middlewares');

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
      maxAge: 5 * 24 * 60 * 60 * 1000,
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
};

app.get('/', async (req, res) => {
  const newestBooks = await models.book.find().sort({ publicationDate: -1 });
  const topBooks = await models.book.find().sort({ rating: -1 }).limit(3);

  return res.render('index', { newestBooks, topBooks });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
