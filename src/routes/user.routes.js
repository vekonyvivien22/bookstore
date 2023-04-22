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

  req.session.save(function () {
    if (req.get('referer').includes('/user/cart')) {
      return res.redirect('/user/cart');
    } else {
      return res.status(204).send();
    }
  });
});

router.get('/sub/:id', ensureAuthenticated, csrfProtection, async (req, res) => {
  const id = req.params.id;
  const book = await models.book.findById(id);

  var cart = new Cart(req.session.cart ? req.session.cart : {});
  cart.sub(book, id);
  req.session.cart = cart;

  req.session.save(function () {
    if (req.get('referer').includes('/user/cart')) {
      return res.redirect('/user/cart');
    } else {
      return res.status(204).send();
    }
  });
});

router.post('/order', ensureAuthenticated, csrfProtection, async (req, res) => {
  const { shippingMethod, storeSelect, ...body } = req.body;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  let error;

  if (shippingMethod == 'store pickup') {
    //console.log(storeSelect);
    try {
      for (const book of cart.generateArray()) {
        //console.log('Book id:' + book.item._id + ', qty:' + book.qty);
        const store = await models.store.find(
          { name: storeSelect },
          { 'storeStock.bookId': book.item._id },
          //{ 'storeStock.quantity': { $gte: book.qty } },
        );
        console.log(store);
      }
    } catch (err) {
      error = 'Az egyik könyv nincs a boltnak raktárán vagy nincs elég.';
    }
    console.log('helo');
  } else {
    console.log('szia');
  }

  //SIMA 3 bolt esetén:
  //Ha a store pickup van akkor: van e ott mind? error ha nincs
  //Ha home delivery akkor: oké.

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
