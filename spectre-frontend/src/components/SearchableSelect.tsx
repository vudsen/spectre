import {
  Card,
  Input,
  type InputProps,
  Listbox,
  ListboxItem,
  Spinner,
} from '@heroui/react'
import { type InputEvent, useCallback, useEffect, useRef } from 'react'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TRANSITION_VARIANTS } from '@heroui/framer-utils'
import clsx from 'clsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

export type SearchItem<T> = {
  data: T
  id: string | number | bigint
  name: string
}

export interface SearchableSelectProps<T> {
  /**
   * 进行搜索。推荐使用 {@link useCallback} 包裹以优化性能
   * @param content 用户输入的内容
   */
  onSearch: (content: string) => Promise<SearchItem<T>[]>
  onChange?: (value: T | undefined) => void
  emptyValues?: SearchItem<T>[]
  inputProps: InputProps
  className?: string | undefined
}

function SearchableSelect<T>({
  onChange,
  onSearch,
  inputProps,
  emptyValues,
  className,
}: SearchableSelectProps<T>) {
  const [items, setItems] = useState<SearchItem<T>[]>(emptyValues ?? [])
  const [showSelections, setShowSelections] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutId = useRef<number>(undefined)
  const listBoxContainer = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [selectedItem, setSelectedItem] = useState<T | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const onInput = useCallback(
    (e: InputEvent<HTMLInputElement>) => {
      const content = (e.target as HTMLInputElement).value
      setSelectedItem(undefined)
      onChange?.(undefined)
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      if (!content && emptyValues) {
        setItems(emptyValues)
        setLoading(false)
        return
      }
      setLoading(true)
      timeoutId.current = setTimeout(() => {
        onSearch(content)
          .then((r) => {
            setItems(r)
            setShowSelections(true)
          })
          .finally(() => {
            setLoading(false)
          })
      }, 300)
    },
    [emptyValues, onChange, onSearch],
  )

  const onFocus = useCallback(() => {
    setShowSelections(true)
  }, [])

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      const node = e.target as Node
      if (
        !listBoxContainer.current?.contains(node) &&
        // 防止刚聚焦就被关闭
        document.activeElement !== inputRef.current
      ) {
        setShowSelections(false)
      }
    }
    window.addEventListener('click', listener)
    return () => {
      window.removeEventListener('click', listener)
    }
  }, [])

  const onItemSelect = useCallback(
    (item: SearchItem<T>) => {
      onChange?.(item.data)
      setShowSelections(false)
      setInputValue(item.name)
      setSelectedItem(item.data)
    },
    [onChange],
  )

  return (
    <div className={clsx(className, 'relative')}>
      <Input
        {...inputProps}
        onInput={onInput}
        value={inputValue}
        onFocus={onFocus}
        ref={inputRef}
        onValueChange={setInputValue}
        color={selectedItem ? 'primary' : 'default'}
        startContent={
          loading ? (
            <Spinner size="sm" color="primary" />
          ) : (
            <SvgIcon icon={Icon.SEARCH}></SvgIcon>
          )
        }
      />
      <div className="absolute z-10 w-full bg-white">
        <AnimatePresence>
          {showSelections ? (
            // https://github.com/heroui-inc/heroui/blob/canary/packages/components/popover/src/popover-content.tsx
            <motion.div
              variants={TRANSITION_VARIANTS.scaleSpringOpacity}
              animate="enter"
              exit="exit"
              initial="initial"
            >
              <Card
                className="my-2 max-h-64 overflow-y-scroll"
                ref={listBoxContainer}
              >
                <Listbox aria-label="Users">
                  {items.map((item) => (
                    <ListboxItem
                      key={item.id}
                      onPress={() => onItemSelect(item)}
                    >
                      {item.name}
                    </ListboxItem>
                  ))}
                </Listbox>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SearchableSelect
