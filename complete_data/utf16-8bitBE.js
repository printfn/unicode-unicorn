({
	encode: function(codepoints) {
		var str = ctos(codepoints);
		var res = [];
		for (var i = 0; i < str.length; ++i) {
			var charCode = str.charCodeAt(i);
			res.push(charCode >> 8);
			res.push(charCode & 0xFF);
		}
		return res;
	},
	decode: function(codeUnits) {
		var str = '';
		for (var i = 0; i < codeUnits.length; i += 2) {
			if (i + 1 >= codeUnits.length)
				return;
			if (codeUnits[i] < 0 || codeUnits[i] > 0xFF)
				return;
			if (codeUnits[i+1] < 0 || codeUnits[i+1] > 0xFF)
				return;
			str += String.fromCharCode((codeUnits[i] << 8) + codeUnits[i+1]);
		}
		return stoc(str);
	}
})