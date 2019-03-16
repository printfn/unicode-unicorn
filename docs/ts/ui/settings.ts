let global_lang: string = '';

function updateLanguage() {
	let lang = ``;
	const textboxCode = $(`#languageCode`).val();
	let dropdownCode = ``;
	const langComponentStrings = [
		$(`#languageList option:selected`).attr(`data-code`),
		$(`#scriptList option:selected`).attr(`data-code`),
		$(`#regionList option:selected`).attr(`data-code`),
		$(`#variantList option:selected`).attr(`data-code`)
	];
	for (let i = 0; i < langComponentStrings.length; ++i) {
		const component = langComponentStrings[i];
		if (!component)
			continue;
		if (dropdownCode != ``)
			dropdownCode += `-`;
		dropdownCode += component;
	}
	// valid states:
	//   everything enabled, textboxCode and dropdownCode empty
	//   dropdownCode non-empty: textboxCode set to dropdownCode, textbox disabled
	//   dropdownCode empty: dropdown disabled

	if ($(`#languageCode`)[0].hasAttribute(`disabled`)) {
		$(`#languageCode`).val(``); // occurs when dropdownCode is reset to blank
	}
		
	if (textboxCode == `` && dropdownCode == ``) {
		$(`#languageCode`).removeAttr(`disabled`);
		$(`#languageList`).removeAttr(`disabled`);
		$(`#scriptList`).removeAttr(`disabled`);
		$(`#regionList`).removeAttr(`disabled`);
		$(`#variantList`).removeAttr(`disabled`);
		lang = ``;
	} else if (textboxCode == `` && dropdownCode != ``) {
		$(`#languageCode`).attr(`disabled`, `disabled`);
		$(`#languageList`).removeAttr(`disabled`);
		$(`#scriptList`).removeAttr(`disabled`);
		$(`#regionList`).removeAttr(`disabled`);
		$(`#variantList`).removeAttr(`disabled`);
		lang = dropdownCode;
		$(`#languageCode`).val(lang);
	} else if (textboxCode != `` && dropdownCode == ``) {
		$(`#languageCode`).removeAttr(`disabled`);
		$(`#languageList`).attr(`disabled`, `disabled`);
		$(`#scriptList`).attr(`disabled`, `disabled`);
		$(`#regionList`).attr(`disabled`, `disabled`);
		$(`#variantList`).attr(`disabled`, `disabled`);
		lang = textboxCode;
	} else {
		if ($(`#languageCode`)[0].hasAttribute(`disabled`)) {
			lang = dropdownCode;
			$(`#languageCode`).val(lang);
		} else {
			lang = textboxCode;
		}
	}

	let elems = document.getElementsByClassName('lang-attr');
	for (let i = 0; i < elems.length; ++i) {
		if (lang) {
			elems[i].setAttribute('lang', lang);
		} else {
			elems[i].removeAttribute('lang');
		}
	}
	global_lang = lang;
}

function updateUseInternalString() {
	global_useInternalString = $(`#useInternalString`).is(`:checked`);
}
