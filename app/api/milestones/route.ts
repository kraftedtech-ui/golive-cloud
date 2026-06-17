import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGODB_URI!

export async function GET() {
  try {
    const client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('golive_cloud')
    const doc = await db.collection('settings').findOne({ key: 'cert_milestones' })
    await client.close()
    return NextResponse.json({ success: true, milestones: doc?.milestones || {} })
  } catch (e) {
    return NextResponse.json({ success: false, milestones: {} })
  }
}

export async function POST(req: Request) {
  try {
    const { milestones } = await req.json()
    const client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('golive_cloud')
    await db.collection('settings').updateOne(
      { key: 'cert_milestones' },
      { $set: { key: 'cert_milestones', milestones, updatedAt: new Date() } },
      { upsert: true }
    )
    await client.close()
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}
