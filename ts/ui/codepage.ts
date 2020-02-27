function updateRenderedCodepage() {
  const encodingName = selectedOption("codepageEncoding").textContent!;
  const encoding = global_encodings[encodingName];
  const isAscii = encoding.type == `7-bit mapping`;
  let html = `<thead><th></th>`;
  for (let i = 0; i < 16; ++i) {
    html += `<th>_${i.toString(16).toUpperCase()}</th>`;
  }
  html += `</thead><tbody>`;
  for (let i = 0; i < (isAscii ? 8 : 16); ++i) {
    html += `<tr><td style="font-weight:bold">${i
      .toString(16)
      .toUpperCase()}_</td>`;
    for (let j = 0; j < 16; ++j) {
      const byte = (i << 4) + j;
      const codepoints = encoding.decode!([byte]);
      if (codepoints && codepoints.length > 0) {
        const codepoint = codepoints[0];
        const color = randomColorForKey(getCharacterCategoryCode(codepoint)[0]);
        const displayedCodepoint = displayCodepoint(codepoint);
        html += `<td style="cursor: pointer; background-color: ${color};" onclick="showCodepageDetail(${codepoint})">${i
          .toString(16)
          .toUpperCase()}${j
          .toString(16)
          .toUpperCase()}<br>${displayedCodepoint}</td>`;
      } else {
        html += `<td style="background-color: white">${i
          .toString(16)
          .toUpperCase()}${j.toString(16).toUpperCase()}<br>&nbsp;</td>`;
      }
    }
    html += `</tr>`;
  }
  html += `</tbody>`;
  getElementById("codepage").innerHTML = html;
}
