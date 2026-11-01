'use client';
import {useEffect,useRef,useState} from 'react';
import {createFaceRenderer,type FaceAssets,type SurfaceMode} from '@/lib/face-renderer';
import {REST,framePose,DURATIONS,STATES,type PetState,type Pose} from '@/lib/pet';
export default function FaceView({assets,indices,state,playing,yaw,onYaw,manual,mode='mesh'}:{assets:FaceAssets;indices:number[];state:PetState;playing:boolean;yaw:number;onYaw:(v:number)=>void;manual?:Partial<Pose>;mode?:SurfaceMode}){
  const host=useRef<HTMLDivElement>(null),live=useRef({state,playing,yaw,manual}),callback=useRef(onYaw);live.current={state,playing,yaw,manual};callback.current=onYaw;const [error,setError]=useState('');
  useEffect(()=>{if(!host.current)return;const container=host.current;let face:ReturnType<typeof createFaceRenderer>;try{face=createFaceRenderer(assets,indices,420,480,mode);}catch{setError('WebGL is unavailable. Try a browser with hardware acceleration.');return;}
    face.canvas.setAttribute('aria-label','Animated estimated facial surface. Drag to turn.');container.append(face.canvas);let frame=0,startTime=performance.now(),previousState=live.current.state;let dragging=false,start=0;
    const down=(e:PointerEvent)=>{dragging=true;start=e.clientX;face.canvas.setPointerCapture(e.pointerId);};const move=(e:PointerEvent)=>{if(dragging){callback.current(Math.max(-.55,Math.min(.55,live.current.yaw+(e.clientX-start)*.005)));start=e.clientX;}};const up=()=>{dragging=false;};
    face.canvas.addEventListener('pointerdown',down);face.canvas.addEventListener('pointermove',move);face.canvas.addEventListener('pointerup',up);face.canvas.addEventListener('pointercancel',up);
    const observer=new ResizeObserver(()=>face.resize(container.clientWidth,container.clientHeight));observer.observe(container);
    const tick=(time:number)=>{const current=live.current;if(current.state!==previousState){startTime=time;previousState=current.state;}const row=STATES.indexOf(current.state),durations=DURATIONS[row];let elapsed=(time-startTime)%durations.reduce((a,b)=>a+b,0),col=0;while(elapsed>=durations[col]&&col<durations.length-1){elapsed-=durations[col];col++;}const p=current.playing?framePose(row,col):{...REST};face.render({...p,...current.manual,yaw:p.yaw+current.yaw});frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();face.dispose();};
  },[assets,indices,mode]);return <div className="face-canvas" ref={host}>{error&&<p className="error">{error}</p>}</div>;
}
