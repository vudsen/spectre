INSERT INTO toolchain_item (type, tag, url, arm_url, created_at) VALUES ('ARTHAS', 'v4.1.5', 'https://github.com/alibaba/arthas/releases/download/arthas-all-4.1.5/arthas-bin.zip', '', '2025-11-26 03:13:15');
INSERT INTO toolchain_item (type, tag, url, arm_url, created_at) VALUES ('JATTACH', 'v2.2', 'https://github.com/jattach/jattach/releases/download/v2.2/jattach-linux-x64.tgz', 'https://github.com/jattach/jattach/releases/download/v2.2/jattach-linux-arm64.tgz', '2025-11-26 03:13:28');
INSERT INTO toolchain_item (type, tag, url, arm_url, created_at) VALUES ('HTTP_CLIENT', 'v0.0.1', 'https://github.com/vudsen/spectre/releases/download/v0.0.1/http-client-0.0.1.jar', '', '2025-11-26 03:13:39');

INSERT INTO toolchain_bundle (id, name, created_at, jattach_tag, arthas_tag, http_client_tag) VALUES (1191016456452571136, 'latest', '2025-11-26 03:15:16', 'v2.2', 'v4.1.5', 'v0.0.1');

INSERT INTO user(id, username, password) values (2, 'tester', '$2a$10$HYWbzz/kgOxgklyf5pF0Vu2Hyfpir1xCeVua.NqpHynWurqRa2QI.');
INSERT INTO role(id, name) VALUES ('2', 'test');
INSERT INTO user_role(user_id, role_id) VALUES(2, 2);