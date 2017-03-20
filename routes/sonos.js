var express = require('express');
var router = express.Router();
var request = require('request');

var SONOS_HTTP_SERVER = "http://localhost:5005/"

// var morgan     = require('morgan');
//
// // configure app
// app.use(morgan('dev')); // log requests to the console


/* GET test page. */
router.get('/', function(req, res) {
  res.json({ message: 'Connected to Sonos module'});
});

// GET Status
router.get('/status/:device_id', function(req, res) {
  // Toggle Playback
  var sonosRequestData;
  var sonosSendData = {};
  request(SONOS_HTTP_SERVER + req.params.device_id + '/state', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log(body); // Print the response page.
          sonosRequestData = JSON.parse(body);

          sonosSendData["album"] = sonosRequestData.currentTrack.album
          sonosSendData["artist"] = sonosRequestData.currentTrack.artist
          sonosSendData["title"] = sonosRequestData.currentTrack.title
          sonosSendData["current_transport_state"] = sonosRequestData.playbackState
          sonosSendData["uri"] = sonosRequestData.currentTrack.uri
          sonosSendData["playlist_position"] = sonosRequestData.trackNo
          sonosSendData["duration"] = sonosRequestData.currentTrack.duration
          sonosSendData["position"] = sonosRequestData.elapsedTimeFormatted
          sonosSendData["metadata"] = sonosRequestData.elapsedTime
          sonosSendData["album_art"] = sonosRequestData.currentTrack.absoluteAlbumArtUri

          res.json(sonosSendData)
      }
      else {
          res.send("Not Started or Connected")
      }
  })
});

// Toggle playback (Automatically loggles as needed)
router.get('/playtoggle/:device_id', function(req, res) {
  // Toggle Playback
  request('http://localhost:8080/sonos/status/' + req.params.device_id, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        sonosRequestData = JSON.parse(body);
        if (sonosRequestData["current_transport_state"] == 'PAUSED_PLAYBACK'){
          request(SONOS_HTTP_SERVER+'play', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the response page.
            }
          })
          res.send(body)
        }
        else{
          request(SONOS_HTTP_SERVER + 'pause', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the response page.
            }
          })
          res.send(body)
        }
    }
  })
});

// Skip current song
router.get('/foward/:device_id', function(req,res) {
  request(SONOS_HTTP_SERVER + 'next', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body) // Print the response page.
    }
    res.send(body)
  });
});

// Rewind Song/playlist
router.get('/reverse/:device_id', function(req, res){
  request(SONOS_HTTP_SERVER + 'previous', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body) // Print the response page.
    }
    res.send(body)
  });
});

// Get all sonos devices on the network
router.get('/devices', function(req, res){
  var sonosDevices = {'device_list': []} 
  request(SONOS_HTTP_SERVER + 'zones', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var sonosRequestData = JSON.parse(body);
        console.log(body) // Print the response page.

        sonosRequestData.forEach( function (arrayItem)
        {
          sonosDevices.device_list.push(arrayItem.coordinator.roomName);
        });
    }
    res.json(sonosDevices)
  });
});

module.exports = router;
