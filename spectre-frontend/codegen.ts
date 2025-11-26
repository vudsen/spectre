import type { CodegenConfig } from '@graphql-codegen/cli'

declare let process: {
  env: {
    VITE_GRAPHQL_ENDPOINT: string
    GRAPHQL_AUTHORIZATION_TOKEN: string
  }
}

const config: CodegenConfig = {
  schema: process.env.VITE_GRAPHQL_ENDPOINT,
  customFetch: (url, options) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: process.env.GRAPHQL_AUTHORIZATION_TOKEN,
      },
    })
  },
  documents: ['src/**/*.tsx'],
  ignoreNoDocuments: true,
  generates: {
    './src/graphql/generated/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        scalars: {
          JSON: 'string',
          Attributes: 'Record<string, string>',
          Long: 'string',
        },
      },
      hooks: {
        beforeOneFileWrite(path, content) {
          if (typeof path !== 'string' || typeof content !== 'string') {
            return content
          }
          if (
            path.endsWith('graphql.ts') ||
            path.endsWith('fragment-masking.ts')
          ) {
            return content.replaceAll('import', 'import type')
          }
          return content
        },
      },
    },
    './src/graphql/generated/schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
      },
    },
  },
}

export default config
