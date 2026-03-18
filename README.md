# Spectre

[在线体验](https://spectreproject.click) (账号：`public`/`P@ssw0rd`)

一个 Arthas 在线管理平台

![core-preview](images/spectre-preview.png)

📦: **零侵入性，无需为服务添加额外依赖进行集成**

🐳: 支持连接远程(SSH) Docker 容器以及本地运行的 JVM

☸️: Kubernetes 集群 Pod 连接支持

👮: 拥有完整的权限管理，允许限制用户可以执行的命令，使用更加放心

💻:  完美结合 Web 界面的优势，提供各种原版命令的增强以及更精美的界面

♨️: 支持运行在 Jre 环境的 JVM

## 实现原理

服务使用了 3 个核心组件(工具):
- arthas: 核心工具，attach jvm 后开启 http 接口进行交互
- jattach: 用于 jre 环境下的连接
- [http-client](/cli/http-client): 用于和 arthas http 接口交互

连接流程：

1. 上传这 3 个工具到对应的服务器/容器中
2. 通过 shell 命令，使用 jattach + arthas 来连接到 JVM，并开启 arthas 的 http 端口(带有 basic 认证)
3. 使用 http-client 进行交互，Specrte 作为一个 "网关" 进行鉴权和调用

### 常见问题

**Q: 被 Spectre 管理的服务器/容器需要暴露 arthas 的 http 端口吗?**

A: 不需要，整个交互完全通过 http-client 进行，不需要向外暴露端口

**Q: 可以绕过 Spectre，在命令行直接通过 http-client 和 arthas 交互吗?**

A: 不行，除非能够知到 basic 认证的密码，这个密码是随机生成，保存在 Spectre 中

## 增强功能

我们对一些命令进行了增强，能更方便的进行使用和查看。

### Retransform 

Retransform 可以直接在 web 界面上传 class 文件替换字节码，文件在替换后会被立马删除。

![retransform](images/retransform.png)

### Dashboard

![dashboard](images/dashboard.png)

### Jad

![jad](images/jad.png)


## 本地部署

> [!CAUTION]
> 目前为项目未经广泛验证，可能会有安全漏洞，**请暂时不要连接生产环境中的服务器**！！！


数据库要求：
- SQLite
- Postgresql

初始的用户名密码为：`admin`/`P@ssw0rd`

### 使用 docker 直接启动

```shell
# prod 环境下不会往 stdout 输出日志
docker run -t vudsen/spectre:latest java -Dspring.profiles.active=dev -jar spectre.jar
```

### docker-compose

推荐使用 docker-compose 启动:

```yaml
name: Spectre
services:
  web:
    environment:
      SPECTRE_HOME: '/home/spectre/data'
      ENCRYPTOR_KEY: '<可选，base64 字符串>'
      ENCRYPTOR_SALT: '<可选，base64 字符串，可以只提供 key，不给 salt>'
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

**对于被挂载的文件/文件夹，需要手动进行授权**：
```shell
chown -R 10001:10001 application.yaml ./data ./logs
```

配置文件:

```yaml
# application.yaml
spring:
  profiles:
    active: prod
  datasource:
    # 也可以使用 Postgresql，已经内置了对应驱动
    url: jdbc:sqlite:data/identifier.sqlite
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.community.dialect.SQLiteDialect
```


## 使用指南

### 快速开始

#### 1. 手动上传工具包

因为 Spectre 在第一次使用时会从 GitHub 上下载各种依赖的工具，例如 Arthas。

所以对于国内环境/离线环境需要手动上传工具包(如果可以联网，可以跳过这步，尝试自动下载)。

首先点击左侧菜单 `工具链` -> `工具`, 在第一次部署时会默认初始化所有需要的工具，然后查看 `包缓存状态` 一列：

![pkg-cache](./images/pkg-cache.png)

可以看到值为 `false`，点击 `false` 后，会弹出一个上传对话框，然后手动下载对应的工具包上传即可。

#### 2. 创建运行节点

点击左侧菜单 `节点设置` -> `新建运行节点`，即可进入到运行节点创建界面。

一个运行节点可以简单理解为：一个运行着很多 JVM 的服务器。

目前支持 SSH(仅支持 Windows) 和 Kubernetes。

#### 3. 连接 JVM

点击左侧 `节点设置` -> `节点列表`，找到刚才创建的运行节点，在列表中点击一个类似插头的图标：

![runtime-node-list](./images/runtime-node-list.png)

之后将会显示详细的节点树，该界面中找到需要连接的 JVM，点击插头图标，即可连接：

![runtime-node-tree](./images/runtime-node-tree.png)

连接过程可能较长，请耐心等待。

#### 4. 执行命令

连接完成后，将会进入命令执行界面：

![spectre-preview](./images/spectre-preview.png)

在下方输入框即可输入 Arthas 命令。


### 关于 Kubernetes

如果要连接到 Kubernetes，推荐参考 [k8s-full-roles.yaml](./deploy/k8s-full-roles.yaml) 以提供基础所需权限(`pods/exec` 和 `pods` 可以限制到命名空间范围)。


## 开发部署

开发工具要求：

- Java: 17
- NodeJs: 20+
- pnpm: 9+

### 启动后端

添加命令行参数：

```
-Dspring.profiles.active=dev
```


### 启动前端

详见前端文件夹内的 [README.md](./spectre-frontend/README.md)
