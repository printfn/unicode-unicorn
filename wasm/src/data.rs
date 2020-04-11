#![allow(clippy::all)]

use crate::EncodingTable;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Copy, Clone, Serialize)]
pub(crate) struct IdeographicVariationSequence {
    pub(crate) base_codepoint: u32,      // base codepoint
    pub(crate) variation_selector: u32,  // variation selector
    pub(crate) collection: &'static str, // collection
    pub(crate) item: &'static str,       // item, i.e. index into collection
}

include!(concat!(env!("OUT_DIR"), "/compiled-data.rs"));
