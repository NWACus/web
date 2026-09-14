import type { OgDocData } from './getOgDocData'

type ImgProps = { src: string; width: number; height: number; alt: string }
type Colors = { header: string; headerForeground: string }

const LOGO_HEIGHT = 70

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text

const logoStyle = (img: ImgProps, marginLeft = 0) => ({
  objectFit: 'contain' as const,
  height: LOGO_HEIGHT,
  width: (LOGO_HEIGHT * img.width) / img.height,
  // Satori (Yoga) ignores flex `gap`, so space multiple logos with margin
  ...(marginLeft ? { marginLeft } : {}),
})

/** Center banner + optional USFS logo row, shown above the document title. */
function OgBanner({
  bannerImgProps,
  usfsLogoImgProps,
}: {
  bannerImgProps: ImgProps | null
  usfsLogoImgProps: ImgProps | null
}) {
  if (!bannerImgProps) return null
  return (
    <div tw="flex items-center mb-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerImgProps.src}
        alt={bannerImgProps.alt}
        width={bannerImgProps.width}
        height={bannerImgProps.height}
        style={logoStyle(bannerImgProps)}
      />
      {usfsLogoImgProps && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={usfsLogoImgProps.src}
          alt={usfsLogoImgProps.alt}
          width={usfsLogoImgProps.width}
          height={usfsLogoImgProps.height}
          style={logoStyle(usfsLogoImgProps, 24)}
        />
      )}
    </div>
  )
}

/**
 * OG image layout for a CMS document (blog post or event).
 *
 * When the document has a hero/featured image it's shown as a banner across
 * the top; otherwise the layout is the same center-branded card used elsewhere.
 * The title, an optional meta line (author/date or date/location), and the
 * description render below.
 *
 * Complexity is inflated by conditional rendering (hero image, meta line, and
 * description are each optional); this is presentational JSX.
 */
// fallow-ignore-next-line complexity
export function OgDocContent({
  colors,
  bannerImgProps,
  usfsLogoImgProps,
  data,
}: {
  colors: Colors
  bannerImgProps: ImgProps | null
  usfsLogoImgProps: ImgProps | null
  data: OgDocData
}) {
  const { title, description, metaLine, image } = data

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: colors.header,
      }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          style={{ width: '100%', height: 300, objectFit: 'cover' }}
        />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          textAlign: 'center',
          padding: '40px 60px',
        }}
      >
        <OgBanner bannerImgProps={bannerImgProps} usfsLogoImgProps={usfsLogoImgProps} />
        <h1
          style={{
            fontSize: image ? '3rem' : '3.75rem',
            fontWeight: 'bold',
            color: colors.headerForeground,
            marginBottom: metaLine || description ? '1rem' : 0,
            lineHeight: 1.1,
          }}
        >
          {truncate(title, 90)}
        </h1>
        {metaLine && (
          <p
            style={{
              fontSize: '1.6rem',
              fontWeight: 'bold',
              color: colors.headerForeground,
              marginBottom: description ? '0.75rem' : 0,
            }}
          >
            {truncate(metaLine, 90)}
          </p>
        )}
        {description && (
          <p
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: colors.headerForeground,
              maxWidth: '85%',
              lineHeight: 1.3,
            }}
          >
            {truncate(description, 160)}
          </p>
        )}
      </div>
    </div>
  )
}
