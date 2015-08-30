var rules = require("./rules");
var audio = require("./audio");
module.exports = function() {
	this.x = 0;
	this.y = 0;
	this.type = "img";
	this.name = "pipe";
	this.src = "pipe.png";
	this.width = 30;
	this.height = 100;
	this.pipen = 0;
	this.active = false;
	this.animating = false;
	this.down = false;
	this.animate = function() {
		this.animating = true;
		this.active = true;
		audio.play("pipe");
		this.tick();
	};
	this.animationDone = function() {
		this.down = false;
		this.animating = false;
		this.active = false;
	};
	this.tick = function() {
		var v;
		if (!this.down) this.y--;
		else this.y++;
		if (this.y == 80) this.down = true;
		if (this.y < 130) setTimeout(this.tick.bind(this), rules.pipedur/50);
		else this.animationDone();
	};
	this.onSpawn = function(n) {
		this.x = rules.pipes[n];
		this.y = 130;
		this.pipen = n;
		this.initEvent();
	};
	this.initEvent = function() {
		var t = this;
		window.addEventListener("keydown", function(e) {
			if (e.which == rules.controls[t.pipen]) {
				if (!t.animating) t.animate();
			}
			else {
				t.animating = true;
				setTimeout(function(){t.animating = false;}, rules.pipedur + 5);
			}
		});
	};
};
