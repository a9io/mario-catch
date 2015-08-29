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
