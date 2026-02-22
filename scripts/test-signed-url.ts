import { createHash } from 'crypto'

const cdnHostname = 'vz-3aeae61d-3b5.b-cdn.net'
const tokenAuthKey = 'e3ea731e-b449-44a2-8676-c09f05d262c3'
const videoId = 'dc979285-1cdd-4360-8777-382b42ca79ca'

async function main() {
  const expiry = Math.floor(Date.now() / 1000) + 86400
  const path = `/${videoId}/playlist.m3u8`

  // CDN Token Auth Basic: Base64(MD5(key + path + expiry))
  const hashableBase = `${tokenAuthKey}${path}${expiry}`
  const md5Hash = createHash('md5').update(hashableBase).digest('base64')
  const token = md5Hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const url = `https://${cdnHostname}${path}?token=${token}&expires=${expiry}`
  console.log('Signed URL (MD5 basic):', url)

  const res = await fetch(url, { method: 'HEAD' })
  console.log('Status:', res.status, res.statusText)

  if (res.status === 403) {
    // Try SHA256 variant
    const sha256Hash = createHash('sha256').update(hashableBase).digest('base64')
    const token2 = sha256Hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const url2 = `https://${cdnHostname}${path}?token=${token2}&expires=${expiry}`
    console.log('\nSigned URL (SHA256):', url2)
    const res2 = await fetch(url2, { method: 'HEAD' })
    console.log('Status:', res2.status, res2.statusText)
  }
}

main().catch(console.error)
