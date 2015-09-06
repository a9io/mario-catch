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
	this.shakesrc = "";
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
			this.shakenum = 0;
			this.src = this.shakesrc;
		}
	};
	this.lose = function() {
		this.o.x = this.x;
		this.o.y = this.y;
		this.shakesrc = "heart-empty.png";
		this.shake();
		this.full = false;
	};
	this.gain = function(){
		this.full = true;
		this.shakesrc = "heart.png";
		this.shake();
	};
	this.onSpawn = function(i){
		this.x += (this.width + 2) * i;
	};
};
