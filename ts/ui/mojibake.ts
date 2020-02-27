function updateMojibake() {
  const codepoints = getStr();
  const mojibakeOutputs: { encoding1Name: string, encoding2Name: string, text: string }[] = [];
  $(`#mojibakeEncodings option`).each(function(i: number, e: Element & { selected: boolean; }) {
    if (!e.selected)
      return;
    const encoding1Name = $(e).text();
    if (global_encodings[encoding1Name].type == `text function`)
      return;
    const encodedString = encodeOutput(
      `Don't use a byte order mark`,
      encoding1Name,
      `Decimal`,
      codepoints);
    if (encodedString.startsWith(`<`))
      return;
    $(`#mojibakeEncodings option`).each(function(j: number, f: Element & { selected: boolean; }) {
      if (i == j)
        return;
      if (!f.selected)
        return;
      const encoding2Name = $(f).text();
      if (global_encodings[encoding2Name].type == `text function`)
        return;
      const decodedString = decodeOutput(
        `Don't use a byte order mark`,
        encoding2Name,
        `Decimal`,
        encodedString);
      if (!decodedString)
        return;
      mojibakeOutputs.push({
        encoding1Name: encoding1Name,
        encoding2Name: encoding2Name,
        text: ctos(decodedString)
      });
    });
  });
  let mojibakeOutputStr = ``;
  let lastEncoding1 = ``;
  for (let i = 0; i < mojibakeOutputs.length; ++i) {
    const o = mojibakeOutputs[i];
    if (o.encoding1Name != lastEncoding1) {
      lastEncoding1 = o.encoding1Name;
      mojibakeOutputStr += `Assuming the input was erroneously interpreted as ${o.encoding1Name}:<br>`;
    }
    mojibakeOutputStr += `    If the original encoding was ${o.encoding2Name}:<br>        ${mojibakeOutputs[i].text}<br>`;
  }
  $(`#mojibakeOutput`).html(mojibakeOutputStr);
}
