var express = require('express');
var router = express.Router();
var request = require('request');

var WINK_HTTP_SERVER = "http://api.wink.com/"

var morgan = require('morgan');
router.use(morgan('dev'));

function winkSummary(body) {
    winkRequestData = body;
    var winkSendData = {}

    winkSendData["device_type"] = winkRequestData.device_type;
    winkSendData["device_id"] = winkRequestData.device_id;

    return winkSendData;
}

// GET test page
router.get('/', function(req,res){
    console.log(WINK_AUTHORIZATION)
    res.json({ message: 'Connected to Wink Module'});
});

// get all wink devices connected to the account logged in
router.get('/wink_devices', function(req, res){

    conosole.log("Authorization: " + WINK_AUTHORIZATION);

    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + 'users/me/wink_devices',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': WINK_AUTHORIZATION
        },
    }, function(error, response, body){
        if (!error && response.statusCode == 200) {
            console.log('Status:', response.statusCode);
            console.log('Headers:', JSON.stringify(response.headers));
            console.log('Response:', JSON.parse(body));
            
            res.json({ message: JSON.parse(body)});

            var winkRequestData = JSON.parse(body);


        } else {
            res.send(500, "Not started or connected");
        }
    });
     
});

// gets the light_bulb status for the particular id
router.get('/light_bulbs/:device_id', function(req, res) {

    var winkRequestData;
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + 'light_bulbs/' + req.params.device_id,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': WINK_AUTHORIZATION
        },
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {     
            console.log('Status:', response.statusCode);
            console.log('Headers:', JSON.stringify(response.headers));
            console.log('Response:', body);

            res.json(winkSummary(JSON.parse(body)))
        } else {
            res.send(500, "Not started or connected")
        }
    });

    res.json({ message: 'Light bulb id ' + req.params.device_id });
});

// gets the hub status for the particular id
router.get('/hubs/:device_id', function(req, res) {
    
    var winkRequestData;
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + 'hubs/' + req.params.device_id,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': WINK_AUTHORIZATION
        },
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {     
            console.log('Status:', response.statusCode);
            console.log('Headers:', JSON.stringify(response.headers));
            console.log('Response:', body);

            res.json(winkSummary(JSON.parse(body)))
        } else {
            res.send(500, "Not started or connected")
        }
    });

    res.json({ message: 'Hub id ' + req.params.device_id });
});

// gets the powerstrips status for the particular id
router.get('/powerstrips/:device_id', function(req, res) {
    
    var winkRequestData;
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + 'powerstrips/' + req.params.device_id,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': req.body.Authorization
        },
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {     
            console.log('Status:', response.statusCode);
            console.log('Headers:', JSON.stringify(response.headers));
            console.log('Response:', body);

            res.json(winkSummary(JSON.parse(body)))
        } else {
            res.send(500, "Not started or connected")
        }
    });

    res.json({ message: 'Powerstrips id ' + req.params.device_id });
});

// uses PUT to change the state for the particular device
router.put('/change_state', function(req, res) {
    
    var options = {
        method: 'PUT',
        //url: WINK_HTTP_SERVER + req.body.device_type + '/' + req.body.device_id + '/desired_state',
        url: WINK_HTTP_SERVER + 'light_bulbs/2416737/desired_state',
        headers: {
            'Content-Type': 'application/json', 
            //'Authorization': req.body.Authorization 
            Authorization : 'Bearer oVTdVyKz0mRiho1dJW5r-Sv1hW3LB6K_'
        },
        body: { "desired_state": { "powered": true } },
        json: true
    };
    
    request(options, function (error, response, body) {
        console.log("request", options.body);
        //console.log('Status:', response.statusCode);
        //console.log('Headers:', JSON.stringify(response.headers));
        console.log('Response:', body);
    });

    res.json({ message: 'Change State'});
});

module.exports = router;
