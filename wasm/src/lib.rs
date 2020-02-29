include!(concat!(env!("OUT_DIR"), "/compiled-data.rs"));

mod utils;

use crate::utils::set_panic_hook;
#[macro_use]
extern crate lazy_static;
use serde::Serialize;
use std::collections::HashMap;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, unicode-rustwasm!");
}

#[wasm_bindgen]
pub fn init() {
    set_panic_hook();
}

#[wasm_bindgen]
pub fn next_codepoint(codepoint: u32) -> u32 {
    if codepoint != 0x10FFFF {
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
        0x10FFFF
    }
}

#[derive(Copy, Clone, Serialize)]
struct IdeographicVariationSequence {
    base_codepoint: u32,      // base codepoint
    variation_selector: u32,  // variation selector
    collection: &'static str, // collection
    item: &'static str,       // item, i.e. index into collection
}

#[wasm_bindgen]
pub fn variation_sequences_for_codepoint(codepoint: u32) -> String {
    let mut result = Vec::<IdeographicVariationSequence>::new();
    for ivd in IVD_SEQUENCES.iter() {
        if ivd.base_codepoint == codepoint {
            result.push(ivd.clone());
        }
    }
    serde_json::to_string(&result).unwrap()
}

#[wasm_bindgen]
pub fn u8toc(utf8_bytes: Vec<u8>) -> Option<Vec<u32>> {
    match std::str::from_utf8(utf8_bytes.as_slice()) {
        Err(_) => None,
        Ok(s) => Some(s.chars().map(|ch| u32::from(ch)).collect()),
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
    let encoding = match ENCODING_TABLES.get(encoding_name) {
        Some(encoding) => encoding,
        None => {
            return EncodingResult {
                success: false,
                encoded_code_units: None,
                first_invalid_codepoint: None,
            }
        }
    };
    let code_units: Result<Vec<_>, _> = codepoints
        .iter()
        .map(|codepoint| {
            encoding
                .get(codepoint)
                .ok_or(codepoint)
                .map(|code_unit| *code_unit)
        })
        .collect();
    match code_units {
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
        Err(&codepoint) => EncodingResult {
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
    let table = ENCODING_TABLES.get(encoding_name)?;
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
    return Some(res);
}

#[wasm_bindgen]
pub fn long_category_name_for_short_name(short_name: &str) -> Option<String> {
    use std::str::FromStr;
    use unicode_rs::general_category::GeneralCategory;

    Some(
        GeneralCategory::from_str(short_name)
            .ok()?
            .long_name()
            .to_string(),
    )
}

#[wasm_bindgen]
pub fn basic_type_for_codepoint(
    short_general_category_name: &str,
    codepoint: u32,
) -> Option<String> {
    use std::str::FromStr;
    use unicode_rs::general_category::GeneralCategory;

    Some(
        GeneralCategory::from_str(short_general_category_name)
            .ok()?
            .codepoint_type(codepoint)
            .to_string(),
    )
}
