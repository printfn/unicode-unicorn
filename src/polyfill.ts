if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(searchString: string, position?: number): boolean {
		let subjectString = this.toString();
		if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
			position = subjectString.length;
		}
		position -= searchString.length;
		let lastIndex = subjectString.lastIndexOf(searchString, position);
		return lastIndex !== -1 && lastIndex === position;
	};
}

/*enum Codepoint {}
function toCodepoint(cp: number): number & Codepoint {
	return cp;
}
const cp = toCodepoint;*/
