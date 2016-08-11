({
	encode: function(codepoints) {
		try {
			return ctou8(codepoints);
		} catch (err) {
			console.log(err);
		}
	},
	decode: function(codeUnits) {
		try {
			return u8toc(codeUnits);
		} catch (err) {
			console.log(err);
		}
	}
})