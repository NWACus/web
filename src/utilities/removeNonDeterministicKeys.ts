export const removeNonDeterministicKeys = (obj: object): object => {
  if (obj !== Object(obj)) {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map((item: object): object => removeNonDeterministicKeys(item))
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return Object.keys(obj as object)
    .filter((k) => !['loginAt', 'createdAt', 'updatedAt', 'publishedAt', 'contentHash'].includes(k))
    .reduce(
      // @ts-expect-error this is so nasty anyway, yuck
      (acc: object, x): object => Object.assign(acc, { [x]: removeNonDeterministicKeys(obj[x]) }),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {} as object,
    )
}
