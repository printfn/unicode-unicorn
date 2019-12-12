## Unicode Unicorn - Online Unicode IDE

Click [here](https://unicode.website/) for a live demo of Unicode Unicorn.

### Building

`data` contains various data files that are used during compilation. See below for sources and how to update them.

`docs` contains the code, and is used as the webserver's root directory.

`docs/build` contains compiled JavaScript and CSS files. It can be regenerated
with `$ npm run build`, which performs the following tasks:

1. Generate `docs/build/compiled-data.json` from various data files in `data`.
2. Run `tsc`, which compiles all `.ts` files in `docs/ts` into `docs/build/main.js`
3. Merge important library `.js` files from `node_modules` into `docs/build/libs.js`.
4. Copy library CSS and PNG files from `node_modules` to `docs/build/`

Execute `$ npm run server` to start a Python webserver from `docs/`.

`$ npm run clean` deletes the `build` directory.

### Sources

This tool uses the Unicode Character Database. It can be downloaded from `http://www.unicode.org/Public/UCD/latest/ucd/`. Move all text files into `UCD/`, extract `Unihan.zip` and move the `Unihan` folder contents into `Unihan/`.

Codepage mapping files are from `ftp://ftp.unicode.org/Public/MAPPINGS/`. Move the appropriate text files into `Mappings/`, and check the references in `Mappings/mappings.txt`.

Download `language-subtag-registry` from IANA (`https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry`) and place it in the repo directory.

Download `emoji-data.txt` from `https://unicode.org/Public/emoji/latest/emoji-data.txt` and place it in `data/Unicode/`.

Download the latest production (i.e. compressed) jQuery from `https://jquery.com/download` into `libs/`, and check the reference at the top of `unicode.html`.

Download the latest bootstrap from `https://getbootstrap.com/getting-started/` and extract the zip file. Rename the folder to `bootstrap` and place it in `libs/`.

Download `randomColor.js` from `https://github.com/davidmerfield/randomColor` and place it in `libs/`.

Download `punycode.js` from `https://github.com/bestiejs/punycode.js` and place it in `libs/`.

Download `he.js` from `https://github.com/mathiasbynens/he` and place it in `libs/`.

Download `utf8.js` from `https://github.com/mathiasbynens/utf8.js` and place it in `libs/`.

