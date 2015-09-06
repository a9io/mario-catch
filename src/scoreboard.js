var rules = require("./rules");
module.exports = function(){
	this.type = "text";
	this.name = "score";
	this.font = "sans-serif";
	this.align = "right";
	this.size = 20;
	this.x = rules.side - 10;
	this.y = this.size;
	this.text = "0";
	this.update = function(v){
		this.text = v;
	};
};
