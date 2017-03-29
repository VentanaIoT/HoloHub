var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SonosSchema   = new Schema({
    _id: String,			// THIS IS THE Vumark ID
    device_id: String,
    device_type: String,
    device_name: String,    //equal to device_id
	controller: String,
    vendor_logo: String,
    vendor: String
});

module.exports = mongoose.model('SonosDM', SonosSchema);