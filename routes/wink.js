var express = require('express');
var router = express.Router();
var request = require('request');

var WINK_HTTP_SERVER = "http://api.wink.com/"

router.get('/wink_devices', function(req, res){
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + 'users/me/wink_devices',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': req.body.Authorization
        },
    }, function(error, response, body){
        console.log('Status:', response.statusCode);
        console.log('Headers:', JSON.stringify(response.headers));
        console.log('Response:', body);
    });
    
    res.json({ message: 'Get Wink Devices'});
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
});

router.put('/change_state', function(req, res) {
    request({
        method: 'PUT',
        url: WINK_HTTP_SERVER + req.body.device_type + '/' + req.body.device_id + '/desired_state',
        headers: {
            'Content-Type': 'application/json', 
            'Authorization': req.body.Authorization 
        },
        body: req.body.desired_state 
    }, function (error, response, body) {
        console.log('Status:', response.statusCode);
        console.log('Headers:', JSON.stringify(response.headers));
        console.log('Response:', body);
    });

    res.json({ message: 'Change State'});
});

module.exports = router;
