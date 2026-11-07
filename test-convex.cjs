const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const core=script.slice(script.indexOf('function lensModel'),script.indexOf('const $='));const ctx={};vm.createContext(ctx);vm.runInContext(core,ctx);const {lensModel,rayModel,screenMatch}=ctx;let count=0;
function eq(a,b){assert(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)));count++}
for(const f of [6,12,20]){let m=lensModel(f,f);assert(m.kind==='parallel'&&m.v===null&&m.m===null);count++;m=lensModel(2*f,f);eq(m.v,2*f);eq(m.m,-1);assert(screenMatch(m,2*f));count++;m=lensModel(3*f,f);eq(m.v,1.5*f);eq(m.m,-.5);m=lensModel(.6*f,f);eq(m.v,-1.5*f);eq(m.m,2.5);assert(!screenMatch(m,Math.abs(m.v)));count++;for(const u of [4,f-.000001,f+.000001,1.5*f,80]){m=lensModel(u,f);for(const r of rayModel(u,f)){assert(Object.values(r).every(Number.isFinite));count++;if(m.kind!=='parallel')eq(r.y+r.slope*m.v,2*m.m);eq(r.y-r.incidentSlope*u,2);}}}
for(const pair of [[0,1],[1,0],[-1,2],[Infinity,2],[2,NaN]]){assert.throws(()=>lensModel(...pair));count++;}
// Entire permitted slider domain: state and every ray finite; no invalid drawing data.
for(let fi=60;fi<=200;fi+=7)for(let ui=40;ui<=800;ui+=3){const u=ui/10,f=fi/10,m=lensModel(u,f);assert(m.kind==='parallel'||[m.v,m.m].every(Number.isFinite));for(const r of rayModel(u,f))assert(Object.values(r).every(Number.isFinite));count++;}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert(ids.length===new Set(ids).size);assert(!/<script[^>]+src=|<link[^>]+href=|\bfetch\(|XMLHttpRequest|https?:\/\/[^" ]+\.(?:js|css)/i.test(html));
const refs=[...script.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]);for(const ref of refs)assert(ids.includes(ref),'Missing DOM id '+ref);
console.log(`PASS: ${count} physics assertions/domain checks; JS parse; unique HTML ids; literal DOM references; no network dependencies. Browser/visual tests NOT performed.`);
// v1.1 height control: every displayed representative ray must pass through object tip and image.
let heightChecks=0;
for(const h of [.8,1.5,2.4,3])for(const f of [6,12,20])for(const ratio of [.6,1,1.00001,1.5,2,3]){const u=f*ratio,m=lensModel(u,f);for(const r of rayModel(u,f,h)){eq(r.y-r.incidentSlope*u,h);if(m.kind!=='parallel')eq(r.y+r.slope*m.v,h*m.m);heightChecks++;}}
assert(html.includes('Y=y=>310-y*65'));
assert(html.includes("'clip-path':'url(#opticalClip)'"));
console.log(`PASS: ${heightChecks} variable-height ray cases, independent vertical display scale and optical clipping declarations.`);
