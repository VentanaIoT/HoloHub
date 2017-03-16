// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();

//OAUTH
var session = require('express-session')
var Grant = require('grant-express')
var grant = new Grant(require('./grantconfig.json'))

app.use(session({secret:'3245tr,gfewuoijlqi;pu498eyoiul438p'}))
app.use(grant)


// GET Wink OAUTH - via Grant
app.get('/handle_wink_callback', function (req, res) {
  if (!("error" in obj)) {
  console.log(req.query.access_token)
  console.log(req.query.refresh_token)}o
  res.end(JSON.stringify(req.query, null, 2))
})



// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; // set our port

// connect to our database
var mongoose = require('mongoose');
mongoose.connect('mongodb://ventana:Pistachio1@ds054999.mlab.com:54999/ventana');

// Add Routers (Modules)
var routes = require('./routes/sonos');
var wink = require('./routes/wink');
var Bear = require('./app/models/bear');

app.use('/', routes);
app.use('/wink', wink);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
