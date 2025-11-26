# spectre-frontend

## 快速开始

安装依赖：

```shell
pnpm install
```

启动服务：

```shell
pnpm run dev
```

*如果你修改了后端端口，那么还需要修改代理配置*。

启动后需访问 `/spectre`，默认的根页面 `/` 是空白的。

## 开发指南

### 生成 Graphql 文件

当你新建/修改了 Graphql 查询语句后，你需要重新生成 Graphql 文件，具体命令为：

```shell
pnpm run generate
```

由于后端接口是有鉴权的，你还需要配置 token，新建一个 `.env.local` 文件，内容如下:

```properties
GRAPHQL_AUTHORIZATION_TOKEN=P@ssw0rd
```

*密码可以随意更换*

对于后端，启动时需要添加环境变量: 

```shell
GRAPHQL_AUTHORIZATION_TOKEN=$2a$10$HYWbzz/kgOxgklyf5pF0Vu2Hyfpir1xCeVua.NqpHynWurqRa2QI.
```

加密的值使用 Pbkdf2 生成，如果需要替换，需要自己重新生成。后端如果不提供该环境变量，则该接口将无法通过 token 访问。