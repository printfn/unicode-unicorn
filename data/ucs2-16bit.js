({
	encode: function(codepoints) {
		var str = ctos(codepoints);
		var res = [];
		for (var i = 0; i < str.length; ++i) {
			var charCode = str.charCodeAt(i);
			if (charCode >= 0xD800 && charCode <= 0xDFFF) {
				return stoc(String.fromCharCode(charCode, str.charCodeAt(i+1)))[0];
			}
			res.push(charCode);
		}
		return res;
	},
	decode: function(codeUnits) {
		var str = '';
		for (var i = 0; i < codeUnits.length; ++i) {
			if (codeUnits[i] >= 0xD800 && codeUnits[i] <= 0xDFFF)
				return;
			str += String.fromCharCode(codeUnits[i]);
		}
		return stoc(str);
	}
})