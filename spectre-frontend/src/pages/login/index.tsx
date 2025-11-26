import type { SyntheticEvent } from 'react'
import React, { useState } from 'react'
import { addToast, Button, Card, CardBody, CardHeader } from '@heroui/react'
import { useForm } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import { login } from '@/api/impl/auth.ts'
import { useNavigate } from 'react-router'
import { showDialog } from '@/common/util.ts'
import { useDispatch } from 'react-redux'
import { saveUserInfo } from '@/store/sessionSlice'

type values = {
  username: string
  password: string
}

const LoginPage: React.FC = () => {
  const { control, trigger, getValues } = useForm<values>()
  const [isLoading, setLoading] = useState(false)
  const nav = useNavigate()
  const dispatch = useDispatch()

  const onLogin = async (e: SyntheticEvent) => {
    e.preventDefault()
    if (!(await trigger())) {
      return
    }
    setLoading(true)
    try {
      const values = getValues()
      const uid = await login(values.username, values.password)
      addToast({
        title: '登录成功!',
        color: 'success',
      })
      dispatch(
        saveUserInfo({
          userId: uid,
          username: values.username,
        }),
      )
      nav('/')
    } catch (e: unknown) {
      showDialog({
        title: '登录失败',
        color: 'danger',
        message: (e as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex h-screen items-center justify-center">
      <Card classNames={{ base: 'w-128 p-6' }}>
        <CardHeader className="justify-center">
          <div className="spectre-heading">登录</div>
        </CardHeader>
        <CardBody>
          <form className="space-y-3" onSubmit={onLogin}>
            <ControlledInput
              rules={{ required: true }}
              control={control}
              name="username"
              inputProps={{
                size: 'sm',
                isRequired: true,
                label: '用户名',
              }}
            />
            <ControlledInput
              rules={{ required: true }}
              control={control}
              name="password"
              inputProps={{
                size: 'sm',
                isRequired: true,
                type: 'password',
                label: '密码',
              }}
            />
            <Button
              color="primary"
              variant="shadow"
              className="my-4 w-full"
              type="submit"
              isLoading={isLoading}
            >
              登录
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

export default LoginPage
