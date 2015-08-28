(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var render = require("./renderer");
var raf = require("./raf");
var State = require("./state");
var state = new State();
state.createMario();

raf.start(function(e){
	render(state);
});

},{"./raf":6,"./renderer":8,"./state":10}],2:[function(require,module,exports){
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

},{"../src/curve":3}],3:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
var curve = require("./curve");
var random = require("./rand");
var rules = require("./rules");
module.exports = function() {
	this.width = 12;
	this.height = 16;
	this.x = -15;
	this.y = 34 - this.height;
	this.type = "img";
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

},{"./curve":3,"./rand":7,"./rules":9}],6:[function(require,module,exports){
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
	water: 120,
	pipes: [
		90,
		145,
		200
	],
	k: 0.01
};

},{}],10:[function(require,module,exports){
var Mario = require("./mario");
var dbc = require("../debug/curve");
var rules = require("./rules");
var inputs = require("./inputs");
module.exports = function(){
	this.scale = 2;
	this.sprites = [
		{
			type: "rect",
			color: "#5C94FC",
			width: 250,
			height: 150,
			x: 0,
			y: 0
		},
		{
			type: "img",
			src: "pipe.png",
			x: 90,
			y: 130,
			width: 30,
			height: 100
		},
		{
			type: "img",
			src: "pipe.png",
			x: 145,
			y: 130,
			width: 30,
			height: 100
		},
		{
			type: "img",
			src: "pipe.png",
			x: 200,
			y: 130,
			width: 30,
			height: 100
		},
		{
			type: "img",
			src: "blocks.png",
			x: 0,
			y: 34,
			width: 34,
			height: 17
		},
		{
			type: "rect",
			color: "#15DCE2",
			opacity: 0.5,
			y: 120,
			x: 0,
			width: 300,
			height: 30
		},
	];
	this.createMario = function(){
		var mario = new Mario();
		mario.onSpawn();
		//this.sprites = this.sprites.concat(dbc(mario.path));
		this.sprites.push(mario);
	};
};

},{"../debug/curve":2,"./inputs":4,"./mario":5,"./rules":9}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLXBvb2wtcGFydHkvZGVidWcvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tcG9vbC1wYXJ0eS9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tcG9vbC1wYXJ0eS9zcmMvaW5wdXRzLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLXBvb2wtcGFydHkvc3JjL21hcmlvLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLXBvb2wtcGFydHkvc3JjL3JhZi5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1wb29sLXBhcnR5L3NyYy9yYW5kLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLXBvb2wtcGFydHkvc3JjL3JlbmRlcmVyLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLXBvb2wtcGFydHkvc3JjL3J1bGVzLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLXBvb2wtcGFydHkvc3JjL3N0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcmVuZGVyID0gcmVxdWlyZShcIi4vcmVuZGVyZXJcIik7XG52YXIgcmFmID0gcmVxdWlyZShcIi4vcmFmXCIpO1xudmFyIFN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVcIik7XG52YXIgc3RhdGUgPSBuZXcgU3RhdGUoKTtcbnN0YXRlLmNyZWF0ZU1hcmlvKCk7XG5cbnJhZi5zdGFydChmdW5jdGlvbihlKXtcblx0cmVuZGVyKHN0YXRlKTtcbn0pO1xuIiwidmFyIGMgPSByZXF1aXJlKFwiLi4vc3JjL2N1cnZlXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjdXJ2ZSkge1xuXHR2YXIgcGF0aCA9IFtdO1xuXHRmb3IgKHZhciBpID0gY3VydmUueFswXTsgaSA8PSBjdXJ2ZS54W2N1cnZlLngubGVuZ3RoIC0gMV07IGkrKykge1xuXHRcdGlmIChjdXJ2ZS54LmluZGV4T2YoaSkgPiAtMSkgcGF0aC5wdXNoKHtcblx0XHRcdHR5cGU6IFwicmVjdFwiLFxuXHRcdFx0Y29sb3I6IFwiI0ZGMDAwMFwiLFxuXHRcdFx0d2lkdGg6IDUsXG5cdFx0XHRoZWlnaHQ6IDUsXG5cdFx0XHR4OiBpLFxuXHRcdFx0eTogY3VydmUueVtjdXJ2ZS54LmluZGV4T2YoaSldXG5cdFx0fSk7XG5cdFx0ZWxzZSBwYXRoLnB1c2goe1xuXHRcdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0XHRjb2xvcjogXCIjRkZGRkZGXCIsXG5cdFx0XHR3aWR0aDogMyxcblx0XHRcdGhlaWdodDogMyxcblx0XHRcdHg6IGksXG5cdFx0XHR5OiBjKGksIGN1cnZlKVxuXHRcdH0pO1xuXHR9XG5cdHJldHVybiBwYXRoO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oeCwgcGF0aCl7XG5cdENTUEwuZ2V0TmF0dXJhbEtzKHBhdGgueCwgcGF0aC55LCBwYXRoLmspO1xuXHRyZXR1cm4gQ1NQTC5ldmFsU3BsaW5lKHgsIHBhdGgueCwgcGF0aC55LCBwYXRoLmspO1xufTtcblxuLy9DU1BMIFNjcmlwdCBieSBJdmFuIEssIEFkYXB0ZWQgZm9yIHRoZSBnYW1lXG52YXIgQ1NQTCA9IGZ1bmN0aW9uKCkge307XG5DU1BMLl9nYXVzc0ogPSB7fTtcbkNTUEwuX2dhdXNzSi5zb2x2ZSA9IGZ1bmN0aW9uKEEsIHgpIC8vIGluIE1hdHJpeCwgb3V0IHNvbHV0aW9uc1xuXHR7XG5cdFx0dmFyIG0gPSBBLmxlbmd0aDtcblx0XHRmb3IgKHZhciBrID0gMDsgayA8IG07IGsrKykgLy8gY29sdW1uXG5cdFx0e1xuXHRcdFx0Ly8gcGl2b3QgZm9yIGNvbHVtblxuXHRcdFx0dmFyIGlfbWF4ID0gMDtcblx0XHRcdHZhciB2YWxpID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuXHRcdFx0Zm9yICh2YXIgaSA9IGs7IGkgPCBtOyBpKyspXG5cdFx0XHRcdGlmIChBW2ldW2tdID4gdmFsaSkge1xuXHRcdFx0XHRcdGlfbWF4ID0gaTtcblx0XHRcdFx0XHR2YWxpID0gQVtpXVtrXTtcblx0XHRcdFx0fVxuXHRcdFx0Q1NQTC5fZ2F1c3NKLnN3YXBSb3dzKEEsIGssIGlfbWF4KTtcblx0XHRcdC8vIGZvciBhbGwgcm93cyBiZWxvdyBwaXZvdFxuXHRcdFx0Zm9yICh2YXIgaSA9IGsgKyAxOyBpIDwgbTsgaSsrKSB7XG5cdFx0XHRcdGZvciAodmFyIGogPSBrICsgMTsgaiA8IG0gKyAxOyBqKyspXG5cdFx0XHRcdFx0QVtpXVtqXSA9IEFbaV1bal0gLSBBW2tdW2pdICogKEFbaV1ba10gLyBBW2tdW2tdKTtcblx0XHRcdFx0QVtpXVtrXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IG0gLSAxOyBpID49IDA7IGktLSkgLy8gcm93cyA9IGNvbHVtbnNcblx0XHR7XG5cdFx0XHR2YXIgdiA9IEFbaV1bbV0gLyBBW2ldW2ldO1xuXHRcdFx0eFtpXSA9IHY7XG5cdFx0XHRmb3IgKHZhciBqID0gaSAtIDE7IGogPj0gMDsgai0tKSAvLyByb3dzXG5cdFx0XHR7XG5cdFx0XHRcdEFbal1bbV0gLT0gQVtqXVtpXSAqIHY7XG5cdFx0XHRcdEFbal1baV0gPSAwO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbkNTUEwuX2dhdXNzSi56ZXJvc01hdCA9IGZ1bmN0aW9uKHIsIGMpIHtcblx0dmFyIEEgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCByOyBpKyspIHtcblx0XHRBLnB1c2goW10pO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgYzsgaisrKSBBW2ldLnB1c2goMCk7XG5cdH1cblx0cmV0dXJuIEE7XG59O1xuQ1NQTC5fZ2F1c3NKLnByaW50TWF0ID0gZnVuY3Rpb24oQSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IEEubGVuZ3RoOyBpKyspIGNvbnNvbGUubG9nKEFbaV0pO1xufTtcbkNTUEwuX2dhdXNzSi5zd2FwUm93cyA9IGZ1bmN0aW9uKG0sIGssIGwpIHtcblx0dmFyIHAgPSBtW2tdO1xuXHRtW2tdID0gbVtsXTtcblx0bVtsXSA9IHA7XG59O1xuQ1NQTC5nZXROYXR1cmFsS3MgPSBmdW5jdGlvbih4cywgeXMsIGtzKSAvLyBpbiB4IHZhbHVlcywgaW4geSB2YWx1ZXMsIG91dCBrIHZhbHVlc1xuXHR7XG5cdFx0dmFyIG4gPSB4cy5sZW5ndGggLSAxO1xuXHRcdHZhciBBID0gQ1NQTC5fZ2F1c3NKLnplcm9zTWF0KG4gKyAxLCBuICsgMik7XG5cblx0XHRmb3IgKHZhciBpID0gMTsgaSA8IG47IGkrKykgLy8gcm93c1xuXHRcdHtcblx0XHRcdEFbaV1baSAtIDFdID0gMSAvICh4c1tpXSAtIHhzW2kgLSAxXSk7XG5cblx0XHRcdEFbaV1baV0gPSAyICogKDEgLyAoeHNbaV0gLSB4c1tpIC0gMV0pICsgMSAvICh4c1tpICsgMV0gLSB4c1tpXSkpO1xuXG5cdFx0XHRBW2ldW2kgKyAxXSA9IDEgLyAoeHNbaSArIDFdIC0geHNbaV0pO1xuXG5cdFx0XHRBW2ldW24gKyAxXSA9IDMgKiAoKHlzW2ldIC0geXNbaSAtIDFdKSAvICgoeHNbaV0gLSB4c1tpIC0gMV0pICogKHhzW2ldIC0geHNbaSAtIDFdKSkgKyAoeXNbaSArIDFdIC0geXNbaV0pIC8gKCh4c1tpICsgMV0gLSB4c1tpXSkgKiAoeHNbaSArIDFdIC0geHNbaV0pKSk7XG5cdFx0fVxuXG5cdFx0QVswXVswXSA9IDIgLyAoeHNbMV0gLSB4c1swXSk7XG5cdFx0QVswXVsxXSA9IDEgLyAoeHNbMV0gLSB4c1swXSk7XG5cdFx0QVswXVtuICsgMV0gPSAzICogKHlzWzFdIC0geXNbMF0pIC8gKCh4c1sxXSAtIHhzWzBdKSAqICh4c1sxXSAtIHhzWzBdKSk7XG5cblx0XHRBW25dW24gLSAxXSA9IDEgLyAoeHNbbl0gLSB4c1tuIC0gMV0pO1xuXHRcdEFbbl1bbl0gPSAyIC8gKHhzW25dIC0geHNbbiAtIDFdKTtcblx0XHRBW25dW24gKyAxXSA9IDMgKiAoeXNbbl0gLSB5c1tuIC0gMV0pIC8gKCh4c1tuXSAtIHhzW24gLSAxXSkgKiAoeHNbbl0gLSB4c1tuIC0gMV0pKTtcblxuXHRcdENTUEwuX2dhdXNzSi5zb2x2ZShBLCBrcyk7XG5cdH07XG5DU1BMLmV2YWxTcGxpbmUgPSBmdW5jdGlvbih4LCB4cywgeXMsIGtzKSB7XG5cdHZhciBpID0gMTtcblx0d2hpbGUgKHhzW2ldIDwgeCkgaSsrO1xuXG5cdHZhciB0ID0gKHggLSB4c1tpIC0gMV0pIC8gKHhzW2ldIC0geHNbaSAtIDFdKTtcblxuXHR2YXIgYSA9IGtzW2kgLSAxXSAqICh4c1tpXSAtIHhzW2kgLSAxXSkgLSAoeXNbaV0gLSB5c1tpIC0gMV0pO1xuXHR2YXIgYiA9IC1rc1tpXSAqICh4c1tpXSAtIHhzW2kgLSAxXSkgKyAoeXNbaV0gLSB5c1tpIC0gMV0pO1xuXG5cdHZhciBxID0gKDEgLSB0KSAqIHlzW2kgLSAxXSArIHQgKiB5c1tpXSArIHQgKiAoMSAtIHQpICogKGEgKiAoMSAtIHQpICsgYiAqIHQpO1xuXHRyZXR1cm4gcTtcbn07XG4iLG51bGwsInZhciBjdXJ2ZSA9IHJlcXVpcmUoXCIuL2N1cnZlXCIpO1xudmFyIHJhbmRvbSA9IHJlcXVpcmUoXCIuL3JhbmRcIik7XG52YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMud2lkdGggPSAxMjtcblx0dGhpcy5oZWlnaHQgPSAxNjtcblx0dGhpcy54ID0gLTE1O1xuXHR0aGlzLnkgPSAzNCAtIHRoaXMuaGVpZ2h0O1xuXHR0aGlzLnR5cGUgPSBcImltZ1wiO1xuXHR0aGlzLnNyYyA9IFwibWFyaW8ucG5nXCI7XG5cdHRoaXMubG9zdCA9IGZhbHNlO1xuXHR0aGlzLmRlc3RwaXBlID0gMDtcblx0dGhpcy5wYXRoID0ge1xuXHRcdHg6IFstMTUsIDE3LCAzMF0sXG5cdFx0eTogWzM0LXRoaXMuaGVpZ2h0LCAzNCAtIHRoaXMuaGVpZ2h0LCAxMF0sXG5cdFx0azogW3J1bGVzLmssIHJ1bGVzLmssIHJ1bGVzLmtdXG5cdH07XG5cdHRoaXMuZ2VuZXJhdGVDdXJ2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVzdHBpcGUgPSByYW5kb20ubnVtYmVyKHJ1bGVzLnBpcGVzLmxlbmd0aCk7XG5cdFx0dmFyIGsgPSBydWxlcy5rO1xuXHRcdHRoaXMucGF0aC5rID0gdGhpcy5wYXRoLmsuY29uY2F0KFtrLCBrLCBrXSk7XG5cdFx0dmFyIGRlc3R4ID0gcnVsZXMucGlwZXNbdGhpcy5kZXN0cGlwZV0gKyAxNTtcblx0XHR2YXIgdGhyZXMgPSBkZXN0eCAtIChyYW5kb20ubnVtYmVyKDI2KSArIDEwKTtcblx0XHQvL3ZhciB0aHJlcyA9IGRlc3R4IC0gMjA7XG5cblx0XHQvL2NsaW1heFxuXHRcdHRoaXMucGF0aC55LnB1c2goMyk7XG5cdFx0dGhpcy5wYXRoLngucHVzaCh0aHJlcy8yKTtcblxuXHRcdC8vYnVmZmVyIGFwcHJvYWNoXG5cdFx0dGhpcy5wYXRoLnkucHVzaChydWxlcy53YXRlci8yKTtcblx0XHR0aGlzLnBhdGgueC5wdXNoKHRocmVzKTtcblxuXHRcdC8vZGVzdGluYXRpb25cblx0XHR0aGlzLnBhdGgueS5wdXNoKHJ1bGVzLndhdGVyKTtcblx0XHR0aGlzLnBhdGgueC5wdXNoKGRlc3R4KTtcblx0fTtcblx0dGhpcy50aWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy54ID4gdGhpcy5wYXRoLnhbMV0pIHRoaXMueSA9IGN1cnZlKHRoaXMueCwgdGhpcy5wYXRoKTsgLy8gY3VydmUgaWYgbm90IG9uIGRlY2tcblx0XHR0aGlzLngrKztcblx0XHRpZih0aGlzLnkgPD0gcnVsZXMud2F0ZXIpIHNldFRpbWVvdXQodGhpcy50aWNrLmJpbmQodGhpcyksIDEwKTtcblx0XHRlbHNlIHtcblx0XHRcdHRoaXMubG9zdCA9IHRydWU7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmJlZ2luID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nZW5lcmF0ZUN1cnZlKCk7XG5cdFx0dGhpcy50aWNrKCk7XG5cdH07XG5cdHRoaXMub25TcGF3biA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYmVnaW4oKTtcblx0fTtcbn07XG4iLCIvLyBIb2xkcyBsYXN0IGl0ZXJhdGlvbiB0aW1lc3RhbXAuXG52YXIgdGltZSA9IDA7XG5cbi8qKlxuICogQ2FsbHMgYGZuYCBvbiBuZXh0IGZyYW1lLlxuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb25cbiAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiByYWYoZm4pIHtcbiAgcmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgdmFyIGVsYXBzZWQgPSBub3cgLSB0aW1lO1xuXG4gICAgaWYgKGVsYXBzZWQgPiA5OTkpIHtcbiAgICAgIGVsYXBzZWQgPSAxIC8gNjA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsYXBzZWQgLz0gMTAwMDtcbiAgICB9XG5cbiAgICB0aW1lID0gbm93O1xuICAgIGZuKGVsYXBzZWQpO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBDYWxscyBgZm5gIG9uIGV2ZXJ5IGZyYW1lIHdpdGggYGVsYXBzZWRgIHNldCB0byB0aGUgZWxhcHNlZFxuICAgKiB0aW1lIGluIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvblxuICAgKiBAcmV0dXJuIHtpbnR9IFRoZSByZXF1ZXN0IElEXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBzdGFydDogZnVuY3Rpb24oZm4pIHtcbiAgICByZXR1cm4gcmFmKGZ1bmN0aW9uIHRpY2soZWxhcHNlZCkge1xuICAgICAgZm4oZWxhcHNlZCk7XG4gICAgICByYWYodGljayk7XG4gICAgfSk7XG4gIH0sXG4gIC8qKlxuICAgKiBDYW5jZWxzIHRoZSBzcGVjaWZpZWQgYW5pbWF0aW9uIGZyYW1lIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7aW50fSBpZCBUaGUgcmVxdWVzdCBJRFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgc3RvcDogZnVuY3Rpb24oaWQpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpO1xuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdG51bWJlcjogZnVuY3Rpb24obWF4KXsgLy9yZXR1cm5zIGJldHdlZW4gMCBhbmQgbWF4IC0gMVxuXHRcdHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqbWF4KTtcblx0fVxufTtcbiIsInZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNcIik7XG52YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbmN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbmN0eC5tb3pJbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbmN0eC53ZWJraXRJbWFnZVNtb290aGxvY2luZ0VuYWJsZWQgPSBmYWxzZTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdGF0ZSkge1xuXHRjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XG5cdGN0eC5zY2FsZShzdGF0ZS5zY2FsZSwgc3RhdGUuc2NhbGUpO1xuXHRzdGF0ZS5zcHJpdGVzLmZvckVhY2goZnVuY3Rpb24ocykge1xuXHRcdGlmIChzLm9wYWNpdHkpIGN0eC5nbG9iYWxBbHBoYSA9IHMub3BhY2l0eTtcblx0XHRlbHNlIGN0eC5nbG9iYWxBbHBoYSA9IDE7XG5cdFx0c3dpdGNoIChzLnR5cGUpIHtcblx0XHRcdGNhc2UgXCJyZWN0XCI6XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBzLmNvbG9yO1xuXHRcdFx0XHRjdHguZmlsbFJlY3Qocy54LCBzLnksIHMud2lkdGgsIHMuaGVpZ2h0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiaW1nXCI6XG5cdFx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdFx0aW1nLnNyYyA9IFwiYXNzZXRzL1wiICsgcy5zcmM7XG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UoaW1nLCBzLngsIHMueSwgcy53aWR0aCwgcy5oZWlnaHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRib3R0b206IDMwMCxcblx0d2F0ZXI6IDEyMCxcblx0cGlwZXM6IFtcblx0XHQ5MCxcblx0XHQxNDUsXG5cdFx0MjAwXG5cdF0sXG5cdGs6IDAuMDFcbn07XG4iLCJ2YXIgTWFyaW8gPSByZXF1aXJlKFwiLi9tYXJpb1wiKTtcbnZhciBkYmMgPSByZXF1aXJlKFwiLi4vZGVidWcvY3VydmVcIik7XG52YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbnZhciBpbnB1dHMgPSByZXF1aXJlKFwiLi9pbnB1dHNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMuc2NhbGUgPSAyO1xuXHR0aGlzLnNwcml0ZXMgPSBbXG5cdFx0e1xuXHRcdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0XHRjb2xvcjogXCIjNUM5NEZDXCIsXG5cdFx0XHR3aWR0aDogMjUwLFxuXHRcdFx0aGVpZ2h0OiAxNTAsXG5cdFx0XHR4OiAwLFxuXHRcdFx0eTogMFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogXCJpbWdcIixcblx0XHRcdHNyYzogXCJwaXBlLnBuZ1wiLFxuXHRcdFx0eDogOTAsXG5cdFx0XHR5OiAxMzAsXG5cdFx0XHR3aWR0aDogMzAsXG5cdFx0XHRoZWlnaHQ6IDEwMFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogXCJpbWdcIixcblx0XHRcdHNyYzogXCJwaXBlLnBuZ1wiLFxuXHRcdFx0eDogMTQ1LFxuXHRcdFx0eTogMTMwLFxuXHRcdFx0d2lkdGg6IDMwLFxuXHRcdFx0aGVpZ2h0OiAxMDBcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6IFwiaW1nXCIsXG5cdFx0XHRzcmM6IFwicGlwZS5wbmdcIixcblx0XHRcdHg6IDIwMCxcblx0XHRcdHk6IDEzMCxcblx0XHRcdHdpZHRoOiAzMCxcblx0XHRcdGhlaWdodDogMTAwXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiBcImltZ1wiLFxuXHRcdFx0c3JjOiBcImJsb2Nrcy5wbmdcIixcblx0XHRcdHg6IDAsXG5cdFx0XHR5OiAzNCxcblx0XHRcdHdpZHRoOiAzNCxcblx0XHRcdGhlaWdodDogMTdcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6IFwicmVjdFwiLFxuXHRcdFx0Y29sb3I6IFwiIzE1RENFMlwiLFxuXHRcdFx0b3BhY2l0eTogMC41LFxuXHRcdFx0eTogMTIwLFxuXHRcdFx0eDogMCxcblx0XHRcdHdpZHRoOiAzMDAsXG5cdFx0XHRoZWlnaHQ6IDMwXG5cdFx0fSxcblx0XTtcblx0dGhpcy5jcmVhdGVNYXJpbyA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIG1hcmlvID0gbmV3IE1hcmlvKCk7XG5cdFx0bWFyaW8ub25TcGF3bigpO1xuXHRcdC8vdGhpcy5zcHJpdGVzID0gdGhpcy5zcHJpdGVzLmNvbmNhdChkYmMobWFyaW8ucGF0aCkpO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKG1hcmlvKTtcblx0fTtcbn07XG4iXX0=
