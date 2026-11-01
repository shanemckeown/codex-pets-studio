import {describe,it,expect} from 'vitest';
import {SHOTS,type Captures} from './pet';
import {parsePhotoSet,serializePhotoSet} from './photo-set';
const fixture=()=>Object.fromEntries(SHOTS.filter(s=>s.required).map(s=>[s.id,{image:'data:image/jpeg;base64,YWJj',name:'private original filename',displayMirrored:true}])) as Captures;
describe('private local photo-set files',()=>{
  it('round-trips all seven originals and display-only mirroring',()=>{const input=fixture(),output=parsePhotoSet(serializePhotoSet(input));expect(Object.keys(output)).toHaveLength(7);expect(output.front?.image).toBe(input.front?.image);expect(output.front?.displayMirrored).toBe(true);expect(output.front?.name).toBe('Neutral front');});
  it('requires a supported version and every required capture',()=>{expect(()=>parsePhotoSet(JSON.stringify({version:2,captures:fixture()}))).toThrow('version 1');const captures=fixture();delete captures.frown;expect(()=>parsePhotoSet(JSON.stringify({version:1,captures}))).toThrow('Gentle frown');});
  it('rejects remote and executable image references',()=>{for(const image of ['https://example.com/photo.jpg','javascript:alert(1)','data:image/svg+xml;base64,YWJj']){const captures=fixture();captures.front!.image=image;expect(()=>parsePhotoSet(JSON.stringify({version:1,captures}))).toThrow('inline JPEG');}});
  it('rejects malformed JSON and ignores unrelated fields',()=>{expect(()=>parsePhotoSet('{broken')).toThrow('not valid');const data=JSON.parse(serializePhotoSet(fixture()));data.captures.unrelated={image:'secret'};expect(Object.keys(parsePhotoSet(JSON.stringify(data)))).toHaveLength(7);});
});
