function updateEncodedAndDecodedStrings() {
  const codepoints = getStr();
  getElementById("encodedOutput").innerHTML = encodeOutput(
    selectedOption("byteOrderMark").textContent!,
    selectedOption("outputEncoding").textContent!,
    selectedOption("outputFormat").textContent!,
    codepoints
  );

  const decodedOutput = decodeOutput(
    selectedOption("byteOrderMark").textContent!,
    selectedOption("outputEncoding").textContent!,
    selectedOption("outputFormat").textContent!,
    (getElementById("encodedInput") as HTMLInputElement).value
  );
  if (decodedOutput)
    renderCodepointsInTable(decodedOutput, `decodedCodepoints`, [
      { displayName: `Insert`, functionName: `output`, require: () => true }
    ]);
}
