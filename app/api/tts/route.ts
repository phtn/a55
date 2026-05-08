import { cohere } from '@ai-sdk/cohere'
import { convertToModelMessages, streamText } from 'ai'
import { NextResponse } from 'next/server'
import { presets } from './presets'

type InstructionsPreset = 'general' | 'extreme' | 'present' | 'hyper' | 'asmr' | 'custom'

const isInstructionsPreset = (value: unknown): value is InstructionsPreset =>
  value === 'general' ||
  value === 'extreme' ||
  value === 'present' ||
  value === 'hyper' ||
  value === 'asmr' ||
  value === 'custom'

const presetSystem = (preset: InstructionsPreset, custom: string | undefined): string => {
  switch (preset) {
    case 'extreme':
      return presets.extreme.join('\n')
    case 'present':
      return presets.present.join('\n')
    // case 'hyper':
    //   return presets.hyper.join('\n')
    // case 'asmr':
    //   return presets.asmr.join('\n')
    case 'custom': {
      const trimmed = (custom ?? '').trim()
      if (trimmed.length === 0) return 'Be helpful, safe, and direct.'
      return trimmed.slice(0, 4000)
    }
    case 'general':
    default:
      return 'Be helpful, safe, and direct.'
  }
}

export const MAX_DURATION = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      messages,
      instructionsPreset = 'asmr',
      customInstructions,
      temperature = 0.7,
      topP = 0.9,
      topK = 10,
      maxOutputTokens = 2048
    } = body
    const selectedPreset = isInstructionsPreset(instructionsPreset) ? instructionsPreset : 'asmr'

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required and must not be empty' }, { status: 400 })
    }

    if (!process.env.COHERE_API_KEY) {
      console.error('[CHAT API] COHERE_API_KEY is not set')
      return NextResponse.json({ error: 'Cohere API key is not configured' }, { status: 500 })
    }

    const modelMessages = await convertToModelMessages(messages)

    const response = streamText({
      system: presetSystem(selectedPreset, customInstructions),
      model: cohere('command-a-03-2025'),
      messages: modelMessages,
      maxOutputTokens,
      temperature,
      topP,
      topK
    })

    const result = response.toUIMessageStreamResponse()

    return result
  } catch (error) {
    console.error('[CHAT API] Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })

    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
// streamText
// Generate a text and call tools for a given prompt using a language model.
// This function streams the output. If you do not want to stream the output, use generateText instead.
// @param model — The language model to use.
// @param tools — Tools that are accessible to and can be called by the model. The model needs to support calling tools.
// @param system — A system message that will be part of the prompt.
// @param prompt — A simple text prompt. You can either use prompt or messages but not both.
// @param messages — A list of messages. You can either use prompt or messages but not both.
// @param maxOutputTokens — Maximum number of tokens to generate.
// @param temperature
// Temperature setting. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either temperature or topP, but not both.
// @param topP
// Nucleus sampling. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either temperature or topP, but not both.
// @param topK
// Only sample from the top K options for each subsequent token. Used to remove “long tail” low probability responses. Recommended for advanced use cases only. You usually only need to use temperature.
// @param presencePenalty
// Presence penalty setting. It affects the likelihood of the model to repeat information that is already in the prompt. The value is passed through to the provider. The range depends on the provider and model.
// @param frequencyPenalty
// Frequency penalty setting. It affects the likelihood of the model to repeatedly use the same words or phrases. The value is passed through to the provider. The range depends on the provider and model.
// @param stopSequences
// Stop sequences. If set, the model will stop generating text when one of the stop sequences is generated.
// @param seed
// The seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.
// @param maxRetries — Maximum number of retries. Set to 0 to disable retries. Default: 2.
// @param abortSignal — An optional abort signal that can be used to cancel the call.
// @param headers — Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.
// @param maxSteps — Maximum number of sequential LLM calls (steps), e.g. when you use tool calls.
// @param onChunk — Callback that is called for each chunk of the stream. The stream processing will pause until the callback promise is resolved.
// @param onError — Callback that is called when an error occurs during streaming. You can use it to log errors.
// @param onStepFinish — Callback that is called when each step (LLM call) is finished, including intermediate steps.
// @param onFinish
// Callback that is called when the LLM response and all request tool executions (for tools that have an execute function) are finished.
// @return — A result object for accessing different stream types and additional information.
