var curve = require("./curve");
var random = require("./rand");
var rules = require("./rules");
var audio = require("./audio");
module.exports = function() {
	this.width = 12;
	this.height = 16;
	this.x = -15;
	this.y = 34 - this.height;
	this.type = "img";
	this.name = "mario";
	this.src = "mario.png";
	this.lost = false;
	this.destpipe = 0;
	this.path = {
		x: [-15, 17, 30],
		y: [34-this.height, 34 - this.height, 10],
		k: [rules.k, rules.k, rules.k]
	};
	this.generateCurve = function() {
		this.destpipe = random.number(rules.pipes.length);
		var k = rules.k;
		this.path.k = this.path.k.concat([k, k, k]);
		var destx = rules.pipes[this.destpipe] + 15;
		var thres = destx - (random.number(26) + 10);
		//var thres = destx - 20;

		//climax
		this.path.y.push(3);
		this.path.x.push(thres/2);

		//buffer approach
		this.path.y.push(rules.water/2);
		this.path.x.push(thres);

		//destination
		this.path.y.push(rules.water);
		this.path.x.push(destx);
	};
	this.tick = function() {
		if(this.x > this.path.x[1]) this.y = curve(this.x, this.path); // curve if not on deck
		if(this.x == this.path.x[1] + 10) audio.play("jump");
		this.x++;
		if(this.y <= rules.water) setTimeout(this.tick.bind(this), 10);
		else {
			this.lost = true;
		}
	};
	this.begin = function() {
		this.generateCurve();
		this.tick();
	};
	this.onSpawn = function() {
		this.begin();
	};
};
