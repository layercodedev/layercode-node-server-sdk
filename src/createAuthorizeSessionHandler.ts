const DEFAULT_AUTHORIZE_ENDPOINT = 'https://api.layercode.com/v1/agents/web/authorize_session';

export interface CreateAuthorizeSessionHandlerOptions {
  /**
   * Layercode API key. Defaults to process.env.LAYERCODE_API_KEY.
   */
  apiKey?: string;
  /**
   * Override the Layercode authorize session endpoint (mainly for testing).
   */
  endpoint?: string;
  /**
    * Allows you to transform the incoming body before forwarding it to Layercode.
    */
  transformBody?: (body: any) => any;
}

/**
 * Creates a Next.js-compatible route handler that proxies authorize-session requests to Layercode.
 *
 * ```ts
 * import { createAuthorizeSessionHandler } from 'layercode-node-server-sdk';
 *
 * export const dynamic = 'force-dynamic';
 * export const POST = createAuthorizeSessionHandler();
 * ```
 */
export const createAuthorizeSessionHandler = (options: CreateAuthorizeSessionHandlerOptions = {}) => {
  const endpoint = options.endpoint ?? DEFAULT_AUTHORIZE_ENDPOINT;

  return async function authorizeSessionRoute(request: Request): Promise<Response> {
    try {
      const apiKey = options.apiKey ?? process.env.LAYERCODE_API_KEY;
      if (!apiKey) {
        throw new Error('LAYERCODE_API_KEY is not set.');
      }

      const incomingBody = await request.json();
      if (!incomingBody?.agent_id) {
        throw new Error('Missing agent_id in request body.');
      }

      const payload = options.transformBody ? options.transformBody(incomingBody) : incomingBody;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }

      const json = await response.json();
      return new Response(JSON.stringify(json), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Layercode authorize session response error:', message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
};
