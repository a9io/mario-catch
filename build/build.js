(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var render = require("./renderer");
var raf = require("./raf");
var State = require("./state");
var state = new State();
state.createPipes();
state.createWater();

var loop = function() {
	state.createMario();
	setTimeout(loop, 2000);
};

var checkLoop = function() {
	getPipes(state, function(pipes) {
		state.sprites.forEach(function(s, i) {
			if (s.name == "mario") {
				var p = pipes[s.destpipe];
				if (s.lost) {
					state.sprites.splice(i, 1);
				} else if (p.active && (s.x > p.x && s.x < p.x + 30) && (s.y >= p.y) && !(p.fading)) {
					state.sprites.splice(i, 1);
				}
			}
		});
		setTimeout(checkLoop, 10);
	});
};

var getPipes = function(st, fn) {
	var p = [];
	st.sprites.forEach(function(s, i, a) {
		if (s.name == "pipe") {
			p[s.pipen] = s;
		}
		if (i == a.length - 1) {
			fn(p);
		}
	});
};

loop();
checkLoop();

raf.start(function(e) {
	render(state);
});

},{"./raf":6,"./renderer":8,"./state":10}],2:[function(require,module,exports){
var names = ["jump", "pipe"];
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
	this.lost = false;
	this.fading = false;
	this.destpipe = 0;
	this.path = {
		x: [-15, 17, 30],
		y: [34-this.height, 34 - this.height, 10],
		k: [rules.k, rules.k, rules.k]
	};
	this.generateCurve = function() {
		this.destpipe = random.number(rules.pipes.length);
		var k = rules.k;
		this.path.k = this.path.k.concat([k, k, k]);
		var destx = rules.pipes[this.destpipe] + 15;
		var thres = destx - (random.number(26) + 10);
		//var thres = destx - 20;

		//climax
		this.path.y.push(3);
		this.path.x.push(thres/2);

		//buffer approach
		this.path.y.push(rules.water/2);
		this.path.x.push(thres);

		//destination
		this.path.y.push(rules.water);
		this.path.x.push(destx);
	};
	this.tick = function() {
		if(this.x > this.path.x[1]) this.y = curve(this.x, this.path); // curve if not on deck
		if(this.x == this.path.x[1] + 10) audio.play("jump");
		this.x++;
		if(this.y < rules.water) setTimeout(this.tick.bind(this), 10);
		else {
			this.fading = true;
			this.fadeOut();
		}
	};
	this.fadeOut = function(){
		this.opacity -= 0.1;
		if(this.opacity > 0.1) setTimeout(this.fadeOut.bind(this), 50);
		else this.lost = true;
	};
	this.begin = function() {
		this.generateCurve();
		this.tick();
	};
	this.onSpawn = function() {
		this.begin();
	};
};

},{"./audio":2,"./curve":3,"./rand":7,"./rules":9}],5:[function(require,module,exports){
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

},{"./audio":2,"./rules":9}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
module.exports = {
	number: function(max){ //returns between 0 and max - 1
		return Math.floor(Math.random()*max);
	}
};

},{}],8:[function(require,module,exports){
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
		}
	});
};

},{}],9:[function(require,module,exports){
module.exports = {
	bottom: 300,
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
	pipedur: 250
};

},{}],10:[function(require,module,exports){
var Mario = require("./mario");
var Pipe = require("./pipe");
var rules = require("./rules");
module.exports = function() {
	this.scale = 2;
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
			this.sprites.push(pipe);
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
};

},{"./mario":4,"./pipe":5,"./rules":9}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9hdWRpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL21hcmlvLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9waXBlLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yYWYuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3JhbmQuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3JlbmRlcmVyLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9ydWxlcy5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvc3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcmVuZGVyID0gcmVxdWlyZShcIi4vcmVuZGVyZXJcIik7XG52YXIgcmFmID0gcmVxdWlyZShcIi4vcmFmXCIpO1xudmFyIFN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVcIik7XG52YXIgc3RhdGUgPSBuZXcgU3RhdGUoKTtcbnN0YXRlLmNyZWF0ZVBpcGVzKCk7XG5zdGF0ZS5jcmVhdGVXYXRlcigpO1xuXG52YXIgbG9vcCA9IGZ1bmN0aW9uKCkge1xuXHRzdGF0ZS5jcmVhdGVNYXJpbygpO1xuXHRzZXRUaW1lb3V0KGxvb3AsIDIwMDApO1xufTtcblxudmFyIGNoZWNrTG9vcCA9IGZ1bmN0aW9uKCkge1xuXHRnZXRQaXBlcyhzdGF0ZSwgZnVuY3Rpb24ocGlwZXMpIHtcblx0XHRzdGF0ZS5zcHJpdGVzLmZvckVhY2goZnVuY3Rpb24ocywgaSkge1xuXHRcdFx0aWYgKHMubmFtZSA9PSBcIm1hcmlvXCIpIHtcblx0XHRcdFx0dmFyIHAgPSBwaXBlc1tzLmRlc3RwaXBlXTtcblx0XHRcdFx0aWYgKHMubG9zdCkge1xuXHRcdFx0XHRcdHN0YXRlLnNwcml0ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHAuYWN0aXZlICYmIChzLnggPiBwLnggJiYgcy54IDwgcC54ICsgMzApICYmIChzLnkgPj0gcC55KSAmJiAhKHAuZmFkaW5nKSkge1xuXHRcdFx0XHRcdHN0YXRlLnNwcml0ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0c2V0VGltZW91dChjaGVja0xvb3AsIDEwKTtcblx0fSk7XG59O1xuXG52YXIgZ2V0UGlwZXMgPSBmdW5jdGlvbihzdCwgZm4pIHtcblx0dmFyIHAgPSBbXTtcblx0c3Quc3ByaXRlcy5mb3JFYWNoKGZ1bmN0aW9uKHMsIGksIGEpIHtcblx0XHRpZiAocy5uYW1lID09IFwicGlwZVwiKSB7XG5cdFx0XHRwW3MucGlwZW5dID0gcztcblx0XHR9XG5cdFx0aWYgKGkgPT0gYS5sZW5ndGggLSAxKSB7XG5cdFx0XHRmbihwKTtcblx0XHR9XG5cdH0pO1xufTtcblxubG9vcCgpO1xuY2hlY2tMb29wKCk7XG5cbnJhZi5zdGFydChmdW5jdGlvbihlKSB7XG5cdHJlbmRlcihzdGF0ZSk7XG59KTtcbiIsInZhciBuYW1lcyA9IFtcImp1bXBcIiwgXCJwaXBlXCJdO1xudmFyIGZpbGVzID0ge307XG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0cGxheTogZnVuY3Rpb24oZikge1xuXHRcdGZpbGVzW2ZdLnBsYXkoKTtcblx0fVxufTtcblxubmFtZXMuZm9yRWFjaChmdW5jdGlvbihubSkge1xuXHRmaWxlc1tubV0gPSBuZXcgQXVkaW8oXCJhc3NldHMvXCIgKyBubSArIFwiLndhdlwiKTtcbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih4LCBwYXRoKXtcblx0Q1NQTC5nZXROYXR1cmFsS3MocGF0aC54LCBwYXRoLnksIHBhdGguayk7XG5cdHJldHVybiBDU1BMLmV2YWxTcGxpbmUoeCwgcGF0aC54LCBwYXRoLnksIHBhdGguayk7XG59O1xuXG4vL0NTUEwgU2NyaXB0IGJ5IEl2YW4gSywgQWRhcHRlZCBmb3IgdGhlIGdhbWVcbnZhciBDU1BMID0gZnVuY3Rpb24oKSB7fTtcbkNTUEwuX2dhdXNzSiA9IHt9O1xuQ1NQTC5fZ2F1c3NKLnNvbHZlID0gZnVuY3Rpb24oQSwgeCkgLy8gaW4gTWF0cml4LCBvdXQgc29sdXRpb25zXG5cdHtcblx0XHR2YXIgbSA9IEEubGVuZ3RoO1xuXHRcdGZvciAodmFyIGsgPSAwOyBrIDwgbTsgaysrKSAvLyBjb2x1bW5cblx0XHR7XG5cdFx0XHQvLyBwaXZvdCBmb3IgY29sdW1uXG5cdFx0XHR2YXIgaV9tYXggPSAwO1xuXHRcdFx0dmFyIHZhbGkgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG5cdFx0XHRmb3IgKHZhciBpID0gazsgaSA8IG07IGkrKylcblx0XHRcdFx0aWYgKEFbaV1ba10gPiB2YWxpKSB7XG5cdFx0XHRcdFx0aV9tYXggPSBpO1xuXHRcdFx0XHRcdHZhbGkgPSBBW2ldW2tdO1xuXHRcdFx0XHR9XG5cdFx0XHRDU1BMLl9nYXVzc0ouc3dhcFJvd3MoQSwgaywgaV9tYXgpO1xuXHRcdFx0Ly8gZm9yIGFsbCByb3dzIGJlbG93IHBpdm90XG5cdFx0XHRmb3IgKHZhciBpID0gayArIDE7IGkgPCBtOyBpKyspIHtcblx0XHRcdFx0Zm9yICh2YXIgaiA9IGsgKyAxOyBqIDwgbSArIDE7IGorKylcblx0XHRcdFx0XHRBW2ldW2pdID0gQVtpXVtqXSAtIEFba11bal0gKiAoQVtpXVtrXSAvIEFba11ba10pO1xuXHRcdFx0XHRBW2ldW2tdID0gMDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gbSAtIDE7IGkgPj0gMDsgaS0tKSAvLyByb3dzID0gY29sdW1uc1xuXHRcdHtcblx0XHRcdHZhciB2ID0gQVtpXVttXSAvIEFbaV1baV07XG5cdFx0XHR4W2ldID0gdjtcblx0XHRcdGZvciAodmFyIGogPSBpIC0gMTsgaiA+PSAwOyBqLS0pIC8vIHJvd3Ncblx0XHRcdHtcblx0XHRcdFx0QVtqXVttXSAtPSBBW2pdW2ldICogdjtcblx0XHRcdFx0QVtqXVtpXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuQ1NQTC5fZ2F1c3NKLnplcm9zTWF0ID0gZnVuY3Rpb24ociwgYykge1xuXHR2YXIgQSA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHI7IGkrKykge1xuXHRcdEEucHVzaChbXSk7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjOyBqKyspIEFbaV0ucHVzaCgwKTtcblx0fVxuXHRyZXR1cm4gQTtcbn07XG5DU1BMLl9nYXVzc0oucHJpbnRNYXQgPSBmdW5jdGlvbihBKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgQS5sZW5ndGg7IGkrKykgY29uc29sZS5sb2coQVtpXSk7XG59O1xuQ1NQTC5fZ2F1c3NKLnN3YXBSb3dzID0gZnVuY3Rpb24obSwgaywgbCkge1xuXHR2YXIgcCA9IG1ba107XG5cdG1ba10gPSBtW2xdO1xuXHRtW2xdID0gcDtcbn07XG5DU1BMLmdldE5hdHVyYWxLcyA9IGZ1bmN0aW9uKHhzLCB5cywga3MpIC8vIGluIHggdmFsdWVzLCBpbiB5IHZhbHVlcywgb3V0IGsgdmFsdWVzXG5cdHtcblx0XHR2YXIgbiA9IHhzLmxlbmd0aCAtIDE7XG5cdFx0dmFyIEEgPSBDU1BMLl9nYXVzc0ouemVyb3NNYXQobiArIDEsIG4gKyAyKTtcblxuXHRcdGZvciAodmFyIGkgPSAxOyBpIDwgbjsgaSsrKSAvLyByb3dzXG5cdFx0e1xuXHRcdFx0QVtpXVtpIC0gMV0gPSAxIC8gKHhzW2ldIC0geHNbaSAtIDFdKTtcblxuXHRcdFx0QVtpXVtpXSA9IDIgKiAoMSAvICh4c1tpXSAtIHhzW2kgLSAxXSkgKyAxIC8gKHhzW2kgKyAxXSAtIHhzW2ldKSk7XG5cblx0XHRcdEFbaV1baSArIDFdID0gMSAvICh4c1tpICsgMV0gLSB4c1tpXSk7XG5cblx0XHRcdEFbaV1bbiArIDFdID0gMyAqICgoeXNbaV0gLSB5c1tpIC0gMV0pIC8gKCh4c1tpXSAtIHhzW2kgLSAxXSkgKiAoeHNbaV0gLSB4c1tpIC0gMV0pKSArICh5c1tpICsgMV0gLSB5c1tpXSkgLyAoKHhzW2kgKyAxXSAtIHhzW2ldKSAqICh4c1tpICsgMV0gLSB4c1tpXSkpKTtcblx0XHR9XG5cblx0XHRBWzBdWzBdID0gMiAvICh4c1sxXSAtIHhzWzBdKTtcblx0XHRBWzBdWzFdID0gMSAvICh4c1sxXSAtIHhzWzBdKTtcblx0XHRBWzBdW24gKyAxXSA9IDMgKiAoeXNbMV0gLSB5c1swXSkgLyAoKHhzWzFdIC0geHNbMF0pICogKHhzWzFdIC0geHNbMF0pKTtcblxuXHRcdEFbbl1bbiAtIDFdID0gMSAvICh4c1tuXSAtIHhzW24gLSAxXSk7XG5cdFx0QVtuXVtuXSA9IDIgLyAoeHNbbl0gLSB4c1tuIC0gMV0pO1xuXHRcdEFbbl1bbiArIDFdID0gMyAqICh5c1tuXSAtIHlzW24gLSAxXSkgLyAoKHhzW25dIC0geHNbbiAtIDFdKSAqICh4c1tuXSAtIHhzW24gLSAxXSkpO1xuXG5cdFx0Q1NQTC5fZ2F1c3NKLnNvbHZlKEEsIGtzKTtcblx0fTtcbkNTUEwuZXZhbFNwbGluZSA9IGZ1bmN0aW9uKHgsIHhzLCB5cywga3MpIHtcblx0dmFyIGkgPSAxO1xuXHR3aGlsZSAoeHNbaV0gPCB4KSBpKys7XG5cblx0dmFyIHQgPSAoeCAtIHhzW2kgLSAxXSkgLyAoeHNbaV0gLSB4c1tpIC0gMV0pO1xuXG5cdHZhciBhID0ga3NbaSAtIDFdICogKHhzW2ldIC0geHNbaSAtIDFdKSAtICh5c1tpXSAtIHlzW2kgLSAxXSk7XG5cdHZhciBiID0gLWtzW2ldICogKHhzW2ldIC0geHNbaSAtIDFdKSArICh5c1tpXSAtIHlzW2kgLSAxXSk7XG5cblx0dmFyIHEgPSAoMSAtIHQpICogeXNbaSAtIDFdICsgdCAqIHlzW2ldICsgdCAqICgxIC0gdCkgKiAoYSAqICgxIC0gdCkgKyBiICogdCk7XG5cdHJldHVybiBxO1xufTtcbiIsInZhciBjdXJ2ZSA9IHJlcXVpcmUoXCIuL2N1cnZlXCIpO1xudmFyIHJhbmRvbSA9IHJlcXVpcmUoXCIuL3JhbmRcIik7XG52YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy53aWR0aCA9IDEyO1xuXHR0aGlzLmhlaWdodCA9IDE2O1xuXHR0aGlzLm9wYWNpdHkgPSAxO1xuXHR0aGlzLnggPSAtMTU7XG5cdHRoaXMueSA9IDM0IC0gdGhpcy5oZWlnaHQ7XG5cdHRoaXMudHlwZSA9IFwiaW1nXCI7XG5cdHRoaXMubmFtZSA9IFwibWFyaW9cIjtcblx0dGhpcy5zcmMgPSBcIm1hcmlvLnBuZ1wiO1xuXHR0aGlzLmxvc3QgPSBmYWxzZTtcblx0dGhpcy5mYWRpbmcgPSBmYWxzZTtcblx0dGhpcy5kZXN0cGlwZSA9IDA7XG5cdHRoaXMucGF0aCA9IHtcblx0XHR4OiBbLTE1LCAxNywgMzBdLFxuXHRcdHk6IFszNC10aGlzLmhlaWdodCwgMzQgLSB0aGlzLmhlaWdodCwgMTBdLFxuXHRcdGs6IFtydWxlcy5rLCBydWxlcy5rLCBydWxlcy5rXVxuXHR9O1xuXHR0aGlzLmdlbmVyYXRlQ3VydmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRlc3RwaXBlID0gcmFuZG9tLm51bWJlcihydWxlcy5waXBlcy5sZW5ndGgpO1xuXHRcdHZhciBrID0gcnVsZXMuaztcblx0XHR0aGlzLnBhdGguayA9IHRoaXMucGF0aC5rLmNvbmNhdChbaywgaywga10pO1xuXHRcdHZhciBkZXN0eCA9IHJ1bGVzLnBpcGVzW3RoaXMuZGVzdHBpcGVdICsgMTU7XG5cdFx0dmFyIHRocmVzID0gZGVzdHggLSAocmFuZG9tLm51bWJlcigyNikgKyAxMCk7XG5cdFx0Ly92YXIgdGhyZXMgPSBkZXN0eCAtIDIwO1xuXG5cdFx0Ly9jbGltYXhcblx0XHR0aGlzLnBhdGgueS5wdXNoKDMpO1xuXHRcdHRoaXMucGF0aC54LnB1c2godGhyZXMvMik7XG5cblx0XHQvL2J1ZmZlciBhcHByb2FjaFxuXHRcdHRoaXMucGF0aC55LnB1c2gocnVsZXMud2F0ZXIvMik7XG5cdFx0dGhpcy5wYXRoLngucHVzaCh0aHJlcyk7XG5cblx0XHQvL2Rlc3RpbmF0aW9uXG5cdFx0dGhpcy5wYXRoLnkucHVzaChydWxlcy53YXRlcik7XG5cdFx0dGhpcy5wYXRoLngucHVzaChkZXN0eCk7XG5cdH07XG5cdHRoaXMudGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmKHRoaXMueCA+IHRoaXMucGF0aC54WzFdKSB0aGlzLnkgPSBjdXJ2ZSh0aGlzLngsIHRoaXMucGF0aCk7IC8vIGN1cnZlIGlmIG5vdCBvbiBkZWNrXG5cdFx0aWYodGhpcy54ID09IHRoaXMucGF0aC54WzFdICsgMTApIGF1ZGlvLnBsYXkoXCJqdW1wXCIpO1xuXHRcdHRoaXMueCsrO1xuXHRcdGlmKHRoaXMueSA8IHJ1bGVzLndhdGVyKSBzZXRUaW1lb3V0KHRoaXMudGljay5iaW5kKHRoaXMpLCAxMCk7XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLmZhZGluZyA9IHRydWU7XG5cdFx0XHR0aGlzLmZhZGVPdXQoKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuZmFkZU91dCA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5vcGFjaXR5IC09IDAuMTtcblx0XHRpZih0aGlzLm9wYWNpdHkgPiAwLjEpIHNldFRpbWVvdXQodGhpcy5mYWRlT3V0LmJpbmQodGhpcyksIDUwKTtcblx0XHRlbHNlIHRoaXMubG9zdCA9IHRydWU7XG5cdH07XG5cdHRoaXMuYmVnaW4gPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdlbmVyYXRlQ3VydmUoKTtcblx0XHR0aGlzLnRpY2soKTtcblx0fTtcblx0dGhpcy5vblNwYXduID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5iZWdpbigpO1xuXHR9O1xufTtcbiIsInZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnggPSAwO1xuXHR0aGlzLnkgPSAwO1xuXHR0aGlzLnR5cGUgPSBcImltZ1wiO1xuXHR0aGlzLm5hbWUgPSBcInBpcGVcIjtcblx0dGhpcy5zcmMgPSBcInBpcGUucG5nXCI7XG5cdHRoaXMud2lkdGggPSAzMDtcblx0dGhpcy5oZWlnaHQgPSAxMDA7XG5cdHRoaXMucGlwZW4gPSAwO1xuXHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuXHR0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuXHR0aGlzLmRvd24gPSBmYWxzZTtcblx0dGhpcy5hbmltYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hbmltYXRpbmcgPSB0cnVlO1xuXHRcdHRoaXMuYWN0aXZlID0gdHJ1ZTtcblx0XHRhdWRpby5wbGF5KFwicGlwZVwiKTtcblx0XHR0aGlzLnRpY2soKTtcblx0fTtcblx0dGhpcy5hbmltYXRpb25Eb25lID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kb3duID0gZmFsc2U7XG5cdFx0dGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcblx0XHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuXHR9O1xuXHR0aGlzLnRpY2sgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdjtcblx0XHRpZiAoIXRoaXMuZG93bikgdGhpcy55LS07XG5cdFx0ZWxzZSB0aGlzLnkrKztcblx0XHRpZiAodGhpcy55ID09IDgwKSB0aGlzLmRvd24gPSB0cnVlO1xuXHRcdGlmICh0aGlzLnkgPCAxMzApIHNldFRpbWVvdXQodGhpcy50aWNrLmJpbmQodGhpcyksIHJ1bGVzLnBpcGVkdXIvNTApO1xuXHRcdGVsc2UgdGhpcy5hbmltYXRpb25Eb25lKCk7XG5cdH07XG5cdHRoaXMub25TcGF3biA9IGZ1bmN0aW9uKG4pIHtcblx0XHR0aGlzLnggPSBydWxlcy5waXBlc1tuXTtcblx0XHR0aGlzLnkgPSAxMzA7XG5cdFx0dGhpcy5waXBlbiA9IG47XG5cdFx0dGhpcy5pbml0RXZlbnQoKTtcblx0fTtcblx0dGhpcy5pbml0RXZlbnQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdCA9IHRoaXM7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGlmIChlLndoaWNoID09IHJ1bGVzLmNvbnRyb2xzW3QucGlwZW5dKSB7XG5cdFx0XHRcdGlmICghdC5hbmltYXRpbmcpIHQuYW5pbWF0ZSgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHQuYW5pbWF0aW5nID0gdHJ1ZTtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe3QuYW5pbWF0aW5nID0gZmFsc2U7fSwgcnVsZXMucGlwZWR1ciArIDUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xufTtcbiIsIi8vIEhvbGRzIGxhc3QgaXRlcmF0aW9uIHRpbWVzdGFtcC5cbnZhciB0aW1lID0gMDtcblxuLyoqXG4gKiBDYWxscyBgZm5gIG9uIG5leHQgZnJhbWUuXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvblxuICogQHJldHVybiB7aW50fSBUaGUgcmVxdWVzdCBJRFxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHJhZihmbikge1xuICByZXR1cm4gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgZWxhcHNlZCA9IG5vdyAtIHRpbWU7XG5cbiAgICBpZiAoZWxhcHNlZCA+IDk5OSkge1xuICAgICAgZWxhcHNlZCA9IDEgLyA2MDtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxhcHNlZCAvPSAxMDAwO1xuICAgIH1cblxuICAgIHRpbWUgPSBub3c7XG4gICAgZm4oZWxhcHNlZCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIENhbGxzIGBmbmAgb24gZXZlcnkgZnJhbWUgd2l0aCBgZWxhcHNlZGAgc2V0IHRvIHRoZSBlbGFwc2VkXG4gICAqIHRpbWUgaW4gbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gICAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0YXJ0OiBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiByYWYoZnVuY3Rpb24gdGljayhlbGFwc2VkKSB7XG4gICAgICBmbihlbGFwc2VkKTtcbiAgICAgIHJhZih0aWNrKTtcbiAgICB9KTtcbiAgfSxcbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIHNwZWNpZmllZCBhbmltYXRpb24gZnJhbWUgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtpbnR9IGlkIFRoZSByZXF1ZXN0IElEXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBzdG9wOiBmdW5jdGlvbihpZCkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0bnVtYmVyOiBmdW5jdGlvbihtYXgpeyAvL3JldHVybnMgYmV0d2VlbiAwIGFuZCBtYXggLSAxXG5cdFx0cmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSptYXgpO1xuXHR9XG59O1xuIiwidmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY1wiKTtcbnZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuY3R4Lm1vekltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuY3R4LndlYmtpdEltYWdlU21vb3RobG9jaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG5cdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0Y3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcblx0Y3R4LnNjYWxlKHN0YXRlLnNjYWxlLCBzdGF0ZS5zY2FsZSk7XG5cdHN0YXRlLnNwcml0ZXMuZm9yRWFjaChmdW5jdGlvbihzKSB7XG5cdFx0aWYgKHMub3BhY2l0eSkgY3R4Lmdsb2JhbEFscGhhID0gcy5vcGFjaXR5O1xuXHRcdGVsc2UgY3R4Lmdsb2JhbEFscGhhID0gMTtcblx0XHRzd2l0Y2ggKHMudHlwZSkge1xuXHRcdFx0Y2FzZSBcInJlY3RcIjpcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHMuY29sb3I7XG5cdFx0XHRcdGN0eC5maWxsUmVjdChzLngsIHMueSwgcy53aWR0aCwgcy5oZWlnaHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJpbWdcIjpcblx0XHRcdFx0dmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdFx0XHRpbWcuc3JjID0gXCJhc3NldHMvXCIgKyBzLnNyYztcblx0XHRcdFx0Y3R4LmRyYXdJbWFnZShpbWcsIHMueCwgcy55LCBzLndpZHRoLCBzLmhlaWdodCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdGJvdHRvbTogMzAwLFxuXHR3YXRlcjogMTE1LFxuXHRwaXBlczogW1xuXHRcdDkwLFxuXHRcdDE0NSxcblx0XHQyMDBcblx0XSxcblx0Y29udHJvbHM6IFtcblx0XHQ4MSxcblx0XHQ4Nyxcblx0XHQ2OVxuXHRdLFxuXHRrOiAwLjAxLFxuXHRwaXBlZHVyOiAyNTBcbn07XG4iLCJ2YXIgTWFyaW8gPSByZXF1aXJlKFwiLi9tYXJpb1wiKTtcbnZhciBQaXBlID0gcmVxdWlyZShcIi4vcGlwZVwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5zY2FsZSA9IDI7XG5cdHRoaXMuc3ByaXRlcyA9IFt7XG5cdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0bmFtZTogXCJza3lcIixcblx0XHRjb2xvcjogXCIjNUM5NEZDXCIsXG5cdFx0d2lkdGg6IDI1MCxcblx0XHRoZWlnaHQ6IDE1MCxcblx0XHR4OiAwLFxuXHRcdHk6IDBcblx0fSwge1xuXHRcdHR5cGU6IFwiaW1nXCIsXG5cdFx0bmFtZTogXCJibG9ja3NcIixcblx0XHRzcmM6IFwiYmxvY2tzLnBuZ1wiLFxuXHRcdHg6IDAsXG5cdFx0eTogMzQsXG5cdFx0d2lkdGg6IDM0LFxuXHRcdGhlaWdodDogMTdcblx0fV07XG5cdHRoaXMuY3JlYXRlTWFyaW8gPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFyaW8gPSBuZXcgTWFyaW8oKTtcblx0XHRtYXJpby5vblNwYXduKCk7XG5cdFx0Ly92YXIgZGJjID0gcmVxdWlyZShcIi4uL2RlYnVnL2N1cnZlXCIpO1xuXHRcdC8vdGhpcy5zcHJpdGVzID0gdGhpcy5zcHJpdGVzLmNvbmNhdChkYmMobWFyaW8ucGF0aCkpO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UoMSwgMCwgbWFyaW8pO1xuXHR9O1xuXHR0aGlzLmNyZWF0ZVBpcGVzID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5waXBlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHBpcGUgPSBuZXcgUGlwZSgpO1xuXHRcdFx0cGlwZS5vblNwYXduKGkpO1xuXHRcdFx0dGhpcy5zcHJpdGVzLnB1c2gocGlwZSk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmNyZWF0ZVdhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2goe1xuXHRcdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0XHRuYW1lOiBcIndhdGVyXCIsXG5cdFx0XHRjb2xvcjogXCIjMTVEQ0UyXCIsXG5cdFx0XHRvcGFjaXR5OiAwLjUsXG5cdFx0XHR5OiBydWxlcy53YXRlcixcblx0XHRcdHg6IDAsXG5cdFx0XHR3aWR0aDogMzAwLFxuXHRcdFx0aGVpZ2h0OiAzNVxuXHRcdH0pO1xuXHR9O1xufTtcbiJdfQ==
