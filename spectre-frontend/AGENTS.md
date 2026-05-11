# Agent

当你开发前端项目时，需要注意：

- 使用 nextui 作为组件库
- 当你写完代码后，先调用 `pnpm run lint` 来自动解决格式问题，而不是尝试自己解决。之后再调用 `pnpm run check` 来检查是否有语法错误。

## 关于表单组件

你需要使用 `react-hook-form` 来维护表单，项目内已经在 `src/components/validation` 中准备好了所有需要的组件，
如果你还需要额外的组件，请先和用户确认后再创建。

使用示例：

```tsx
import { useForm } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import {
  addToast,
  Button,
} from '@heroui/react'

type Values = {
  id?: string
  name: string
  description?: string | null
}


const MyForm: React.FC = () => {
  const { control, trigger, getValues } = useForm<Values>()
  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    setLoading(true)
    try {
      await createRole(values)
      addToast({ title: '保存成功', color: 'success' })
      invoke_save_api_here({
        id: values.id,
        name: values.name,
        description: values.description,
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <ControlledInput
        control={control}
        name="name"
        rules={{ required: true }}
        inputProps={{ label: '角色名称', isRequired: !isUpdate }}
      />
      <ControlledInput
        control={control}
        name="description"
        inputProps={{
          label: '描述',
        }}
      />
      <Button color="primary" isLoading={loading} onPress={onSave}>
        保存
      </Button>
    </div>
  )
}
```

必须参考这个示例编写，不能丢掉例如 `表单校验`、`loading` 以及 `toast` 提示。

## 关于 graphql

schema 路径: `spectre-frontend/src/graphql/generated/schema.graphql`

查询示例:

```typescript
import { graphql } from '@/graphql/generated'
import { execute } from '@/graphql/execute.ts'
import useGraphQL from '@/hook/useGraphQL.ts'

// 1. 先声明查询语句
const PermissionsBindQuery = graphql(`
  query PermissionsBindQuery($resource: String!) {
    permission {
      listPermissionsByResource(resource: $resource) {
        action
        name
      }
    }
  }
`)

execute(PermissionsBindQuery, {
  subjectId: "foo",
  subjectType: "bar",
  resource: "...",
})
  .then((r) => {
    // ...
  })

// or use hook
const { result, isLoading } = useGraphQL(ListJvmSource, page)
```

当你需要获取结果的类型时:

```typescript
import type { DocumentResult } from '@/graphql/execute.ts'

type PermissionResult = DocumentResult<
  typeof PermissionsBindQuery
>['permission']['listPermissionsByResource'][number]
```

## 国际化

禁止直接在代码中硬编码文字(专有名词除外)，你必须在 `spectre-frontend/src/i18n` 中提前准备好占位符，然后在代码中使用。

你可以只提供一种翻译，例如仅提供中文翻译，英文翻译提供对应占位符，让用户自己翻译。