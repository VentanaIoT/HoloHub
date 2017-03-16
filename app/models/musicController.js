var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MusicSchema   = new Schema({
	name: String
});

module.exports = mongoose.model('Music', MusicSchema);