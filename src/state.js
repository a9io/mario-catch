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
			y: rules.water,
			x: 0,
			width: 300,
			height: 35
		});
	};
};
