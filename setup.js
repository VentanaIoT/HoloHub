var request = require('request');



module.exports = {
  getDevices: function (callback) {
    // Get Wink Data 
    request(BASESERVER + ":" +  port + "/sonos/devices", function(error, response, body){
        if(error){
            return callback(null);
        }
        var responseJson = JSON.parse(body);

        var paired = responseJson["paired_devices"];
        var unpaired = responseJson["unpaired_decies"];

        if(paired){
            return callback(paired);
        }

    });

  }
};