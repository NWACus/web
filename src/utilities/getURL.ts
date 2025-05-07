import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  const domain = process.env.SERVER_DOMAIN || process.env.VERCEL_URL
  const url = domain
    ? `https://${domain}`
    : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  console.log('Determined url: ', url)
  console.log('process.env.SERVER_DOMAIN: ', process.env.SERVER_DOMAIN)
  console.log('process.env.VERCEL_URL: ', process.env.VERCEL_URL)
  console.log('process.env.NEXT_PUBLIC_SERVER_URL: ', process.env.NEXT_PUBLIC_SERVER_URL)

  return url
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    const url = `${protocol}//${domain}${port ? `:${port}` : ''}`

    console.log('Returning url from getClientSideURL: ', url)

    return url
  }

  const url = process.env.NEXT_PUBLIC_SERVER_URL || ''

  console.log('Returning url from getClientSideURL: ', url)

  return url
}
