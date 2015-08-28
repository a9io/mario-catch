var c = require("../src/curve");
module.exports = function(curve) {
	var path = [];
	for (var i = curve.x[0]; i <= curve.x[curve.x.length - 1]; i++) {
		if (curve.x.indexOf(i) > -1) path.push({
			type: "rect",
			color: "#FF0000",
			width: 5,
			height: 5,
			x: i,
			y: curve.y[curve.x.indexOf(i)]
		});
		else path.push({
			type: "rect",
			color: "#FFFFFF",
			width: 3,
			height: 3,
			x: i,
			y: c(i, curve)
		});
	}
	return path;
};
