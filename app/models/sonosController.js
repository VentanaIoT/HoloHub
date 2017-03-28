var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SonosSchema   = new Schema({
    _id: String,			// THIS IS THE Vumark ID
    device_id: String,
    device_type: String,
	controller: String,
    vendor_logo: String
});

module.exports = mongoose.model('SonosDM', SonosSchema);