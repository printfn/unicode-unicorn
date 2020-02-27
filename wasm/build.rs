use proc_macro2::TokenStream;
use quote::quote;
use std::env;
use std::fs::File;
use std::io::{prelude::*, BufReader, BufWriter};
use std::path::Path;

fn get_data_file(path_fragment: &str) -> BufReader<File> {
    println!("cargo:rerun-if-changed=../data/{}", path_fragment);

    let path = Path::new("../data").join(path_fragment);

    BufReader::new(File::open(path).expect("Something went wrong reading the file"))
}

fn ivd_sequences() -> TokenStream {
    let ivd_seqs_file = get_data_file("Unicode/IVD/IVD_Sequences.txt");

    let lines: Vec<_> = ivd_seqs_file
        .lines()
        .map(Result::unwrap)
        .filter(|line| line.len() > 0 && !line.starts_with('#'))
        .collect();
    let array_size = lines.len();

    let structs: TokenStream = lines
        .iter()
        .map(|line| {
            let parts: Vec<_> = line.split(';').map(|s| s.trim()).collect();
            let codepoint_parts: Vec<_> = parts[0].split(' ').collect();
            let base_codepoint = u32::from_str_radix(codepoint_parts[0].trim(), 16).unwrap();
            let variation_selector = u32::from_str_radix(codepoint_parts[1].trim(), 16).unwrap();
            let collection = parts[1].trim();
            let item = parts[2].trim();

            quote! {
                IdeographicVariationSequence {
                    base_codepoint: #base_codepoint,
                    variation_selector: #variation_selector,
                    collection: #collection,
                    item: #item
                },
            }
        })
        .collect();

    quote! {
        const IVD_SEQUENCES: [IdeographicVariationSequence; #array_size] = [
            #structs
        ];
    }
}

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("compiled-data.rs");

    write!(
        BufWriter::new(File::create(dest_path).unwrap()),
        "{}",
        ivd_sequences()
    )
    .unwrap();
}
