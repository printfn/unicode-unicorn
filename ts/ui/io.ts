function saveToSlot(slotNumber: number) {
	try {
		let str = ctos(getStr());
		if (str) {
			localStorage.setItem(`slot${slotNumber}`, str);
			alert(`Stored string in slot ${slotNumber}.`);
			return;
		}
	} catch {
	}
	alert('Failed to store string!');
}

function loadFromSlot(slotNumber: number) {
	let str = localStorage.getItem(`slot${slotNumber}`);
	if (!str) {
		alert(`Couldn't find anything in slot ${slotNumber}!`);
		return;
	}
	setStr(stoc(str));
	alert(`Successfully loaded string from slot ${slotNumber}.`);
}
