export const layoutOptions = [
  { value: '1_1', parts: [1] },
  { value: '2_11', parts: [1, 1] },
  { value: '2_21', parts: [2, 1] },
  { value: '2_12', parts: [1, 2] },
  { value: '3_111', parts: [1, 1, 1] },
  { value: '3_211', parts: [2, 1, 1] },
  { value: '3_121', parts: [1, 2, 1] },
  { value: '3_112', parts: [1, 1, 2] },
  { value: '4_1111', parts: [1, 1, 1, 1] },
]

export const columnCount = (layout: string) => parseInt(layout.split('_')[0])
