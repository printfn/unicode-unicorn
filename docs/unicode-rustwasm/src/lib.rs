mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, unicode-rustwasm!");
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
