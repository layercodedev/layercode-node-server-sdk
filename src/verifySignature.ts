import { createHmac } from 'crypto';

// timestampTolerance is the number of seconds that the timestamp can be off by. Default is 300 seconds (5 minutes).
export function verifySignature({ payload, signature, secret, timestampTolerance = 300 }: { payload: string; signature: string; secret: string; timestampTolerance?: number }): boolean {
  // signature is expected to be in the format: t=timestamp,v1=signature
  const match = signature.match(/t=(\d+),v1=([a-fA-F0-9]+)/);
  if (!match) return false;
  const timestamp = parseInt(match[1], 10);
  const v1 = match[2];
  const now = Math.floor(Date.now() / 1000); // current time in seconds
  if (Math.abs(now - timestamp) > timestampTolerance) {
    return false;
  }
  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');
  return expected === v1;
}