# AGENTS

## 1. 项目结构

- `spectre-core`：后端主应用（Spring Boot 启动模块，聚合其他后端模块）
- `spectre-api`：服务接口与领域 API（service/vo/dto 等抽象）
- `spectre-repo`：数据访问层（JPA/Hibernate 相关）
- `spectre-common`：通用能力与基础组件
- `spectre-api-support`：API 辅助实现
- `cli/http-client`：命令行客户端工具
- `spectre-frontend`：前端（React + Vite + TypeScript）
- `deploy`：部署相关配置（如 k8s）

## 2. 常用命令（build/test/run）

- 后端构建：`./gradlew build`
- 后端测试：`./gradlew test`
- 后端集成测试：`./gradlew :spectre-core:integrationTest`
- 启动后端（dev）：`./gradlew :spectre-core:bootRun --args='--spring.profiles.active=dev' --stacktrace`

- 前端安装依赖：`cd spectre-frontend && pnpm install`
- 启动前端开发服务：`cd spectre-frontend && pnpm run dev`
- 前端检查（lint + 类型）：`cd spectre-frontend && pnpm run check`
- 前端构建：`cd spectre-frontend && pnpm run build`

## 3. 代码规范（基于现有代码）

- 后端统一 Kotlin + Java 17；保持 `io.github.vudsen.spectre...` 包路径风格。
- 遵循 ktlint（根 `build.gradle.kts` 已启用），提交前至少跑一次 `./gradlew test`（或最小相关模块测试）。
- 后端命名沿用现有后缀：`*DTO`、`*VO`、`*PO`、`*Service`，不要新造命名体系。
- 前端优先复用现有技术栈与约定：`@heroui/react`、Redux Toolkit、`@/` 路径别名、既有表单/校验组件。

## 4. 修改边界（避免大规模改动）

- 优先做“最小闭环改动”：只改与需求直接相关的模块和文件。
- 不做跨模块大重构（目录迁移、批量重命名、分层重写）除非需求明确要求。
- 不随意改公共契约：数据库 schema、GraphQL schema、对外 API、核心配置键名。
- 涉及前后端联动时，先保证接口兼容，再做增量扩展；避免一次性替换整条链路。
- 每次提交保持可回滚：小步修改、可编译、可测试。
