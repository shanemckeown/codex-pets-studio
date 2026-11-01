import { openai,apiError,guard,StudioError } from '@/lib/server';
export const runtime='nodejs';
export async function POST(request:Request){try{
  guard(request,'transcribe',12);
  if(Number(request.headers.get('content-length'))>8_000_000)throw new StudioError('Keep recordings under 30 seconds.',413);
  const form=await request.formData();const file=form.get('audio');
  if(!(file instanceof File)||file.size>8_000_000||file.size===0)throw new StudioError('Please record a short command.');
  const result=await openai().audio.transcriptions.create({file,model:process.env.OPENAI_TRANSCRIBE_MODEL||'gpt-transcribe',prompt:'Pet studio expression commands: look curious, smile, blink, working, thinking, disappointed, frown, celebrate, greeting, inspect the result, look left, look right.'});
  return Response.json({text:result.text});
}catch(error){return apiError(error);}}
