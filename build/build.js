(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var render = require("./renderer");
var raf = require("./raf");
var audio = require("./audio");
var State = require("./state");
var rules = require("./rules");
var spawner = require("./spawner");
var state = new State();
state.createPipes();
state.createScore();
state.createWater();
state.createHearts();

var spawn = function() {
	if (!state.losing) {
		state.createMario();
		var t = spawner(state.time);
		state.time += t;
		setTimeout(spawn, t);
	}
};

var checkLoop = function() {
	var pipes = state.pipes;
		state.sprites.forEach(function(s, i) {
			if (s.name == "mario") {
				var p = pipes[s.destpipe];
				if (s.remove) {
					state.sprites.splice(i, 1);
				} else if (s.fading && !s.killed) {
					state.lost();
					s.killed = true;
				} else if (p.active && (s.x > p.x && s.x < p.x + 30) && (s.y >= p.y) && !(s.fading) && !(state.losing)) {
					s.reached = true;
					state.sprites.splice(i, 1);
					audio.play("score");
					state.gained();
				}
			} else if (s.remove) {
				state.sprites.splice(i, 1);
			}
		});
		setTimeout(checkLoop, 10);
};

setTimeout(spawn, rules.beginDelay);
checkLoop();

raf.start(function(e) {
	render(state);
});

},{"./audio":2,"./raf":7,"./renderer":9,"./rules":10,"./spawner":12,"./state":13}],2:[function(require,module,exports){
var names = ["jump", "pipe", "water", "score"];
var files = {};
module.exports = {
	play: function(f) {
		files[f].play();
	}
};

names.forEach(function(nm) {
	files[nm] = new Audio("assets/" + nm + ".wav");
});

},{}],3:[function(require,module,exports){
module.exports = function(x, path){
	CSPL.getNaturalKs(path.x, path.y, path.k);
	return CSPL.evalSpline(x, path.x, path.y, path.k);
};

//CSPL Script by Ivan K, Adapted for the game
var CSPL = function() {};
CSPL._gaussJ = {};
CSPL._gaussJ.solve = function(A, x) // in Matrix, out solutions
	{
		var m = A.length;
		for (var k = 0; k < m; k++) // column
		{
			// pivot for column
			var i_max = 0;
			var vali = Number.NEGATIVE_INFINITY;
			for (var i = k; i < m; i++)
				if (A[i][k] > vali) {
					i_max = i;
					vali = A[i][k];
				}
			CSPL._gaussJ.swapRows(A, k, i_max);
			// for all rows below pivot
			for (var i = k + 1; i < m; i++) {
				for (var j = k + 1; j < m + 1; j++)
					A[i][j] = A[i][j] - A[k][j] * (A[i][k] / A[k][k]);
				A[i][k] = 0;
			}
		}

		for (var i = m - 1; i >= 0; i--) // rows = columns
		{
			var v = A[i][m] / A[i][i];
			x[i] = v;
			for (var j = i - 1; j >= 0; j--) // rows
			{
				A[j][m] -= A[j][i] * v;
				A[j][i] = 0;
			}
		}
	};
CSPL._gaussJ.zerosMat = function(r, c) {
	var A = [];
	for (var i = 0; i < r; i++) {
		A.push([]);
		for (var j = 0; j < c; j++) A[i].push(0);
	}
	return A;
};
CSPL._gaussJ.printMat = function(A) {
	for (var i = 0; i < A.length; i++) console.log(A[i]);
};
CSPL._gaussJ.swapRows = function(m, k, l) {
	var p = m[k];
	m[k] = m[l];
	m[l] = p;
};
CSPL.getNaturalKs = function(xs, ys, ks) // in x values, in y values, out k values
	{
		var n = xs.length - 1;
		var A = CSPL._gaussJ.zerosMat(n + 1, n + 2);

		for (var i = 1; i < n; i++) // rows
		{
			A[i][i - 1] = 1 / (xs[i] - xs[i - 1]);

			A[i][i] = 2 * (1 / (xs[i] - xs[i - 1]) + 1 / (xs[i + 1] - xs[i]));

			A[i][i + 1] = 1 / (xs[i + 1] - xs[i]);

			A[i][n + 1] = 3 * ((ys[i] - ys[i - 1]) / ((xs[i] - xs[i - 1]) * (xs[i] - xs[i - 1])) + (ys[i + 1] - ys[i]) / ((xs[i + 1] - xs[i]) * (xs[i + 1] - xs[i])));
		}

		A[0][0] = 2 / (xs[1] - xs[0]);
		A[0][1] = 1 / (xs[1] - xs[0]);
		A[0][n + 1] = 3 * (ys[1] - ys[0]) / ((xs[1] - xs[0]) * (xs[1] - xs[0]));

		A[n][n - 1] = 1 / (xs[n] - xs[n - 1]);
		A[n][n] = 2 / (xs[n] - xs[n - 1]);
		A[n][n + 1] = 3 * (ys[n] - ys[n - 1]) / ((xs[n] - xs[n - 1]) * (xs[n] - xs[n - 1]));

		CSPL._gaussJ.solve(A, ks);
	};
CSPL.evalSpline = function(x, xs, ys, ks) {
	var i = 1;
	while (xs[i] < x) i++;

	var t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);

	var a = ks[i - 1] * (xs[i] - xs[i - 1]) - (ys[i] - ys[i - 1]);
	var b = -ks[i] * (xs[i] - xs[i - 1]) + (ys[i] - ys[i - 1]);

	var q = (1 - t) * ys[i - 1] + t * ys[i] + t * (1 - t) * (a * (1 - t) + b * t);
	return q;
};

},{}],4:[function(require,module,exports){
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

},{"./rand":8}],5:[function(require,module,exports){
var curve = require("./curve");
var random = require("./rand");
var rules = require("./rules");
var audio = require("./audio");
module.exports = function() {
	this.width = 12;
	this.height = 16;
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
		this.destpipe = random.repnumber(rules.pipes.length);
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
	this.tick = function() {
		if (this.x > this.path.x[1]) this.y = curve(this.x, this.path); // curve if not on deck
		if (this.x == this.path.x[1] + 10) audio.play("jump");
		this.x++;
		if (this.y < rules.water) setTimeout(this.tick.bind(this), 10);
		else if (!this.reached) {
			this.fading = true;
			audio.play("water");
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
	this.onSpawn = function() {
		this.begin();
	};
};

},{"./audio":2,"./curve":3,"./rand":8,"./rules":10}],6:[function(require,module,exports){
var rules = require("./rules");
var audio = require("./audio");
var canvas = document.getElementById("c");
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
		if (this.y < 130) setTimeout(this.tick.bind(this), rules.pipedur / 50);
		else if (this.y == 130) this.animationDone();
	};
	this.rise = function(){
		this.y--;
		if(this.y > 130) setTimeout(this.rise.bind(this), rules.beginDelay / 100);
		else this.initEvent();
	};
	this.onSpawn = function(n) {
		this.x = rules.pipes[n];
		this.y = rules.bottom-120;
		this.pipen = n;
		this.rise();
	};
	this.key = function(e) {
		if (!this.animating) {
			if (e.which == rules.controls[this.pipen]) {
				this.animate();
			}
		}
	};
	this.touch = function(e) {
		var x = (e.x - canvas.offsetLeft) / rules.scale;
		var y = (e.y - canvas.offsetTop) / rules.scale;
		if (!this.animating) {
			if (x >= this.x && x <= this.x + 30) {
				this.animate();
			}
		}
	};
	this.initEvent = function() {
		var t = this;
		window.addEventListener("keydown", function(e) {
			t.key(e);
		});
		canvas.addEventListener("mousedown", function(e) {
			t.touch(e);
		}, false);
	};
};

},{"./audio":2,"./rules":10}],7:[function(require,module,exports){
// Holds last iteration timestamp.
var time = 0;

/**
 * Calls `fn` on next frame.
 *
 * @param  {Function} fn The function
 * @return {int} The request ID
 * @api private
 */
function raf(fn) {
  return window.requestAnimationFrame(function() {
    var now = Date.now();
    var elapsed = now - time;

    if (elapsed > 999) {
      elapsed = 1 / 60;
    } else {
      elapsed /= 1000;
    }

    time = now;
    fn(elapsed);
  });
}

module.exports = {
  /**
   * Calls `fn` on every frame with `elapsed` set to the elapsed
   * time in milliseconds.
   *
   * @param  {Function} fn The function
   * @return {int} The request ID
   * @api public
   */
  start: function(fn) {
    return raf(function tick(elapsed) {
      fn(elapsed);
      raf(tick);
    });
  },
  /**
   * Cancels the specified animation frame request.
   *
   * @param {int} id The request ID
   * @api public
   */
  stop: function(id) {
    window.cancelAnimationFrame(id);
  }
};

},{}],8:[function(require,module,exports){
var prev;
module.exports = {
	number: function(max) { //returns between 0 and max - 1
		return Math.floor(Math.random() * max);
	},
	repnumber: function(max) { //same as number but non-repeating
		var res = Math.floor(Math.random() * max);
		if (res == prev) {
			if (res > 0) res -= 1;  //yes very cheap
			else res = 1;
		}
		prev = res;
		return res;
	}
};

},{}],9:[function(require,module,exports){
var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothlocingEnabled = false;

module.exports = function(state) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.scale(state.scale, state.scale);
	state.sprites.forEach(function(s) {
		if (s.opacity) ctx.globalAlpha = s.opacity;
		else ctx.globalAlpha = 1;
		switch (s.type) {
			case "rect":
				ctx.fillStyle = s.color;
				ctx.fillRect(s.x, s.y, s.width, s.height);
				break;
			case "img":
				var img = new Image();
				img.src = "assets/" + s.src;
				ctx.drawImage(img, s.x, s.y, s.width, s.height);
				break;
			case "text":
				ctx.font = s.size + "px " + s.font;
				ctx.textAlign = s.align;
				ctx.fillStyle = s.color;
				ctx.fillText(s.text, s.x, s.y);
				break;
		}
	});
};

},{}],10:[function(require,module,exports){
module.exports = {
	bottom: 300,
	side: 250,
	water: 115,
	pipes: [
		90,
		145,
		200
	],
	controls: [
		81,
		87,
		69
	],
	k: 0.01,
	pipedur: 250,
	scale: 2,
	beginDelay: 2000
};

},{}],11:[function(require,module,exports){
var rules = require("./rules");
module.exports = function(){
	this.type = "text";
	this.name = "score";
	this.font = "sans-serif";
	this.color = "#FFFFFF";
	this.align = "right";
	this.size = 20;
	this.x = rules.side - 10;
	this.y = this.size;
	this.text = "0";
	this.update = function(v){
		this.text = v;
	};
};

},{"./rules":10}],12:[function(require,module,exports){
var random = require("./rand");
module.exports = function(time){
	return 350 + random.number(1800);
};

},{"./rand":8}],13:[function(require,module,exports){
var Mario = require("./mario");
var Pipe = require("./pipe");
var Scoreboard = require("./scoreboard");
var Heart = require("./heart");
//var Hurt = require("./hurt");
var rules = require("./rules");
module.exports = function() {
	this.scale = rules.scale;
	this.time = 1;
	this.score = 0;
	this.lives = 3;
	this.losing = false;
	this.scoreboard = {};
	this.hearts = [];
	this.pipes = [];
	this.sprites = [{
		type: "rect",
		name: "sky",
		color: "#5C94FC",
		width: 250,
		height: 150,
		x: 0,
		y: 0
	}, {
		type: "img",
		name: "blocks",
		src: "blocks.png",
		x: 0,
		y: 34,
		width: 34,
		height: 17
	}];
	this.createMario = function() {
		var mario = new Mario();
		mario.onSpawn();
		//var dbc = require("../debug/curve");
		//this.sprites = this.sprites.concat(dbc(mario.path));
		this.sprites.splice(1, 0, mario);
	};
	this.createPipes = function() {
		for (var i = 0; i < rules.pipes.length; i++) {
			var pipe = new Pipe();
			pipe.onSpawn(i);
			this.pipes.push(pipe);
			this.sprites.push(this.pipes[i]);
		}
	};
	this.createHearts = function() {
		for (var i = 0; i < 3; i++) {
			var heart = new Heart();
			heart.onSpawn(i);
			this.hearts.push(heart);
			this.sprites.push(this.hearts[i]);
		}
	};
	this.createWater = function() {
		this.sprites.push({
			type: "rect",
			name: "water",
			color: "#15DCE2",
			opacity: 0.5,
			y: rules.water,
			x: 0,
			width: 300,
			height: 35
		});
	};
	this.createScore = function() {
		this.scoreboard = new Scoreboard();
		this.sprites.push(this.scoreboard);
	};
	this.lost = function() {
		if (this.lives > 0) {
			this.lives--;
			this.hearts[this.lives].lose();
		}
		if(this.lives === 0){
			this.losing = true;
		}
	};
	this.gained = function() {
		this.score++;
		this.scoreboard.update(this.score);
	};
};

},{"./heart":4,"./mario":5,"./pipe":6,"./rules":10,"./scoreboard":11}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9hdWRpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL2hlYXJ0LmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9tYXJpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcGlwZS5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcmFmLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yYW5kLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yZW5kZXJlci5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcnVsZXMuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3Njb3JlYm9hcmQuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3NwYXduZXIuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3N0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHJlbmRlciA9IHJlcXVpcmUoXCIuL3JlbmRlcmVyXCIpO1xudmFyIHJhZiA9IHJlcXVpcmUoXCIuL3JhZlwiKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpO1xudmFyIFN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVcIik7XG52YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbnZhciBzcGF3bmVyID0gcmVxdWlyZShcIi4vc3Bhd25lclwiKTtcbnZhciBzdGF0ZSA9IG5ldyBTdGF0ZSgpO1xuc3RhdGUuY3JlYXRlUGlwZXMoKTtcbnN0YXRlLmNyZWF0ZVNjb3JlKCk7XG5zdGF0ZS5jcmVhdGVXYXRlcigpO1xuc3RhdGUuY3JlYXRlSGVhcnRzKCk7XG5cbnZhciBzcGF3biA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXN0YXRlLmxvc2luZykge1xuXHRcdHN0YXRlLmNyZWF0ZU1hcmlvKCk7XG5cdFx0dmFyIHQgPSBzcGF3bmVyKHN0YXRlLnRpbWUpO1xuXHRcdHN0YXRlLnRpbWUgKz0gdDtcblx0XHRzZXRUaW1lb3V0KHNwYXduLCB0KTtcblx0fVxufTtcblxudmFyIGNoZWNrTG9vcCA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcGlwZXMgPSBzdGF0ZS5waXBlcztcblx0XHRzdGF0ZS5zcHJpdGVzLmZvckVhY2goZnVuY3Rpb24ocywgaSkge1xuXHRcdFx0aWYgKHMubmFtZSA9PSBcIm1hcmlvXCIpIHtcblx0XHRcdFx0dmFyIHAgPSBwaXBlc1tzLmRlc3RwaXBlXTtcblx0XHRcdFx0aWYgKHMucmVtb3ZlKSB7XG5cdFx0XHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAocy5mYWRpbmcgJiYgIXMua2lsbGVkKSB7XG5cdFx0XHRcdFx0c3RhdGUubG9zdCgpO1xuXHRcdFx0XHRcdHMua2lsbGVkID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIGlmIChwLmFjdGl2ZSAmJiAocy54ID4gcC54ICYmIHMueCA8IHAueCArIDMwKSAmJiAocy55ID49IHAueSkgJiYgIShzLmZhZGluZykgJiYgIShzdGF0ZS5sb3NpbmcpKSB7XG5cdFx0XHRcdFx0cy5yZWFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRzdGF0ZS5zcHJpdGVzLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRhdWRpby5wbGF5KFwic2NvcmVcIik7XG5cdFx0XHRcdFx0c3RhdGUuZ2FpbmVkKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAocy5yZW1vdmUpIHtcblx0XHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0c2V0VGltZW91dChjaGVja0xvb3AsIDEwKTtcbn07XG5cbnNldFRpbWVvdXQoc3Bhd24sIHJ1bGVzLmJlZ2luRGVsYXkpO1xuY2hlY2tMb29wKCk7XG5cbnJhZi5zdGFydChmdW5jdGlvbihlKSB7XG5cdHJlbmRlcihzdGF0ZSk7XG59KTtcbiIsInZhciBuYW1lcyA9IFtcImp1bXBcIiwgXCJwaXBlXCIsIFwid2F0ZXJcIiwgXCJzY29yZVwiXTtcbnZhciBmaWxlcyA9IHt9O1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHBsYXk6IGZ1bmN0aW9uKGYpIHtcblx0XHRmaWxlc1tmXS5wbGF5KCk7XG5cdH1cbn07XG5cbm5hbWVzLmZvckVhY2goZnVuY3Rpb24obm0pIHtcblx0ZmlsZXNbbm1dID0gbmV3IEF1ZGlvKFwiYXNzZXRzL1wiICsgbm0gKyBcIi53YXZcIik7XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oeCwgcGF0aCl7XG5cdENTUEwuZ2V0TmF0dXJhbEtzKHBhdGgueCwgcGF0aC55LCBwYXRoLmspO1xuXHRyZXR1cm4gQ1NQTC5ldmFsU3BsaW5lKHgsIHBhdGgueCwgcGF0aC55LCBwYXRoLmspO1xufTtcblxuLy9DU1BMIFNjcmlwdCBieSBJdmFuIEssIEFkYXB0ZWQgZm9yIHRoZSBnYW1lXG52YXIgQ1NQTCA9IGZ1bmN0aW9uKCkge307XG5DU1BMLl9nYXVzc0ogPSB7fTtcbkNTUEwuX2dhdXNzSi5zb2x2ZSA9IGZ1bmN0aW9uKEEsIHgpIC8vIGluIE1hdHJpeCwgb3V0IHNvbHV0aW9uc1xuXHR7XG5cdFx0dmFyIG0gPSBBLmxlbmd0aDtcblx0XHRmb3IgKHZhciBrID0gMDsgayA8IG07IGsrKykgLy8gY29sdW1uXG5cdFx0e1xuXHRcdFx0Ly8gcGl2b3QgZm9yIGNvbHVtblxuXHRcdFx0dmFyIGlfbWF4ID0gMDtcblx0XHRcdHZhciB2YWxpID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuXHRcdFx0Zm9yICh2YXIgaSA9IGs7IGkgPCBtOyBpKyspXG5cdFx0XHRcdGlmIChBW2ldW2tdID4gdmFsaSkge1xuXHRcdFx0XHRcdGlfbWF4ID0gaTtcblx0XHRcdFx0XHR2YWxpID0gQVtpXVtrXTtcblx0XHRcdFx0fVxuXHRcdFx0Q1NQTC5fZ2F1c3NKLnN3YXBSb3dzKEEsIGssIGlfbWF4KTtcblx0XHRcdC8vIGZvciBhbGwgcm93cyBiZWxvdyBwaXZvdFxuXHRcdFx0Zm9yICh2YXIgaSA9IGsgKyAxOyBpIDwgbTsgaSsrKSB7XG5cdFx0XHRcdGZvciAodmFyIGogPSBrICsgMTsgaiA8IG0gKyAxOyBqKyspXG5cdFx0XHRcdFx0QVtpXVtqXSA9IEFbaV1bal0gLSBBW2tdW2pdICogKEFbaV1ba10gLyBBW2tdW2tdKTtcblx0XHRcdFx0QVtpXVtrXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IG0gLSAxOyBpID49IDA7IGktLSkgLy8gcm93cyA9IGNvbHVtbnNcblx0XHR7XG5cdFx0XHR2YXIgdiA9IEFbaV1bbV0gLyBBW2ldW2ldO1xuXHRcdFx0eFtpXSA9IHY7XG5cdFx0XHRmb3IgKHZhciBqID0gaSAtIDE7IGogPj0gMDsgai0tKSAvLyByb3dzXG5cdFx0XHR7XG5cdFx0XHRcdEFbal1bbV0gLT0gQVtqXVtpXSAqIHY7XG5cdFx0XHRcdEFbal1baV0gPSAwO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbkNTUEwuX2dhdXNzSi56ZXJvc01hdCA9IGZ1bmN0aW9uKHIsIGMpIHtcblx0dmFyIEEgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCByOyBpKyspIHtcblx0XHRBLnB1c2goW10pO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgYzsgaisrKSBBW2ldLnB1c2goMCk7XG5cdH1cblx0cmV0dXJuIEE7XG59O1xuQ1NQTC5fZ2F1c3NKLnByaW50TWF0ID0gZnVuY3Rpb24oQSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IEEubGVuZ3RoOyBpKyspIGNvbnNvbGUubG9nKEFbaV0pO1xufTtcbkNTUEwuX2dhdXNzSi5zd2FwUm93cyA9IGZ1bmN0aW9uKG0sIGssIGwpIHtcblx0dmFyIHAgPSBtW2tdO1xuXHRtW2tdID0gbVtsXTtcblx0bVtsXSA9IHA7XG59O1xuQ1NQTC5nZXROYXR1cmFsS3MgPSBmdW5jdGlvbih4cywgeXMsIGtzKSAvLyBpbiB4IHZhbHVlcywgaW4geSB2YWx1ZXMsIG91dCBrIHZhbHVlc1xuXHR7XG5cdFx0dmFyIG4gPSB4cy5sZW5ndGggLSAxO1xuXHRcdHZhciBBID0gQ1NQTC5fZ2F1c3NKLnplcm9zTWF0KG4gKyAxLCBuICsgMik7XG5cblx0XHRmb3IgKHZhciBpID0gMTsgaSA8IG47IGkrKykgLy8gcm93c1xuXHRcdHtcblx0XHRcdEFbaV1baSAtIDFdID0gMSAvICh4c1tpXSAtIHhzW2kgLSAxXSk7XG5cblx0XHRcdEFbaV1baV0gPSAyICogKDEgLyAoeHNbaV0gLSB4c1tpIC0gMV0pICsgMSAvICh4c1tpICsgMV0gLSB4c1tpXSkpO1xuXG5cdFx0XHRBW2ldW2kgKyAxXSA9IDEgLyAoeHNbaSArIDFdIC0geHNbaV0pO1xuXG5cdFx0XHRBW2ldW24gKyAxXSA9IDMgKiAoKHlzW2ldIC0geXNbaSAtIDFdKSAvICgoeHNbaV0gLSB4c1tpIC0gMV0pICogKHhzW2ldIC0geHNbaSAtIDFdKSkgKyAoeXNbaSArIDFdIC0geXNbaV0pIC8gKCh4c1tpICsgMV0gLSB4c1tpXSkgKiAoeHNbaSArIDFdIC0geHNbaV0pKSk7XG5cdFx0fVxuXG5cdFx0QVswXVswXSA9IDIgLyAoeHNbMV0gLSB4c1swXSk7XG5cdFx0QVswXVsxXSA9IDEgLyAoeHNbMV0gLSB4c1swXSk7XG5cdFx0QVswXVtuICsgMV0gPSAzICogKHlzWzFdIC0geXNbMF0pIC8gKCh4c1sxXSAtIHhzWzBdKSAqICh4c1sxXSAtIHhzWzBdKSk7XG5cblx0XHRBW25dW24gLSAxXSA9IDEgLyAoeHNbbl0gLSB4c1tuIC0gMV0pO1xuXHRcdEFbbl1bbl0gPSAyIC8gKHhzW25dIC0geHNbbiAtIDFdKTtcblx0XHRBW25dW24gKyAxXSA9IDMgKiAoeXNbbl0gLSB5c1tuIC0gMV0pIC8gKCh4c1tuXSAtIHhzW24gLSAxXSkgKiAoeHNbbl0gLSB4c1tuIC0gMV0pKTtcblxuXHRcdENTUEwuX2dhdXNzSi5zb2x2ZShBLCBrcyk7XG5cdH07XG5DU1BMLmV2YWxTcGxpbmUgPSBmdW5jdGlvbih4LCB4cywgeXMsIGtzKSB7XG5cdHZhciBpID0gMTtcblx0d2hpbGUgKHhzW2ldIDwgeCkgaSsrO1xuXG5cdHZhciB0ID0gKHggLSB4c1tpIC0gMV0pIC8gKHhzW2ldIC0geHNbaSAtIDFdKTtcblxuXHR2YXIgYSA9IGtzW2kgLSAxXSAqICh4c1tpXSAtIHhzW2kgLSAxXSkgLSAoeXNbaV0gLSB5c1tpIC0gMV0pO1xuXHR2YXIgYiA9IC1rc1tpXSAqICh4c1tpXSAtIHhzW2kgLSAxXSkgKyAoeXNbaV0gLSB5c1tpIC0gMV0pO1xuXG5cdHZhciBxID0gKDEgLSB0KSAqIHlzW2kgLSAxXSArIHQgKiB5c1tpXSArIHQgKiAoMSAtIHQpICogKGEgKiAoMSAtIHQpICsgYiAqIHQpO1xuXHRyZXR1cm4gcTtcbn07XG4iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMueCA9IDEwO1xuXHR0aGlzLnkgPSAxMjU7XG5cdHRoaXMubyA9IHtcblx0XHR4OiAwLFxuXHRcdHk6IDBcblx0fTtcblx0dGhpcy53aWR0aCA9IDE1O1xuXHR0aGlzLmhlaWdodCA9IDEzO1xuXHR0aGlzLm5hbWUgPSBcImhlYXJ0XCI7XG5cdHRoaXMudHlwZSA9IFwiaW1nXCI7XG5cdHRoaXMuc3JjID0gXCJoZWFydC5wbmdcIjtcblx0dGhpcy5mdWxsID0gdHJ1ZTtcblx0dGhpcy5zaGFrZW51bSA9IDA7XG5cdHRoaXMuc2hha2V0aHJlcyA9IDEwO1xuXHR0aGlzLnNoYWtlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy54ID0gdGhpcy5vLnggKyByYW5kb20ubnVtYmVyKDUpO1xuXHRcdHRoaXMueSA9IHRoaXMuby55ICsgcmFuZG9tLm51bWJlcig1KTtcblx0XHR0aGlzLnNoYWtlbnVtKys7XG5cdFx0aWYgKHRoaXMuc2hha2VudW0gPCB0aGlzLnNoYWtldGhyZXMpIHNldFRpbWVvdXQodGhpcy5zaGFrZS5iaW5kKHRoaXMpLCAyMCk7XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnggPSB0aGlzLm8ueDtcblx0XHRcdHRoaXMueSA9IHRoaXMuby55O1xuXHRcdFx0dGhpcy5zcmMgPSBcImhlYXJ0LWVtcHR5LnBuZ1wiO1xuXHRcdH1cblx0fTtcblx0dGhpcy5sb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vLnggPSB0aGlzLng7XG5cdFx0dGhpcy5vLnkgPSB0aGlzLnk7XG5cdFx0dGhpcy5zaGFrZSgpO1xuXHRcdHRoaXMuZnVsbCA9IGZhbHNlO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbihpKXtcblx0XHR0aGlzLnggKz0gKHRoaXMud2lkdGggKyAyKSAqIGk7XG5cdH07XG59O1xuIiwidmFyIGN1cnZlID0gcmVxdWlyZShcIi4vY3VydmVcIik7XG52YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLndpZHRoID0gMTI7XG5cdHRoaXMuaGVpZ2h0ID0gMTY7XG5cdHRoaXMub3BhY2l0eSA9IDE7XG5cdHRoaXMueCA9IC0xNTtcblx0dGhpcy55ID0gMzQgLSB0aGlzLmhlaWdodDtcblx0dGhpcy50eXBlID0gXCJpbWdcIjtcblx0dGhpcy5uYW1lID0gXCJtYXJpb1wiO1xuXHR0aGlzLnNyYyA9IFwibWFyaW8ucG5nXCI7XG5cdHRoaXMucmVtb3ZlID0gZmFsc2U7XG5cdHRoaXMua2lsbGVkID0gZmFsc2U7XG5cdHRoaXMuZmFkaW5nID0gZmFsc2U7XG5cdHRoaXMucmVhY2hlZCA9IGZhbHNlO1xuXHR0aGlzLmRlc3RwaXBlID0gMDtcblx0dGhpcy5wYXRoID0ge1xuXHRcdHg6IFstMTUsIDE3LCAzMF0sXG5cdFx0eTogWzM0IC0gdGhpcy5oZWlnaHQsIDM0IC0gdGhpcy5oZWlnaHQsIDEwXSxcblx0XHRrOiBbcnVsZXMuaywgcnVsZXMuaywgcnVsZXMua11cblx0fTtcblx0dGhpcy5nZW5lcmF0ZUN1cnZlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kZXN0cGlwZSA9IHJhbmRvbS5yZXBudW1iZXIocnVsZXMucGlwZXMubGVuZ3RoKTtcblx0XHR2YXIgayA9IHJ1bGVzLms7XG5cdFx0dGhpcy5wYXRoLmsgPSB0aGlzLnBhdGguay5jb25jYXQoW2ssIGssIGtdKTtcblx0XHR2YXIgZGVzdHggPSBydWxlcy5waXBlc1t0aGlzLmRlc3RwaXBlXSArIDE1O1xuXHRcdHZhciB0aHJlcyA9IGRlc3R4IC0gKHJhbmRvbS5udW1iZXIoMjApICsgMjApO1xuXG5cdFx0Ly9jbGltYXhcblx0XHR0aGlzLnBhdGgueS5wdXNoKDMpO1xuXHRcdHRoaXMucGF0aC54LnB1c2godGhyZXMgLyAyKTtcblxuXHRcdC8vYnVmZmVyIGFwcHJvYWNoXG5cdFx0dGhpcy5wYXRoLnkucHVzaChydWxlcy53YXRlciAvIDIpO1xuXHRcdHRoaXMucGF0aC54LnB1c2godGhyZXMpO1xuXG5cdFx0Ly9kZXN0aW5hdGlvblxuXHRcdHRoaXMucGF0aC55LnB1c2gocnVsZXMud2F0ZXIpO1xuXHRcdHRoaXMucGF0aC54LnB1c2goZGVzdHgpO1xuXHR9O1xuXHR0aGlzLnRpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy54ID4gdGhpcy5wYXRoLnhbMV0pIHRoaXMueSA9IGN1cnZlKHRoaXMueCwgdGhpcy5wYXRoKTsgLy8gY3VydmUgaWYgbm90IG9uIGRlY2tcblx0XHRpZiAodGhpcy54ID09IHRoaXMucGF0aC54WzFdICsgMTApIGF1ZGlvLnBsYXkoXCJqdW1wXCIpO1xuXHRcdHRoaXMueCsrO1xuXHRcdGlmICh0aGlzLnkgPCBydWxlcy53YXRlcikgc2V0VGltZW91dCh0aGlzLnRpY2suYmluZCh0aGlzKSwgMTApO1xuXHRcdGVsc2UgaWYgKCF0aGlzLnJlYWNoZWQpIHtcblx0XHRcdHRoaXMuZmFkaW5nID0gdHJ1ZTtcblx0XHRcdGF1ZGlvLnBsYXkoXCJ3YXRlclwiKTtcblx0XHRcdHRoaXMuZmFkZU91dCgpO1xuXHRcdH1cblx0fTtcblx0dGhpcy5mYWRlT3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vcGFjaXR5IC09IDAuMTtcblx0XHRpZiAodGhpcy5vcGFjaXR5ID4gMC4xKSBzZXRUaW1lb3V0KHRoaXMuZmFkZU91dC5iaW5kKHRoaXMpLCA1MCk7XG5cdFx0ZWxzZSB0aGlzLnJlbW92ZSA9IHRydWU7XG5cdH07XG5cdHRoaXMuYmVnaW4gPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdlbmVyYXRlQ3VydmUoKTtcblx0XHR0aGlzLnRpY2soKTtcblx0fTtcblx0dGhpcy5vblNwYXduID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5iZWdpbigpO1xuXHR9O1xufTtcbiIsInZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy54ID0gMDtcblx0dGhpcy55ID0gMDtcblx0dGhpcy50eXBlID0gXCJpbWdcIjtcblx0dGhpcy5uYW1lID0gXCJwaXBlXCI7XG5cdHRoaXMuc3JjID0gXCJwaXBlLnBuZ1wiO1xuXHR0aGlzLndpZHRoID0gMzA7XG5cdHRoaXMuaGVpZ2h0ID0gMTAwO1xuXHR0aGlzLnBpcGVuID0gMDtcblx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcblx0dGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcblx0dGhpcy5kb3duID0gZmFsc2U7XG5cdHRoaXMuYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYW5pbWF0aW5nID0gdHJ1ZTtcblx0XHR0aGlzLmFjdGl2ZSA9IHRydWU7XG5cdFx0YXVkaW8ucGxheShcInBpcGVcIik7XG5cdFx0dGhpcy50aWNrKCk7XG5cdH07XG5cdHRoaXMuYW5pbWF0aW9uRG9uZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZG93biA9IGZhbHNlO1xuXHRcdHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG5cdFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcblx0fTtcblx0dGhpcy50aWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHY7XG5cdFx0aWYgKCF0aGlzLmRvd24pIHRoaXMueS0tO1xuXHRcdGVsc2UgdGhpcy55Kys7XG5cdFx0aWYgKHRoaXMueSA9PSA4MCkgdGhpcy5kb3duID0gdHJ1ZTtcblx0XHRpZiAodGhpcy55IDwgMTMwKSBzZXRUaW1lb3V0KHRoaXMudGljay5iaW5kKHRoaXMpLCBydWxlcy5waXBlZHVyIC8gNTApO1xuXHRcdGVsc2UgaWYgKHRoaXMueSA9PSAxMzApIHRoaXMuYW5pbWF0aW9uRG9uZSgpO1xuXHR9O1xuXHR0aGlzLnJpc2UgPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMueS0tO1xuXHRcdGlmKHRoaXMueSA+IDEzMCkgc2V0VGltZW91dCh0aGlzLnJpc2UuYmluZCh0aGlzKSwgcnVsZXMuYmVnaW5EZWxheSAvIDEwMCk7XG5cdFx0ZWxzZSB0aGlzLmluaXRFdmVudCgpO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbihuKSB7XG5cdFx0dGhpcy54ID0gcnVsZXMucGlwZXNbbl07XG5cdFx0dGhpcy55ID0gcnVsZXMuYm90dG9tLTEyMDtcblx0XHR0aGlzLnBpcGVuID0gbjtcblx0XHR0aGlzLnJpc2UoKTtcblx0fTtcblx0dGhpcy5rZXkgPSBmdW5jdGlvbihlKSB7XG5cdFx0aWYgKCF0aGlzLmFuaW1hdGluZykge1xuXHRcdFx0aWYgKGUud2hpY2ggPT0gcnVsZXMuY29udHJvbHNbdGhpcy5waXBlbl0pIHtcblx0XHRcdFx0dGhpcy5hbmltYXRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHR0aGlzLnRvdWNoID0gZnVuY3Rpb24oZSkge1xuXHRcdHZhciB4ID0gKGUueCAtIGNhbnZhcy5vZmZzZXRMZWZ0KSAvIHJ1bGVzLnNjYWxlO1xuXHRcdHZhciB5ID0gKGUueSAtIGNhbnZhcy5vZmZzZXRUb3ApIC8gcnVsZXMuc2NhbGU7XG5cdFx0aWYgKCF0aGlzLmFuaW1hdGluZykge1xuXHRcdFx0aWYgKHggPj0gdGhpcy54ICYmIHggPD0gdGhpcy54ICsgMzApIHtcblx0XHRcdFx0dGhpcy5hbmltYXRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmluaXRFdmVudCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ID0gdGhpcztcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZSkge1xuXHRcdFx0dC5rZXkoZSk7XG5cdFx0fSk7XG5cdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSkge1xuXHRcdFx0dC50b3VjaChlKTtcblx0XHR9LCBmYWxzZSk7XG5cdH07XG59O1xuIiwiLy8gSG9sZHMgbGFzdCBpdGVyYXRpb24gdGltZXN0YW1wLlxudmFyIHRpbWUgPSAwO1xuXG4vKipcbiAqIENhbGxzIGBmbmAgb24gbmV4dCBmcmFtZS5cbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtpbnR9IFRoZSByZXF1ZXN0IElEXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gcmFmKGZuKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIHZhciBlbGFwc2VkID0gbm93IC0gdGltZTtcblxuICAgIGlmIChlbGFwc2VkID4gOTk5KSB7XG4gICAgICBlbGFwc2VkID0gMSAvIDYwO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGFwc2VkIC89IDEwMDA7XG4gICAgfVxuXG4gICAgdGltZSA9IG5vdztcbiAgICBmbihlbGFwc2VkKTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogQ2FsbHMgYGZuYCBvbiBldmVyeSBmcmFtZSB3aXRoIGBlbGFwc2VkYCBzZXQgdG8gdGhlIGVsYXBzZWRcbiAgICogdGltZSBpbiBtaWxsaXNlY29uZHMuXG4gICAqXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb25cbiAgICogQHJldHVybiB7aW50fSBUaGUgcmVxdWVzdCBJRFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgc3RhcnQ6IGZ1bmN0aW9uKGZuKSB7XG4gICAgcmV0dXJuIHJhZihmdW5jdGlvbiB0aWNrKGVsYXBzZWQpIHtcbiAgICAgIGZuKGVsYXBzZWQpO1xuICAgICAgcmFmKHRpY2spO1xuICAgIH0pO1xuICB9LFxuICAvKipcbiAgICogQ2FuY2VscyB0aGUgc3BlY2lmaWVkIGFuaW1hdGlvbiBmcmFtZSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge2ludH0gaWQgVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0b3A6IGZ1bmN0aW9uKGlkKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbiAgfVxufTtcbiIsInZhciBwcmV2O1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdG51bWJlcjogZnVuY3Rpb24obWF4KSB7IC8vcmV0dXJucyBiZXR3ZWVuIDAgYW5kIG1heCAtIDFcblx0XHRyZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcblx0fSxcblx0cmVwbnVtYmVyOiBmdW5jdGlvbihtYXgpIHsgLy9zYW1lIGFzIG51bWJlciBidXQgbm9uLXJlcGVhdGluZ1xuXHRcdHZhciByZXMgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuXHRcdGlmIChyZXMgPT0gcHJldikge1xuXHRcdFx0aWYgKHJlcyA+IDApIHJlcyAtPSAxOyAgLy95ZXMgdmVyeSBjaGVhcFxuXHRcdFx0ZWxzZSByZXMgPSAxO1xuXHRcdH1cblx0XHRwcmV2ID0gcmVzO1xuXHRcdHJldHVybiByZXM7XG5cdH1cbn07XG4iLCJ2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjXCIpO1xudmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5jdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5jdHgubW96SW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5jdHgud2Via2l0SW1hZ2VTbW9vdGhsb2NpbmdFbmFibGVkID0gZmFsc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RhdGUpIHtcblx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuXHRjdHguc2NhbGUoc3RhdGUuc2NhbGUsIHN0YXRlLnNjYWxlKTtcblx0c3RhdGUuc3ByaXRlcy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcblx0XHRpZiAocy5vcGFjaXR5KSBjdHguZ2xvYmFsQWxwaGEgPSBzLm9wYWNpdHk7XG5cdFx0ZWxzZSBjdHguZ2xvYmFsQWxwaGEgPSAxO1xuXHRcdHN3aXRjaCAocy50eXBlKSB7XG5cdFx0XHRjYXNlIFwicmVjdFwiOlxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gcy5jb2xvcjtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KHMueCwgcy55LCBzLndpZHRoLCBzLmhlaWdodCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImltZ1wiOlxuXHRcdFx0XHR2YXIgaW1nID0gbmV3IEltYWdlKCk7XG5cdFx0XHRcdGltZy5zcmMgPSBcImFzc2V0cy9cIiArIHMuc3JjO1xuXHRcdFx0XHRjdHguZHJhd0ltYWdlKGltZywgcy54LCBzLnksIHMud2lkdGgsIHMuaGVpZ2h0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwidGV4dFwiOlxuXHRcdFx0XHRjdHguZm9udCA9IHMuc2l6ZSArIFwicHggXCIgKyBzLmZvbnQ7XG5cdFx0XHRcdGN0eC50ZXh0QWxpZ24gPSBzLmFsaWduO1xuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gcy5jb2xvcjtcblx0XHRcdFx0Y3R4LmZpbGxUZXh0KHMudGV4dCwgcy54LCBzLnkpO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRib3R0b206IDMwMCxcblx0c2lkZTogMjUwLFxuXHR3YXRlcjogMTE1LFxuXHRwaXBlczogW1xuXHRcdDkwLFxuXHRcdDE0NSxcblx0XHQyMDBcblx0XSxcblx0Y29udHJvbHM6IFtcblx0XHQ4MSxcblx0XHQ4Nyxcblx0XHQ2OVxuXHRdLFxuXHRrOiAwLjAxLFxuXHRwaXBlZHVyOiAyNTAsXG5cdHNjYWxlOiAyLFxuXHRiZWdpbkRlbGF5OiAyMDAwXG59O1xuIiwidmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMudHlwZSA9IFwidGV4dFwiO1xuXHR0aGlzLm5hbWUgPSBcInNjb3JlXCI7XG5cdHRoaXMuZm9udCA9IFwic2Fucy1zZXJpZlwiO1xuXHR0aGlzLmNvbG9yID0gXCIjRkZGRkZGXCI7XG5cdHRoaXMuYWxpZ24gPSBcInJpZ2h0XCI7XG5cdHRoaXMuc2l6ZSA9IDIwO1xuXHR0aGlzLnggPSBydWxlcy5zaWRlIC0gMTA7XG5cdHRoaXMueSA9IHRoaXMuc2l6ZTtcblx0dGhpcy50ZXh0ID0gXCIwXCI7XG5cdHRoaXMudXBkYXRlID0gZnVuY3Rpb24odil7XG5cdFx0dGhpcy50ZXh0ID0gdjtcblx0fTtcbn07XG4iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGltZSl7XG5cdHJldHVybiAzNTAgKyByYW5kb20ubnVtYmVyKDE4MDApO1xufTtcbiIsInZhciBNYXJpbyA9IHJlcXVpcmUoXCIuL21hcmlvXCIpO1xudmFyIFBpcGUgPSByZXF1aXJlKFwiLi9waXBlXCIpO1xudmFyIFNjb3JlYm9hcmQgPSByZXF1aXJlKFwiLi9zY29yZWJvYXJkXCIpO1xudmFyIEhlYXJ0ID0gcmVxdWlyZShcIi4vaGVhcnRcIik7XG4vL3ZhciBIdXJ0ID0gcmVxdWlyZShcIi4vaHVydFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5zY2FsZSA9IHJ1bGVzLnNjYWxlO1xuXHR0aGlzLnRpbWUgPSAxO1xuXHR0aGlzLnNjb3JlID0gMDtcblx0dGhpcy5saXZlcyA9IDM7XG5cdHRoaXMubG9zaW5nID0gZmFsc2U7XG5cdHRoaXMuc2NvcmVib2FyZCA9IHt9O1xuXHR0aGlzLmhlYXJ0cyA9IFtdO1xuXHR0aGlzLnBpcGVzID0gW107XG5cdHRoaXMuc3ByaXRlcyA9IFt7XG5cdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0bmFtZTogXCJza3lcIixcblx0XHRjb2xvcjogXCIjNUM5NEZDXCIsXG5cdFx0d2lkdGg6IDI1MCxcblx0XHRoZWlnaHQ6IDE1MCxcblx0XHR4OiAwLFxuXHRcdHk6IDBcblx0fSwge1xuXHRcdHR5cGU6IFwiaW1nXCIsXG5cdFx0bmFtZTogXCJibG9ja3NcIixcblx0XHRzcmM6IFwiYmxvY2tzLnBuZ1wiLFxuXHRcdHg6IDAsXG5cdFx0eTogMzQsXG5cdFx0d2lkdGg6IDM0LFxuXHRcdGhlaWdodDogMTdcblx0fV07XG5cdHRoaXMuY3JlYXRlTWFyaW8gPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFyaW8gPSBuZXcgTWFyaW8oKTtcblx0XHRtYXJpby5vblNwYXduKCk7XG5cdFx0Ly92YXIgZGJjID0gcmVxdWlyZShcIi4uL2RlYnVnL2N1cnZlXCIpO1xuXHRcdC8vdGhpcy5zcHJpdGVzID0gdGhpcy5zcHJpdGVzLmNvbmNhdChkYmMobWFyaW8ucGF0aCkpO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UoMSwgMCwgbWFyaW8pO1xuXHR9O1xuXHR0aGlzLmNyZWF0ZVBpcGVzID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5waXBlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHBpcGUgPSBuZXcgUGlwZSgpO1xuXHRcdFx0cGlwZS5vblNwYXduKGkpO1xuXHRcdFx0dGhpcy5waXBlcy5wdXNoKHBpcGUpO1xuXHRcdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5waXBlc1tpXSk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmNyZWF0ZUhlYXJ0cyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG5cdFx0XHR2YXIgaGVhcnQgPSBuZXcgSGVhcnQoKTtcblx0XHRcdGhlYXJ0Lm9uU3Bhd24oaSk7XG5cdFx0XHR0aGlzLmhlYXJ0cy5wdXNoKGhlYXJ0KTtcblx0XHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuaGVhcnRzW2ldKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuY3JlYXRlV2F0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh7XG5cdFx0XHR0eXBlOiBcInJlY3RcIixcblx0XHRcdG5hbWU6IFwid2F0ZXJcIixcblx0XHRcdGNvbG9yOiBcIiMxNURDRTJcIixcblx0XHRcdG9wYWNpdHk6IDAuNSxcblx0XHRcdHk6IHJ1bGVzLndhdGVyLFxuXHRcdFx0eDogMCxcblx0XHRcdHdpZHRoOiAzMDAsXG5cdFx0XHRoZWlnaHQ6IDM1XG5cdFx0fSk7XG5cdH07XG5cdHRoaXMuY3JlYXRlU2NvcmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNjb3JlYm9hcmQgPSBuZXcgU2NvcmVib2FyZCgpO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuc2NvcmVib2FyZCk7XG5cdH07XG5cdHRoaXMubG9zdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLmxpdmVzID4gMCkge1xuXHRcdFx0dGhpcy5saXZlcy0tO1xuXHRcdFx0dGhpcy5oZWFydHNbdGhpcy5saXZlc10ubG9zZSgpO1xuXHRcdH1cblx0XHRpZih0aGlzLmxpdmVzID09PSAwKXtcblx0XHRcdHRoaXMubG9zaW5nID0gdHJ1ZTtcblx0XHR9XG5cdH07XG5cdHRoaXMuZ2FpbmVkID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zY29yZSsrO1xuXHRcdHRoaXMuc2NvcmVib2FyZC51cGRhdGUodGhpcy5zY29yZSk7XG5cdH07XG59O1xuIl19
