var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var WinkSchema   = new Schema({
    _id: String,			// THIS IS THE Vumark ID
    device_id: String,      // device_id used by Wink
    device_type: String,    // device_type used by Wink
    device_name: String,
	controller: String,      // unnecessary, setup?
    vendor_logo: String,
    vendor: String
});

module.exports = mongoose.model('WinkDM', WinkSchema);