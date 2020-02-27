function updateMojibake() {
  const codepoints = getStr();
  const mojibakeOutputs: { encoding1Name: string, encoding2Name: string, text: string }[] = [];
  const mojibakeEncodings = Array.from((getElementById('mojibakeEncodings') as HTMLSelectElement).options);
  for (const i in mojibakeEncodings) {
    const e = mojibakeEncodings[i];
    if (!e.selected)
      continue;
    const encoding1Name = e.textContent!;
    if (global_encodings[encoding1Name].type == `text function`)
      continue;
    const encodedString = encodeOutput(
      `Don't use a byte order mark`,
      encoding1Name,
      `Decimal`,
      codepoints);
    if (encodedString.startsWith(`<`))
      continue;
    for (const j in mojibakeEncodings) {
      const f = mojibakeEncodings[i];
      if (i == j)
        continue;
      if (!f.selected)
        continue;
      const encoding2Name = f.textContent!;
      if (global_encodings[encoding2Name].type == `text function`)
        continue;
      const decodedString = decodeOutput(
        `Don't use a byte order mark`,
        encoding2Name,
        `Decimal`,
        encodedString);
      if (!decodedString)
        continue;
      mojibakeOutputs.push({
        encoding1Name: encoding1Name,
        encoding2Name: encoding2Name,
        text: ctos(decodedString)
      });
    };
  };
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
  getElementById('mojibakeOutput').innerHTML = mojibakeOutputStr;
}
