import OpenAI from 'openai';
export class StudioError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function openai() { if (!process.env.OPENAI_API_KEY) throw new StudioError('Add an OpenAI API key to the server to enable this feature.',503); return new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:120_000,maxRetries:0}); }
export function apiError(error: unknown) {
  if(error instanceof StudioError) return Response.json({error:error.message},{status:error.status});
  if(error instanceof OpenAI.APIError) {
    const message = error.status === 401 ? 'The server API key was rejected. Check its configuration.' : error.status === 429 ? 'The API is busy or its credits are exhausted. Please try again shortly.' : error.status === 403 ? 'This API feature is not available to the configured project.' : 'The AI request could not complete. Your current work is unchanged.';
    return Response.json({error:message},{status:error.status === 429 ? 429 : 502});
  }
  return Response.json({error:'That request could not complete. Please try again.'},{status:502});
}
const buckets = new Map<string,{count:number;until:number}>();
export function guard(request:Request, kind:string, limit=30) {
  const origin = request.headers.get('origin');
  // Next may normalize request.url to localhost even when the browser uses
  // 127.0.0.1. Compare the browser Origin with the actual HTTP Host instead.
  const host=request.headers.get('host')||new URL(request.url).host;
  if(origin && new URL(origin).host !== host) throw new StudioError('Please use the app to make this request.',403);
  const key = kind+':'+(request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local');
  const now=Date.now();
  for(const [k,b] of buckets) if(b.until<now) buckets.delete(k);
  const bucket=buckets.get(key) ?? {count:0,until:now+60_000};
  if(bucket.count>=limit) throw new StudioError('A few too many requests. Try again in a minute.',429);
  bucket.count++;buckets.set(key,bucket);
}
export async function boundedJson(request:Request) {
  const reader=request.body?.getReader(); if(!reader) throw new StudioError('Missing request.');
  const chunks:Uint8Array[]=[]; let size=0;
  while(true) { const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>10_000_000){await reader.cancel();throw new StudioError('Please use smaller photos.',413);}chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new StudioError('Invalid request.'); }
}
export function imageData(value:unknown):string {
  if(typeof value!=='string'||value.length>2_000_000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value))throw new StudioError('Use a JPEG, PNG or WebP photo under 1.5 MB.');return value;
}
