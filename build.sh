#!/bin/bash

# This is the main build script.

set -euo pipefail

# cd to the directory of this script
# This makes the script work even when invoked from elsewhere
cd "$(dirname "$0")"

mkdir -p build

# Format javascript and css
node_modules/.bin/prettier --write --loglevel warn "ts/**/*.ts" "css/**/*.css" "html/**/*.html" package.json

# independent
cp -R css build/ # copy dir
cp -R favicon/* build/ # copy contents of dir
cp -R html/* build/

cp node_modules/bootstrap/dist/css/bootstrap.min.css build/css/
cp node_modules/bootstrap/dist/css/bootstrap.min.css.map build/css/
cp node_modules/chosen-js/chosen.min.css build/css/

cp node_modules/chosen-js/chosen-sprite.png build/css/
cp node_modules/chosen-js/chosen-sprite@2x.png build/css/

node data/compile-unicode-data.js

# this depends on compile-unicode-data
./node_modules/.bin/tsc

# also depends only on compile-unicode-data
cargo fmt --manifest-path wasm/Cargo.toml
wasm-pack build --target no-modules wasm
mkdir -p build/wasm
cp -R wasm/pkg/* build/wasm/

# depends on cargo/wasm build
{
	cat wasm/pkg/unicode_rustwasm.js
	cat node_modules/jquery/dist/jquery.min.js
    cat node_modules/@popperjs/core/dist/umd/popper.min.js
	cat node_modules/bootstrap/dist/js/bootstrap.min.js
	cat node_modules/chosen-js/chosen.jquery.min.js
} > build/libs.js
