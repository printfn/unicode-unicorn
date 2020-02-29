function getElementById(id: string) {
    let element = document.getElementById(id);
    if (!element) {
        throw `Unable to find element #${id}`;
    }
    return element;
}

function selectedOption(selectId: string) {
    let elem = getElementById(selectId) as HTMLSelectElement;
    let options = elem.selectedOptions;
    if (options.length != 1) throw 'The number of selected options is not 1';
    return options[0];
}

function tryFillElement(id: string, value: string) {
    let element = getElementById(id);
    if (value) {
        element.style.display = '';
        let contentElement = getElementById(`${id}-content`);
        contentElement.textContent = value;
    } else {
        element.style.display = 'none';
    }
}

function showCodepageDetail(codepoint: number) {
    getElementById('detail-codepoint-hex').textContent = itos(codepoint, 16, 4);
    getElementById(
        'detail-codepoint-decimal'
    ).textContent = codepoint.toString();
    getElementById('detail-name').innerHTML = `"${getName(codepoint)}"`;
    getElementById('detail-character').innerHTML = displayCodepoint(codepoint);
    getElementById('detail-character-raw').textContent = ctos([codepoint]);
    (getElementById(
        'detail-character-textbox'
    ) as HTMLInputElement).value = ctos([codepoint]);
    getElementById('detail-category').textContent = `${getCharacterCategoryCode(
        codepoint
    )} (${getCharacterCategoryName(codepoint)})`;
    getElementById('detail-block').textContent = getBlockForCodepoint(
        codepoint
    ).replace(/_/g, ` `);
    getElementById('detail-script').textContent = getScriptForCodepoint(
        codepoint
    ).replace(/_/g, ` `);
    const matchingAliases: string[] = [];
    for (let i = 0; i < global_aliases.length; ++i) {
        if (global_aliases[i].codepoint == codepoint)
            matchingAliases.push(global_aliases[i].alias);
    }
    tryFillElement('detail-aliases', matchingAliases.join(', '));
    tryFillElement('detail-meaning', global_han_meanings[codepoint]);
    tryFillElement('detail-mandarin', global_mandarin_readings[codepoint]);
    tryFillElement('detail-kun', global_kun_readings[codepoint]);
    tryFillElement('detail-on', global_on_readings[codepoint]);
    const variationSequences = variationSequencesForCodepoint(codepoint).concat(
        ideographicVariationSequencesForCodepoint(codepoint)
    );
    if (variationSequences.length === 0) {
        getElementById('detail-variation-sequences').style.display = 'none';
    } else {
        getElementById('detail-variation-sequences').style.display = '';
        let variationsString = ``;
        for (let i = 0; i < variationSequences.length; ++i) {
            let vs = variationSequences[i];
            if (variationsString !== ``) variationsString += `<br>`;
            if (!vs.shapingEnvironments) vs.shapingEnvironments = [];
            variationsString += `U+${itos(vs.baseCodepoint, 16, 4)} U+${itos(
                vs.variationSelector,
                16,
                4
            )}: ${escapeHtml(
                ctos([vs.baseCodepoint, vs.variationSelector])
            )} <i>${vs.description}`;
            if (vs.shapingEnvironments.length > 0) {
                variationsString += ` (${vs.shapingEnvironments.join(
                    `, `
                )})</i>`;
            } else {
                variationsString += `</i>`;
            }
        }
        getElementById(
            'detail-variation-sequences-content'
        ).innerHTML = variationsString;
    }

    let encodingsString = ``;
    for (let elem of Array.from(
        (getElementById('outputEncoding') as HTMLSelectElement).options
    )) {
        let encoding = elem.textContent;
        if (!encoding) {
            throw 'Unable to get encoding (via textContent) from element';
        }
        const html = encodeOutput(
            selectedOption('byteOrderMark').textContent!,
            encoding,
            selectedOption('outputFormat').textContent!,
            [codepoint]
        );
        if (html.startsWith(`<span`)) {
            continue;
        }
        encodingsString += `${encoding}: ${html}\n`;
    }

    getElementById('detail-encoding-outputs').innerHTML = encodingsString;

    getElementById('detail-previous-cp').setAttribute(
        'data-cp',
        itos(previousCodepoint(codepoint), 10)
    );
    getElementById('detail-next-cp').setAttribute(
        'data-cp',
        itos(nextCodepoint(codepoint), 10)
    );

    jQueryModal(`#codepoint-detail`, `show`);
}

// called from button in modal dialog to navigate to a different codepoint
function changeDetail(elem: HTMLElement) {
    elem.blur(); // remove focus
    const attr = elem.getAttribute('data-cp');
    if (!attr) {
        throw "Unable to find 'data-cp' attribute to find codepoint to jump to";
    }
    const codepointToShow = parseInt(attr, 10);
    showCodepageDetail(codepointToShow);
}
