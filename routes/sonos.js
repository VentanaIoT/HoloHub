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
function getDeviceNamebyID(device_id, callback){
  
  SonosDM.findById(parseInt(device_id), function(err, sonos){
      if (err){
        throw err;
      }
      if (sonos){
        return callback(sonos.deviceName);
      }
      else{
        return callback(null);
      }
    });
};

//Convert a Device ID (the group/device name) to a Vumark ID
function getDeviceIDbyName(deviceName, callback){
  SonosDM.findOne({"deviceName": deviceName}, function(err, sonos){
    if (err){
        throw err;
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

  .get(function(req, res) {

    SonosDM.find(function(err, sonos) {
              if (err)
                  res.send(err);

              res.json(sonos);
          }).select('deviceName');
  })

  .post(function(req, res){ 
    
    /* 
      Process new sonos object POST request. This
      will include the device_id (VuMark ID) and the
      device_name (Sonos API ID "in this case a string")
    */

    // TODO: ######## CHECK TO SEE IF DEVICE ALREADY EXISTS IN RECORD!!!!! ##############
    
    var sonos = new SonosDM();  // Create new instance of a sonos object
    sonos.vumarkID = req.body.device_id
    sonos._id = sonos.vumarkID
    sonos.deviceName = req.body.deviceName

    request(BASESERVER + ":" + port + '/sonos/status/' + sonos.deviceName + '?skiplookup=true', function (error, response, body) {
      if (!error && response.statusCode == 200 && response.body != 'Not Started or Connected') {
          sonosRequestData = JSON.parse(body);
          sonos.album = sonosRequestData.album;
          sonos.artist = sonosRequestData.artist;
          sonos.title = sonosRequestData.title;
          sonos.current_transport_state = sonosRequestData.current_transport_state;
          sonos.uri = sonosRequestData.uri;
          sonos.playlist_position = sonosRequestData.playlist_position;
          sonos.duration = sonosRequestData.duration;
          sonos.position = sonosRequestData.position;
          sonos.metadata = sonosRequestData.metadata;
          sonos.album_art = sonosRequestData.album_art;

          sonos.save(function(err) {
              if (err)
                  res.send(err);

              res.json({ message: 'SonosDM object created!' });
          });     
      }
      else {
            res.send(500, "Not Started or Connected")
      }
    });
  });



//Update Device or Get Device by Vuforia ID
router.route('/byId/:device_id')

  .get(function(req, res){
    //Get the Sonos Object by ID
    SonosDM.findById(parseInt(req.params.device_id), function(err, sonos){
      if (err){
        res.send(err);
      }
      res.json(sonos);
    });
  })

  .put(function(req, res){
    SonosDM.findByIdAndUpdate(parseInt(req.params.device_id), req.body, function(err,sonos){
      if (err){
        res.send(err);
      }
      res.json(sonos);
    });
  });


// GET Status by Vumark ID
router.get('/status/:device_id', function(req, res) {
  // Toggle Playback
  var sonosRequestData;

  //Initial device setup query to get sonos state data
  if(req.query.skiplookup){
     request(SONOS_HTTP_SERVER + "/" + req.params.device_id + '/state', function (error, response, body) {
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
  // Get sonos state data based on a vumark ID
  else
  {
    getDeviceNamebyID(req.params.device_id, function(deviceName){
      request(SONOS_HTTP_SERVER + "/" + deviceName + '/state', function (error, response, body) {
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
router.get('/playtoggle/:device_id', function(req, res) {
  
  // Toggle Playback
  getDeviceNamebyID(req.params.device_id, function(deviceName){

    request(BASESERVER + ':' +  port + '/sonos/status/' + deviceName, function (error, response, body) {
      if (!error && response.statusCode == 200 && response.body != 'Not Started or Connected') {
        sonosRequestData = JSON.parse(body);
        if (sonosRequestData["current_transport_state"] == 'PAUSED_PLAYBACK'){
          request(SONOS_HTTP_SERVER + '/' + deviceName + '/play', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the response page.
            }
          });
          res.send(body);
        }
        else{
          request(SONOS_HTTP_SERVER + '/' + deviceName + '/pause', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the response page.
            }
          });
          res.send(body)
        }
      }
      else {
        res.send(500, "Not Started or Connected")
      }
    });
  });
});

// Skip current song
router.get('/forward/:device_id', function(req,res) {
  getDeviceNamebyID(req.params.device_id, function(deviceName){
    request(SONOS_HTTP_SERVER + '/' + deviceName + '/next', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log(body) // Print the response page.
      }
      res.send(body)
    });
  });
});

// Rewind Song/playlist
router.get('/reverse/:device_id', function(req, res){
  getDeviceNamebyID(req.params.device_id, function(deviceName){
    request(SONOS_HTTP_SERVER + '/' + deviceName + '/previous', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log(body) // Print the response page.
      }
      res.send(body)
    });
  });
});

// Volume Control
router.post('/volume/:device_id/', function(req, res){
  getDeviceNamebyID(req.params.device_id, function(deviceName){
    request(SONOS_HTTP_SERVER + '/' + deviceName + '/volume/' + req.body.value, function(error, response, body){
      if (!error && response.statusCode == 200) {
          console.log(body) // Print the response page.
      }
      res.send(body)
    });
  });
});


/******  TODO FIX THIS TO USE THE CORRECT CALLBACK REQUEST FUNCTION ******/
// Get all sonos devices on the network -- SONOS CALL
router.get('/devices', function(req, res){
  var sonosDevices = {'paired_devices': [], 'unpaired_devices': []} 
  var connectedDevices = {}
  
  // Retrieve all devices paired with the HoloHub, place into a dictionary {deviceName: deviceID}
  request(BASESERVER + ':' +  port + '/sonos/', function(error, response, body){
    if(!error && response.statusCode == 200) {
      var temp1 = JSON.parse(body);
      temp1.forEach(function(arrayItem){
        connectedDevices[arrayItem.deviceName] = arrayItem._id;
      });
    }
    // Discover all sonos devices on the network
    request(SONOS_HTTP_SERVER + '/' + 'zones', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          var sonosRequestData = JSON.parse(body);

          sonosRequestData.forEach( function(arrayItem) {
            //If device name is in connectedDevices, then device is paired -- show w/ it's vumark ID
            if(arrayItem.coordinator.roomName in connectedDevices){
              var temp1 = {};
              temp1[arrayItem.coordinator.roomName] = connectedDevices[arrayItem.coordinator.roomName];
              sonosDevices.paired_devices.push(temp1);
            }        
            else
            {
              sonosDevices.unpaired_devices.push(arrayItem.coordinator.roomName);
            }
          });
          res.json(sonosDevices);       
      };
    });
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
    getDeviceIDbyName(req.body.data.roomName, function(device_id){
    // Igonore devices that haven't been setup in HoloHub
      if (device_id != null){
        responseSummary(req.body.data.state, function(responseJson){
          sonosResponse[device_id] = responseJson;
          var options = {
            method: 'POST',
            url: BASESERVER + ':' + port + '/socketsend',
            body: sonosResponse,
            json: true
          };
      
          //Send push notification request to sonos
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
// SonosDM.findOneAndUpdate({'deviceName': req.body.data.roomName}, sonosResponse[req.body.data.roomName], {new: true}, function(err, sonos){
//   //SonosDM.findOne({'deviceName': req.body.data.roomName}, function(err, sonos){
//   if(err){
//     res.send(err);
//   }
//   if(sonos){
//     sonosResponse[req.body.data.roomName] = sonos._doc;
//   }
// });
// Format POST request for /socketsend request on the Server.JS 