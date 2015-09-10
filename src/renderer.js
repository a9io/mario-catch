var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothlocingEnabled = false;

module.exports = function(state) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.scale(state.scale, state.scale);
	var pipes = state.pipes;
	state.sprites.forEach(function(s, i) {
		if (s.name == "mario" || s.name == "heartp") {
			var p = pipes[s.destpipe];
			if (s.remove) {
				state.sprites.splice(i, 1);
			} else if (s.fading && !s.killed) {
				if (s.name == "mario") state.lost();
				s.killed = true;
			} else if (p.active && (s.x > p.x && s.x < p.x + 30) && (s.y >= p.y) && !(s.fading) && !(state.losing)) {
				s.reached = true;
				state.sprites.splice(i, 1);
				if (s.name == "mario") state.gained();
				else state.hearted();
			}
		} else if (s.remove) {
			state.sprites.splice(i, 1);
		}
		if (s.opacity) ctx.globalAlpha = s.opacity;
		else ctx.globalAlpha = 1;
		switch (s.type) {
			case "rect":
				ctx.fillStyle = s.color;
				ctx.fillRect(s.x, s.y, s.width, s.height);
				break;
			case "img":
				var img = new Image();
				img.src = "assets/" + s.src;
				ctx.drawImage(img, s.x, s.y, s.width, s.height);
				break;
			case "text":
				ctx.font = s.size + "px " + s.font;
				ctx.textAlign = s.align || "center";
				ctx.fillStyle = s.color || "#FFFFFF";
				ctx.fillText(s.text, s.x, s.y);
				break;
		}
	});
};
