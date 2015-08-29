var ee = new require("events").EventEmitter;

window.addEventListener("keydown", function(e) {
	switch (e.keyCode) {
		case 87:
			ee.emit("q");
		break;
	}
});

module.exports = ee;
