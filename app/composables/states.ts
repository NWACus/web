export const useAvalancheCenter = () => {
  const config = useRuntimeConfig()

  return useState<string>('avalancheCenter', () => config.defaultCenter)
}
