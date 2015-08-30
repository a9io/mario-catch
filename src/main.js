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
				} else if (p.active && (s.x > p.x && s.x < p.x + 30) && (s.y >= p.y)) {
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
