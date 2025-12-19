# Spectre

[在线体验](https://spectreproject.click) (账号：`public`/`P@ssw0rd`)

一个 Arthas 在线管理平台

![core-preview](images/spectre-preview.png)

📦: **零侵入性，无需为服务添加额外依赖进行集成**

🐳: 支持连接远程(SSH) Docker 容器以及本地运行的 JVM

☸️: Kubernetes 集群 Pod 连接支持

👮: 拥有完整的权限管理，允许限制用户可以执行的命令，使用更加放心

💻:  完美结合 Web 界面的优势，提供更加完善的界面展示以及操作体验

♨️: 支持运行在 Jre 环境的 JVM

## 本地部署

> [!CAUTION]
> 目前仅完成了基础的功能，但仍然处于开发阶段，可能会有许多安全漏洞，**请暂时不要在生产环境中使用**！！！


数据库要求：
- SQLite
- PostgreSQL

中间件要求:
- Redis

推荐使用 docker-compose 启动(不推荐以 root 用户启动，请使用 `sudo useradd -m spectre` 来创建一个专用账号):

```yaml
name: Spectre
services:
  web:
    user: spectre
    environment:
      SPECTRE_HOME: '/home/spectre/data'
    pull_policy: always
    ports:
      - "80:8080"
    volumes:
      - ./application.yaml:/home/spectre/application.yaml
      - ./data:/home/spectre/data
      - ./logs:/home/spectre/logs
    working_dir: /home/spectre
    image: vudsen/spectre:latest
    command:
      - java
      - -Xmx1g
      - -jar
      - spectre.jar
```

配置文件:

```yaml
# application.yaml
spring:
  profiles:
    active: prod
  datasource:
    url: jdbc:sqlite:data/identifier.sqlite
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.community.dialect.SQLiteDialect
  data:
    redis:
      database: 0
      password:
      host:
      port:
```

初始的用户名密码为：`admin`/`P@ssw0rd`


## 开发部署

开发工具要求：

- Java: 17
- NodeJs: 20+
- pnpm: 9+

### 启动后端

提供 redis 配置后直接启动即可。

### 启动前端

详见前端文件夹内的 [README.md](./spectre-frontend/README.md)
