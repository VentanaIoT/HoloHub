var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SonosSchema   = new Schema({
    _id: Number,
	vumarkID: Number,
    deviceName: String,
	album: String,
	artist: String,
	title: String,
	current_transport_state: String,
	uri: String,
	playlist_position: Number,
	duration: Number,
	position: String,
	metadata: Number,
	album_art: String
});

module.exports = mongoose.model('SonosDM', SonosSchema);