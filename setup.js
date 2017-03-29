var request = require('request');


module.exports = {

  supportedDevices: {
        "Sonos Speaker": "Ventana/Prefabs/MusicController",
        "light_bulbs": "Ventana/Prefabs/LightController",
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
    // Get Sonos Data 

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
    // get ids (vumark) that have been used
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
    
   },

   saveNewDevice: function (object, callback) {

        console.log(JSON.stringify(object));
        if (object == null) {
            console.log("ERROR: object to save was NULL");
            return callback(null);
        } else {
            if (object.vendor == "1") {
                // vendor is sonos
                request({
                    method: 'POST',
                    url: BASESERVER + ":" +  port + "/sonos/",
                    body: {
                        '_id' : object._id,
                        'device_id' : object.device_id,
                        'controller' : object.controller
                    }
                }, function(error, response, body){
                    if (error) {
                        return callback(null)
                    } else {
                        return callback({"message": "successfully added sonos object"});
                    }
                });

            } else if (object.vendor == "2") {
                // vendor is wink
                request({
                    method: 'POST',
                    url: BASESERVER + ":" +  port + "/wink/",
                    body: {
                        '_id' : object._id,
                        'device_id' : object.device_id,
                        'device_type': object.device_type,
                        'device_name' : object.device_name
                    }
                }, function(error, response, body){
                    if (error) {
                        return callback(null)
                    } else {
                        return callback({"message": "successfully added wink object"});
                    } 
                });

            } else {
                // vendor not sonos or wink
            }

        }
        
   }

};