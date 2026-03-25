# AI Context - Spectre

## 0. 文档目标与范围

- 目标：给 AI 提供“可执行的项目理解上下文”，用于定位代码、判断改动边界、减少误判。
- 范围：基于当前仓库真实代码结构，不包含推测性模块。
- 主要代码根目录：
- `spectre-core/`
- `spectre-api/`
- `spectre-repo/`
- `spectre-common/`
- `spectre-api-support/`
- `spectre-frontend/`
- `cli/http-client/`

## 1. 项目简介（做什么）

- 本项目是一个围绕 Arthas 的在线诊断平台。
- 核心路径：
- 用户在 Web 端选择 Runtime Node（如 SSH 主机、K8s Pod）。
- 后端通过插件机制连接目标 JVM。
- 后端创建/复用 Arthas 会话并转发命令。
- 前端展示命令输出（console/dashboard/profiler/jad 等）。
- 额外能力：
- 细粒度权限（ACL + Policy/ABAC）。
- AI 诊断对话（SSE 流式 + 工具调用 + askHuman/confirm 状态机）。

## 2. 技术栈

### 2.1 后端

- 语言：Kotlin（JVM）
- JDK：17（Gradle toolchain）
- 框架：Spring Boot 4.x
- Web：Spring MVC + Spring GraphQL
- 安全：Spring Security + 自定义 PermissionEvaluator
- 持久层：Spring Data JPA + Hibernate
- 迁移：Liquibase（`spectre-core/src/main/resources/db/changelog-master.xml`）
- 缓存：Ehcache（JCache）
- AI SDK：`com.openai:openai-java`
- 其它：SSHD（远程连接）、OkHttp、Jackson

### 2.2 前端

- 框架：React 19 + TypeScript
- 构建：Vite
- 路由：React Router
- 状态：Redux Toolkit + redux-persist
- UI：@heroui/react
- 样式：Tailwind CSS 4
- 网络：axios（REST）+ fetch（GraphQL 与 SSE）
- GraphQL：graphql-codegen 生成客户端类型

### 2.3 数据库与存储

- 默认配置：SQLite（`application-dev.yaml` / `application-prod.yaml`）
- 驱动依赖：内置 PostgreSQL 驱动（可切换）
- ORM 实体：位于 `spectre-repo/src/main/kotlin/.../po/`
- 核心运行态缓存：Ehcache（AI 会话状态、树节点缓存、加密缓存等）

## 3. 核心模块划分（按代码结构）

### 3.1 后端多模块（Gradle）

- `spectre-core`
- 启动模块。
- 包含 controller/configuration/service 实现。
- 包含 RuntimeNode 插件实现（ssh/k8s/test）。
- `spectre-api`
- API 抽象层。
- 定义 service 接口、dto/vo、权限实体、插件接口。
- `spectre-repo`
- 持久层。
- JPA Repository 接口与 PO 实体。
- `spectre-common`
- 通用能力。
- 环境变量、加解密辅助、进度上报、锁等。
- `spectre-api-support`
- API 支撑实现。
- 插件管理器、加密对象映射、本地包管理器等。
- `cli/http-client`
- 独立 CLI 工具（与 arthas http 交互）。

### 3.2 后端分层（controller/service/repository 等）

- Controller 层（`spectre-core/.../controller`）
- REST 控制器：`AuthController`、`RuntimeNodeController`、`ArthasExecutionController`、`AiController` 等。
- GraphQL Query 控制器：`controller/ql/*QueriesController.kt`。
- 异常处理：`GlobalExceptionHandler`。
- Service 层
- 接口：`spectre-api/.../service/*.kt`。
- 实现：`spectre-core/.../service/impl/Default*Service.kt`。
- Repository 层
- 接口：`spectre-repo/.../*Repository.kt`。
- 实体：`spectre-repo/.../po/*PO.kt`。
- Plugin/Extension 层
- 插件抽象：`RuntimeNodeExtensionPoint`（`spectre-api`）。
- 插件管理：`RuntimeNodeExtManager`（`spectre-api-support`）。
- 具体插件：`core/plugin/ssh`、`core/plugin/k8s`。
- 安全与权限层
- `SecurityConfiguration`、`GraphqlSchemaAuthorizationFilter`。
- `SpectrePermissionEvaluator` + `DefaultAppAccessControlService`。
- Policy 插件：`core/integrate/abac` + `core/plugin/abac`。
- 审计层
- 注解 + 切面：`core/audit/Log.kt`、`LogAspect.kt`。

### 3.3 前端分层

- 页面与路由层
- `src/pages/router.tsx` 定义主路由树。
- 页面目录按业务域组织：`runtime-node`、`toolchain`、`permission`、`channel`、`settings` 等。
- API 访问层
- REST：`src/api/impl/*.ts`。
- axios 初始化与统一错误处理：`src/api/init.ts`。
- GraphQL 执行：`src/graphql/execute.ts`。
- 状态管理层
- store 入口：`src/store/index.ts`。
- 业务 slice：`channel/session/navbar/config/tip`。
- 组件层
- 通用组件：`src/components/*`。
- 表单组件：`src/components/validation/*`。
- 扩展 UI（运行节点插件对应前端页面）：`src/ext/*`。

## 4. 模块职责说明（逐模块）

### 4.1 `spectre-core`

- 职责：应用入口 + 业务编排 + 对外接口。
- 关键内容：
- 启动类与全局配置。
- REST/GraphQL 控制器。
- service 具体实现。
- 运行节点插件（SSH/K8s）。
- 审计与权限实现。
- AI 对话与工具编排。
- 典型调用链（命令执行）：
- `ArthasExecutionController` 接收请求。
- `DefaultArthasExecutionService` 校验权限、连接/复用 client。
- 通过 plugin attach 到 JVM 并执行 Arthas 命令。
- 返回 JSON/SSE 到前端。

### 4.2 `spectre-api`

- 职责：稳定抽象边界。
- 关键内容：
- Service 接口定义。
- DTO/VO/实体契约。
- 权限模型（`AppPermissions` 等）。
- 运行节点扩展点接口。
- AI 相关 DTO 与异常契约。
- 说明：
- `spectre-core` 实现这些接口。
- `spectre-frontend` 与后端通信的数据结构大多映射到这里。

### 4.3 `spectre-repo`

- 职责：数据库映射与查询。
- 关键内容：
- `*Repository`：JPA 查询入口。
- `*PO`：表结构映射。
- `convert/*`：字段转换器（如 labels、instant、long-string）。
- 代表表实体：
- 用户/角色/策略权限。
- 运行节点配置。
- Arthas 实例缓存信息。
- 工具链与工具链 bundle。
- 审计日志。

### 4.4 `spectre-common`

- 职责：跨模块通用能力。
- 关键内容：
- `SpectreEnvironment`：环境变量与运行目录。
- `KeyBasedLock`：按 key 的并发控制。
- `progress/*`：任务进度报告。
- 通用安全与系统工具类。

### 4.5 `spectre-api-support`

- 职责：为 API 抽象提供公共实现，不直接承载业务控制器。
- 关键内容：
- `RuntimeNodeExtManager`：按 ID 管理 RuntimeNode 插件。
- `PolicyAuthentication*Manager`：策略认证插件管理。
- `SecretSupportedObjectMapper`：敏感字段配置序列化支持。
- `LocalPackageManager`：工具包本地缓存。

### 4.6 `spectre-frontend`

- 职责：前端交互与状态管理。
- 关键内容：
- 路由聚合页与业务页。
- REST + GraphQL + SSE 三条数据通道。
- channel 页面负责 Arthas 实时交互。
- AI 面板负责流式消息渲染与工具事件状态管理。
- 说明：
- 前端并非按 MVC 分层，而是按“页面域 + API 层 + store + 组件”组织。

### 4.7 `cli/http-client`

- 职责：独立命令行客户端。
- 用途：与 Arthas HTTP 接口交互（由平台流程使用/复用）。

## 5. 关键类说明（仅核心）

### 5.1 启动与全局配置

- `spectre-core/.../SpectreApplication.kt`
- 应用启动入口。
- 初始化 `spectre.home`。
- 开启 Spring 上下文并写入 `ApplicationContextHolder`。

- `spectre-core/.../configuration/ApiPrefixConfiguration.kt`
- 自动为绝大多数 Controller 路由加 `/spectre-api` 前缀。
- `HomeController` 等特殊入口通过 `@NoApiPrefix` 排除。

- `spectre-core/.../configuration/SecurityConfiguration.kt`
- 定义安全过滤链、认证管理器、密码编码器。
- 注册 GraphQL 授权过滤器。
- 配置匿名可访问路径与鉴权路径。

- `spectre-core/.../configuration/GraphQLConfiguration.kt`
- 自定义 GraphQL Scalar（`Timestamp/JSON/Labels/Long`）。
- 影响前后端 GraphQL 序列化行为。

### 5.2 接口层

- `spectre-core/.../controller/ArthasExecutionController.kt`
- Arthas 相关核心 REST 入口。
- 提供 `create-channel/join/pull/execute/interrupt/retransform/profiler`。
- 维护 HTTP Session 到 consumerId 的绑定。

- `spectre-core/.../controller/RuntimeNodeController.kt`
- 运行节点 CRUD、连通性测试、树展开、view 页面解析。
- 对扩展点配置表单与视图页做统一编排。

- `spectre-core/.../controller/AiController.kt`
- AI SSE 对话入口（`chat`、`chat/with-skill`）。
- LLM 配置读写与技能列表查询入口。

- `spectre-core/.../controller/ql/*QueriesController.kt`
- GraphQL 读接口聚合层。
- 覆盖 user/role/runtimeNode/toolchain/log/permission 查询。

### 5.3 核心业务服务

- `spectre-core/.../service/impl/DefaultArthasExecutionService.kt`
- Arthas 会话管理核心。
- attach 并发控制、channel/consumer 生命周期。
- 命令权限校验与禁用命令过滤。
- profiler 文件管理、OGNL 表达式安全校验。

- `spectre-core/.../service/impl/DefaultRuntimeNodeService.kt`
- RuntimeNode 管理核心。
- 运行节点配置（含敏感字段回填/脱敏）。
- 运行节点树展开、插件连接、JVM 反序列化。

- `spectre-core/.../service/impl/DefaultAppAccessControlService.kt`
- 权限决策核心。
- 从用户角色、策略表达式、增强插件综合判断权限。
- 处理 SpEL 缓存与执行错误。

- `spectre-core/.../service/impl/DefaultAiService.kt`
- AI 会话核心。
- 使用 OpenAI Java SDK 流式对话。
- 工具调用串行执行。
- `PENDING_CONFIRM` 与 `ASK_HUMAN` 状态恢复。
- token 用量按小时限流。

### 5.4 插件与扩展点

- `spectre-api/.../plugin/RuntimeNodeExtensionPoint.kt`
- RuntimeNode 扩展点抽象。
- 规定连接、测试、配置表单、敏感字段处理、JVM 搜索、attach handler 创建等接口。

- `spectre-api-support/.../RuntimeNodeExtManager.kt`
- 扩展点注册表。
- 按插件 ID 查询扩展实现。

- `spectre-core/.../plugin/ssh/SshRuntimeNodeExtension.kt`
- SSH 节点插件实现。
- 支持本地 JVM 与 Docker JVM 搜索、attach。

- `spectre-core/.../plugin/k8s/K8sRuntimeNodeExtension.kt`
- K8s 节点插件实现。
- 支持 namespace/pod/container 树检索与 attach。

### 5.5 持久层关键对象

- `spectre-repo/.../RuntimeNodePO.kt`
- 运行节点实体。
- 持久化插件 ID、配置 JSON、labels、restrictedMode。

- `spectre-repo/.../ArthasInstancePO.kt`
- Arthas 会话实体。
- 保存 channelId/sessionId/boundPort/runtimeNodeId/jvm 等运行态信息。

- `spectre-repo/.../UserRepository.kt`
- 用户读写入口（登录、前缀检索等）。

### 5.6 前端关键对象

- `spectre-frontend/src/pages/router.tsx`
- 前端路由总表。
- 明确业务域页面结构和懒加载边界。

- `spectre-frontend/src/api/init.ts`
- axios 全局拦截器。
- 统一处理 401、业务错误、校验错误、多语言 header。

- `spectre-frontend/src/graphql/execute.ts`
- GraphQL 请求执行器。
- 对查询压缩并统一处理 GraphQL errors/401。

- `spectre-frontend/src/pages/channel/[channelId]/_ai/AiPanel.tsx`
- AI 对话 UI 核心。
- 处理 TOKEN/TOOL_CALL/PENDING_CONFIRM/ASK_HUMAN/ERROR 流事件。

- `spectre-frontend/src/store/index.ts`
- 全局状态入口。
- 定义持久化 slice（session/channel/config/tip）。

## 6. AI 修改代码时的定位建议

- REST 入口优先看：`spectre-core/controller/*`。
- GraphQL 查询优先看：`spectre-core/controller/ql/*` + `resources/graphql/*.graphqls`。
- 业务逻辑优先看：`spectre-core/service/impl/*`。
- 数据结构与查询优先看：`spectre-repo/po/*` 与 `spectre-repo/*Repository.kt`。
- 权限问题优先看：`SecurityConfiguration`、`SpectrePermissionEvaluator`、`DefaultAppAccessControlService`。
- RuntimeNode 插件相关优先看：
- 抽象：`spectre-api/plugin/RuntimeNodeExtensionPoint.kt`
- 管理：`spectre-api-support/support/plugin/RuntimeNodeExtManager.kt`
- 实现：`spectre-core/plugin/ssh`、`spectre-core/plugin/k8s`
- AI 对话问题优先看：`AiController`、`DefaultAiService`、`AiConversationStateStore`、`OpenAiToolRegistry`。

## 7. 非目标（避免误解）

- 本文不是部署手册。
- 本文不覆盖每个文件的逐行解释。
- 本文不声明“未来规划”或仓库中不存在的模块。
