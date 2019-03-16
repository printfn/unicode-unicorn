declare function randomColor(desc: { luminosity?: string; }): string;

let global_colorMap: { [key: string]: string; } = {
	'C': `#f97e77`,
	'L': `#f9e776`,
	'N': `#b7f976`,
	'P': `#76f9ee`,
	'S': `#7680f9`,
	'Z': `#a8a8a8`,
};

function randomColorForKey(key: string): string {
	if (global_colorMap[key]) {
		return global_colorMap[key];
	}
	return global_colorMap[key] = randomColor({ // format: "#a0ff9b"
		luminosity: `light`
	});
}
