import {createFaceRenderer,type FaceAssets,type SurfaceMode} from './face-renderer';
import {framePose,usedCell,manifest} from './pet';
import {zipStore} from './zip';
export type ExportResult={url:string;atlasUrl:string;filename:string;report:string;atlas:HTMLCanvasElement};
export function validateAtlas(canvas:HTMLCanvasElement){
  if(canvas.width!==1536||canvas.height!==2288)throw new Error('Incorrect atlas dimensions.');
  const context=canvas.getContext('2d')!;let used=0;
  for(let row=0;row<11;row++)for(let col=0;col<8;col++){
    const pixels=context.getImageData(col*192,row*208,192,208).data;let opaque=0,edge=0;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]){opaque++;const n=(i-3)/4,x=n%192,y=Math.floor(n/192);if(x===0||x===191||y===0||y===207)edge++;}
    if(usedCell(row,col)){used++;if(opaque<100)throw new Error(`Empty required frame ${row}:${col}.`);if(edge)throw new Error(`Frame ${row}:${col} touches the edge. Reduce the face size.`);}else if(opaque)throw new Error(`Unused cell ${row}:${col} is not transparent.`);
  }if(used!==74)throw new Error('Incorrect required frame count.');return 'Validated: 1536 × 2288 · 73 animation/gaze frames + neutral · 14 transparent unused cells · no clipped edges';
}
export async function exportPet(assets:FaceAssets,indices:number[],name:string,onProgress:(n:number)=>void,mode:SurfaceMode='mesh'):Promise<ExportResult>{
  const face=createFaceRenderer(assets,indices,192,208,mode),atlas=document.createElement('canvas');atlas.width=1536;atlas.height=2288;const context=atlas.getContext('2d')!;
  try{let count=0;for(let row=0;row<11;row++)for(let col=0;col<8;col++)if(usedCell(row,col)){
    face.render(framePose(row,col));context.drawImage(face.canvas,col*192,row*208);onProgress(++count);if(count%8===0)await new Promise(r=>requestAnimationFrame(r));
  }}finally{face.dispose();}
  const report=validateAtlas(atlas),blob=await new Promise<Blob>((resolve,reject)=>atlas.toBlob(b=>b?resolve(b):reject(new Error('Could not encode the atlas.')),'image/png'));
  const pet=manifest(name),encode=(s:string)=>new TextEncoder().encode(s),files={'pet.json':encode(JSON.stringify(pet,null,2)+'\n'),'spritesheet.png':new Uint8Array(await blob.arrayBuffer()),'INSTALL.txt':encode(`Codex Pets Studio desktop export\n\n1. Unzip this package.\n2. Create ~/.codex/pets/${pet.id}/ (or $CODEX_HOME/pets/${pet.id}/).\n3. Place pet.json and spritesheet.png inside that folder.\n4. Open desktop Settings > Pets, Refresh, and select ${pet.displayName}.\n\nDesktop v2 local package; not the web sprite upload format.\nNo app files were changed by this download.\n`)};
  const zip=zipStore(files);return {url:URL.createObjectURL(new Blob([zip.buffer as ArrayBuffer],{type:'application/zip'})),atlasUrl:URL.createObjectURL(blob),filename:pet.id+'.zip',report,atlas};
}
