#!/bin/bash

# This is the main build script.
# Make sure to only run this from the project root!

rm -rf build docs

node src/compile-unicode-data.js

tsc

cat node_modules/jquery/dist/jquery.min.js > build/combined.js
cat node_modules/bootstrap/dist/js/bootstrap.min.js >> build/combined.js
cat node_modules/chosen-js/chosen.jquery.min.js >> build/combined.js
cat node_modules/he/he.js >> build/combined.js
echo "window.module = {};" >> build/combined.js
cat node_modules/punycode/punycode.js >> build/combined.js
cat node_modules/randomcolor/randomColor.js >> build/combined.js
cat node_modules/utf8/utf8.js >> build/combined.js

cat build/ajax.js >> build/combined.js
cat build/blocks.js >> build/combined.js
cat build/compiled-data.js >> build/combined.js
cat build/data.js >> build/combined.js
cat build/encode.js >> build/combined.js
cat build/graphemes.js >> build/combined.js
cat build/languages.js >> build/combined.js
cat build/search.js >> build/combined.js
cat build/tests.js >> build/combined.js
cat build/ui.js >> build/combined.js
cat build/variation-sequences.js >> build/combined.js
# Note that we DON'T include main.js, it needs to be included in the HTML
# separately, just before closing </body>

cp src/stylesheet.css build/
cp node_modules/bootstrap/dist/css/bootstrap.min.css build/
cp node_modules/chosen-js/chosen.min.css build/

cp src/index.html build/
cp src/licenses.html build/

cp node_modules/chosen-js/chosen-sprite.png build/
cp node_modules/chosen-js/chosen-sprite@2x.png build/

# -p: make path, don't error if exists
mkdir -p docs

cp build/index.html docs/
cp build/licenses.html docs/

cat build/*.css > docs/min.css
cp build/chosen-sprite.png docs/
cp build/chosen-sprite@2x.png docs/

cat build/combined.js > docs/min.js
cat build/main.js > docs/main.js
