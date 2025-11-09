type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
  searchParams: SearchParams
}

export default async function CoursesEmbedPage({ searchParams }: Props) {
  // const params = await searchParams

  return <div>Placeholder: courses embed goes here</div>
}
