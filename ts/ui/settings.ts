let global_lang: string = "";

function updateLanguage() {
  let lang = ``;
  const languageCodeElem = getElementById("languageCode") as HTMLInputElement;
  let textboxCode = languageCodeElem.value;
  let dropdownCode = ``;
  const langComponentStrings = [
    selectedOption("languageList").getAttribute("data-code"),
    selectedOption("scriptList").getAttribute("data-code"),
    selectedOption("regionList").getAttribute("data-code"),
    selectedOption("variantList").getAttribute("data-code")
  ];
  for (let i = 0; i < langComponentStrings.length; ++i) {
    const component = langComponentStrings[i];
    if (!component) continue;
    if (dropdownCode != ``) dropdownCode += `-`;
    dropdownCode += component;
  }
  // valid states:
  //   everything enabled, textboxCode and dropdownCode empty
  //   dropdownCode non-empty: textboxCode set to dropdownCode, textbox disabled
  //   dropdownCode empty: dropdown disabled

  if (languageCodeElem.hasAttribute("disabled")) {
    languageCodeElem.value = ""; // occurs when dropdownCode is reset to blank
    textboxCode = languageCodeElem.value;
  }

  if (textboxCode == `` && dropdownCode == ``) {
    languageCodeElem.removeAttribute("disabled");
    getElementById("languageList").removeAttribute("disabled");
    getElementById("scriptList").removeAttribute("disabled");
    getElementById("regionList").removeAttribute("disabled");
    getElementById("variantList").removeAttribute("disabled");
    lang = ``;
  } else if (textboxCode == `` && dropdownCode != ``) {
    languageCodeElem.setAttribute("disabled", "disabled");
    getElementById("languageList").removeAttribute("disabled");
    getElementById("scriptList").removeAttribute("disabled");
    getElementById("regionList").removeAttribute("disabled");
    getElementById("variantList").removeAttribute("disabled");
    lang = dropdownCode;
    languageCodeElem.value = lang;
  } else if (textboxCode != `` && dropdownCode == ``) {
    languageCodeElem.removeAttribute("disabled");
    getElementById("languageList").setAttribute("disabled", "disabled");
    getElementById("scriptList").setAttribute("disabled", "disabled");
    getElementById("regionList").setAttribute("disabled", "disabled");
    getElementById("variantList").setAttribute("disabled", "disabled");
    lang = textboxCode;
  } else {
    if (languageCodeElem.hasAttribute("disabled")) {
      lang = dropdownCode;
      languageCodeElem.value = lang;
    } else {
      lang = textboxCode;
    }
  }

  triggerChosenUpdate("languageList");
  triggerChosenUpdate("scriptList");
  triggerChosenUpdate("regionList");
  triggerChosenUpdate("variantList");

  let elems = document.getElementsByClassName("lang-attr");
  for (let i = 0; i < elems.length; ++i) {
    if (lang) {
      elems[i].setAttribute("lang", lang);
    } else {
      elems[i].removeAttribute("lang");
    }
  }
  global_lang = lang;
}

function updateUseInternalString() {
  global_useInternalString = (getElementById(
    "useInternalString"
  ) as HTMLInputElement).checked;
}
