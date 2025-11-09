type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
  searchParams: SearchParams
}

export default async function ProvidersEmbedPage({ searchParams }: Props) {
  // const params = await searchParams

  return <div>Placeholder: courses embed goes here</div>
}
