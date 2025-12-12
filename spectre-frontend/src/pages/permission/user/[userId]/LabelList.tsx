import LabelEditor from '@/components/LabelEditor'
import { useForm } from 'react-hook-form'
import React, { useEffect } from 'react'

interface LabelListProps {
  labels: Record<string, string>
}

type Values = {
  labels: Record<string, string>
}

const LabelList: React.FC<LabelListProps> = (props) => {
  const { control, watch } = useForm<Values>({
    defaultValues: {
      labels: props.labels,
    },
  })
  useEffect(() => {
    const { unsubscribe } = watch(() => {
      // TODO save tags
    })
    return () => {
      unsubscribe()
    }
  }, [watch])
  return <LabelEditor control={control} name="labels" />
}

export default LabelList
