#!/bin/bash

# This is the main build script.

set -euo pipefail

# cd to the directory of this script
# This makes the script work even when invoked from elsewhere
cd "$(dirname "$0")"

mkdir -p dist

# Format javascript and css
yarn run prettier --write --loglevel warn "src/**/*.ts" "ts/**/*.ts" "src/**/*.css" "html/**/*.html" package.json

# independent
cp -R favicon/* dist/ # copy contents of dir
cp -R html/* dist/

node data/compile-unicode-data.js

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
