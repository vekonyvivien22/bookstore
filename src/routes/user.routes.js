const express = require('express');
const { default: mongoose } = require('mongoose');
const Multer = require('multer');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const passport = require('passport');
const { ensureAuthenticated, ensureNotAuthenticated } = require('../utils/middlewares');

const models = {
  category: mongoose.model('category'),
  store: mongoose.model('store'),
  user: mongoose.model('user'),
  book: mongoose.model('book'),
};

const templates = {
  login: 'login',
  reg: 'reg',
  cart: 'cart',
};

const router = express.Router();

router.get('/login', ensureNotAuthenticated, csrfProtection, async (req, res) => {
  return res.render(templates.login, {
    csrfToken: req.csrfToken(),
    error: null,
  });
});

router.post('/login', ensureNotAuthenticated, csrfProtection, async (req, res, next) => {
  const { username, password } = req.body;

  let error;

  if (username && password) {
    passport.authenticate('local', (err, user) => {
      if (err) {
        console.log(err);
        error = 'Internal server error';
        return res.render(templates.login, {
          csrfToken: req.csrfToken(),
          error,
        });
      }

      req.logIn(user, async (err) => {
        if (err) {
          error = 'Invalid credentials';
          return res.render(templates.login, {
            csrfToken: req.csrfToken(),
            error,
          });
        }
        const newestBooks = await models.book.find().sort({ publicationDate: -1 });
        const topBooks = await models.book.find().sort({ rating: -1 }).limit(3);
        //console.log(topBooks);
        return res.render('./', { newestBooks, topBooks });
      });
    })(req, res, next);
  } else {
    error = 'Username or password not provided.';
    return res.render(templates.login, {
      csrfToken: req.csrfToken(),
      error,
    });
  }
});

router.get('/reg', ensureNotAuthenticated, csrfProtection, async (req, res) => {
  return res.render(templates.reg, { csrfToken: req.csrfToken(), error: null });
});

router.post('/reg', csrfProtection, async (req, res) => {
  const { passwordConfirmation, firstName, lastName, ...body } = req.body;

  let error;
  if (body.password === passwordConfirmation) {
    const newUser = new models.user({
      ...body,
      name: {
        firstName,
        lastName,
      },
    });

    try {
      await newUser.save();
    } catch (err) {
      error = err.message;
      return res.render(templates.reg, { csrfToken: req.csrfToken(), error });
    }
  } else {
    error = 'The two given passwords do not match.';
    return res.render(templates.reg, { csrfToken: req.csrfToken(), error });
  }

  return res.render(templates.login, { csrfToken: req.csrfToken(), error });
});

router.get('/logout', ensureAuthenticated, csrfProtection, (req, res) => {
  let error;
  req.logout((err) => {
    if (err) {
      error = 'Hiba a kijelentkezés során';
      return res.render(templates.login, { csrfToken: req.csrfToken(), error });
    }
    return res.render(templates.login, { csrfToken: req.csrfToken(), error: null });
  });
});

router.get('/cart', ensureAuthenticated, csrfProtection, (req, res) => {
  return res.render(templates.cart, { csrfToken: req.csrfToken(), error: null });
});

module.exports = router;
