create table runtime_node
(
    id            BIGINT PRIMARY KEY,
    name          VARCHAR(50)   NOT NULL,
    plugin_id     VARCHAR(128)  NOT NULL,
    configuration VARCHAR(2048) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    labels        VARCHAR(1024)
);

create table toolchain_item
(
    type       VARCHAR(32)  NOT NULL,
    tag        VARCHAR(32)  NOT NULL,
    url        VARCHAR(512) NOT NULL,
    arm_url    VARCHAR(512) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (type, tag)
);

create table toolchain_bundle
(
    id              BIGINT PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jattach_tag     VARCHAR(32) NOT NULL,
    arthas_tag      VARCHAR(32) NOT NULL,
    http_client_tag VARCHAR(32) NOT NULL
);

CREATE TABLE user
(
    id           BIGINT PRIMARY KEY,
    username     VARCHAR(64)  NOT NULL UNIQUE,
    password     VARCHAR(128) NOT NULL,
    display_name VARCHAR(128),
    labels       VARCHAR(1024),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role
(
    id          BIGINT PRIMARY KEY,
    name        VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_role
(
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE policy_permission
(
    id                           BIGINT PRIMARY KEY,
    subject_type                 VARCHAR(32) NOT NULL,
    subject_id                   BIGINT      NOT NULL,
    resource                     VARCHAR(64) NOT NULL,
    action                       VARCHAR(16) NOT NULL,
    condition_expression         VARCHAR(256), -- 条件表达式
    description                  TEXT,
    enhance_plugins            VARCHAR(2048),
    created_at                   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX policy_permission_idx ON policy_permission (subject_type, subject_id, resource, action);

CREATE TABLE static_permission
(
    subject_type VARCHAR(32) NOT NULL,
    subject_id   BIGINT      NOT NULL, -- role_id, user_id
    resource     VARCHAR(64) NOT NULL,
    action       VARCHAR(16) NOT NULL,
    PRIMARY KEY (subject_type, subject_id, resource, action)
);

CREATE TABLE log_entity
(
    id         BIGINT PRIMARY KEY,
    operation  VARCHAR(32)  NOT NULL,
    is_success BOOLEAN      NOT NULL,
    context    VARCHAR(512),
    time       TIMESTAMP    NOT NULL,
    ip         VARCHAR(32)  NOT NULL,
    username   VARCHAR(64) NOT NULL ,
    user_id    BIGINT       NOT NULL,
    user_agent VARCHAR(256) NOT NULL,
    message    VARCHAR(256)
)