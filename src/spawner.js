var random = require("./rand");
module.exports = function(time){
	return 350 + random.number(1800);
};
