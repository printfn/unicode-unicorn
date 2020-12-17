#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist/ wasm/pkg/ wasm/target/
