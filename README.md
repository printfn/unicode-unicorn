## Unicode Unicorn - Online Unicode IDE

Click [here](https://unicode.website/) for a live demo of Unicode Unicorn.

### Building

`data` contains various data files that are used during compilation. See below for sources and how to update them.

Run `./build.sh` to build the project.

### Sources

This tool uses the Unicode Character Database. It can be downloaded from `http://www.unicode.org/Public/UCD/latest/ucd/`. Move all text files into `data/Unicode/UCD/`, extract `Unihan.zip` and move the `Unihan` folder contents into `data/Unicode/Unihan/`.

Codepage mapping files are from `ftp://ftp.unicode.org/Public/MAPPINGS/`. Move the appropriate text files into `data/Unicode/Mappings/`, and check the references in `Mappings/mappings.txt`.

Download `language-subtag-registry` from IANA (`https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry`) and place it into `data/`.

Download `emoji-data.txt` from `https://unicode.org/Public/emoji/latest/emoji-data.txt` and place it in `data/Unicode/`.

Download the ideographic variation database from `https://unicode.org/ivd/` and place `IVD_Collections.txt` and `IVD_Sequences.txt` in `data/Unicode/IVD/`.
