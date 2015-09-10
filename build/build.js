(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var render = require("./renderer");
var raf = require("./raf");
var audio = require("./audio");
var State = require("./state");
var rules = require("./rules");
var spawner = require("./spawner");
var state;

var initialize = function() {
	state = new State();
	state.create();
	raf.start(function(e) {
		render(state);
	});
};

var startGame = function() {
	state.started();
	setTimeout(spawn, rules.beginDelay);
};

var spawn = function() {
	if (!state.losing) {
		state.createMario();
		var t = spawner(state.time);
		state.time += t;
		setTimeout(spawn, t);
	}
};

window.addEventListener("keydown", function(e) {
	if (e.which == 88 && (state.losing || state.created)) {
		audio.play("score");
		initialize();
		startGame();
	}
});

initialize();

},{"./audio":2,"./raf":7,"./renderer":9,"./rules":10,"./spawner":12,"./state":13}],2:[function(require,module,exports){
var names = ["jump", "pipe", "water", "score"];
var files = {};
module.exports = {
	play: function(f) {
		files[f].play();
	}
};

names.forEach(function(nm) {
	files[nm] = new Audio("assets/" + nm + ".ogg");
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
		if(random.repnumber(rules.heartspawn, 1) == 1) {
			this.name = "heartp";
			this.src = "heartp.png";
			this.width = 10;
			this.height = 9;
		}
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
	this.height = 70;
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
var prev = [];
module.exports = {
	number: function(max) { //returns between 0 and max - 1
		return Math.floor(Math.random() * max);
	},
	repnumber: function(max, i) { //same as number but non-repeating
		var res = Math.floor(Math.random() * max);
		if (res == prev[i]) {
			if (res > 0) res -= 1;  //yes very cheap
			else res = 1;
		}
		prev[i] = res;
		return res;
	}
};

},{}],9:[function(require,module,exports){
var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");
var audio = require("./audio");
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothlocingEnabled = false;

module.exports = function(state) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.scale(state.scale, state.scale);
	var pipes = state.pipes;
	state.sprites.forEach(function(s, i) {
		if (s.name == "mario" || s.name == "heartp") {
			var p = pipes[s.destpipe];
			if (s.remove) {
				state.sprites.splice(i, 1);
			} else if (s.fading && !s.killed) {
				if (s.name == "mario") state.lost();
				s.killed = true;
			} else if (p.active && (s.x > p.x && s.x < p.x + 30) && (s.y >= p.y) && !(s.fading) && !(state.losing)) {
				s.reached = true;
				state.sprites.splice(i, 1);
				audio.play("score");
				if (s.name == "mario") state.gained();
				else state.hearted();
			}
		} else if (s.remove) {
			state.sprites.splice(i, 1);
		}
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
				ctx.textAlign = s.align || "center";
				ctx.fillStyle = s.color || "#FFFFFF";
				ctx.fillText(s.text, s.x, s.y);
				break;
		}
	});
};

},{"./audio":2}],10:[function(require,module,exports){
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
	beginDelay: 2000,
	heartspawn: 25,
	spawn: 550
};

},{}],11:[function(require,module,exports){
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

},{"./rules":10}],12:[function(require,module,exports){
var random = require("./rand");
var rules = require("./rules");
module.exports = function(time){
	return 350 + (random.number(1800) - (time / rules.spawn));
};

},{"./rand":8,"./rules":10}],13:[function(require,module,exports){
var Mario = require("./mario");
var Pipe = require("./pipe");
var Scoreboard = require("./scoreboard");
var Heart = require("./heart");
var rules = require("./rules");
module.exports = function() {
	this.scale = rules.scale;
	this.time = 1;
	this.score = 0;
	this.lives = 3;
	this.losing = false;
	this.created = true;
	this.scoreboard = {};
	this.hearts = [];
	this.pipes = [];
	this.hi = 0;
	this.lostscreen = {
		type: "text",
		name: "lost",
		size: "20",
		font: "sans-serif",
		color: "#FF0000",
		text: "YOU LOST!",
		x: 120,
		y: 65
	};
	this.greetscreen = {
		type: "text",
		name: "greet",
		size: "20",
		font: "sans-serif",
		color: "#6BFF63",
		text: "MARIO CATCH",
		x: 130,
		y: 70
	};
	this.startscreen = {
		type: "text",
		name: "lost",
		size: "10",
		font: "sans-serif",
		text: "press x to start. press keys to raise pipes.",
		x: 130,
		y: 85
	};
	this.instructionscreen = {
		type: "text",
		name: "lost",
		size: "8",
		font: "sans-serif",
		text: "Q                   W                    E",
		x: 155,
		y: 110
	};
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
		name: "cloud",
		src: "cloud.png",
		x: 80,
		y: 12,
		opacity: 0.8,
		width: 40,
		height: 25
	}, {
		type: "img",
		name: "cloud",
		src: "cloud.png",
		x: 160,
		y: 35,
		opacity: 0.8,
		width: 24,
		height: 15
	}, {
		type: "img",
		name: "blocks",
		src: "blocks.png",
		x: 0,
		y: 34,
		width: 34,
		height: 17
	}, {
		type: "rect",
		name: "water",
		color: "#15DCE2",
		opacity: 0.5,
		y: rules.water,
		x: 0,
		width: 300,
		height: 35
	}];
	this.createMario = function() {
		var mario = new Mario();
		mario.onSpawn();
		//var dbc = require("../debug/curve");
		//this.sprites = this.sprites.concat(dbc(mario.path));
		this.sprites.splice(3, 0, mario);
	};
	this.createPipes = function() {
		for (var i = 0; i < rules.pipes.length; i++) {
			var pipe = new Pipe();
			pipe.onSpawn(i);
			this.pipes.push(pipe);
			this.sprites.splice(3, 0, this.pipes[i]);
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
	this.createScore = function() {
		this.scoreboard = new Scoreboard();
		this.sprites.push(this.scoreboard);
	};
	this.lost = function() {
		if (this.lives > 0) {
			this.lives--;
			this.hearts[this.lives].lose();
		}
		if (this.lives === 0) {
			this.lostGame();
		}
	};
	this.hearted = function() {
		if (this.lives < 3 && !this.losing) {
			this.lives++;
			this.hearts[this.lives - 1].gain();
		}
	};
	this.gained = function() {
		this.score++;
		this.scoreboard.update(this.score);
	};
	this.lostGame = function() {
		this.losing = true;
		if (this.score > this.hi) this.setHi();
		this.scoreboard.update("last: " + this.score + " hi: " + this.hi);
		this.sprites.push(this.lostscreen);
		this.sprites.push(this.startscreen);
	};
	this.create = function() {
		this.created = true;
		this.sprites.push(this.greetscreen);
		this.sprites.push(this.startscreen);
		this.sprites.push(this.instructionscreen);
	};
	this.started = function() {
		this.created = false;
		var l = this.sprites.length - 1;
		this.sprites.splice(l, 1);
		this.sprites.splice(l - 1, 1);
		this.sprites.splice(l - 2, 1);
		this.createPipes();
		this.createScore();
		this.createHearts();
		this.getHi();
	};
	this.setHi = function() {
		this.hi = this.score;
		localStorage.setItem("hi", this.score);
	};
	this.getHi = function() {
		this.hi = localStorage.getItem("hi");
	};
};

},{"./heart":4,"./mario":5,"./pipe":6,"./rules":10,"./scoreboard":11}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9hdWRpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL2hlYXJ0LmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9tYXJpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcGlwZS5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcmFmLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yYW5kLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yZW5kZXJlci5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcnVsZXMuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3Njb3JlYm9hcmQuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3NwYXduZXIuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3N0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcmVuZGVyID0gcmVxdWlyZShcIi4vcmVuZGVyZXJcIik7XG52YXIgcmFmID0gcmVxdWlyZShcIi4vcmFmXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG52YXIgU3RhdGUgPSByZXF1aXJlKFwiLi9zdGF0ZVwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xudmFyIHNwYXduZXIgPSByZXF1aXJlKFwiLi9zcGF3bmVyXCIpO1xudmFyIHN0YXRlO1xuXG52YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuXHRzdGF0ZSA9IG5ldyBTdGF0ZSgpO1xuXHRzdGF0ZS5jcmVhdGUoKTtcblx0cmFmLnN0YXJ0KGZ1bmN0aW9uKGUpIHtcblx0XHRyZW5kZXIoc3RhdGUpO1xuXHR9KTtcbn07XG5cbnZhciBzdGFydEdhbWUgPSBmdW5jdGlvbigpIHtcblx0c3RhdGUuc3RhcnRlZCgpO1xuXHRzZXRUaW1lb3V0KHNwYXduLCBydWxlcy5iZWdpbkRlbGF5KTtcbn07XG5cbnZhciBzcGF3biA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXN0YXRlLmxvc2luZykge1xuXHRcdHN0YXRlLmNyZWF0ZU1hcmlvKCk7XG5cdFx0dmFyIHQgPSBzcGF3bmVyKHN0YXRlLnRpbWUpO1xuXHRcdHN0YXRlLnRpbWUgKz0gdDtcblx0XHRzZXRUaW1lb3V0KHNwYXduLCB0KTtcblx0fVxufTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpIHtcblx0aWYgKGUud2hpY2ggPT0gODggJiYgKHN0YXRlLmxvc2luZyB8fCBzdGF0ZS5jcmVhdGVkKSkge1xuXHRcdGF1ZGlvLnBsYXkoXCJzY29yZVwiKTtcblx0XHRpbml0aWFsaXplKCk7XG5cdFx0c3RhcnRHYW1lKCk7XG5cdH1cbn0pO1xuXG5pbml0aWFsaXplKCk7XG4iLCJ2YXIgbmFtZXMgPSBbXCJqdW1wXCIsIFwicGlwZVwiLCBcIndhdGVyXCIsIFwic2NvcmVcIl07XG52YXIgZmlsZXMgPSB7fTtcbm1vZHVsZS5leHBvcnRzID0ge1xuXHRwbGF5OiBmdW5jdGlvbihmKSB7XG5cdFx0ZmlsZXNbZl0ucGxheSgpO1xuXHR9XG59O1xuXG5uYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5tKSB7XG5cdGZpbGVzW25tXSA9IG5ldyBBdWRpbyhcImFzc2V0cy9cIiArIG5tICsgXCIub2dnXCIpO1xufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHgsIHBhdGgpe1xuXHRDU1BMLmdldE5hdHVyYWxLcyhwYXRoLngsIHBhdGgueSwgcGF0aC5rKTtcblx0cmV0dXJuIENTUEwuZXZhbFNwbGluZSh4LCBwYXRoLngsIHBhdGgueSwgcGF0aC5rKTtcbn07XG5cbi8vQ1NQTCBTY3JpcHQgYnkgSXZhbiBLLCBBZGFwdGVkIGZvciB0aGUgZ2FtZVxudmFyIENTUEwgPSBmdW5jdGlvbigpIHt9O1xuQ1NQTC5fZ2F1c3NKID0ge307XG5DU1BMLl9nYXVzc0ouc29sdmUgPSBmdW5jdGlvbihBLCB4KSAvLyBpbiBNYXRyaXgsIG91dCBzb2x1dGlvbnNcblx0e1xuXHRcdHZhciBtID0gQS5sZW5ndGg7XG5cdFx0Zm9yICh2YXIgayA9IDA7IGsgPCBtOyBrKyspIC8vIGNvbHVtblxuXHRcdHtcblx0XHRcdC8vIHBpdm90IGZvciBjb2x1bW5cblx0XHRcdHZhciBpX21heCA9IDA7XG5cdFx0XHR2YXIgdmFsaSA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcblx0XHRcdGZvciAodmFyIGkgPSBrOyBpIDwgbTsgaSsrKVxuXHRcdFx0XHRpZiAoQVtpXVtrXSA+IHZhbGkpIHtcblx0XHRcdFx0XHRpX21heCA9IGk7XG5cdFx0XHRcdFx0dmFsaSA9IEFbaV1ba107XG5cdFx0XHRcdH1cblx0XHRcdENTUEwuX2dhdXNzSi5zd2FwUm93cyhBLCBrLCBpX21heCk7XG5cdFx0XHQvLyBmb3IgYWxsIHJvd3MgYmVsb3cgcGl2b3Rcblx0XHRcdGZvciAodmFyIGkgPSBrICsgMTsgaSA8IG07IGkrKykge1xuXHRcdFx0XHRmb3IgKHZhciBqID0gayArIDE7IGogPCBtICsgMTsgaisrKVxuXHRcdFx0XHRcdEFbaV1bal0gPSBBW2ldW2pdIC0gQVtrXVtqXSAqIChBW2ldW2tdIC8gQVtrXVtrXSk7XG5cdFx0XHRcdEFbaV1ba10gPSAwO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSBtIC0gMTsgaSA+PSAwOyBpLS0pIC8vIHJvd3MgPSBjb2x1bW5zXG5cdFx0e1xuXHRcdFx0dmFyIHYgPSBBW2ldW21dIC8gQVtpXVtpXTtcblx0XHRcdHhbaV0gPSB2O1xuXHRcdFx0Zm9yICh2YXIgaiA9IGkgLSAxOyBqID49IDA7IGotLSkgLy8gcm93c1xuXHRcdFx0e1xuXHRcdFx0XHRBW2pdW21dIC09IEFbal1baV0gKiB2O1xuXHRcdFx0XHRBW2pdW2ldID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5DU1BMLl9nYXVzc0ouemVyb3NNYXQgPSBmdW5jdGlvbihyLCBjKSB7XG5cdHZhciBBID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgcjsgaSsrKSB7XG5cdFx0QS5wdXNoKFtdKTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGM7IGorKykgQVtpXS5wdXNoKDApO1xuXHR9XG5cdHJldHVybiBBO1xufTtcbkNTUEwuX2dhdXNzSi5wcmludE1hdCA9IGZ1bmN0aW9uKEEpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBBLmxlbmd0aDsgaSsrKSBjb25zb2xlLmxvZyhBW2ldKTtcbn07XG5DU1BMLl9nYXVzc0ouc3dhcFJvd3MgPSBmdW5jdGlvbihtLCBrLCBsKSB7XG5cdHZhciBwID0gbVtrXTtcblx0bVtrXSA9IG1bbF07XG5cdG1bbF0gPSBwO1xufTtcbkNTUEwuZ2V0TmF0dXJhbEtzID0gZnVuY3Rpb24oeHMsIHlzLCBrcykgLy8gaW4geCB2YWx1ZXMsIGluIHkgdmFsdWVzLCBvdXQgayB2YWx1ZXNcblx0e1xuXHRcdHZhciBuID0geHMubGVuZ3RoIC0gMTtcblx0XHR2YXIgQSA9IENTUEwuX2dhdXNzSi56ZXJvc01hdChuICsgMSwgbiArIDIpO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDE7IGkgPCBuOyBpKyspIC8vIHJvd3Ncblx0XHR7XG5cdFx0XHRBW2ldW2kgLSAxXSA9IDEgLyAoeHNbaV0gLSB4c1tpIC0gMV0pO1xuXG5cdFx0XHRBW2ldW2ldID0gMiAqICgxIC8gKHhzW2ldIC0geHNbaSAtIDFdKSArIDEgLyAoeHNbaSArIDFdIC0geHNbaV0pKTtcblxuXHRcdFx0QVtpXVtpICsgMV0gPSAxIC8gKHhzW2kgKyAxXSAtIHhzW2ldKTtcblxuXHRcdFx0QVtpXVtuICsgMV0gPSAzICogKCh5c1tpXSAtIHlzW2kgLSAxXSkgLyAoKHhzW2ldIC0geHNbaSAtIDFdKSAqICh4c1tpXSAtIHhzW2kgLSAxXSkpICsgKHlzW2kgKyAxXSAtIHlzW2ldKSAvICgoeHNbaSArIDFdIC0geHNbaV0pICogKHhzW2kgKyAxXSAtIHhzW2ldKSkpO1xuXHRcdH1cblxuXHRcdEFbMF1bMF0gPSAyIC8gKHhzWzFdIC0geHNbMF0pO1xuXHRcdEFbMF1bMV0gPSAxIC8gKHhzWzFdIC0geHNbMF0pO1xuXHRcdEFbMF1bbiArIDFdID0gMyAqICh5c1sxXSAtIHlzWzBdKSAvICgoeHNbMV0gLSB4c1swXSkgKiAoeHNbMV0gLSB4c1swXSkpO1xuXG5cdFx0QVtuXVtuIC0gMV0gPSAxIC8gKHhzW25dIC0geHNbbiAtIDFdKTtcblx0XHRBW25dW25dID0gMiAvICh4c1tuXSAtIHhzW24gLSAxXSk7XG5cdFx0QVtuXVtuICsgMV0gPSAzICogKHlzW25dIC0geXNbbiAtIDFdKSAvICgoeHNbbl0gLSB4c1tuIC0gMV0pICogKHhzW25dIC0geHNbbiAtIDFdKSk7XG5cblx0XHRDU1BMLl9nYXVzc0ouc29sdmUoQSwga3MpO1xuXHR9O1xuQ1NQTC5ldmFsU3BsaW5lID0gZnVuY3Rpb24oeCwgeHMsIHlzLCBrcykge1xuXHR2YXIgaSA9IDE7XG5cdHdoaWxlICh4c1tpXSA8IHgpIGkrKztcblxuXHR2YXIgdCA9ICh4IC0geHNbaSAtIDFdKSAvICh4c1tpXSAtIHhzW2kgLSAxXSk7XG5cblx0dmFyIGEgPSBrc1tpIC0gMV0gKiAoeHNbaV0gLSB4c1tpIC0gMV0pIC0gKHlzW2ldIC0geXNbaSAtIDFdKTtcblx0dmFyIGIgPSAta3NbaV0gKiAoeHNbaV0gLSB4c1tpIC0gMV0pICsgKHlzW2ldIC0geXNbaSAtIDFdKTtcblxuXHR2YXIgcSA9ICgxIC0gdCkgKiB5c1tpIC0gMV0gKyB0ICogeXNbaV0gKyB0ICogKDEgLSB0KSAqIChhICogKDEgLSB0KSArIGIgKiB0KTtcblx0cmV0dXJuIHE7XG59O1xuIiwidmFyIHJhbmRvbSA9IHJlcXVpcmUoXCIuL3JhbmRcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnggPSAxMDtcblx0dGhpcy55ID0gMTI1O1xuXHR0aGlzLm8gPSB7XG5cdFx0eDogMCxcblx0XHR5OiAwXG5cdH07XG5cdHRoaXMud2lkdGggPSAxNTtcblx0dGhpcy5oZWlnaHQgPSAxMztcblx0dGhpcy5uYW1lID0gXCJoZWFydFwiO1xuXHR0aGlzLnR5cGUgPSBcImltZ1wiO1xuXHR0aGlzLnNyYyA9IFwiaGVhcnQucG5nXCI7XG5cdHRoaXMuc2hha2VzcmMgPSBcIlwiO1xuXHR0aGlzLmZ1bGwgPSB0cnVlO1xuXHR0aGlzLnNoYWtlbnVtID0gMDtcblx0dGhpcy5zaGFrZXRocmVzID0gMTA7XG5cdHRoaXMuc2hha2UgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnggPSB0aGlzLm8ueCArIHJhbmRvbS5udW1iZXIoNSk7XG5cdFx0dGhpcy55ID0gdGhpcy5vLnkgKyByYW5kb20ubnVtYmVyKDUpO1xuXHRcdHRoaXMuc2hha2VudW0rKztcblx0XHRpZiAodGhpcy5zaGFrZW51bSA8IHRoaXMuc2hha2V0aHJlcykgc2V0VGltZW91dCh0aGlzLnNoYWtlLmJpbmQodGhpcyksIDIwKTtcblx0XHRlbHNlIHtcblx0XHRcdHRoaXMueCA9IHRoaXMuby54O1xuXHRcdFx0dGhpcy55ID0gdGhpcy5vLnk7XG5cdFx0XHR0aGlzLnNoYWtlbnVtID0gMDtcblx0XHRcdHRoaXMuc3JjID0gdGhpcy5zaGFrZXNyYztcblx0XHR9XG5cdH07XG5cdHRoaXMubG9zZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuby54ID0gdGhpcy54O1xuXHRcdHRoaXMuby55ID0gdGhpcy55O1xuXHRcdHRoaXMuc2hha2VzcmMgPSBcImhlYXJ0LWVtcHR5LnBuZ1wiO1xuXHRcdHRoaXMuc2hha2UoKTtcblx0XHR0aGlzLmZ1bGwgPSBmYWxzZTtcblx0fTtcblx0dGhpcy5nYWluID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLmZ1bGwgPSB0cnVlO1xuXHRcdHRoaXMuc2hha2VzcmMgPSBcImhlYXJ0LnBuZ1wiO1xuXHRcdHRoaXMuc2hha2UoKTtcblx0fTtcblx0dGhpcy5vblNwYXduID0gZnVuY3Rpb24oaSl7XG5cdFx0dGhpcy54ICs9ICh0aGlzLndpZHRoICsgMikgKiBpO1xuXHR9O1xufTtcbiIsInZhciBjdXJ2ZSA9IHJlcXVpcmUoXCIuL2N1cnZlXCIpO1xudmFyIHJhbmRvbSA9IHJlcXVpcmUoXCIuL3JhbmRcIik7XG52YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy53aWR0aCA9IDEyO1xuXHR0aGlzLmhlaWdodCA9IDE2O1xuXHR0aGlzLm9wYWNpdHkgPSAxO1xuXHR0aGlzLnggPSAtMTU7XG5cdHRoaXMueSA9IDM0IC0gdGhpcy5oZWlnaHQ7XG5cdHRoaXMudHlwZSA9IFwiaW1nXCI7XG5cdHRoaXMubmFtZSA9IFwibWFyaW9cIjtcblx0dGhpcy5zcmMgPSBcIm1hcmlvLnBuZ1wiO1xuXHR0aGlzLnJlbW92ZSA9IGZhbHNlO1xuXHR0aGlzLmtpbGxlZCA9IGZhbHNlO1xuXHR0aGlzLmZhZGluZyA9IGZhbHNlO1xuXHR0aGlzLnJlYWNoZWQgPSBmYWxzZTtcblx0dGhpcy5kZXN0cGlwZSA9IDA7XG5cdHRoaXMucGF0aCA9IHtcblx0XHR4OiBbLTE1LCAxNywgMzBdLFxuXHRcdHk6IFszNCAtIHRoaXMuaGVpZ2h0LCAzNCAtIHRoaXMuaGVpZ2h0LCAxMF0sXG5cdFx0azogW3J1bGVzLmssIHJ1bGVzLmssIHJ1bGVzLmtdXG5cdH07XG5cdHRoaXMuZ2VuZXJhdGVDdXJ2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVzdHBpcGUgPSByYW5kb20ucmVwbnVtYmVyKHJ1bGVzLnBpcGVzLmxlbmd0aCwgMCk7XG5cdFx0dmFyIGsgPSBydWxlcy5rO1xuXHRcdHRoaXMucGF0aC5rID0gdGhpcy5wYXRoLmsuY29uY2F0KFtrLCBrLCBrXSk7XG5cdFx0dmFyIGRlc3R4ID0gcnVsZXMucGlwZXNbdGhpcy5kZXN0cGlwZV0gKyAxNTtcblx0XHR2YXIgdGhyZXMgPSBkZXN0eCAtIChyYW5kb20ubnVtYmVyKDIwKSArIDIwKTtcblxuXHRcdC8vY2xpbWF4XG5cdFx0dGhpcy5wYXRoLnkucHVzaCgzKTtcblx0XHR0aGlzLnBhdGgueC5wdXNoKHRocmVzIC8gMik7XG5cblx0XHQvL2J1ZmZlciBhcHByb2FjaFxuXHRcdHRoaXMucGF0aC55LnB1c2gocnVsZXMud2F0ZXIgLyAyKTtcblx0XHR0aGlzLnBhdGgueC5wdXNoKHRocmVzKTtcblxuXHRcdC8vZGVzdGluYXRpb25cblx0XHR0aGlzLnBhdGgueS5wdXNoKHJ1bGVzLndhdGVyKTtcblx0XHR0aGlzLnBhdGgueC5wdXNoKGRlc3R4KTtcblx0fTtcblx0dGhpcy50aWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMueCA+IHRoaXMucGF0aC54WzFdKSB0aGlzLnkgPSBjdXJ2ZSh0aGlzLngsIHRoaXMucGF0aCk7IC8vIGN1cnZlIGlmIG5vdCBvbiBkZWNrXG5cdFx0aWYgKHRoaXMueCA9PSB0aGlzLnBhdGgueFsxXSArIDEwKSBhdWRpby5wbGF5KFwianVtcFwiKTtcblx0XHR0aGlzLngrKztcblx0XHRpZiAodGhpcy55IDwgcnVsZXMud2F0ZXIpIHNldFRpbWVvdXQodGhpcy50aWNrLmJpbmQodGhpcyksIDEwKTtcblx0XHRlbHNlIGlmICghdGhpcy5yZWFjaGVkKSB7XG5cdFx0XHR0aGlzLmZhZGluZyA9IHRydWU7XG5cdFx0XHRhdWRpby5wbGF5KFwid2F0ZXJcIik7XG5cdFx0XHR0aGlzLmZhZGVPdXQoKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuZmFkZU91dCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMub3BhY2l0eSAtPSAwLjE7XG5cdFx0aWYgKHRoaXMub3BhY2l0eSA+IDAuMSkgc2V0VGltZW91dCh0aGlzLmZhZGVPdXQuYmluZCh0aGlzKSwgNTApO1xuXHRcdGVsc2UgdGhpcy5yZW1vdmUgPSB0cnVlO1xuXHR9O1xuXHR0aGlzLmJlZ2luID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nZW5lcmF0ZUN1cnZlKCk7XG5cdFx0dGhpcy50aWNrKCk7XG5cdH07XG5cdHRoaXMub25TcGF3biA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmKHJhbmRvbS5yZXBudW1iZXIocnVsZXMuaGVhcnRzcGF3biwgMSkgPT0gMSkge1xuXHRcdFx0dGhpcy5uYW1lID0gXCJoZWFydHBcIjtcblx0XHRcdHRoaXMuc3JjID0gXCJoZWFydHAucG5nXCI7XG5cdFx0XHR0aGlzLndpZHRoID0gMTA7XG5cdFx0XHR0aGlzLmhlaWdodCA9IDk7XG5cdFx0fVxuXHRcdHRoaXMuYmVnaW4oKTtcblx0fTtcbn07XG4iLCJ2YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpO1xudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMueCA9IDA7XG5cdHRoaXMueSA9IDA7XG5cdHRoaXMudHlwZSA9IFwiaW1nXCI7XG5cdHRoaXMubmFtZSA9IFwicGlwZVwiO1xuXHR0aGlzLnNyYyA9IFwicGlwZS5wbmdcIjtcblx0dGhpcy53aWR0aCA9IDMwO1xuXHR0aGlzLmhlaWdodCA9IDcwO1xuXHR0aGlzLnBpcGVuID0gMDtcblx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcblx0dGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcblx0dGhpcy5kb3duID0gZmFsc2U7XG5cdHRoaXMuYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYW5pbWF0aW5nID0gdHJ1ZTtcblx0XHR0aGlzLmFjdGl2ZSA9IHRydWU7XG5cdFx0YXVkaW8ucGxheShcInBpcGVcIik7XG5cdFx0dGhpcy50aWNrKCk7XG5cdH07XG5cdHRoaXMuYW5pbWF0aW9uRG9uZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZG93biA9IGZhbHNlO1xuXHRcdHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG5cdFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcblx0fTtcblx0dGhpcy50aWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHY7XG5cdFx0aWYgKCF0aGlzLmRvd24pIHRoaXMueS0tO1xuXHRcdGVsc2UgdGhpcy55Kys7XG5cdFx0aWYgKHRoaXMueSA9PSA4MCkgdGhpcy5kb3duID0gdHJ1ZTtcblx0XHRpZiAodGhpcy55IDwgMTMwKSBzZXRUaW1lb3V0KHRoaXMudGljay5iaW5kKHRoaXMpLCBydWxlcy5waXBlZHVyIC8gNTApO1xuXHRcdGVsc2UgaWYgKHRoaXMueSA9PSAxMzApIHRoaXMuYW5pbWF0aW9uRG9uZSgpO1xuXHR9O1xuXHR0aGlzLnJpc2UgPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMueS0tO1xuXHRcdGlmKHRoaXMueSA+IDEzMCkgc2V0VGltZW91dCh0aGlzLnJpc2UuYmluZCh0aGlzKSwgcnVsZXMuYmVnaW5EZWxheSAvIDEwMCk7XG5cdFx0ZWxzZSB0aGlzLmluaXRFdmVudCgpO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbihuKSB7XG5cdFx0dGhpcy54ID0gcnVsZXMucGlwZXNbbl07XG5cdFx0dGhpcy55ID0gcnVsZXMuYm90dG9tLTEyMDtcblx0XHR0aGlzLnBpcGVuID0gbjtcblx0XHR0aGlzLnJpc2UoKTtcblx0fTtcblx0dGhpcy5rZXkgPSBmdW5jdGlvbihlKSB7XG5cdFx0aWYgKCF0aGlzLmFuaW1hdGluZykge1xuXHRcdFx0aWYgKGUud2hpY2ggPT0gcnVsZXMuY29udHJvbHNbdGhpcy5waXBlbl0pIHtcblx0XHRcdFx0dGhpcy5hbmltYXRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHR0aGlzLnRvdWNoID0gZnVuY3Rpb24oZSkge1xuXHRcdHZhciB4ID0gKGUueCAtIGNhbnZhcy5vZmZzZXRMZWZ0KSAvIHJ1bGVzLnNjYWxlO1xuXHRcdHZhciB5ID0gKGUueSAtIGNhbnZhcy5vZmZzZXRUb3ApIC8gcnVsZXMuc2NhbGU7XG5cdFx0aWYgKCF0aGlzLmFuaW1hdGluZykge1xuXHRcdFx0aWYgKHggPj0gdGhpcy54ICYmIHggPD0gdGhpcy54ICsgMzApIHtcblx0XHRcdFx0dGhpcy5hbmltYXRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmluaXRFdmVudCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ID0gdGhpcztcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZSkge1xuXHRcdFx0dC5rZXkoZSk7XG5cdFx0fSk7XG5cdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSkge1xuXHRcdFx0dC50b3VjaChlKTtcblx0XHR9LCBmYWxzZSk7XG5cdH07XG59O1xuIiwiLy8gSG9sZHMgbGFzdCBpdGVyYXRpb24gdGltZXN0YW1wLlxudmFyIHRpbWUgPSAwO1xuXG4vKipcbiAqIENhbGxzIGBmbmAgb24gbmV4dCBmcmFtZS5cbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtpbnR9IFRoZSByZXF1ZXN0IElEXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gcmFmKGZuKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIHZhciBlbGFwc2VkID0gbm93IC0gdGltZTtcblxuICAgIGlmIChlbGFwc2VkID4gOTk5KSB7XG4gICAgICBlbGFwc2VkID0gMSAvIDYwO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGFwc2VkIC89IDEwMDA7XG4gICAgfVxuXG4gICAgdGltZSA9IG5vdztcbiAgICBmbihlbGFwc2VkKTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogQ2FsbHMgYGZuYCBvbiBldmVyeSBmcmFtZSB3aXRoIGBlbGFwc2VkYCBzZXQgdG8gdGhlIGVsYXBzZWRcbiAgICogdGltZSBpbiBtaWxsaXNlY29uZHMuXG4gICAqXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb25cbiAgICogQHJldHVybiB7aW50fSBUaGUgcmVxdWVzdCBJRFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgc3RhcnQ6IGZ1bmN0aW9uKGZuKSB7XG4gICAgcmV0dXJuIHJhZihmdW5jdGlvbiB0aWNrKGVsYXBzZWQpIHtcbiAgICAgIGZuKGVsYXBzZWQpO1xuICAgICAgcmFmKHRpY2spO1xuICAgIH0pO1xuICB9LFxuICAvKipcbiAgICogQ2FuY2VscyB0aGUgc3BlY2lmaWVkIGFuaW1hdGlvbiBmcmFtZSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge2ludH0gaWQgVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0b3A6IGZ1bmN0aW9uKGlkKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbiAgfVxufTtcbiIsInZhciBwcmV2ID0gW107XG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0bnVtYmVyOiBmdW5jdGlvbihtYXgpIHsgLy9yZXR1cm5zIGJldHdlZW4gMCBhbmQgbWF4IC0gMVxuXHRcdHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuXHR9LFxuXHRyZXBudW1iZXI6IGZ1bmN0aW9uKG1heCwgaSkgeyAvL3NhbWUgYXMgbnVtYmVyIGJ1dCBub24tcmVwZWF0aW5nXG5cdFx0dmFyIHJlcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG5cdFx0aWYgKHJlcyA9PSBwcmV2W2ldKSB7XG5cdFx0XHRpZiAocmVzID4gMCkgcmVzIC09IDE7ICAvL3llcyB2ZXJ5IGNoZWFwXG5cdFx0XHRlbHNlIHJlcyA9IDE7XG5cdFx0fVxuXHRcdHByZXZbaV0gPSByZXM7XG5cdFx0cmV0dXJuIHJlcztcblx0fVxufTtcbiIsInZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNcIik7XG52YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpO1xuY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuY3R4Lm1vekltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuY3R4LndlYmtpdEltYWdlU21vb3RobG9jaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG5cdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0Y3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcblx0Y3R4LnNjYWxlKHN0YXRlLnNjYWxlLCBzdGF0ZS5zY2FsZSk7XG5cdHZhciBwaXBlcyA9IHN0YXRlLnBpcGVzO1xuXHRzdGF0ZS5zcHJpdGVzLmZvckVhY2goZnVuY3Rpb24ocywgaSkge1xuXHRcdGlmIChzLm5hbWUgPT0gXCJtYXJpb1wiIHx8IHMubmFtZSA9PSBcImhlYXJ0cFwiKSB7XG5cdFx0XHR2YXIgcCA9IHBpcGVzW3MuZGVzdHBpcGVdO1xuXHRcdFx0aWYgKHMucmVtb3ZlKSB7XG5cdFx0XHRcdHN0YXRlLnNwcml0ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fSBlbHNlIGlmIChzLmZhZGluZyAmJiAhcy5raWxsZWQpIHtcblx0XHRcdFx0aWYgKHMubmFtZSA9PSBcIm1hcmlvXCIpIHN0YXRlLmxvc3QoKTtcblx0XHRcdFx0cy5raWxsZWQgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIGlmIChwLmFjdGl2ZSAmJiAocy54ID4gcC54ICYmIHMueCA8IHAueCArIDMwKSAmJiAocy55ID49IHAueSkgJiYgIShzLmZhZGluZykgJiYgIShzdGF0ZS5sb3NpbmcpKSB7XG5cdFx0XHRcdHMucmVhY2hlZCA9IHRydWU7XG5cdFx0XHRcdHN0YXRlLnNwcml0ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRhdWRpby5wbGF5KFwic2NvcmVcIik7XG5cdFx0XHRcdGlmIChzLm5hbWUgPT0gXCJtYXJpb1wiKSBzdGF0ZS5nYWluZWQoKTtcblx0XHRcdFx0ZWxzZSBzdGF0ZS5oZWFydGVkKCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChzLnJlbW92ZSkge1xuXHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHRcdGlmIChzLm9wYWNpdHkpIGN0eC5nbG9iYWxBbHBoYSA9IHMub3BhY2l0eTtcblx0XHRlbHNlIGN0eC5nbG9iYWxBbHBoYSA9IDE7XG5cdFx0c3dpdGNoIChzLnR5cGUpIHtcblx0XHRcdGNhc2UgXCJyZWN0XCI6XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBzLmNvbG9yO1xuXHRcdFx0XHRjdHguZmlsbFJlY3Qocy54LCBzLnksIHMud2lkdGgsIHMuaGVpZ2h0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiaW1nXCI6XG5cdFx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdFx0aW1nLnNyYyA9IFwiYXNzZXRzL1wiICsgcy5zcmM7XG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UoaW1nLCBzLngsIHMueSwgcy53aWR0aCwgcy5oZWlnaHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJ0ZXh0XCI6XG5cdFx0XHRcdGN0eC5mb250ID0gcy5zaXplICsgXCJweCBcIiArIHMuZm9udDtcblx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9IHMuYWxpZ24gfHwgXCJjZW50ZXJcIjtcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHMuY29sb3IgfHwgXCIjRkZGRkZGXCI7XG5cdFx0XHRcdGN0eC5maWxsVGV4dChzLnRleHQsIHMueCwgcy55KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Ym90dG9tOiAzMDAsXG5cdHNpZGU6IDI1MCxcblx0d2F0ZXI6IDExNSxcblx0cGlwZXM6IFtcblx0XHQ5MCxcblx0XHQxNDUsXG5cdFx0MjAwXG5cdF0sXG5cdGNvbnRyb2xzOiBbXG5cdFx0ODEsXG5cdFx0ODcsXG5cdFx0Njlcblx0XSxcblx0azogMC4wMSxcblx0cGlwZWR1cjogMjUwLFxuXHRzY2FsZTogMixcblx0YmVnaW5EZWxheTogMjAwMCxcblx0aGVhcnRzcGF3bjogMjUsXG5cdHNwYXduOiA1NTBcbn07XG4iLCJ2YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcblx0dGhpcy50eXBlID0gXCJ0ZXh0XCI7XG5cdHRoaXMubmFtZSA9IFwic2NvcmVcIjtcblx0dGhpcy5mb250ID0gXCJzYW5zLXNlcmlmXCI7XG5cdHRoaXMuYWxpZ24gPSBcInJpZ2h0XCI7XG5cdHRoaXMuc2l6ZSA9IDIwO1xuXHR0aGlzLnggPSBydWxlcy5zaWRlIC0gMTA7XG5cdHRoaXMueSA9IHRoaXMuc2l6ZTtcblx0dGhpcy50ZXh0ID0gXCIwXCI7XG5cdHRoaXMudXBkYXRlID0gZnVuY3Rpb24odil7XG5cdFx0dGhpcy50ZXh0ID0gdjtcblx0fTtcbn07XG4iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0aW1lKXtcblx0cmV0dXJuIDM1MCArIChyYW5kb20ubnVtYmVyKDE4MDApIC0gKHRpbWUgLyBydWxlcy5zcGF3bikpO1xufTtcbiIsInZhciBNYXJpbyA9IHJlcXVpcmUoXCIuL21hcmlvXCIpO1xudmFyIFBpcGUgPSByZXF1aXJlKFwiLi9waXBlXCIpO1xudmFyIFNjb3JlYm9hcmQgPSByZXF1aXJlKFwiLi9zY29yZWJvYXJkXCIpO1xudmFyIEhlYXJ0ID0gcmVxdWlyZShcIi4vaGVhcnRcIik7XG52YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuc2NhbGUgPSBydWxlcy5zY2FsZTtcblx0dGhpcy50aW1lID0gMTtcblx0dGhpcy5zY29yZSA9IDA7XG5cdHRoaXMubGl2ZXMgPSAzO1xuXHR0aGlzLmxvc2luZyA9IGZhbHNlO1xuXHR0aGlzLmNyZWF0ZWQgPSB0cnVlO1xuXHR0aGlzLnNjb3JlYm9hcmQgPSB7fTtcblx0dGhpcy5oZWFydHMgPSBbXTtcblx0dGhpcy5waXBlcyA9IFtdO1xuXHR0aGlzLmhpID0gMDtcblx0dGhpcy5sb3N0c2NyZWVuID0ge1xuXHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdG5hbWU6IFwibG9zdFwiLFxuXHRcdHNpemU6IFwiMjBcIixcblx0XHRmb250OiBcInNhbnMtc2VyaWZcIixcblx0XHRjb2xvcjogXCIjRkYwMDAwXCIsXG5cdFx0dGV4dDogXCJZT1UgTE9TVCFcIixcblx0XHR4OiAxMjAsXG5cdFx0eTogNjVcblx0fTtcblx0dGhpcy5ncmVldHNjcmVlbiA9IHtcblx0XHR0eXBlOiBcInRleHRcIixcblx0XHRuYW1lOiBcImdyZWV0XCIsXG5cdFx0c2l6ZTogXCIyMFwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdGNvbG9yOiBcIiM2QkZGNjNcIixcblx0XHR0ZXh0OiBcIk1BUklPIENBVENIXCIsXG5cdFx0eDogMTMwLFxuXHRcdHk6IDcwXG5cdH07XG5cdHRoaXMuc3RhcnRzY3JlZW4gPSB7XG5cdFx0dHlwZTogXCJ0ZXh0XCIsXG5cdFx0bmFtZTogXCJsb3N0XCIsXG5cdFx0c2l6ZTogXCIxMFwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdHRleHQ6IFwicHJlc3MgeCB0byBzdGFydC4gcHJlc3Mga2V5cyB0byByYWlzZSBwaXBlcy5cIixcblx0XHR4OiAxMzAsXG5cdFx0eTogODVcblx0fTtcblx0dGhpcy5pbnN0cnVjdGlvbnNjcmVlbiA9IHtcblx0XHR0eXBlOiBcInRleHRcIixcblx0XHRuYW1lOiBcImxvc3RcIixcblx0XHRzaXplOiBcIjhcIixcblx0XHRmb250OiBcInNhbnMtc2VyaWZcIixcblx0XHR0ZXh0OiBcIlEgICAgICAgICAgICAgICAgICAgVyAgICAgICAgICAgICAgICAgICAgRVwiLFxuXHRcdHg6IDE1NSxcblx0XHR5OiAxMTBcblx0fTtcblx0dGhpcy5zcHJpdGVzID0gW3tcblx0XHR0eXBlOiBcInJlY3RcIixcblx0XHRuYW1lOiBcInNreVwiLFxuXHRcdGNvbG9yOiBcIiM1Qzk0RkNcIixcblx0XHR3aWR0aDogMjUwLFxuXHRcdGhlaWdodDogMTUwLFxuXHRcdHg6IDAsXG5cdFx0eTogMFxuXHR9LCB7XG5cdFx0dHlwZTogXCJpbWdcIixcblx0XHRuYW1lOiBcImNsb3VkXCIsXG5cdFx0c3JjOiBcImNsb3VkLnBuZ1wiLFxuXHRcdHg6IDgwLFxuXHRcdHk6IDEyLFxuXHRcdG9wYWNpdHk6IDAuOCxcblx0XHR3aWR0aDogNDAsXG5cdFx0aGVpZ2h0OiAyNVxuXHR9LCB7XG5cdFx0dHlwZTogXCJpbWdcIixcblx0XHRuYW1lOiBcImNsb3VkXCIsXG5cdFx0c3JjOiBcImNsb3VkLnBuZ1wiLFxuXHRcdHg6IDE2MCxcblx0XHR5OiAzNSxcblx0XHRvcGFjaXR5OiAwLjgsXG5cdFx0d2lkdGg6IDI0LFxuXHRcdGhlaWdodDogMTVcblx0fSwge1xuXHRcdHR5cGU6IFwiaW1nXCIsXG5cdFx0bmFtZTogXCJibG9ja3NcIixcblx0XHRzcmM6IFwiYmxvY2tzLnBuZ1wiLFxuXHRcdHg6IDAsXG5cdFx0eTogMzQsXG5cdFx0d2lkdGg6IDM0LFxuXHRcdGhlaWdodDogMTdcblx0fSwge1xuXHRcdHR5cGU6IFwicmVjdFwiLFxuXHRcdG5hbWU6IFwid2F0ZXJcIixcblx0XHRjb2xvcjogXCIjMTVEQ0UyXCIsXG5cdFx0b3BhY2l0eTogMC41LFxuXHRcdHk6IHJ1bGVzLndhdGVyLFxuXHRcdHg6IDAsXG5cdFx0d2lkdGg6IDMwMCxcblx0XHRoZWlnaHQ6IDM1XG5cdH1dO1xuXHR0aGlzLmNyZWF0ZU1hcmlvID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1hcmlvID0gbmV3IE1hcmlvKCk7XG5cdFx0bWFyaW8ub25TcGF3bigpO1xuXHRcdC8vdmFyIGRiYyA9IHJlcXVpcmUoXCIuLi9kZWJ1Zy9jdXJ2ZVwiKTtcblx0XHQvL3RoaXMuc3ByaXRlcyA9IHRoaXMuc3ByaXRlcy5jb25jYXQoZGJjKG1hcmlvLnBhdGgpKTtcblx0XHR0aGlzLnNwcml0ZXMuc3BsaWNlKDMsIDAsIG1hcmlvKTtcblx0fTtcblx0dGhpcy5jcmVhdGVQaXBlcyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcnVsZXMucGlwZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBwaXBlID0gbmV3IFBpcGUoKTtcblx0XHRcdHBpcGUub25TcGF3bihpKTtcblx0XHRcdHRoaXMucGlwZXMucHVzaChwaXBlKTtcblx0XHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UoMywgMCwgdGhpcy5waXBlc1tpXSk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmNyZWF0ZUhlYXJ0cyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG5cdFx0XHR2YXIgaGVhcnQgPSBuZXcgSGVhcnQoKTtcblx0XHRcdGhlYXJ0Lm9uU3Bhd24oaSk7XG5cdFx0XHR0aGlzLmhlYXJ0cy5wdXNoKGhlYXJ0KTtcblx0XHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuaGVhcnRzW2ldKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuY3JlYXRlU2NvcmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNjb3JlYm9hcmQgPSBuZXcgU2NvcmVib2FyZCgpO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuc2NvcmVib2FyZCk7XG5cdH07XG5cdHRoaXMubG9zdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLmxpdmVzID4gMCkge1xuXHRcdFx0dGhpcy5saXZlcy0tO1xuXHRcdFx0dGhpcy5oZWFydHNbdGhpcy5saXZlc10ubG9zZSgpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5saXZlcyA9PT0gMCkge1xuXHRcdFx0dGhpcy5sb3N0R2FtZSgpO1xuXHRcdH1cblx0fTtcblx0dGhpcy5oZWFydGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMubGl2ZXMgPCAzICYmICF0aGlzLmxvc2luZykge1xuXHRcdFx0dGhpcy5saXZlcysrO1xuXHRcdFx0dGhpcy5oZWFydHNbdGhpcy5saXZlcyAtIDFdLmdhaW4oKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuZ2FpbmVkID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zY29yZSsrO1xuXHRcdHRoaXMuc2NvcmVib2FyZC51cGRhdGUodGhpcy5zY29yZSk7XG5cdH07XG5cdHRoaXMubG9zdEdhbWUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxvc2luZyA9IHRydWU7XG5cdFx0aWYgKHRoaXMuc2NvcmUgPiB0aGlzLmhpKSB0aGlzLnNldEhpKCk7XG5cdFx0dGhpcy5zY29yZWJvYXJkLnVwZGF0ZShcImxhc3Q6IFwiICsgdGhpcy5zY29yZSArIFwiIGhpOiBcIiArIHRoaXMuaGkpO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMubG9zdHNjcmVlbik7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5zdGFydHNjcmVlbik7XG5cdH07XG5cdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcmVhdGVkID0gdHJ1ZTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLmdyZWV0c2NyZWVuKTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLnN0YXJ0c2NyZWVuKTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLmluc3RydWN0aW9uc2NyZWVuKTtcblx0fTtcblx0dGhpcy5zdGFydGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcmVhdGVkID0gZmFsc2U7XG5cdFx0dmFyIGwgPSB0aGlzLnNwcml0ZXMubGVuZ3RoIC0gMTtcblx0XHR0aGlzLnNwcml0ZXMuc3BsaWNlKGwsIDEpO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UobCAtIDEsIDEpO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UobCAtIDIsIDEpO1xuXHRcdHRoaXMuY3JlYXRlUGlwZXMoKTtcblx0XHR0aGlzLmNyZWF0ZVNjb3JlKCk7XG5cdFx0dGhpcy5jcmVhdGVIZWFydHMoKTtcblx0XHR0aGlzLmdldEhpKCk7XG5cdH07XG5cdHRoaXMuc2V0SGkgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmhpID0gdGhpcy5zY29yZTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImhpXCIsIHRoaXMuc2NvcmUpO1xuXHR9O1xuXHR0aGlzLmdldEhpID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5oaSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiaGlcIik7XG5cdH07XG59O1xuIl19
