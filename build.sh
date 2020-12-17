#!/bin/bash

# This is the main build script.

set -euo pipefail

# cd to the directory of this script
# This makes the script work even when invoked from elsewhere
cd "$(dirname "$0")"

mkdir -p dist

# Format javascript and css
yarn run prettier --write --loglevel warn "ts/**/*.ts" "css/**/*.css" "html/**/*.html" package.json

# independent
cp -R css dist/ # copy dir
cp -R favicon/* dist/ # copy contents of dir
cp -R html/* dist/

cp node_modules/bootstrap/dist/css/bootstrap.min.css dist/css/
cp node_modules/bootstrap/dist/css/bootstrap.min.css.map dist/css/
cp node_modules/chosen-js/chosen.min.css dist/css/

cp node_modules/chosen-js/chosen-sprite.png dist/css/
cp node_modules/chosen-js/chosen-sprite@2x.png dist/css/

node data/compile-unicode-data.js

# this depends on compile-unicode-data
yarn run tsc

# also depends only on compile-unicode-data
cargo fmt --manifest-path wasm/Cargo.toml
wasm-pack build --target no-modules wasm
mkdir -p dist/wasm
cp -R wasm/pkg/* dist/wasm/

# depends on cargo/wasm build
{
	cat wasm/pkg/unicode_rustwasm.js
	cat node_modules/jquery/dist/jquery.min.js
	cat node_modules/bootstrap/dist/js/bootstrap.min.js
	cat node_modules/chosen-js/chosen.jquery.min.js
} > dist/libs.js

yarn run webpack
