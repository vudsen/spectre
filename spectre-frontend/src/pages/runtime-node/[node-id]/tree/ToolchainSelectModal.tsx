import { type ChangeEvent, useEffect } from 'react'
import React, { useState } from 'react'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react'
import { graphql } from '@/graphql/generated'
import type { JvmTreeNodeDTO } from '@/api/impl/runtime-node.ts'
import { type DocumentResult, execute } from '@/graphql/execute.ts'
import { handleError } from '@/common/util.ts'

interface ToolchainSelectModalProps {
  isOpen: boolean
  onOpenChange: () => void
  onSelect: (bundleId: string) => void
  currentNode?: JvmTreeNodeDTO
}

interface MyModalContentProps {
  currentNode?: JvmTreeNodeDTO
  onClose: () => void
  onSelect: (bundleId: string) => void
}

const ToolchainBundleQueryForAttach = graphql(`
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
`)

const MyModalContent: React.FC<MyModalContentProps> = (props) => {
  const [isLoading, setLoading] = useState(true)
  const [bundleId, setBundleId] = useState<string[]>([])
  const [result, setResult] =
    useState<DocumentResult<typeof ToolchainBundleQueryForAttach>>()
  const bundles = result?.toolchain.toolchainBundles.result ?? []
  const [errorMsg, setErrorMsg] = useState<undefined | string>()

  useEffect(() => {
    execute(ToolchainBundleQueryForAttach)
      .then((r) => {
        setResult(r)
        const bundles = r.toolchain.toolchainBundles.result
        if (bundles.length > 0) {
          setBundleId([r.toolchain.toolchainBundles.result[0].id])
        }
      })
      .catch((e) => handleError(e))
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setBundleId([e.target.value])
  }

  const onConfirm = () => {
    if (bundleId.length === 0) {
      setErrorMsg('请选择一个工具包')
      return
    }
    props.onSelect(bundleId[0])
  }

  return (
    <>
      <ModalHeader className="w-9/12">
        <span className="truncate">
          连接到 {props.currentNode?.name ?? 'JVM'}
        </span>
      </ModalHeader>
      <ModalBody>
        <Select
          label="工具包"
          isLoading={isLoading}
          onChange={onChange}
          selectedKeys={bundleId}
          errorMessage={errorMsg}
          isInvalid={!!errorMsg}
        >
          {bundles.map((bundle) => (
            <SelectItem key={bundle.id}>{bundle.name}</SelectItem>
          ))}
        </Select>
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="light" onPress={props.onClose}>
          关闭
        </Button>
        <Button color="primary" onPress={onConfirm}>
          确定
        </Button>
      </ModalFooter>
    </>
  )
}

const ToolchainSelectModal: React.FC<ToolchainSelectModalProps> = (props) => {
  return (
    <Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <MyModalContent
            onClose={onClose}
            onSelect={props.onSelect}
            currentNode={props.currentNode}
          />
        )}
      </ModalContent>
    </Modal>
  )
}

export default ToolchainSelectModal
