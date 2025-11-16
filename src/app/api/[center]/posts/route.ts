import { getPosts } from '@/utilities/queries/getPosts'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const searchParams = request.nextUrl.searchParams

  const queryParams = {
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : null,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : null,
    tags: searchParams.get('tags'),
    sort: searchParams.get('sort'),
    center,
  }

  const result = await getPosts(queryParams)

  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
