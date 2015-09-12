var Mario = require("./mario");
var Pipe = require("./pipe");
var Scoreboard = require("./scoreboard");
var spawner = require("./spawner");
var audio = require("./audio");
var Heart = require("./heart");
var rules = require("./rules");
module.exports = function() {
	this.scale = rules.scale;
	this.time = 1;
	this.score = 0;
	this.lives = 3;
	this.losing = false;
	this.created = true;
	this.scoreboard = {};
	this.hearts = [];
	this.pipes = [];
	this.hi = 0;
	this.lostscreen = {
		type: "text",
		name: "lost",
		size: "20",
		font: "sans-serif",
		color: "#FF0000",
		text: "YOU LOST!",
		x: 130,
		y: 70
	};
	this.greetscreen = {
		type: "text",
		name: "greet",
		size: "20",
		font: "sans-serif",
		color: "#6BFF63",
		text: "MARIO CATCH",
		x: 130,
		y: 70
	};
	this.startscreen = {
		type: "text",
		name: "lost",
		size: "10",
		font: "sans-serif",
		text: "press x to start. press keys to raise pipes.",
		x: 130,
		y: 85
	};
	this.instructionscreen = {
		type: "text",
		name: "lost",
		size: "8",
		font: "sans-serif",
		text: "Q                   W                    E",
		x: 155,
		y: 110
	};
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
		name: "cloud",
		src: "cloud.png",
		x: 80,
		y: 12,
		opacity: 0.8,
		width: 40,
		height: 25
	}, {
		type: "img",
		name: "cloud",
		src: "cloud.png",
		x: 160,
		y: 35,
		opacity: 0.8,
		width: 24,
		height: 15
	}, {
		type: "img",
		name: "blocks",
		src: "blocks.png",
		x: 0,
		y: 34,
		width: 34,
		height: 17
	}, {
		type: "rect",
		name: "water",
		color: "#15DCE2",
		opacity: 0.5,
		y: rules.water,
		x: 0,
		width: 300,
		height: 35
	}];
	this.createMario = function() {
		var hrt = false;
		if(this.lives < 3) hrt = true;
		var mario = new Mario();
		mario.onSpawn(hrt);
		//var dbc = require("../debug/curve");
		//this.sprites = this.sprites.concat(dbc(mario.path));
		this.sprites.splice(3, 0, mario);
	};
	this.createPipes = function() {
		for (var i = 0; i < rules.pipes.length; i++) {
			var pipe = new Pipe();
			pipe.onSpawn(i);
			this.pipes.push(pipe);
			this.sprites.splice(3, 0, this.pipes[i]);
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
	this.createScore = function() {
		this.scoreboard = new Scoreboard();
		this.sprites.push(this.scoreboard);
	};
	this.lost = function() {
		if (this.lives > 0) {
			this.lives--;
			this.hearts[this.lives].lose();
		}
		if (this.lives === 0) {
			this.lostGame();
		}
	};
	this.hearted = function() {
		if (this.lives < 3 && !this.losing) {
			audio.play("heart");
			this.lives++;
			this.hearts[this.lives - 1].gain();
		}
	};
	this.gained = function(p) {
		audio.play("score" + p);
		this.score++;
		this.scoreboard.update(this.score);
	};
	this.lostGame = function() {
		this.losing = true;
		this.lives = 0;
		this.hearts.forEach(function(item){
			item.lose();
		});
		if (this.score > this.hi) this.setHi();
		this.scoreboard.update("last: " + this.score + " hi: " + this.hi);
		this.sprites.push(this.lostscreen);
		this.sprites.push(this.startscreen);
	};
	this.create = function() {
		this.created = true;
		this.sprites.push(this.greetscreen);
		this.sprites.push(this.startscreen);
		this.sprites.push(this.instructionscreen);
	};
	this.started = function() {
		this.created = false;
		var l = this.sprites.length - 1;
		this.sprites.splice(l, 1);
		this.sprites.splice(l - 1, 1);
		this.sprites.splice(l - 2, 1);
		this.createPipes();
		this.createScore();
		this.createHearts();
		this.getHi();
	};
	this.spawn = function(){
		if (!this.losing) {
			this.createMario();
			var t = spawner(this.time);
			this.time += t;
			setTimeout(this.spawn.bind(this), t);
		}
	};
	this.setHi = function() {
		this.hi = this.score;
		localStorage.setItem("hi", this.score);
	};
	this.getHi = function() {
		if(localStorage.getItem("hi")) this.hi = localStorage.getItem("hi");
	};
};
