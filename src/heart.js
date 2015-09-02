var random = require("./rand");
module.exports = function() {
	this.x = 10;
	this.y = 125;
	this.o = {
		x: 0,
		y: 0
	};
	this.width = 15;
	this.height = 13;
	this.name = "heart";
	this.type = "img";
	this.src = "heart.png";
	this.full = true;
	this.shakenum = 0;
	this.shakethres = 10;
	this.shake = function() {
		this.x = this.o.x + random.number(5);
		this.y = this.o.y + random.number(5);
		this.shakenum++;
		if (this.shakenum < this.shakethres) setTimeout(this.shake.bind(this), 20);
		else {
			this.x = this.o.x;
			this.y = this.o.y;
			this.src = "heart-empty.png";
		}
	};
	this.lose = function() {
		this.o.x = this.x;
		this.o.y = this.y;
		this.shake();
		this.full = false;
	};
	this.onSpawn = function(i){
		this.x += (this.width + 2) * i;
	};
};
