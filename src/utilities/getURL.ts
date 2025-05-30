import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  const domain = process.env.SERVER_DOMAIN || process.env.VERCEL_URL
  return domain
    ? `https://${domain}`
    : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}
