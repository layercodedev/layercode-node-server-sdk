/**
 * Creates a server-sent events (SSE) stream response for the Layercode pipeline.
 * @param requestBody - The full request body (parsed JSON) from the webhook route.
 * @param handler - Async function that receives helpers for writing to the stream.
 * @returns Response object
 */

export interface StreamResponseHandlerHelpers {
  stream: {
    tts: (content: string) => void;
    ttsTextStream: (textStream: AsyncIterable<string>) => Promise<void>;
    data: (content: any) => void;
    // other?: (type: string, payload: any) => void;
    end: () => void;
  };
}

export type StreamResponseHandler = (helpers: StreamResponseHandlerHelpers) => Promise<void>;

export function streamResponse(requestBody: Record<string, any>, handler: StreamResponseHandler): Response {
  let streamController: ReadableStreamDefaultController<Uint8Array>;
  const encoder = new TextEncoder();
  const body = requestBody || {};

  // Helper to format and enqueue SSE events, merging turn_id if present
  function sendEvent(eventType: string, content: Record<string, any>) {
    const merged = { ...content };
    if (body.turn_id) merged.turn_id = body.turn_id;
    const sse = `data: ${JSON.stringify({ type: eventType, ...merged })}\n\n`;
    streamController.enqueue(encoder.encode(sse));
  }

  // Write helpers
  const stream = {
    tts: (content: any) => sendEvent('response.tts', { content }),
    ttsTextStream: async (textStream: AsyncIterable<any>) => {
      for await (const chunk of textStream) {
        stream.tts(chunk);
      }
    },
    data: (content: any) => sendEvent('response.data', { content }),
    // other: (type: string, payload: any) => sendEvent(type, payload),
    end: () => {
      sendEvent('response.end', {});
      streamController.close();
    },
  };

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      streamController = controller;
      try {
        await handler({ stream });
      } catch (err: any) {
        sendEvent('response.error', { error: err.message });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Encoding': 'none',
    },
  });
}
