import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { clearUserInfo, type UserInfo } from '@/store/sessionSlice.ts'
import React, { useCallback } from 'react'
import {
  addToast,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalContent,
  useDisclosure,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { logout } from '@/api/impl/auth.ts'
import { useNavigate } from 'react-router'
import { showDialog } from '@/common/util.ts'
import { modifyPassword } from '@/api/impl/user.ts'
import ModifyPasswordModalContent, {
  type ModifyPasswordData,
} from '@/components/ModifyPasswordModalContent.tsx'

const UserDisplay: React.FC = () => {
  const user = useSelector<RootState, UserInfo | undefined>(
    (state) => state.session.user,
  )
  const dispatch = useDispatch()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const nav = useNavigate()
  const doLogout = () => {
    showDialog({
      title: '登出',
      message: '确认登出吗?',
      color: 'danger',
      onConfirm: async () => {
        await logout()
        addToast({
          title: '登出成功',
          color: 'success',
        })
        dispatch(clearUserInfo())
        nav('/login')
      },
    })
  }

  const onModify = async () => {
    await logout()
    addToast({
      title: '登出成功',
      color: 'success',
    })
    dispatch(clearUserInfo())
    nav('/login')
  }

  const sendModifyPasswordReq = useCallback((data: ModifyPasswordData) => {
    return modifyPassword({
      oldPassword: data.oldPassword!,
      newPassword: data.newPassword,
    })
  }, [])

  if (!user) {
    return null
  }
  return (
    <div className="rounded-t-medium box-border flex w-full items-center justify-between p-1 px-2 py-3">
      <div className="flex items-center">
        <div className="bg-default-300 h-8 w-8 rounded-[50%] text-center leading-8">
          {user.username.charAt(0)}
        </div>
        <div className="ml-2 flex flex-col items-start">
          <span className="text-base">{user.displayName ?? user.username}</span>
          <span className="text-default-500 text-sm font-light">
            {user.username}
          </span>
        </div>
      </div>
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly variant="light">
            <SvgIcon icon={Icon.VERTICAL_DOTS} size={24} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="User session selections">
          <DropdownItem key="modify-password" onPress={onOpen}>
            修改密码
          </DropdownItem>
          <DropdownItem
            key="logout"
            color="danger"
            className="text-danger"
            onPress={doLogout}
          >
            登出
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <ModifyPasswordModalContent
              userId=""
              onClose={onClose}
              showOldPasswordInput
              modifyPassword={sendModifyPasswordReq}
              onModified={onModify}
            />
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default UserDisplay
