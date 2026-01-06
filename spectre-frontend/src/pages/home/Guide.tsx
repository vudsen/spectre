import React, { useEffect, useState } from 'react'
import { Card, CardBody, Link } from '@heroui/react'
import clsx from 'clsx'
import { queryCurrentInitStep } from '@/api/impl/sys-conf.ts'
import { useNavigate } from 'react-router'

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
  to: string
}

const steps: MyStep[] = [
  {
    title: '了解工具包',
    message:
      'Spectre 需要借助外部工具才能正常使用，而并非单独完成了整个流程，只是利用这些工具将其组合了起来。在该任务中，你将了解到工具包的基础维护流程。',
    goal: '为 Arthas 手动上传工具包',
    to: '/toolchain/items?guide=true',
  },
  {
    title: '创建运行节点',
    message:
      '运行节点是一个抽象概念，任何可以运行 JVM 的东西都可以是一个"运行节点"，例如 一个 SSH 远程服务器、Docker 以及 Kubernetes。通过运行节点，Spectre 将为你过滤出所有可用的 JVM 以便进行进一步操作',
    goal: '创建一个测试节点',
    to: '/runtime-node/modify?guide=true',
  },
  {
    title: '连接到 JVM',
    message:
      '你已经完成了所有内容，欢迎使用 Spectre! 此外，所有教程均可重复体验。',
    goal: '连接到任意 JVM',
    to: '/runtime-node/list?guide=true',
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
  const nav = useNavigate()
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
            ? 'ml-3'
            : 'border-l-default ml-3 border-l-2 border-dashed',
        )}
      >
        {currentStep >= index ? (
          <>
            <div>{step.message}</div>
            <div className="mt-4">
              任务目标: {isFinished ? '✅' : null}
              <Link
                onPress={() => nav(step.to)}
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

const Guide: React.FC = () => {
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

export default Guide
