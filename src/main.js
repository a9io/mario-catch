var render = require("./renderer");
var raf = require("./raf");
var State = require("./state");
var state = new State();
state.createMario();

raf.start(function(e){
	render(state);
});
