import { Button, Drawer, DrawerContent, useDisclosure } from '@heroui/react'
import PermissionsDrawerContent, {
  type ACLPermissionEntityWithState,
} from '@/components/page/PermissionsList/PermissionsDrawerContent.tsx'
import ModifyPermissionDrawerContent from '@/components/page/PermissionsList/ModifyPermissionDrawerContent.tsx'
import React, { useImperativeHandle, useState } from 'react'

interface PermissionModifyControlProps {
  subjectId: string
  subjectType: string
  ref: React.RefObject<PermissionModifyControlRef | null>
  onModified: () => void
}

type OldState = {
  id: string
  name: string
  resource: string
  action: string
  conditionExpression: string
  description?: string | null
}

export interface PermissionModifyControlRef {
  onModify: (oldState: OldState) => void
}

const PermissionModifyControl: React.FC<PermissionModifyControlProps> = (
  props,
) => {
  const permissionBindDrawerClosure = useDisclosure()
  const modifyPermissionDrawer = useDisclosure()
  const [oldPerm, setOldPerm] = useState<OldState>()
  const [currentEntity, setCurrentEntity] =
    useState<ACLPermissionEntityWithState>()

  const onRequireBind = (entity: ACLPermissionEntityWithState) => {
    setCurrentEntity(entity)
    setOldPerm(undefined)
    modifyPermissionDrawer.onOpenChange()
  }

  useImperativeHandle(props.ref, () => ({
    onModify(oldState) {
      setOldPerm(oldState)
      setCurrentEntity({
        ...oldState,
        code: `${oldState.resource}:${oldState.action}`,
      })
      modifyPermissionDrawer.onOpenChange()
    },
  }))

  return (
    <>
      <Button
        color="primary"
        variant="bordered"
        size="sm"
        onPress={permissionBindDrawerClosure.onOpen}
      >
        新增
      </Button>
      <Drawer
        size="5xl"
        isOpen={permissionBindDrawerClosure.isOpen}
        onOpenChange={permissionBindDrawerClosure.onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <PermissionsDrawerContent
              onRequireBind={onRequireBind}
              subjectId={props.subjectId}
              subjectType={props.subjectType}
              onClose={onClose}
            />
          )}
        </DrawerContent>
      </Drawer>
      <Drawer
        isOpen={modifyPermissionDrawer.isOpen}
        onOpenChange={modifyPermissionDrawer.onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <ModifyPermissionDrawerContent
              onModified={props.onModified}
              permission={currentEntity!}
              oldPermission={oldPerm}
              permissionName={currentEntity!.name}
              subjectId={props.subjectId}
              onClose={onClose}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default PermissionModifyControl
