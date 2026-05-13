#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
OUT_DIR="$ROOT_DIR/bin"
APP_NAME="native-http-client"

mkdir -p "$OUT_DIR"

rustup target add x86_64-unknown-linux-musl aarch64-unknown-linux-musl

cargo install cross
cross build --release --target x86_64-unknown-linux-musl
cross build --release --target aarch64-unknown-linux-musl

cp "$ROOT_DIR/target/x86_64-unknown-linux-musl/release/$APP_NAME" "$OUT_DIR/$APP_NAME-linux-x86_64-musl"
cp "$ROOT_DIR/target/aarch64-unknown-linux-musl/release/$APP_NAME" "$OUT_DIR/$APP_NAME-linux-aarch64-musl"

echo "Built:"
echo "  $OUT_DIR/$APP_NAME-linux-x86_64-musl"
echo "  $OUT_DIR/$APP_NAME-linux-aarch64-musl"
