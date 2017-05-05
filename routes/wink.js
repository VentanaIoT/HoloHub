var express = require('express');
var router = express.Router();
var request = require('request');
var WinkDM = require('../app/models/winkController');
var setup = require('../setup');
var WINK_HTTP_SERVER = "https://api.wink.com/"

// convert Wink response into Wink HoloHub Object friendly response
function winkSummary(body, callback) {
    winkRequestData = body;
    var winkSendData = {}

    winkSendData["device_type"] = winkRequestData.data.object_type + "s";
    winkSendData["device_id"] = winkRequestData.data.object_id;
    winkSendData["vendor_logo"] = winkRequestData.data.vendor_logo;

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
            WinkDM.find(function(err, sonos) {
              if (err)
                  res.send(err);
              
              res.json(sonos);
            });
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
        if (req.body.device_name != null){
            wink.device_name = req.body.device_name;
        }
        if (req.body.vendor_logo != null) {
            wink.vendor_logo = req.body.vendor_logo;
        }
        if (req.body.vendor != null) {
            wink.vendor = req.body.vendor;
        }
        else{
            wink.vendor = "2"; //vendor is wink
        }

        // wink controller is path to hololens VentanaConfig.json
        if (wink.device_type == "light_bulbs") {
            wink.controller = "Ventana/Prefabs/LightController";
        } else if (wink.device_type == "powerstrips") {
            wink.controller = "Ventana/Prefabs/PowerStripController";
        } else {
            wink.controller = null;
        }

        request({
            method: 'GET',
            url: WINK_HTTP_SERVER + wink._doc.device_type + "/" + wink._doc.device_id,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
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
                // res.json((JSON.parse(body)).data);
            } else {
                console.log("error in 'wink/' POST: " + response.statusCode)
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
        timeout: 120000,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
            'Authorization': WINK_AUTHORIZATION
        },
    }, function(error, response, body){
        if (!error && response.statusCode == 200) {
            //console.log('Status:', response.statusCode);
            //console.log('Headers:', JSON.stringify(response.headers));
            //console.log('Response:', JSON.parse(body));
         
            var winkResponseBody = JSON.parse(body);

            var count = 0;
            winkResponseBody.data.forEach( function (item, index) {
                var deviceTemp = {};
                if (item.light_bulb_id != null && item.device_manufacturer != "philips"){
                    deviceTemp["device_id"] = item.light_bulb_id;
                    deviceTemp["device_type"] = 'light_bulbs';
                    deviceTemp["name"] = item.name;         //Kept for legacy. Need to test for removal
                    deviceTemp["device_name"] = item.name;
                    deviceTemp["vendor_logo"] = item.vendor_logo;
                    winkDevices.device_list[count] = deviceTemp;
                    count++;
                    console.log("light bulb added " + item.name + " " + count);
                } else if (item.powerstrip_id != null){
                    deviceTemp["name"] = item.name;         //Kept for legacy. Need to test for removal
                    deviceTemp["device_name"] = item.name;
                    deviceTemp["vendor_logo"] = item.vendor_logo;
                    deviceTemp["device_id"] = item.powerstrip_id;
                    deviceTemp["device_type"] = 'powerstrips';
                    winkDevices.device_list[count] = deviceTemp;
                    count++;
                    console.log("powerstrip added " + item.name + " " + count);
                }/* else if (item.manufacturer_device_model == "wink_hub") {
                    deviceTemp["device_id"] = item.hub_id;
                    deviceTemp["device_type"] = 'hubs';
                }*/ else {
                    console.log("Device type not supported");
                }
                //deviceTemp["name"] = item.name;         //Kept for legacy. Need to test for removal
                //deviceTemp["device_name"] = item.name;
                //deviceTemp["vendor_logo"] = item.vendor_logo;
                /*getVumarkByDeviceID(deviceTemp["device_id"], function (returnObject){
                    if (returnObject != null) {
                        // this device has a vumark id linked to item
                        deviceTemp["_id"] = returnObject;
                    } else {
                        deviceTemp["_id"] = null;
                    }
                });*/
                //winkDevices.device_list[index] = deviceTemp;
            });

            res.json(winkDevices)
        } else {
            res.send(500, "Not started or connected");
        }
    });
     
});

//GET all devices connected to the HoloHub
router.get('/devices', function(req, res){
    var winkDevices = {'paired_devices': [], 'unpaired_devices': []};
    var connectedDevices = {};

    // Retrieve all devices paired with the HoloHub, place into a dictionary {device_id: _id}
    request(BASESERVER + ':' +  port + '/wink/', {timeout: 500}, function(error, response, body){
        if(!error && response.statusCode == 200) {
            var temp1 = JSON.parse(body);
            temp1.forEach(function(arrayItem){
            connectedDevices[arrayItem.device_id] = arrayItem;
        });

        // Discover all Wink devices on the Wink.COM
        request(BASESERVER + ':' +  port + '/wink/wink_devices/', {timeout: 500}, function(error, response, body){
            if (!error && response.statusCode == 200) {
                var winkRequestData = JSON.parse(body)['device_list'];

                winkRequestData.forEach( function(arrayItem) {
                //If device name is in connectedDevices, then device is paired -- show w/ it's vumark ID
                if(arrayItem.device_id in connectedDevices){
                    winkDevices.paired_devices.push(connectedDevices[arrayItem.device_id]);
                }        
                else
                {
                    if(arrayItem.device_type in setup.supportedDevices){
                        var temp1 = {
                            "device_id": arrayItem.device_id,
                            "device_type": arrayItem.device_type,
                            "device_name": arrayItem.device_name,
                            "controller": setup.supportedDevices[arrayItem.device_type],
                            "vendor_logo": "https://www.winkapp.com/assets/mediakit/wink-logo-icon-knockout-50235153b274cdf35ef39fb780448596.png",
                            "vendor": 2
                        }
                        winkDevices.unpaired_devices.push(temp1);
                    }
                    
                }
                });
                res.json(winkDevices);       
            }
            else{
                error = error;
                res.json({"message": "merp"});
            };
        });
        }
        else {
            console.log(error);
            res.send("Error " + error, statusCode=500);
        };
    });
});

// gets the light_bulb status for the particular id
router.get('/status/:vumark_id', function(req, res) {
    
    getDeviceIDbyVumarkID(req.params.vumark_id, function(returnObject) {
        var device_id;
        var device_type;
        
        if (returnObject == null) {
            res.send({"message": "Invalid Wink vumark ID"});
        } else {
            device_id = returnObject._doc.device_id;
            device_type = returnObject._doc.device_type;
        }

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
        var device_id;
        var device_type;
        
        if (returnObject == null) {
            res.send({"message": "Invalid Wink vumark ID"});
        } else {
            device_id = returnObject._doc.device_id;
            device_type = returnObject._doc.device_type;
        }

        var last_state; 

        request({
            method: 'GET',
            url: WINK_HTTP_SERVER + device_type + '/' + device_id,
            headers: {
                'Content-Type': 'application/json', 
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
                    url: WINK_HTTP_SERVER + device_type + '/' + device_id + '/desired_state',
                    headers: {
                        'Content-Type': 'application/json', 
                        Authorization : WINK_AUTHORIZATION
                    },
                    body: new_state,
                    json: true
                };
                
                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        res.send({ message: 'Change power state'});
                    } else {
                        console.log(error + ' ' + response.statusCode)
                        res.json({ message: 'Error change power state'});
                    }        
                });
            } else {
                    res.send(500, "Not successful change_power")
            }
        });

    });

});

// changes brightness
router.post('/change_brightness/:vumark_id', function(req, res) {
    
    getDeviceIDbyVumarkID(req.params.vumark_id, function(returnObject){
        var device_id;
        var device_type;
        
        if (returnObject == null) {
            res.send({"message": "Invalid Wink vumark ID"});
        } else {
            device_id = returnObject._doc.device_id;
            device_type = returnObject._doc.device_type;
        }

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
                        res.send({ message: 'Change Brightness'});
                    } else {
                        console.log(error + ' ' + response.statusCode)
                        res.json({ message: 'Error in changing brightness'});
                    }        
                });
            } else {
                    res.send(500, "Not Successful change_brightness")
            }
        });

    });

});

module.exports = router;
