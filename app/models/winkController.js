var mongoose     = require('mongoose');
//var Parent       = mongoose.model('Parent', ) 
var Schema       = mongoose.Schema;

var WinkSchema   = new Schema({
    _id: String,			// THIS IS THE Vumark ID
    device_id: String,      // device_id used by Wink
    device_type: String,    // device_type used by Wink
	controller: String      // unnecessary, setup?
});

/*var PowerstripSchema = new Schema({

});

var LightSchema = new Schema({

});*/

module.exports = mongoose.model('WinkDM', WinkSchema);