import React, { useEffect, useState } from 'react'
import { Card, CardBody, Link } from '@heroui/react'
import clsx from 'clsx'
import { queryCurrentInitStep } from '@/api/impl/sys-conf.ts'

interface StepProps {
  number: number
  currentStep: number
}

const Step: React.FC<StepProps> = (props) => {
  return (
    <div
      className={clsx('mr-3 h-6 w-6 rounded-full text-center leading-6', {
        'bg-primary text-white': props.currentStep === props.number,
        'bg-default': props.currentStep < props.number,
        'bg-success text-white': props.currentStep > props.number,
      })}
    >
      {props.number + 1}
    </div>
  )
}

type MyStep = {
  title: string
  message: string
  goal: string
}

const steps: MyStep[] = [
  {
    title: '上传工具包',
    message:
      'Spectre 需要借助外部工具才能正常使用，该步骤为可选，Spectre 会在使用到这些工具时，自动从指定的 Url 下载。如果在离线环境下，请手动上传工具包。',
    goal: '为 Arthas 手动上传工具包',
  },
  {
    title: '创建运行节点',
    message:
      '运行节点是一个抽象概念，任何可以运行 JVM 的东西都可以是一个"运行节点"，例如 一个 SSH 远程服务器、Docker 以及 Kubernetes。通过运行节点，Spectre 将为你过滤出所有可用的 JVM 以便进行进一步操作',
    goal: '创建一个测试节点',
  },
  {
    title: '连接到 JVM',
    message: '你已经完成了所有基础内容，现在可以直接连接到 JVM 了!',
    goal: '连接到任意 JVM',
  },
]

interface StepDisplayProps {
  step: MyStep
  index: number
  currentStep: number
}

const StepDisplay: React.FC<StepDisplayProps> = ({
  step,
  index,
  currentStep,
}) => {
  const isFinished = currentStep > index
  return (
    <div>
      <div
        className={clsx(
          'flex items-center',
          currentStep > index ? 'text-success' : undefined,
        )}
      >
        <Step number={index} currentStep={currentStep} /> {step.title}
        {isFinished ? ' (已完成)' : null}
        {currentStep === index ? ' (进行中)' : null}
      </div>
      <div
        className={clsx(
          'py-3 pl-5 text-sm',
          index === steps.length - 1
            ? undefined
            : 'border-l-default ml-3 border-l-2 border-dashed',
        )}
      >
        {currentStep >= index ? (
          <>
            <div>{step.message}</div>
            <div className="mt-4">
              任务目标:{' '}
              <Link
                underline="always"
                color={isFinished ? 'foreground' : 'primary'}
                className={clsx(
                  isFinished ? 'line-through' : '',
                  'cursor-pointer',
                )}
                size="sm"
              >
                {step.goal}
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

const Guid: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    queryCurrentInitStep().then((r) => {
      setCurrentStep(Number.parseInt(r))
    })
  }, [])
  return (
    <Card className="mt-5">
      <CardBody>
        <div className="header-2">第一次使用？</div>
        <div className="mt-3 flex flex-col">
          {steps.map((step, index) => (
            <StepDisplay step={step} index={index} currentStep={currentStep} />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

export default Guid
