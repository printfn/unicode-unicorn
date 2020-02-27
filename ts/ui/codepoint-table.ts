interface ButtonInfo {
  displayName: string; // text displayed on button
  functionName: string; // name of global function called on click

  // if provided, if it returns false for row i and row count length, button will be disabled
  require: (idx: number, length: number) => boolean;
}

function renderCodepointsInTable(codepoints: number[], tableId: string, buttons: ButtonInfo[]) {
  const table = getElementById(tableId);
  if (codepoints.length === 0) {
    table.innerHTML = '';
    return;
  }
  let langAttr = global_lang ? 'lang="${global_lang}"' : '';
  let html = `
  <thead>
    <tr>
      <th></th>
      <th>Codepoint (Hex)</th>
      <th>Codepoint (Decimal)</th>
      <th>Character</th>
      <th>Category</th>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>`;
  let i = 0;
  for (i = 0; i < codepoints.length; ++i) {
    const codepoint = codepoints[i];
    let buttonStr = ``;
    for (const j in buttons) {
      const buttonDescription = buttons[j];
      let disabled = ``;
      if (!buttonDescription.require(i, codepoints.length)) {
        disabled = `disabled style="visibility:hidden;"`;
      }
      buttonStr += `
      <div class="btn-group" role="group">
        <input
          type="button" ${disabled}
          onclick="${buttonDescription.functionName}(${codepoint}, ${i})"
          value="${buttonDescription.displayName}"
          class="btn btn-sm btn-outline-secondary">
      </div>`;
    }
    html += `
    <tr class="char-row-category-${getCharacterCategoryCode(codepoint)[0].toLowerCase()}">
      <td>${buttonStr}</td>
      <td>U+${itos(codepoint, 16, 4)}</td>
      <td>${codepoint}</td>
      <td class="lang-attr" ${langAttr}>${displayCodepoint(codepoint)}</td>
      <td>${getCharacterCategoryName(codepoint)}</td>
      <td style="cursor: pointer;" onclick="showCodepageDetail(${codepoint})">${
        getHtmlNameDescription(codepoint)
      }</td>
    </tr>`;
  }
  if (i >= 256) {
    html += `<tr><td colspan="6">Showing only the first 256 rows.</td></tr>`;
  }
  html += `</tbody>`;
  table.style.display = 'none';
  table.innerHTML = html;
  table.style.display = '';
}

function updateCodepointList() {
  const codepoints = getStr();
  renderCodepointsInTable(codepoints, `codepointlist`, [{
    displayName: `Delete`,
    functionName: `deleteAtIndex`,
    require: () => true
  }, {
    displayName: `Move up`,
    functionName: `moveUp`,
    require: (i, length) => i != 0
  }, {
    displayName: `Move down`,
    functionName: `moveDown`,
    require: (i, length) => i != length - 1
  }]);
}
