// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');

//OAUTH
var session = require('express-session')
var Grant = require('grant-express')
var grant = new Grant(require('./config.json'))
var app = express();

var server = require('http').createServer(app); 
var io = require('socket.io')(server);

app.use(session({secret:'3245tr,gfewere4re3e4d98eyoiul438p'}))
app.use(grant)

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

port = process.env.PORT || 8081; // set our port
BASESERVER = 'http://localhost:';

// wink tokens
WINK_ACCESS_TOKEN = "";
WINK_REFRESH_TOKEN = "";
WINK_AUTHORIZATION = "";

// connect to our database
var mongoose = require('mongoose');
mongoose.connect('mongodb://ventana:Pistachio1@ds054999.mlab.com:54999/ventana');

// Add Routers (Modules)
var sonos = require('./routes/sonos');
var wink = require('./routes/wink');

app.use('/wink', wink);
app.use('/sonos', sonos);


// GET Wink OAUTH - via Grant
app.get('/handle_wink_callback', function (req, res) {
  //console.log(req.query)
  //console.log(req.query.access_token)
  //console.log(req.query.refresh_token)
  WINK_ACCESS_TOKEN = req.query.access_token;
  WINK_REFRESH_TOKEN = req.query.refresh_token;
  WINK_AUTHORIZATION = req.query.raw.data.token_type + ' ' + WINK_ACCESS_TOKEN;
  //console.log(WINK_AUTHORIZATION)
  res.end(JSON.stringify(req.query, null, 2))
});

// Server Base Endpoint
app.get('/', function(req, res) {
  res.json({ message: 'Connected to Server' });
});

app.post('/socketsend', function(req, res) {
    //Socket IO client connected
    io.emit('push', JSON.stringify(req.body));
    res.send("ok");
});


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

//Server-side requested socket send request

io.on('connection', function(client) {  
    console.log('Client connected...');
    
});



module.exports = app;

// START THE SERVER
// =============================================================================
app.listen(port);
server.listen(4200);
console.log('Magic happens on port ' + port);