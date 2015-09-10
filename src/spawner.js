var random = require("./rand");
var rules = require("./rules");
module.exports = function(time){
	return 350 + (random.number(1800) - (time / rules.spawn));
};
