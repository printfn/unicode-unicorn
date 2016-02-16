({
	encode: function(codepoints) {
		var str = ctos(codepoints);
		var res = [];
		for (var i = 0; i < str.length; ++i)
			res.push(str.charCodeAt(i));
		return res;
	},
	decode: function(codeUnits) {
		var str = '';
		for (var i = 0; i < codeUnits.length; ++i)
			str += String.fromCharCode(codeUnits[i]);
		return stoc(str);
	}
})