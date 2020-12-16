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
    const transFlag = [127987, 65039, 8205, 9895, 65039];
    let isTrans = false;
    if (
        codepoints.length == transFlag.length &&
        codepoints.every((value, index) => value === transFlag[index])
    ) {
        isTrans = true;
    }
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
        let colorClass = `char-row-category-${getCharacterCategoryCode(
            codepoint
        )[0].toLowerCase()}`;
        if (isTrans) {
            if (i == 0 || i == 4) colorClass = 'trans-blue';
            else if (i == 1 || i == 3) colorClass = 'trans-pink';
            else if (i == 2) colorClass = 'trans-white';
        }
        html += `
    <tr class="${colorClass}">
      <td>${buttonStr}</td>
      <td>U+${itos(codepoint, 16, 4)}</td>
      <td>${codepoint}</td>
      <td class="lang-attr" ${langAttr}>${displayCodepoint(codepoint)}</td>
      <td>${getCharacterCategoryName(codepoint)}</td>
      <td style="cursor: pointer;" onclick="showCodepageDetail(${codepoint})">${getHtmlNameDescription(
            codepoint
        )}</td>
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
    renderCodepointsInTable(codepoints, `codepointlist`, [
        {
            displayName: `Delete`,
            functionName: `deleteAtIndex`,
            require: () => true,
        },
        {
            displayName: `&#x2191;`,
            functionName: `moveUp`,
            require: (i, length) => i != 0,
        },
        {
            displayName: `&#x2193;`,
            functionName: `moveDown`,
            require: (i, length) => i != length - 1,
        },
    ]);
}
