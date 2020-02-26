use std::env;
use std::ffi::OsString;
use std::fs;
use std::path::Path;

fn ivd_sequences(data_dir: &OsString) -> String {
    let ivd_seqs_path = Path::new(&data_dir)
        .join("Unicode")
        .join("IVD")
        .join("IVD_Sequences.txt");
    let ivd_seqs_file_contents =
        fs::read_to_string(ivd_seqs_path).expect("Something went wrong reading the file");
    let mut result = String::new();
    result.push_str("const IVD_SEQUENCES: [IdeographicVariationSequence; 39169] = [");
    for line in ivd_seqs_file_contents.split('\n') {
        if line.len() == 0 || line.chars().nth(0) == Some('#') {
            continue;
        }
        let parts: Vec<_> = line.split(';').map(|s| s.trim()).collect();
        let codepoint_parts: Vec<_> = parts[0].split(' ').collect();
        let base_codepoint = codepoint_parts[0].trim();
        let variation_selector = codepoint_parts[1].trim();
        let collection = parts[1].trim();
        let item = parts[2].trim();
        result.push_str(
            format!(
                r#"IdeographicVariationSequence {{
                base_codepoint: 0x{},
                variation_selector: 0x{},
                collection: "{}",
                item: "{}",
            }},"#,
                base_codepoint, variation_selector, collection, item
            )
            .as_str(),
        );
    }
    result.push_str("];");
    result
}

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("compiled-data.rs");
    let data_dir = env::var_os("DATA_DIR").unwrap();
    fs::write(&dest_path, ivd_sequences(&data_dir)).unwrap();
    println!("cargo:rerun-if-changed=build.rs");
}
