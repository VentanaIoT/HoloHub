var express = require('express');
var router = express.Router();
var request = require('request');

var WINK_HTTP_SERVER = "https://api.wink.com/"

var morgan = require('morgan');
router.use(morgan('dev'));

// convert Wink response into Wink HoloHub Object friendly response
function winkSummary(body, callback) {
    winkRequestData = body;
    var winkSendData = {}

    winkSendData["device_type"] = winkRequestData.data.object_type;
    winkSendData["device_id"] = winkRequestData.data.object_id;
    winkSendData["name"] = winkRequestData.data.name;
    winkSendData["desired_state"] = winkRequestData.data.desired_state;
    //winkSendData["subscription"] = winkRequestData.subscription;

    //winkSendData["count"] = winkRequestData.pagination.count;
    //console.log(winkSendData["count"]);
    //return callback(winkSendData); -- everything will need to be changed
    return callback(winkSendData);
}

// Convert a vumark_id to a Wink device ID (the device_type/device_id/name)
function getDeviceIDbyVumarkID(vumark_id, callback) {

    

};

// GET test page
router.get('/', function(req,res){
    console.log(WINK_AUTHORIZATION)
    res.json({ message: 'Connected to Wink Module'});
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
            console.log('Headers:', JSON.stringify(response.headers));
            //console.log('Response:', JSON.parse(body));
            
            res.json({ message: JSON.parse(body)});

            var winkRequestData = body.data;

            /*winkRequestData.forEach( function (arrayItem) {
                winkDevices.device_list.push(arrayItem.name);
            });*/

            res.json(winkRequestData)
        } else {
            res.send(500, "Not started or connected");
        }
    });
     
});

// gets the light_bulb status for the particular id
router.get('/status/:vumark_id', function(req, res) {

    //Johan wants name and desired_state object and vumark_id
    //var winkRequestData;

    /*
    getDevicebyID(req.params.vumark, function(returnObject) {
        var device_id = returnObject.device_id;
        var device_type = returnObject.device_type;

        //request needs to go in here

    });
    */
    console.log(req.params.vumark_id);
    request({
        method: 'GET',
        //url: WINK_HTTP_SERVER + device_type + '/' + device_id,
        url: WINK_HTTP_SERVER + 'light_bulbs/' + req.params.vumark_id, //hardcoded with light bulbs rn
        headers: {
            'Content-Type': 'application/json',
            'Authorization': WINK_AUTHORIZATION
        },
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {     
            console.log('Status:', response.statusCode);
            console.log('Headers:', JSON.stringify(response.headers));
            console.log('Response:', body);

            winkSummary(JSON.parse(body), function(winky){
                //this will wait for winkSummary response to happen
                winky["vumark_id"] = req.params.vumark_id;

                res.json(winky);
            });

            //res.json({ message: 'Light bulb id ' + req.body.device_id });
        } else {
            res.send(500, "Not started or connected")
            //res.json({ message: 'Light bulb id ' + req.body.device_id });
        }
    });

});

// uses PUT to change the state for the particular device
router.post('/change_state/:vumark_id', function(req, res) {
    
    //var device_id = req.body.vumark_id;  
    /* {
        vumarkID: string, 
        desired_state: Object (JSON)
    }
    
    getDevicebyID(req.params.vumark, function(returnObject){

            LOGIC GOES HERE
            var 1 = returnObject.device_id ==> WINK DEVICE
            var 2 =returnObject.device_type  --> WINK DEVICE TYPE

           [here]

           options request goes heren\ like put to wink

    });


    */

    var options = {
        method: 'PUT',
        //url: WINK_HTTP_SERVER + req.body.device_type + '/' + req.body.device_id + '/desired_state',
        url: WINK_HTTP_SERVER + 'light_bulbs/' + req.params.vumark_id + '/desired_state',
        headers: {
            'Content-Type': 'application/json', 
            //'Authorization': req.body.Authorization 
            Authorization : WINK_AUTHORIZATION
        },
        body: JSON.parse(req.body.value),
        json: true
    };
    
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log("request", options.body);
            console.log('Status:', response.statusCode);
            //console.log('Headers:', JSON.stringify(response.headers));
            //console.log('Response:', body);
            res.json({ message: 'Change State'});
        } else {
            console.log(error + ' ' + response.statusCode)
            res.json({ message: 'Error State'});
        }        
    });

    
});

module.exports = router;
