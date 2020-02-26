#!/bin/bash

# This is the main build script.
# Make sure to only run this from the project root!

set -euo pipefail

mkdir -p docs/build

node compile-unicode-data.js

# this depends on compile-unicode-data
./node_modules/.bin/tsc

# also depends only on compile-unicode-data
cargo fmt --manifest-path docs/unicode-rustwasm/Cargo.toml
DATA_DIR="$(pwd)/data" wasm-pack build --target no-modules docs/unicode-rustwasm
rm docs/unicode-rustwasm/pkg/.gitignore

# depends on cargo/wasm build
{
	cat docs/unicode-rustwasm/pkg/unicode_rustwasm.js
	cat node_modules/jquery/dist/jquery.min.js
	cat node_modules/bootstrap/dist/js/bootstrap.min.js
	cat node_modules/chosen-js/chosen.jquery.min.js
	echo "window.module = {};"
	cat node_modules/punycode/punycode.js
} > docs/build/libs.js

# independent
cp node_modules/bootstrap/dist/css/bootstrap.min.css docs/build/
cp node_modules/bootstrap/dist/css/bootstrap.min.css.map docs/build/
cp node_modules/chosen-js/chosen.min.css docs/build/

# independent
cp node_modules/chosen-js/chosen-sprite.png docs/build/
cp node_modules/chosen-js/chosen-sprite@2x.png docs/build/
