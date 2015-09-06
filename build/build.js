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
		if(random.repnumber(rules.heartspawn) == 1) {
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
	heartspawn: 25
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
module.exports = function(time){
	return 350 + (random.number(1800) - (time / 500));
};

},{"./rand":8}],13:[function(require,module,exports){
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
		y: 10,
		opacity: 0.8,
		width: 40,
		height: 25
	}, {
		type: "img",
		name: "cloud",
		src: "cloud.png",
		x: 150,
		y: 30,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9hdWRpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL2hlYXJ0LmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9tYXJpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcGlwZS5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcmFmLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yYW5kLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yZW5kZXJlci5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcnVsZXMuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3Njb3JlYm9hcmQuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3NwYXduZXIuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3N0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciByZW5kZXIgPSByZXF1aXJlKFwiLi9yZW5kZXJlclwiKTtcbnZhciByYWYgPSByZXF1aXJlKFwiLi9yYWZcIik7XG52YXIgYXVkaW8gPSByZXF1aXJlKFwiLi9hdWRpb1wiKTtcbnZhciBTdGF0ZSA9IHJlcXVpcmUoXCIuL3N0YXRlXCIpO1xudmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG52YXIgc3Bhd25lciA9IHJlcXVpcmUoXCIuL3NwYXduZXJcIik7XG52YXIgc3RhdGU7XG5cbnZhciBpbml0aWFsaXplID0gZnVuY3Rpb24oKSB7XG5cdHN0YXRlID0gbmV3IFN0YXRlKCk7XG5cdHN0YXRlLmNyZWF0ZSgpO1xuXHRyYWYuc3RhcnQoZnVuY3Rpb24oZSkge1xuXHRcdHJlbmRlcihzdGF0ZSk7XG5cdH0pO1xufTtcblxudmFyIHN0YXJ0R2FtZSA9IGZ1bmN0aW9uKCkge1xuXHRzdGF0ZS5zdGFydGVkKCk7XG5cdHNldFRpbWVvdXQoc3Bhd24sIHJ1bGVzLmJlZ2luRGVsYXkpO1xufTtcblxudmFyIHNwYXduID0gZnVuY3Rpb24oKSB7XG5cdGlmICghc3RhdGUubG9zaW5nKSB7XG5cdFx0c3RhdGUuY3JlYXRlTWFyaW8oKTtcblx0XHR2YXIgdCA9IHNwYXduZXIoc3RhdGUudGltZSk7XG5cdFx0c3RhdGUudGltZSArPSB0O1xuXHRcdHNldFRpbWVvdXQoc3Bhd24sIHQpO1xuXHR9XG59O1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZSkge1xuXHRpZiAoZS53aGljaCA9PSA4OCAmJiAoc3RhdGUubG9zaW5nIHx8IHN0YXRlLmNyZWF0ZWQpKSB7XG5cdFx0YXVkaW8ucGxheShcInNjb3JlXCIpO1xuXHRcdGluaXRpYWxpemUoKTtcblx0XHRzdGFydEdhbWUoKTtcblx0fVxufSk7XG5cbmluaXRpYWxpemUoKTtcbiIsInZhciBuYW1lcyA9IFtcImp1bXBcIiwgXCJwaXBlXCIsIFwid2F0ZXJcIiwgXCJzY29yZVwiXTtcbnZhciBmaWxlcyA9IHt9O1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHBsYXk6IGZ1bmN0aW9uKGYpIHtcblx0XHRmaWxlc1tmXS5wbGF5KCk7XG5cdH1cbn07XG5cbm5hbWVzLmZvckVhY2goZnVuY3Rpb24obm0pIHtcblx0ZmlsZXNbbm1dID0gbmV3IEF1ZGlvKFwiYXNzZXRzL1wiICsgbm0gKyBcIi5vZ2dcIik7XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oeCwgcGF0aCl7XG5cdENTUEwuZ2V0TmF0dXJhbEtzKHBhdGgueCwgcGF0aC55LCBwYXRoLmspO1xuXHRyZXR1cm4gQ1NQTC5ldmFsU3BsaW5lKHgsIHBhdGgueCwgcGF0aC55LCBwYXRoLmspO1xufTtcblxuLy9DU1BMIFNjcmlwdCBieSBJdmFuIEssIEFkYXB0ZWQgZm9yIHRoZSBnYW1lXG52YXIgQ1NQTCA9IGZ1bmN0aW9uKCkge307XG5DU1BMLl9nYXVzc0ogPSB7fTtcbkNTUEwuX2dhdXNzSi5zb2x2ZSA9IGZ1bmN0aW9uKEEsIHgpIC8vIGluIE1hdHJpeCwgb3V0IHNvbHV0aW9uc1xuXHR7XG5cdFx0dmFyIG0gPSBBLmxlbmd0aDtcblx0XHRmb3IgKHZhciBrID0gMDsgayA8IG07IGsrKykgLy8gY29sdW1uXG5cdFx0e1xuXHRcdFx0Ly8gcGl2b3QgZm9yIGNvbHVtblxuXHRcdFx0dmFyIGlfbWF4ID0gMDtcblx0XHRcdHZhciB2YWxpID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuXHRcdFx0Zm9yICh2YXIgaSA9IGs7IGkgPCBtOyBpKyspXG5cdFx0XHRcdGlmIChBW2ldW2tdID4gdmFsaSkge1xuXHRcdFx0XHRcdGlfbWF4ID0gaTtcblx0XHRcdFx0XHR2YWxpID0gQVtpXVtrXTtcblx0XHRcdFx0fVxuXHRcdFx0Q1NQTC5fZ2F1c3NKLnN3YXBSb3dzKEEsIGssIGlfbWF4KTtcblx0XHRcdC8vIGZvciBhbGwgcm93cyBiZWxvdyBwaXZvdFxuXHRcdFx0Zm9yICh2YXIgaSA9IGsgKyAxOyBpIDwgbTsgaSsrKSB7XG5cdFx0XHRcdGZvciAodmFyIGogPSBrICsgMTsgaiA8IG0gKyAxOyBqKyspXG5cdFx0XHRcdFx0QVtpXVtqXSA9IEFbaV1bal0gLSBBW2tdW2pdICogKEFbaV1ba10gLyBBW2tdW2tdKTtcblx0XHRcdFx0QVtpXVtrXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IG0gLSAxOyBpID49IDA7IGktLSkgLy8gcm93cyA9IGNvbHVtbnNcblx0XHR7XG5cdFx0XHR2YXIgdiA9IEFbaV1bbV0gLyBBW2ldW2ldO1xuXHRcdFx0eFtpXSA9IHY7XG5cdFx0XHRmb3IgKHZhciBqID0gaSAtIDE7IGogPj0gMDsgai0tKSAvLyByb3dzXG5cdFx0XHR7XG5cdFx0XHRcdEFbal1bbV0gLT0gQVtqXVtpXSAqIHY7XG5cdFx0XHRcdEFbal1baV0gPSAwO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbkNTUEwuX2dhdXNzSi56ZXJvc01hdCA9IGZ1bmN0aW9uKHIsIGMpIHtcblx0dmFyIEEgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCByOyBpKyspIHtcblx0XHRBLnB1c2goW10pO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgYzsgaisrKSBBW2ldLnB1c2goMCk7XG5cdH1cblx0cmV0dXJuIEE7XG59O1xuQ1NQTC5fZ2F1c3NKLnByaW50TWF0ID0gZnVuY3Rpb24oQSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IEEubGVuZ3RoOyBpKyspIGNvbnNvbGUubG9nKEFbaV0pO1xufTtcbkNTUEwuX2dhdXNzSi5zd2FwUm93cyA9IGZ1bmN0aW9uKG0sIGssIGwpIHtcblx0dmFyIHAgPSBtW2tdO1xuXHRtW2tdID0gbVtsXTtcblx0bVtsXSA9IHA7XG59O1xuQ1NQTC5nZXROYXR1cmFsS3MgPSBmdW5jdGlvbih4cywgeXMsIGtzKSAvLyBpbiB4IHZhbHVlcywgaW4geSB2YWx1ZXMsIG91dCBrIHZhbHVlc1xuXHR7XG5cdFx0dmFyIG4gPSB4cy5sZW5ndGggLSAxO1xuXHRcdHZhciBBID0gQ1NQTC5fZ2F1c3NKLnplcm9zTWF0KG4gKyAxLCBuICsgMik7XG5cblx0XHRmb3IgKHZhciBpID0gMTsgaSA8IG47IGkrKykgLy8gcm93c1xuXHRcdHtcblx0XHRcdEFbaV1baSAtIDFdID0gMSAvICh4c1tpXSAtIHhzW2kgLSAxXSk7XG5cblx0XHRcdEFbaV1baV0gPSAyICogKDEgLyAoeHNbaV0gLSB4c1tpIC0gMV0pICsgMSAvICh4c1tpICsgMV0gLSB4c1tpXSkpO1xuXG5cdFx0XHRBW2ldW2kgKyAxXSA9IDEgLyAoeHNbaSArIDFdIC0geHNbaV0pO1xuXG5cdFx0XHRBW2ldW24gKyAxXSA9IDMgKiAoKHlzW2ldIC0geXNbaSAtIDFdKSAvICgoeHNbaV0gLSB4c1tpIC0gMV0pICogKHhzW2ldIC0geHNbaSAtIDFdKSkgKyAoeXNbaSArIDFdIC0geXNbaV0pIC8gKCh4c1tpICsgMV0gLSB4c1tpXSkgKiAoeHNbaSArIDFdIC0geHNbaV0pKSk7XG5cdFx0fVxuXG5cdFx0QVswXVswXSA9IDIgLyAoeHNbMV0gLSB4c1swXSk7XG5cdFx0QVswXVsxXSA9IDEgLyAoeHNbMV0gLSB4c1swXSk7XG5cdFx0QVswXVtuICsgMV0gPSAzICogKHlzWzFdIC0geXNbMF0pIC8gKCh4c1sxXSAtIHhzWzBdKSAqICh4c1sxXSAtIHhzWzBdKSk7XG5cblx0XHRBW25dW24gLSAxXSA9IDEgLyAoeHNbbl0gLSB4c1tuIC0gMV0pO1xuXHRcdEFbbl1bbl0gPSAyIC8gKHhzW25dIC0geHNbbiAtIDFdKTtcblx0XHRBW25dW24gKyAxXSA9IDMgKiAoeXNbbl0gLSB5c1tuIC0gMV0pIC8gKCh4c1tuXSAtIHhzW24gLSAxXSkgKiAoeHNbbl0gLSB4c1tuIC0gMV0pKTtcblxuXHRcdENTUEwuX2dhdXNzSi5zb2x2ZShBLCBrcyk7XG5cdH07XG5DU1BMLmV2YWxTcGxpbmUgPSBmdW5jdGlvbih4LCB4cywgeXMsIGtzKSB7XG5cdHZhciBpID0gMTtcblx0d2hpbGUgKHhzW2ldIDwgeCkgaSsrO1xuXG5cdHZhciB0ID0gKHggLSB4c1tpIC0gMV0pIC8gKHhzW2ldIC0geHNbaSAtIDFdKTtcblxuXHR2YXIgYSA9IGtzW2kgLSAxXSAqICh4c1tpXSAtIHhzW2kgLSAxXSkgLSAoeXNbaV0gLSB5c1tpIC0gMV0pO1xuXHR2YXIgYiA9IC1rc1tpXSAqICh4c1tpXSAtIHhzW2kgLSAxXSkgKyAoeXNbaV0gLSB5c1tpIC0gMV0pO1xuXG5cdHZhciBxID0gKDEgLSB0KSAqIHlzW2kgLSAxXSArIHQgKiB5c1tpXSArIHQgKiAoMSAtIHQpICogKGEgKiAoMSAtIHQpICsgYiAqIHQpO1xuXHRyZXR1cm4gcTtcbn07XG4iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMueCA9IDEwO1xuXHR0aGlzLnkgPSAxMjU7XG5cdHRoaXMubyA9IHtcblx0XHR4OiAwLFxuXHRcdHk6IDBcblx0fTtcblx0dGhpcy53aWR0aCA9IDE1O1xuXHR0aGlzLmhlaWdodCA9IDEzO1xuXHR0aGlzLm5hbWUgPSBcImhlYXJ0XCI7XG5cdHRoaXMudHlwZSA9IFwiaW1nXCI7XG5cdHRoaXMuc3JjID0gXCJoZWFydC5wbmdcIjtcblx0dGhpcy5zaGFrZXNyYyA9IFwiXCI7XG5cdHRoaXMuZnVsbCA9IHRydWU7XG5cdHRoaXMuc2hha2VudW0gPSAwO1xuXHR0aGlzLnNoYWtldGhyZXMgPSAxMDtcblx0dGhpcy5zaGFrZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMueCA9IHRoaXMuby54ICsgcmFuZG9tLm51bWJlcig1KTtcblx0XHR0aGlzLnkgPSB0aGlzLm8ueSArIHJhbmRvbS5udW1iZXIoNSk7XG5cdFx0dGhpcy5zaGFrZW51bSsrO1xuXHRcdGlmICh0aGlzLnNoYWtlbnVtIDwgdGhpcy5zaGFrZXRocmVzKSBzZXRUaW1lb3V0KHRoaXMuc2hha2UuYmluZCh0aGlzKSwgMjApO1xuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy54ID0gdGhpcy5vLng7XG5cdFx0XHR0aGlzLnkgPSB0aGlzLm8ueTtcblx0XHRcdHRoaXMuc2hha2VudW0gPSAwO1xuXHRcdFx0dGhpcy5zcmMgPSB0aGlzLnNoYWtlc3JjO1xuXHRcdH1cblx0fTtcblx0dGhpcy5sb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vLnggPSB0aGlzLng7XG5cdFx0dGhpcy5vLnkgPSB0aGlzLnk7XG5cdFx0dGhpcy5zaGFrZXNyYyA9IFwiaGVhcnQtZW1wdHkucG5nXCI7XG5cdFx0dGhpcy5zaGFrZSgpO1xuXHRcdHRoaXMuZnVsbCA9IGZhbHNlO1xuXHR9O1xuXHR0aGlzLmdhaW4gPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMuZnVsbCA9IHRydWU7XG5cdFx0dGhpcy5zaGFrZXNyYyA9IFwiaGVhcnQucG5nXCI7XG5cdFx0dGhpcy5zaGFrZSgpO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbihpKXtcblx0XHR0aGlzLnggKz0gKHRoaXMud2lkdGggKyAyKSAqIGk7XG5cdH07XG59O1xuIiwidmFyIGN1cnZlID0gcmVxdWlyZShcIi4vY3VydmVcIik7XG52YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLndpZHRoID0gMTI7XG5cdHRoaXMuaGVpZ2h0ID0gMTY7XG5cdHRoaXMub3BhY2l0eSA9IDE7XG5cdHRoaXMueCA9IC0xNTtcblx0dGhpcy55ID0gMzQgLSB0aGlzLmhlaWdodDtcblx0dGhpcy50eXBlID0gXCJpbWdcIjtcblx0dGhpcy5uYW1lID0gXCJtYXJpb1wiO1xuXHR0aGlzLnNyYyA9IFwibWFyaW8ucG5nXCI7XG5cdHRoaXMucmVtb3ZlID0gZmFsc2U7XG5cdHRoaXMua2lsbGVkID0gZmFsc2U7XG5cdHRoaXMuZmFkaW5nID0gZmFsc2U7XG5cdHRoaXMucmVhY2hlZCA9IGZhbHNlO1xuXHR0aGlzLmRlc3RwaXBlID0gMDtcblx0dGhpcy5wYXRoID0ge1xuXHRcdHg6IFstMTUsIDE3LCAzMF0sXG5cdFx0eTogWzM0IC0gdGhpcy5oZWlnaHQsIDM0IC0gdGhpcy5oZWlnaHQsIDEwXSxcblx0XHRrOiBbcnVsZXMuaywgcnVsZXMuaywgcnVsZXMua11cblx0fTtcblx0dGhpcy5nZW5lcmF0ZUN1cnZlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kZXN0cGlwZSA9IHJhbmRvbS5yZXBudW1iZXIocnVsZXMucGlwZXMubGVuZ3RoKTtcblx0XHR2YXIgayA9IHJ1bGVzLms7XG5cdFx0dGhpcy5wYXRoLmsgPSB0aGlzLnBhdGguay5jb25jYXQoW2ssIGssIGtdKTtcblx0XHR2YXIgZGVzdHggPSBydWxlcy5waXBlc1t0aGlzLmRlc3RwaXBlXSArIDE1O1xuXHRcdHZhciB0aHJlcyA9IGRlc3R4IC0gKHJhbmRvbS5udW1iZXIoMjApICsgMjApO1xuXG5cdFx0Ly9jbGltYXhcblx0XHR0aGlzLnBhdGgueS5wdXNoKDMpO1xuXHRcdHRoaXMucGF0aC54LnB1c2godGhyZXMgLyAyKTtcblxuXHRcdC8vYnVmZmVyIGFwcHJvYWNoXG5cdFx0dGhpcy5wYXRoLnkucHVzaChydWxlcy53YXRlciAvIDIpO1xuXHRcdHRoaXMucGF0aC54LnB1c2godGhyZXMpO1xuXG5cdFx0Ly9kZXN0aW5hdGlvblxuXHRcdHRoaXMucGF0aC55LnB1c2gocnVsZXMud2F0ZXIpO1xuXHRcdHRoaXMucGF0aC54LnB1c2goZGVzdHgpO1xuXHR9O1xuXHR0aGlzLnRpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy54ID4gdGhpcy5wYXRoLnhbMV0pIHRoaXMueSA9IGN1cnZlKHRoaXMueCwgdGhpcy5wYXRoKTsgLy8gY3VydmUgaWYgbm90IG9uIGRlY2tcblx0XHRpZiAodGhpcy54ID09IHRoaXMucGF0aC54WzFdICsgMTApIGF1ZGlvLnBsYXkoXCJqdW1wXCIpO1xuXHRcdHRoaXMueCsrO1xuXHRcdGlmICh0aGlzLnkgPCBydWxlcy53YXRlcikgc2V0VGltZW91dCh0aGlzLnRpY2suYmluZCh0aGlzKSwgMTApO1xuXHRcdGVsc2UgaWYgKCF0aGlzLnJlYWNoZWQpIHtcblx0XHRcdHRoaXMuZmFkaW5nID0gdHJ1ZTtcblx0XHRcdGF1ZGlvLnBsYXkoXCJ3YXRlclwiKTtcblx0XHRcdHRoaXMuZmFkZU91dCgpO1xuXHRcdH1cblx0fTtcblx0dGhpcy5mYWRlT3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vcGFjaXR5IC09IDAuMTtcblx0XHRpZiAodGhpcy5vcGFjaXR5ID4gMC4xKSBzZXRUaW1lb3V0KHRoaXMuZmFkZU91dC5iaW5kKHRoaXMpLCA1MCk7XG5cdFx0ZWxzZSB0aGlzLnJlbW92ZSA9IHRydWU7XG5cdH07XG5cdHRoaXMuYmVnaW4gPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdlbmVyYXRlQ3VydmUoKTtcblx0XHR0aGlzLnRpY2soKTtcblx0fTtcblx0dGhpcy5vblNwYXduID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYocmFuZG9tLnJlcG51bWJlcihydWxlcy5oZWFydHNwYXduKSA9PSAxKSB7XG5cdFx0XHR0aGlzLm5hbWUgPSBcImhlYXJ0cFwiO1xuXHRcdFx0dGhpcy5zcmMgPSBcImhlYXJ0cC5wbmdcIjtcblx0XHRcdHRoaXMud2lkdGggPSAxMDtcblx0XHRcdHRoaXMuaGVpZ2h0ID0gOTtcblx0XHR9XG5cdFx0dGhpcy5iZWdpbigpO1xuXHR9O1xufTtcbiIsInZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy54ID0gMDtcblx0dGhpcy55ID0gMDtcblx0dGhpcy50eXBlID0gXCJpbWdcIjtcblx0dGhpcy5uYW1lID0gXCJwaXBlXCI7XG5cdHRoaXMuc3JjID0gXCJwaXBlLnBuZ1wiO1xuXHR0aGlzLndpZHRoID0gMzA7XG5cdHRoaXMuaGVpZ2h0ID0gNzA7XG5cdHRoaXMucGlwZW4gPSAwO1xuXHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuXHR0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuXHR0aGlzLmRvd24gPSBmYWxzZTtcblx0dGhpcy5hbmltYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hbmltYXRpbmcgPSB0cnVlO1xuXHRcdHRoaXMuYWN0aXZlID0gdHJ1ZTtcblx0XHRhdWRpby5wbGF5KFwicGlwZVwiKTtcblx0XHR0aGlzLnRpY2soKTtcblx0fTtcblx0dGhpcy5hbmltYXRpb25Eb25lID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kb3duID0gZmFsc2U7XG5cdFx0dGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcblx0XHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuXHR9O1xuXHR0aGlzLnRpY2sgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdjtcblx0XHRpZiAoIXRoaXMuZG93bikgdGhpcy55LS07XG5cdFx0ZWxzZSB0aGlzLnkrKztcblx0XHRpZiAodGhpcy55ID09IDgwKSB0aGlzLmRvd24gPSB0cnVlO1xuXHRcdGlmICh0aGlzLnkgPCAxMzApIHNldFRpbWVvdXQodGhpcy50aWNrLmJpbmQodGhpcyksIHJ1bGVzLnBpcGVkdXIgLyA1MCk7XG5cdFx0ZWxzZSBpZiAodGhpcy55ID09IDEzMCkgdGhpcy5hbmltYXRpb25Eb25lKCk7XG5cdH07XG5cdHRoaXMucmlzZSA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy55LS07XG5cdFx0aWYodGhpcy55ID4gMTMwKSBzZXRUaW1lb3V0KHRoaXMucmlzZS5iaW5kKHRoaXMpLCBydWxlcy5iZWdpbkRlbGF5IC8gMTAwKTtcblx0XHRlbHNlIHRoaXMuaW5pdEV2ZW50KCk7XG5cdH07XG5cdHRoaXMub25TcGF3biA9IGZ1bmN0aW9uKG4pIHtcblx0XHR0aGlzLnggPSBydWxlcy5waXBlc1tuXTtcblx0XHR0aGlzLnkgPSBydWxlcy5ib3R0b20tMTIwO1xuXHRcdHRoaXMucGlwZW4gPSBuO1xuXHRcdHRoaXMucmlzZSgpO1xuXHR9O1xuXHR0aGlzLmtleSA9IGZ1bmN0aW9uKGUpIHtcblx0XHRpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG5cdFx0XHRpZiAoZS53aGljaCA9PSBydWxlcy5jb250cm9sc1t0aGlzLnBpcGVuXSkge1xuXHRcdFx0XHR0aGlzLmFuaW1hdGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdHRoaXMudG91Y2ggPSBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHggPSAoZS54IC0gY2FudmFzLm9mZnNldExlZnQpIC8gcnVsZXMuc2NhbGU7XG5cdFx0dmFyIHkgPSAoZS55IC0gY2FudmFzLm9mZnNldFRvcCkgLyBydWxlcy5zY2FsZTtcblx0XHRpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG5cdFx0XHRpZiAoeCA+PSB0aGlzLnggJiYgeCA8PSB0aGlzLnggKyAzMCkge1xuXHRcdFx0XHR0aGlzLmFuaW1hdGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdHRoaXMuaW5pdEV2ZW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHQgPSB0aGlzO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR0LmtleShlKTtcblx0XHR9KTtcblx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR0LnRvdWNoKGUpO1xuXHRcdH0sIGZhbHNlKTtcblx0fTtcbn07XG4iLCIvLyBIb2xkcyBsYXN0IGl0ZXJhdGlvbiB0aW1lc3RhbXAuXG52YXIgdGltZSA9IDA7XG5cbi8qKlxuICogQ2FsbHMgYGZuYCBvbiBuZXh0IGZyYW1lLlxuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb25cbiAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiByYWYoZm4pIHtcbiAgcmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgdmFyIGVsYXBzZWQgPSBub3cgLSB0aW1lO1xuXG4gICAgaWYgKGVsYXBzZWQgPiA5OTkpIHtcbiAgICAgIGVsYXBzZWQgPSAxIC8gNjA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsYXBzZWQgLz0gMTAwMDtcbiAgICB9XG5cbiAgICB0aW1lID0gbm93O1xuICAgIGZuKGVsYXBzZWQpO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBDYWxscyBgZm5gIG9uIGV2ZXJ5IGZyYW1lIHdpdGggYGVsYXBzZWRgIHNldCB0byB0aGUgZWxhcHNlZFxuICAgKiB0aW1lIGluIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvblxuICAgKiBAcmV0dXJuIHtpbnR9IFRoZSByZXF1ZXN0IElEXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBzdGFydDogZnVuY3Rpb24oZm4pIHtcbiAgICByZXR1cm4gcmFmKGZ1bmN0aW9uIHRpY2soZWxhcHNlZCkge1xuICAgICAgZm4oZWxhcHNlZCk7XG4gICAgICByYWYodGljayk7XG4gICAgfSk7XG4gIH0sXG4gIC8qKlxuICAgKiBDYW5jZWxzIHRoZSBzcGVjaWZpZWQgYW5pbWF0aW9uIGZyYW1lIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7aW50fSBpZCBUaGUgcmVxdWVzdCBJRFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgc3RvcDogZnVuY3Rpb24oaWQpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpO1xuICB9XG59O1xuIiwidmFyIHByZXY7XG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0bnVtYmVyOiBmdW5jdGlvbihtYXgpIHsgLy9yZXR1cm5zIGJldHdlZW4gMCBhbmQgbWF4IC0gMVxuXHRcdHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuXHR9LFxuXHRyZXBudW1iZXI6IGZ1bmN0aW9uKG1heCkgeyAvL3NhbWUgYXMgbnVtYmVyIGJ1dCBub24tcmVwZWF0aW5nXG5cdFx0dmFyIHJlcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG5cdFx0aWYgKHJlcyA9PSBwcmV2KSB7XG5cdFx0XHRpZiAocmVzID4gMCkgcmVzIC09IDE7ICAvL3llcyB2ZXJ5IGNoZWFwXG5cdFx0XHRlbHNlIHJlcyA9IDE7XG5cdFx0fVxuXHRcdHByZXYgPSByZXM7XG5cdFx0cmV0dXJuIHJlcztcblx0fVxufTtcbiIsInZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNcIik7XG52YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpO1xuY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuY3R4Lm1vekltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuY3R4LndlYmtpdEltYWdlU21vb3RobG9jaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG5cdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0Y3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcblx0Y3R4LnNjYWxlKHN0YXRlLnNjYWxlLCBzdGF0ZS5zY2FsZSk7XG5cdHZhciBwaXBlcyA9IHN0YXRlLnBpcGVzO1xuXHRzdGF0ZS5zcHJpdGVzLmZvckVhY2goZnVuY3Rpb24ocywgaSkge1xuXHRcdGlmIChzLm5hbWUgPT0gXCJtYXJpb1wiIHx8IHMubmFtZSA9PSBcImhlYXJ0cFwiKSB7XG5cdFx0XHR2YXIgcCA9IHBpcGVzW3MuZGVzdHBpcGVdO1xuXHRcdFx0aWYgKHMucmVtb3ZlKSB7XG5cdFx0XHRcdHN0YXRlLnNwcml0ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fSBlbHNlIGlmIChzLmZhZGluZyAmJiAhcy5raWxsZWQpIHtcblx0XHRcdFx0aWYgKHMubmFtZSA9PSBcIm1hcmlvXCIpIHN0YXRlLmxvc3QoKTtcblx0XHRcdFx0cy5raWxsZWQgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIGlmIChwLmFjdGl2ZSAmJiAocy54ID4gcC54ICYmIHMueCA8IHAueCArIDMwKSAmJiAocy55ID49IHAueSkgJiYgIShzLmZhZGluZykgJiYgIShzdGF0ZS5sb3NpbmcpKSB7XG5cdFx0XHRcdHMucmVhY2hlZCA9IHRydWU7XG5cdFx0XHRcdHN0YXRlLnNwcml0ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRhdWRpby5wbGF5KFwic2NvcmVcIik7XG5cdFx0XHRcdGlmIChzLm5hbWUgPT0gXCJtYXJpb1wiKSBzdGF0ZS5nYWluZWQoKTtcblx0XHRcdFx0ZWxzZSBzdGF0ZS5oZWFydGVkKCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChzLnJlbW92ZSkge1xuXHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHRcdGlmIChzLm9wYWNpdHkpIGN0eC5nbG9iYWxBbHBoYSA9IHMub3BhY2l0eTtcblx0XHRlbHNlIGN0eC5nbG9iYWxBbHBoYSA9IDE7XG5cdFx0c3dpdGNoIChzLnR5cGUpIHtcblx0XHRcdGNhc2UgXCJyZWN0XCI6XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBzLmNvbG9yO1xuXHRcdFx0XHRjdHguZmlsbFJlY3Qocy54LCBzLnksIHMud2lkdGgsIHMuaGVpZ2h0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiaW1nXCI6XG5cdFx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdFx0aW1nLnNyYyA9IFwiYXNzZXRzL1wiICsgcy5zcmM7XG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UoaW1nLCBzLngsIHMueSwgcy53aWR0aCwgcy5oZWlnaHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJ0ZXh0XCI6XG5cdFx0XHRcdGN0eC5mb250ID0gcy5zaXplICsgXCJweCBcIiArIHMuZm9udDtcblx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9IHMuYWxpZ24gfHwgXCJjZW50ZXJcIjtcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHMuY29sb3IgfHwgXCIjRkZGRkZGXCI7XG5cdFx0XHRcdGN0eC5maWxsVGV4dChzLnRleHQsIHMueCwgcy55KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Ym90dG9tOiAzMDAsXG5cdHNpZGU6IDI1MCxcblx0d2F0ZXI6IDExNSxcblx0cGlwZXM6IFtcblx0XHQ5MCxcblx0XHQxNDUsXG5cdFx0MjAwXG5cdF0sXG5cdGNvbnRyb2xzOiBbXG5cdFx0ODEsXG5cdFx0ODcsXG5cdFx0Njlcblx0XSxcblx0azogMC4wMSxcblx0cGlwZWR1cjogMjUwLFxuXHRzY2FsZTogMixcblx0YmVnaW5EZWxheTogMjAwMCxcblx0aGVhcnRzcGF3bjogMjVcbn07XG4iLCJ2YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcblx0dGhpcy50eXBlID0gXCJ0ZXh0XCI7XG5cdHRoaXMubmFtZSA9IFwic2NvcmVcIjtcblx0dGhpcy5mb250ID0gXCJzYW5zLXNlcmlmXCI7XG5cdHRoaXMuYWxpZ24gPSBcInJpZ2h0XCI7XG5cdHRoaXMuc2l6ZSA9IDIwO1xuXHR0aGlzLnggPSBydWxlcy5zaWRlIC0gMTA7XG5cdHRoaXMueSA9IHRoaXMuc2l6ZTtcblx0dGhpcy50ZXh0ID0gXCIwXCI7XG5cdHRoaXMudXBkYXRlID0gZnVuY3Rpb24odil7XG5cdFx0dGhpcy50ZXh0ID0gdjtcblx0fTtcbn07XG4iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGltZSl7XG5cdHJldHVybiAzNTAgKyAocmFuZG9tLm51bWJlcigxODAwKSAtICh0aW1lIC8gNTAwKSk7XG59O1xuIiwidmFyIE1hcmlvID0gcmVxdWlyZShcIi4vbWFyaW9cIik7XG52YXIgUGlwZSA9IHJlcXVpcmUoXCIuL3BpcGVcIik7XG52YXIgU2NvcmVib2FyZCA9IHJlcXVpcmUoXCIuL3Njb3JlYm9hcmRcIik7XG52YXIgSGVhcnQgPSByZXF1aXJlKFwiLi9oZWFydFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5zY2FsZSA9IHJ1bGVzLnNjYWxlO1xuXHR0aGlzLnRpbWUgPSAxO1xuXHR0aGlzLnNjb3JlID0gMDtcblx0dGhpcy5saXZlcyA9IDM7XG5cdHRoaXMubG9zaW5nID0gZmFsc2U7XG5cdHRoaXMuY3JlYXRlZCA9IHRydWU7XG5cdHRoaXMuc2NvcmVib2FyZCA9IHt9O1xuXHR0aGlzLmhlYXJ0cyA9IFtdO1xuXHR0aGlzLnBpcGVzID0gW107XG5cdHRoaXMuaGkgPSAwO1xuXHR0aGlzLmxvc3RzY3JlZW4gPSB7XG5cdFx0dHlwZTogXCJ0ZXh0XCIsXG5cdFx0bmFtZTogXCJsb3N0XCIsXG5cdFx0c2l6ZTogXCIyMFwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdGNvbG9yOiBcIiNGRjAwMDBcIixcblx0XHR0ZXh0OiBcIllPVSBMT1NUIVwiLFxuXHRcdHg6IDEyMCxcblx0XHR5OiA2NVxuXHR9O1xuXHR0aGlzLmdyZWV0c2NyZWVuID0ge1xuXHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdG5hbWU6IFwiZ3JlZXRcIixcblx0XHRzaXplOiBcIjIwXCIsXG5cdFx0Zm9udDogXCJzYW5zLXNlcmlmXCIsXG5cdFx0Y29sb3I6IFwiIzZCRkY2M1wiLFxuXHRcdHRleHQ6IFwiTUFSSU8gQ0FUQ0hcIixcblx0XHR4OiAxMzAsXG5cdFx0eTogNzBcblx0fTtcblx0dGhpcy5zdGFydHNjcmVlbiA9IHtcblx0XHR0eXBlOiBcInRleHRcIixcblx0XHRuYW1lOiBcImxvc3RcIixcblx0XHRzaXplOiBcIjEwXCIsXG5cdFx0Zm9udDogXCJzYW5zLXNlcmlmXCIsXG5cdFx0dGV4dDogXCJwcmVzcyB4IHRvIHN0YXJ0LiBwcmVzcyBrZXlzIHRvIHJhaXNlIHBpcGVzLlwiLFxuXHRcdHg6IDEzMCxcblx0XHR5OiA4NVxuXHR9O1xuXHR0aGlzLmluc3RydWN0aW9uc2NyZWVuID0ge1xuXHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdG5hbWU6IFwibG9zdFwiLFxuXHRcdHNpemU6IFwiOFwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdHRleHQ6IFwiUSAgICAgICAgICAgICAgICAgICBXICAgICAgICAgICAgICAgICAgICBFXCIsXG5cdFx0eDogMTU1LFxuXHRcdHk6IDExMFxuXHR9O1xuXHR0aGlzLnNwcml0ZXMgPSBbe1xuXHRcdHR5cGU6IFwicmVjdFwiLFxuXHRcdG5hbWU6IFwic2t5XCIsXG5cdFx0Y29sb3I6IFwiIzVDOTRGQ1wiLFxuXHRcdHdpZHRoOiAyNTAsXG5cdFx0aGVpZ2h0OiAxNTAsXG5cdFx0eDogMCxcblx0XHR5OiAwXG5cdH0sIHtcblx0XHR0eXBlOiBcImltZ1wiLFxuXHRcdG5hbWU6IFwiY2xvdWRcIixcblx0XHRzcmM6IFwiY2xvdWQucG5nXCIsXG5cdFx0eDogODAsXG5cdFx0eTogMTAsXG5cdFx0b3BhY2l0eTogMC44LFxuXHRcdHdpZHRoOiA0MCxcblx0XHRoZWlnaHQ6IDI1XG5cdH0sIHtcblx0XHR0eXBlOiBcImltZ1wiLFxuXHRcdG5hbWU6IFwiY2xvdWRcIixcblx0XHRzcmM6IFwiY2xvdWQucG5nXCIsXG5cdFx0eDogMTUwLFxuXHRcdHk6IDMwLFxuXHRcdG9wYWNpdHk6IDAuOCxcblx0XHR3aWR0aDogMjQsXG5cdFx0aGVpZ2h0OiAxNVxuXHR9LCB7XG5cdFx0dHlwZTogXCJpbWdcIixcblx0XHRuYW1lOiBcImJsb2Nrc1wiLFxuXHRcdHNyYzogXCJibG9ja3MucG5nXCIsXG5cdFx0eDogMCxcblx0XHR5OiAzNCxcblx0XHR3aWR0aDogMzQsXG5cdFx0aGVpZ2h0OiAxN1xuXHR9LCB7XG5cdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0bmFtZTogXCJ3YXRlclwiLFxuXHRcdGNvbG9yOiBcIiMxNURDRTJcIixcblx0XHRvcGFjaXR5OiAwLjUsXG5cdFx0eTogcnVsZXMud2F0ZXIsXG5cdFx0eDogMCxcblx0XHR3aWR0aDogMzAwLFxuXHRcdGhlaWdodDogMzVcblx0fV07XG5cdHRoaXMuY3JlYXRlTWFyaW8gPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFyaW8gPSBuZXcgTWFyaW8oKTtcblx0XHRtYXJpby5vblNwYXduKCk7XG5cdFx0Ly92YXIgZGJjID0gcmVxdWlyZShcIi4uL2RlYnVnL2N1cnZlXCIpO1xuXHRcdC8vdGhpcy5zcHJpdGVzID0gdGhpcy5zcHJpdGVzLmNvbmNhdChkYmMobWFyaW8ucGF0aCkpO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UoMywgMCwgbWFyaW8pO1xuXHR9O1xuXHR0aGlzLmNyZWF0ZVBpcGVzID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5waXBlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHBpcGUgPSBuZXcgUGlwZSgpO1xuXHRcdFx0cGlwZS5vblNwYXduKGkpO1xuXHRcdFx0dGhpcy5waXBlcy5wdXNoKHBpcGUpO1xuXHRcdFx0dGhpcy5zcHJpdGVzLnNwbGljZSgzLCAwLCB0aGlzLnBpcGVzW2ldKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuY3JlYXRlSGVhcnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAzOyBpKyspIHtcblx0XHRcdHZhciBoZWFydCA9IG5ldyBIZWFydCgpO1xuXHRcdFx0aGVhcnQub25TcGF3bihpKTtcblx0XHRcdHRoaXMuaGVhcnRzLnB1c2goaGVhcnQpO1xuXHRcdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5oZWFydHNbaV0pO1xuXHRcdH1cblx0fTtcblx0dGhpcy5jcmVhdGVTY29yZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc2NvcmVib2FyZCA9IG5ldyBTY29yZWJvYXJkKCk7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5zY29yZWJvYXJkKTtcblx0fTtcblx0dGhpcy5sb3N0ID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMubGl2ZXMgPiAwKSB7XG5cdFx0XHR0aGlzLmxpdmVzLS07XG5cdFx0XHR0aGlzLmhlYXJ0c1t0aGlzLmxpdmVzXS5sb3NlKCk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmxpdmVzID09PSAwKSB7XG5cdFx0XHR0aGlzLmxvc3RHYW1lKCk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmhlYXJ0ZWQgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5saXZlcyA8IDMgJiYgIXRoaXMubG9zaW5nKSB7XG5cdFx0XHR0aGlzLmxpdmVzKys7XG5cdFx0XHR0aGlzLmhlYXJ0c1t0aGlzLmxpdmVzIC0gMV0uZ2FpbigpO1xuXHRcdH1cblx0fTtcblx0dGhpcy5nYWluZWQgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNjb3JlKys7XG5cdFx0dGhpcy5zY29yZWJvYXJkLnVwZGF0ZSh0aGlzLnNjb3JlKTtcblx0fTtcblx0dGhpcy5sb3N0R2FtZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubG9zaW5nID0gdHJ1ZTtcblx0XHRpZiAodGhpcy5zY29yZSA+IHRoaXMuaGkpIHRoaXMuc2V0SGkoKTtcblx0XHR0aGlzLnNjb3JlYm9hcmQudXBkYXRlKFwibGFzdDogXCIgKyB0aGlzLnNjb3JlICsgXCIgaGk6IFwiICsgdGhpcy5oaSk7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5sb3N0c2NyZWVuKTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLnN0YXJ0c2NyZWVuKTtcblx0fTtcblx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNyZWF0ZWQgPSB0cnVlO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuZ3JlZXRzY3JlZW4pO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuc3RhcnRzY3JlZW4pO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuaW5zdHJ1Y3Rpb25zY3JlZW4pO1xuXHR9O1xuXHR0aGlzLnN0YXJ0ZWQgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNyZWF0ZWQgPSBmYWxzZTtcblx0XHR2YXIgbCA9IHRoaXMuc3ByaXRlcy5sZW5ndGggLSAxO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UobCwgMSk7XG5cdFx0dGhpcy5zcHJpdGVzLnNwbGljZShsIC0gMSwgMSk7XG5cdFx0dGhpcy5zcHJpdGVzLnNwbGljZShsIC0gMiwgMSk7XG5cdFx0dGhpcy5jcmVhdGVQaXBlcygpO1xuXHRcdHRoaXMuY3JlYXRlU2NvcmUoKTtcblx0XHR0aGlzLmNyZWF0ZUhlYXJ0cygpO1xuXHRcdHRoaXMuZ2V0SGkoKTtcblx0fTtcblx0dGhpcy5zZXRIaSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuaGkgPSB0aGlzLnNjb3JlO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiaGlcIiwgdGhpcy5zY29yZSk7XG5cdH07XG5cdHRoaXMuZ2V0SGkgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmhpID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJoaVwiKTtcblx0fTtcbn07XG4iXX0=
