#!/usr/bin/env node

/**
 * Configure CORS on the R2 bucket to allow direct browser uploads via presigned URLs.
 * Run once: node scripts/setup-r2-cors.mjs
 *
 * Requires: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env
 * Also requires a Cloudflare API token with R2 write permissions in CF_API_TOKEN.
 *
 * Alternative: configure CORS manually in the Cloudflare dashboard:
 *   R2 > lyned-assets > Settings > CORS Policy
 *
 * Required CORS rules:
 *   AllowedOrigins: https://lyned.xyz, http://localhost:3333
 *   AllowedMethods: PUT
 *   AllowedHeaders: Content-Type, Content-Length
 *   MaxAgeSeconds: 3600
 */

import { config } from 'dotenv'
config()

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const BUCKET = process.env.R2_BUCKET_NAME || 'lyned-assets'
const CF_TOKEN = process.env.CF_API_TOKEN

if (!ACCOUNT_ID || !CF_TOKEN) {
  console.error('Missing R2_ACCOUNT_ID or CF_API_TOKEN in .env')
  console.error('')
  console.error('You can also set CORS manually in the Cloudflare dashboard:')
  console.error('  R2 > lyned-assets > Settings > CORS Policy')
  console.error('')
  console.error('Add these rules:')
  console.error('  AllowedOrigins: https://lyned.xyz, http://localhost:3333')
  console.error('  AllowedMethods: PUT')
  console.error('  AllowedHeaders: Content-Type, Content-Length')
  console.error('  MaxAgeSeconds: 3600')
  process.exit(1)
}

const corsRules = [
  {
    AllowedOrigins: ['https://lyned.xyz', 'http://localhost:3333'],
    AllowedMethods: ['PUT'],
    AllowedHeaders: ['Content-Type', 'Content-Length'],
    MaxAgeSeconds: 3600,
  },
]

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/cors`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cors_rules: corsRules }),
  }
)

const data = await res.json()
if (data.success) {
  console.log('CORS configured successfully on', BUCKET)
} else {
  console.error('Failed to configure CORS:', JSON.stringify(data.errors, null, 2))
  process.exit(1)
}
