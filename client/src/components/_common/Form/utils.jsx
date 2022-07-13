import { useCallback, useRef, useEffect } from 'react'
import { useField, useFormikContext } from 'formik'
import update from 'immutability-helper'

const useFieldArray = props => {
  const [field, meta] = useField(props)
  const fieldArray = useRef(field.value)
  const { setFieldValue } = useFormikContext()

  useEffect(() => {
    fieldArray.current = field.value
  }, [field.value])

  const push = useCallback(value => {
    fieldArray.current = update(fieldArray.current, {
      $push: [value]
    })

    setFieldValue(field.name, fieldArray.current)
  }, [field.name, setFieldValue])

  const swap = useCallback((indexA, indexB) => {
    const swapA = fieldArray.current[indexA]
    const swapB = fieldArray.current[indexB]

    fieldArray.current = update(fieldArray.current, {
      $splice: [[indexA, 1, swapB], [indexB, 1, swapA]]
    })

    setFieldValue(field.name, fieldArray.current)
  }, [field.name, setFieldValue])

  const move = useCallback((from, to) => {
    const toMove = fieldArray.current[from]

    fieldArray.current = update(fieldArray.current, {
      $splice: [[from, 1], [to, 0, toMove]]
    })

    setFieldValue(field.name, fieldArray.current)
  }, [field.name, setFieldValue])

  const insert = useCallback((index, value) => {
    fieldArray.current = update(fieldArray.current, {
      $splice: [[index, 0, value]]
    })

    setFieldValue(field.name, fieldArray.current)
  }, [field.name, setFieldValue])

  const unshift = useCallback(value => {
    fieldArray.current = update(fieldArray.current, {
      $unshift: [value]
    })

    setFieldValue(field.name, fieldArray.current)
    return fieldArray.current.length
  }, [field.name, setFieldValue])

  const remove = useCallback(index => {
    const removedItem = fieldArray.current[index]

    fieldArray.current = update(fieldArray.current, {
      $splice: [[index, 1]]
    })

    setFieldValue(field.name, fieldArray.current)
    return removedItem
  }, [field.name, setFieldValue])

  const pop = useCallback(() => {
    const lastIndex = fieldArray.current.length - 1
    const poppedItem = fieldArray.current[lastIndex]

    fieldArray.current = update(fieldArray.current, {
      $splice: [[lastIndex, 1]]
    })

    setFieldValue(field.name, fieldArray.current)
    return poppedItem
  }, [field.name, setFieldValue])

  const replace = useCallback((index, value) => {
    fieldArray.current = update(fieldArray.current, {
      $splice: [[index, 1, value]]
    })

    setFieldValue(field.name, fieldArray.current)
  }, [field.name, setFieldValue])

  return [
    field,
    meta,
    {
      push,
      swap,
      move,
      insert,
      unshift,
      remove,
      pop,
      replace
    }
  ]
}

export {useFieldArray}
