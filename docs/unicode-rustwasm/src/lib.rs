include!(concat!(env!("OUT_DIR"), "/compiled-data.rs"));

mod utils;

use crate::utils::set_panic_hook;
use serde::Serialize;
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
