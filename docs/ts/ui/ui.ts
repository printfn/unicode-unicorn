function updateSelectOptions(selector: string, html: string) {
	$(selector).html(html);
	$(selector).trigger(`chosen:updated`);
}
