import React, { useEffect, useState } from 'react'
import type SteppedPanelItem from './SteppedPanelItem'
import type { ReactElement } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'

const variants: Variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }
  },
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      x: direction > 0 ? -20 : 20,
      opacity: 0,
    }
  },
}

interface SteppedPanelProps {
  children: ReactElement<typeof SteppedPanelItem>[]
  /**
   * 当前页码
   */
  page: number
  className?: string
}

type State = {
  previousPage: number
  key: number
  custom: number
}

const SteppedPanel: React.FC<SteppedPanelProps> = (props) => {
  const [state, setState] = useState<State>({
    previousPage: -1,
    key: props.page,
    custom: 1,
  })
  useEffect(() => {
    setState((old) => {
      if (old.previousPage === props.page) {
        return old
      }
      return {
        previousPage: props.page,
        key: props.page,
        custom: props.page - old.previousPage,
      }
    })
  }, [props.page])

  return (
    <div className={props.className}>
      <AnimatePresence mode="wait" custom={state.custom}>
        <motion.div
          key={state.key}
          variants={variants}
          custom={state.custom}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {props.children[state.key]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default SteppedPanel
