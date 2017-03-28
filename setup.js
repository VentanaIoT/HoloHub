var request = require('request');



module.exports = {
  getDevices: function (callback) {
    // Get Wink Data 

    var paired = [];
    var unpaired = [];

    request(BASESERVER + ":" +  port + "/sonos/devices", function(error, response, body){
        if(error){
            return callback(null);
        }
        var responseJson = JSON.parse(body);

        var sonosPaired = responseJson["paired_devices"];
        var sonosUnpaired = responseJson["unpaired_decies"];

        if(sonosPaired){
            paired = paired.concat(sonosPaired);
        }

        if(sonosUnpaired){
            unpaired = unpaired.concat(sonosUnpaired);
        }

        request(BASESERVER + ":" +  port + "/wink/devices", function(error, response, body){
            if(error){
                return callback(null);
            }
            var responseJson = JSON.parse(body);

            var winkPaired = responseJson["paired_devices"];
            var winkUnPaired = responseJson["unpaired_devices"];

            if(winkPaired){
                paired = paired.concat(winkPaired);
            }

            if(winkUnPaired){
                unpaired = unpaired.concat(winkUnPaired);
            }

            return callback({"paired": paired, "unpaired": unpaired});

        });

        
    });





  }
};