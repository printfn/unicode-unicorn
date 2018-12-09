#!/bin/bash

# This is the main build script.
# Make sure to only run this from the project root!

mkdir -p ts/build docs/build

node compile-unicode-data.js

tsc

cat node_modules/jquery/dist/jquery.min.js > docs/build/libs.js
cat node_modules/bootstrap/dist/js/bootstrap.min.js >> docs/build/libs.js
cat node_modules/chosen-js/chosen.jquery.min.js >> docs/build/libs.js
cat node_modules/he/he.js >> docs/build/libs.js
echo "window.module = {};" >> docs/build/libs.js
cat node_modules/punycode/punycode.js >> docs/build/libs.js
cat node_modules/randomcolor/randomColor.js >> docs/build/libs.js
cat node_modules/utf8/utf8.js >> docs/build/libs.js

cp node_modules/bootstrap/dist/css/bootstrap.min.css docs/build/
cp node_modules/chosen-js/chosen.min.css docs/build/

cp node_modules/chosen-js/chosen-sprite.png docs/build/
cp node_modules/chosen-js/chosen-sprite@2x.png docs/build/