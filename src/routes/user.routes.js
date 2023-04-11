const express = require('express');
const { default: mongoose } = require('mongoose');
const Multer = require('multer');

const models = {
    category: mongoose.model('category'),
    store: mongoose.model('store'),
  };
  
const templates = {
    login: 'login',
    reg: 'reg',
};

const router = express.Router();

router.get('/login', async (req, res) => {
    const categories = await models.category.find();
    const stores = await models.store.distinct("name");
  
    return res.render(templates.login, { categories, stores });
});

router.get('/reg', async (req, res) => {
    const categories = await models.category.find();
    const stores = await models.store.distinct("name");
  
    return res.render(templates.reg, { categories, stores });
});

router.post('/reg', async (req, res) => {
    const data = req.body.data;
    console.log(data);
    const categories = await models.category.find();
    const stores = await models.store.distinct("name");
  
    return res.render(templates.login, { categories, stores });
});

module.exports = router;