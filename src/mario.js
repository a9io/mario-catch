var curve = require("./curve");
var random = require("./rand");
var rules = require("./rules");
var audio = require("./audio");
module.exports = function() {
	this.width = 12;
	this.height = 17;
	this.opacity = 1;
	this.x = -15;
	this.y = 34 - this.height;
	this.type = "img";
	this.name = "mario";
	this.src = "mario.png";
	this.remove = false;
	this.killed = false;
	this.fading = false;
	this.reached = false;
	this.destpipe = 0;
	this.path = {
		x: [-15, 17, 30],
		y: [34 - this.height, 34 - this.height, 10],
		k: [rules.k, rules.k, rules.k]
	};
	this.generateCurve = function() {
		this.destpipe = random.repnumber(rules.pipes.length, 0);
		var k = rules.k;
		this.path.k = this.path.k.concat([k, k, k]);
		var destx = rules.pipes[this.destpipe] + 15;
		var thres = destx - (random.number(20) + 20);

		//climax
		this.path.y.push(3);
		this.path.x.push(thres / 2);

		//buffer approach
		this.path.y.push(rules.water / 2);
		this.path.x.push(thres);

		//destination
		this.path.y.push(rules.water);
		this.path.x.push(destx);
	};
	this.explode = function() {
		audio.play("bomb");
		this.fading = true;
		this.type = "rect";
		this.color = "#FFFFFF";
		this.width = rules.side;
		this.height = rules.bottom;
		this.x = 0;
		this.y = 0;
		this.fadeOut();
	};
	this.tick = function() {
		if (this.x > this.path.x[1]) this.y = curve(this.x, this.path); // curve if not on deck
		if (this.x == this.path.x[1] + 10) {
			if(this.name == "bomb") audio.play("sizzle");
			else audio.play("jump");
		}
		this.x++;
		if (this.y < rules.water && !this.fading) setTimeout(this.tick.bind(this), 10);
		else if (!this.reached) {
			this.fading = true;
			if (this.name != "bomb") audio.play("water");
			this.fadeOut();
		}
	};
	this.fadeOut = function() {
		this.opacity -= 0.1;
		if (this.opacity > 0.1) setTimeout(this.fadeOut.bind(this), 50);
		else this.remove = true;
	};
	this.begin = function() {
		this.generateCurve();
		this.tick();
	};
	this.onSpawn = function(heart) {
		if (random.repnumber(rules.heartspawn, 1) == 1 && heart) {
			this.name = "heartp";
			this.src = "heartp.png";
			this.width = 10;
			this.height = 9;
		} else if (random.repnumber(rules.bombspawn, 2) == 1) {
			this.name = "bomb";
			this.src = "bomb.png";
			this.width = 12;
			this.height = 14;
		}
		this.begin();
	};
};
