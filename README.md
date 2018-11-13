# Unicode Unicorn

Click [here](https://unicode.website/) for a live demo of Unicode Unicorn.

## Building

The `src` folder contains the main source code for this project.

`data` contains various data files that are used during compilation. See below for sources and how to update them.

`build` contains intermediate files used during compilation.

`docs` is the final static page output.

Execute `$ npm run build` to automatically perform the following tasks:

1. Delete any preexisting directories `build` and `docs`.
2. Run `src/compile-unicode-data.js`, which generates `build/compiled-data.ts` from all files inside `data`.
3. Run `tsc`, which compiles all `.ts` files in `src`, creating equivalent `.js` files in `build`.
4. Copy important library `.js` files from `node_modules` into `build`.
5. Merge `*.js` files in `build`, except `compile-unicode-data.js`, into `combined.js`.
6. Copy HTML, CSS and JS to `docs`, which then contains the complete static website.

Execute `$ npm run server` to start a Python webserver from `docs/`.

## Sources

This tool uses the Unicode Character Database. It can be downloaded from `http://www.unicode.org/Public/UCD/latest/ucd/`. Move all text files into `UCD/`, extract `Unihan.zip` and move the `Unihan` folder contents into `Unihan/`.

Codepage mapping files are from `ftp://ftp.unicode.org/Public/MAPPINGS/`. Move the appropriate text files into `Mappings/`, and check the references in `Mappings/mappings.txt`.

Download the latest production (i.e. compressed) jQuery from `https://jquery.com/download` into `libs/`, and check the reference at the top of `unicode.html`.

Download the latest bootstrap from `https://getbootstrap.com/getting-started/` and extract the zip file. Rename the folder to `bootstrap` and place it in `libs/`.

Download `randomColor.js` from `https://github.com/davidmerfield/randomColor` and place it in `libs/`.

Download `punycode.js` from `https://github.com/bestiejs/punycode.js` and place it in `libs/`.

Download `he.js` from `https://github.com/mathiasbynens/he` and place it in `libs/`.

Download `utf8.js` from `https://github.com/mathiasbynens/utf8.js` and place it in `libs/`.

Download `language-subtag-registry` from IANA (`https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry`) and place it in the repo directory.

Download `emoji-data.txt` from `https://unicode.org/Public/emoji/latest/emoji-data.txt` and place it in `data/Unicode/`.