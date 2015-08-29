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
	state.sprites.forEach(function(s, i) {
		if (s.name == "mario" && s.lost) {
			state.sprites.splice(i, 1);
		}
	});
	setTimeout(checkLoop, 10);
};

loop();
checkLoop();

raf.start(function(e) {
	render(state);
});

},{"./raf":7,"./renderer":9,"./state":11}],2:[function(require,module,exports){
var c = require("../src/curve");
module.exports = function(curve) {
	var path = [];
	for (var i = curve.x[0]; i <= curve.x[curve.x.length - 1]; i++) {
		if (curve.x.indexOf(i) > -1) path.push({
			type: "rect",
			color: "#FF0000",
			width: 5,
			height: 5,
			x: i,
			y: curve.y[curve.x.indexOf(i)]
		});
		else path.push({
			type: "rect",
			color: "#FFFFFF",
			width: 3,
			height: 3,
			x: i,
			y: c(i, curve)
		});
	}
	return path;
};

},{"../src/curve":4}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
var curve = require("./curve");
var random = require("./rand");
var rules = require("./rules");
var audio = require("./audio");
module.exports = function() {
	this.width = 12;
	this.height = 16;
	this.x = -15;
	this.y = 34 - this.height;
	this.type = "img";
	this.name = "mario";
	this.src = "mario.png";
	this.lost = false;
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
		if(this.y <= rules.water) setTimeout(this.tick.bind(this), 10);
		else {
			this.lost = true;
		}
	};
	this.begin = function() {
		this.generateCurve();
		this.tick();
	};
	this.onSpawn = function() {
		this.begin();
	};
};

},{"./audio":3,"./curve":4,"./rand":8,"./rules":10}],6:[function(require,module,exports){
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
	this.animating = false;
	this.down = false;
	this.animate = function() {
		this.animating = true;
		audio.play("pipe");
		this.tick();
	};
	this.animationDone = function() {
		this.down = false;
		this.animating = false;
	};
	this.tick = function() {
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

},{"./audio":3,"./rules":10}],7:[function(require,module,exports){
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
module.exports = {
	number: function(max){ //returns between 0 and max - 1
		return Math.floor(Math.random()*max);
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
		}
	});
};

},{}],10:[function(require,module,exports){
module.exports = {
	bottom: 300,
	water: 120,
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

},{}],11:[function(require,module,exports){
var Mario = require("./mario");
var Pipe = require("./pipe");
var dbc = require("../debug/curve");
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
			y: 120,
			x: 0,
			width: 300,
			height: 30
		});
	};
};

},{"../debug/curve":2,"./mario":5,"./pipe":6,"./rules":10}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL2RlYnVnL2N1cnZlLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9hdWRpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL21hcmlvLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9waXBlLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9yYWYuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3JhbmQuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3JlbmRlcmVyLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9ydWxlcy5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvc3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcmVuZGVyID0gcmVxdWlyZShcIi4vcmVuZGVyZXJcIik7XG52YXIgcmFmID0gcmVxdWlyZShcIi4vcmFmXCIpO1xudmFyIFN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVcIik7XG52YXIgc3RhdGUgPSBuZXcgU3RhdGUoKTtcbnN0YXRlLmNyZWF0ZVBpcGVzKCk7XG5zdGF0ZS5jcmVhdGVXYXRlcigpO1xuXG52YXIgbG9vcCA9IGZ1bmN0aW9uKCkge1xuXHRzdGF0ZS5jcmVhdGVNYXJpbygpO1xuXHRzZXRUaW1lb3V0KGxvb3AsIDIwMDApO1xufTtcblxudmFyIGNoZWNrTG9vcCA9IGZ1bmN0aW9uKCkge1xuXHRzdGF0ZS5zcHJpdGVzLmZvckVhY2goZnVuY3Rpb24ocywgaSkge1xuXHRcdGlmIChzLm5hbWUgPT0gXCJtYXJpb1wiICYmIHMubG9zdCkge1xuXHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHR9KTtcblx0c2V0VGltZW91dChjaGVja0xvb3AsIDEwKTtcbn07XG5cbmxvb3AoKTtcbmNoZWNrTG9vcCgpO1xuXG5yYWYuc3RhcnQoZnVuY3Rpb24oZSkge1xuXHRyZW5kZXIoc3RhdGUpO1xufSk7XG4iLCJ2YXIgYyA9IHJlcXVpcmUoXCIuLi9zcmMvY3VydmVcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGN1cnZlKSB7XG5cdHZhciBwYXRoID0gW107XG5cdGZvciAodmFyIGkgPSBjdXJ2ZS54WzBdOyBpIDw9IGN1cnZlLnhbY3VydmUueC5sZW5ndGggLSAxXTsgaSsrKSB7XG5cdFx0aWYgKGN1cnZlLnguaW5kZXhPZihpKSA+IC0xKSBwYXRoLnB1c2goe1xuXHRcdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0XHRjb2xvcjogXCIjRkYwMDAwXCIsXG5cdFx0XHR3aWR0aDogNSxcblx0XHRcdGhlaWdodDogNSxcblx0XHRcdHg6IGksXG5cdFx0XHR5OiBjdXJ2ZS55W2N1cnZlLnguaW5kZXhPZihpKV1cblx0XHR9KTtcblx0XHRlbHNlIHBhdGgucHVzaCh7XG5cdFx0XHR0eXBlOiBcInJlY3RcIixcblx0XHRcdGNvbG9yOiBcIiNGRkZGRkZcIixcblx0XHRcdHdpZHRoOiAzLFxuXHRcdFx0aGVpZ2h0OiAzLFxuXHRcdFx0eDogaSxcblx0XHRcdHk6IGMoaSwgY3VydmUpXG5cdFx0fSk7XG5cdH1cblx0cmV0dXJuIHBhdGg7XG59O1xuIiwidmFyIG5hbWVzID0gW1wianVtcFwiLCBcInBpcGVcIl07XG52YXIgZmlsZXMgPSB7fTtcbm1vZHVsZS5leHBvcnRzID0ge1xuXHRwbGF5OiBmdW5jdGlvbihmKSB7XG5cdFx0ZmlsZXNbZl0ucGxheSgpO1xuXHR9XG59O1xuXG5uYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5tKSB7XG5cdGZpbGVzW25tXSA9IG5ldyBBdWRpbyhcImFzc2V0cy9cIiArIG5tICsgXCIud2F2XCIpO1xufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHgsIHBhdGgpe1xuXHRDU1BMLmdldE5hdHVyYWxLcyhwYXRoLngsIHBhdGgueSwgcGF0aC5rKTtcblx0cmV0dXJuIENTUEwuZXZhbFNwbGluZSh4LCBwYXRoLngsIHBhdGgueSwgcGF0aC5rKTtcbn07XG5cbi8vQ1NQTCBTY3JpcHQgYnkgSXZhbiBLLCBBZGFwdGVkIGZvciB0aGUgZ2FtZVxudmFyIENTUEwgPSBmdW5jdGlvbigpIHt9O1xuQ1NQTC5fZ2F1c3NKID0ge307XG5DU1BMLl9nYXVzc0ouc29sdmUgPSBmdW5jdGlvbihBLCB4KSAvLyBpbiBNYXRyaXgsIG91dCBzb2x1dGlvbnNcblx0e1xuXHRcdHZhciBtID0gQS5sZW5ndGg7XG5cdFx0Zm9yICh2YXIgayA9IDA7IGsgPCBtOyBrKyspIC8vIGNvbHVtblxuXHRcdHtcblx0XHRcdC8vIHBpdm90IGZvciBjb2x1bW5cblx0XHRcdHZhciBpX21heCA9IDA7XG5cdFx0XHR2YXIgdmFsaSA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcblx0XHRcdGZvciAodmFyIGkgPSBrOyBpIDwgbTsgaSsrKVxuXHRcdFx0XHRpZiAoQVtpXVtrXSA+IHZhbGkpIHtcblx0XHRcdFx0XHRpX21heCA9IGk7XG5cdFx0XHRcdFx0dmFsaSA9IEFbaV1ba107XG5cdFx0XHRcdH1cblx0XHRcdENTUEwuX2dhdXNzSi5zd2FwUm93cyhBLCBrLCBpX21heCk7XG5cdFx0XHQvLyBmb3IgYWxsIHJvd3MgYmVsb3cgcGl2b3Rcblx0XHRcdGZvciAodmFyIGkgPSBrICsgMTsgaSA8IG07IGkrKykge1xuXHRcdFx0XHRmb3IgKHZhciBqID0gayArIDE7IGogPCBtICsgMTsgaisrKVxuXHRcdFx0XHRcdEFbaV1bal0gPSBBW2ldW2pdIC0gQVtrXVtqXSAqIChBW2ldW2tdIC8gQVtrXVtrXSk7XG5cdFx0XHRcdEFbaV1ba10gPSAwO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSBtIC0gMTsgaSA+PSAwOyBpLS0pIC8vIHJvd3MgPSBjb2x1bW5zXG5cdFx0e1xuXHRcdFx0dmFyIHYgPSBBW2ldW21dIC8gQVtpXVtpXTtcblx0XHRcdHhbaV0gPSB2O1xuXHRcdFx0Zm9yICh2YXIgaiA9IGkgLSAxOyBqID49IDA7IGotLSkgLy8gcm93c1xuXHRcdFx0e1xuXHRcdFx0XHRBW2pdW21dIC09IEFbal1baV0gKiB2O1xuXHRcdFx0XHRBW2pdW2ldID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5DU1BMLl9nYXVzc0ouemVyb3NNYXQgPSBmdW5jdGlvbihyLCBjKSB7XG5cdHZhciBBID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgcjsgaSsrKSB7XG5cdFx0QS5wdXNoKFtdKTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGM7IGorKykgQVtpXS5wdXNoKDApO1xuXHR9XG5cdHJldHVybiBBO1xufTtcbkNTUEwuX2dhdXNzSi5wcmludE1hdCA9IGZ1bmN0aW9uKEEpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBBLmxlbmd0aDsgaSsrKSBjb25zb2xlLmxvZyhBW2ldKTtcbn07XG5DU1BMLl9nYXVzc0ouc3dhcFJvd3MgPSBmdW5jdGlvbihtLCBrLCBsKSB7XG5cdHZhciBwID0gbVtrXTtcblx0bVtrXSA9IG1bbF07XG5cdG1bbF0gPSBwO1xufTtcbkNTUEwuZ2V0TmF0dXJhbEtzID0gZnVuY3Rpb24oeHMsIHlzLCBrcykgLy8gaW4geCB2YWx1ZXMsIGluIHkgdmFsdWVzLCBvdXQgayB2YWx1ZXNcblx0e1xuXHRcdHZhciBuID0geHMubGVuZ3RoIC0gMTtcblx0XHR2YXIgQSA9IENTUEwuX2dhdXNzSi56ZXJvc01hdChuICsgMSwgbiArIDIpO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDE7IGkgPCBuOyBpKyspIC8vIHJvd3Ncblx0XHR7XG5cdFx0XHRBW2ldW2kgLSAxXSA9IDEgLyAoeHNbaV0gLSB4c1tpIC0gMV0pO1xuXG5cdFx0XHRBW2ldW2ldID0gMiAqICgxIC8gKHhzW2ldIC0geHNbaSAtIDFdKSArIDEgLyAoeHNbaSArIDFdIC0geHNbaV0pKTtcblxuXHRcdFx0QVtpXVtpICsgMV0gPSAxIC8gKHhzW2kgKyAxXSAtIHhzW2ldKTtcblxuXHRcdFx0QVtpXVtuICsgMV0gPSAzICogKCh5c1tpXSAtIHlzW2kgLSAxXSkgLyAoKHhzW2ldIC0geHNbaSAtIDFdKSAqICh4c1tpXSAtIHhzW2kgLSAxXSkpICsgKHlzW2kgKyAxXSAtIHlzW2ldKSAvICgoeHNbaSArIDFdIC0geHNbaV0pICogKHhzW2kgKyAxXSAtIHhzW2ldKSkpO1xuXHRcdH1cblxuXHRcdEFbMF1bMF0gPSAyIC8gKHhzWzFdIC0geHNbMF0pO1xuXHRcdEFbMF1bMV0gPSAxIC8gKHhzWzFdIC0geHNbMF0pO1xuXHRcdEFbMF1bbiArIDFdID0gMyAqICh5c1sxXSAtIHlzWzBdKSAvICgoeHNbMV0gLSB4c1swXSkgKiAoeHNbMV0gLSB4c1swXSkpO1xuXG5cdFx0QVtuXVtuIC0gMV0gPSAxIC8gKHhzW25dIC0geHNbbiAtIDFdKTtcblx0XHRBW25dW25dID0gMiAvICh4c1tuXSAtIHhzW24gLSAxXSk7XG5cdFx0QVtuXVtuICsgMV0gPSAzICogKHlzW25dIC0geXNbbiAtIDFdKSAvICgoeHNbbl0gLSB4c1tuIC0gMV0pICogKHhzW25dIC0geHNbbiAtIDFdKSk7XG5cblx0XHRDU1BMLl9nYXVzc0ouc29sdmUoQSwga3MpO1xuXHR9O1xuQ1NQTC5ldmFsU3BsaW5lID0gZnVuY3Rpb24oeCwgeHMsIHlzLCBrcykge1xuXHR2YXIgaSA9IDE7XG5cdHdoaWxlICh4c1tpXSA8IHgpIGkrKztcblxuXHR2YXIgdCA9ICh4IC0geHNbaSAtIDFdKSAvICh4c1tpXSAtIHhzW2kgLSAxXSk7XG5cblx0dmFyIGEgPSBrc1tpIC0gMV0gKiAoeHNbaV0gLSB4c1tpIC0gMV0pIC0gKHlzW2ldIC0geXNbaSAtIDFdKTtcblx0dmFyIGIgPSAta3NbaV0gKiAoeHNbaV0gLSB4c1tpIC0gMV0pICsgKHlzW2ldIC0geXNbaSAtIDFdKTtcblxuXHR2YXIgcSA9ICgxIC0gdCkgKiB5c1tpIC0gMV0gKyB0ICogeXNbaV0gKyB0ICogKDEgLSB0KSAqIChhICogKDEgLSB0KSArIGIgKiB0KTtcblx0cmV0dXJuIHE7XG59O1xuIiwidmFyIGN1cnZlID0gcmVxdWlyZShcIi4vY3VydmVcIik7XG52YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLndpZHRoID0gMTI7XG5cdHRoaXMuaGVpZ2h0ID0gMTY7XG5cdHRoaXMueCA9IC0xNTtcblx0dGhpcy55ID0gMzQgLSB0aGlzLmhlaWdodDtcblx0dGhpcy50eXBlID0gXCJpbWdcIjtcblx0dGhpcy5uYW1lID0gXCJtYXJpb1wiO1xuXHR0aGlzLnNyYyA9IFwibWFyaW8ucG5nXCI7XG5cdHRoaXMubG9zdCA9IGZhbHNlO1xuXHR0aGlzLmRlc3RwaXBlID0gMDtcblx0dGhpcy5wYXRoID0ge1xuXHRcdHg6IFstMTUsIDE3LCAzMF0sXG5cdFx0eTogWzM0LXRoaXMuaGVpZ2h0LCAzNCAtIHRoaXMuaGVpZ2h0LCAxMF0sXG5cdFx0azogW3J1bGVzLmssIHJ1bGVzLmssIHJ1bGVzLmtdXG5cdH07XG5cdHRoaXMuZ2VuZXJhdGVDdXJ2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVzdHBpcGUgPSByYW5kb20ubnVtYmVyKHJ1bGVzLnBpcGVzLmxlbmd0aCk7XG5cdFx0dmFyIGsgPSBydWxlcy5rO1xuXHRcdHRoaXMucGF0aC5rID0gdGhpcy5wYXRoLmsuY29uY2F0KFtrLCBrLCBrXSk7XG5cdFx0dmFyIGRlc3R4ID0gcnVsZXMucGlwZXNbdGhpcy5kZXN0cGlwZV0gKyAxNTtcblx0XHR2YXIgdGhyZXMgPSBkZXN0eCAtIChyYW5kb20ubnVtYmVyKDI2KSArIDEwKTtcblx0XHQvL3ZhciB0aHJlcyA9IGRlc3R4IC0gMjA7XG5cblx0XHQvL2NsaW1heFxuXHRcdHRoaXMucGF0aC55LnB1c2goMyk7XG5cdFx0dGhpcy5wYXRoLngucHVzaCh0aHJlcy8yKTtcblxuXHRcdC8vYnVmZmVyIGFwcHJvYWNoXG5cdFx0dGhpcy5wYXRoLnkucHVzaChydWxlcy53YXRlci8yKTtcblx0XHR0aGlzLnBhdGgueC5wdXNoKHRocmVzKTtcblxuXHRcdC8vZGVzdGluYXRpb25cblx0XHR0aGlzLnBhdGgueS5wdXNoKHJ1bGVzLndhdGVyKTtcblx0XHR0aGlzLnBhdGgueC5wdXNoKGRlc3R4KTtcblx0fTtcblx0dGhpcy50aWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy54ID4gdGhpcy5wYXRoLnhbMV0pIHRoaXMueSA9IGN1cnZlKHRoaXMueCwgdGhpcy5wYXRoKTsgLy8gY3VydmUgaWYgbm90IG9uIGRlY2tcblx0XHRpZih0aGlzLnggPT0gdGhpcy5wYXRoLnhbMV0gKyAxMCkgYXVkaW8ucGxheShcImp1bXBcIik7XG5cdFx0dGhpcy54Kys7XG5cdFx0aWYodGhpcy55IDw9IHJ1bGVzLndhdGVyKSBzZXRUaW1lb3V0KHRoaXMudGljay5iaW5kKHRoaXMpLCAxMCk7XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLmxvc3QgPSB0cnVlO1xuXHRcdH1cblx0fTtcblx0dGhpcy5iZWdpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2VuZXJhdGVDdXJ2ZSgpO1xuXHRcdHRoaXMudGljaygpO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmJlZ2luKCk7XG5cdH07XG59O1xuIiwidmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG52YXIgYXVkaW8gPSByZXF1aXJlKFwiLi9hdWRpb1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMueCA9IDA7XG5cdHRoaXMueSA9IDA7XG5cdHRoaXMudHlwZSA9IFwiaW1nXCI7XG5cdHRoaXMubmFtZSA9IFwicGlwZVwiO1xuXHR0aGlzLnNyYyA9IFwicGlwZS5wbmdcIjtcblx0dGhpcy53aWR0aCA9IDMwO1xuXHR0aGlzLmhlaWdodCA9IDEwMDtcblx0dGhpcy5waXBlbiA9IDA7XG5cdHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG5cdHRoaXMuZG93biA9IGZhbHNlO1xuXHR0aGlzLmFuaW1hdGUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFuaW1hdGluZyA9IHRydWU7XG5cdFx0YXVkaW8ucGxheShcInBpcGVcIik7XG5cdFx0dGhpcy50aWNrKCk7XG5cdH07XG5cdHRoaXMuYW5pbWF0aW9uRG9uZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZG93biA9IGZhbHNlO1xuXHRcdHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG5cdH07XG5cdHRoaXMudGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy5kb3duKSB0aGlzLnktLTtcblx0XHRlbHNlIHRoaXMueSsrO1xuXHRcdGlmICh0aGlzLnkgPT0gODApIHRoaXMuZG93biA9IHRydWU7XG5cdFx0aWYgKHRoaXMueSA8IDEzMCkgc2V0VGltZW91dCh0aGlzLnRpY2suYmluZCh0aGlzKSwgcnVsZXMucGlwZWR1ci81MCk7XG5cdFx0ZWxzZSB0aGlzLmFuaW1hdGlvbkRvbmUoKTtcblx0fTtcblx0dGhpcy5vblNwYXduID0gZnVuY3Rpb24obikge1xuXHRcdHRoaXMueCA9IHJ1bGVzLnBpcGVzW25dO1xuXHRcdHRoaXMueSA9IDEzMDtcblx0XHR0aGlzLnBpcGVuID0gbjtcblx0XHR0aGlzLmluaXRFdmVudCgpO1xuXHR9O1xuXHR0aGlzLmluaXRFdmVudCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ID0gdGhpcztcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZSkge1xuXHRcdFx0aWYgKGUud2hpY2ggPT0gcnVsZXMuY29udHJvbHNbdC5waXBlbl0pIHtcblx0XHRcdFx0aWYgKCF0LmFuaW1hdGluZykgdC5hbmltYXRlKCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dC5hbmltYXRpbmcgPSB0cnVlO1xuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7dC5hbmltYXRpbmcgPSBmYWxzZTt9LCBydWxlcy5waXBlZHVyICsgNSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG59O1xuIiwiLy8gSG9sZHMgbGFzdCBpdGVyYXRpb24gdGltZXN0YW1wLlxudmFyIHRpbWUgPSAwO1xuXG4vKipcbiAqIENhbGxzIGBmbmAgb24gbmV4dCBmcmFtZS5cbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtpbnR9IFRoZSByZXF1ZXN0IElEXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gcmFmKGZuKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIHZhciBlbGFwc2VkID0gbm93IC0gdGltZTtcblxuICAgIGlmIChlbGFwc2VkID4gOTk5KSB7XG4gICAgICBlbGFwc2VkID0gMSAvIDYwO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGFwc2VkIC89IDEwMDA7XG4gICAgfVxuXG4gICAgdGltZSA9IG5vdztcbiAgICBmbihlbGFwc2VkKTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogQ2FsbHMgYGZuYCBvbiBldmVyeSBmcmFtZSB3aXRoIGBlbGFwc2VkYCBzZXQgdG8gdGhlIGVsYXBzZWRcbiAgICogdGltZSBpbiBtaWxsaXNlY29uZHMuXG4gICAqXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb25cbiAgICogQHJldHVybiB7aW50fSBUaGUgcmVxdWVzdCBJRFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgc3RhcnQ6IGZ1bmN0aW9uKGZuKSB7XG4gICAgcmV0dXJuIHJhZihmdW5jdGlvbiB0aWNrKGVsYXBzZWQpIHtcbiAgICAgIGZuKGVsYXBzZWQpO1xuICAgICAgcmFmKHRpY2spO1xuICAgIH0pO1xuICB9LFxuICAvKipcbiAgICogQ2FuY2VscyB0aGUgc3BlY2lmaWVkIGFuaW1hdGlvbiBmcmFtZSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge2ludH0gaWQgVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0b3A6IGZ1bmN0aW9uKGlkKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRudW1iZXI6IGZ1bmN0aW9uKG1heCl7IC8vcmV0dXJucyBiZXR3ZWVuIDAgYW5kIG1heCAtIDFcblx0XHRyZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKm1heCk7XG5cdH1cbn07XG4iLCJ2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjXCIpO1xudmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5jdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5jdHgubW96SW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5jdHgud2Via2l0SW1hZ2VTbW9vdGhsb2NpbmdFbmFibGVkID0gZmFsc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RhdGUpIHtcblx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuXHRjdHguc2NhbGUoc3RhdGUuc2NhbGUsIHN0YXRlLnNjYWxlKTtcblx0c3RhdGUuc3ByaXRlcy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcblx0XHRpZiAocy5vcGFjaXR5KSBjdHguZ2xvYmFsQWxwaGEgPSBzLm9wYWNpdHk7XG5cdFx0ZWxzZSBjdHguZ2xvYmFsQWxwaGEgPSAxO1xuXHRcdHN3aXRjaCAocy50eXBlKSB7XG5cdFx0XHRjYXNlIFwicmVjdFwiOlxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gcy5jb2xvcjtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KHMueCwgcy55LCBzLndpZHRoLCBzLmhlaWdodCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImltZ1wiOlxuXHRcdFx0XHR2YXIgaW1nID0gbmV3IEltYWdlKCk7XG5cdFx0XHRcdGltZy5zcmMgPSBcImFzc2V0cy9cIiArIHMuc3JjO1xuXHRcdFx0XHRjdHguZHJhd0ltYWdlKGltZywgcy54LCBzLnksIHMud2lkdGgsIHMuaGVpZ2h0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Ym90dG9tOiAzMDAsXG5cdHdhdGVyOiAxMjAsXG5cdHBpcGVzOiBbXG5cdFx0OTAsXG5cdFx0MTQ1LFxuXHRcdDIwMFxuXHRdLFxuXHRjb250cm9sczogW1xuXHRcdDgxLFxuXHRcdDg3LFxuXHRcdDY5XG5cdF0sXG5cdGs6IDAuMDEsXG5cdHBpcGVkdXI6IDI1MFxufTtcbiIsInZhciBNYXJpbyA9IHJlcXVpcmUoXCIuL21hcmlvXCIpO1xudmFyIFBpcGUgPSByZXF1aXJlKFwiLi9waXBlXCIpO1xudmFyIGRiYyA9IHJlcXVpcmUoXCIuLi9kZWJ1Zy9jdXJ2ZVwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5zY2FsZSA9IDI7XG5cdHRoaXMuc3ByaXRlcyA9IFt7XG5cdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0bmFtZTogXCJza3lcIixcblx0XHRjb2xvcjogXCIjNUM5NEZDXCIsXG5cdFx0d2lkdGg6IDI1MCxcblx0XHRoZWlnaHQ6IDE1MCxcblx0XHR4OiAwLFxuXHRcdHk6IDBcblx0fSwge1xuXHRcdHR5cGU6IFwiaW1nXCIsXG5cdFx0bmFtZTogXCJibG9ja3NcIixcblx0XHRzcmM6IFwiYmxvY2tzLnBuZ1wiLFxuXHRcdHg6IDAsXG5cdFx0eTogMzQsXG5cdFx0d2lkdGg6IDM0LFxuXHRcdGhlaWdodDogMTdcblx0fV07XG5cdHRoaXMuY3JlYXRlTWFyaW8gPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFyaW8gPSBuZXcgTWFyaW8oKTtcblx0XHRtYXJpby5vblNwYXduKCk7XG5cdFx0Ly90aGlzLnNwcml0ZXMgPSB0aGlzLnNwcml0ZXMuY29uY2F0KGRiYyhtYXJpby5wYXRoKSk7XG5cdFx0dGhpcy5zcHJpdGVzLnNwbGljZSgxLCAwLCBtYXJpbyk7XG5cdH07XG5cdHRoaXMuY3JlYXRlUGlwZXMgPSBmdW5jdGlvbigpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLnBpcGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgcGlwZSA9IG5ldyBQaXBlKCk7XG5cdFx0XHRwaXBlLm9uU3Bhd24oaSk7XG5cdFx0XHR0aGlzLnNwcml0ZXMucHVzaChwaXBlKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuY3JlYXRlV2F0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh7XG5cdFx0XHR0eXBlOiBcInJlY3RcIixcblx0XHRcdG5hbWU6IFwid2F0ZXJcIixcblx0XHRcdGNvbG9yOiBcIiMxNURDRTJcIixcblx0XHRcdG9wYWNpdHk6IDAuNSxcblx0XHRcdHk6IDEyMCxcblx0XHRcdHg6IDAsXG5cdFx0XHR3aWR0aDogMzAwLFxuXHRcdFx0aGVpZ2h0OiAzMFxuXHRcdH0pO1xuXHR9O1xufTtcbiJdfQ==
