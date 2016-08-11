({
	encode: function(codepoints) {
		var res = [];
		for (var i = 0; i < codepoints.length; ++i) {
			var codepoint = codepoints[i];
			res.push((codepoint      ) & 0xFF);
			res.push((codepoint >>  8) & 0xFF);
			res.push((codepoint >> 16) & 0xFF);
			res.push((codepoint >> 24)       );
		}
		return res;
	},
	decode: function(codeUnits) {
		var res = [];
		for (var i = 0; i < codeUnits.length; i += 4) {
			if (i + 3 >= codeUnits.length)
				return;
			if (codeUnits[i] > 0xFF || codeUnits[i+1] > 0xFF || codeUnits[i+2] > 0xFF || codeUnits[i+3] > 0xFF)
				return;
			res.push((codeUnits[i  ]      ) 
			       + (codeUnits[i+1] <<  8) 
			       + (codeUnits[i+2] << 16) 
			       + (codeUnits[i+3] << 24));
		}
		return res;
	}
})