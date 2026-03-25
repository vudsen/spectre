import React, { useEffect, useState } from 'react'
import { Card, CardBody, Link } from '@heroui/react'
import clsx from 'clsx'
import { queryCurrentInitStep } from '@/api/impl/sys-conf.ts'
import { useNavigate } from 'react-router'
import i18n from '@/i18n'

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
    title: i18n.t('hardcoded.msg_pages_home_guide_001'),
    message: i18n.t('hardcoded.msg_pages_home_guide_002'),
    goal: i18n.t('hardcoded.msg_pages_home_guide_003'),
    to: '/toolchain/items?guide=true',
  },
  {
    title: i18n.t('hardcoded.msg_pages_home_guide_004'),
    message: i18n.t('hardcoded.msg_pages_home_guide_005'),
    goal: i18n.t('hardcoded.msg_pages_home_guide_006'),
    to: '/runtime-node/modify?guide=true',
  },
  {
    title: i18n.t('hardcoded.msg_pages_home_guide_007'),
    message: i18n.t('hardcoded.msg_pages_home_guide_008'),
    goal: i18n.t('hardcoded.msg_pages_home_guide_009'),
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
        {isFinished ? i18n.t('hardcoded.msg_pages_home_guide_010') : null}
        {currentStep === index
          ? i18n.t('hardcoded.msg_pages_home_guide_011')
          : null}
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
              {i18n.t('hardcoded.msg_pages_home_guide_012')}{' '}
              {isFinished ? '✅' : null}
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
        <div className="header-2">
          {i18n.t('hardcoded.msg_pages_home_guide_013')}
        </div>
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
