import { getBytes, messageListFromString } from './sseParse';

/**
 * Parses a Workers AI SSE JSON stream and invokes the provided TTS callback
 * with each text chunk. Returns the concatenated text.
 */
export async function ttsWorkersAIStream(
  llmResponseStream: ReadableStream<Uint8Array>,
  tts: (content: string) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  const abort = new AbortController();
  let pendingData = '';
  let combinedText = '';

  await getBytes(abort, llmResponseStream, (arr) => {
    const text = pendingData + decoder.decode(arr, { stream: true });
    const result = messageListFromString(text);
    pendingData = result.leftoverData ?? '';
    for (const msg of result.messages) {
      const data = (msg.data || '').trim();
      if (!data) continue;
      if (data === '[DONE]') {
        abort.abort('done');
        break;
      }
      try {
        const json = JSON.parse(data);
        const chunk = typeof json?.response === 'string' ? json.response : '';
        if (chunk) {
          tts(chunk);
          combinedText += chunk;
        }
      } catch {
        // ignore non-JSON payloads
      }
    }
  });

  return combinedText;
}
