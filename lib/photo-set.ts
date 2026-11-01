import {SHOTS,type Captures,type ShotId} from './pet';
export function parsePhotoSet(text:string):Captures{
  if(text.length>20_000_000)throw new Error('Use a photo-set JSON file under 20 MB.');
  let data:unknown;try{data=JSON.parse(text);}catch{throw new Error('That file is not valid photo-set JSON.');}
  if(!data||typeof data!=='object')throw new Error('Choose a version 1 photo-set file.');
  const input=data as {version?:unknown;captures?:unknown};if(input.version!==1||!input.captures||typeof input.captures!=='object')throw new Error('Choose a version 1 photo-set file.');
  const result:Captures={},items=input.captures as Record<string,unknown>;
  for(const shot of SHOTS){const value=items[shot.id];if(value===undefined&&!shot.required)continue;if(!value||typeof value!=='object')throw new Error('The saved set is missing '+shot.title+'.');const capture=value as {image?:unknown;displayMirrored?:unknown};if(typeof capture.image!=='string'||capture.image.length>2_000_000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(capture.image))throw new Error('Use an inline JPEG, PNG or WebP for '+shot.title+'.');result[shot.id as ShotId]={image:capture.image,name:shot.title,displayMirrored:capture.displayMirrored===true};}
  return result;
}
export function serializePhotoSet(captures:Captures){return JSON.stringify({version:1,captures:parsePhotoSet(JSON.stringify({version:1,captures}))},null,2);}
