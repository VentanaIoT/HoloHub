var express = require('express');
var router = express.Router();
var request = require('request');
var SonosDM = require('../app/models/sonosController');


var SONOS_HTTP_SERVER = BASESERVER + ":5005"
// var SONOS_HTTP_SERVER = 'http://192.168.0.108' + ":5005"


// Convert Sonos response into Sonos HoloHub Object friendly response
function responseSummary(body, callback){
  sonosRequestData = body;
  var sonosSendData = {}

  sonosSendData["album"] = sonosRequestData.currentTrack.album;
  sonosSendData["artist"] = sonosRequestData.currentTrack.artist;
  sonosSendData["title"] = sonosRequestData.currentTrack.title;
  sonosSendData["current_transport_state"] = sonosRequestData.playbackState;
  sonosSendData["uri"] = sonosRequestData.currentTrack.uri;
  sonosSendData["playlist_position"] = sonosRequestData.trackNo;
  sonosSendData["duration"] = sonosRequestData.currentTrack.duration;
  sonosSendData["position"] = sonosRequestData.elapsedTimeFormatted;
  sonosSendData["metadata"] = sonosRequestData.elapsedTime;
  sonosSendData["album_art"] = sonosRequestData.currentTrack.absoluteAlbumArtUri;

  return callback(sonosSendData);
}

//Convert a Vumark ID to a Sonos Device ID (the group/device name)
function getDeviceIDbyVumarkID(vumark_id, callback){
  
  //Get a sonos object. If not found return null, otherwise return name
  SonosDM.findById(vumark_id, function(err, sonos){
      if (err){
        console.log(err);
        return callback(null);
      }
      if (sonos){
        return callback(sonos.device_id);
      }
      else{
        return callback(null);
      }
    });
};

//Convert a Device ID (the group/device name) to a Vumark ID
function getVumakIDbyDeviceID(device_id, callback){
  // Get Sonos object by device_id, if found return id (VuMark) otherwise null
  SonosDM.findOne({"device_id": device_id}, function(err, sonos){
    if (err){
      console.log(err);
      return callback(null);
    }
    if (sonos){
      return callback(sonos._id);
    }
    else{
      return callback(null);
    }
  });
};

// Get all sonos objects and Create a new Sonos Music Object
router.route('/')

  .get(function(req, res) {   //GET all paired sonos device.

    SonosDM.find(function(err, sonos) {
              if (err)
                  res.send(err);
              
              res.json(sonos);
          });
  })

  .post(function(req, res){ 
    
    /* 
      Process new sonos object POST request. This
      will include the device_id (VuMark ID) and the
      device_name (Sonos API ID "in this case a string")
    */

    // TODO: ######## CHECK TO SEE IF DEVICE ALREADY EXISTS IN RECORD!!!!! ##############
    
    var sonos = new SonosDM();  // Create new instance of a sonos object

    if("_id" in req.body)
      sonos._id = req.body._id
    if("device_id" in req.body)
      sonos.device_id = req.body.device_id
      
    //if("controller" in req.body)
    sonos.controller = "Ventana/Prefabs/MusicController";

    // For sonos. save device state
    sonos.device_type = 'Sonos Speaker';

    // Lookup sonos state data calling device_id. Verify that the connection can be made.
    request(BASESERVER + ":" + port + '/sonos/status/' + sonos.device_id + '?skiplookup=true', function (error, response, body) {
      if (!error && response.statusCode == 200 && response.body != 'Not Started or Connected') {
          sonos.save(function(err) {
              if (err){
                res.send(err);
              }
              else{
                res.json({ message: 'SonosDM object created!' });
              };
          });     
      }
      else {
            res.send(statusCode=500, "Not Started or Connected");
      };
    });
  });

  //Need to add a PUT for the HoloLens to update the JSON file reference so that controller String is saved.

//Update Device or Get Device by Vuforia ID
router.route('/byId/:vumark_id')

  .get(function(req, res){
    //Get the Sonos Object by ID
    SonosDM.findById(parseInt(req.params.vumark_id), function(err, sonos){
      if (err){
        res.send(err);
      }
      res.json(sonos);
    });
  })

  .put(function(req, res){
    SonosDM.findByIdAndUpdate(parseInt(req.params.vumark_id), req.body, function(err,sonos){
      if (err){
        res.send(err);
      }
      res.json(sonos);
    });
  });


// GET Status by Vumark ID
router.get('/status/:vumark_id', function(req, res) {
  // Toggle Playback
  var sonosRequestData;

  //Initial device setup query to get sonos state data (Special case where vumark_id == device_id when skiplookup flag is set)
  if(req.query.skiplookup){
     request(SONOS_HTTP_SERVER + "/" + req.params.vumark_id + '/state', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body); // Print the response page.
            
            responseSummary(JSON.parse(body), function(responseJson){
                res.json(responseJson);
            });
        }
        else {
            res.send(500, "Not Started or Connected")
        }
      });
  }
  // Get sonos state data based on a vumark ID (needs to get converted to device_id)
  else
  {
    getDeviceIDbyVumarkID(req.params.vumark_id, function(device_id){
      request(SONOS_HTTP_SERVER + "/" + device_id + '/state', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            /* DEBUG CONSOLE */
            console.log(body); // Print the response page.
            responseSummary(JSON.parse(body), function(responseJson){
                res.json(responseJson);
            });
        }
        else {
            res.send(500, "Not Started or Connected")
        }
      });
    });
  }
});

// Toggle playback (Automatically loggles as needed)
router.get('/playtoggle/:vumark_id', function(req, res) {
  
  // Toggle Playback
  getDeviceIDbyVumarkID(req.params.vumark_id, function(device_id){
    // Call the status endpoint to see the current playback state of the sonos device. Set skiplookup flag to true to avoid double vumark lookup.
    request(BASESERVER + ':' +  port + '/sonos/status/' + device_id + '?skiplookup=true', function (error, response, body) {
      if (!error && response.statusCode == 200 && response.body != 'Not Started or Connected') {
        sonosRequestData = JSON.parse(body);
        if (sonosRequestData["current_transport_state"] == 'PAUSED_PLAYBACK'){
          request(SONOS_HTTP_SERVER + '/' + device_id + '/play', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the response page.
            }
          });
          res.send(body);
        }
        else{
          request(SONOS_HTTP_SERVER + '/' + device_id + '/pause', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the response page.
            }
          });
          res.send(body)
        }
      }
      else {
        res.send(500, "Not Started or Connected");
      }
    });
  });
});

// Skip current song
router.get('/forward/:vumark_id', function(req,res) {
  getDeviceIDbyVumarkID(req.params.vumark_id, function(device_id){
    request(SONOS_HTTP_SERVER + '/' + device_id + '/next', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log(body) // Print the response page.
      }
      res.send(body)
    });
  });
});

// Rewind Song/playlist
router.get('/reverse/:vumark_id', function(req, res){
  getDeviceIDbyVumarkID(req.params.vumark_id, function(device_id){
    request(SONOS_HTTP_SERVER + '/' + device_id + '/previous', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log(body) // Print the response page.
      }
      res.send(body)
    });
  });
});

// Volume Control
router.post('/volume/:vumark_id/', function(req, res){
  getDeviceIDbyVumarkID(req.params.vumark_id, function(device_id){
    request(SONOS_HTTP_SERVER + '/' + device_id + '/volume/' + req.body.value, function(error, response, body){
      if (!error && response.statusCode == 200) {
          console.log(body) // Print the response page.
          res.send(body);
      }
      else{
        res.send("Error", statusCode=500);
      };
    });
  });
});


/******  TODO FIX THIS TO USE THE CORRECT CALLBACK REQUEST FUNCTION ******/
// Get all sonos devices on the network -- SONOS CALL
router.get('/devices', function(req, res){
  var sonosDevices = {'paired_devices': [], 'unpaired_devices': []} 
  var connectedDevices = {}
  
  // Retrieve all devices paired with the HoloHub, place into a dictionary {device_id: _id}
  request(BASESERVER + ':' +  port + '/sonos/', {timeout: 500}, function(error, response, body){
    if(!error && response.statusCode == 200) {
      var temp1 = JSON.parse(body);
      temp1.forEach(function(arrayItem){
        connectedDevices[arrayItem.device_id] = arrayItem;
      });

      // Discover all sonos devices on the network
      request(SONOS_HTTP_SERVER + '/' + 'zones', {timeout: 500}, function (error1, response, body) {
        if (!error1 && response.statusCode == 200) {
            var sonosRequestData = JSON.parse(body);

            sonosRequestData.forEach( function(arrayItem) {
              //If device name is in connectedDevices, then device is paired -- show w/ it's vumark ID
              if(arrayItem.coordinator.roomName in connectedDevices){
                sonosDevices.paired_devices.push(connectedDevices[arrayItem.coordinator.roomName]);
              }        
              else
              {
                var temp1 = {"device_type": "Sonos Speaker", "device_id": arrayItem.coordinator.roomName}
                sonosDevices.unpaired_devices.push(temp1);
              }
            });
            res.json(sonosDevices);       
        }
        else{
          console.log(error1);
          res.send("Error", statusCode=500);
        };
      });
    }
    else{
      console.log(error);
      res.send("Error " + error, statusCode=500);
    };
  });
});


/** SONOS Socket.IO Push notification service **/

//Server endpoint that recieves state changes from Sonos HTTP Server (Push Notifications)
router.post('/pushnotification', function(req,res){
  //Send state change to Socket.IO connected clients
  var sonosResponse = {};
  // Filter out notification requests such that only song-state changes take place. 
  if(req.body.type == 'transport-state') {
    //Retrieve standardized sonos object value
    getVumakIDbyDeviceID(req.body.data.roomName, function(_id){
    // Igonore devices that haven't been setup in HoloHub
      if (_id != null){
        responseSummary(req.body.data.state, function(responseJson){
          sonosResponse[_id] = responseJson;
          var options = {
            method: 'POST',
            url: BASESERVER + ':' + port + '/socketsend',
            body: sonosResponse,
            json: true
          };
      
          //Send push notification request to /socketsend endpoint (Socket.IO emitter)
          request(options, function (error, response, body) {
            //#### DEBUG ####
            //console.log(sonosResponse)
            //console.log("Push Notification Sent");
            if(error || response.statusCode != 200){
              console.log(error);
            }
          });
          res.send("ok");
        });
      }
      else
        res.send("error");
    });
  };
});


module.exports = router;



/******** BELOW LIES GARBAGE (also known as The EJ Zone)  **************/

// BUT WHY???? Update database entry
// SonosDM.findOneAndUpdate({'device_id': req.body.data.roomName}, sonosResponse[req.body.data.roomName], {new: true}, function(err, sonos){
//   //SonosDM.findOne({'device_id': req.body.data.roomName}, function(err, sonos){
//   if(err){
//     res.send(err);
//   }
//   if(sonos){
//     sonosResponse[req.body.data.roomName] = sonos._doc;
//   }
// });
// Format POST request for /socketsend request on the Server.JS 