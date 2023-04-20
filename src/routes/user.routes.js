const express = require('express');
const { default: mongoose } = require('mongoose');
const Multer = require('multer');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const passport = require('passport');
const { ensureAuthenticated, ensureNotAuthenticated } = require('../utils/middlewares');
var Cart = require('../schemas/cart');

const models = {
  category: mongoose.model('category'),
  store: mongoose.model('store'),
  user: mongoose.model('user'),
  book: mongoose.model('book'),
  order: mongoose.model('order'),
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
        return res.redirect('/');
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
    return res.redirect('/user/login');
  });
});

router.get('/cart', ensureAuthenticated, csrfProtection, (req, res) => {
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  //console.log(cart.generateArray());
  console.log(req.session.cart);

  return res.render(templates.cart, {
    cart: cart.generateArray(),
    totalQty: cart.totalQty,
    totalPrice: cart.totalPrice,
    csrfToken: req.csrfToken(),
    error: null,
  });
});

router.get('/add/:id', ensureAuthenticated, csrfProtection, async (req, res) => {
  const id = req.params.id;
  const book = await models.book.findById(id);

  var cart = new Cart(req.session.cart ? req.session.cart : {});
  cart.add(book, id);
  req.session.cart = cart;

  //console.log(req.session.cart);
  //console.log(req.session.cart.totalQty);

  res.status(204).send();
});

router.get('/sub/:id', ensureAuthenticated, csrfProtection, async (req, res) => {
  const id = req.params.id;
  const book = await models.book.findById(id);

  var cart = new Cart(req.session.cart ? req.session.cart : {});
  cart.sub(book, id);
  req.session.cart = cart;

  //console.log(req.session.cart.totalQty);

  res.status(204).send();
});

router.post('/order', ensureAuthenticated, csrfProtection, async (req, res) => {
  //const { firstName, lastName, address, paymentMethod, shippingMethod, total ...body } = req.body;
  let error;
  console.log(req.body);

  //SIMA 3 bolt esetén:
  //Ha a store pickup van akkor: van e ott mind? error ha nincs
  //Ha home delivery akkor: oké.

  //TÖBB bolt esetén!
  //ha home delivery akkor a raktáras stock-ot nézzük csak (mindnél)
  //store pickupnál esetben csak a boltot

  //storeStock levonás!
  //order mentése

  delete req.session.cart;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  return res.render(templates.cart, {
    cart: cart.generateArray(),
    totalQty: cart.totalQty,
    totalPrice: cart.totalPrice,
    csrfToken: req.csrfToken(),
    error: null,
  });
});

module.exports = router;
