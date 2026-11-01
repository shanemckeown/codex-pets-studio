import { StudioError } from './server';
export type Answer = { name:string;type:string;choice?:string;probability?:number;confidence?:number };
export async function decide(input:unknown, questions:unknown[]):Promise<{answers:Answer[];elapsed:number}> {
  if(!process.env.OPENAI_API_KEY)throw new StudioError('Add an OpenAI API key to enable Decisions.',503);
  const started=Date.now();
  const response=await fetch('https://api.openai.com/v1/decisions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_DECISIONS_MODEL||'gpt-6-luna',input,questions}),signal:AbortSignal.timeout(30_000)});
  if(!response.ok)throw new StudioError(response.status===429?'Decisions is busy or out of credits. Try again shortly.':'Decisions is unavailable for this request. You can still use the face controls.',response.status===429?429:502);
  const data=await response.json();
  if(!Array.isArray(data.answers)||data.answers.some((a:Answer)=>a.type==='refusal'))throw new StudioError('Decisions could not assess that input. Try another photo or command.',422);
  return {answers:data.answers,elapsed:Date.now()-started};
}
export function choice(name:string,instructions:string,values:Record<string,string>) { return {type:'choice',name,instructions,choices:Object.entries(values).map(([value,description])=>({value,description}))}; }
