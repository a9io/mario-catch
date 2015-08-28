module.exports = function() {
	this.x = 10;
	this.y = 0;
	this.type = "img";
	this.src = "pipe.png";
	this.width = 12;
	this.height = 16;
	this.path = {
		x: [],
		y: [],
		k: [1]
	};
	this.animation = {
		tick: function() {
			this.y = curve(this.x, this.path);
		},
		begin: function() {
		}
	};
	this.onSpawn = function(){
		this.animation.begin();
	};
};
