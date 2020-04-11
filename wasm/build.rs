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
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
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
        pub(crate) const IVD_SEQUENCES: [IdeographicVariationSequence; #array_size] = [
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
        .map(|line| line.split('#').next().unwrap().to_string())
        .filter(|line| !line.is_empty())
        // weird format found in CP857 (and others)
        .filter(|line| line != "\x1a")
        .collect();

    let mappings: TokenStream = lines
        .iter()
        .map(|line| line.split('\t').collect::<Vec<_>>())
        .filter(|components| !components[1].trim().is_empty())
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
        build_encoding_table("ASCII", "ascii.txt"),
        build_encoding_table(
            "ASCII with typographical quotes",
            "Unicode/Mappings/VENDORS/MISC/US-ASCII-QUOTES.TXT",
        ),
        build_encoding_table(
            "ISO-8859-1 (Latin-1 Western European)",
            "Unicode/Mappings/ISO8859/8859-1.TXT",
        ),
        build_encoding_table(
            "ISO-8859-2 (Latin-2 Central European)",
            "Unicode/Mappings/ISO8859/8859-2.TXT",
        ),
        build_encoding_table(
            "ISO-8859-3 (Latin-3 South European)",
            "Unicode/Mappings/ISO8859/8859-3.TXT",
        ),
        build_encoding_table(
            "ISO-8859-4 (Latin-4 North European)",
            "Unicode/Mappings/ISO8859/8859-4.TXT",
        ),
        build_encoding_table(
            "ISO-8859-5 (Latin/Cyrillic)",
            "Unicode/Mappings/ISO8859/8859-5.TXT",
        ),
        build_encoding_table(
            "ISO-8859-6 (Latin/Arabic)",
            "Unicode/Mappings/ISO8859/8859-6.TXT",
        ),
        build_encoding_table(
            "ISO-8859-7 (Latin/Greek)",
            "Unicode/Mappings/ISO8859/8859-7.TXT",
        ),
        build_encoding_table(
            "ISO-8859-8 (Latin/Hebrew)",
            "Unicode/Mappings/ISO8859/8859-8.TXT",
        ),
        build_encoding_table(
            "ISO-8859-9 (Latin-5 Turkish)",
            "Unicode/Mappings/ISO8859/8859-9.TXT",
        ),
        build_encoding_table(
            "ISO-8859-10 (Latin-6 Nordic)",
            "Unicode/Mappings/ISO8859/8859-10.TXT",
        ),
        build_encoding_table(
            "ISO-8859-11 (Latin/Thai)",
            "Unicode/Mappings/ISO8859/8859-11.TXT",
        ),
        build_encoding_table(
            "ISO-8859-13 (Latin-7 Baltic Rim)",
            "Unicode/Mappings/ISO8859/8859-13.TXT",
        ),
        build_encoding_table(
            "ISO-8859-14 (Latin-8 Celtic)",
            "Unicode/Mappings/ISO8859/8859-14.TXT",
        ),
        build_encoding_table(
            "ISO-8859-15 (Latin-9)",
            "Unicode/Mappings/ISO8859/8859-15.TXT",
        ),
        build_encoding_table(
            "ISO-8859-16 (Latin-10 South-Eastern European)",
            "Unicode/Mappings/ISO8859/8859-16.TXT",
        ),
        build_encoding_table(
            "Code page 437 (MS-DOS Latin US)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP437.TXT",
        ),
        build_encoding_table(
            "Code page 737 (MS-DOS Greek)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP737.TXT",
        ),
        build_encoding_table(
            "Code page 775 (MS-DOS Baltic Rim)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP775.TXT",
        ),
        build_encoding_table(
            "Code page 850 (MS-DOS Latin 1)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP850.TXT",
        ),
        build_encoding_table(
            "Code page 852 (MS-DOS Latin 2)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP852.TXT",
        ),
        build_encoding_table(
            "Code page 855 (MS-DOS Cyrillic)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP855.TXT",
        ),
        build_encoding_table(
            "Code page 857 (MS-DOS Turkish)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP857.TXT",
        ),
        build_encoding_table(
            "Code page 860 (MS-DOS Portuguese)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP860.TXT",
        ),
        build_encoding_table(
            "Code page 861 (MS-DOS Icelandic)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP861.TXT",
        ),
        build_encoding_table(
            "Code page 862 (MS-DOS Hebrew)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP862.TXT",
        ),
        build_encoding_table(
            "Code page 863 (MS-DOS French Canada)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP863.TXT",
        ),
        build_encoding_table(
            "Code page 864 (MS-DOS Arabic)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP864.TXT",
        ),
        build_encoding_table(
            "Code page 865 (MS-DOS Nordic)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP865.TXT",
        ),
        build_encoding_table(
            "Code page 866 (MS-DOS Cyrillic CIS 1)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP866.TXT",
        ),
        build_encoding_table(
            "Code page 869 (MS-DOS Greek 2)",
            "Unicode/Mappings/VENDORS/MICSFT/PC/CP869.TXT",
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
        build_encoding_table(
            "Code page 1250 (Windows Latin 2 (Central Europe))",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1250.TXT",
        ),
        build_encoding_table(
            "Code page 1251 (Windows Cyrillic (Slavic))",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1251.TXT",
        ),
        build_encoding_table(
            "Code page 1252 (Windows Latin 1 (ANSI))",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1252.TXT",
        ),
        build_encoding_table(
            "Code page 1253 (Windows Greek)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1253.TXT",
        ),
        build_encoding_table(
            "Code page 1254 (Windows Latin 5 (Turkish))",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1254.TXT",
        ),
        build_encoding_table(
            "Code page 1255 (Windows Hebrew)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1255.TXT",
        ),
        build_encoding_table(
            "Code page 1256 (Windows Arabic)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1256.TXT",
        ),
        build_encoding_table(
            "Code page 1257 (Windows Baltic Rim)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1257.TXT",
        ),
        build_encoding_table(
            "Code page 1258 (Windows Vietnamese)",
            "Unicode/Mappings/VENDORS/MICSFT/WINDOWS/CP1258.TXT",
        ),
        build_encoding_table(
            "Code page 10000 (Macintosh Roman)",
            "Unicode/Mappings/VENDORS/MICSFT/MAC/ROMAN.TXT",
        ),
        build_encoding_table(
            "Code page 10006 (Macintosh Greek)",
            "Unicode/Mappings/VENDORS/MICSFT/MAC/GREEK.TXT",
        ),
        build_encoding_table(
            "Code page 10007 (Macintosh Cyrillic)",
            "Unicode/Mappings/VENDORS/MICSFT/MAC/CYRILLIC.TXT",
        ),
        build_encoding_table(
            "Code page 10029 (Macintosh Latin 2)",
            "Unicode/Mappings/VENDORS/MICSFT/MAC/LATIN2.TXT",
        ),
        build_encoding_table(
            "Code page 10079 (Macintosh Iceland)",
            "Unicode/Mappings/VENDORS/MICSFT/MAC/ICELAND.TXT",
        ),
        build_encoding_table(
            "Code page 10081 (Macintosh Turkish)",
            "Unicode/Mappings/VENDORS/MICSFT/MAC/TURKISH.TXT",
        ),
        build_encoding_table(
            "Code page 37 (Microsoft EBCDIC)",
            "Unicode/Mappings/VENDORS/MICSFT/EBCDIC/CP037.TXT",
        ),
        build_encoding_table(
            "Code page 500 (Microsoft EBCDIC)",
            "Unicode/Mappings/VENDORS/MICSFT/EBCDIC/CP500.TXT",
        ),
        build_encoding_table(
            "Code page 875 (Microsoft EBCDIC)",
            "Unicode/Mappings/VENDORS/MICSFT/EBCDIC/CP875.TXT",
        ),
        build_encoding_table(
            "Code page 1026 (Microsoft EBCDIC)",
            "Unicode/Mappings/VENDORS/MICSFT/EBCDIC/CP1026.TXT",
        ),
    ]
    .iter()
    .cloned()
    .collect();

    quote! {
        lazy_static! {
            pub(crate) static ref ENCODING_TABLES: HashMap<&'static str, EncodingTable> = {
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
