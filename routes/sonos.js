var express = require('express');
var router = express.Router();


// var morgan     = require('morgan');
//
// // configure app
// app.use(morgan('dev')); // log requests to the console


/* GET test page. */
router.get('/', function(req, res) {
  res.json({ message: 'Hello World!' });
});

module.exports = router;
