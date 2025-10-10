import FilterText from './src/FilterText.vue'

export { FilterText }

const fieldText = (field: string, options: any[]) => {
  for (let index = 0; index < options.length; index++) {
    const element = options[index]
    if (field === element.field) {
      return element.title
    }
  }
}
const valueTextFormTree = (val: string, options: any[]) => {
  let result = null
  const stack = [...options]
  while (stack.length) {
    const item = stack.pop()
    if (item.value === val) {
      result = item.label
      break
    }
    if (item.children?.length) {
      item.children.forEach((kid: any) => stack.push(kid))
    }
  }
  return result || val
}
const timestampFormatDate = (value: string) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString()
}
const valueText = (field: string, val: string, options: any[]) => {
  for (let index = 0; index < options.length; index++) {
    const element = options[index]
    if (field === element.field) {
      let isTree = false
      const selectOption = element.option
      for (let i = 0; i < selectOption.length; i++) {
        const item = selectOption[i] as any
        if (item.children !== undefined) {
          isTree = true
          break
        }
        if (item.id === val || item.value === val) {
          return item.name || item.label
        }
      }
      if (element.type === 'time') {
        return timestampFormatDate(val)
      }
      if (isTree) {
        return valueTextFormTree(val, selectOption)
      }
    }
  }
  return val
}
export const convertFilterText = (conditions: any[], options: any[]) => {
  const result: any[] = []
  conditions.forEach((condition) => {
    const field = condition.field
    const ope = condition.operator
    const value = condition.value
    const fieldName = fieldText(field, options)
    const textOpe = ':'
    let separator = '，'
    if (ope === 'in') {
      separator = '、'
    }
    if (ope === 'between') {
      separator = '~'
    }
    let valText = value

    if (value) {
      if (Array.isArray(value)) {
        const valTextArray = value.map((val) => valueText(field, val, options))
        valText = valTextArray.join(separator)
      }
      if (valText?.length) {
        const obj = fieldName + textOpe + valText
        result.push(obj)
      }
    }
  })
  return result
}
