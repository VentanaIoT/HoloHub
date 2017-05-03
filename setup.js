var request = require('request');
var SonosDM = require('./app/models/sonosController');
var WinkDM = require('./app/models/winkController');

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
        if(response.statusCode == 200){
            var responseJson = JSON.parse(body);

            var sonosPaired = responseJson["paired_devices"];
            var sonosUnpaired = responseJson["unpaired_decies"];

            if(sonosPaired){
                paired = paired.concat(sonosPaired);
            }

            if(sonosUnpaired){
                unpaired = unpaired.concat(sonosUnpaired);
            }
        }
        request(BASESERVER + ":" +  port + "/wink/devices", function(error, response, body){
            if(!error){
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
            }
        });  
    });
  },

  // gets a json specific for the HoloLens required config file
  getConfig: function(callback) {

    var configJSON = {}; 

    configJSON["User"] = "VentanaUser"; //hard coded for now, until I know how it updates
    configJSON["VentanaMarks"] = []

    var vmIndex = 0; //uses to index the VentanaMarks

    request(BASESERVER + ":" +  port + "/sonos/devices", function(error, response, body){
        if(response.statusCode == 200){
            var responseJson = JSON.parse(body);
            
            var sonosPaired = responseJson["paired_devices"];

            sonosPaired.forEach(function(item, index) {
                var tempSonos = {};
                tempSonos["id"] = "0x0" + (item._id).toString(16);
                tempSonos["name"] = item.device_name;
                tempSonos["path"] = item.controller;
                configJSON.VentanaMarks[vmIndex] = tempSonos;
                vmIndex++;
            });

        }
        request(BASESERVER + ":" +  port + "/wink/devices", function(error, response, body){
            if(!error){
                var responseJson = JSON.parse(body);
                
                var winkPaired = responseJson["paired_devices"];
                if(winkPaired.length != 0){
                    winkPaired.forEach(function(item, index){
                        var tempWink = {};
                        tempWink["id"] = "0x0" + (item._id).toString(16);
                        tempWink["name"] = item.device_name;
                        tempWink["path"] = item.controller;
                        configJSON.VentanaMarks[vmIndex] = tempWink; 
                        vmIndex++;
                    });
                }
            }
            return callback(configJSON); //even if no paired devices, the structure for config is still sent back  
        });
    });

 
  },

  getSonos: function (callback) {
    // Get Sonos Data 

    var paired = [];
    var unpaired = [];

    request(BASESERVER + ":" +  port + "/sonos/devices", function(error, response, body){
        if(response.statusCode == 200){
            var responseJson = JSON.parse(body);

            var sonosPaired = responseJson["paired_devices"];
            var sonosUnpaired = responseJson["unpaired_devices"];

            if(sonosPaired.length > 0){
                paired = paired.concat(sonosPaired);
            }

            if(sonosUnpaired.length > 0){
                unpaired = unpaired.concat(sonosUnpaired);
            }  

            return callback({"paired": paired, "unpaired": unpaired});
        }
        else {
            return callback({"paired": [], "unpaired": []});
        }
        

    });
  },

  getWink: function (callback) {
    // Get Wink Data 

    var paired = [];
    var unpaired = [];

    request(BASESERVER + ":" +  port + "/wink/devices", function(error, response, body){
        if(error){
            // No Wink Devices Found
            return callback({"paired": [], "unpaired": []});
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
                        'controller' : object.controller,
                        'vendor_logo' : 'https://lh6.googleusercontent.com/-Px2Steg_XRM/AAAAAAAAAAI/AAAAAAAAFa4/kpB3EVdNHGw/s0-c-k-no-ns/photo.jpg'
                    },
                    json: true
                }, function(error, response, body){
                    if (!error && response.statusCode == 200) {
                        return callback(object._id);
                    } else {
                        return callback(null);
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
                        'device_name' : object.device_name,
                        'controller': object.controller,
                        'vendor_logo' : 'https://www.winkapp.com/assets/mediakit/wink-logo-icon-knockout-50235153b274cdf35ef39fb780448596.png',
                        'vendor': object.vendor
                    },
                    json: true
                }, function(error, response, body){
                    if (!error && response.statusCode == 200) {
                        return callback(object._id);
                    } else {
                        return callback(null);
                    } 
                });

            } else {
                // vendor not sonos or wink
                console.log("Incorrect vendor number entered: " + object.vendor + " is not a supported number");
            }

        }
   },

  removeDevice: function(id, callback) {
      //Remove a device. magically. I don't know how this will work. Try/Catch?

      //Is it sonos?
      SonosDM.findById(id, function(err, res){
        if (err | !res){
            WinkDM.findById(id, function(err, res){
                if (err | !res){
                    return callback(null);
                }
            }).remove().exec();
        } else{   // Found in Sonos
            //
        }
      }).remove().exec()

      return callback("ok");
  }
};