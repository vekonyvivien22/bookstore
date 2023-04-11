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
};

const templates = {
  login: 'login',
  reg: 'reg',
};

const router = express.Router();

router.get('/login', async (req, res) => {
  const categories = await models.category.find();
  const stores = await models.store.distinct('name');

  return res.render(templates.login, { categories, stores });
});

router.get('/reg', ensureNotAuthenticated, csrfProtection, async (req, res) => {
  const categories = await models.category.find();
  const stores = await models.store.distinct('name');

  return res.render(templates.reg, { categories, stores, csrfToken: req.csrfToken(), error: null });
});

router.post('/reg', csrfProtection, async (req, res) => {
  const { passwordConfirmation, firstName, lastName, ...body } = req.body;

  const categories = await models.category.find();
  const stores = await models.store.distinct('name');

  let error;
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
    error = 'Error: ' + err.message;
    return res.render(templates.reg, { categories, stores, csrfToken: req.csrfToken(), error });
  }

  return res.render(templates.login, { categories, stores, csrfToken: req.csrfToken() });
});

module.exports = router;
