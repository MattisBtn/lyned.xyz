#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

// Load .env manually
const envContent = readFileSync('.env', 'utf-8')
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const { AwsClient } = await import('aws4fetch')

const client = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
})
const base = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}`

async function upload(key, filePath, contentType) {
  const body = readFileSync(filePath)
  const res = await client.fetch(`${base}/${key}`, {
    method: 'PUT', body, headers: { 'Content-Type': contentType },
  })
  if (!res.ok) { console.error('FAIL:', key, res.status); return }
  console.log('OK:', key, Math.round(body.length / 1024) + 'KB')
}

// Graphic
const gDir = 'public/assets/graphic'
if (existsSync(gDir)) {
  for (const f of readdirSync(gDir).filter(f => f.endsWith('.webp'))) {
    await upload('graphic/' + f, join(gDir, f), 'image/webp')
  }
}

// Motion
const mDir = 'public/assets/motion'
if (existsSync(mDir)) {
  for (const f of readdirSync(mDir).filter(f => f.endsWith('.mp4'))) {
    await upload('motion/' + f, join(mDir, f), 'video/mp4')
  }
}

// Thumbs
const tDir = 'public/assets/motion/thumbs'
if (existsSync(tDir)) {
  for (const f of readdirSync(tDir).filter(f => f.endsWith('.webp'))) {
    await upload('thumbs/' + f, join(tDir, f), 'image/webp')
  }
}

console.log('\nAll assets uploaded! Now run ingest to generate projects.json')
