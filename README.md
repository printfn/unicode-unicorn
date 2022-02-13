# 🦄 Unicode Unicorn - Web Unicode IDE

**[https://unicode.website](https://unicode.website/)**

## Build

`data` contains various data files that are used during compilation. See below for sources and how to update them.

To build execute:

```
wasm-pack build wasm
npm install
npm run build
```

This will create the built files in `dist`

To serve locally you can execute:

```
cd build
npx http-server
```

## Sources

Unicode Unicorn uses the Unicode Character Database. It can be downloaded from `http://www.unicode.org/Public/UCD/latest/ucd/`. Download `UCD.zip` and extract its contents to `data/Unicode/UCD/`. Then extract `Unihan.zip` and move the `Unihan` folder contents into `data/Unicode/Unihan/`.

Codepage mapping files are from `ftp://ftp.unicode.org/Public/MAPPINGS/`. Move the appropriate text files into `data/Unicode/Mappings/`, and check the references in `data/encodings.txt`.

Download `language-subtag-registry` from IANA (`https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry`) and place it into `data/`.

Download the ideographic variation database from `https://unicode.org/ivd/` and place `IVD_Collections.txt` and `IVD_Sequences.txt` in `data/Unicode/IVD/`.
