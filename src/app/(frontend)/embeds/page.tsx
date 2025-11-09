type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
  searchParams: SearchParams
}

export default async function EmbedsPage({ searchParams }: Props) {
  // const params = await searchParams

  return <div>Placeholder: Embed builder goes here</div>
}
