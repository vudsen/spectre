INSERT INTO user(id, username, password, display_name, labels)
VALUES (1, 'admin', '$2a$10$HYWbzz/kgOxgklyf5pF0Vu2Hyfpir1xCeVua.NqpHynWurqRa2QI.', 'Admin', '{}');

INSERT INTO role(id, name, description)
VALUES (1, 'admin', 'Super Admin');

INSERT INTO user_role(user_id, role_id)
VALUES (1, 1);

INSERT INTO static_permission(subject_type, subject_id, resource, action)
VALUES ('ROLE', 1, 'all', 'all');