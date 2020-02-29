function initLanguageData() {
    const showAllLanguages = $(`#showRareLanguages`)[0].hasAttribute(
        `disabled`
    );
    const htmls = showAllLanguages
        ? global_allLanguageTagsHTML
        : global_commonLanguageTagsHTML;
    updateSelectOptions(`languageList`, htmls[`language`]);
    updateSelectOptions(`scriptList`, htmls[`script`]);
    updateSelectOptions(`regionList`, htmls[`region`]);
    updateSelectOptions(`variantList`, htmls[`variant`]);
    $(`#showRareLanguages`).on(`click`, function() {
        $(`#showRareLanguages`).attr(`disabled`, `disabled`);
        initLanguageData();
    });
}
