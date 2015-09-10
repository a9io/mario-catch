var jsfxr = require("./jsfxr");
var files = {
	pipe: [2, , 0.2, , 0.1753, 0.64, , -0.5261, , , , , , 0.5522, -0.564, , , , 1, , , , , 0.5],
	water: [3,,0.0138,,0.2701,0.4935,,-0.6881,,,,,,,,,,,1,,,,,0.5],
	score: [0,,0.0678,0.4484,0.1648,0.7592,,,,,,,,,,,,,1,,,,,0.5],
	jump: [0,,0.2317,,0.1513,0.3192,,0.2043,,,,,,0.1541,,,,,0.9871,,,0.0876,,0.5],
	heart: [0,,0.01,,0.4384,0.2,,0.12,0.28,1,0.65,,,0.0419,,,,,1,,,,,0.5]
};
module.exports = {
	play: function(f) {
		files[f].play();
	}
};

Object.keys(files).forEach(function(nm) {
	var audio = new Audio();
	audio.src = jsfxr(files[nm]);
	files[nm] = audio;
});
