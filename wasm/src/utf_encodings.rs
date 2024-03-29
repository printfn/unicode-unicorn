use crate::is_surrogate;

enum Endianness {
    Big,
    Little,
}

pub fn encode_ucs2_16bit<'a>(codepoints: impl Iterator<Item = &'a u32>) -> Result<Vec<u32>, u32> {
    codepoints
        .map(|&cp| {
            if is_surrogate(cp) || cp > 0xffff {
                Err(cp)
            } else {
                Ok(cp)
            }
        })
        .collect()
}

pub fn encode_utf16_16bit<'a>(codepoints: impl Iterator<Item = &'a u32>) -> Result<Vec<u32>, u32> {
    Ok(codepoints
        .map(|&cp| {
            if is_surrogate(cp) || cp > 0x10_ffff {
                Err(cp)
            } else {
                Ok(cp)
            }
        })
        .collect::<Result<Vec<u32>, u32>>()?
        .into_iter()
        .flat_map(|ch| {
            if ch <= 0xffff {
                vec![ch]
            } else {
                let x = ch - 0x10000;
                vec![0xd800 | (x >> 10), 0xdc00 | (x & 0x3ff)]
            }
        })
        .collect())
}

fn encode_16bit_to_8bit(
    code_units: Result<Vec<u32>, u32>,
    endianness: Endianness,
) -> Result<Vec<u32>, u32> {
    let code_units_16bit = code_units?;
    let mut result = Vec::new();
    for code_unit in code_units_16bit {
        let bytes = match endianness {
            Endianness::Big => u16::to_be_bytes(code_unit as u16),
            Endianness::Little => u16::to_le_bytes(code_unit as u16),
        };
        result.push(bytes[0] as u32);
        result.push(bytes[1] as u32);
    }
    Ok(result)
}

pub fn encode_ucs2_8bit_be<'a>(codepoints: impl Iterator<Item = &'a u32>) -> Result<Vec<u32>, u32> {
    encode_16bit_to_8bit(encode_ucs2_16bit(codepoints), Endianness::Big)
}

pub fn encode_ucs2_8bit_le<'a>(codepoints: impl Iterator<Item = &'a u32>) -> Result<Vec<u32>, u32> {
    encode_16bit_to_8bit(encode_ucs2_16bit(codepoints), Endianness::Little)
}

pub fn encode_utf16_8bit_be<'a>(
    codepoints: impl Iterator<Item = &'a u32>,
) -> Result<Vec<u32>, u32> {
    encode_16bit_to_8bit(encode_utf16_16bit(codepoints), Endianness::Big)
}

pub fn encode_utf16_8bit_le<'a>(
    codepoints: impl Iterator<Item = &'a u32>,
) -> Result<Vec<u32>, u32> {
    encode_16bit_to_8bit(encode_utf16_16bit(codepoints), Endianness::Little)
}

pub fn decode_ucs2_16bit(code_units: Vec<u32>) -> Option<Vec<u32>> {
    code_units
        .iter()
        .map(|&u| {
            if is_surrogate(u) || u > 0xffff {
                None
            } else {
                Some(u)
            }
        })
        .collect()
}

pub fn decode_utf16_16bit(code_units: Vec<u32>) -> Option<Vec<u32>> {
    let string = String::from_utf16(
        code_units
            .iter()
            .map(|&u| {
                if is_surrogate(u) || u > 0xffff {
                    None
                } else {
                    Some(u as u16)
                }
            })
            .collect::<Option<Vec<u16>>>()?
            .as_slice(),
    )
    .ok()?;
    Some(string.chars().map(|c| c as u32).collect())
}

fn decode_8bit_to_16bit(code_units: Vec<u32>, endianness: Endianness) -> Option<Vec<u32>> {
    let mut result = Vec::new();
    for chunk in code_units.chunks(2) {
        if chunk.len() != 2 {
            return None;
        }
        for &ch in chunk {
            if ch > 0xff {
                return None;
            }
        }
        let res = match endianness {
            Endianness::Big => u16::from_be_bytes([chunk[0] as u8, chunk[1] as u8]),
            Endianness::Little => u16::from_le_bytes([chunk[0] as u8, chunk[1] as u8]),
        };
        result.push(res as u32);
    }
    Some(result)
}

pub fn decode_ucs2_8bit_be(code_units: Vec<u32>) -> Option<Vec<u32>> {
    decode_ucs2_16bit(decode_8bit_to_16bit(code_units, Endianness::Big)?)
}

pub fn decode_ucs2_8bit_le(code_units: Vec<u32>) -> Option<Vec<u32>> {
    decode_ucs2_16bit(decode_8bit_to_16bit(code_units, Endianness::Little)?)
}

pub fn decode_utf16_8bit_be(code_units: Vec<u32>) -> Option<Vec<u32>> {
    decode_utf16_16bit(decode_8bit_to_16bit(code_units, Endianness::Big)?)
}

pub fn decode_utf16_8bit_le(code_units: Vec<u32>) -> Option<Vec<u32>> {
    decode_utf16_16bit(decode_8bit_to_16bit(code_units, Endianness::Little)?)
}

#[cfg(test)]
mod tests {
    use crate::utf_encodings::encode_utf16_16bit;

    #[test]
    fn test_utf16_16bit() {
        assert_eq!(encode_utf16_16bit(vec![0x5915].iter()).unwrap().len(), 1);
    }
}
