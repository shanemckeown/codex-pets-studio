import * as THREE from 'three';
import type {FaceAsset,FaceAssets,SurfaceMode} from './face-renderer';
import {referenceFor,type Pose,type ShotId} from './pet';
import type {Landmark} from './studio';
import {createGaussianSurface} from './gaussian-surface';

export type HeadPortrait={canvas:HTMLCanvasElement;texture:THREE.CanvasTexture;bounds:{left:number;top:number;right:number;bottom:number}};
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
/** Background removal stays local. Original photos and landmark points remain intact. */
export async function prepareHeadPortraits(assets:FaceAssets){
  const {FilesetResolver,ImageSegmenter}=await import('@mediapipe/tasks-vision');
  const files=await FilesetResolver.forVisionTasks('/mediapipe');
  const model=await ImageSegmenter.createFromOptions(files,{baseOptions:{modelAssetPath:'/models/selfie_multiclass.tflite',delegate:'CPU'},runningMode:'IMAGE',outputCategoryMask:true,outputConfidenceMasks:false});
  try{for(const asset of Object.values(assets)){
    const result=model.segment(asset.image);
    try{
      const mask=result.categoryMask;if(!mask)throw new Error('Head outline unavailable. Your photos are unchanged.');
      const w=mask.width,h=mask.height,categories=mask.getAsUint8Array(),small=document.createElement('canvas');small.width=w;small.height=h;const context=small.getContext('2d')!,pixels=context.createImageData(w,h),p=asset.points,faceHeight=Math.abs(p[152].y-p[10].y),faceWidth=Math.abs(p[454].x-p[234].x),cx=(p[454].x+p[234].x)/2;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=y*w+x,c=categories[i],nearHead=Math.abs(x/w-cx)<faceWidth*.9&&y/h<p[152].y+faceHeight*.07;
        const keep=c===1||c===3||((c===2||c===5)&&nearHead);pixels.data[i*4]=pixels.data[i*4+1]=pixels.data[i*4+2]=255;pixels.data[i*4+3]=keep?255:0;
      }
      context.putImageData(pixels,0,0);
      // Preserve all observed facial detail, including eyes/mouth, even if a
      // category boundary or accessory prediction divides the central face.
      context.fillStyle='white';context.beginPath();OVAL.forEach((i,n)=>{const point=p[i];if(n)context.lineTo(point.x*w,point.y*h);else context.moveTo(point.x*w,point.y*h);});context.closePath();context.fill();
      const data=context.getImageData(0,0,w,h);
      // Remove thin false-positive background threads before selecting the head.
      // Opening restores broad hair/ear boundaries after a one-pixel erosion.
      const eroded=new Uint8Array(w*h);
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let solid=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(data.data[((y+dy)*w+x+dx)*4+3]<128)solid=false;if(solid)eroded[y*w+x]=1;}
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){let solid=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h&&eroded[ny*w+nx])solid=true;}data.data[(y*w+x)*4+3]=solid?255:0;}
      const seen=new Uint8Array(w*h),queue=new Uint32Array(w*h);let start=Math.min(w*h-1,Math.max(0,Math.floor(p[1].y*h)*w+Math.floor(p[1].x*w))),read=0,end=1;queue[0]=start;seen[start]=1;
      while(read<end){const i=queue[read++],x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,j=ny*w+nx;if(nx>=0&&nx<w&&ny>=0&&ny<h&&!seen[j]&&data.data[j*4+3]>127){seen[j]=1;queue[end++]=j;}}}
      let minX=w,minY=h,maxX=0,maxY=0;
      for(let i=0;i<w*h;i++){if(!seen[i])data.data[i*4+3]=0;else{const x=i%w,y=Math.floor(i/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
      context.putImageData(data,0,0);
      const canvas=document.createElement('canvas');canvas.width=asset.image.width;canvas.height=asset.image.height;const out=canvas.getContext('2d')!;out.drawImage(asset.image,0,0);out.globalCompositeOperation='destination-in';out.imageSmoothingEnabled=true;out.drawImage(small,0,0,canvas.width,canvas.height);
      // Never sample a photograph's outermost pixel strip: clamped image-edge
      // texels otherwise appear as disconnected lines after reference alignment.
      const border=2;out.clearRect(0,0,canvas.width,border);out.clearRect(0,canvas.height-border,canvas.width,border);out.clearRect(0,0,border,canvas.height);out.clearRect(canvas.width-border,0,border,canvas.height);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
      asset.portrait={canvas,texture,bounds:{left:Math.max(0,(minX-2)/w),right:Math.min(1,(maxX+3)/w),top:Math.max(0,(minY-2)/h),bottom:Math.min(1,(maxY+3)/h)}};
    }finally{result.close();}
  }}finally{model.close();}
}
function registration(asset:FaceAsset){
  const a=asset.points[33],b=asset.points[263],w=asset.image.width,h=asset.image.height,ex=(a.x+b.x)*w/2,ey=(a.y+b.y)*h/2,dx=(b.x-a.x)*w,dy=(b.y-a.y)*h,distance=Math.hypot(dx,dy),c=dx/distance,s=dy/distance;
  return {toHead(u:number,v:number){const x=u*w-ex,y=v*h-ey;return {x:(x*c+y*s)/distance,y:(x*s-y*c)/distance};},toUv(x:number,y:number){return {x:(ex+distance*(c*x+s*y))/w,y:(ey+distance*(s*x-c*y))/h};}};
}
/** A full photographic head on a shallow surface, not inferred hair/ear anatomy. */
export function createHeadPortraitRenderer(assets:FaceAssets,width:number,height:number,mode:SurfaceMode){
  const transforms=Object.fromEntries(Object.entries(assets).map(([id,a])=>[id,registration(a)])) as Record<ShotId,ReturnType<typeof registration>>;
  let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
  for(const [id,a]of Object.entries(assets)){const b=a.portrait!.bounds,t=transforms[id as ShotId];for(const [u,v]of [[b.left,b.top],[b.right,b.top],[b.left,b.bottom],[b.right,b.bottom]]){const p=t.toHead(u,v);left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.max(top,p.y);bottom=Math.min(bottom,p.y);}}
  const cx=(left+right)/2,cy=(top+bottom)/2,scale=Math.min(2.6/(top-bottom),2.35/(right-left)),columns=40,rows=44;
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array((columns+1)*(rows+1)*3),indices:number[]=[],photoAssets={} as FaceAssets;
  for(const [id,a]of Object.entries(assets)){const points:Landmark[]=[];for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const px=left+(right-left)*x/columns,py=bottom+(top-bottom)*y/rows,uv=transforms[id as ShotId].toUv(px,py);points.push({x:uv.x,y:uv.y,z:0});}photoAssets[id as ShotId]={...a,points};}
  const headUv=new Float32Array((columns+1)*(rows+1)*2);
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const i=y*(columns+1)+x,px=left+(right-left)*x/columns,py=bottom+(top-bottom)*y/rows;positions[i*3]=(px-cx)*scale;positions[i*3+1]=(py-cy)*scale;positions[i*3+2]=.10*(1-((px-cx)/(right-left)*2)**2);headUv[i*2]=px;headUv[i*2+1]=py;if(x<columns&&y<rows){const a=i,b=i+1,c=i+columns+1,d=c+1;indices.push(a,b,c,b,d,c);}}
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('headUv',new THREE.BufferAttribute(headUv,2));geometry.setIndex(indices);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,width/height,.1,100);camera.position.z=6.3;
  const uniforms={baseMap:{value:assets.front.portrait!.texture},refMap:{value:assets.front.portrait!.texture},baseUv:{value:new THREE.Matrix3()},refUv:{value:new THREE.Matrix3()},mixAmount:{value:0}};
  const uvMatrix=(id:ShotId)=>{const t=transforms[id],a=t.toUv(0,0),b=t.toUv(1,0),c=t.toUv(0,1);return new THREE.Matrix3().set(b.x-a.x,c.x-a.x,a.x,-(b.y-a.y),-(c.y-a.y),1-a.y,0,0,1);};
  uniforms.baseUv.value=uvMatrix('front');
  const material=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms,vertexShader:'attribute vec2 headUv;varying vec2 vHead;void main(){vHead=headUv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D baseMap,refMap;uniform mat3 baseUv,refUv;uniform float mixAmount;varying vec2 vHead;
    vec4 photo(sampler2D image,vec2 uv){if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)return vec4(0.);return texture2D(image,uv);}
    void main(){vec4 a=photo(baseMap,(baseUv*vec3(vHead,1.)).xy),b=photo(refMap,(refUv*vec3(vHead,1.)).xy);float alpha=mix(a.a,b.a,mixAmount);if(alpha<.02)discard;vec3 colour=mix(a.rgb*a.a,b.rgb*b.a,mixAmount)/max(.00001,alpha);gl_FragColor=vec4(colour,alpha);
    #include <colorspace_fragment>
    }`});
  const mesh=new THREE.Mesh(geometry,material),gaussians=mode==='gaussian'?createGaussianSurface(photoAssets,indices,camera):null;scene.add(gaussians?gaussians.mesh:mesh);
  function render(pose:Pose){const chosen=referenceFor(pose,assets),ref=assets[chosen.id]?chosen.id:'front',motion={...pose,yaw:pose.yaw*.35,pitch:pose.pitch*.45,roll:pose.roll*.65,lift:pose.lift*.65};uniforms.refMap.value=assets[ref]!.portrait!.texture;uniforms.refUv.value=uvMatrix(ref);uniforms.mixAmount.value=chosen.weight;mesh.rotation.set(motion.pitch,motion.yaw,motion.roll);mesh.position.y=motion.lift;mesh.scale.setScalar(motion.scale);gaussians?.update(positions,ref,chosen.weight,motion,width,height);renderer.render(scene,camera);}
  return {canvas:renderer.domElement,render,splatCount:gaussians?.count??0,resize(w:number,h:number){width=w;height=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){gaussians?.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();}};
}
