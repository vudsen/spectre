/* eslint-disable */
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Dynamic JSON Type */
  JSON: { input: string; output: string; }
  /** Labels */
  Labels: { input: any; output: any; }
  /** Long */
  Long: { input: string; output: string; }
  /** Epoch milliseconds timestamp */
  Timestamp: { input: any; output: any; }
  /** ToolchainTypes */
  ToolchainType: { input: any; output: any; }
};

export type AclPermissionEntity = {
  __typename?: 'ACLPermissionEntity';
  action: Scalars['String']['output'];
  name: Scalars['String']['output'];
  resource: Scalars['String']['output'];
};

/**  只有查询，先直接用 PO */
export type LogEntityDto = {
  __typename?: 'LogEntityDTO';
  context?: Maybe<Scalars['String']['output']>;
  id: Scalars['Long']['output'];
  ip: Scalars['String']['output'];
  isSuccess: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  operation: Scalars['String']['output'];
  time: Scalars['Timestamp']['output'];
  userAgent: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type LogEntityPageResult = {
  __typename?: 'LogEntityPageResult';
  result: Array<LogEntityDto>;
  totalPages: Scalars['Int']['output'];
};

export type LogEntityQueries = {
  __typename?: 'LogEntityQueries';
  log?: Maybe<LogEntityDto>;
  logs: LogEntityPageResult;
};


export type LogEntityQueriesLogArgs = {
  id: Scalars['Long']['input'];
};


export type LogEntityQueriesLogsArgs = {
  page: Scalars['Int']['input'];
  size: Scalars['Int']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  toolchain: ToolchainMutations;
};

export type PageDescriptor = {
  __typename?: 'PageDescriptor';
  pageName: Scalars['String']['output'];
  parameters?: Maybe<Scalars['JSON']['output']>;
  usage: Scalars['String']['output'];
};

export type PolicyPermissionDto = {
  __typename?: 'PolicyPermissionDTO';
  action: Scalars['String']['output'];
  conditionExpression: Scalars['String']['output'];
  createdAt: Scalars['Timestamp']['output'];
  description?: Maybe<Scalars['String']['output']>;
  enhancePlugins: Array<PolicyPermissionEnhancePlugin>;
  id: Scalars['Long']['output'];
  name: Scalars['String']['output'];
  resource: Scalars['String']['output'];
  subjectId: Scalars['String']['output'];
  subjectType: Scalars['String']['output'];
};

export type PolicyPermissionDtoPageResult = {
  __typename?: 'PolicyPermissionDTOPageResult';
  result: Array<PolicyPermissionDto>;
  totalPages: Scalars['Int']['output'];
};

export type PolicyPermissionEnhancePlugin = {
  __typename?: 'PolicyPermissionEnhancePlugin';
  configuration: Scalars['String']['output'];
  pluginId: Scalars['String']['output'];
};

export type PolicyPermissionQueries = {
  __typename?: 'PolicyPermissionQueries';
  permission?: Maybe<PolicyPermissionDto>;
  permissions: PolicyPermissionDtoPageResult;
};


export type PolicyPermissionQueriesPermissionArgs = {
  id: Scalars['Long']['input'];
};


export type PolicyPermissionQueriesPermissionsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  subjectId: Scalars['Long']['input'];
  subjectType?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  log: LogEntityQueries;
  policyPermission: PolicyPermissionQueries;
  role: RoleQueries;
  runtimeNode: RuntimeNodeQueries;
  staticPermission: StaticPermissionQueries;
  toolchain: ToolchainItemQueries;
  user: UserQueries;
};

export type RolePo = {
  __typename?: 'RolePO';
  createdAt?: Maybe<Scalars['Timestamp']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Long']['output'];
  name: Scalars['String']['output'];
};

export type RolePageResult = {
  __typename?: 'RolePageResult';
  result: Array<RolePo>;
  totalPages?: Maybe<Scalars['Int']['output']>;
};

export type RoleQueries = {
  __typename?: 'RoleQueries';
  /**  返回已经绑定的用户 */
  boundUsers: UserPage;
  role?: Maybe<RolePo>;
  roles: RolePageResult;
  searchRoleByName: RolePageResult;
  userRoles: Array<RolePo>;
};


export type RoleQueriesBoundUsersArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  roleId: Scalars['Long']['input'];
  size?: InputMaybe<Scalars['Int']['input']>;
};


export type RoleQueriesRoleArgs = {
  id: Scalars['Long']['input'];
};


export type RoleQueriesRolesArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};


export type RoleQueriesSearchRoleByNameArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
};


export type RoleQueriesUserRolesArgs = {
  userId: Scalars['Long']['input'];
};

export type RuntimeNodeDto = {
  __typename?: 'RuntimeNodeDTO';
  configuration?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  id: Scalars['Long']['output'];
  labels: Scalars['Labels']['output'];
  name: Scalars['String']['output'];
  pluginId: Scalars['String']['output'];
};

export type RuntimeNodeModifyRequestVo = {
  configuration?: InputMaybe<Scalars['String']['input']>;
  pluginId?: InputMaybe<Scalars['String']['input']>;
};

export type RuntimeNodePage = {
  __typename?: 'RuntimeNodePage';
  result: Array<RuntimeNodeDto>;
  totalPages?: Maybe<Scalars['Int']['output']>;
};

export type RuntimeNodePluginVo = {
  __typename?: 'RuntimeNodePluginVO';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  page: PageDescriptor;
};

export type RuntimeNodeQueries = {
  __typename?: 'RuntimeNodeQueries';
  plugin?: Maybe<RuntimeNodePluginVo>;
  plugins: Array<RuntimeNodePluginVo>;
  runtimeNode?: Maybe<RuntimeNodeDto>;
  runtimeNodes: RuntimeNodePage;
};


export type RuntimeNodeQueriesPluginArgs = {
  pluginId?: InputMaybe<Scalars['String']['input']>;
};


export type RuntimeNodeQueriesRuntimeNodeArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type RuntimeNodeQueriesRuntimeNodesArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type StaticPermissionDto = {
  __typename?: 'StaticPermissionDTO';
  action: Scalars['String']['output'];
  name: Scalars['String']['output'];
  resource: Scalars['String']['output'];
  subjectId: Scalars['Long']['output'];
  subjectType: Scalars['String']['output'];
};

export type StaticPermissionDtoPageResult = {
  __typename?: 'StaticPermissionDTOPageResult';
  result: Array<StaticPermissionDto>;
  totalPages: Scalars['Int']['output'];
};

export type StaticPermissionQueries = {
  __typename?: 'StaticPermissionQueries';
  /**  列出主体下对应资源的所有权限 */
  allBoundPermissions: Array<StaticPermissionDto>;
  listPermissionsByResource: Array<AclPermissionEntity>;
  /**  列出对应主体下的所有权限，带分页 */
  permissions: StaticPermissionDtoPageResult;
};


export type StaticPermissionQueriesAllBoundPermissionsArgs = {
  resource?: InputMaybe<Scalars['String']['input']>;
  subjectId?: InputMaybe<Scalars['Long']['input']>;
  subjectType?: InputMaybe<Scalars['String']['input']>;
};


export type StaticPermissionQueriesListPermissionsByResourceArgs = {
  resource?: InputMaybe<Scalars['String']['input']>;
};


export type StaticPermissionQueriesPermissionsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  subjectId: Scalars['Long']['input'];
  subjectType?: InputMaybe<Scalars['String']['input']>;
};

export type ToolchainBundleModifyVo = {
  arthasTag?: InputMaybe<Scalars['String']['input']>;
  httpClientTag?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Long']['input']>;
  jattachTag?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type ToolchainBundlePo = {
  __typename?: 'ToolchainBundlePO';
  arthasTag: Scalars['String']['output'];
  createdAt: Scalars['Timestamp']['output'];
  id: Scalars['Long']['output'];
  jattachTag: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ToolchainBundlePage = {
  __typename?: 'ToolchainBundlePage';
  result: Array<ToolchainBundlePo>;
  totalPages: Scalars['Int']['output'];
};

export type ToolchainItemId = {
  __typename?: 'ToolchainItemId';
  tag: Scalars['String']['output'];
  type: Scalars['ToolchainType']['output'];
};

export type ToolchainItemModify = {
  armUrl?: InputMaybe<Scalars['String']['input']>;
  tag: Scalars['String']['input'];
  type: Scalars['ToolchainType']['input'];
  url: Scalars['String']['input'];
};

export type ToolchainItemPo = {
  __typename?: 'ToolchainItemPO';
  createdAt: Scalars['Timestamp']['output'];
  id: ToolchainItemId;
  url: Scalars['String']['output'];
};

export type ToolchainItemQueries = {
  __typename?: 'ToolchainItemQueries';
  toolchainBundle?: Maybe<ToolchainBundlePo>;
  toolchainBundles: ToolchainBundlePage;
  toolchainItems: ToolchainItemsPage;
  toolchainItemsV2: ToolchainItemResponseVoPageResult;
};


export type ToolchainItemQueriesToolchainBundleArgs = {
  id: Scalars['Long']['input'];
};


export type ToolchainItemQueriesToolchainBundlesArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};


export type ToolchainItemQueriesToolchainItemsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  type: Scalars['ToolchainType']['input'];
};


export type ToolchainItemQueriesToolchainItemsV2Args = {
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  type: Scalars['ToolchainType']['input'];
};

export type ToolchainItemResponseVo = {
  __typename?: 'ToolchainItemResponseVO';
  armUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  isArmCached: Scalars['Boolean']['output'];
  isX86Cached: Scalars['Boolean']['output'];
  tag: Scalars['String']['output'];
  type: Scalars['ToolchainType']['output'];
  url: Scalars['String']['output'];
};

export type ToolchainItemResponseVoPageResult = {
  __typename?: 'ToolchainItemResponseVOPageResult';
  result: Array<ToolchainItemResponseVo>;
  totalPages: Scalars['Int']['output'];
};

export type ToolchainItemsPage = {
  __typename?: 'ToolchainItemsPage';
  result: Array<ToolchainItemPo>;
  totalPages: Scalars['Int']['output'];
};

export type ToolchainMutations = {
  __typename?: 'ToolchainMutations';
  createToolchainBundle?: Maybe<ToolchainBundlePo>;
  updateOrCreateToolchain?: Maybe<ToolchainItemPo>;
};


export type ToolchainMutationsCreateToolchainBundleArgs = {
  vo?: InputMaybe<ToolchainBundleModifyVo>;
};


export type ToolchainMutationsUpdateOrCreateToolchainArgs = {
  po?: InputMaybe<ToolchainItemModify>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['Timestamp']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  id: Scalars['Long']['output'];
  /**  A kv string pair */
  labels?: Maybe<Scalars['Labels']['output']>;
  username: Scalars['String']['output'];
};

export type UserPage = {
  __typename?: 'UserPage';
  result: Array<User>;
  totalPages: Scalars['Int']['output'];
};

export type UserQueries = {
  __typename?: 'UserQueries';
  searchByUsername: UserPage;
  user?: Maybe<User>;
  users: UserPage;
};


export type UserQueriesSearchByUsernameArgs = {
  username: Scalars['String']['input'];
};


export type UserQueriesUserArgs = {
  id: Scalars['Long']['input'];
};


export type UserQueriesUsersArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryPolicyPermissionPluginsQueryVariables = Exact<{
  id: Scalars['Long']['input'];
}>;


export type QueryPolicyPermissionPluginsQuery = { __typename?: 'Query', policyPermission: { __typename?: 'PolicyPermissionQueries', permission?: { __typename?: 'PolicyPermissionDTO', enhancePlugins: Array<{ __typename?: 'PolicyPermissionEnhancePlugin', configuration: string, pluginId: string }> } | null } };

export type PolicyPermissionsQueryQueryVariables = Exact<{
  subjectType?: InputMaybe<Scalars['String']['input']>;
  subjectId: Scalars['Long']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  isUser: Scalars['Boolean']['input'];
  isRole: Scalars['Boolean']['input'];
}>;


export type PolicyPermissionsQueryQuery = { __typename?: 'Query', policyPermission: { __typename?: 'PolicyPermissionQueries', permissions: { __typename?: 'PolicyPermissionDTOPageResult', totalPages: number, result: Array<{ __typename?: 'PolicyPermissionDTO', id: string, name: string, action: string, resource: string, conditionExpression: string, createdAt: any, description?: string | null }> } }, user?: { __typename?: 'UserQueries', user?: { __typename?: 'User', username: string, displayName?: string | null } | null }, role?: { __typename?: 'RoleQueries', role?: { __typename?: 'RolePO', name: string } | null } };

export type PermissionsBindQueryQueryVariables = Exact<{
  subjectId?: InputMaybe<Scalars['Long']['input']>;
  subjectType?: InputMaybe<Scalars['String']['input']>;
  resource?: InputMaybe<Scalars['String']['input']>;
}>;


export type PermissionsBindQueryQuery = { __typename?: 'Query', staticPermission: { __typename?: 'StaticPermissionQueries', allBoundPermissions: Array<{ __typename?: 'StaticPermissionDTO', action: string }>, listPermissionsByResource: Array<{ __typename?: 'ACLPermissionEntity', action: string, name: string }> } };

export type SubjectPermissionsQueryQueryVariables = Exact<{
  subjectId: Scalars['Long']['input'];
  subjectType: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  isUser: Scalars['Boolean']['input'];
  isRole: Scalars['Boolean']['input'];
}>;


export type SubjectPermissionsQueryQuery = { __typename?: 'Query', staticPermission: { __typename?: 'StaticPermissionQueries', permissions: { __typename?: 'StaticPermissionDTOPageResult', totalPages: number, result: Array<{ __typename?: 'StaticPermissionDTO', name: string, action: string, resource: string }> } }, user?: { __typename?: 'UserQueries', user?: { __typename?: 'User', username: string, displayName?: string | null } | null }, role?: { __typename?: 'RoleQueries', role?: { __typename?: 'RolePO', name: string } | null } };

export type LogDetailQueryQueryVariables = Exact<{
  id: Scalars['Long']['input'];
}>;


export type LogDetailQueryQuery = { __typename?: 'Query', log: { __typename?: 'LogEntityQueries', log?: { __typename?: 'LogEntityDTO', userAgent: string, message?: string | null, context?: string | null } | null } };

export type LogEntityQueryQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  size: Scalars['Int']['input'];
}>;


export type LogEntityQueryQuery = { __typename?: 'Query', log: { __typename?: 'LogEntityQueries', logs: { __typename?: 'LogEntityPageResult', totalPages: number, result: Array<{ __typename?: 'LogEntityDTO', id: string, ip: string, isSuccess: boolean, operation: string, time: any, username: string }> } } };

export type ListRuntimeNodesSimpleQueryQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListRuntimeNodesSimpleQueryQuery = { __typename?: 'Query', runtimeNode: { __typename?: 'RuntimeNodeQueries', runtimeNodes: { __typename?: 'RuntimeNodePage', totalPages?: number | null, result: Array<{ __typename?: 'RuntimeNodeDTO', id: string, name: string, labels: any }> } } };

export type RoleBoundUserQueryQueryVariables = Exact<{
  roleId: Scalars['Long']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RoleBoundUserQueryQuery = { __typename?: 'Query', role: { __typename?: 'RoleQueries', role?: { __typename?: 'RolePO', name: string } | null, boundUsers: { __typename?: 'UserPage', totalPages: number, result: Array<{ __typename?: 'User', id: string, username: string, displayName?: string | null, labels?: any | null }> } } };

export type ListUserWithUsernameQueryQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type ListUserWithUsernameQueryQuery = { __typename?: 'Query', user: { __typename?: 'UserQueries', searchByUsername: { __typename?: 'UserPage', result: Array<{ __typename?: 'User', id: string, username: string, displayName?: string | null, labels?: any | null }> } } };

export type RolePermissionDetailQueryQueryVariables = Exact<{
  roleId: Scalars['Long']['input'];
}>;


export type RolePermissionDetailQueryQuery = { __typename?: 'Query', role: { __typename?: 'RoleQueries', role?: { __typename?: 'RolePO', id: string, name: string, createdAt?: any | null, description?: string | null } | null } };

export type ListRoleQueryQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListRoleQueryQuery = { __typename?: 'Query', role: { __typename?: 'RoleQueries', roles: { __typename?: 'RolePageResult', totalPages?: number | null, result: Array<{ __typename?: 'RolePO', id: string, name: string, description?: string | null, createdAt?: any | null }> } } };

export type ListRoleWithNameQueryQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListRoleWithNameQueryQuery = { __typename?: 'Query', role: { __typename?: 'RoleQueries', searchRoleByName: { __typename?: 'RolePageResult', result: Array<{ __typename?: 'RolePO', id: string, name: string, description?: string | null }> } } };

export type UserRoleQueryQueryVariables = Exact<{
  uid: Scalars['Long']['input'];
}>;


export type UserRoleQueryQuery = { __typename?: 'Query', role: { __typename?: 'RoleQueries', userRoles: Array<{ __typename?: 'RolePO', id: string, name: string, description?: string | null }> } };

export type UserDetailQueryQueryVariables = Exact<{
  userId: Scalars['Long']['input'];
}>;


export type UserDetailQueryQuery = { __typename?: 'Query', user: { __typename?: 'UserQueries', user?: { __typename?: 'User', id: string, createdAt: any, displayName?: string | null, username: string, labels?: any | null } | null } };

export type UserListQueryQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UserListQueryQuery = { __typename?: 'Query', user: { __typename?: 'UserQueries', users: { __typename?: 'UserPage', totalPages: number, result: Array<{ __typename?: 'User', id: string, createdAt: any, displayName?: string | null, username: string, labels?: any | null }> } } };

export type UserQueryQueryVariables = Exact<{
  id: Scalars['Long']['input'];
}>;


export type UserQueryQuery = { __typename?: 'Query', user: { __typename?: 'UserQueries', user?: { __typename?: 'User', id: string, labels?: any | null, username: string, displayName?: string | null } | null } };

export type ToolchainBundleQueryForAttachQueryVariables = Exact<{ [key: string]: never; }>;


export type ToolchainBundleQueryForAttachQuery = { __typename?: 'Query', toolchain: { __typename?: 'ToolchainItemQueries', toolchainBundles: { __typename?: 'ToolchainBundlePage', result: Array<{ __typename?: 'ToolchainBundlePO', id: string, name: string }> } } };

export type NodeInfoQueryQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type NodeInfoQueryQuery = { __typename?: 'Query', runtimeNode: { __typename?: 'RuntimeNodeQueries', runtimeNode?: { __typename?: 'RuntimeNodeDTO', name: string, labels: any, createdAt: any } | null } };

export type ListJvmSourceQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListJvmSourceQuery = { __typename?: 'Query', runtimeNode: { __typename?: 'RuntimeNodeQueries', runtimeNodes: { __typename?: 'RuntimeNodePage', totalPages?: number | null, result: Array<{ __typename?: 'RuntimeNodeDTO', id: string, name: string, createdAt: any, pluginId: string, labels: any }> }, plugins: Array<{ __typename?: 'RuntimeNodePluginVO', id: string, name: string }> } };

export type RuntimeNodeCreatePluginQueryQueryVariables = Exact<{
  pluginId?: InputMaybe<Scalars['String']['input']>;
  runtimeNodeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type RuntimeNodeCreatePluginQueryQuery = { __typename?: 'Query', runtimeNode: { __typename?: 'RuntimeNodeQueries', plugin?: { __typename?: 'RuntimeNodePluginVO', id: string, page: { __typename?: 'PageDescriptor', pageName: string } } | null, runtimeNode?: { __typename?: 'RuntimeNodeDTO', id: string, configuration?: string | null, name: string } | null } };

export type RuntimeNodePluginQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type RuntimeNodePluginQueryQuery = { __typename?: 'Query', runtimeNode: { __typename?: 'RuntimeNodeQueries', plugins: Array<{ __typename?: 'RuntimeNodePluginVO', id: string, name: string, page: { __typename?: 'PageDescriptor', pageName: string } }> } };

export type RuntimeNodePluginDetailQueryQueryVariables = Exact<{
  pluginId?: InputMaybe<Scalars['String']['input']>;
}>;


export type RuntimeNodePluginDetailQueryQuery = { __typename?: 'Query', runtimeNode: { __typename?: 'RuntimeNodeQueries', plugin?: { __typename?: 'RuntimeNodePluginVO', description: string } | null } };

export type ToolchainBundleQueryQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ToolchainBundleQueryQuery = { __typename?: 'Query', toolchain: { __typename?: 'ToolchainItemQueries', toolchainBundles: { __typename?: 'ToolchainBundlePage', result: Array<{ __typename?: 'ToolchainBundlePO', id: string, name: string, createdAt: any, jattachTag: string, arthasTag: string }> } } };

export type QueryToolchainVersionsQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryToolchainVersionsQuery = { __typename?: 'Query', arthas: { __typename?: 'ToolchainItemQueries', toolchainItems: { __typename?: 'ToolchainItemsPage', result: Array<{ __typename?: 'ToolchainItemPO', id: { __typename?: 'ToolchainItemId', tag: string } }> } }, jattach: { __typename?: 'ToolchainItemQueries', toolchainItems: { __typename?: 'ToolchainItemsPage', result: Array<{ __typename?: 'ToolchainItemPO', id: { __typename?: 'ToolchainItemId', tag: string } }> } }, httpClient: { __typename?: 'ToolchainItemQueries', toolchainItems: { __typename?: 'ToolchainItemsPage', result: Array<{ __typename?: 'ToolchainItemPO', id: { __typename?: 'ToolchainItemId', tag: string } }> } } };

export type CreateToolchainBundleMutationVariables = Exact<{
  vo?: InputMaybe<ToolchainBundleModifyVo>;
}>;


export type CreateToolchainBundleMutation = { __typename?: 'Mutation', toolchain: { __typename?: 'ToolchainMutations', createToolchainBundle?: { __typename?: 'ToolchainBundlePO', id: string } | null } };

export type ToolchainItemsQueryQueryVariables = Exact<{
  type: Scalars['ToolchainType']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ToolchainItemsQueryQuery = { __typename?: 'Query', toolchain: { __typename?: 'ToolchainItemQueries', toolchainItemsV2: { __typename?: 'ToolchainItemResponseVOPageResult', totalPages: number, result: Array<{ __typename?: 'ToolchainItemResponseVO', type: any, tag: string, createdAt: any, isArmCached: boolean, isX86Cached: boolean }> } } };

export type UpdateOrCreateToolchainItemMutationVariables = Exact<{
  po?: InputMaybe<ToolchainItemModify>;
}>;


export type UpdateOrCreateToolchainItemMutation = { __typename?: 'Mutation', toolchain: { __typename?: 'ToolchainMutations', updateOrCreateToolchain?: { __typename?: 'ToolchainItemPO', id: { __typename?: 'ToolchainItemId', type: any } } | null } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const QueryPolicyPermissionPluginsDocument = new TypedDocumentString(`
    query QueryPolicyPermissionPlugins($id: Long!) {
  policyPermission {
    permission(id: $id) {
      enhancePlugins {
        configuration
        pluginId
      }
    }
  }
}
    `) as unknown as TypedDocumentString<QueryPolicyPermissionPluginsQuery, QueryPolicyPermissionPluginsQueryVariables>;
export const PolicyPermissionsQueryDocument = new TypedDocumentString(`
    query PolicyPermissionsQuery($subjectType: String, $subjectId: Long!, $page: Int, $size: Int, $isUser: Boolean!, $isRole: Boolean!) {
  policyPermission {
    permissions(
      subjectType: $subjectType
      subjectId: $subjectId
      page: $page
      size: $size
    ) {
      totalPages
      result {
        id
        name
        action
        resource
        conditionExpression
        createdAt
        description
      }
    }
  }
  user @include(if: $isUser) {
    user(id: $subjectId) {
      username
      displayName
    }
  }
  role @include(if: $isRole) {
    role(id: $subjectId) {
      name
    }
  }
}
    `) as unknown as TypedDocumentString<PolicyPermissionsQueryQuery, PolicyPermissionsQueryQueryVariables>;
export const PermissionsBindQueryDocument = new TypedDocumentString(`
    query PermissionsBindQuery($subjectId: Long, $subjectType: String, $resource: String) {
  staticPermission {
    allBoundPermissions(
      subjectId: $subjectId
      subjectType: $subjectType
      resource: $resource
    ) {
      action
    }
    listPermissionsByResource(resource: $resource) {
      action
      name
    }
  }
}
    `) as unknown as TypedDocumentString<PermissionsBindQueryQuery, PermissionsBindQueryQueryVariables>;
export const SubjectPermissionsQueryDocument = new TypedDocumentString(`
    query SubjectPermissionsQuery($subjectId: Long!, $subjectType: String!, $page: Int, $size: Int, $isUser: Boolean!, $isRole: Boolean!) {
  staticPermission {
    permissions(
      subjectId: $subjectId
      subjectType: $subjectType
      page: $page
      size: $size
    ) {
      totalPages
      result {
        name
        action
        resource
      }
    }
  }
  user @include(if: $isUser) {
    user(id: $subjectId) {
      username
      displayName
    }
  }
  role @include(if: $isRole) {
    role(id: $subjectId) {
      name
    }
  }
}
    `) as unknown as TypedDocumentString<SubjectPermissionsQueryQuery, SubjectPermissionsQueryQueryVariables>;
export const LogDetailQueryDocument = new TypedDocumentString(`
    query LogDetailQuery($id: Long!) {
  log {
    log(id: $id) {
      userAgent
      message
      context
    }
  }
}
    `) as unknown as TypedDocumentString<LogDetailQueryQuery, LogDetailQueryQueryVariables>;
export const LogEntityQueryDocument = new TypedDocumentString(`
    query LogEntityQuery($page: Int!, $size: Int!) {
  log {
    logs(page: $page, size: $size) {
      totalPages
      result {
        id
        ip
        isSuccess
        operation
        time
        username
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LogEntityQueryQuery, LogEntityQueryQueryVariables>;
export const ListRuntimeNodesSimpleQueryDocument = new TypedDocumentString(`
    query ListRuntimeNodesSimpleQuery($page: Int, $size: Int) {
  runtimeNode {
    runtimeNodes(page: $page, size: $size) {
      totalPages
      result {
        id
        name
        labels
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ListRuntimeNodesSimpleQueryQuery, ListRuntimeNodesSimpleQueryQueryVariables>;
export const RoleBoundUserQueryDocument = new TypedDocumentString(`
    query RoleBoundUserQuery($roleId: Long!, $page: Int, $size: Int) {
  role {
    role(id: $roleId) {
      name
    }
    boundUsers(roleId: $roleId, page: $page, size: $size) {
      totalPages
      result {
        id
        username
        displayName
        labels
      }
    }
  }
}
    `) as unknown as TypedDocumentString<RoleBoundUserQueryQuery, RoleBoundUserQueryQueryVariables>;
export const ListUserWithUsernameQueryDocument = new TypedDocumentString(`
    query ListUserWithUsernameQuery($username: String!) {
  user {
    searchByUsername(username: $username) {
      result {
        id
        username
        displayName
        labels
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ListUserWithUsernameQueryQuery, ListUserWithUsernameQueryQueryVariables>;
export const RolePermissionDetailQueryDocument = new TypedDocumentString(`
    query RolePermissionDetailQuery($roleId: Long!) {
  role {
    role(id: $roleId) {
      id
      name
      createdAt
      description
    }
  }
}
    `) as unknown as TypedDocumentString<RolePermissionDetailQueryQuery, RolePermissionDetailQueryQueryVariables>;
export const ListRoleQueryDocument = new TypedDocumentString(`
    query ListRoleQuery($page: Int, $size: Int) {
  role {
    roles(page: $page, size: $size) {
      totalPages
      result {
        id
        name
        description
        createdAt
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ListRoleQueryQuery, ListRoleQueryQueryVariables>;
export const ListRoleWithNameQueryDocument = new TypedDocumentString(`
    query ListRoleWithNameQuery($name: String) {
  role {
    searchRoleByName(name: $name) {
      result {
        id
        name
        description
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ListRoleWithNameQueryQuery, ListRoleWithNameQueryQueryVariables>;
export const UserRoleQueryDocument = new TypedDocumentString(`
    query UserRoleQuery($uid: Long!) {
  role {
    userRoles(userId: $uid) {
      id
      name
      description
    }
  }
}
    `) as unknown as TypedDocumentString<UserRoleQueryQuery, UserRoleQueryQueryVariables>;
export const UserDetailQueryDocument = new TypedDocumentString(`
    query UserDetailQuery($userId: Long!) {
  user {
    user(id: $userId) {
      id
      createdAt
      displayName
      username
      labels
    }
  }
}
    `) as unknown as TypedDocumentString<UserDetailQueryQuery, UserDetailQueryQueryVariables>;
export const UserListQueryDocument = new TypedDocumentString(`
    query UserListQuery($page: Int, $size: Int) {
  user {
    users(page: $page, size: $size) {
      totalPages
      result {
        id
        createdAt
        displayName
        username
        labels
      }
    }
  }
}
    `) as unknown as TypedDocumentString<UserListQueryQuery, UserListQueryQueryVariables>;
export const UserQueryDocument = new TypedDocumentString(`
    query UserQuery($id: Long!) {
  user {
    user(id: $id) {
      id
      labels
      username
      displayName
    }
  }
}
    `) as unknown as TypedDocumentString<UserQueryQuery, UserQueryQueryVariables>;
export const ToolchainBundleQueryForAttachDocument = new TypedDocumentString(`
    query ToolchainBundleQueryForAttach {
  toolchain {
    toolchainBundles {
      result {
        id
        name
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ToolchainBundleQueryForAttachQuery, ToolchainBundleQueryForAttachQueryVariables>;
export const NodeInfoQueryDocument = new TypedDocumentString(`
    query NodeInfoQuery($id: String!) {
  runtimeNode {
    runtimeNode(id: $id) {
      name
      labels
      createdAt
    }
  }
}
    `) as unknown as TypedDocumentString<NodeInfoQueryQuery, NodeInfoQueryQueryVariables>;
export const ListJvmSourceDocument = new TypedDocumentString(`
    query ListJvmSource($page: Int, $size: Int) {
  runtimeNode {
    runtimeNodes(page: $page, size: $size) {
      totalPages
      result {
        id
        name
        createdAt
        pluginId
        labels
      }
    }
    plugins {
      id
      name
    }
  }
}
    `) as unknown as TypedDocumentString<ListJvmSourceQuery, ListJvmSourceQueryVariables>;
export const RuntimeNodeCreatePluginQueryDocument = new TypedDocumentString(`
    query RuntimeNodeCreatePluginQuery($pluginId: String, $runtimeNodeId: String) {
  runtimeNode {
    plugin(pluginId: $pluginId) {
      id
      page {
        pageName
      }
    }
    runtimeNode(id: $runtimeNodeId) {
      id
      configuration
      name
    }
  }
}
    `) as unknown as TypedDocumentString<RuntimeNodeCreatePluginQueryQuery, RuntimeNodeCreatePluginQueryQueryVariables>;
export const RuntimeNodePluginQueryDocument = new TypedDocumentString(`
    query RuntimeNodePluginQuery {
  runtimeNode {
    plugins {
      id
      name
      page {
        pageName
      }
    }
  }
}
    `) as unknown as TypedDocumentString<RuntimeNodePluginQueryQuery, RuntimeNodePluginQueryQueryVariables>;
export const RuntimeNodePluginDetailQueryDocument = new TypedDocumentString(`
    query RuntimeNodePluginDetailQuery($pluginId: String) {
  runtimeNode {
    plugin(pluginId: $pluginId) {
      description
    }
  }
}
    `) as unknown as TypedDocumentString<RuntimeNodePluginDetailQueryQuery, RuntimeNodePluginDetailQueryQueryVariables>;
export const ToolchainBundleQueryDocument = new TypedDocumentString(`
    query ToolchainBundleQuery($page: Int, $size: Int) {
  toolchain {
    toolchainBundles(page: $page, size: $size) {
      result {
        id
        name
        createdAt
        jattachTag
        arthasTag
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ToolchainBundleQueryQuery, ToolchainBundleQueryQueryVariables>;
export const QueryToolchainVersionsDocument = new TypedDocumentString(`
    query QueryToolchainVersions {
  arthas: toolchain {
    toolchainItems(type: "ARTHAS", page: 0, size: 10) {
      result {
        id {
          tag
        }
      }
    }
  }
  jattach: toolchain {
    toolchainItems(type: "JATTACH", page: 0, size: 10) {
      result {
        id {
          tag
        }
      }
    }
  }
  httpClient: toolchain {
    toolchainItems(type: "HTTP_CLIENT", page: 0, size: 10) {
      result {
        id {
          tag
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<QueryToolchainVersionsQuery, QueryToolchainVersionsQueryVariables>;
export const CreateToolchainBundleDocument = new TypedDocumentString(`
    mutation CreateToolchainBundle($vo: ToolchainBundleModifyVO) {
  toolchain {
    createToolchainBundle(vo: $vo) {
      id
    }
  }
}
    `) as unknown as TypedDocumentString<CreateToolchainBundleMutation, CreateToolchainBundleMutationVariables>;
export const ToolchainItemsQueryDocument = new TypedDocumentString(`
    query ToolchainItemsQuery($type: ToolchainType!, $page: Int, $size: Int) {
  toolchain {
    toolchainItemsV2(type: $type, page: $page, size: $size) {
      totalPages
      result {
        type
        tag
        createdAt
        isArmCached
        isX86Cached
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ToolchainItemsQueryQuery, ToolchainItemsQueryQueryVariables>;
export const UpdateOrCreateToolchainItemDocument = new TypedDocumentString(`
    mutation UpdateOrCreateToolchainItem($po: ToolchainItemModify) {
  toolchain {
    updateOrCreateToolchain(po: $po) {
      id {
        type
      }
    }
  }
}
    `) as unknown as TypedDocumentString<UpdateOrCreateToolchainItemMutation, UpdateOrCreateToolchainItemMutationVariables>;