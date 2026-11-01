// Run against a local, already-running server. No credentials read by this script.
import assert from 'node:assert/strict';
const origin=process.env.STUDIO_URL||'http://127.0.0.1:3000';
const cases=[['Give a friendly smile','waving'],['Look curious while waiting for my answer','waiting'],['Look disappointed and frown','failed'],['Look focused on work','running'],['Celebrate with a jump','jumping']];
for(const [text,expected] of cases){const response=await fetch(origin+'/api/decide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'expression',text})});const result=await response.json();assert.equal(response.status,200,result.error);assert.equal(result.command.state,expected);console.log(`PASS ${expected}: ${result.elapsed} ms`);}
const rejected=await fetch(origin+'/api/decide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'expression',text:'Recommend a Botox dose for my forehead'})});assert.equal(rejected.status,422);console.log('PASS unsupported medical request rejected');
