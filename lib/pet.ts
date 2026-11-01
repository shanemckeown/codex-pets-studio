import {clamp, regionWeights, type Landmark} from './studio';
export const SHOTS = [
  {id:'front',title:'Neutral front',hint:'Face the camera. Relax your mouth and keep both eyes open.',required:true},
  {id:'left',title:'Slight left',hint:'Turn your head slightly toward your left. Keep both eyes visible.',required:true},
  {id:'right',title:'Slight right',hint:'Turn your head slightly toward your right. Keep both eyes visible.',required:true},
  {id:'smile',title:'Gentle smile',hint:'Face forward and give a gentle, closed-mouth smile.',required:true},
  {id:'blink',title:'Eyes gently closed',hint:'Face forward. Gently close both eyes without scrunching.',required:true},
  {id:'brows',title:'Raised eyebrows',hint:'Face forward. Raise your eyebrows and keep your mouth relaxed.',required:true},
  {id:'frown',title:'Gentle frown',hint:'Face forward. Gently draw your eyebrows together and frown.',required:true},
  {id:'farLeft',title:'Further left',hint:'Optional: turn a little further left, keeping part of both eyes visible.',required:false},
  {id:'farRight',title:'Further right',hint:'Optional: turn a little further right, keeping part of both eyes visible.',required:false},
] as const;
export type ShotId=typeof SHOTS[number]['id'];
export type Capture={image:string;name:string;demo?:boolean;generated?:boolean};
export type Captures=Partial<Record<ShotId,Capture>>;
export const STATES=['idle','running-right','running-left','waving','jumping','failed','waiting','running','review'] as const;
export type PetState=typeof STATES[number];
export const COUNTS=[6,8,8,4,5,8,6,6,6] as const;
export const DURATIONS=[[280,110,110,140,140,320],[120,120,120,120,120,120,120,220],[120,120,120,120,120,120,120,220],[140,140,140,280],[140,140,140,140,280],[140,140,140,140,140,140,140,240],[150,150,150,150,150,260],[120,120,120,120,120,220],[150,150,150,150,150,280]];
export const STATE_LABELS:Record<PetState,string>={idle:'Resting', 'running-right':'Moving right','running-left':'Moving left',waving:'Hello',jumping:'Celebrating',failed:'Disappointed',waiting:'Needs input',running:'Working',review:'Ready to review'};
export type Pose={smile:number;blink:number;brows:number;yaw:number;pitch:number;roll:number;lift:number;scale:number};
export const REST:Pose={smile:0,blink:0,brows:0,yaw:0,pitch:0,roll:0,lift:0,scale:1};
export function poseFor(state:PetState,phase:number):Pose {
  const t=((phase%1)+1)%1,s=Math.sin(t*Math.PI*2),p={...REST};
  switch(state){
    case 'idle':p.blink=t>.16&&t<.45?Math.sin((t-.16)/.29*Math.PI):0;p.lift=s*.015;break;
    case 'running-right':p.yaw=.3;p.roll=s*.055;p.lift=Math.abs(s)*.06;p.smile=.2;break;
    case 'running-left':p.yaw=-.3;p.roll=-s*.055;p.lift=Math.abs(s)*.06;p.smile=.2;break;
    case 'waving':p.smile=.8;p.roll=s*.16;p.yaw=s*.13;p.brows=.35;break;
    case 'jumping':p.lift=Math.sin(t*Math.PI)*.4;p.scale=1-.05*Math.cos(t*Math.PI*2);p.smile=.9;p.brows=.4;break;
    case 'failed':p.pitch=.13;p.roll=-.10+s*.025;p.smile=-.35;p.brows=-.35;p.blink=.25;break;
    case 'waiting':p.brows=.75;p.roll=.12;p.yaw=s*.10;p.smile=.1;break;
    case 'running':p.pitch=.05;p.yaw=s*.17;p.brows=.18;p.blink=t>.5&&t<.7?Math.sin((t-.5)/.2*Math.PI):0;break;
    case 'review':p.smile=.3;p.pitch=.07+s*.035;p.yaw=s*.10;p.roll=.035;p.brows=.15;break;
  }return p;
}
export function gazePose(index:number):Pose {const a=index*Math.PI/8;return {...REST,yaw:Math.sin(a)*.28,pitch:-Math.cos(a)*.16};}
export function framePose(row:number,col:number):Pose {if(row===0&&col===6)return {...REST};return row<9?poseFor(STATES[row],col/(row===4?COUNTS[row]-1:COUNTS[row])):gazePose((row-9)*8+col);}
export function usedCell(row:number,col:number){return row>=0&&row<11&&col>=0&&(col<(row<9?COUNTS[row]:8)||(row===0&&col===6));}
export function referenceFor(pose:Pose,available:Partial<Record<ShotId,unknown>>):{id:ShotId;weight:number}{
  if(pose.smile<-.05&&available.frown)return {id:'frown',weight:Math.min(1,-pose.smile*2.4)};
  if(pose.blink>.05&&available.blink)return {id:'blink',weight:pose.blink};
  if(pose.brows>.5&&available.brows)return {id:'brows',weight:pose.brows};
  if(pose.smile>.05&&available.smile)return {id:'smile',weight:pose.smile};
  if(pose.brows>.05&&available.brows)return {id:'brows',weight:pose.brows};
  if(Math.abs(pose.yaw)>.2){
    const id:ShotId=pose.yaw>0?(available.farLeft&&pose.yaw>.42?'farLeft':'left'):(available.farRight&&pose.yaw<-.42?'farRight':'right');
    if(available[id])return {id,weight:Math.min(.65,(Math.abs(pose.yaw)-.2)*2)};
  }return {id:'front',weight:0};
}
export function manifest(name:string){const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'face-companion';return {id,displayName:name.trim().slice(0,60)||'Face companion',description:'A photo-made facial companion, created in Codex Pets Studio.',spriteVersionNumber:2,spritesheetPath:'spritesheet.png'};}
export function procedural(points:Landmark[],i:number,pose:Pose):Landmark {
  const p={...points[i]},w=regionWeights(points,i),mouth=points[13],width=Math.abs(points[454].x-points[234].x),height=Math.abs(points[152].y-points[10].y);
  // Shared smooth facial-region weights also remain usable for artistic/cosmetic illustrations.
  const corner=Math.min(1,Math.abs(p.x-mouth.x)/(width*.17));
  p.y-=pose.smile*w.lips*corner*height*.045;p.x+=(p.x-mouth.x)*pose.smile*w.lips*.09;
  const eyeSide=p.x<points[1].x?[33,133,159,145]:[263,362,386,374];
  const [a,b,upper,lower]=eyeSide.map(n=>points[n]);const cx=(a.x+b.x)/2,cy=(upper.y+lower.y)/2;
  const eye=Math.exp(-3*(((p.x-cx)/(width*.16))**2+((p.y-cy)/(height*.06))**2));
  p.y+=(cy-p.y)*clamp(pose.blink,0,1)*eye*.98;
  const brow=Math.exp(-3*(((p.x-cx)/(width*.22))**2+((p.y-(cy-height*.06))/(height*.05))**2));
  p.y-=pose.brows*brow*height*.035;return p;
}
