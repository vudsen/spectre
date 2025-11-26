import React, { useEffect, useRef } from 'react'
import ConfirmDialog, {
  type ConfirmDialogRef,
} from '@/components/DialogProvider/ConfirmDialog.tsx'
import { getDialogQueue } from './dialogQueue'

const DialogProvider: React.FC = () => {
  const dialog = useRef<ConfirmDialogRef>(null)

  useEffect(() => {
    getDialogQueue().addElementAddListener((e) => {
      dialog.current?.showDialog(e)
    })
  }, [])

  return <ConfirmDialog ref={dialog} />
}

export default DialogProvider
