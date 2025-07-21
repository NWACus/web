import icon from '@/assets/icon.png'
import { cn } from '@/utilities/ui'
import Image from 'next/image'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const AvyFxLogo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        alt="avy fx logo"
        src={icon}
        width={icon.width}
        height={icon.height}
        loading={loading}
        fetchPriority={priority}
        className={cn('w-full max-w-[9.375rem]', className)}
      />
      <h1>AvyFx</h1>
    </div>
  )
}
