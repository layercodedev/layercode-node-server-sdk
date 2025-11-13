# Layercode Node.js Server Side SDK

Implement the Layercode Webhook SSE API in your Node.js backend with this SDK.

## Installation

```bash
npm install @layercode/node-server-sdk
```

## Usage

### Next.js authorize helper

```ts
// app/api/authorize/route.ts
export const dynamic = 'force-dynamic';
import { createAuthorizeSessionHandler } from '@layercode/node-server-sdk';

export const POST = createAuthorizeSessionHandler();
```

The helper reads `LAYERCODE_API_KEY` from the environment and proxies the request to Layercode. You can override the key, endpoint, or transform the outgoing body if needed.

For other use cases (webhook streaming, signature verification, etc.) read the docs: [https://docs.layercode.com/sdk-reference/node_js_sdk](https://docs.layercode.com/sdk-reference/node_js_sdk)
