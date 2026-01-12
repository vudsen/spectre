import React, { useMemo } from 'react'

interface CodeProps {
  code?: string
}

const Code: React.FC<CodeProps> = (props) => {
  const lines: string[] = useMemo(() => {
    if (!props.code) {
      return []
    }
    return props.code.split('\n')
  }, [props.code])

  return (
    <div className="overflow-scroll">
      <code className="block font-mono text-sm leading-6 whitespace-pre text-gray-800 [counter-reset:line]">
        {lines.map((msg, index) => (
          <div
            key={index}
            className="before:mr-4 before:inline-block before:w-10 before:text-right before:text-gray-600 before:content-[counter(line)] before:select-none before:[counter-increment:line]"
          >
            {msg}
          </div>
        ))}
      </code>
    </div>
  )
}

export default Code
