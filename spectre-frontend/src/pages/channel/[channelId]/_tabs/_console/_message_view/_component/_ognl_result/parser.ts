export type OgnlResult =
  | OgnlResultValue
  | OgnlResultObject
  | OgnlResultArray
  | OgnlResultMap

interface OgnlResultCommonFields {
  type: string
  /**
   * 为空时表示值为 null
   */
  javaType?: string
  fakeId: number
}

/**
 * 普通的值，一般为叶子节点或空数组/空对象
 */
export interface OgnlResultValue extends OgnlResultCommonFields {
  type: 'value'
  /**
   * 为空时表示该值为 null
   */
  javaType?: string
  value: string
  isObject?: boolean
  isArray?: boolean
}

export interface OgnlResultObject extends OgnlResultCommonFields {
  type: 'object'
  entities: Record<string, OgnlResult>
}

export interface OgnlResultArray extends OgnlResultCommonFields {
  type: 'array'
  values: OgnlResult[]
}

export interface OgnlResultMap extends OgnlResultCommonFields {
  type: 'map'
  entities: [OgnlResultValue, OgnlResult][]
}

/**
 * @param line {[string, number]} [，缩进数量]
 */
function compatLine(line: string): LineInfo {
  let pos = 0
  while (line.charAt(pos) === ' ') {
    pos++
  }
  return {
    indent: pos,
    value: line.substring(pos),
  }
}

type LineInfo = {
  /**
   * trim后的字符串
   */
  value: string
  indent: number
}

type TreeData = {
  value: string
  children: TreeData[]
  singleLine?: boolean
}

type FindTypeResult = {
  /**
   * 结束位置，一般是类型值的开始，例如 @String[hello]，endIndex 为 7，字符为 `[`
   */
  endIndex: number
  javaType?: string
}

class OgnlResultParser {
  private gid = Date.now()

  containsUnexpectedToken = false

  /**
   * 获取类型
   * @return {} 实际的类型，返回空，表示 null
   */
  private findType(line: string, start = 0): FindTypeResult {
    if (line.indexOf('null,', start) >= 0) {
      return {
        endIndex: start,
      }
    }
    if (line[start] !== '@') {
      this.containsUnexpectedToken = true
      console.warn(`Failed to find type from "${line}", start = ${start} `)
      return {
        javaType: line,
        endIndex: line.length,
      }
    }
    start++
    const tokens: string[] = []
    for (; start < line.length; start++) {
      const ch = line[start]
      if (ch === '[') {
        if (line[start + 1] === ']') {
          tokens.push('[]')
          start++
          continue
        }
        break
      }
      tokens.push(ch)
    }

    return {
      javaType: tokens.join(''),
      endIndex: start + 1,
    }
  }

  private createNullTreeNode(): OgnlResultValue {
    return {
      type: 'value',
      fakeId: this.gid++,
      value: 'null',
    }
  }

  private doParseValue(node: TreeData): OgnlResultValue {
    if (!node.singleLine) {
      throw Error('Not a single line: ' + node.value)
    }

    const type = this.findType(node.value)
    if (!type.javaType) {
      return this.createNullTreeNode()
    }
    return {
      type: 'value',
      fakeId: this.gid++,
      // `],` 结束
      value: node.value.substring(type.endIndex, node.value.length - 2),
      javaType: type.javaType,
    }
  }

  private doParseArray(myTypeName: string, node: TreeData): OgnlResultArray {
    const myChildren: OgnlResult[] = []
    const r: OgnlResultArray = {
      javaType: myTypeName,
      type: 'array',
      values: myChildren,
      fakeId: this.gid++,
    }
    for (const child of node.children) {
      if (child.value === 'null,') {
        const n: OgnlResultValue = {
          type: 'value',
          value: 'null',
          fakeId: this.gid++,
        }
        myChildren.push(n)
      } else {
        myChildren.push(this.parseTree(child))
      }
    }
    return r
  }

  private doParseMap(myTypeName: string, node: TreeData): OgnlResultMap {
    const myChildren: OgnlResultMap['entities'] = []
    const r: OgnlResultMap = {
      type: 'map',
      javaType: myTypeName,
      entities: myChildren,
      fakeId: this.gid++,
    }

    for (const child of node.children) {
      if (child.singleLine && child.value.endsWith('null,')) {
        myChildren.push([
          this.doParseValue({
            ...child,
            value: child.value.substring(0, child.value.length - 6) + ',',
          }),
          this.createNullTreeNode(),
        ])
        continue
      }
      const p = child.value.indexOf(']:@')
      myChildren.push([
        this.doParseValue({
          ...child,
          value: child.value.substring(0, p + 1) + ',',
        }),
        this.parseTree({
          ...child,
          value: child.value.substring(p + 2),
        }),
      ])
    }
    return r
  }

  private doParseObject(myTypeName: string, node: TreeData): OgnlResultObject {
    const myChildren: Record<string, OgnlResult> = {}
    const r: OgnlResultObject = {
      type: 'object',
      javaType: myTypeName,
      entities: myChildren,
      fakeId: this.gid++,
    }
    for (const child of node.children) {
      if (child.value.endsWith('null,')) {
        myChildren[child.value.substring(0, child.value.length - 6)] = {
          fakeId: this.gid++,
          value: 'null',
          type: 'value',
        } satisfies OgnlResultValue
        continue
      }
      const p = child.value.indexOf('=@')
      const key = child.value.substring(0, p)
      myChildren[key] = this.parseTree({
        ...child,
        value: child.value.substring(p + 1),
      })
    }
    return r
  }

  /**
   * 解析树节点
   * @param node {} 节点的值一定是 `@` 开头
   */
  parseTree(node: TreeData): OgnlResult {
    if (node.singleLine) {
      return this.doParseValue(node)
    }
    const pos = node.value.lastIndexOf('@')
    const myTypeName = node.value.substring(pos + 1, node.value.length - 1)
    const isArray = node.children[0].value.charAt(0) === '@'
    // TODO 检查其它 Map 结果
    const isHashMap = myTypeName.endsWith('Map')

    if (isHashMap) {
      return this.doParseMap(myTypeName, node)
    } else if (isArray) {
      return this.doParseArray(myTypeName, node)
    } else {
      return this.doParseObject(myTypeName, node)
    }
  }
}

type BuildContext = {
  lines: LineInfo[]
  currentIndex: number
}

/**
 * 由于 arthas ognl 的输出每行都自带缩进，为了简单处理，首先以行分割，通过解析缩进来构建树节点
 */
function buildBasicTree(context: BuildContext): TreeData {
  const lines = context.lines
  const line = lines[context.currentIndex]
  context.currentIndex++
  const children: TreeData[] = []
  if (!line.value.endsWith('[')) {
    return {
      value: line.value,
      children: [],
      singleLine: true,
    }
  }
  const self: TreeData = {
    children,
    value: line.value,
  }
  while (context.currentIndex < lines.length) {
    const current = lines[context.currentIndex]
    if (line.indent === current.indent) {
      context.currentIndex++
      break
    } else if (line.indent < current.indent) {
      children.push(buildBasicTree(context))
    } else {
      throw Error(
        `Illegal ident ${current.indent}, expect greater or equal to ${line.indent}`,
      )
    }
  }
  return self
}

export function parseOgnlResult(raw: string): OgnlResult {
  // 目前只能通过手动解析响应 https://github.com/alibaba/arthas/issues/2261，开启 JSON 输出后，无法获取到类型。
  const lines = raw.split('\n').map(compatLine)
  const root = buildBasicTree({
    lines,
    currentIndex: 0,
  })
  return new OgnlResultParser().parseTree(root)
}
