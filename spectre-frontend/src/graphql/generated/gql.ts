/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query QueryPolicyPermissionPlugins($id: Long!) {\n    policyPermission {\n      permission(id: $id) {\n        enhancePlugins {\n          configuration\n          pluginId\n        }\n      }\n    }\n  }\n": typeof types.QueryPolicyPermissionPluginsDocument,
    "\n  query PolicyPermissionsQuery(\n    $subjectType: String\n    $subjectId: Long!\n    $page: Int\n    $size: Int\n    $isUser: Boolean!\n    $isRole: Boolean!\n  ) {\n    policyPermission {\n      permissions(\n        subjectType: $subjectType\n        subjectId: $subjectId\n        page: $page\n        size: $size\n      ) {\n        totalPages\n        result {\n          id\n          name\n          action\n          resource\n          conditionExpression\n          createdAt\n          description\n        }\n      }\n    }\n    user @include(if: $isUser) {\n      user(id: $subjectId) {\n        username\n        displayName\n      }\n    }\n    role @include(if: $isRole) {\n      role(id: $subjectId) {\n        name\n      }\n    }\n  }\n": typeof types.PolicyPermissionsQueryDocument,
    "\n  query PermissionsBindQuery(\n    $subjectId: Long\n    $subjectType: String\n    $resource: String\n  ) {\n    staticPermission {\n      allBoundPermissions(\n        subjectId: $subjectId\n        subjectType: $subjectType\n        resource: $resource\n      ) {\n        action\n      }\n      listPermissionsByResource(resource: $resource) {\n        action\n        name\n      }\n    }\n  }\n": typeof types.PermissionsBindQueryDocument,
    "\n  query SubjectPermissionsQuery(\n    $subjectId: Long!\n    $subjectType: String!\n    $page: Int\n    $size: Int\n    $isUser: Boolean!\n    $isRole: Boolean!\n  ) {\n    staticPermission {\n      permissions(\n        subjectId: $subjectId\n        subjectType: $subjectType\n        page: $page\n        size: $size\n      ) {\n        totalPages\n        result {\n          name\n          action\n          resource\n        }\n      }\n    }\n    user @include(if: $isUser) {\n      user(id: $subjectId) {\n        username\n        displayName\n      }\n    }\n    role @include(if: $isRole) {\n      role(id: $subjectId) {\n        name\n      }\n    }\n  }\n": typeof types.SubjectPermissionsQueryDocument,
    "\n  query LogDetailQuery($id: Long!) {\n    log {\n      log(id: $id) {\n        userAgent\n        message\n        context\n      }\n    }\n  }\n": typeof types.LogDetailQueryDocument,
    "\n  query LogEntityQuery($page: Int!, $size: Int!) {\n    log {\n      logs(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          ip\n          isSuccess\n          operation\n          time\n          username\n        }\n      }\n    }\n  }\n": typeof types.LogEntityQueryDocument,
    "\n  query ListRuntimeNodesSimpleQuery($page: Int, $size: Int) {\n    runtimeNode {\n      runtimeNodes(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          labels\n        }\n      }\n    }\n  }\n": typeof types.ListRuntimeNodesSimpleQueryDocument,
    "\n  query RoleBoundUserQuery($roleId: Long!, $page: Int, $size: Int) {\n    role {\n      role(id: $roleId) {\n        name\n      }\n      boundUsers(roleId: $roleId, page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          username\n          displayName\n          labels\n        }\n      }\n    }\n  }\n": typeof types.RoleBoundUserQueryDocument,
    "\n  query ListUserWithUsernameQuery($username: String!) {\n    user {\n      searchByUsername(username: $username) {\n        result {\n          id\n          username\n          displayName\n          labels\n        }\n      }\n    }\n  }\n": typeof types.ListUserWithUsernameQueryDocument,
    "\n  query RolePermissionDetailQuery($roleId: Long!) {\n    role {\n      role(id: $roleId) {\n        id\n        name\n        createdAt\n        description\n      }\n    }\n  }\n": typeof types.RolePermissionDetailQueryDocument,
    "\n  query ListRoleQuery($page: Int, $size: Int) {\n    role {\n      roles(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          description\n          createdAt\n        }\n      }\n    }\n  }\n": typeof types.ListRoleQueryDocument,
    "\n  query ListRoleWithNameQuery($name: String) {\n    role {\n      searchRoleByName(name: $name) {\n        result {\n          id\n          name\n          description\n        }\n      }\n    }\n  }\n": typeof types.ListRoleWithNameQueryDocument,
    "\n  query UserRoleQuery($uid: Long!) {\n    role {\n      userRoles(userId: $uid) {\n        id\n        name\n        description\n      }\n    }\n  }\n": typeof types.UserRoleQueryDocument,
    "\n  query UserDetailQuery($userId: Long!) {\n    user {\n      user(id: $userId) {\n        id\n        createdAt\n        displayName\n        username\n        labels\n      }\n    }\n  }\n": typeof types.UserDetailQueryDocument,
    "\n  query UserListQuery($page: Int, $size: Int) {\n    user {\n      users(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          createdAt\n          displayName\n          username\n          labels\n        }\n      }\n    }\n  }\n": typeof types.UserListQueryDocument,
    "\n  query UserQuery($id: Long!) {\n    user {\n      user(id: $id) {\n        id\n        labels\n        username\n        displayName\n      }\n    }\n  }\n": typeof types.UserQueryDocument,
    "\n  query ToolchainBundleQueryForAttach {\n    toolchain {\n      toolchainBundles {\n        result {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.ToolchainBundleQueryForAttachDocument,
    "\n  query NodeInfoQuery($id: String!) {\n    runtimeNode {\n      runtimeNode(id: $id) {\n        name\n        labels\n        createdAt\n      }\n    }\n  }\n": typeof types.NodeInfoQueryDocument,
    "\n  query ListJvmSource($page: Int, $size: Int) {\n    runtimeNode {\n      runtimeNodes(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          createdAt\n          pluginId\n          labels\n        }\n      }\n      plugins {\n        id\n        name\n      }\n    }\n  }\n": typeof types.ListJvmSourceDocument,
    "\n  query RuntimeNodeCreatePluginQuery(\n    $pluginId: String\n    $runtimeNodeId: String\n  ) {\n    runtimeNode {\n      plugin(pluginId: $pluginId) {\n        id\n        page {\n          pageName\n        }\n      }\n      runtimeNode(id: $runtimeNodeId) {\n        id\n        configuration\n        name\n      }\n    }\n  }\n": typeof types.RuntimeNodeCreatePluginQueryDocument,
    "\n  query RuntimeNodePluginQuery {\n    runtimeNode {\n      plugins {\n        id\n        name\n        page {\n          pageName\n        }\n      }\n    }\n  }\n": typeof types.RuntimeNodePluginQueryDocument,
    "\n  query RuntimeNodePluginDetailQuery($pluginId: String) {\n    runtimeNode {\n      plugin(pluginId: $pluginId) {\n        description\n      }\n    }\n  }\n": typeof types.RuntimeNodePluginDetailQueryDocument,
    "\n  query ToolchainBundleQuery($page: Int, $size: Int) {\n    toolchain {\n      toolchainBundles(page: $page, size: $size) {\n        result {\n          id\n          name\n          createdAt\n          jattachTag\n          arthasTag\n        }\n      }\n    }\n  }\n": typeof types.ToolchainBundleQueryDocument,
    "\n  query QueryToolchainVersions {\n    arthas: toolchain {\n      toolchainItems(type: \"ARTHAS\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n    jattach: toolchain {\n      toolchainItems(type: \"JATTACH\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n    httpClient: toolchain {\n      toolchainItems(type: \"HTTP_CLIENT\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n  }\n": typeof types.QueryToolchainVersionsDocument,
    "\n  mutation CreateToolchainBundle($vo: ToolchainBundleModifyVO) {\n    toolchain {\n      createToolchainBundle(vo: $vo) {\n        id\n      }\n    }\n  }\n": typeof types.CreateToolchainBundleDocument,
    "\n  query ToolchainItemsQuery($type: ToolchainType!, $page: Int, $size: Int) {\n    toolchain {\n      toolchainItemsV2(type: $type, page: $page, size: $size) {\n        totalPages\n        result {\n          type\n          tag\n          createdAt\n          isArmCached\n          isX86Cached\n        }\n      }\n    }\n  }\n": typeof types.ToolchainItemsQueryDocument,
    "\n  mutation UpdateOrCreateToolchainItem($po: ToolchainItemModify) {\n    toolchain {\n      updateOrCreateToolchain(po: $po) {\n        id {\n          type\n        }\n      }\n    }\n  }\n": typeof types.UpdateOrCreateToolchainItemDocument,
};
const documents: Documents = {
    "\n  query QueryPolicyPermissionPlugins($id: Long!) {\n    policyPermission {\n      permission(id: $id) {\n        enhancePlugins {\n          configuration\n          pluginId\n        }\n      }\n    }\n  }\n": types.QueryPolicyPermissionPluginsDocument,
    "\n  query PolicyPermissionsQuery(\n    $subjectType: String\n    $subjectId: Long!\n    $page: Int\n    $size: Int\n    $isUser: Boolean!\n    $isRole: Boolean!\n  ) {\n    policyPermission {\n      permissions(\n        subjectType: $subjectType\n        subjectId: $subjectId\n        page: $page\n        size: $size\n      ) {\n        totalPages\n        result {\n          id\n          name\n          action\n          resource\n          conditionExpression\n          createdAt\n          description\n        }\n      }\n    }\n    user @include(if: $isUser) {\n      user(id: $subjectId) {\n        username\n        displayName\n      }\n    }\n    role @include(if: $isRole) {\n      role(id: $subjectId) {\n        name\n      }\n    }\n  }\n": types.PolicyPermissionsQueryDocument,
    "\n  query PermissionsBindQuery(\n    $subjectId: Long\n    $subjectType: String\n    $resource: String\n  ) {\n    staticPermission {\n      allBoundPermissions(\n        subjectId: $subjectId\n        subjectType: $subjectType\n        resource: $resource\n      ) {\n        action\n      }\n      listPermissionsByResource(resource: $resource) {\n        action\n        name\n      }\n    }\n  }\n": types.PermissionsBindQueryDocument,
    "\n  query SubjectPermissionsQuery(\n    $subjectId: Long!\n    $subjectType: String!\n    $page: Int\n    $size: Int\n    $isUser: Boolean!\n    $isRole: Boolean!\n  ) {\n    staticPermission {\n      permissions(\n        subjectId: $subjectId\n        subjectType: $subjectType\n        page: $page\n        size: $size\n      ) {\n        totalPages\n        result {\n          name\n          action\n          resource\n        }\n      }\n    }\n    user @include(if: $isUser) {\n      user(id: $subjectId) {\n        username\n        displayName\n      }\n    }\n    role @include(if: $isRole) {\n      role(id: $subjectId) {\n        name\n      }\n    }\n  }\n": types.SubjectPermissionsQueryDocument,
    "\n  query LogDetailQuery($id: Long!) {\n    log {\n      log(id: $id) {\n        userAgent\n        message\n        context\n      }\n    }\n  }\n": types.LogDetailQueryDocument,
    "\n  query LogEntityQuery($page: Int!, $size: Int!) {\n    log {\n      logs(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          ip\n          isSuccess\n          operation\n          time\n          username\n        }\n      }\n    }\n  }\n": types.LogEntityQueryDocument,
    "\n  query ListRuntimeNodesSimpleQuery($page: Int, $size: Int) {\n    runtimeNode {\n      runtimeNodes(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          labels\n        }\n      }\n    }\n  }\n": types.ListRuntimeNodesSimpleQueryDocument,
    "\n  query RoleBoundUserQuery($roleId: Long!, $page: Int, $size: Int) {\n    role {\n      role(id: $roleId) {\n        name\n      }\n      boundUsers(roleId: $roleId, page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          username\n          displayName\n          labels\n        }\n      }\n    }\n  }\n": types.RoleBoundUserQueryDocument,
    "\n  query ListUserWithUsernameQuery($username: String!) {\n    user {\n      searchByUsername(username: $username) {\n        result {\n          id\n          username\n          displayName\n          labels\n        }\n      }\n    }\n  }\n": types.ListUserWithUsernameQueryDocument,
    "\n  query RolePermissionDetailQuery($roleId: Long!) {\n    role {\n      role(id: $roleId) {\n        id\n        name\n        createdAt\n        description\n      }\n    }\n  }\n": types.RolePermissionDetailQueryDocument,
    "\n  query ListRoleQuery($page: Int, $size: Int) {\n    role {\n      roles(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          description\n          createdAt\n        }\n      }\n    }\n  }\n": types.ListRoleQueryDocument,
    "\n  query ListRoleWithNameQuery($name: String) {\n    role {\n      searchRoleByName(name: $name) {\n        result {\n          id\n          name\n          description\n        }\n      }\n    }\n  }\n": types.ListRoleWithNameQueryDocument,
    "\n  query UserRoleQuery($uid: Long!) {\n    role {\n      userRoles(userId: $uid) {\n        id\n        name\n        description\n      }\n    }\n  }\n": types.UserRoleQueryDocument,
    "\n  query UserDetailQuery($userId: Long!) {\n    user {\n      user(id: $userId) {\n        id\n        createdAt\n        displayName\n        username\n        labels\n      }\n    }\n  }\n": types.UserDetailQueryDocument,
    "\n  query UserListQuery($page: Int, $size: Int) {\n    user {\n      users(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          createdAt\n          displayName\n          username\n          labels\n        }\n      }\n    }\n  }\n": types.UserListQueryDocument,
    "\n  query UserQuery($id: Long!) {\n    user {\n      user(id: $id) {\n        id\n        labels\n        username\n        displayName\n      }\n    }\n  }\n": types.UserQueryDocument,
    "\n  query ToolchainBundleQueryForAttach {\n    toolchain {\n      toolchainBundles {\n        result {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.ToolchainBundleQueryForAttachDocument,
    "\n  query NodeInfoQuery($id: String!) {\n    runtimeNode {\n      runtimeNode(id: $id) {\n        name\n        labels\n        createdAt\n      }\n    }\n  }\n": types.NodeInfoQueryDocument,
    "\n  query ListJvmSource($page: Int, $size: Int) {\n    runtimeNode {\n      runtimeNodes(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          createdAt\n          pluginId\n          labels\n        }\n      }\n      plugins {\n        id\n        name\n      }\n    }\n  }\n": types.ListJvmSourceDocument,
    "\n  query RuntimeNodeCreatePluginQuery(\n    $pluginId: String\n    $runtimeNodeId: String\n  ) {\n    runtimeNode {\n      plugin(pluginId: $pluginId) {\n        id\n        page {\n          pageName\n        }\n      }\n      runtimeNode(id: $runtimeNodeId) {\n        id\n        configuration\n        name\n      }\n    }\n  }\n": types.RuntimeNodeCreatePluginQueryDocument,
    "\n  query RuntimeNodePluginQuery {\n    runtimeNode {\n      plugins {\n        id\n        name\n        page {\n          pageName\n        }\n      }\n    }\n  }\n": types.RuntimeNodePluginQueryDocument,
    "\n  query RuntimeNodePluginDetailQuery($pluginId: String) {\n    runtimeNode {\n      plugin(pluginId: $pluginId) {\n        description\n      }\n    }\n  }\n": types.RuntimeNodePluginDetailQueryDocument,
    "\n  query ToolchainBundleQuery($page: Int, $size: Int) {\n    toolchain {\n      toolchainBundles(page: $page, size: $size) {\n        result {\n          id\n          name\n          createdAt\n          jattachTag\n          arthasTag\n        }\n      }\n    }\n  }\n": types.ToolchainBundleQueryDocument,
    "\n  query QueryToolchainVersions {\n    arthas: toolchain {\n      toolchainItems(type: \"ARTHAS\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n    jattach: toolchain {\n      toolchainItems(type: \"JATTACH\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n    httpClient: toolchain {\n      toolchainItems(type: \"HTTP_CLIENT\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n  }\n": types.QueryToolchainVersionsDocument,
    "\n  mutation CreateToolchainBundle($vo: ToolchainBundleModifyVO) {\n    toolchain {\n      createToolchainBundle(vo: $vo) {\n        id\n      }\n    }\n  }\n": types.CreateToolchainBundleDocument,
    "\n  query ToolchainItemsQuery($type: ToolchainType!, $page: Int, $size: Int) {\n    toolchain {\n      toolchainItemsV2(type: $type, page: $page, size: $size) {\n        totalPages\n        result {\n          type\n          tag\n          createdAt\n          isArmCached\n          isX86Cached\n        }\n      }\n    }\n  }\n": types.ToolchainItemsQueryDocument,
    "\n  mutation UpdateOrCreateToolchainItem($po: ToolchainItemModify) {\n    toolchain {\n      updateOrCreateToolchain(po: $po) {\n        id {\n          type\n        }\n      }\n    }\n  }\n": types.UpdateOrCreateToolchainItemDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query QueryPolicyPermissionPlugins($id: Long!) {\n    policyPermission {\n      permission(id: $id) {\n        enhancePlugins {\n          configuration\n          pluginId\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').QueryPolicyPermissionPluginsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PolicyPermissionsQuery(\n    $subjectType: String\n    $subjectId: Long!\n    $page: Int\n    $size: Int\n    $isUser: Boolean!\n    $isRole: Boolean!\n  ) {\n    policyPermission {\n      permissions(\n        subjectType: $subjectType\n        subjectId: $subjectId\n        page: $page\n        size: $size\n      ) {\n        totalPages\n        result {\n          id\n          name\n          action\n          resource\n          conditionExpression\n          createdAt\n          description\n        }\n      }\n    }\n    user @include(if: $isUser) {\n      user(id: $subjectId) {\n        username\n        displayName\n      }\n    }\n    role @include(if: $isRole) {\n      role(id: $subjectId) {\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').PolicyPermissionsQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PermissionsBindQuery(\n    $subjectId: Long\n    $subjectType: String\n    $resource: String\n  ) {\n    staticPermission {\n      allBoundPermissions(\n        subjectId: $subjectId\n        subjectType: $subjectType\n        resource: $resource\n      ) {\n        action\n      }\n      listPermissionsByResource(resource: $resource) {\n        action\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').PermissionsBindQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SubjectPermissionsQuery(\n    $subjectId: Long!\n    $subjectType: String!\n    $page: Int\n    $size: Int\n    $isUser: Boolean!\n    $isRole: Boolean!\n  ) {\n    staticPermission {\n      permissions(\n        subjectId: $subjectId\n        subjectType: $subjectType\n        page: $page\n        size: $size\n      ) {\n        totalPages\n        result {\n          name\n          action\n          resource\n        }\n      }\n    }\n    user @include(if: $isUser) {\n      user(id: $subjectId) {\n        username\n        displayName\n      }\n    }\n    role @include(if: $isRole) {\n      role(id: $subjectId) {\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').SubjectPermissionsQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LogDetailQuery($id: Long!) {\n    log {\n      log(id: $id) {\n        userAgent\n        message\n        context\n      }\n    }\n  }\n"): typeof import('./graphql').LogDetailQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LogEntityQuery($page: Int!, $size: Int!) {\n    log {\n      logs(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          ip\n          isSuccess\n          operation\n          time\n          username\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').LogEntityQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListRuntimeNodesSimpleQuery($page: Int, $size: Int) {\n    runtimeNode {\n      runtimeNodes(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          labels\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ListRuntimeNodesSimpleQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RoleBoundUserQuery($roleId: Long!, $page: Int, $size: Int) {\n    role {\n      role(id: $roleId) {\n        name\n      }\n      boundUsers(roleId: $roleId, page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          username\n          displayName\n          labels\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').RoleBoundUserQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListUserWithUsernameQuery($username: String!) {\n    user {\n      searchByUsername(username: $username) {\n        result {\n          id\n          username\n          displayName\n          labels\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ListUserWithUsernameQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RolePermissionDetailQuery($roleId: Long!) {\n    role {\n      role(id: $roleId) {\n        id\n        name\n        createdAt\n        description\n      }\n    }\n  }\n"): typeof import('./graphql').RolePermissionDetailQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListRoleQuery($page: Int, $size: Int) {\n    role {\n      roles(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          description\n          createdAt\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ListRoleQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListRoleWithNameQuery($name: String) {\n    role {\n      searchRoleByName(name: $name) {\n        result {\n          id\n          name\n          description\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ListRoleWithNameQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserRoleQuery($uid: Long!) {\n    role {\n      userRoles(userId: $uid) {\n        id\n        name\n        description\n      }\n    }\n  }\n"): typeof import('./graphql').UserRoleQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserDetailQuery($userId: Long!) {\n    user {\n      user(id: $userId) {\n        id\n        createdAt\n        displayName\n        username\n        labels\n      }\n    }\n  }\n"): typeof import('./graphql').UserDetailQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserListQuery($page: Int, $size: Int) {\n    user {\n      users(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          createdAt\n          displayName\n          username\n          labels\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').UserListQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserQuery($id: Long!) {\n    user {\n      user(id: $id) {\n        id\n        labels\n        username\n        displayName\n      }\n    }\n  }\n"): typeof import('./graphql').UserQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ToolchainBundleQueryForAttach {\n    toolchain {\n      toolchainBundles {\n        result {\n          id\n          name\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ToolchainBundleQueryForAttachDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NodeInfoQuery($id: String!) {\n    runtimeNode {\n      runtimeNode(id: $id) {\n        name\n        labels\n        createdAt\n      }\n    }\n  }\n"): typeof import('./graphql').NodeInfoQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListJvmSource($page: Int, $size: Int) {\n    runtimeNode {\n      runtimeNodes(page: $page, size: $size) {\n        totalPages\n        result {\n          id\n          name\n          createdAt\n          pluginId\n          labels\n        }\n      }\n      plugins {\n        id\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').ListJvmSourceDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RuntimeNodeCreatePluginQuery(\n    $pluginId: String\n    $runtimeNodeId: String\n  ) {\n    runtimeNode {\n      plugin(pluginId: $pluginId) {\n        id\n        page {\n          pageName\n        }\n      }\n      runtimeNode(id: $runtimeNodeId) {\n        id\n        configuration\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').RuntimeNodeCreatePluginQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RuntimeNodePluginQuery {\n    runtimeNode {\n      plugins {\n        id\n        name\n        page {\n          pageName\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').RuntimeNodePluginQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RuntimeNodePluginDetailQuery($pluginId: String) {\n    runtimeNode {\n      plugin(pluginId: $pluginId) {\n        description\n      }\n    }\n  }\n"): typeof import('./graphql').RuntimeNodePluginDetailQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ToolchainBundleQuery($page: Int, $size: Int) {\n    toolchain {\n      toolchainBundles(page: $page, size: $size) {\n        result {\n          id\n          name\n          createdAt\n          jattachTag\n          arthasTag\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ToolchainBundleQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query QueryToolchainVersions {\n    arthas: toolchain {\n      toolchainItems(type: \"ARTHAS\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n    jattach: toolchain {\n      toolchainItems(type: \"JATTACH\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n    httpClient: toolchain {\n      toolchainItems(type: \"HTTP_CLIENT\", page: 0, size: 10) {\n        result {\n          id {\n            tag\n          }\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').QueryToolchainVersionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateToolchainBundle($vo: ToolchainBundleModifyVO) {\n    toolchain {\n      createToolchainBundle(vo: $vo) {\n        id\n      }\n    }\n  }\n"): typeof import('./graphql').CreateToolchainBundleDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ToolchainItemsQuery($type: ToolchainType!, $page: Int, $size: Int) {\n    toolchain {\n      toolchainItemsV2(type: $type, page: $page, size: $size) {\n        totalPages\n        result {\n          type\n          tag\n          createdAt\n          isArmCached\n          isX86Cached\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ToolchainItemsQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateOrCreateToolchainItem($po: ToolchainItemModify) {\n    toolchain {\n      updateOrCreateToolchain(po: $po) {\n        id {\n          type\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').UpdateOrCreateToolchainItemDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
