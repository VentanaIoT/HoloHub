var express = require('express');
var router = express.Router();
var request = require('request');
var WinkDM = require('../app/models/winkController');

var WINK_HTTP_SERVER = "https://api.wink.com/"

var morgan = require('morgan');
router.use(morgan('dev'));

// convert Wink response into Wink HoloHub Object friendly response
function winkSummary(body, callback) {
    winkRequestData = body;
    var winkSendData = {}

    winkSendData["device_type"] = winkRequestData.data.object_type + "s";
    winkSendData["device_id"] = winkRequestData.data.object_id;

    if (winkRequestData.data.object_type == "powerstrip"){
        winkSendData["outlets"] = [];
        winkRequestData.data.outlets.forEach(function (item, index){
            var tempWink = {};
            tempWink["outlet_id"] = item.outlet_id;
            tempWink["outlet_index"] = item.outlet_index;
            tempWink["name"] = item.name;
            winkSendData.outlets[index] = tempWink;
        })
    }

    winkSendData["name"] = winkRequestData.data.name;
    winkSendData["_id"] = winkRequestData.data._id;

    return callback(winkSendData);
}

// Convert a vumark_id to a Wink device ID (the device_type/device_id/name)
function getDeviceIDbyVumarkID(vumark_id, callback) {

    //gets a wink object, if one doesn't exist with that vumark_id, return null
    WinkDM.findById(vumark_id, function(err, wink) {
        if (err) {
            console.log(err);
            return callback(null);
        } else if (wink) {
            return callback(wink);
        } else {
            return callback(null);
        }
    });
};

function getVumarkByDeviceID(device_id, callback) {

    WinkDM.findOne({"device_id": device_id}, function(err, wink){
        if (err) {
            console.log(err);
            return callback(null);
        } else if (wink) {
            return callback(wink._id); //if the obj exists return its vu id
        } else {
            return callback(null);
        }
    });
};

// GET shows we are connected to wink
// POST processes new wink object
router.route('/')

    .get(function(req,res){
        if (WINK_AUTHORIZATION != null) {
            //console.log(WINK_AUTHORIZATION)
            res.json({ message: 'Connected to Wink Module'});
        } else {
            //console.log("WINK_AUTHORIZATION is null");
            res.json({message: 'Not connected to Wink!'});
        }
    })

    .post(function(req,res) {
        var wink = new WinkDM(); //new instance of wink object

        if (req.body._id != null){
            wink._id = req.body._id; //vumark id
        }
        if (req.body.device_id != null) {
            wink.device_id = req.body.device_id;
        }
        if (req.body.device_type != null){
            wink.device_type = req.body.device_type;
        }
        /*if (req.body.controller != null){
            wink.controller = req.body.controller;
        }*/

        request({
            method: 'GET',
            url: WINK_HTTP_SERVER + wink._doc.device_type + "/" + wink._doc.device_id,
            headers: {
            'Content-Type': 'application/json',
            'Authorization': WINK_AUTHORIZATION
            },
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                wink.save(function(err) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json({message: 'WinkDM object created!'});
                    };
                });
                res.json((JSON.parse(body)).data);
            } else {
                console.log("error in POST")
                //res.send(statusCode=500, "Not Started or Connected");
                res.send({message : "this didn't work"});
            };
        });
    });

// get all wink devices connected to the account logged in
router.get('/wink_devices', function(req, res){

    //conosole.log("Authorization: " + WINK_AUTHORIZATION);
    var winkDevices = {'device_list': []}
    request({
        method: 'GET',
        url: WINK_HTTP_SERVER + 'users/me/wink_devices',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': WINK_AUTHORIZATION
        },
    }, function(error, response, body){
        if (!error && response.statusCode == 200) {
            //console.log('Status:', response.statusCode);
            //console.log('Headers:', JSON.stringify(response.headers));
            //console.log('Response:', JSON.parse(body));
         
            var winkResponseBody = JSON.parse(body);

            winkResponseBody.data.forEach( function (item, index) {
                var deviceTemp = {};
                if (item.light_bulb_id != null){
                    deviceTemp["device_id"] = item.light_bulb_id;
                    deviceTemp["device_type"] = 'light_bulbs';
                } else if (item.powerstrip_id != null){
                    deviceTemp["device_id"] = item.powerstrip_id;
                    deviceTemp["device_type"] = 'powerstrips';
                } else if (item.manufacturer_device_model == "wink_hub") {
                    deviceTemp["device_id"] = item.hub_id;
                    deviceTemp["device_type"] = 'hubs';
                }
                else {
                    console.log("Device type not supported");
                }
                deviceTemp["name"] = item.name;
                /*getVumarkByDeviceID(deviceTemp["device_id"], function (returnObject){
                    if (returnObject != null) {
                        // this device has a vumark id linked to item
                        deviceTemp["_id"] = returnObject;
                    } else {
                        deviceTemp["_id"] = null;
                    }
                });*/
                winkDevices.device_list[index] = deviceTemp;
            });

            res.json(winkDevices)
        } else {
            res.send(500, "Not started or connected");
        }
    });
     
});

// gets the light_bulb status for the particular id
router.get('/status/:vumark_id', function(req, res) {

    //Johan wants name and desired_state object and vumark_id
    //var winkRequestData;

    
    getDeviceIDbyVumarkID(req.params.vumark_id, function(returnObject) {
        var device_id = returnObject._doc.device_id;
        var device_type = returnObject._doc.device_type;
        //var RIP = returnObject._doc.desired_state;

        //console.log(req.params.vumark_id);
        //console.log(WINK_HTTP_SERVER + device_type + '/' + device_id);
        request({
            method: 'GET',
            url: WINK_HTTP_SERVER + device_type + '/' + device_id,
            //url: WINK_HTTP_SERVER + 'light_bulbs/' + req.params.vumark_id, //hardcoded with light bulbs rn
            headers: {
                'Content-Type': 'application/json',
                'Authorization': WINK_AUTHORIZATION
            },
            json: true
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {     
                //console.log('Status:', response.statusCode);
                //console.log('Headers:', JSON.stringify(response.headers));
                //console.log('Response:', body);
                //console.log(JSON.stringify(body.data.desired_state));
                winkSummary(body, function(winky){
                    //this will wait for winkSummary response to happen
                    winky["_id"] = req.params.vumark_id;

                    res.json(winky);
                });

                } else {
                    res.send(500, "Not started or connected")
                    //res.json({ message: 'Light bulb id ' + req.body.device_id });
            }
        });

    });

});

// uses PUT to change the state for the particular device
router.post('/change_power/:vumark_id', function(req, res) {
    
    getDeviceIDbyVumarkID(req.params.vumark_id, function(returnObject){
        var device_id = returnObject._doc.device_id;
        var device_type = returnObject._doc.device_type;

        var last_state; 
        //var last_brightness;

        request({
            method: 'GET',
            url: WINK_HTTP_SERVER + device_type + '/' + device_id,
            headers: {
                'Content-Type': 'application/json', 
                //'Authorization': req.body.Authorization 
                Authorization : WINK_AUTHORIZATION
            },
            json: true
          }, function(error, response, body) {
            if (!error && response.statusCode == 200) {     
                if (device_type == "powerstrips"){
                    device_type = "outlets";
                    device_id = body.data.outlets[req.body.value].outlet_id;
                    last_state = body.data.outlets[req.body.value].powered;
                } else {
                    last_state = body.data.last_reading.powered;
                }

                if (last_state == true) {
                    new_state = { "desired_state" : {"powered" : false}};
                } else {
                    new_state = { "desired_state" : {"powered" : true}};
                }

                var options = {
                    method: 'PUT',
                    //url: WINK_HTTP_SERVER + req.body.device_type + '/' + req.body.device_id + '/desired_state',
                    url: WINK_HTTP_SERVER + device_type + '/' + device_id + '/desired_state',
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
                });
            } else {
                    res.send(500, "RIP")
                    //res.json({ message: 'Light bulb id ' + req.body.device_id });
            }
        });

    });

});

// changes brightness
router.post('/change_brightness/:vumark_id', function(req, res) {
    
    getDeviceIDbyVumarkID(req.params.vumark_id, function(returnObject){
        var device_id = returnObject._doc.device_id;
        var device_type = returnObject._doc.device_type;
        
        var state;
        var amount_change_brightness = req.body.value/100.0;

        request({
            method: 'GET',
            url: WINK_HTTP_SERVER + device_type + '/' + device_id,
            headers: {
                'Content-Type': 'application/json', 
                //'Authorization': req.body.Authorization 
                Authorization : WINK_AUTHORIZATION
            },
            json: true
          }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                state = parseFloat(body.data.last_reading.brightness);

                if (amount_change_brightness != 0) {
                     state += amount_change_brightness;
                    if (state < 0) {
                        state = 0.0;
                    } else if (state > 1.0) {
                        state = 1.0;
                    }
                }
                
                new_state = { "desired_state" : {"brightness" : state}};

                var options = {
                    method: 'PUT',
                    //url: WINK_HTTP_SERVER + req.body.device_type + '/' + req.body.device_id + '/desired_state',
                    url: WINK_HTTP_SERVER + device_type + '/' + device_id + '/desired_state',
                    headers: {
                        'Content-Type': 'application/json', 
                        //'Authorization': req.body.Authorization 
                        Authorization : WINK_AUTHORIZATION
                    },
                    //body: req.body,
                    body: new_state,
                    json: true
                };

                //console.log(JSON.stringify(new_state));
                
                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        //console.log("request", options.body);
                        //console.log('Status:', response.statusCode);
                        //console.log('Headers:', JSON.stringify(response.headers));
                        //console.log('Response:', body);
                        res.send({ message: 'Change State'});
                    } else {
                        console.log(error + ' ' + response.statusCode)
                        res.json({ message: 'Error State'});
                    }        
                });
            } else {
                    res.send(500, "RIP")
                    //res.json({ message: 'Light bulb id ' + req.body.device_id });
            }
        });

    });

});

module.exports = router;