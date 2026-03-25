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
import i18n from '@/i18n'

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
      const user = await login(values.username, values.password)
      addToast({
        title: i18n.t('hardcoded.msg_pages_login_index_001'),
        color: 'success',
      })
      dispatch(
        saveUserInfo({
          userId: user.id,
          displayName: user.displayName,
          username: user.username,
        }),
      )
      nav('/')
    } catch (e: unknown) {
      showDialog({
        title: i18n.t('hardcoded.msg_pages_login_index_002'),
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
          <div className="spectre-heading">
            {i18n.t('hardcoded.msg_pages_login_index_003')}
          </div>
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
                label: i18n.t('common.username'),
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
                label: i18n.t('hardcoded.msg_ext_form_sshconfform_015'),
              }}
            />
            <Button
              color="primary"
              variant="shadow"
              className="my-4 w-full"
              type="submit"
              isLoading={isLoading}
            >
              {i18n.t('hardcoded.msg_pages_login_index_003')}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

export default LoginPage
