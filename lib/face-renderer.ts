import * as THREE from 'three';
import {meshIndices,type Landmark} from './studio';
import {procedural,referenceFor,REST,type Captures,type ShotId,type Pose} from './pet';
import {createGaussianSurface} from './gaussian-surface';
export type SurfaceMode='mesh'|'gaussian';
export type FaceAsset={points:Landmark[];texture:THREE.Texture;image:HTMLImageElement;id:ShotId;approximate:boolean};
export type FaceAssets=Partial<Record<ShotId,FaceAsset>> & {front:FaceAsset};
export async function loadFaces(captures:Captures):Promise<{assets:FaceAssets;indices:number[]}> {
  const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision');
  const vision=await FilesetResolver.forVisionTasks('/mediapipe');
  const model=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:2});
  const assets:Partial<Record<ShotId,FaceAsset>>={};
  try {for(const [id,capture]of Object.entries(captures)){
    const image=new Image();image.src=capture.image;await image.decode();const result=model.detect(image);
    if(result.faceLandmarks.length!==1)throw new Error(`${capture.name}: ${result.faceLandmarks.length?'use a photo with one face':'no clear face found'}.`);
    const texture=new THREE.Texture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;
    assets[id as ShotId]={id:id as ShotId,points:result.faceLandmarks[0].slice(0,468),texture,image,approximate:!!(captures.front?.demo||captures.front?.generated)};
  }}catch(e){Object.values(assets).forEach(a=>a.texture.dispose());throw e;}finally{model.close();}
  if(!assets.front)throw new Error('Add a neutral front photo first.');
  const indices=meshIndices(FaceLandmarker.FACE_LANDMARKS_TESSELATION);
  // MediaPipe's tessellation deliberately omits the eye/mouth interiors. Close those
  // photographic regions too; otherwise the texture becomes a mask with empty eyes.
  for(const contour of [[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246],[263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466],[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191]])for(let i=1;i<contour.length-1;i++)indices.push(contour[0],contour[i],contour[i+1]);
  return {assets:assets as FaceAssets,indices};
}
function normalized(a:FaceAsset){const p=a.points,aspect=a.image.width/a.image.height,minY=Math.min(...p.map(v=>v.y)),maxY=Math.max(...p.map(v=>v.y));const cx=(p[234].x+p[454].x)/2,cy=(minY+maxY)/2,s=2.8/(maxY-minY),cz=p[1].z;return p.map(v=>new THREE.Vector3((v.x-cx)*s*aspect,-(v.y-cy)*s,-(v.z-cz)*s*aspect));}
function registerToFront(points:THREE.Vector3[],front:THREE.Vector3[]){
  const frame=(p:THREE.Vector3[])=>{const origin=p[33].clone().add(p[263]).multiplyScalar(.5),x=p[263].clone().sub(p[33]).normalize(),y=origin.clone().sub(p[152]);y.addScaledVector(x,-y.dot(x)).normalize();return {origin,x,y,z:x.clone().cross(y).normalize(),width:p[263].distanceTo(p[33])};};
  const from=frame(points),to=frame(front),scale=to.width/from.width;
  return points.map(p=>{const v=p.clone().sub(from.origin);return to.origin.clone().addScaledVector(to.x,v.dot(from.x)*scale).addScaledVector(to.y,v.dot(from.y)*scale).addScaledVector(to.z,v.dot(from.z)*scale);});
}
export function createFaceRenderer(assets:FaceAssets,indices:number[],width:number,height:number,mode:SurfaceMode='mesh'){
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,width/height,.1,100);camera.position.z=6.3;
  const geometry=new THREE.BufferGeometry();geometry.setIndex(indices);const positions=new Float32Array(468*3),uv=new Float32Array(468*2),uv2=new Float32Array(468*2);
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setAttribute('uvRef',new THREE.BufferAttribute(uv2,2));
  const material=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:{baseMap:{value:assets.front.texture},refMap:{value:assets.front.texture},mixAmount:{value:0}},vertexShader:'attribute vec2 uvRef; varying vec2 vUv; varying vec2 vRef; void main(){vUv=uv;vRef=uvRef;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D baseMap; uniform sampler2D refMap; uniform float mixAmount; varying vec2 vUv; varying vec2 vRef; void main(){gl_FragColor=mix(texture2D(baseMap,vUv),texture2D(refMap,vRef),mixAmount);\n#include <colorspace_fragment>\n}'});
  const mesh=new THREE.Mesh(geometry,material);scene.add(mesh);const normalizedAssets=Object.fromEntries(Object.entries(assets).map(([id,a])=>[id,normalized(a)])) as Partial<Record<ShotId,THREE.Vector3[]>>;const neutral=normalizedAssets.front!;
  const gaussians=mode==='gaussian'?createGaussianSurface(assets,indices,camera):null;if(gaussians){scene.add(gaussians.mesh);mesh.visible=false;}
  for(const id of ['smile','blink','brows','frown'] as ShotId[])if(normalizedAssets[id])normalizedAssets[id]=registerToFront(normalizedAssets[id]!,neutral);
  function render(pose:Pose){
    const selected=referenceFor(pose,assets),reference=assets[selected.id],weight=selected.weight;
    const ref=reference??assets.front,isAngle=['left','right','farLeft','farRight'].includes(ref.id),rp=isAngle?neutral:normalizedAssets[ref.id]!;material.uniforms.refMap.value=ref.texture;material.uniforms.mixAmount.value=weight;
    const proceduralPose=assets.front.approximate?{...pose,smile:reference?.id==='smile'||reference?.id==='frown'?0:pose.smile,blink:reference?.id==='blink'?0:pose.blink,brows:reference?.id==='brows'||reference?.id==='frown'?0:pose.brows}:{...REST};
    const h=Math.abs(assets.front.points[152].y-assets.front.points[10].y),sc=2.8/h;
    for(let i=0;i<468;i++){
      const changed=procedural(assets.front.points,i,proceduralPose),original=assets.front.points[i],a=neutral[i],b=rp[i];
      positions[i*3]=a.x+(b.x-a.x)*weight+(changed.x-original.x)*sc*assets.front.image.width/assets.front.image.height;positions[i*3+1]=a.y+(b.y-a.y)*weight-(changed.y-original.y)*sc;positions[i*3+2]=a.z+(b.z-a.z)*weight;
      uv[i*2]=original.x;uv[i*2+1]=1-original.y;uv2[i*2]=ref.points[i].x;uv2[i*2+1]=1-ref.points[i].y;
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.uv.needsUpdate=true;geometry.attributes.uvRef.needsUpdate=true;geometry.computeBoundingSphere();mesh.rotation.set(pose.pitch,pose.yaw,pose.roll);mesh.position.y=pose.lift;mesh.scale.setScalar(pose.scale);gaussians?.update(positions,ref.id,weight,pose,width,height);renderer.render(scene,camera);
  }
  return {canvas:renderer.domElement,render,splatCount:gaussians?.count??0,resize(w:number,h:number){width=w;height=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){gaussians?.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();}};
}
export function disposeAssets(assets:FaceAssets){Object.values(assets).forEach(a=>a.texture.dispose());}
