
INSERT INTO user(id, username, password) values (2, 'tester', '$2a$10$HYWbzz/kgOxgklyf5pF0Vu2Hyfpir1xCeVua.NqpHynWurqRa2QI.');
INSERT INTO role(id, name) VALUES ('2', 'test');
INSERT INTO user_role(user_id, role_id) VALUES(2, 2);