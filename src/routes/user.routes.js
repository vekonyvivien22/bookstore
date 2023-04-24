const express = require('express');
const { default: mongoose } = require('mongoose');
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

router.post('/reg', ensureNotAuthenticated, csrfProtection, async (req, res) => {
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
      error = 'Error during checkout.';
      return res.render(templates.login, { csrfToken: req.csrfToken(), error });
    }
    return res.redirect('/user/login');
  });
});

router.get('/cart', ensureAuthenticated, csrfProtection, (req, res) => {
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  //console.log(cart.generateArray());
  //console.log(req.session.cart);

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
  const { firstName, lastName, address, paymentMethod, shippingMethod, storeSelect, total } =
    req.body;
  var saveAddress = address;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  let error;

  try {
    for (const book of cart.generateArray()) {
      const store = await models.store.findOne({
        ...(shippingMethod === 'store pickup' && { name: storeSelect }),
        storeStock: { $elemMatch: { quantity: { $gte: book.qty }, bookId: book.item._id } },
      });

      if (!store) {
        if (shippingMethod === 'store pickup') {
          throw new Error('One/some of the books are out of stock (in the selected store)');
        } else if (shippingMethod === 'home delivery')
          throw new Error('One/some of the books are completely out of stock (in every store).');
      } else {
        if (shippingMethod === 'store pickup')
          saveAddress = store.location + ' (' + storeSelect + ')';
      }

      await models.store.updateOne(
        { _id: store._id, 'storeStock.bookId': book.item._id },
        { $inc: { 'storeStock.$.quantity': -book.qty } },
      );

      const newOrder = new models.order({
        userID: req.user._id,
        paymentMethod,
        shippingName: {
          firstName,
          lastName,
        },
        shippingMethod,
        shippingAddress: saveAddress,
        total,
        items: Object.entries(cart.items).map(([key, item]) => ({
          bookId: key,
          quantity: item.qty,
        })),
      });

      await newOrder.save();

      delete req.session.cart;
    }
  } catch (err) {
    error = err;
  }

  return res.render(templates.cart, {
    cart: cart.generateArray(),
    totalQty: cart.totalQty,
    totalPrice: cart.totalPrice,
    csrfToken: req.csrfToken(),
    error,
  });
});

module.exports = router;
