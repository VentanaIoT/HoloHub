var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SonosSchema   = new Schema({
    _id: String,			// THIS IS THE Vumark ID
    device_id: String,
	controller: String
});

module.exports = mongoose.model('SonosDM', SonosSchema);