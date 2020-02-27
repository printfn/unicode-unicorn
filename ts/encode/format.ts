function numberForFormat(format: string) {
  switch (format) {
    case `Binary`:
      return 2;
    case `Octal`:
      return 8;
    case `Decimal`:
      return 10;
    case `Hexadecimal (uppercase)`:
      return 16;
    case `Hexadecimal (lowercase)`:
      return 16;
    default:
      throw `Invalid format: ${format}`;
  }
}

function numberToStringWithFormat(n: number, format: string) {
  let str = n.toString(numberForFormat(format));
  if (format == `Hexadecimal (uppercase)`) str = str.toUpperCase();
  return str;
}

function parseIntWithFormat(str: string, format: string) {
  return parseInt(str, numberForFormat(format));
}
