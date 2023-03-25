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

app.use('/admin', require('./routes/admin.routes'));

app.get('/', (req, res) => {
  return res.send('szia');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
