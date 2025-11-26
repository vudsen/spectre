import type { DialogConfig } from '@/components/DialogProvider/ConfirmDialog.tsx'

type Listener<T> = (e: T) => void

interface Receiver<T> {
  addElement: (e: T) => void
  addElementAddListener: (listener: Listener<T>) => void
}

function SingleElementQueue(): Receiver<DialogConfig> {
  const listeners: Array<Listener<DialogConfig>> = []
  return {
    addElement(e) {
      for (const listener of listeners) {
        listener(e)
      }
    },
    addElementAddListener: (listener) => {
      listeners.push(listener)
    },
  }
}

let globalDialogReceiver: Receiver<DialogConfig> | undefined = undefined

export const getDialogQueue = () => {
  if (globalDialogReceiver) {
    return globalDialogReceiver
  }
  globalDialogReceiver = SingleElementQueue()
  return globalDialogReceiver
}
