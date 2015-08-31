var render = require("./renderer");
var raf = require("./raf");
var audio = require("./audio");
var State = require("./state");
var state = new State();
state.createPipes();
state.createWater();

var random = require("./rand");

var spawn = function() {
	state.createMario();
	setTimeout(spawn, 350 + random.number(1500));
};

var checkLoop = function() {
	getPipes(state, function(pipes) {
		state.sprites.forEach(function(s, i) {
			if (s.name == "mario") {
				var p = pipes[s.destpipe];
				if (s.remove) {
					state.sprites.splice(i, 1);
				} else if (p.active && (s.x > p.x && s.x < p.x + 30) && (s.y >= p.y) && !(s.fading)) {
					s.reached = true;
					state.sprites.splice(i, 1);
					audio.play("score");
				}
			} else if (s.remove) {
				console.log("remove");
				state.sprites.splice(i, 1);
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

spawn();
checkLoop();

raf.start(function(e) {
	render(state);
});
