function displayCodepoint(codepoint?: number): string {
  if (typeof codepoint == "undefined") return "";
  if (codepoint < 0x20) codepoint += 0x2400;
  if (codepoint == 0x7f) codepoint = 0x2421;
  if (codepoint >= 0xd800 && codepoint <= 0xdfff) {
    // surrogate
    return "";
  }
  let codepoints = [codepoint];
  if (graphemeBreakValueForCodepoint(codepoint) == "Extend")
    codepoints = [0x25cc, codepoint];
  return escapeHtml(ctos(codepoints));
}

function triggerChosenUpdate(id: string) {
  let elem = getElementById(id);
  let event = new CustomEvent("chosen:updated");
  elem.dispatchEvent(event);
}

function updateSelectOptions(id: string, html: string) {
  let elem = getElementById(id);
  elem.innerHTML = html;
  triggerChosenUpdate(id);
}
