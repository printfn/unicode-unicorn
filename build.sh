#!/bin/bash

# This is the main build script.

set -euo pipefail

# cd to the directory of this script
# This makes the script work even when invoked from elsewhere
cd "$(dirname "$0")"

mkdir -p dist

# Format javascript and css
prettier --write --loglevel warn "src/**/*.ts" "src/**/*.css" "html/**/*.html" package.json

# independent
cp -R favicon/* dist/ # copy contents of dir
cp -R html/* dist/

node data/compile-unicode-data.js

# also depends only on compile-unicode-data
cargo fmt --manifest-path wasm/Cargo.toml
wasm-pack build wasm

webpack
