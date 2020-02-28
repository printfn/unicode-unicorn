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

fn build_encoding_table(name: &str, data_file: &str) -> TokenStream {
    let encoding_table_file = get_data_file(data_file);

    let lines: Vec<_> = encoding_table_file
        .lines()
        .map(Result::unwrap)
        // remove text after first '#'
        .map(|line| line.split('#').nth(0).unwrap().to_string())
        .filter(|line| line.len() > 0)
        // weird format found in CP857 (and others)
        .filter(|line| !(line.len() == 1 && line.chars().nth(0).unwrap() == '\x1a'))
        .collect();

    let mappings: TokenStream = lines
        .iter()
        .map(|line| line.split('\t').collect::<Vec<_>>())
        .filter(|components| components[1].trim().len() != 0)
        .map(|components| {
            let coded_byte = u32::from_str_radix(&components[0][2..], 16).unwrap();
            let codepoint = u32::from_str_radix(&components[1][2..], 16).unwrap();

            quote! {
                (#codepoint, #coded_byte),
            }
        })
        .collect();

    quote! {
        encoding_table.insert(#name, [#mappings].iter().cloned().collect());
    }
}

fn build_encodings() -> TokenStream {
    let tables: TokenStream = [
        build_encoding_table(
            "ASCII with typographical quotes",
            "Unicode/Mappings/VENDORS/MISC/US-ASCII-QUOTES.TXT",
        ),
        build_encoding_table(
            "Code page 874 (Thai)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP874.TXT",
        ),
        build_encoding_table(
            "Code page 932 (Japanese; Shift-JIS extension)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP932.TXT",
        ),
        build_encoding_table(
            "Code page 936 (Simplified Chinese)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP936.TXT",
        ),
        build_encoding_table(
            "Code page 949 (Korean)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP949.TXT",
        ),
        build_encoding_table(
            "Code page 950 (Traditional Chinese)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP950.TXT",
        ),
    ]
    .iter()
    .cloned()
    .collect();

    quote! {
        lazy_static! {
            static ref ENCODING_TABLES: HashMap<&'static str, EncodingTable> = {
                let mut encoding_table = HashMap::new();
                #tables
                encoding_table
            };
        }
    }
}

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("compiled-data.rs");

    write!(
        BufWriter::new(File::create(dest_path).unwrap()),
        "{}{}",
        ivd_sequences(),
        build_encodings()
    )
    .unwrap();
}
