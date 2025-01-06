import React from 'react'

import { Role } from '@/payload-types'
import { ArrayFieldClient, DefaultServerCellComponentProps } from 'payload'

export const RulesCell: React.FC<
  DefaultServerCellComponentProps<ArrayFieldClient, Role['rules']>
> = async ({ cellData }) => {
  return (
    <>
      {cellData.map((rule, index) => (
        <div key={index}>{formatRule(rule)}</div>
      ))}
    </>
  )
}

const formatRule = (rule: Role['rules'][0]): string => {
  const actions = rule.actions.map(formatAction)
  const collections = rule.collections.map(formatCollection)

  return combine(actions) + ' on ' + combine(collections)
}

const combine = (data: string[]): string => {
  if (data.length > 1) {
    data[data.length - 1] = 'and ' + data[data.length - 1]
  }
  const separator = data.length > 2 ? ', ' : ' '
  return data.join(separator)
}

const formatAction = (action: string): string => {
  if (action === '*') {
    return 'any action'
  }
  return action
}

const formatCollection = (collection: string): string => {
  if (collection === '*') {
    return 'any collection'
  }
  return collection
}
