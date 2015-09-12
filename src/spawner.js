var random = require("./rand");
var rules = require("./rules");
module.exports = function(time){
	var val = (random.number(1800 - (time / rules.spawn)));
	if (val < 0) val = 0;
	return 350 + val;
};
