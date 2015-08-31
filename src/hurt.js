module.exports = function() {
	this.type = "rect";
	this.name = "hurt";
	this.color = "#C22E2E";
	this.width = 250;
	this.height = 150;
	this.x = 0;
	this.y = 0;
	this.out = false;
	this.remove = false;
	this.opacity = 0.1;
	this.animate = function() {
		if (this.out) this.opacity -= 0.1;
		else this.opacity += 0.1;
		if (this.opacity >= 0.9) this.out = true;
		if (!(this.out && this.opacity == 0.1)) setTimeout(this.animate.bind(this), 10);
		else if (this.out && this.opacity == 0.1) this.remove = true;
	};
	this.onSpawn = function() {
		this.animate();
	};
};
