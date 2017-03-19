var express = require('express');
var router = express.Router();
var request = require('request');

var WINK_HTTP_SERVER = "http://api.wink.com/"

router.get('/', function(req,res){
    res.json({ message: 'Connected to Wink Module'});
});

router.get('/wink_devices', function(req, res){
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + 'users/me/wink_devices',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer oVTdVyKz0mRiho1dJW5r-Sv1hW3LB6K_'
        },
    }, function(error, response, body){
        console.log('Status:', response.statusCode);
        console.log('Headers:', JSON.stringify(response.headers));
        console.log('Response:', JSON.parse(body));

        res.json({ message: JSON.parse(body)});
    });
     
});

router.get('/light_bulbs/:device_id', function(req, res) {
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + '/light_bulbs/' + req.params.device_id,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': req.body.Authorization
        },
    }, function(error, response, body) {
        console.log('Status:', response.statusCode);
        console.log('Headers:', JSON.stringify(response.headers));
        console.log('Response:', body);
    });

    res.json({ message: 'Light bulb id ' + req.params.device_id });
});

router.get('/hubs/:device_id', function(req, res) {
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + '/hubs/' + req.params.device_id,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': req.body.Authorization
        },
    }, function(error, response, body) {
        console.log('Status:', response.statusCode);
        console.log('Headers:', JSON.stringify(response.headers));
        console.log('Response:', body);
    });

    res.json({ message: 'Hub id ' + req.params.device_id });
});

router.get('/powerstrips/:device_id', function(req, res) {
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + '/powerstrips/' + req.params.device_id,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': req.body.Authorization
        },
    }, function(error, response, body) {
        console.log('Status:', response.statusCode);
        console.log('Headers:', JSON.stringify(response.headers));
        console.log('Response:', body);
    });

    res.json({ message: 'Powerstrips id ' + req.params.device_id });
});

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
