# native-http-client ARCHITECHTURE (for AI Reproduction)

This document defines exact behavior and constraints so an AI can fully re-implement the current program.

Note: file name is intentionally `ARCHITECHTURE.md` to match repository request.

## 1. Goal and compatibility target

Reproduce the behavior of Java client:
`cli/http-client/src/main/java/io/github/vudsen/spectre/httpclient/Main.java`

The Rust program must keep the same runtime contract:
- positional arguments: `endpoint`, `base64Body`, `password`
- sends one HTTP POST request
- Basic Auth user is fixed as `arthas`
- status code handling: `200` success, otherwise failure
- non-success exits with code `1`

## 2. Scope and non-goals

In scope:
- raw TCP HTTP/1.1 request over IPv4
- parse HTTP response status/header/body
- support `Content-Length` and `Transfer-Encoding: chunked`

Out of scope:
- TLS/HTTPS
- IPv6
- redirects
- keep-alive reuse
- proxy
- gzip/deflate decompression

## 3. Runtime contract

## 3.1 CLI

Executable name: `native-http-client`

Invocation:

```text
native-http-client <endpoint> <base64Body> <password>
```

Argument rule:
- If argument count `< 3` user args (process args length `< 4`), print:
  - `usage: native-http-client <endpoint> <base64Body> <password>`
- print usage to `stderr`
- exit `1`

## 3.2 Endpoint rules

`endpoint` must start with `http://`.

If `https://` prefix detected:
- return exact message: `https is not supported`
- final process exit `1`

If not `http://` and not `https://`:
- return exact message: `only http:// endpoint is supported`
- final process exit `1`

If authority contains `[` or `]`:
- treat as IPv6 style and reject with message: `ipv6 is not supported`

## 3.3 Auth rules

Authorization header value:

```text
Basic <base64("arthas:<password>")>
```

The username is hardcoded and must remain `arthas`.

## 3.4 Body rules

Input body is Base64 text in `base64Body`.
Decode using RFC4648 standard alphabet/padding (`base64::engine::general_purpose::STANDARD`).

If decode fails:
- error message starts with: `invalid base64 body: `
- append decoder error detail
- print to `stderr`
- exit `1`

## 4. HTTP request construction (byte-level)

Transport:
- Resolve DNS with `(host, port).to_socket_addrs()`
- Select first IPv4 address only
- Connect using `TcpStream::connect_timeout(..., 15s)`
- set read timeout 30s
- set write timeout 30s

If no IPv4 address in resolved set:
- return error `resolved address is not ipv4` (or `no resolved address` if no addresses)

Request is HTTP/1.1 with CRLF delimiters:

```text
POST <path_and_query> HTTP/1.1\r\n
Host: <host_header>\r\n
Content-Type: application/json\r\n
Authorization: Basic <auth>\r\n
Content-Length: <body_len>\r\n
Connection: close\r\n
\r\n
<body bytes>
```

`host_header`:
- if port == 80: `<host>`
- else: `<host>:<port>`

`path_and_query`:
- substring from first `/` in URL rest
- if missing `/`, use `/`

## 5. HTTP response parsing contract

Read all bytes from stream until EOF (`read_to_end`).

Find header/body separator `\r\n\r\n`.
- if missing: error `invalid http response`

Status line parsing:
- split first header line by whitespace
- require HTTP version token and status code token
- missing tokens -> `invalid status line`
- status parse failure -> `invalid status code: <raw>`

Header handling:
- case-insensitive keys
- parse optional:
  - `Content-Length`
  - `Transfer-Encoding` contains `chunked`

Body extraction:
- default: bytes after `\r\n\r\n`
- if chunked: decode as chunked transfer coding
- else if content-length present and current body longer than length: truncate to length

Chunked decode rules:
- each chunk size line ends with `\r\n`
- size may include extensions (`;`), parse hex part before `;`
- size `0` ends stream
- each chunk data must be followed by `\r\n`
- on malformed input return one of:
  - `invalid chunked body`
  - `invalid chunk size line`
  - `invalid chunk size`
  - `truncated chunked body`
  - `invalid chunk delimiter`

## 6. Output and exit behavior

If status code is `200`:
- write response body bytes to `stdout`
- return success (`exit 0`)

If status code is not `200`:
- write response body bytes to `stderr`
- then write status code digits to `stderr` (no forced newline)
- immediately `process::exit(1)`

For all propagated errors from parsing/network/decode:
- top-level prints error string to `stderr`
- exits `1`

## 7. File layout to reproduce

```text
cli/native-http-client/
  Cargo.toml
  src/main.rs
  build-linux-musl.sh
  README.md
  ARCHITECHTURE.md
```

## 8. Dependency and profiles

`Cargo.toml` requirements:
- package edition `2021`
- dependency:
  - `base64 = "0.22"`
- release profile:
  - `lto = true`
  - `codegen-units = 1`
  - `panic = "abort"`
  - `strip = true`

## 9. Build pipeline contract

Script: `build-linux-musl.sh`

Required behavior:
1. `set -eu`
2. compute `ROOT_DIR`, `OUT_DIR=bin`, `APP_NAME=native-http-client`
3. create output dir
4. add targets:
   - `x86_64-unknown-linux-musl`
   - `aarch64-unknown-linux-musl`
5. ensure `cross` available (current script installs via `cargo install cross`)
6. build release for both targets with `cross build`
7. copy binaries to:
   - `bin/native-http-client-linux-x86_64-musl`
   - `bin/native-http-client-linux-aarch64-musl`
8. print built paths

## 10. Reproduction checklist for AI

To claim full compatibility, verify all below:
- argument count check and usage string identical
- rejects https and ipv6 with same messages
- Basic Auth uses hardcoded `arthas`
- request headers and CRLF framing exact
- IPv4-only address selection
- status `200` to stdout; non-200 body + code to stderr; exit `1`
- chunked decoding supported
- musl build script outputs two Linux binaries with exact names

## 11. Known quirks (must preserve unless explicitly refactoring)

- Non-200 path exits inside `do_request` instead of returning error.
- Response body is read entirely into memory before output.
- `Content-Length` shorter-than-actual is truncated; longer-than-actual is not padded/retried.
- No redirect handling.

Preserve these quirks for behavior parity with current implementation.
