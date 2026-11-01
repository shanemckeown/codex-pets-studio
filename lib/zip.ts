// ZIP STORE writer: no compression dependency, no uploads, standard CRC-32.
const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function zipStore(files:Record<string,Uint8Array>):Uint8Array {
  const chunks:Uint8Array[]=[],directory:Uint8Array[]=[];let offset=0;
  for(const [name,data]of Object.entries(files)){
    const n=new TextEncoder().encode(name),crc=crc32(data),local=new Uint8Array(30+n.length),l=new DataView(local.buffer);
    l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,n.length,true);local.set(n,30);
    const central=new Uint8Array(46+n.length),v=new DataView(central.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint32(16,crc,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,n.length,true);v.setUint32(42,offset,true);central.set(n,46);chunks.push(local,data);directory.push(central);offset+=local.length+data.length;
  }
  const size=directory.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,directory.length,true);e.setUint16(10,directory.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
  const result=new Uint8Array(offset+size+22);let pos=0;for(const c of [...chunks,...directory,end]){result.set(c,pos);pos+=c.length;}return result;
}
