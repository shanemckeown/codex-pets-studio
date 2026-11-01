import {openai,guard,boundedJson,apiError,StudioError} from '@/lib/server';
export const runtime='nodejs';
export async function POST(request:Request){try{
  guard(request,'character',5);const body=await boundedJson(request);
  if(typeof body.prompt!=='string'||body.prompt.trim().length<5||body.prompt.length>600)throw new StudioError('Describe a face-like character in 5–600 characters.');
  const result=await openai().images.generate({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2.5-sunburst',n:1,size:'1024x1024',quality:'medium',output_format:'jpeg',output_compression:85,prompt:`Create one original fictional humanoid character portrait for a facial-animation authoring tool. User character idea: ${body.prompt}. Production constraints: a single front-facing face with ordinary human facial proportions, exactly two visible eyes, a clear nose and a gently closed neutral mouth, relaxed eyebrows, centered entire forehead-to-chin, head upright, bright even studio lighting, plain neutral background. Keep the face large, sharp and clearly readable. No text, watermarks, masks, helmets, extra faces, cropped chin or exaggerated nonhuman facial anatomy. Fine fantasy skin colors and subtle metallic facial materials are welcome. Render the identity within the facial oval: the animation tool preserves the face surface, not hair, ears, horns or a full body. Do not depict an identifiable real person.`});
  const bytes=result.data?.[0]?.b64_json;if(!bytes)throw new StudioError('No portrait was returned. Try again explicitly with a simpler prompt.',502);
  return Response.json({image:'data:image/jpeg;base64,'+bytes,model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2.5-sunburst'});
}catch(e){return apiError(e);}}
