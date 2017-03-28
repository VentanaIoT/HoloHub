var request = require('request');


module.exports = {

  supportedDevices: {
        "Sonos Speaker": "Ventana/Prefabs/MusicController",
        "light_bulb": "Ventana/Prefabs/LightController",
        "powerstrips":"Ventana/Prefabs/PowerStripController"
    },

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
  },

  getSonos: function (callback) {
    // Get Wink Data 

    var paired = [];
    var unpaired = [];

    request(BASESERVER + ":" +  port + "/sonos/devices", function(error, response, body){
        if(error){
            return callback(null);
        }
        var responseJson = JSON.parse(body);

        var sonosPaired = responseJson["paired_devices"];
        var sonosUnpaired = responseJson["unpaired_devices"];

        if(sonosPaired){
            paired = paired.concat(sonosPaired);
        }

        if(sonosUnpaired){
            unpaired = unpaired.concat(sonosUnpaired);
        }  

        return callback({"paired": paired, "unpaired": unpaired});

    });
  },

  getWink: function (callback) {
    // Get Wink Data 

    var paired = [];
    var unpaired = [];

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
    
  },

  getUsedIds: function (callback) {
    var ids = []
    var SonosDM = require('./app/models/sonosController');
    var WinkDM = require('./app/models/winkController');

    WinkDM.find(function(err, wink) {
        if (!err){
            wink.forEach(function(id){
                ids.push(id["_doc"]["_id"])
            });
                SonosDM.find(function(err, sonos) {
                if (!err){
                    sonos.forEach(function(id){
                        ids.push(id["_doc"]["_id"])
                    });

                    return callback(ids);
                }
            }).select('_id');
        }
    }).select('_id');
    

    


        // return callback(ids);

      
  }
};