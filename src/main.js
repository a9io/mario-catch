var render = require("./renderer");
var raf = require("./raf");
var audio = require("./audio");
var State = require("./state");
var rules = require("./rules");
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
	setTimeout(state.spawn.bind(state), rules.beginDelay);
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
