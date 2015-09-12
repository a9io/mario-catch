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
	audio.play("heart");
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
		initialize();
		startGame();
	}
});

document.getElementById("c").addEventListener("mousedown", function(e){
	if(state.losing || state.created){
		initialize();
		startGame();
	}
});

initialize();
