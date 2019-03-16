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
  if (matchingAliases.length === 0) {
    $(`#detail-aliases`).hide();
  } else {
    $(`#detail-aliases`).show();
    $(`#detail-aliases-list`).text(matchingAliases.join(`, `));
  }
  const meaning = global_han_meanings[codepoint];
  if (meaning) {
    $(`#detail-meaning`).show();
    $(`#detail-meaning-content`).text(meaning);
  } else {
    $(`#detail-meaning`).hide();
  }
  const mandarin = global_mandarin_readings[codepoint];
  if (mandarin) {
    $(`#detail-mandarin`).show();
    $(`#detail-mandarin-content`).text(mandarin);
  } else {
    $(`#detail-mandarin`).hide();
  }
  const kun = global_kun_readings[codepoint];
  if (kun) {
    $(`#detail-kun`).show();
    $(`#detail-kun-content`).text(kun);
  } else {
    $(`#detail-kun`).hide();
  }
  const on = global_on_readings[codepoint];
  if (on) {
    $(`#detail-on`).show();
    $(`#detail-on-content`).text(on);
  } else {
    $(`#detail-on`).hide();
  }
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

  $(`#detail-previous-cp`).attr(`data-cp`, codepoint != 0 ? itos(codepoint - 1, 10) : itos(0x10FFFF, 10));
  $(`#detail-next-cp`).attr(`data-cp`, codepoint != 0x10FFFF ? itos(codepoint + 1, 10) : itos(0, 10));
  
  jQueryModal(`#codepoint-detail`, `show`);
}

// called from button in modal dialog to navigate to a different codepoint
function changeDetail(elem: HTMLElement) {
  $(elem).blur(); // remove focus
  const codepointToShow = parseInt($(elem).attr(`data-cp`), 10);
  showCodepageDetail(codepointToShow);
}
