import { AwsClient } from 'aws4fetch'

let _client: AwsClient | null = null

function getClient() {
  if (!_client) {
    _client = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    })
  }
  return _client
}

function bucketUrl(key?: string) {
  const endpoint = process.env.R2_ENDPOINT!
  const bucket = process.env.R2_BUCKET_NAME || 'lyned-assets'
  return key ? `${endpoint}/${bucket}/${key}` : `${endpoint}/${bucket}`
}

function publicUrl(key: string) {
  return `${process.env.R2_PUBLIC_URL || ''}/${key}`
}

export function getR2PublicUrl(key: string) {
  return publicUrl(key)
}

export async function uploadToR2(key: string, body: Buffer | Uint8Array, contentType: string) {
  const client = getClient()
  const res = await client.fetch(bucketUrl(key), {
    method: 'PUT',
    body,
    headers: { 'Content-Type': contentType },
  })
  if (!res.ok) { console.error(`R2 upload failed: ${res.status} ${await res.text()}`); throw new Error('Storage upload failed') }
  return publicUrl(key)
}

export async function deleteFromR2(key: string) {
  const client = getClient()
  const res = await client.fetch(bucketUrl(key), { method: 'DELETE' })
  if (!res.ok && res.status !== 404) { console.error(`R2 delete failed: ${res.status}`); throw new Error('Storage delete failed') }
}

export async function getFromR2(key: string): Promise<string | null> {
  const client = getClient()
  const res = await client.fetch(bucketUrl(key))
  if (!res.ok) return null
  return await res.text()
}

export async function putJsonToR2(key: string, data: any) {
  const client = getClient()
  const res = await client.fetch(bucketUrl(key), {
    method: 'PUT',
    body: JSON.stringify(data, null, 2),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) { console.error(`R2 putJson failed: ${res.status}`); throw new Error('Storage write failed') }
}

export async function listR2Objects(prefix?: string): Promise<string[]> {
  const client = getClient()
  const url = new URL(bucketUrl())
  url.searchParams.set('list-type', '2')
  if (prefix) url.searchParams.set('prefix', prefix)

  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    if (continuationToken) url.searchParams.set('continuation-token', continuationToken)
    const res = await client.fetch(url.toString())
    if (!res.ok) throw new Error(`R2 list failed: ${res.status}`)
    const xml = await res.text()

    const keyMatches = xml.matchAll(/<Key>([^<]+)<\/Key>/g)
    for (const match of keyMatches) keys.push(match[1])

    const truncated = xml.includes('<IsTruncated>true</IsTruncated>')
    const tokenMatch = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)
    continuationToken = truncated && tokenMatch ? tokenMatch[1] : undefined
  } while (continuationToken)

  return keys
}
