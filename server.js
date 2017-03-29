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

// //PubNub Notifications
// var PubNub = require('pubnub')
// var pubnub = new PubNub({
//     subscribeKey: "sub-c-f7bf7f7e-0542-11e3-a5e8-02ee2ddab7fe",
//     ssl: true
// });

// pubnub.addListener({
//     status: function(statusEvent) {
//         if (statusEvent.category === "PNConnectedCategory") {
//             console.log("Connected to nubPub");
//         }
//     },
//     message: function(message) {
//         newDesiredState = JSON.parse(message).desired_state
//         console.log("New Message!!", message);
//     }
// })      
    
//     console.log("Subscribing..");
// pubnub.subscribe({
//         channels: ['ab6a481d06f81d80acfab707eddb42bf60faf75e|light_bulb-2566198|user-616119'] 
// });

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


// wink tokens
WINK_ACCESS_TOKEN = "";
WINK_REFRESH_TOKEN = "";
WINK_AUTHORIZATION = 'bearer 82pXcnWl6h-5wPyTIrBJBYqxve-ZHih7';

// connect to our database
var mongoose = require('mongoose');
mongoose.connect('mongodb://ventana:Pistachio1@ds054999.mlab.com:54999/ventana');

// View Engine
app.set('view engine', 'ejs');
app.use(express.static('public'))

// Setup JS
var setup = require('./setup');

// Add Routers (Modules)
var sonos = require('./routes/sonos');
var wink = require('./routes/wink');
app.use('/wink', wink);
app.use('/sonos', sonos);

// GET Wink OAUTH response - via Grant
// Grant OAUTH request: http://{serverURL}/connect/{module i.e wink}/
// Responses successful authentications to http://{serverURL}/handle_wink_callback/
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

// Server Base Endpoint -- SETUP Dashboard

app.get('/', function(req, res) {
    setup.getDevices(function(devices){
        console.log(devices);

        if(devices['paired']){

            devices['paired'].forEach(function(device) {
             console.log(device);
            });

            res.render('pages/index', {devices:devices['paired']});

        }
        else{
            res.render('pages/index', {devices:{}});
        }
        
    });
  //res.json({ message: 'Connected to Server' });
});

app.get('/vendors', function(req, res){
   res.render('pages/vendors'); 
});

app.get('/addSonos', function(req, res) {
    setup.getSonos(function(devices){
        console.log(devices);

        if(devices['unpaired']){

            devices['unpaired'].forEach(function(device) {
             console.log(device);
            });

            res.render('pages/add', {devices:devices['unpaired']});

        }
        else{
            res.render('pages/add', {devices:{}});
        }
        
    });
});

app.get('/savenew/:vendor', function(req, res){
    setup.getUsedIds(function(values){
        console.log(values);

        var newId = "1";
        while (newId < "16") {
            if (values.includes(newId)) {
                newId += "1";
            } else {
                break;
            }
        }
        // Based on vendor, create object in the correct SonosDM or WinkDM object
        // Will recieve value from url query parameters:
        // - device_name
        // - device_type
        // - [all the things in the sonos/wink object]
        // - assign it an _id that is not in the the `getUsedIDs` list less than 15.

        /*var options = {
            method: 'POST',
            //url: WINK_HTTP_SERVER + req.body.device_type + '/' + req.body.device_id + '/desired_state',
            url: BASESERVER + device_type + '/' + device_id,
            headers: {
                'Content-Type': 'application/json', 
                //'Authorization': req.body.Authorization 
                Authorization : WINK_AUTHORIZATION
            },
            //body: req.body,
            body: new_state,
            json: true
        };
        
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                res.send({ message: 'Change State'});
            } else {
                console.log(error + ' ' + response.statusCode)
                res.json({ message: 'Error State'});
            }        
        });*/

    });
    
    res.json({ message: 'test'});
            
    
});

app.get('/addWink', function(req, res) {
    setup.getWink(function(devices){
        console.log(devices);

        if(devices['unpaired']){

            devices['unpaired'].forEach(function(device) {
             console.log(device);
            });

            res.render('pages/add', {devices:devices['unpaired']});

        }
        else{
            res.render('pages/add', {devices:{}});
        }
        
    });
  //res.json({ message: 'Connected to Server' });
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
    res.json({
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
