import { getURL } from '@/utilities/getURL'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import {
  addDataAndFileToRequest,
  createPayloadRequest,
  generatePayloadCookie,
  getPayload,
} from 'payload'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })

  try {
    // parse the request in the way the @payloadcms/ui Form component expects it to be
    const req = await createPayloadRequest({
      canSetHeaders: true,
      config,
      request,
    })
    await addDataAndFileToRequest(req)

    const token = req.data?.token
    const password = req.data?.password

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: token and password' },
        { status: 400 },
      )
    }

    // Find user with valid invite token
    const usersRes = await payload.find({
      collection: 'users',
      where: {
        inviteToken: { equals: token },
        inviteExpiration: { greater_than: new Date().toISOString() },
      },
      limit: 1,
    })

    if (!usersRes.docs.length) {
      return NextResponse.json(
        {
          message:
            'Invite is either invalid or has expired. Please request a new invite from your admin.',
        },
        { status: 403 },
      )
    }

    const user = usersRes.docs[0]

    // Update user with new password and clear invite token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password,
        inviteToken: null,
        inviteExpiration: null,
      },
    })

    const { token: authToken } = await payload.login({
      collection: 'users',
      data: {
        email: user.email,
        password,
      },
    })

    if (!authToken) {
      return NextResponse.json(
        {
          message: 'Failed to accept invite',
        },
        { status: 500 },
      )
    }

    const cookie = generatePayloadCookie({
      collectionAuthConfig: payload.collections.users.config.auth,
      cookiePrefix: payload.config.cookiePrefix,
      token: authToken,
    })

    const currentHost = req.headers.get('host') || req.host
    const response = NextResponse.redirect(new URL('/admin', getURL(currentHost)), 302)

    response.headers.set('Set-Cookie', cookie)

    return response
  } catch (error) {
    payload.logger.error(
      `Accept invite error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return NextResponse.json({ message: 'Failed to accept invite' }, { status: 500 })
  }
}
