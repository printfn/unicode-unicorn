#!/bin/bash

# This is the main build script.

set -euo pipefail

cd "$(dirname "$0")"

mkdir -p build

# independent
cp -R css build/ # copy dir
cp -R ts build/
cp -R favicon/* build/ # copy contents of dir
cp -R html/* build/

cp node_modules/bootstrap/dist/css/bootstrap.min.css build/css/
cp node_modules/bootstrap/dist/css/bootstrap.min.css.map build/css/
cp node_modules/chosen-js/chosen.min.css build/css/

cp node_modules/chosen-js/chosen-sprite.png build/css/
cp node_modules/chosen-js/chosen-sprite@2x.png build/css/

node compile-unicode-data.js

# this depends on compile-unicode-data
./node_modules/.bin/tsc

# also depends only on compile-unicode-data
cargo fmt --manifest-path wasm/Cargo.toml
DATA_DIR="$(pwd)/data" wasm-pack build --target no-modules wasm
mkdir -p build/wasm
cp -R wasm/pkg/* build/wasm/

# depends on cargo/wasm build
{
	cat wasm/pkg/unicode_rustwasm.js
	cat node_modules/jquery/dist/jquery.min.js
	cat node_modules/bootstrap/dist/js/bootstrap.min.js
	cat node_modules/chosen-js/chosen.jquery.min.js
} > build/libs.js
