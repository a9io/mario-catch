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
