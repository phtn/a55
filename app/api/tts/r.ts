import { lmnt } from '@/lib/chat/lmnt/index'
import { extractLeadingReactions, stripInlineGestures } from '@/lib/chat/reactions'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DEFAULT_VOICE_ID = '6d6d7cb3-6ee9-4510-9bb8-22ae005c1e35'

type VoiceInfo = { id: string; name: string }

// Map friendly UI voice aliases to LMNT names/ids (adjust per your account)
const FRIENDLY_TO_LMNT: Record<string, string> = {
  sakura: process.env.NEXT_PUBLIC_SAKURA_ID || DEFAULT_VOICE_ID,
  ellie: process.env.NEXT_PUBLIC_ELLIE_ID || DEFAULT_VOICE_ID,
  kendal: process.env.NEXT_PUBLIC_KENDALL_ID || DEFAULT_VOICE_ID,
  moody: process.env.NEXT_PUBLIC_MOODY_ID || DEFAULT_VOICE_ID,
  joss: process.env.NEXT_PUBLIC_JOSS_ID || DEFAULT_VOICE_ID,
  nzhu: process.env.NEXT_PUBLIC_NZHU_ID || DEFAULT_VOICE_ID
}

export async function POST(request: NextRequest) {
  try {
    const { content, voice } = (await request.json()) as {
      content?: string
      voice?: string
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (!process.env.LMNT_API_KEY) {
      console.error('[LMNT TTS] API key not found')
      return NextResponse.json({ error: 'LMNT API key not configured' }, { status: 500 })
    }

    // Resolve provided voice (alias, name, or id) to a valid LMNT voice id
    const voicesRaw = await lmnt.voices.list()
    const voicesList: VoiceInfo[] = Array.isArray(voicesRaw) ? (voicesRaw as unknown as VoiceInfo[]) : []

    const normalized = (voice ?? '').trim().toLowerCase()
    const mapped = normalized ? (FRIENDLY_TO_LMNT[normalized] ?? voice) : undefined

    const found =
      (mapped
        ? voicesList.find((v) => v.id === mapped || v.name.toLowerCase() === String(mapped).toLowerCase())
        : undefined) ||
      voicesList.find((v) => v.id === DEFAULT_VOICE_ID) ||
      voicesList[0]

    const voiceId = found?.id ?? DEFAULT_VOICE_ID

    // lmnt-node generate() returns a Fetch API Response for standard TTS
    const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '').trim()
    const afterLeading = extractLeadingReactions(withoutCodeBlocks).text
    const cleanText = stripInlineGestures(afterLeading)
    const response = await lmnt.speech.generate({
      text: cleanText,
      voice: voiceId
    })

    const audioBlob = await response.blob()
    const contentType = audioBlob.type || 'audio/mpeg'
    const audioBuffer = await audioBlob.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('[LMNT TTS] Detailed error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })

    return NextResponse.json(
      {
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
