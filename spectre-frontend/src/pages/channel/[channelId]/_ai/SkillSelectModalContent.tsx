import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from '@heroui/react'
import React, { useCallback, useEffect, useState } from 'react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import { listSkills, type SkillDTO } from '@/api/impl/ai.ts'
import { useDispatch, useSelector } from 'react-redux'
import { updateChannelContext } from '@/store/channelSlice.ts'
import type { RootState } from '@/store'
import clsx from 'clsx'

interface SkillSelectModalContentProps {
  onClose: () => void
}

const SkillSelectModalContent: React.FC<SkillSelectModalContentProps> = ({
  onClose,
}) => {
  const dispatch = useDispatch()
  const selectedSkill = useSelector<RootState, string | undefined>(
    (state) => state.channel.context.selectedSkill?.id,
  )
  const [skills, setSkills] = useState<SkillDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const [previewSkill, setPreviewSkill] = useState<SkillDTO | undefined>(
    undefined,
  )

  const loadSkills = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    try {
      const data = await listSkills()
      setSkills(data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '技能加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSkills().then()
  }, [loadSkills])

  const selectSkill = (skill: SkillDTO) => {
    dispatch(
      updateChannelContext({
        selectedSkill: skill,
      }),
    )
    setPreviewSkill(undefined)
    onClose()
  }

  const closePreview = () => {
    setPreviewSkill(undefined)
  }

  return (
    <>
      <ModalHeader>可用技能</ModalHeader>
      <ModalBody className="min-h-74 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="space-y-2 py-2">
            <div className="text-danger text-sm">{error}</div>
            <Button size="sm" variant="flat" onPress={loadSkills}>
              重试
            </Button>
          </div>
        ) : null}

        {!isLoading && !error && skills.length === 0 ? (
          <div className="text-default-500 py-2 text-sm">暂无可用技能</div>
        ) : null}

        {!isLoading && !error ? (
          <div className="flex flex-wrap justify-center">
            {skills.map((skill) => (
              <Card
                key={skill.id}
                isPressable
                onPress={() => setPreviewSkill(skill)}
                className={clsx(
                  skill.id === selectedSkill
                    ? 'border-primary bg-primary-50 border'
                    : 'border-default-200 border',
                  'ml-8 w-72',
                )}
              >
                <CardBody className="flex flex-row items-center gap-3 p-3">
                  <div className="bg-default-100 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <SvgIcon icon={ChannelIcon.SKILL} size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-primary text-sm font-semibold">
                      {skill.name}
                    </div>
                    <div className="text-default-500 overflow-hidden text-xs text-ellipsis whitespace-nowrap">
                      {skill.description}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={onClose} color="danger">
          关闭
        </Button>
      </ModalFooter>
      <Modal
        isOpen={!!previewSkill}
        onOpenChange={(open) => !open && closePreview()}
      >
        <ModalContent>
          <ModalHeader className="text-primary">
            {previewSkill?.name}
          </ModalHeader>
          <ModalBody>
            <div className="text-sm">
              <span>创建者</span>:{' '}
              <span className="text-default-500">{previewSkill?.creator}</span>
            </div>
            <div className="text-sm break-words whitespace-pre-wrap">
              描述:{' '}
              <span className="text-default-500">
                {previewSkill?.description}
              </span>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closePreview} color="danger">
              取消
            </Button>
            <Button
              color="primary"
              onPress={() =>
                previewSkill ? selectSkill(previewSkill) : undefined
              }
            >
              选择技能
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default SkillSelectModalContent
