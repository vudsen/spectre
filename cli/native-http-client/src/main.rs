use base64::Engine;
use std::env;
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream, ToSocketAddrs};
use std::process;
use std::time::Duration;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        eprintln!("usage: native-http-client <endpoint> <base64Body> <password>");
        process::exit(1);
    }

    let endpoint = &args[1];
    let encoded_body = &args[2];
    let password = &args[3];

    if let Err(e) = do_request(encoded_body, endpoint, password) {
        eprintln!("{}", e);
        process::exit(1);
    }
}

fn do_request(encoded_body: &str, endpoint: &str, password: &str) -> Result<(), String> {
    let body = base64::engine::general_purpose::STANDARD
        .decode(encoded_body)
        .map_err(|e| format!("invalid base64 body: {}", e))?;
    let parsed = parse_http_url(endpoint)?;

    let addr = resolve_ipv4(&parsed.host, parsed.port)?;
    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(15))
        .map_err(|e| format!("connect failed: {}", e))?;
    stream
        .set_read_timeout(Some(Duration::from_secs(30)))
        .map_err(|e| format!("set read timeout failed: {}", e))?;
    stream
        .set_write_timeout(Some(Duration::from_secs(30)))
        .map_err(|e| format!("set write timeout failed: {}", e))?;

    let auth =
        base64::engine::general_purpose::STANDARD.encode(format!("arthas:{}", password).as_bytes());
    let mut req = Vec::new();
    req.extend_from_slice(format!("POST {} HTTP/1.1\r\n", parsed.path_and_query).as_bytes());
    req.extend_from_slice(format!("Host: {}\r\n", parsed.host_header).as_bytes());
    req.extend_from_slice(b"Content-Type: application/json\r\n");
    req.extend_from_slice(format!("Authorization: Basic {}\r\n", auth).as_bytes());
    req.extend_from_slice(format!("Content-Length: {}\r\n", body.len()).as_bytes());
    req.extend_from_slice(b"Connection: close\r\n\r\n");
    req.extend_from_slice(&body);

    stream
        .write_all(&req)
        .map_err(|e| format!("write request failed: {}", e))?;
    stream
        .flush()
        .map_err(|e| format!("flush request failed: {}", e))?;

    let (status_code, response_body) = read_http_response(&mut stream)?;

    if status_code == 200 {
        std::io::stdout()
            .write_all(&response_body)
            .map_err(|e| format!("write stdout failed: {}", e))?;
        return Ok(());
    }

    std::io::stderr()
        .write_all(&response_body)
        .map_err(|e| format!("write stderr failed: {}", e))?;
    eprint!("{}", status_code);
    process::exit(1);
}

struct ParsedHttpUrl {
    host: String,
    host_header: String,
    port: u16,
    path_and_query: String,
}

fn parse_http_url(input: &str) -> Result<ParsedHttpUrl, String> {
    if !input.starts_with("http://") {
        if input.starts_with("https://") {
            return Err("https is not supported".to_string());
        }
        return Err("only http:// endpoint is supported".to_string());
    }

    let rest = &input[7..];
    let (authority, path_part) = match rest.find('/') {
        Some(i) => (&rest[..i], &rest[i..]),
        None => (rest, "/"),
    };

    if authority.is_empty() {
        return Err("missing host".to_string());
    }

    if authority.contains('[') || authority.contains(']') {
        return Err("ipv6 is not supported".to_string());
    }

    let (host, port) = match authority.rsplit_once(':') {
        Some((h, p)) if !h.is_empty() && !p.is_empty() => {
            let parsed_port = p
                .parse::<u16>()
                .map_err(|_| format!("invalid port: {}", p))?;
            (h.to_string(), parsed_port)
        }
        _ => (authority.to_string(), 80),
    };

    if host.is_empty() {
        return Err("missing host".to_string());
    }

    let host_header = if port == 80 {
        host.clone()
    } else {
        format!("{}:{}", host, port)
    };

    Ok(ParsedHttpUrl {
        host,
        host_header,
        port,
        path_and_query: path_part.to_string(),
    })
}

fn resolve_ipv4(host: &str, port: u16) -> Result<SocketAddr, String> {
    let mut last_err: Option<String> = None;
    let addrs = (host, port)
        .to_socket_addrs()
        .map_err(|e| format!("resolve address failed: {}", e))?;

    for addr in addrs {
        if addr.is_ipv4() {
            return Ok(addr);
        }
        last_err = Some("resolved address is not ipv4".to_string());
    }

    Err(last_err.unwrap_or_else(|| "no resolved address".to_string()))
}

fn read_http_response(stream: &mut TcpStream) -> Result<(u16, Vec<u8>), String> {
    let mut raw = Vec::new();
    stream
        .read_to_end(&mut raw)
        .map_err(|e| format!("read response failed: {}", e))?;

    let header_end =
        find_subsequence(&raw, b"\r\n\r\n").ok_or_else(|| "invalid http response".to_string())?;
    let header_bytes = &raw[..header_end];
    let mut body = raw[(header_end + 4)..].to_vec();

    let header_str = String::from_utf8(header_bytes.to_vec())
        .map_err(|_| "invalid response header".to_string())?;
    let mut lines = header_str.split("\r\n");
    let status_line = lines
        .next()
        .ok_or_else(|| "missing status line".to_string())?;
    let mut parts = status_line.split_whitespace();
    let _http_ver = parts
        .next()
        .ok_or_else(|| "invalid status line".to_string())?;
    let code_str = parts
        .next()
        .ok_or_else(|| "invalid status line".to_string())?;
    let status_code = code_str
        .parse::<u16>()
        .map_err(|_| format!("invalid status code: {}", code_str))?;

    let mut content_length: Option<usize> = None;
    let mut chunked = false;
    for line in lines {
        if let Some((k, v)) = line.split_once(':') {
            let key = k.trim().to_ascii_lowercase();
            let val = v.trim();
            if key == "content-length" {
                content_length = val.parse::<usize>().ok();
            } else if key == "transfer-encoding" && val.to_ascii_lowercase().contains("chunked") {
                chunked = true;
            }
        }
    }

    if chunked {
        body = decode_chunked_body(&body)?;
    } else if let Some(len) = content_length {
        if body.len() > len {
            body.truncate(len);
        }
    }

    Ok((status_code, body))
}

fn decode_chunked_body(input: &[u8]) -> Result<Vec<u8>, String> {
    let mut pos = 0usize;
    let mut out = Vec::new();

    while pos < input.len() {
        let line_end = find_subsequence(&input[pos..], b"\r\n")
            .map(|i| i + pos)
            .ok_or_else(|| "invalid chunked body".to_string())?;
        let size_line = String::from_utf8(input[pos..line_end].to_vec())
            .map_err(|_| "invalid chunk size line".to_string())?;
        let size_hex = size_line
            .split(';')
            .next()
            .ok_or_else(|| "invalid chunk size".to_string())?
            .trim();
        let size = usize::from_str_radix(size_hex, 16)
            .map_err(|_| format!("invalid chunk size: {}", size_hex))?;

        pos = line_end + 2;
        if size == 0 {
            break;
        }

        if pos + size + 2 > input.len() {
            return Err("truncated chunked body".to_string());
        }

        out.extend_from_slice(&input[pos..pos + size]);
        pos += size;
        if &input[pos..pos + 2] != b"\r\n" {
            return Err("invalid chunk delimiter".to_string());
        }
        pos += 2;
    }

    Ok(out)
}

fn find_subsequence(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() {
        return Some(0);
    }
    haystack.windows(needle.len()).position(|w| w == needle)
}
