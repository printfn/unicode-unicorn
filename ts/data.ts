function getCharacterCategoryCode(codepoint: number): string {
  let categoryCode = global_category[codepoint];
  if (!categoryCode) {
    for (let i = 0; i < global_categoryRanges.length; ++i) {
      const range = global_categoryRanges[i];
      if (
        codepoint >= range.startCodepoint &&
        codepoint <= range.endCodepoint
      ) {
        categoryCode = range.categoryCode;
        break;
      }
    }
  }
  return categoryCode || "Cn"; // Cn = unassigned
}

function getCharacterCategoryName(codepoint: number): string {
  const categoryCode = getCharacterCategoryCode(codepoint);
  return global_generalCategoryNames[categoryCode] || `Unknown`;
}

function getCodepointDescription(
  codepoint: number | string,
  name: string
): string {
  if (typeof codepoint == `string`) {
    codepoint = parseInt(codepoint);
  }
  return `${name} ${ctos([codepoint])}`;
}

function decompomposeHangulSyllable(codepoint: number): number[] {
  const syllableType = getSyllableTypeForCodepoint(codepoint);
  if (syllableType == `Not_Applicable`) return [codepoint];

  // see Unicode Standard, section 3.12 "Conjoining Jamo Behavior", "Hangul Syllable Decomposition"
  const SBase = 0xac00;
  const LBase = 0x1100;
  const VBase = 0x1161;
  const TBase = 0x11a7;
  const LCount = 19;
  const VCount = 21;
  const TCount = 28;
  const NCount = VCount * TCount; // 588
  const SCount = LCount * NCount; // 11172

  const SIndex = codepoint - SBase;

  const LIndex = Math.floor(SIndex / NCount);
  const VIndex = Math.floor((SIndex % NCount) / TCount);
  const TIndex = SIndex % TCount;

  const LPart = LBase + LIndex;
  const VPart = VBase + VIndex;
  if (TIndex > 0) {
    return [LPart, VPart, TBase + TIndex];
  } else {
    return [LPart, VPart];
  }
}

function getName(codepoint: number, search: boolean = false): string {
  let d = global_data[codepoint];
  if (d) {
    if (d[0] != `<`) return d;
    else return ``;
  }
  if (0xac00 <= codepoint && codepoint <= 0xd7af) {
    const decomposedSyllables = decompomposeHangulSyllable(codepoint);
    const shortJamoNames: string[] = [];
    for (let i = 0; i < decomposedSyllables.length; ++i)
      shortJamoNames.push(getShortJamoName(decomposedSyllables[i]));
    return `HANGUL SYLLABLE ${shortJamoNames.join(``)}`;
  }
  if (
    (0x3400 <= codepoint && codepoint <= 0x4dbf) ||
    (0x4e00 <= codepoint && codepoint <= 0x9fff)
  ) {
    if (search) return `CJK UNIFIED IDEOGRAPH`;
    return `CJK UNIFIED IDEOGRAPH-${itos(codepoint, 16, 4)}`;
  }
  for (let i = 0; i < global_ranges.length; ++i) {
    const range = global_ranges[i];
    if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint) {
      if (range.rangeName.startsWith(`CJK Ideograph`)) {
        if (search) return `CJK UNIFIED IDEOGRAPH`;
        return `CJK UNIFIED IDEOGRAPH-${itos(codepoint, 16, 4)}`;
      }
    }
  }
  return ``;
}

function getHtmlNameDescription(codepoint: number): string {
  if (getName(codepoint) !== ``) return getName(codepoint);
  if (global_data[codepoint] == `<control>`) {
    const name: string[] = [];
    for (let i = 0; i < global_aliases.length; ++i) {
      if (global_aliases[i].codepoint == codepoint) {
        if (global_aliases[i].type != `control` && name.length > 0) break;
        name.push(global_aliases[i].alias);
        if (global_aliases[i].type != `control`) break;
      }
    }
    if (name.length > 0) return `<i>${name.join(` / `)}</i>`;
  }
  return `<i>Unknown-${itos(codepoint, 16, 4)}</i>`;
}

function getUnicodeDataTxtNameField(codepoint: number): string {
  if (global_data[codepoint]) return global_data[codepoint];
  for (let i = 0; i < global_ranges.length; ++i) {
    const range = global_ranges[i];
    if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint)
      return range.rangeName;
  }
  return `Unknown`;
}
