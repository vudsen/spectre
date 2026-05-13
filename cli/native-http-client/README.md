# native-http-client

A minimal Rust HTTP client migrated from `cli/http-client` (Java version).

## Purpose

Send one HTTP `POST` request with JSON body and Basic Auth, then print response body.

Behavior is intentionally strict and minimal:
- Only supports `http://` endpoints
- Does not support TLS (`https://` is rejected)
- Does not support IPv6 (connects IPv4 only)
- CLI contract is compatible with the original Java client

## CLI

```bash
native-http-client <endpoint> <base64Body> <password>
```

Arguments:
- `endpoint`: target URL, must start with `http://`
- `base64Body`: Base64-encoded JSON bytes
- `password`: used in Basic Auth as `arthas:<password>`

## Request format

- Method: `POST`
- Headers:
  - `Host: <host[:port]>`
  - `Content-Type: application/json`
  - `Authorization: Basic <base64("arthas:<password>")>`
  - `Content-Length: <decoded body length>`
  - `Connection: close`
- Body: decoded bytes from `base64Body`

## Output and exit code

- If HTTP status is `200`:
  - write response body to `stdout`
  - exit `0`
- If HTTP status is not `200`:
  - write response body to `stderr`
  - then write status code (without extra newline) to `stderr`
  - exit `1`
- On argument, URL, network, decode, or parse errors:
  - print error message to `stderr`
  - exit `1`

## Build

### Local check

```bash
cargo check --release
```

### Linux musl static build

Use script:

```bash
./build-linux-musl.sh
```

Outputs:
- `bin/native-http-client-linux-x86_64-musl`
- `bin/native-http-client-linux-aarch64-musl`

The script uses `cross` to build musl static targets.
