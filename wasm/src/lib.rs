mod data;
mod utf_encodings;
mod utils;

use data::IdeographicVariationSequence;

use crate::utils::set_panic_hook;
#[macro_use]
extern crate lazy_static;
use serde::Serialize;
use std::collections::HashMap;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;

fn is_surrogate(cp: u32) -> bool {
    (0xd800..=0xdfff).contains(&cp)
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    set_panic_hook();
}

#[wasm_bindgen]
pub fn next_codepoint(codepoint: u32) -> u32 {
    if codepoint != 0x10_ffff {
        codepoint + 1
    } else {
        0
    }
}

#[wasm_bindgen]
pub fn previous_codepoint(codepoint: u32) -> u32 {
    if codepoint != 0 {
        codepoint - 1
    } else {
        0x10_ffff
    }
}

#[wasm_bindgen]
pub fn variation_sequences_for_codepoint(codepoint: u32) -> String {
    let mut result = Vec::<IdeographicVariationSequence>::new();
    for ivd in data::IVD_SEQUENCES.iter() {
        if ivd.base_codepoint == codepoint {
            result.push(*ivd);
        }
    }
    serde_json::to_string(&result).unwrap()
}

#[wasm_bindgen]
pub fn u8toc(utf8_bytes: Vec<u8>) -> Option<Vec<u32>> {
    match std::str::from_utf8(utf8_bytes.as_slice()) {
        Err(_) => None,
        Ok(s) => Some(s.chars().map(u32::from).collect()),
    }
}

#[wasm_bindgen]
pub fn ctou8(codepoints: Vec<u32>) -> Option<Vec<u8>> {
    Some(ctos(codepoints)?.bytes().collect())
}

#[wasm_bindgen]
pub fn ctos(codepoints: Vec<u32>) -> Option<String> {
    let maybe_a_string = codepoints
        .iter()
        .map(|num| char::try_from(*num))
        .collect::<Result<String, _>>();
    match maybe_a_string {
        Err(_) => None,
        Ok(s) => Some(s),
    }
}

#[wasm_bindgen]
pub fn stoc(str: &str) -> Vec<u32> {
    str.chars().map(|ch| ch as u32).collect()
}

#[derive(Clone, Serialize)]
pub struct EncodingResult {
    pub success: bool,
    pub encoded_code_units: Option<Vec<u32>>,
    pub first_invalid_codepoint: Option<u32>,
}

// map codepoints -> code units
pub type EncodingTable = HashMap<u32, u32>;

// lazy_static! {
//     static ref ENCODING_TABLES: HashMap<&'static str, EncodingTable> = {
//         let mut encoding_table = HashMap::new();
//         encoding_table.insert("ASCII", [(0, 0), (1, 1)]);
//         encoding_table
//     };
// }

fn encode_str_internal(encoding_name: &str, codepoints: Vec<u32>) -> EncodingResult {
    let code_units: Result<Vec<u32>, u32> = match encoding_name {
        "Unicode UTF-8" => codepoints
            .iter()
            .map(|&cp| char::try_from(cp).map_err(|_| cp).map(|c| c as u32))
            .collect::<Result<Vec<u32>, u32>>()
            .and_then(|cp| {
                ctou8(cp)
                    .ok_or(0u32)
                    .map(|v| v.iter().map(|&cu| cu as u32).collect())
            }),
        "Unicode UTF-32 (32-bit code units)" => codepoints
            .iter()
            .map(|&cp| {
                if is_surrogate(cp) || cp > 0x10_ffff {
                    Err(cp)
                } else {
                    Ok(cp)
                }
            })
            .collect(),
        "UCS-2 (16-bit code units)" => utf_encodings::encode_ucs2_16bit(codepoints.iter()),
        "UCS-2 BE (8-bit code units)" => utf_encodings::encode_ucs2_8bit_be(codepoints.iter()),
        "UCS-2 LE (8-bit code units)" => utf_encodings::encode_ucs2_8bit_le(codepoints.iter()),
        "Unicode UTF-16 (16-bit code units)" => {
            utf_encodings::encode_utf16_16bit(codepoints.iter())
        }
        "Unicode UTF-16 BE (8-bit code units)" => {
            utf_encodings::encode_utf16_8bit_be(codepoints.iter())
        }
        "Unicode UTF-16 LE (8-bit code units)" => {
            utf_encodings::encode_utf16_8bit_le(codepoints.iter())
        }
        "Unicode UTF-32 BE (8-bit code units)" | "Unicode UTF-32 LE (8-bit code units)" => {
            codepoints
                .iter()
                .map(|&cp| {
                    if is_surrogate(cp) || cp > 0x10_ffff {
                        Err(cp)
                    } else {
                        Ok(cp)
                    }
                })
                .collect::<Result<Vec<u32>, u32>>()
                .map(|v| {
                    v.into_iter()
                        .flat_map(|cp| {
                            (if encoding_name == "Unicode UTF-32 BE (8-bit code units)" {
                                cp.to_be_bytes()
                            } else {
                                cp.to_le_bytes()
                            })
                            .iter()
                            .copied()
                            .map(|u| u as u32)
                            .collect::<Vec<_>>()
                        })
                        .collect()
                })
        }
        _ => {
            let encoding = match data::ENCODING_TABLES.get(encoding_name) {
                Some(encoding) => encoding,
                None => {
                    return EncodingResult {
                        success: false,
                        encoded_code_units: None,
                        first_invalid_codepoint: None,
                    };
                }
            };
            let code_units: Result<Vec<u32>, u32> = codepoints
                .iter()
                .map(|&codepoint| {
                    encoding
                        .get(&codepoint)
                        .ok_or(codepoint)
                        .map(|code_unit| *code_unit)
                })
                .collect();
            return match code_units {
                Ok(code_units) => EncodingResult {
                    success: true,
                    encoded_code_units: Some(
                        code_units
                            .iter()
                            .copied()
                            .flat_map(|cu| {
                                if cu <= 0xff {
                                    vec![cu]
                                } else {
                                    vec![cu >> 8, cu & 0xff]
                                }
                            })
                            .collect(),
                    ),
                    first_invalid_codepoint: None,
                },
                Err(codepoint) => EncodingResult {
                    success: false,
                    encoded_code_units: None,
                    first_invalid_codepoint: Some(codepoint),
                },
            };
        }
    };
    match code_units {
        Ok(code_units) => EncodingResult {
            success: true,
            encoded_code_units: Some(code_units),
            first_invalid_codepoint: None,
        },
        Err(codepoint) => EncodingResult {
            success: false,
            encoded_code_units: None,
            first_invalid_codepoint: Some(codepoint),
        },
    }
}

#[wasm_bindgen]
pub fn encode_str(encoding_name: &str, codepoints: Vec<u32>) -> String {
    let result = encode_str_internal(encoding_name, codepoints);
    serde_json::to_string(&result).unwrap()
}

fn lookup_code_unit(table: &EncodingTable, code_unit: u32) -> Option<u32> {
    for (&k, &v) in table {
        if v == code_unit {
            return Some(k);
        }
    }
    None
}

#[wasm_bindgen]
pub fn decode_str(encoding_name: &str, code_units: Vec<u32>) -> Option<Vec<u32>> {
    if encoding_name == "Unicode UTF-8" {
        return u8toc(
            code_units
                .iter()
                .map(|&u| if u <= 0xff { Some(u as u8) } else { None })
                .collect::<Option<Vec<u8>>>()?,
        );
    } else if encoding_name == "Unicode UTF-32 (32-bit code units)" {
        return code_units
            .iter()
            .map(|&u| {
                if is_surrogate(u) || u > 0x10_ffff {
                    None
                } else {
                    Some(u)
                }
            })
            .collect::<Option<Vec<u32>>>();
    } else if encoding_name == "UCS-2 (16-bit code units)" {
        return utf_encodings::decode_ucs2_16bit(code_units);
    } else if encoding_name == "UCS-2 BE (8-bit code units)" {
        return utf_encodings::decode_ucs2_8bit_be(code_units);
    } else if encoding_name == "UCS-2 LE (8-bit code units)" {
        return utf_encodings::decode_ucs2_8bit_le(code_units);
    } else if encoding_name == "Unicode UTF-16 (16-bit code units)" {
        return utf_encodings::decode_utf16_16bit(code_units);
    } else if encoding_name == "Unicode UTF-16 BE (8-bit code units)" {
        return utf_encodings::decode_utf16_8bit_be(code_units);
    } else if encoding_name == "Unicode UTF-16 LE (8-bit code units)" {
        return utf_encodings::decode_utf16_8bit_le(code_units);
    } else if encoding_name == "Unicode UTF-32 BE (8-bit code units)"
        || encoding_name == "Unicode UTF-32 LE (8-bit code units)"
    {
        if code_units.len() % 4 != 0 {
            return None;
        }
        let mut v: Vec<u32> = vec![];
        for c in code_units.chunks(4) {
            for &code_unit in c {
                if code_unit > 0xff {
                    return None;
                }
            }
            let be_or_le_bytes = [c[0] as u8, c[1] as u8, c[2] as u8, c[3] as u8];
            let cp = if encoding_name == "Unicode UTF-32 BE (8-bit code units)" {
                u32::from_be_bytes(be_or_le_bytes)
            } else {
                u32::from_le_bytes(be_or_le_bytes)
            };
            if is_surrogate(cp) || cp > 0x10_ffff {
                return None;
            }
            v.push(cp);
        }
        return Some(v);
    }
    let table = data::ENCODING_TABLES.get(encoding_name)?;
    let mut res: Vec<u32> = vec![];
    let mut try_combined = false;
    for (i, cu) in code_units.iter().enumerate() {
        if try_combined {
            match lookup_code_unit(table, code_units[i - 1] << 8 | cu) {
                Some(cp) => {
                    res.push(cp);
                    try_combined = false;
                }
                None => return None,
            }
        } else {
            match lookup_code_unit(table, *cu) {
                Some(cp) => res.push(cp),
                None => try_combined = true,
            }
        }
    }
    Some(res)
}

#[wasm_bindgen]
pub fn long_category_name_for_short_name(short_name: &str) -> Option<String> {
    use icu::properties::GeneralCategory;
    let category = GeneralCategory::name_to_enum_mapper().get_strict(short_name)?;
    Some(
        GeneralCategory::enum_to_long_name_mapper()
            .get(category)?
            .to_string(),
    )
}

#[wasm_bindgen]
pub fn basic_type_for_codepoint(codepoint: u32) -> Option<String> {
    use icu::properties::{GeneralCategory, maps, sets};
    if sets::noncharacter_code_point().contains32(codepoint) {
        return Some("Noncharacter".to_string());
    }
    let category = maps::general_category().get32(codepoint);
    let ty = match category {
        GeneralCategory::Control => "Control",
        GeneralCategory::PrivateUse => "PrivateUse",
        GeneralCategory::Surrogate => "Surrogate",
        GeneralCategory::Format
        | GeneralCategory::LineSeparator
        | GeneralCategory::ParagraphSeparator => "Format",
        GeneralCategory::Unassigned => "Reserved",
        _ => "Graphic",
    };
    Some(ty.to_string())
}

#[cfg(test)]
mod test {
    #[test]
    fn category_name() {
        assert_eq!(
            crate::long_category_name_for_short_name("Lu").unwrap(),
            "Uppercase_Letter"
        );
        assert_eq!(
            crate::long_category_name_for_short_name("Sc").unwrap(),
            "Currency_Symbol"
        );
    }
}
