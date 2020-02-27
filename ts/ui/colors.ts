function getRandomColor() {
	const letters = '0123456789abcdef';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

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
	return global_colorMap[key] = getRandomColor();
}
