// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');

//OAUTH
var session = require('express-session')
var Grant = require('grant-express')
var grant = new Grant(require('./config.json'))
var app = express();

//Socket.IO 
var server = require('http').createServer(app); 
var io = require('socket.io')(server);
io.set('transports', ['websocket']);

// Session for Grant OAUTH
app.use(session({
    secret:'3245tr,gfewere4re3e4d98eyoiul438p',
    resave: true,
    saveUninitialized: false
}))
app.use(grant)

//Morgan Logging
var morgan = require('morgan');
app.use(morgan('dev')); // log requests to the console

// Configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set BASE global variables
port = process.env.PORT || 8081; // set our port
BASESERVER = 'http://localhost';

// connect to database
var mongoose = require('mongoose');
mongoose.connect('mongodb://ventana:Pistachio1@ds054999.mlab.com:54999/ventana');

// Add Routers (Modules)
var sonos = require('./routes/sonos');
var wink = require('./routes/wink');
app.use('/wink', wink);
app.use('/sonos', sonos);

// GET Wink OAUTH response - via Grant
// Grant OAUTH request: http://{serverURL}/connect/{module i.e wink}/
// Responses successful authentications to http://{serverURL}/handle_wink_callback/
app.get('/handle_wink_callback', function (req, res) {
  console.log(req.query)
  console.log(req.query.access_token)
  console.log(req.query.refresh_token)
  res.end(JSON.stringify(req.query, null, 2))
});

// Server Base Endpoint
app.get('/', function(req, res) {
  res.json({ message: 'Connected to Server' });
});

// Socket.IO POST endpoint to send a sockets message
app.post('/socketsend', function(req, res) {
    //Socket IO client connected
    // io.emit('push', {'data': 'Hi Santy!'});
    io.emit('push', req.body);
    res.send("ok");
});

// catch 404 and forwarding to error handler
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
    /* ### TESTING CODE ### */
    io.on('beep', function(action){
        console.log('beep heard')
    });
    
});



module.exports = app;

// START THE SERVER
// =============================================================================
app.listen(port);
server.listen(4200);
console.log('Magic happens on port ' + port);
console.log('Sockets wizardy on port 4200');
