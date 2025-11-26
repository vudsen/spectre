import ControlledInput from '@/components/validation/ControlledInput.tsx'
import LabelEditor from '@/components/LabelEditor'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createUser, updateUser, type UserPO } from '@/api/impl/user.ts'
import { graphql } from '@/graphql/generated'
import { execute } from '@/graphql/execute.ts'
import {
  addToast,
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
} from '@heroui/react'
import useCrumb from '@/hook/useCrumb.ts'
import { useNavigate } from 'react-router'

const UserQuery = graphql(`
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
`)

type Values = {
  username: string
  password: string
  confirmPassword: string
  displayName?: string | null
  labels: Record<string, string>
}

interface UserModifyPage0Props {
  oldUser?: UserPO
}

const UserModifyPage0: React.FC<UserModifyPage0Props> = (props) => {
  const { control, trigger, getValues, setError } = useForm<Values>({
    defaultValues: props.oldUser,
  })
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()
  const isUpdate = !!props.oldUser
  const header = isUpdate ? '更新用户' : '创建用户'

  useCrumb(
    useMemo(() => {
      return [
        {
          name: '用户',
          href: '/permission/user',
        },
        {
          name: header,
        },
      ]
    }, [header]),
  )

  const onSave = useCallback(async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    if (values.password !== values.confirmPassword) {
      setError('confirmPassword', { message: '两次输入的密码不一致' })
      return
    }
    const oldUser = props.oldUser
    try {
      setSubmitting(true)
      if (oldUser) {
        await updateUser({
          id: oldUser.id!,
          displayName: values.displayName,
          labels: values.labels,
        })
        addToast({
          title: '更新成功',
          color: 'success',
        })
      } else {
        await createUser({
          username: values.username,
          password: values.password,
          displayName: values.displayName,
          labels: values.labels,
        })
        addToast({
          title: '创建成功',
          color: 'success',
        })
      }
      nav('/permission/user')
    } finally {
      setSubmitting(false)
    }
  }, [getValues, nav, props.oldUser, setError, trigger])

  return (
    <div className="space-y-3 px-6">
      <div className="flex items-center justify-between">
        <div className="header-1">{header}</div>
        <Button color="primary" onPress={onSave} isLoading={submitting}>
          保存
        </Button>
      </div>
      <div className="text-sm">
        {isUpdate ? '更新用户' : '创建一个可以登录的用户'}
      </div>
      <Card>
        <CardHeader>
          <div className="header-2">基础信息</div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="text-sm">用户基础信息</div>
          <ControlledInput
            control={control}
            name="username"
            rules={{ required: '请输入用户名' }}
            inputProps={{
              label: '用户名',
              isDisabled: isUpdate,
              isRequired: true,
            }}
          />
          <ControlledInput
            control={control}
            name="displayName"
            inputProps={{
              label: '昵称',
            }}
          />
          {isUpdate ? null : (
            <>
              <ControlledInput
                control={control}
                name="password"
                rules={{ required: '请输入密码' }}
                inputProps={{
                  type: 'password',
                  label: '密码',
                  isRequired: true,
                }}
              />
              <ControlledInput
                control={control}
                name="confirmPassword"
                rules={{ required: '请再输入一次密码' }}
                inputProps={{
                  type: 'password',
                  label: '确认密码',
                  isRequired: true,
                }}
              />
              <div className="pb-2" />
            </>
          )}
        </CardBody>
      </Card>
      <LabelEditor
        name="labels"
        control={control}
        oldState={props.oldUser?.labels}
      />
      <div className="mb-10" />
    </div>
  )
}

const UserModifyPage: React.FC = () => {
  const uid = new URLSearchParams(location.search).get('uid')
  const [user, setUser] = useState<UserPO>()
  const [isLoading, setLoading] = useState(false)
  const [errorInfo, setErrorInfo] = useState<string | undefined>(undefined)

  useEffect(() => {
    setLoading(true)
    console.log(uid)
    if (uid) {
      execute(UserQuery, { id: uid })
        .then((r) => {
          console.log(r)
          if (r.user.user) {
            setUser(r.user.user)
          } else {
            setErrorInfo('用户不存在')
          }
        })
        .catch((_) => {
          setErrorInfo('用户不存在')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [uid])

  if (isLoading) {
    return
  }
  if (errorInfo) {
    return <Alert color="danger">{errorInfo}</Alert>
  }
  return <UserModifyPage0 oldUser={user} />
}

export default UserModifyPage
