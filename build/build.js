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
	checkLoop();
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
	this.created = true;
	this.scoreboard = {};
	this.hearts = [];
	this.pipes = [];
	this.lostscreen = {
		type: "text",
		name: "lost",
		size: "20",
		align: "center",
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
		align: "center",
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
		align: "center",
		font: "sans-serif",
		color: "#FFFFFF",
		text: "press x to start. press keys to raise pipes.",
		x: 130,
		y: 85
	};
	this.instructionscreen = {
		type: "text",
		name: "lost",
		size: "8",
		font: "sans-serif",
		color: "#FFFFFF",
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
		this.sprites.splice(1, 0, mario);
	};
	this.createPipes = function() {
		for (var i = 0; i < rules.pipes.length; i++) {
			var pipe = new Pipe();
			pipe.onSpawn(i);
			this.pipes.push(pipe);
			this.sprites.splice(1, 0, this.pipes[i]);
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
	this.gained = function() {
		this.score++;
		this.scoreboard.update(this.score);
	};
	this.lostGame = function() {
		this.losing = true;
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
	};
};

},{"./heart":4,"./mario":5,"./pipe":6,"./rules":10,"./scoreboard":11}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9hdWRpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL2hlYXJ0LmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9tYXJpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcGlwZS5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcmFmLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yYW5kLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yZW5kZXJlci5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcnVsZXMuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3Njb3JlYm9hcmQuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3NwYXduZXIuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3N0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHJlbmRlciA9IHJlcXVpcmUoXCIuL3JlbmRlcmVyXCIpO1xudmFyIHJhZiA9IHJlcXVpcmUoXCIuL3JhZlwiKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpO1xudmFyIFN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVcIik7XG52YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbnZhciBzcGF3bmVyID0gcmVxdWlyZShcIi4vc3Bhd25lclwiKTtcbnZhciBzdGF0ZTtcblxudmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbigpIHtcblx0c3RhdGUgPSBuZXcgU3RhdGUoKTtcblx0c3RhdGUuY3JlYXRlKCk7XG5cdGNoZWNrTG9vcCgpO1xuXHRyYWYuc3RhcnQoZnVuY3Rpb24oZSkge1xuXHRcdHJlbmRlcihzdGF0ZSk7XG5cdH0pO1xufTtcblxudmFyIHN0YXJ0R2FtZSA9IGZ1bmN0aW9uKCkge1xuXHRzdGF0ZS5zdGFydGVkKCk7XG5cdHNldFRpbWVvdXQoc3Bhd24sIHJ1bGVzLmJlZ2luRGVsYXkpO1xufTtcblxudmFyIHNwYXduID0gZnVuY3Rpb24oKSB7XG5cdGlmICghc3RhdGUubG9zaW5nKSB7XG5cdFx0c3RhdGUuY3JlYXRlTWFyaW8oKTtcblx0XHR2YXIgdCA9IHNwYXduZXIoc3RhdGUudGltZSk7XG5cdFx0c3RhdGUudGltZSArPSB0O1xuXHRcdHNldFRpbWVvdXQoc3Bhd24sIHQpO1xuXHR9XG59O1xuXG52YXIgY2hlY2tMb29wID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwaXBlcyA9IHN0YXRlLnBpcGVzO1xuXHRzdGF0ZS5zcHJpdGVzLmZvckVhY2goZnVuY3Rpb24ocywgaSkge1xuXHRcdGlmIChzLm5hbWUgPT0gXCJtYXJpb1wiKSB7XG5cdFx0XHR2YXIgcCA9IHBpcGVzW3MuZGVzdHBpcGVdO1xuXHRcdFx0aWYgKHMucmVtb3ZlKSB7XG5cdFx0XHRcdHN0YXRlLnNwcml0ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fSBlbHNlIGlmIChzLmZhZGluZyAmJiAhcy5raWxsZWQpIHtcblx0XHRcdFx0c3RhdGUubG9zdCgpO1xuXHRcdFx0XHRzLmtpbGxlZCA9IHRydWU7XG5cdFx0XHR9IGVsc2UgaWYgKHAuYWN0aXZlICYmIChzLnggPiBwLnggJiYgcy54IDwgcC54ICsgMzApICYmIChzLnkgPj0gcC55KSAmJiAhKHMuZmFkaW5nKSAmJiAhKHN0YXRlLmxvc2luZykpIHtcblx0XHRcdFx0cy5yZWFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdGF1ZGlvLnBsYXkoXCJzY29yZVwiKTtcblx0XHRcdFx0c3RhdGUuZ2FpbmVkKCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChzLnJlbW92ZSkge1xuXHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHR9KTtcblx0c2V0VGltZW91dChjaGVja0xvb3AsIDEwKTtcbn07XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKSB7XG5cdGlmIChlLndoaWNoID09IDg4ICYmIChzdGF0ZS5sb3NpbmcgfHwgc3RhdGUuY3JlYXRlZCkpIHtcblx0XHRhdWRpby5wbGF5KFwic2NvcmVcIik7XG5cdFx0aW5pdGlhbGl6ZSgpO1xuXHRcdHN0YXJ0R2FtZSgpO1xuXHR9XG59KTtcblxuaW5pdGlhbGl6ZSgpO1xuIiwidmFyIG5hbWVzID0gW1wianVtcFwiLCBcInBpcGVcIiwgXCJ3YXRlclwiLCBcInNjb3JlXCJdO1xudmFyIGZpbGVzID0ge307XG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0cGxheTogZnVuY3Rpb24oZikge1xuXHRcdGZpbGVzW2ZdLnBsYXkoKTtcblx0fVxufTtcblxubmFtZXMuZm9yRWFjaChmdW5jdGlvbihubSkge1xuXHRmaWxlc1tubV0gPSBuZXcgQXVkaW8oXCJhc3NldHMvXCIgKyBubSArIFwiLndhdlwiKTtcbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih4LCBwYXRoKXtcblx0Q1NQTC5nZXROYXR1cmFsS3MocGF0aC54LCBwYXRoLnksIHBhdGguayk7XG5cdHJldHVybiBDU1BMLmV2YWxTcGxpbmUoeCwgcGF0aC54LCBwYXRoLnksIHBhdGguayk7XG59O1xuXG4vL0NTUEwgU2NyaXB0IGJ5IEl2YW4gSywgQWRhcHRlZCBmb3IgdGhlIGdhbWVcbnZhciBDU1BMID0gZnVuY3Rpb24oKSB7fTtcbkNTUEwuX2dhdXNzSiA9IHt9O1xuQ1NQTC5fZ2F1c3NKLnNvbHZlID0gZnVuY3Rpb24oQSwgeCkgLy8gaW4gTWF0cml4LCBvdXQgc29sdXRpb25zXG5cdHtcblx0XHR2YXIgbSA9IEEubGVuZ3RoO1xuXHRcdGZvciAodmFyIGsgPSAwOyBrIDwgbTsgaysrKSAvLyBjb2x1bW5cblx0XHR7XG5cdFx0XHQvLyBwaXZvdCBmb3IgY29sdW1uXG5cdFx0XHR2YXIgaV9tYXggPSAwO1xuXHRcdFx0dmFyIHZhbGkgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG5cdFx0XHRmb3IgKHZhciBpID0gazsgaSA8IG07IGkrKylcblx0XHRcdFx0aWYgKEFbaV1ba10gPiB2YWxpKSB7XG5cdFx0XHRcdFx0aV9tYXggPSBpO1xuXHRcdFx0XHRcdHZhbGkgPSBBW2ldW2tdO1xuXHRcdFx0XHR9XG5cdFx0XHRDU1BMLl9nYXVzc0ouc3dhcFJvd3MoQSwgaywgaV9tYXgpO1xuXHRcdFx0Ly8gZm9yIGFsbCByb3dzIGJlbG93IHBpdm90XG5cdFx0XHRmb3IgKHZhciBpID0gayArIDE7IGkgPCBtOyBpKyspIHtcblx0XHRcdFx0Zm9yICh2YXIgaiA9IGsgKyAxOyBqIDwgbSArIDE7IGorKylcblx0XHRcdFx0XHRBW2ldW2pdID0gQVtpXVtqXSAtIEFba11bal0gKiAoQVtpXVtrXSAvIEFba11ba10pO1xuXHRcdFx0XHRBW2ldW2tdID0gMDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gbSAtIDE7IGkgPj0gMDsgaS0tKSAvLyByb3dzID0gY29sdW1uc1xuXHRcdHtcblx0XHRcdHZhciB2ID0gQVtpXVttXSAvIEFbaV1baV07XG5cdFx0XHR4W2ldID0gdjtcblx0XHRcdGZvciAodmFyIGogPSBpIC0gMTsgaiA+PSAwOyBqLS0pIC8vIHJvd3Ncblx0XHRcdHtcblx0XHRcdFx0QVtqXVttXSAtPSBBW2pdW2ldICogdjtcblx0XHRcdFx0QVtqXVtpXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuQ1NQTC5fZ2F1c3NKLnplcm9zTWF0ID0gZnVuY3Rpb24ociwgYykge1xuXHR2YXIgQSA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHI7IGkrKykge1xuXHRcdEEucHVzaChbXSk7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjOyBqKyspIEFbaV0ucHVzaCgwKTtcblx0fVxuXHRyZXR1cm4gQTtcbn07XG5DU1BMLl9nYXVzc0oucHJpbnRNYXQgPSBmdW5jdGlvbihBKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgQS5sZW5ndGg7IGkrKykgY29uc29sZS5sb2coQVtpXSk7XG59O1xuQ1NQTC5fZ2F1c3NKLnN3YXBSb3dzID0gZnVuY3Rpb24obSwgaywgbCkge1xuXHR2YXIgcCA9IG1ba107XG5cdG1ba10gPSBtW2xdO1xuXHRtW2xdID0gcDtcbn07XG5DU1BMLmdldE5hdHVyYWxLcyA9IGZ1bmN0aW9uKHhzLCB5cywga3MpIC8vIGluIHggdmFsdWVzLCBpbiB5IHZhbHVlcywgb3V0IGsgdmFsdWVzXG5cdHtcblx0XHR2YXIgbiA9IHhzLmxlbmd0aCAtIDE7XG5cdFx0dmFyIEEgPSBDU1BMLl9nYXVzc0ouemVyb3NNYXQobiArIDEsIG4gKyAyKTtcblxuXHRcdGZvciAodmFyIGkgPSAxOyBpIDwgbjsgaSsrKSAvLyByb3dzXG5cdFx0e1xuXHRcdFx0QVtpXVtpIC0gMV0gPSAxIC8gKHhzW2ldIC0geHNbaSAtIDFdKTtcblxuXHRcdFx0QVtpXVtpXSA9IDIgKiAoMSAvICh4c1tpXSAtIHhzW2kgLSAxXSkgKyAxIC8gKHhzW2kgKyAxXSAtIHhzW2ldKSk7XG5cblx0XHRcdEFbaV1baSArIDFdID0gMSAvICh4c1tpICsgMV0gLSB4c1tpXSk7XG5cblx0XHRcdEFbaV1bbiArIDFdID0gMyAqICgoeXNbaV0gLSB5c1tpIC0gMV0pIC8gKCh4c1tpXSAtIHhzW2kgLSAxXSkgKiAoeHNbaV0gLSB4c1tpIC0gMV0pKSArICh5c1tpICsgMV0gLSB5c1tpXSkgLyAoKHhzW2kgKyAxXSAtIHhzW2ldKSAqICh4c1tpICsgMV0gLSB4c1tpXSkpKTtcblx0XHR9XG5cblx0XHRBWzBdWzBdID0gMiAvICh4c1sxXSAtIHhzWzBdKTtcblx0XHRBWzBdWzFdID0gMSAvICh4c1sxXSAtIHhzWzBdKTtcblx0XHRBWzBdW24gKyAxXSA9IDMgKiAoeXNbMV0gLSB5c1swXSkgLyAoKHhzWzFdIC0geHNbMF0pICogKHhzWzFdIC0geHNbMF0pKTtcblxuXHRcdEFbbl1bbiAtIDFdID0gMSAvICh4c1tuXSAtIHhzW24gLSAxXSk7XG5cdFx0QVtuXVtuXSA9IDIgLyAoeHNbbl0gLSB4c1tuIC0gMV0pO1xuXHRcdEFbbl1bbiArIDFdID0gMyAqICh5c1tuXSAtIHlzW24gLSAxXSkgLyAoKHhzW25dIC0geHNbbiAtIDFdKSAqICh4c1tuXSAtIHhzW24gLSAxXSkpO1xuXG5cdFx0Q1NQTC5fZ2F1c3NKLnNvbHZlKEEsIGtzKTtcblx0fTtcbkNTUEwuZXZhbFNwbGluZSA9IGZ1bmN0aW9uKHgsIHhzLCB5cywga3MpIHtcblx0dmFyIGkgPSAxO1xuXHR3aGlsZSAoeHNbaV0gPCB4KSBpKys7XG5cblx0dmFyIHQgPSAoeCAtIHhzW2kgLSAxXSkgLyAoeHNbaV0gLSB4c1tpIC0gMV0pO1xuXG5cdHZhciBhID0ga3NbaSAtIDFdICogKHhzW2ldIC0geHNbaSAtIDFdKSAtICh5c1tpXSAtIHlzW2kgLSAxXSk7XG5cdHZhciBiID0gLWtzW2ldICogKHhzW2ldIC0geHNbaSAtIDFdKSArICh5c1tpXSAtIHlzW2kgLSAxXSk7XG5cblx0dmFyIHEgPSAoMSAtIHQpICogeXNbaSAtIDFdICsgdCAqIHlzW2ldICsgdCAqICgxIC0gdCkgKiAoYSAqICgxIC0gdCkgKyBiICogdCk7XG5cdHJldHVybiBxO1xufTtcbiIsInZhciByYW5kb20gPSByZXF1aXJlKFwiLi9yYW5kXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy54ID0gMTA7XG5cdHRoaXMueSA9IDEyNTtcblx0dGhpcy5vID0ge1xuXHRcdHg6IDAsXG5cdFx0eTogMFxuXHR9O1xuXHR0aGlzLndpZHRoID0gMTU7XG5cdHRoaXMuaGVpZ2h0ID0gMTM7XG5cdHRoaXMubmFtZSA9IFwiaGVhcnRcIjtcblx0dGhpcy50eXBlID0gXCJpbWdcIjtcblx0dGhpcy5zcmMgPSBcImhlYXJ0LnBuZ1wiO1xuXHR0aGlzLmZ1bGwgPSB0cnVlO1xuXHR0aGlzLnNoYWtlbnVtID0gMDtcblx0dGhpcy5zaGFrZXRocmVzID0gMTA7XG5cdHRoaXMuc2hha2UgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnggPSB0aGlzLm8ueCArIHJhbmRvbS5udW1iZXIoNSk7XG5cdFx0dGhpcy55ID0gdGhpcy5vLnkgKyByYW5kb20ubnVtYmVyKDUpO1xuXHRcdHRoaXMuc2hha2VudW0rKztcblx0XHRpZiAodGhpcy5zaGFrZW51bSA8IHRoaXMuc2hha2V0aHJlcykgc2V0VGltZW91dCh0aGlzLnNoYWtlLmJpbmQodGhpcyksIDIwKTtcblx0XHRlbHNlIHtcblx0XHRcdHRoaXMueCA9IHRoaXMuby54O1xuXHRcdFx0dGhpcy55ID0gdGhpcy5vLnk7XG5cdFx0XHR0aGlzLnNyYyA9IFwiaGVhcnQtZW1wdHkucG5nXCI7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmxvc2UgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm8ueCA9IHRoaXMueDtcblx0XHR0aGlzLm8ueSA9IHRoaXMueTtcblx0XHR0aGlzLnNoYWtlKCk7XG5cdFx0dGhpcy5mdWxsID0gZmFsc2U7XG5cdH07XG5cdHRoaXMub25TcGF3biA9IGZ1bmN0aW9uKGkpe1xuXHRcdHRoaXMueCArPSAodGhpcy53aWR0aCArIDIpICogaTtcblx0fTtcbn07XG4iLCJ2YXIgY3VydmUgPSByZXF1aXJlKFwiLi9jdXJ2ZVwiKTtcbnZhciByYW5kb20gPSByZXF1aXJlKFwiLi9yYW5kXCIpO1xudmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG52YXIgYXVkaW8gPSByZXF1aXJlKFwiLi9hdWRpb1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMud2lkdGggPSAxMjtcblx0dGhpcy5oZWlnaHQgPSAxNjtcblx0dGhpcy5vcGFjaXR5ID0gMTtcblx0dGhpcy54ID0gLTE1O1xuXHR0aGlzLnkgPSAzNCAtIHRoaXMuaGVpZ2h0O1xuXHR0aGlzLnR5cGUgPSBcImltZ1wiO1xuXHR0aGlzLm5hbWUgPSBcIm1hcmlvXCI7XG5cdHRoaXMuc3JjID0gXCJtYXJpby5wbmdcIjtcblx0dGhpcy5yZW1vdmUgPSBmYWxzZTtcblx0dGhpcy5raWxsZWQgPSBmYWxzZTtcblx0dGhpcy5mYWRpbmcgPSBmYWxzZTtcblx0dGhpcy5yZWFjaGVkID0gZmFsc2U7XG5cdHRoaXMuZGVzdHBpcGUgPSAwO1xuXHR0aGlzLnBhdGggPSB7XG5cdFx0eDogWy0xNSwgMTcsIDMwXSxcblx0XHR5OiBbMzQgLSB0aGlzLmhlaWdodCwgMzQgLSB0aGlzLmhlaWdodCwgMTBdLFxuXHRcdGs6IFtydWxlcy5rLCBydWxlcy5rLCBydWxlcy5rXVxuXHR9O1xuXHR0aGlzLmdlbmVyYXRlQ3VydmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRlc3RwaXBlID0gcmFuZG9tLnJlcG51bWJlcihydWxlcy5waXBlcy5sZW5ndGgpO1xuXHRcdHZhciBrID0gcnVsZXMuaztcblx0XHR0aGlzLnBhdGguayA9IHRoaXMucGF0aC5rLmNvbmNhdChbaywgaywga10pO1xuXHRcdHZhciBkZXN0eCA9IHJ1bGVzLnBpcGVzW3RoaXMuZGVzdHBpcGVdICsgMTU7XG5cdFx0dmFyIHRocmVzID0gZGVzdHggLSAocmFuZG9tLm51bWJlcigyMCkgKyAyMCk7XG5cblx0XHQvL2NsaW1heFxuXHRcdHRoaXMucGF0aC55LnB1c2goMyk7XG5cdFx0dGhpcy5wYXRoLngucHVzaCh0aHJlcyAvIDIpO1xuXG5cdFx0Ly9idWZmZXIgYXBwcm9hY2hcblx0XHR0aGlzLnBhdGgueS5wdXNoKHJ1bGVzLndhdGVyIC8gMik7XG5cdFx0dGhpcy5wYXRoLngucHVzaCh0aHJlcyk7XG5cblx0XHQvL2Rlc3RpbmF0aW9uXG5cdFx0dGhpcy5wYXRoLnkucHVzaChydWxlcy53YXRlcik7XG5cdFx0dGhpcy5wYXRoLngucHVzaChkZXN0eCk7XG5cdH07XG5cdHRoaXMudGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLnggPiB0aGlzLnBhdGgueFsxXSkgdGhpcy55ID0gY3VydmUodGhpcy54LCB0aGlzLnBhdGgpOyAvLyBjdXJ2ZSBpZiBub3Qgb24gZGVja1xuXHRcdGlmICh0aGlzLnggPT0gdGhpcy5wYXRoLnhbMV0gKyAxMCkgYXVkaW8ucGxheShcImp1bXBcIik7XG5cdFx0dGhpcy54Kys7XG5cdFx0aWYgKHRoaXMueSA8IHJ1bGVzLndhdGVyKSBzZXRUaW1lb3V0KHRoaXMudGljay5iaW5kKHRoaXMpLCAxMCk7XG5cdFx0ZWxzZSBpZiAoIXRoaXMucmVhY2hlZCkge1xuXHRcdFx0dGhpcy5mYWRpbmcgPSB0cnVlO1xuXHRcdFx0YXVkaW8ucGxheShcIndhdGVyXCIpO1xuXHRcdFx0dGhpcy5mYWRlT3V0KCk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmZhZGVPdXQgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9wYWNpdHkgLT0gMC4xO1xuXHRcdGlmICh0aGlzLm9wYWNpdHkgPiAwLjEpIHNldFRpbWVvdXQodGhpcy5mYWRlT3V0LmJpbmQodGhpcyksIDUwKTtcblx0XHRlbHNlIHRoaXMucmVtb3ZlID0gdHJ1ZTtcblx0fTtcblx0dGhpcy5iZWdpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2VuZXJhdGVDdXJ2ZSgpO1xuXHRcdHRoaXMudGljaygpO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmJlZ2luKCk7XG5cdH07XG59O1xuIiwidmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG52YXIgYXVkaW8gPSByZXF1aXJlKFwiLi9hdWRpb1wiKTtcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnggPSAwO1xuXHR0aGlzLnkgPSAwO1xuXHR0aGlzLnR5cGUgPSBcImltZ1wiO1xuXHR0aGlzLm5hbWUgPSBcInBpcGVcIjtcblx0dGhpcy5zcmMgPSBcInBpcGUucG5nXCI7XG5cdHRoaXMud2lkdGggPSAzMDtcblx0dGhpcy5oZWlnaHQgPSAxMDA7XG5cdHRoaXMucGlwZW4gPSAwO1xuXHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuXHR0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuXHR0aGlzLmRvd24gPSBmYWxzZTtcblx0dGhpcy5hbmltYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hbmltYXRpbmcgPSB0cnVlO1xuXHRcdHRoaXMuYWN0aXZlID0gdHJ1ZTtcblx0XHRhdWRpby5wbGF5KFwicGlwZVwiKTtcblx0XHR0aGlzLnRpY2soKTtcblx0fTtcblx0dGhpcy5hbmltYXRpb25Eb25lID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kb3duID0gZmFsc2U7XG5cdFx0dGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcblx0XHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuXHR9O1xuXHR0aGlzLnRpY2sgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdjtcblx0XHRpZiAoIXRoaXMuZG93bikgdGhpcy55LS07XG5cdFx0ZWxzZSB0aGlzLnkrKztcblx0XHRpZiAodGhpcy55ID09IDgwKSB0aGlzLmRvd24gPSB0cnVlO1xuXHRcdGlmICh0aGlzLnkgPCAxMzApIHNldFRpbWVvdXQodGhpcy50aWNrLmJpbmQodGhpcyksIHJ1bGVzLnBpcGVkdXIgLyA1MCk7XG5cdFx0ZWxzZSBpZiAodGhpcy55ID09IDEzMCkgdGhpcy5hbmltYXRpb25Eb25lKCk7XG5cdH07XG5cdHRoaXMucmlzZSA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy55LS07XG5cdFx0aWYodGhpcy55ID4gMTMwKSBzZXRUaW1lb3V0KHRoaXMucmlzZS5iaW5kKHRoaXMpLCBydWxlcy5iZWdpbkRlbGF5IC8gMTAwKTtcblx0XHRlbHNlIHRoaXMuaW5pdEV2ZW50KCk7XG5cdH07XG5cdHRoaXMub25TcGF3biA9IGZ1bmN0aW9uKG4pIHtcblx0XHR0aGlzLnggPSBydWxlcy5waXBlc1tuXTtcblx0XHR0aGlzLnkgPSBydWxlcy5ib3R0b20tMTIwO1xuXHRcdHRoaXMucGlwZW4gPSBuO1xuXHRcdHRoaXMucmlzZSgpO1xuXHR9O1xuXHR0aGlzLmtleSA9IGZ1bmN0aW9uKGUpIHtcblx0XHRpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG5cdFx0XHRpZiAoZS53aGljaCA9PSBydWxlcy5jb250cm9sc1t0aGlzLnBpcGVuXSkge1xuXHRcdFx0XHR0aGlzLmFuaW1hdGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdHRoaXMudG91Y2ggPSBmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHggPSAoZS54IC0gY2FudmFzLm9mZnNldExlZnQpIC8gcnVsZXMuc2NhbGU7XG5cdFx0dmFyIHkgPSAoZS55IC0gY2FudmFzLm9mZnNldFRvcCkgLyBydWxlcy5zY2FsZTtcblx0XHRpZiAoIXRoaXMuYW5pbWF0aW5nKSB7XG5cdFx0XHRpZiAoeCA+PSB0aGlzLnggJiYgeCA8PSB0aGlzLnggKyAzMCkge1xuXHRcdFx0XHR0aGlzLmFuaW1hdGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdHRoaXMuaW5pdEV2ZW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHQgPSB0aGlzO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR0LmtleShlKTtcblx0XHR9KTtcblx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR0LnRvdWNoKGUpO1xuXHRcdH0sIGZhbHNlKTtcblx0fTtcbn07XG4iLCIvLyBIb2xkcyBsYXN0IGl0ZXJhdGlvbiB0aW1lc3RhbXAuXG52YXIgdGltZSA9IDA7XG5cbi8qKlxuICogQ2FsbHMgYGZuYCBvbiBuZXh0IGZyYW1lLlxuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb25cbiAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiByYWYoZm4pIHtcbiAgcmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgdmFyIGVsYXBzZWQgPSBub3cgLSB0aW1lO1xuXG4gICAgaWYgKGVsYXBzZWQgPiA5OTkpIHtcbiAgICAgIGVsYXBzZWQgPSAxIC8gNjA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsYXBzZWQgLz0gMTAwMDtcbiAgICB9XG5cbiAgICB0aW1lID0gbm93O1xuICAgIGZuKGVsYXBzZWQpO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBDYWxscyBgZm5gIG9uIGV2ZXJ5IGZyYW1lIHdpdGggYGVsYXBzZWRgIHNldCB0byB0aGUgZWxhcHNlZFxuICAgKiB0aW1lIGluIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvblxuICAgKiBAcmV0dXJuIHtpbnR9IFRoZSByZXF1ZXN0IElEXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBzdGFydDogZnVuY3Rpb24oZm4pIHtcbiAgICByZXR1cm4gcmFmKGZ1bmN0aW9uIHRpY2soZWxhcHNlZCkge1xuICAgICAgZm4oZWxhcHNlZCk7XG4gICAgICByYWYodGljayk7XG4gICAgfSk7XG4gIH0sXG4gIC8qKlxuICAgKiBDYW5jZWxzIHRoZSBzcGVjaWZpZWQgYW5pbWF0aW9uIGZyYW1lIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7aW50fSBpZCBUaGUgcmVxdWVzdCBJRFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgc3RvcDogZnVuY3Rpb24oaWQpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpO1xuICB9XG59O1xuIiwidmFyIHByZXY7XG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0bnVtYmVyOiBmdW5jdGlvbihtYXgpIHsgLy9yZXR1cm5zIGJldHdlZW4gMCBhbmQgbWF4IC0gMVxuXHRcdHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuXHR9LFxuXHRyZXBudW1iZXI6IGZ1bmN0aW9uKG1heCkgeyAvL3NhbWUgYXMgbnVtYmVyIGJ1dCBub24tcmVwZWF0aW5nXG5cdFx0dmFyIHJlcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG5cdFx0aWYgKHJlcyA9PSBwcmV2KSB7XG5cdFx0XHRpZiAocmVzID4gMCkgcmVzIC09IDE7ICAvL3llcyB2ZXJ5IGNoZWFwXG5cdFx0XHRlbHNlIHJlcyA9IDE7XG5cdFx0fVxuXHRcdHByZXYgPSByZXM7XG5cdFx0cmV0dXJuIHJlcztcblx0fVxufTtcbiIsInZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNcIik7XG52YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbmN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbmN0eC5tb3pJbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbmN0eC53ZWJraXRJbWFnZVNtb290aGxvY2luZ0VuYWJsZWQgPSBmYWxzZTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdGF0ZSkge1xuXHRjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XG5cdGN0eC5zY2FsZShzdGF0ZS5zY2FsZSwgc3RhdGUuc2NhbGUpO1xuXHRzdGF0ZS5zcHJpdGVzLmZvckVhY2goZnVuY3Rpb24ocykge1xuXHRcdGlmIChzLm9wYWNpdHkpIGN0eC5nbG9iYWxBbHBoYSA9IHMub3BhY2l0eTtcblx0XHRlbHNlIGN0eC5nbG9iYWxBbHBoYSA9IDE7XG5cdFx0c3dpdGNoIChzLnR5cGUpIHtcblx0XHRcdGNhc2UgXCJyZWN0XCI6XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBzLmNvbG9yO1xuXHRcdFx0XHRjdHguZmlsbFJlY3Qocy54LCBzLnksIHMud2lkdGgsIHMuaGVpZ2h0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiaW1nXCI6XG5cdFx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdFx0aW1nLnNyYyA9IFwiYXNzZXRzL1wiICsgcy5zcmM7XG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UoaW1nLCBzLngsIHMueSwgcy53aWR0aCwgcy5oZWlnaHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJ0ZXh0XCI6XG5cdFx0XHRcdGN0eC5mb250ID0gcy5zaXplICsgXCJweCBcIiArIHMuZm9udDtcblx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9IHMuYWxpZ247XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBzLmNvbG9yO1xuXHRcdFx0XHRjdHguZmlsbFRleHQocy50ZXh0LCBzLngsIHMueSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdGJvdHRvbTogMzAwLFxuXHRzaWRlOiAyNTAsXG5cdHdhdGVyOiAxMTUsXG5cdHBpcGVzOiBbXG5cdFx0OTAsXG5cdFx0MTQ1LFxuXHRcdDIwMFxuXHRdLFxuXHRjb250cm9sczogW1xuXHRcdDgxLFxuXHRcdDg3LFxuXHRcdDY5XG5cdF0sXG5cdGs6IDAuMDEsXG5cdHBpcGVkdXI6IDI1MCxcblx0c2NhbGU6IDIsXG5cdGJlZ2luRGVsYXk6IDIwMDBcbn07XG4iLCJ2YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcblx0dGhpcy50eXBlID0gXCJ0ZXh0XCI7XG5cdHRoaXMubmFtZSA9IFwic2NvcmVcIjtcblx0dGhpcy5mb250ID0gXCJzYW5zLXNlcmlmXCI7XG5cdHRoaXMuY29sb3IgPSBcIiNGRkZGRkZcIjtcblx0dGhpcy5hbGlnbiA9IFwicmlnaHRcIjtcblx0dGhpcy5zaXplID0gMjA7XG5cdHRoaXMueCA9IHJ1bGVzLnNpZGUgLSAxMDtcblx0dGhpcy55ID0gdGhpcy5zaXplO1xuXHR0aGlzLnRleHQgPSBcIjBcIjtcblx0dGhpcy51cGRhdGUgPSBmdW5jdGlvbih2KXtcblx0XHR0aGlzLnRleHQgPSB2O1xuXHR9O1xufTtcbiIsInZhciByYW5kb20gPSByZXF1aXJlKFwiLi9yYW5kXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0aW1lKXtcblx0cmV0dXJuIDM1MCArIHJhbmRvbS5udW1iZXIoMTgwMCk7XG59O1xuIiwidmFyIE1hcmlvID0gcmVxdWlyZShcIi4vbWFyaW9cIik7XG52YXIgUGlwZSA9IHJlcXVpcmUoXCIuL3BpcGVcIik7XG52YXIgU2NvcmVib2FyZCA9IHJlcXVpcmUoXCIuL3Njb3JlYm9hcmRcIik7XG52YXIgSGVhcnQgPSByZXF1aXJlKFwiLi9oZWFydFwiKTtcbi8vdmFyIEh1cnQgPSByZXF1aXJlKFwiLi9odXJ0XCIpO1xudmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnNjYWxlID0gcnVsZXMuc2NhbGU7XG5cdHRoaXMudGltZSA9IDE7XG5cdHRoaXMuc2NvcmUgPSAwO1xuXHR0aGlzLmxpdmVzID0gMztcblx0dGhpcy5sb3NpbmcgPSBmYWxzZTtcblx0dGhpcy5jcmVhdGVkID0gdHJ1ZTtcblx0dGhpcy5zY29yZWJvYXJkID0ge307XG5cdHRoaXMuaGVhcnRzID0gW107XG5cdHRoaXMucGlwZXMgPSBbXTtcblx0dGhpcy5sb3N0c2NyZWVuID0ge1xuXHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdG5hbWU6IFwibG9zdFwiLFxuXHRcdHNpemU6IFwiMjBcIixcblx0XHRhbGlnbjogXCJjZW50ZXJcIixcblx0XHRmb250OiBcInNhbnMtc2VyaWZcIixcblx0XHRjb2xvcjogXCIjRkYwMDAwXCIsXG5cdFx0dGV4dDogXCJZT1UgTE9TVCFcIixcblx0XHR4OiAxMjAsXG5cdFx0eTogNjVcblx0fTtcblx0dGhpcy5ncmVldHNjcmVlbiA9IHtcblx0XHR0eXBlOiBcInRleHRcIixcblx0XHRuYW1lOiBcImdyZWV0XCIsXG5cdFx0c2l6ZTogXCIyMFwiLFxuXHRcdGFsaWduOiBcImNlbnRlclwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdGNvbG9yOiBcIiM2QkZGNjNcIixcblx0XHR0ZXh0OiBcIk1BUklPIENBVENIXCIsXG5cdFx0eDogMTMwLFxuXHRcdHk6IDcwXG5cdH07XG5cdHRoaXMuc3RhcnRzY3JlZW4gPSB7XG5cdFx0dHlwZTogXCJ0ZXh0XCIsXG5cdFx0bmFtZTogXCJsb3N0XCIsXG5cdFx0c2l6ZTogXCIxMFwiLFxuXHRcdGFsaWduOiBcImNlbnRlclwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdGNvbG9yOiBcIiNGRkZGRkZcIixcblx0XHR0ZXh0OiBcInByZXNzIHggdG8gc3RhcnQuIHByZXNzIGtleXMgdG8gcmFpc2UgcGlwZXMuXCIsXG5cdFx0eDogMTMwLFxuXHRcdHk6IDg1XG5cdH07XG5cdHRoaXMuaW5zdHJ1Y3Rpb25zY3JlZW4gPSB7XG5cdFx0dHlwZTogXCJ0ZXh0XCIsXG5cdFx0bmFtZTogXCJsb3N0XCIsXG5cdFx0c2l6ZTogXCI4XCIsXG5cdFx0Zm9udDogXCJzYW5zLXNlcmlmXCIsXG5cdFx0Y29sb3I6IFwiI0ZGRkZGRlwiLFxuXHRcdHRleHQ6IFwiUSAgICAgICAgICAgICAgICAgICBXICAgICAgICAgICAgICAgICAgICBFXCIsXG5cdFx0eDogMTU1LFxuXHRcdHk6IDExMFxuXHR9O1xuXHR0aGlzLnNwcml0ZXMgPSBbe1xuXHRcdHR5cGU6IFwicmVjdFwiLFxuXHRcdG5hbWU6IFwic2t5XCIsXG5cdFx0Y29sb3I6IFwiIzVDOTRGQ1wiLFxuXHRcdHdpZHRoOiAyNTAsXG5cdFx0aGVpZ2h0OiAxNTAsXG5cdFx0eDogMCxcblx0XHR5OiAwXG5cdH0sIHtcblx0XHR0eXBlOiBcImltZ1wiLFxuXHRcdG5hbWU6IFwiYmxvY2tzXCIsXG5cdFx0c3JjOiBcImJsb2Nrcy5wbmdcIixcblx0XHR4OiAwLFxuXHRcdHk6IDM0LFxuXHRcdHdpZHRoOiAzNCxcblx0XHRoZWlnaHQ6IDE3XG5cdH0sIHtcblx0XHR0eXBlOiBcInJlY3RcIixcblx0XHRuYW1lOiBcIndhdGVyXCIsXG5cdFx0Y29sb3I6IFwiIzE1RENFMlwiLFxuXHRcdG9wYWNpdHk6IDAuNSxcblx0XHR5OiBydWxlcy53YXRlcixcblx0XHR4OiAwLFxuXHRcdHdpZHRoOiAzMDAsXG5cdFx0aGVpZ2h0OiAzNVxuXHR9XTtcblx0dGhpcy5jcmVhdGVNYXJpbyA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtYXJpbyA9IG5ldyBNYXJpbygpO1xuXHRcdG1hcmlvLm9uU3Bhd24oKTtcblx0XHQvL3ZhciBkYmMgPSByZXF1aXJlKFwiLi4vZGVidWcvY3VydmVcIik7XG5cdFx0Ly90aGlzLnNwcml0ZXMgPSB0aGlzLnNwcml0ZXMuY29uY2F0KGRiYyhtYXJpby5wYXRoKSk7XG5cdFx0dGhpcy5zcHJpdGVzLnNwbGljZSgxLCAwLCBtYXJpbyk7XG5cdH07XG5cdHRoaXMuY3JlYXRlUGlwZXMgPSBmdW5jdGlvbigpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLnBpcGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgcGlwZSA9IG5ldyBQaXBlKCk7XG5cdFx0XHRwaXBlLm9uU3Bhd24oaSk7XG5cdFx0XHR0aGlzLnBpcGVzLnB1c2gocGlwZSk7XG5cdFx0XHR0aGlzLnNwcml0ZXMuc3BsaWNlKDEsIDAsIHRoaXMucGlwZXNbaV0pO1xuXHRcdH1cblx0fTtcblx0dGhpcy5jcmVhdGVIZWFydHMgPSBmdW5jdGlvbigpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuXHRcdFx0dmFyIGhlYXJ0ID0gbmV3IEhlYXJ0KCk7XG5cdFx0XHRoZWFydC5vblNwYXduKGkpO1xuXHRcdFx0dGhpcy5oZWFydHMucHVzaChoZWFydCk7XG5cdFx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLmhlYXJ0c1tpXSk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmNyZWF0ZVNjb3JlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zY29yZWJvYXJkID0gbmV3IFNjb3JlYm9hcmQoKTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLnNjb3JlYm9hcmQpO1xuXHR9O1xuXHR0aGlzLmxvc3QgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5saXZlcyA+IDApIHtcblx0XHRcdHRoaXMubGl2ZXMtLTtcblx0XHRcdHRoaXMuaGVhcnRzW3RoaXMubGl2ZXNdLmxvc2UoKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMubGl2ZXMgPT09IDApIHtcblx0XHRcdHRoaXMubG9zdEdhbWUoKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuZ2FpbmVkID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zY29yZSsrO1xuXHRcdHRoaXMuc2NvcmVib2FyZC51cGRhdGUodGhpcy5zY29yZSk7XG5cdH07XG5cdHRoaXMubG9zdEdhbWUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxvc2luZyA9IHRydWU7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5sb3N0c2NyZWVuKTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLnN0YXJ0c2NyZWVuKTtcblx0fTtcblx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNyZWF0ZWQgPSB0cnVlO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuZ3JlZXRzY3JlZW4pO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuc3RhcnRzY3JlZW4pO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuaW5zdHJ1Y3Rpb25zY3JlZW4pO1xuXHR9O1xuXHR0aGlzLnN0YXJ0ZWQgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNyZWF0ZWQgPSBmYWxzZTtcblx0XHR2YXIgbCA9IHRoaXMuc3ByaXRlcy5sZW5ndGggLSAxO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UobCwgMSk7XG5cdFx0dGhpcy5zcHJpdGVzLnNwbGljZShsIC0gMSwgMSk7XG5cdFx0dGhpcy5zcHJpdGVzLnNwbGljZShsIC0gMiwgMSk7XG5cdFx0dGhpcy5jcmVhdGVQaXBlcygpO1xuXHRcdHRoaXMuY3JlYXRlU2NvcmUoKTtcblx0XHR0aGlzLmNyZWF0ZUhlYXJ0cygpO1xuXHR9O1xufTtcbiJdfQ==
