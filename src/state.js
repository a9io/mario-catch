var Mario = require("./mario");
var Pipe = require("./pipe");
var Scoreboard = require("./scoreboard");
var Heart = require("./heart");
//var Hurt = require("./hurt");
var rules = require("./rules");
module.exports = function() {
	this.scale = rules.scale;
	this.time = 1;
	this.score = 0;
	this.lives = 3;
	this.losing = false;
	this.scoreboard = {};
	this.hearts = [];
	this.pipes = [];
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
		//var dbc = require("../debug/curve");
		//this.sprites = this.sprites.concat(dbc(mario.path));
		this.sprites.splice(1, 0, mario);
	};
	this.createPipes = function() {
		for (var i = 0; i < rules.pipes.length; i++) {
			var pipe = new Pipe();
			pipe.onSpawn(i);
			this.pipes.push(pipe);
			this.sprites.push(this.pipes[i]);
		}
	};
	this.createHearts = function() {
		for (var i = 0; i < 3; i++) {
			var heart = new Heart();
			heart.onSpawn(i);
			this.hearts.push(heart);
			this.sprites.push(this.hearts[i]);
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
	this.createScore = function() {
		this.scoreboard = new Scoreboard();
		this.sprites.push(this.scoreboard);
	};
	this.lost = function() {
		if (this.lives > 0) {
			this.lives--;
			this.hearts[this.lives].lose();
		}
		if(this.lives === 0){
			this.losing = true;
		}
	};
	this.gained = function() {
		this.score++;
		this.scoreboard.update(this.score);
	};
};
