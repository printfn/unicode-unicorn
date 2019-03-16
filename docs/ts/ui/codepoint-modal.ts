function tryFillElement(id: string, value: string) {
  if (value) {
    $(`#${id}`).show();
    $(`#${id}-content`).text(value);
  } else {
    $(`#${id}`).hide();
  }
}

function showCodepageDetail(codepoint: number) {
  $(`#detail-codepoint-hex`).text(itos(codepoint, 16, 4));
  $(`#detail-codepoint-decimal`).text(codepoint);
  $(`#detail-name`).html(`"${getName(codepoint)}"`);
  $(`#detail-character`).html(displayCodepoint(codepoint));
  $(`#detail-character-raw`).text(ctos([codepoint]));
  $(`#detail-character-textbox`).val(ctos([codepoint]));
  $(`#detail-category`).text(`${getCharacterCategoryCode(codepoint)} (${getCharacterCategoryName(codepoint)})`);
  $(`#detail-block`).text(getBlockForCodepoint(codepoint).replace(/_/g, ` `));
  $(`#detail-script`).text(getScriptForCodepoint(codepoint).replace(/_/g, ` `));
  const matchingAliases: string[] = [];
  for (let i = 0; i < global_aliases.length; ++i) {
    if (global_aliases[i].codepoint == codepoint)
      matchingAliases.push(global_aliases[i].alias);
  }
  tryFillElement('detail-aliases', matchingAliases.join(`, `));
  tryFillElement('detail-meaning', global_han_meanings[codepoint]);
  tryFillElement('detail-mandarin', global_mandarin_readings[codepoint]);
  tryFillElement('detail-kun', global_kun_readings[codepoint]);
  tryFillElement('detail-on', global_on_readings[codepoint]);
  const variationSequences = variationSequencesForCodepoint(codepoint).concat(ideographicVariationSequencesForCodepoint(codepoint));
  if (variationSequences.length === 0) {
    $(`#detail-variation-sequences`).hide();
  } else {
    $(`#detail-variation-sequences`).show();
    let variationsString = ``;
    for (let i = 0; i < variationSequences.length; ++i) {
      let vs = variationSequences[i];
      if (variationsString !== ``)
        variationsString += `<br>`;
      if (!vs.shapingEnvironments)
        vs.shapingEnvironments = [];
      variationsString += `U+${itos(vs.baseCodepoint, 16, 4)
      } U+${itos(vs.variationSelector, 16, 4)
      }: ${escapeHtml(ctos([vs.baseCodepoint, vs.variationSelector]))} <i>${vs.description}`;
      if (vs.shapingEnvironments.length > 0) {
        variationsString += ` (${vs.shapingEnvironments.join(`, `)})</i>`;
      } else {
        variationsString += `</i>`;
      }
    }
    $(`#detail-variation-sequences-content`).html(variationsString);
  }

  let encodingsString = ``;
  $(`#outputEncoding option`).each(function(i, e) {
    const encoding = $(e).text();
    const html = encodeOutput(
      $(`#byteOrderMark option:selected`).text(),
      encoding,
      $(`#outputFormat option:selected`).text(),
      [codepoint]
    );
    if (html.startsWith(`<span`))
      return;
    encodingsString += `${encoding}: ${html}\n`;
  });

  $(`#detail-encoding-outputs`).html(encodingsString);

  $(`#detail-previous-cp`).attr(`data-cp`, previousCodepoint(codepoint));
  $(`#detail-next-cp`).attr(`data-cp`, nextCodepoint(codepoint));
  
  jQueryModal(`#codepoint-detail`, `show`);
}

// called from button in modal dialog to navigate to a different codepoint
function changeDetail(elem: HTMLElement) {
  $(elem).blur(); // remove focus
  const codepointToShow = parseInt($(elem).attr(`data-cp`), 10);
  showCodepageDetail(codepointToShow);
}
