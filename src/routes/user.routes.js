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

      req.logIn(user, (err) => {
        if (err) {
          error = 'Invalid credentials';
          return res.render(templates.login, {
            csrfToken: req.csrfToken(),
            error,
          });
        }
        return res.render('/', {
          csrfToken: req.csrfToken(),
          error: null,
        });
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
  let msg;
  req.logout((err) => {
    if (err) {
      error = 'Hiba a kijelentkezés során';
      return res.render(templates.login, { csrfToken: req.csrfToken(), error });
    }
    return res.render(templates.login, { csrfToken: req.csrfToken(), error: null });
  });
});

module.exports = router;
