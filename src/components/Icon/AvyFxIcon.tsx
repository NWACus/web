import icon from '@/assets/icon.png'
import { cn } from '@/utilities/ui'
import Image from 'next/image'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const AvyFxIcon = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <Image
      alt="avy fx icon"
      src={icon}
      width={icon.width}
      height={icon.height}
      loading={loading}
      fetchPriority={priority}
      className={cn('w-full aspect-square object-cover', className)}
    />
  )
}
