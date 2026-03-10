const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // Strip duplicate path segments after URL-encoded space (e.g. "/foo,%20foo" -> "/foo")
  const trailingDuplicateRedirect = {
    destination: '/:path',
    permanent: false,
    source: '/:path(.*),%20:dup(.*)',
  }

  const redirects = [internetExplorerRedirect, trailingDuplicateRedirect]

  return redirects
}

export default redirects
