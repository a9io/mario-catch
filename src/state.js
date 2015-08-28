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
