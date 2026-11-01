import * as THREE from 'three';
import type {FaceAssets} from './face-renderer';
import type {ShotId,Pose} from './pet';

// Actual anisotropic 3D Gaussian primitives sampled on the landmark-estimated
// surface. This is a renderer/representation, not learned multi-view reconstruction.
// Covariances are projected by the perspective Jacobian and alpha-composited in
// depth order. Each primitive stores a photographic colour, not a point sprite.
type Sample={a:number;b:number;c:number;u:number;v:number;w:number;n:number};
export function createGaussianSurface(assets:FaceAssets,indices:number[],camera:THREE.Camera){
  const points=assets.front.points,areas:number[]=[];
  for(let i=0;i<indices.length;i+=3){const a=points[indices[i]],b=points[indices[i+1]],c=points[indices[i+2]];areas.push(Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))*.5);}
  const total=areas.reduce((a,b)=>a+b,0),samples:Sample[]=[];
  for(let t=0;t<areas.length;t++){
    const n=Math.max(1,Math.ceil(areas[t]/total*12000));
    for(let k=0;k<n;k++){const r=Math.sqrt((k+.5)/n),s=(k*.61803398875+.37)%1;samples.push({a:indices[t*3],b:indices[t*3+1],c:indices[t*3+2],u:1-r,v:r*(1-s),w:r*s,n});}
  }
  const count=samples.length,colours:Partial<Record<ShotId,Float32Array>>={};
  const linear=(v:number)=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  for(const [id,asset]of Object.entries(assets)){
    const canvas=document.createElement('canvas');canvas.width=asset.image.width;canvas.height=asset.image.height;const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(asset.image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data,out=new Float32Array(count*3);
    samples.forEach((s,i)=>{const a=asset.points[s.a],b=asset.points[s.b],c=asset.points[s.c],x=Math.min(canvas.width-1,Math.max(0,Math.round((a.x*s.u+b.x*s.v+c.x*s.w)*canvas.width))),y=Math.min(canvas.height-1,Math.max(0,Math.round((a.y*s.u+b.y*s.v+c.y*s.w)*canvas.height))),offset=(y*canvas.width+x)*4;for(let q=0;q<3;q++)out[i*3+q]=linear(pixels[offset+q]);});colours[id as ShotId]=out;
  }
  const geometry=new THREE.InstancedBufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-3,-3,0,3,-3,0,3,3,0,-3,3,0],3));geometry.setIndex([0,1,2,0,2,3]);geometry.instanceCount=count;
  const centers=new Float32Array(count*3),axisU=new Float32Array(count*3),axisV=new Float32Array(count*3),axisN=new Float32Array(count*3),rgb=new Float32Array(count*3);
  for(const [name,array]of Object.entries({center:centers,axisU,axisV,axisN,splatColor:rgb}))geometry.setAttribute(name,new THREE.InstancedBufferAttribute(array,3).setUsage(THREE.DynamicDrawUsage));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,uniforms:{viewport:{value:new THREE.Vector2(192,208)}},vertexShader:`
    attribute vec3 center, axisU, axisV, axisN, splatColor;
    uniform vec2 viewport;
    varying vec2 gaussian; varying vec3 colour;
    vec2 projectAxis(vec3 c, vec3 a){float d=max(.01,-c.z);return vec2(projectionMatrix[0][0]*(a.x*d+c.x*a.z),projectionMatrix[1][1]*(a.y*d+c.y*a.z))/(d*d);}
    void main(){
      vec3 c=(modelViewMatrix*vec4(center,1.)).xyz;
      vec2 u=projectAxis(c,(modelViewMatrix*vec4(axisU,0.)).xyz),v=projectAxis(c,(modelViewMatrix*vec4(axisV,0.)).xyz),n=projectAxis(c,(modelViewMatrix*vec4(axisN,0.)).xyz);
      float a=u.x*u.x+v.x*v.x+n.x*n.x+pow(.6/viewport.x,2.),b=u.x*u.y+v.x*v.y+n.x*n.y,d=u.y*u.y+v.y*v.y+n.y*n.y+pow(.6/viewport.y,2.);
      float mid=(a+d)*.5,delta=sqrt(max(0.,(a-d)*(a-d)*.25+b*b)),l1=max(1e-10,mid+delta),l2=max(1e-10,mid-delta);
      vec2 e1=abs(b)>1e-12?normalize(vec2(b,l1-a)):(a>=d?vec2(1.,0.):vec2(0.,1.)),e2=vec2(-e1.y,e1.x);
      vec4 clip=projectionMatrix*vec4(c,1.);clip.xy+=(e1*sqrt(l1)*position.x+e2*sqrt(l2)*position.y)*clip.w;
      gl_Position=clip;gaussian=position.xy;colour=splatColor;
    }`,fragmentShader:`varying vec2 gaussian;varying vec3 colour;void main(){float alpha=.92*exp(-.5*dot(gaussian,gaussian));if(alpha<.0039)discard;gl_FragColor=vec4(colour,alpha);
      #include <colorspace_fragment>
    }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;const order=Array.from({length:count},(_,i)=>i),depth=new Float32Array(count),rawCenter=new Float32Array(count*3),rawU=new Float32Array(count*3),rawV=new Float32Array(count*3),rawN=new Float32Array(count*3),modelView=new THREE.Matrix4();
  function update(vertices:Float32Array,reference:ShotId,weight:number,pose:Pose,width:number,height:number){
    mesh.rotation.set(pose.pitch,pose.yaw,pose.roll);mesh.position.y=pose.lift;mesh.scale.setScalar(pose.scale);mesh.updateMatrixWorld();camera.updateMatrixWorld();modelView.multiplyMatrices(camera.matrixWorldInverse,mesh.matrixWorld);const e=modelView.elements;
    for(let i=0;i<count;i++){
      const s=samples[i],a=s.a*3,b=s.b*3,c=s.c*3,j=i*3;let ux=vertices[b]-vertices[a],uy=vertices[b+1]-vertices[a+1],uz=vertices[b+2]-vertices[a+2],vx=vertices[c]-vertices[a],vy=vertices[c+1]-vertices[a+1],vz=vertices[c+2]-vertices[a+2];
      let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const normalLength=Math.max(1e-9,Math.hypot(nx,ny,nz)),uLength=Math.max(1e-9,Math.hypot(ux,uy,uz)),radius=Math.sqrt(normalLength*.5/s.n)*.8;nx/=normalLength;ny/=normalLength;nz/=normalLength;ux/=uLength;uy/=uLength;uz/=uLength;vx=ny*uz-nz*uy;vy=nz*ux-nx*uz;vz=nx*uy-ny*ux;
      rawCenter[j]=vertices[a]*s.u+vertices[b]*s.v+vertices[c]*s.w;rawCenter[j+1]=vertices[a+1]*s.u+vertices[b+1]*s.v+vertices[c+1]*s.w;rawCenter[j+2]=vertices[a+2]*s.u+vertices[b+2]*s.v+vertices[c+2]*s.w;
      rawU.set([ux*radius,uy*radius,uz*radius],j);rawV.set([vx*radius,vy*radius,vz*radius],j);rawN.set([nx*radius*.12,ny*radius*.12,nz*radius*.12],j);depth[i]=e[2]*rawCenter[j]+e[6]*rawCenter[j+1]+e[10]*rawCenter[j+2]+e[14];
    }
    order.sort((a,b)=>depth[a]-depth[b]);const base=colours.front!,ref=colours[reference]??base;
    for(let i=0;i<count;i++){const source=order[i]*3,destination=i*3;for(let q=0;q<3;q++){centers[destination+q]=rawCenter[source+q];axisU[destination+q]=rawU[source+q];axisV[destination+q]=rawV[source+q];axisN[destination+q]=rawN[source+q];rgb[destination+q]=base[source+q]+(ref[source+q]-base[source+q])*weight;}}
    for(const attribute of Object.values(geometry.attributes))attribute.needsUpdate=true;material.uniforms.viewport.value.set(width,height);
  }
  return {mesh,count,update,dispose(){geometry.dispose();material.dispose();}};
}
