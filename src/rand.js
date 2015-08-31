var prev;
module.exports = {
	number: function(max) { //returns between 0 and max - 1
		return Math.floor(Math.random() * max);
	},
	repnumber: function(max) { //same as number but non-repeating
		var res = Math.floor(Math.random() * max);
		if (res == prev) {
			if (res > 0) res -= 1;  //yes very cheap
			else res = 1;
		}
		prev = res;
		return res;
	}
};
