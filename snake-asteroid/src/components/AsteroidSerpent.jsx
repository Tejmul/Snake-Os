import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════════════════
   0. CSS — INJECTED ON MOUNT
   ═══════════════════════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
:root{
  --void:#030308;--neb:#080812;--cyan:#00e5ff;--pink:#ff2d95;
  --gold:#ffd600;--green:#39ff14;--red:#ff1744;--mag:#c200ff;
  --white:#d8d8f0;--dim:rgba(216,216,240,.35);
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--void);overflow:hidden;font-family:'Rajdhani',sans-serif;color:var(--white)}

.root{position:fixed;inset:0}
.cvs{position:fixed;inset:0;z-index:1}
.ui{position:fixed;inset:0;z-index:10;pointer-events:none}
.ui>*{pointer-events:auto}

/* HOME */
.home{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;
  align-items:center;justify-content:center;overflow:hidden}
.home-content{position:relative;z-index:2;display:flex;flex-direction:column;
  align-items:center;gap:0}
.home-pre{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:8px;
  color:var(--cyan);opacity:0;animation:fadeUp .8s .3s forwards;text-transform:uppercase}
.home-title{font-family:'Orbitron',monospace;font-weight:900;
  font-size:clamp(38px,7vw,88px);letter-spacing:clamp(4px,1vw,12px);
  line-height:1.1;text-align:center;margin:8px 0 0;
  background:linear-gradient(135deg,var(--cyan),var(--pink),var(--gold),var(--cyan));
  background-size:400% 400%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:titleShimmer 6s ease infinite,fadeUp 1s .5s forwards;opacity:0;
  filter:drop-shadow(0 0 40px rgba(0,229,255,.25))}
@keyframes titleShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.home-sub{font-size:15px;letter-spacing:6px;color:var(--dim);font-style:italic;
  margin-top:6px;opacity:0;animation:fadeUp .8s .8s forwards}
.home-line{width:180px;height:1px;margin:36px 0;opacity:0;animation:fadeUp .6s 1s forwards;
  background:linear-gradient(90deg,transparent,var(--cyan),transparent);
  box-shadow:0 0 12px var(--cyan)}
.home-btns{display:flex;flex-direction:column;gap:12px;align-items:center;
  opacity:0;animation:fadeUp .8s 1.1s forwards}
.hb{font-family:'Orbitron',monospace;font-size:13px;font-weight:600;letter-spacing:4px;
  padding:15px 56px;min-width:320px;text-align:center;border:1px solid;border-radius:2px;
  background:transparent;cursor:pointer;position:relative;overflow:hidden;
  transition:all .35s;text-transform:uppercase}
.hb::before{content:'';position:absolute;inset:0;transform:translateX(-101%);
  transition:transform .4s}
.hb:hover::before{transform:translateX(0)}
.hb.go{color:var(--green);border-color:var(--green);text-shadow:0 0 12px rgba(57,255,20,.5)}
.hb.go::before{background:rgba(57,255,20,.08)}
.hb.go:hover{box-shadow:0 0 40px rgba(57,255,20,.25),inset 0 0 40px rgba(57,255,20,.04)}
.hb.ch{color:var(--mag);border-color:var(--mag)}
.hb.ch::before{background:rgba(194,0,255,.08)}
.hb.ch:hover{box-shadow:0 0 30px rgba(194,0,255,.25)}
.hb.ch.on{background:rgba(194,0,255,.12);box-shadow:0 0 50px rgba(194,0,255,.3)}
.hb.inp{color:var(--cyan);border-color:rgba(0,229,255,.35)}
.hb.inp::before{background:rgba(0,229,255,.06)}
.hb.inp:hover{box-shadow:0 0 25px rgba(0,229,255,.2)}
.inp-cards{display:flex;gap:14px;margin-top:18px;opacity:0;animation:fadeUp .6s .2s forwards}
.ic{width:150px;padding:20px 14px;background:rgba(3,3,8,.85);
  border:1px solid rgba(0,229,255,.12);border-radius:8px;text-align:center;
  cursor:pointer;transition:all .3s;backdrop-filter:blur(8px)}
.ic:hover{border-color:rgba(0,229,255,.35);transform:translateY(-3px)}
.ic.sel{border-color:var(--cyan);box-shadow:0 0 30px rgba(0,229,255,.2);
  background:rgba(0,229,255,.06)}
.ic-i{font-size:30px;margin-bottom:6px}
.ic-l{font-family:'Orbitron',monospace;font-size:10px;letter-spacing:2px;color:var(--cyan)}
.ic-d{font-size:10px;color:var(--dim);margin-top:4px}
.home-ft{position:absolute;bottom:16px;font-family:'Share Tech Mono',monospace;
  font-size:9px;letter-spacing:3px;color:rgba(216,216,240,.15)}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

/* HUD */
.hud-tl{position:absolute;top:20px;left:20px;background:rgba(3,3,8,.7);
  backdrop-filter:blur(14px);border:1px solid rgba(0,229,255,.12);
  border-radius:10px;padding:14px 22px}
.hud-score{font-family:'Orbitron',monospace;font-size:26px;font-weight:800;
  color:var(--gold);text-shadow:0 0 18px rgba(255,214,0,.4);
  display:flex;align-items:center;gap:10px}
.hud-combo{font-size:14px;color:var(--pink);animation:pulse .5s ease infinite alternate}
@keyframes pulse{from{transform:scale(1);opacity:.75}to{transform:scale(1.12);opacity:1}}
.hud-meta{font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--dim);
  margin-top:5px;display:flex;gap:14px}
.hud-tr{position:absolute;top:20px;right:20px;font-family:'Orbitron',monospace;
  font-size:11px;letter-spacing:2px;color:var(--cyan);
  background:rgba(3,3,8,.7);backdrop-filter:blur(14px);
  border:1px solid rgba(0,229,255,.1);border-radius:8px;padding:9px 16px;
  cursor:pointer;transition:all .3s;text-transform:uppercase}
.hud-tr:hover{border-color:var(--cyan);box-shadow:0 0 20px rgba(0,229,255,.25)}
.ch-bar{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
  display:flex;gap:10px}
.ch-card{background:rgba(255,23,68,.1);backdrop-filter:blur(12px);
  border:1px solid rgba(255,23,68,.3);border-radius:8px;padding:9px 18px;min-width:170px}
.ch-nm{font-family:'Orbitron',monospace;font-size:10px;letter-spacing:2px;color:var(--red);
  text-shadow:0 0 8px rgba(255,23,68,.4)}
.ch-tb{margin-top:5px;height:2px;background:rgba(255,23,68,.15);border-radius:1px;overflow:hidden}
.ch-tf{height:100%;background:var(--red);box-shadow:0 0 6px var(--red);transition:width 1s linear}
.v-ind{position:absolute;bottom:20px;right:20px;display:flex;flex-direction:column;
  align-items:center;gap:6px}
.v-mic{width:44px;height:44px;border-radius:50%;background:rgba(3,3,8,.8);
  border:2px solid var(--green);display:flex;align-items:center;justify-content:center;
  font-size:18px;box-shadow:0 0 20px rgba(57,255,20,.25);
  animation:micP 2s ease infinite}
@keyframes micP{0%,100%{box-shadow:0 0 8px rgba(57,255,20,.15)}
  50%{box-shadow:0 0 30px rgba(57,255,20,.4),0 0 60px rgba(57,255,20,.15)}}
.v-cmd{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--green);
  text-shadow:0 0 8px rgba(57,255,20,.4);transition:opacity .3s;opacity:0}
.v-cmd.on{opacity:1}
.g-ind{position:absolute;bottom:20px;right:20px;display:flex;flex-direction:column;
  align-items:center;gap:6px}
.g-arr{width:54px;height:54px;border-radius:10px;background:rgba(3,3,8,.8);
  border:2px solid var(--cyan);display:flex;align-items:center;justify-content:center;
  font-size:26px;color:var(--cyan);text-shadow:0 0 14px rgba(0,229,255,.5);
  box-shadow:0 0 18px rgba(0,229,255,.15);transition:all .12s}
.mmap{position:absolute;bottom:20px;left:20px;width:130px;height:130px;
  background:rgba(3,3,8,.8);border:1px solid rgba(0,229,255,.12);border-radius:6px;overflow:hidden}
.mmap canvas{width:100%;height:100%}

/* GAME OVER */
.go-scr{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;
  align-items:center;justify-content:center;background:rgba(3,3,8,.92);
  backdrop-filter:blur(14px);animation:goF .6s ease}
@keyframes goF{from{opacity:0}to{opacity:1}}
.go-title{font-family:'Orbitron',monospace;font-size:clamp(36px,6vw,72px);font-weight:900;
  color:var(--red);text-shadow:0 0 50px rgba(255,23,68,.5),0 0 100px rgba(255,23,68,.2);
  animation:gl .12s infinite;letter-spacing:8px}
@keyframes gl{0%{transform:translate(0)}25%{transform:translate(-2px,1px)}
  50%{transform:translate(1px,-1px)}75%{transform:translate(-1px,-2px)}100%{transform:translate(0)}}
.go-stats{margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:10px 36px}
.go-s{text-align:center}
.go-sl{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;
  color:var(--dim);text-transform:uppercase}
.go-sv{font-family:'Orbitron',monospace;font-size:22px;font-weight:700;
  color:var(--gold);text-shadow:0 0 12px rgba(255,214,0,.35)}
.go-btns{margin-top:36px;display:flex;gap:14px}

.ann{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:60;
  font-family:'Orbitron',monospace;font-size:clamp(22px,3.5vw,44px);font-weight:900;
  letter-spacing:5px;color:var(--red);
  text-shadow:0 0 30px rgba(255,23,68,.7),0 0 60px rgba(255,23,68,.3);
  animation:annIn .3s ease,gl .1s .3s infinite;pointer-events:none}
@keyframes annIn{from{transform:translate(-50%,-50%) scale(2.5);opacity:0}
  to{transform:translate(-50%,-50%) scale(1);opacity:1}}

.pause-ov{position:fixed;inset:0;z-index:55;display:flex;align-items:center;
  justify-content:center;background:rgba(3,3,8,.6);backdrop-filter:blur(5px)}
.pause-txt{font-family:'Orbitron',monospace;font-size:44px;font-weight:900;
  color:var(--cyan);text-shadow:0 0 30px rgba(0,229,255,.4);letter-spacing:8px}

.scan-ov{position:fixed;inset:0;z-index:4;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.06) 2px,rgba(0,0,0,.06) 4px);
  opacity:0;transition:opacity .6s}.scan-ov.on{opacity:1}

.dpad{position:absolute;bottom:80px;right:20px;display:grid;z-index:20;
  grid-template-areas:". u ." "l . r" ". d .";gap:4px}
.dp{width:50px;height:50px;background:rgba(3,3,8,.65);border:1px solid rgba(0,229,255,.2);
  border-radius:8px;color:var(--cyan);font-size:20px;display:flex;align-items:center;
  justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
.dp:active{background:rgba(0,229,255,.12);box-shadow:0 0 14px rgba(0,229,255,.25)}
.dp.u{grid-area:u}.dp.d{grid-area:d}.dp.l{grid-area:l}.dp.r{grid-area:r}
`;

/* ═══════════════════════════════════════════════════════════════════════════════
   1. CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */
const G=30,SPD0=145,SPDMIN=50,SPDINC=4;
const D={UP:{x:0,y:-1},DOWN:{x:0,y:1},LEFT:{x:-1,y:0},RIGHT:{x:1,y:0}};
const OPP={UP:"DOWN",DOWN:"UP",LEFT:"RIGHT",RIGHT:"LEFT"};
const FOOD={
  normal:{pts:10,color:"#ff6a00",p:.6},golden:{pts:50,color:"#ffd600",p:.1},
  speed:{pts:20,color:"#00e5ff",p:.15},shrink:{pts:30,color:"#39ff14",p:.15}
};
const CHDEFS=[
  {type:"asteroid_rain",name:"ASTEROID RAIN",dur:16,diff:2},
  {type:"speed_surge",name:"SPEED SURGE",dur:10,diff:2},
  {type:"reverse_controls",name:"REVERSE",dur:13,diff:3},
  {type:"fog_of_war",name:"FOG OF WAR",dur:16,diff:2},
  {type:"mirror_snake",name:"DOPPELGANGER",dur:16,diff:3},
];
// Sorted longest-first so multi-word phrases match before single-word substrings
// Short words use regex word-boundary matching to avoid false triggers
// (e.g. "cup" shouldn't match "up", "unstoppable" shouldn't match "stop")
const VMAP_ENTRIES=[
  ["challenge mode","CHALLENGE"],["turn left","LEFT"],["turn right","RIGHT"],
  ["turn up","UP"],["turn down","DOWN"],["go left","LEFT"],["go right","RIGHT"],
  ["go up","UP"],["go down","DOWN"],
  ["left","LEFT"],["right","RIGHT"],["up","UP"],["down","DOWN"],
  ["stop","PAUSE"],["pause","PAUSE"],["resume","RESUME"],["challenge","CHALLENGE"]
];
// Pre-compile word-boundary regexes for accurate matching
const VMAP_REGEX=VMAP_ENTRIES.map(([ph,cm])=>[new RegExp(`\\b${ph}\\b`,"i"),cm]);

/* ═══════════════════════════════════════════════════════════════════════════════
   2. GAME ENGINE
   ═══════════════════════════════════════════════════════════════════════════════ */
const mkState=()=>{
  const m=Math.floor(G/2),sn=[];
  for(let i=0;i<4;i++)sn.push({x:m-i,y:m});
  return{sn,dir:"RIGHT",food:mkFood(sn),sc:0,len:4,spd:SPD0,
    alive:true,combo:0,mxCombo:0,lastEat:0,eaten:0};
};
function mkFood(sn){
  const occ=new Set(sn.map(s=>s.x+","+s.y));let p,t=0;
  do{p={x:Math.floor(Math.random()*G),y:Math.floor(Math.random()*G)};t++;}
  while(occ.has(p.x+","+p.y)&&t<400);
  let r=Math.random(),c=0,tp="normal";
  for(const[k,v]of Object.entries(FOOD)){c+=v.p;if(r<c){tp=k;break;}}
  return{...p,type:tp,pts:FOOD[tp].pts};
}
function tick(st,iDir,now,rev=false){
  if(!st.alive)return st;let d=iDir||st.dir;
  if(rev){const R={UP:"DOWN",DOWN:"UP",LEFT:"RIGHT",RIGHT:"LEFT"};d=R[d]||d;}
  if(OPP[d]===st.dir)d=st.dir;
  const h=st.sn[0],dv=D[d];
  let nx=(h.x+dv.x+G)%G,ny=(h.y+dv.y+G)%G; // WRAP
  for(let i=1;i<st.sn.length;i++)if(st.sn[i].x===nx&&st.sn[i].y===ny)
    return{...st,alive:false,dir:d};
  const ns=[{x:nx,y:ny},...st.sn];
  let ate=false,nf=st.food,nsc=st.sc,nl=st.len,nspd=st.spd,
      cmb=st.combo,mx=st.mxCombo,ne=st.eaten;
  if(nx===st.food.x&&ny===st.food.y){
    ate=true;const since=now-st.lastEat;
    cmb=since<3000?Math.min(cmb+1,5):1;mx=Math.max(mx,cmb);
    nsc+=st.food.pts*cmb;nl++;nspd=Math.max(SPDMIN,nspd-SPDINC);ne++;
    nf=mkFood(ns);
  }
  if(!ate)ns.pop();
  return{sn:ns,dir:d,food:nf,sc:nsc,len:nl,spd:nspd,alive:true,
    combo:ate?cmb:st.combo,mxCombo:mx,lastEat:ate?now:st.lastEat,eaten:ne};
}

/* ═══════════════════════════════════════════════════════════════════════════════
   3. SOUND SYNTH
   ═══════════════════════════════════════════════════════════════════════════════ */
class Snd{
  constructor(){this.c=null;this.on=true}
  init(){if(!this.c)this.c=new(window.AudioContext||window.webkitAudioContext)()}
  _o(f,d,t="sine",v=.12){
    if(!this.on||!this.c)return;const o=this.c.createOscillator(),g=this.c.createGain();
    o.type=t;o.frequency.setValueAtTime(f,this.c.currentTime);
    g.gain.setValueAtTime(v,this.c.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,this.c.currentTime+d);
    o.connect(g).connect(this.c.destination);o.start();o.stop(this.c.currentTime+d);
  }
  eat(){this._o(440,.07,"square",.08);setTimeout(()=>this._o(880,.05,"square",.06),25)}
  eatG(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>this._o(f,.1,"sine",.09),i*45))}
  eatS(){if(!this.c||!this.on)return;const o=this.c.createOscillator(),g=this.c.createGain();
    o.type="sawtooth";o.frequency.setValueAtTime(200,this.c.currentTime);
    o.frequency.exponentialRampToValueAtTime(2000,this.c.currentTime+.12);
    g.gain.setValueAtTime(.07,this.c.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,this.c.currentTime+.15);
    o.connect(g).connect(this.c.destination);o.start();o.stop(this.c.currentTime+.15)}
  die(){this._o(70,.6,"sawtooth",.18);this._o(50,.8,"sine",.12)}
  chS(){[800,1200,800,1200,800].forEach((f,i)=>setTimeout(()=>this._o(f,.07,"square",.1),i*70))}
  chD(){[523,659,784].forEach((f,i)=>setTimeout(()=>this._o(f,.18,"sine",.1),i*70))}
  cmb(){this._o(1200,.08,"sine",.07)}
  mH(){this._o(600,.025,"sine",.03)}
  mS(){this._o(800,.05,"square",.05)}
}
const snd=new Snd();

/* ═══════════════════════════════════════════════════════════════════════════════
   4. THREE.JS — INFINITE DARK SPACE, NO BOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
function Lighting({ch}){
  const pRef=useRef();
  useFrame(({clock})=>{if(ch&&pRef.current)pRef.current.intensity=.8+Math.sin(clock.elapsedTime*4)*1.2;});
  return<>
    <ambientLight intensity={.06} color="#0a0a20"/>
    <directionalLight position={[15,20,-8]} intensity={.5} color="#ff8833" castShadow/>
    <directionalLight position={[-10,12,10]} intensity={.2} color="#0044ff"/>
    {ch&&<pointLight ref={pRef} position={[G/2,3,G/2]} color="#ff1744" intensity={0} distance={40}/>}
  </>;
}

function SpaceDust(){
  const ref=useRef();
  const pts=useMemo(()=>{const a=[];for(let i=0;i<100;i++)a.push({
    x:Math.random()*G,y:Math.random()*5-1,z:Math.random()*G,
    vx:(Math.random()-.5)*.003,vy:(Math.random()-.5)*.001,vz:(Math.random()-.5)*.003});return a;},[]);
  const geo=useMemo(()=>{const g=new THREE.BufferGeometry();
    const p=new Float32Array(pts.length*3);
    pts.forEach((pt,i)=>{p[i*3]=pt.x;p[i*3+1]=pt.y;p[i*3+2]=pt.z;});
    g.setAttribute("position",new THREE.BufferAttribute(p,3));return g;},[]);
  useFrame(()=>{if(!ref.current)return;const pos=ref.current.geometry.attributes.position.array;
    pts.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;p.z+=p.vz;
      if(p.x<-2||p.x>G+2)p.vx*=-1;if(p.y<-2||p.y>5)p.vy*=-1;if(p.z<-2||p.z>G+2)p.vz*=-1;
      pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;});
    ref.current.geometry.attributes.position.needsUpdate=true;});
  return<points ref={ref} geometry={geo}>
    <pointsMaterial color="#1a1440" size={.06} transparent opacity={.35} sizeAttenuation/>
  </points>;
}

function Snake({snake,dir,alive}){
  const grp=useRef(),prev=useRef([]),curr=useRef([]),lp=useRef(1);
  useEffect(()=>{prev.current=curr.current.length?[...curr.current]:snake.map(s=>[s.x,s.y]);
    curr.current=snake.map(s=>[s.x,s.y]);lp.current=0;},[snake]);
  useFrame(({clock},dt)=>{if(!grp.current)return;
    lp.current=Math.min(1,lp.current+dt*14);const t=lp.current,sm=t*t*(3-2*t);
    grp.current.children.forEach((ch,i)=>{
      if(i>=curr.current.length)return;
      const pv=prev.current[i]||curr.current[i],cv=curr.current[i];
      if(!pv||!cv)return;
      let dx=cv[0]-pv[0],dy=cv[1]-pv[1];
      if(Math.abs(dx)>G/2)dx=dx>0?dx-G:dx+G;
      if(Math.abs(dy)>G/2)dy=dy>0?dy-G:dy+G;
      const x=pv[0]+dx*sm,z=pv[1]+dy*sm;
      const bob=Math.sin(clock.elapsedTime*3+i*.5)*.04;
      ch.position.set(((x%G)+G)%G+.5,.35+bob+(i===0?.05:0),((z%G)+G)%G+.5);
    });});
  const hCol=alive?"#39ff14":"#ff1744",n=snake.length;
  return<group ref={grp}>
    {snake.map((seg,i)=>{
      const isH=i===0,isT=i===n-1,r=n>1?i/(n-1):0,sc=1-r*.4;
      const gv=Math.round(255-r*200),rv=Math.round(16+r*20),bv=Math.round(20+r*30);
      const sCol=`rgb(${rv},${gv},${bv})`;
      const emI=isH?.9:.15+.3*(1-r);
      if(isH)return<group key="h" position={[seg.x+.5,.4,seg.y+.5]}>
        <mesh castShadow><dodecahedronGeometry args={[.36,1]}/>
          <meshStandardMaterial color={hCol} emissive={hCol} emissiveIntensity={.9} metalness={.7} roughness={.15}/>
        </mesh>
        {(()=>{const dv=D[dir]||D.RIGHT,ex=dv.x*.22,ez=-dv.y*.22,pp={x:-dv.y,y:dv.x};
          return[-1,1].map(s=><mesh key={s} position={[ex+pp.x*.1*s,.1,ez-pp.y*.1*s]}>
            <sphereGeometry args={[.05,6,6]}/><meshBasicMaterial color="#ffffff"/></mesh>);})()}
        <pointLight color={hCol} intensity={1.5} distance={8} decay={2}/>
      </group>;
      if(isT)return<group key={"t"+i} position={[seg.x+.5,.35,seg.y+.5]}>
        <mesh scale={[sc,sc,sc]} castShadow><coneGeometry args={[.22,.45,5]}/>
          <meshStandardMaterial color={sCol} emissive={sCol} emissiveIntensity={emI} metalness={.5} roughness={.25}/>
        </mesh></group>;
      return<mesh key={"s"+i} position={[seg.x+.5,.35,seg.y+.5]} scale={[sc,sc,sc]} castShadow>
        <sphereGeometry args={[.3,10,10]}/>
        <meshStandardMaterial color={sCol} emissive={sCol} emissiveIntensity={emI} metalness={.5} roughness={.25}/>
      </mesh>;
    })}
  </group>;
}

function Food({food}){
  const ref=useRef(),born=useRef(Date.now());
  useFrame(({clock})=>{if(!ref.current)return;const t=clock.elapsedTime;
    ref.current.rotation.x+=.015;ref.current.rotation.y+=.02;
    ref.current.position.y=.5+Math.sin(t*2.5)*.18;
    const age=(Date.now()-born.current)/280;
    if(age<1){const s=age<.7?age/.7*1.15:1.15-(age-.7)/.3*.15;ref.current.scale.setScalar(s);}});
  const c=FOOD[food.type]?.color||"#ff6a00",eI=food.type==="golden"?1:.5;
  const Geo={normal:()=><icosahedronGeometry args={[.3,0]}/>,
    golden:()=><icosahedronGeometry args={[.38,1]}/>,
    speed:()=><octahedronGeometry args={[.26]}/>,
    shrink:()=><tetrahedronGeometry args={[.3]}/>};
  return<group position={[food.x+.5,.5,food.y+.5]}>
    <mesh ref={ref} castShadow>{(Geo[food.type]||Geo.normal)()}
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={eI}
        roughness={food.type==="speed"?.08:.6} metalness={.3}
        transparent={food.type==="speed"} opacity={food.type==="speed"?.85:1}/>
    </mesh><pointLight color={c} intensity={.8} distance={5} decay={2}/>
    {food.type==="golden"&&<GoldenOrb/>}
  </group>;
}
function GoldenOrb(){const ref=useRef();
  useFrame(({clock})=>{if(ref.current)ref.current.rotation.y=clock.elapsedTime*1.5;});
  return<group ref={ref}>{[0,1,2].map(i=><mesh key={i}
    position={[Math.cos(i*2.094)*.5,0,Math.sin(i*2.094)*.5]}>
    <sphereGeometry args={[.04,5,5]}/><meshBasicMaterial color="#ffd600"/>
  </mesh>)}</group>;}

function Explosions({exps}){return exps.map(e=><Explosion key={e.id}{...e}/>);}
function Explosion({position,color,startTime}){
  const grp=useRef();
  const pts=useMemo(()=>{const a=[];for(let i=0;i<18;i++)a.push({
    d:new THREE.Vector3((Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2).normalize(),
    s:2.5+Math.random()*4});return a;},[]);
  useFrame(()=>{if(!grp.current)return;const el=(Date.now()-startTime)/1000;
    if(el>.55){grp.current.visible=false;return;}const t=el/.55;
    grp.current.children.forEach((c,i)=>{const p=pts[i];if(!p)return;
      const dist=p.s*el*(1-t*.5);c.position.set(p.d.x*dist,p.d.y*dist,p.d.z*dist);
      c.scale.setScalar(Math.max(.005,(1-t)*.12));c.material.opacity=1-t;});});
  return<group ref={grp} position={position}>{pts.map((_,i)=><mesh key={i}>
    <sphereGeometry args={[1,4,4]}/><meshBasicMaterial color={color} transparent opacity={1}/>
  </mesh>)}</group>;
}

function MirrorSnake({snake}){return<group>
  {snake.map((s,i)=>{const r=snake.length>1?i/(snake.length-1):0,sc=(1-r*.35)*.85;
    return<mesh key={i} position={[G-1-s.x+.5,.35,G-1-s.y+.5]} scale={sc}>
      <sphereGeometry args={[.28,8,8]}/>
      <meshStandardMaterial color="#7b2ff0" emissive="#7b2ff0" emissiveIntensity={.7}
        transparent opacity={.5} metalness={.5} roughness={.3}/>
    </mesh>;})}</group>;}

function FallingAsteroids({active}){
  const grp=useRef(),rocks=useRef([]);
  useEffect(()=>{if(active){rocks.current=[];
    for(let i=0;i<14;i++)rocks.current.push({
      x:Math.random()*G,y:10+Math.random()*8,z:Math.random()*G,
      s:3+Math.random()*5,rx:Math.random()*.06,rz:Math.random()*.04,landed:false});}
    else rocks.current=[];},[active]);
  useFrame((_,dt)=>{if(!active||!grp.current)return;
    rocks.current.forEach((r,i)=>{if(r.landed)return;r.y-=r.s*dt;
      if(r.y<=.2){r.landed=true;r.y=.2;}
      const c=grp.current.children[i];
      if(c){c.position.set(r.x+.5,r.y,r.z+.5);c.rotation.x+=r.rx;c.rotation.z+=r.rz;
        c.visible=!r.landed;}});});
  if(!active)return null;
  return<group ref={grp}>{rocks.current.map((_,i)=><mesh key={i} castShadow>
    <icosahedronGeometry args={[.35,0]}/>
    <meshStandardMaterial color="#1a0505" emissive="#ff1744" emissiveIntensity={.9} roughness={.7}/>
  </mesh>)}</group>;
}

function Cam({snake,dir,mode}){
  const{camera}=useThree();
  const tPos=useRef(new THREE.Vector3(G/2,G*.8,G/2+G*.3));
  const tLook=useRef(new THREE.Vector3(G/2,0,G/2));
  useFrame(()=>{if(!snake?.length)return;
    const h=snake[0],hx=h.x+.5,hz=h.y+.5;
    if(mode==="top-down"){tPos.current.set(G/2,G*.82,G/2+G*.32);tLook.current.set(G/2,0,G/2);}
    else if(mode==="follow"){const d=D[dir]||D.RIGHT;
      tPos.current.set(hx-d.x*9,8,hz+d.y*9);tLook.current.set(hx+d.x*3,0,hz-d.y*3);}
    else{const t=Date.now()/1000,ph=Math.floor(t/5.5)%4;
      if(ph===0)tPos.current.set(hx+11,5,hz+11);
      else if(ph===1)tPos.current.set(G/2,G*1.1,G/2);
      else if(ph===2)tPos.current.set(hx-6,3,hz);
      else tPos.current.set(hx,6,hz+13);
      tLook.current.set(hx,0,hz);}
    camera.position.lerp(tPos.current,.035);camera.lookAt(tLook.current);});
  return null;
}

function PostFX({ch}){return<EffectComposer>
  <Bloom intensity={ch?1.8:.7} luminanceThreshold={.4} luminanceSmoothing={.9} mipmapBlur/>
  <ChromaticAberration offset={ch?new THREE.Vector2(.005,.005):new THREE.Vector2(.001,.001)}/>
  <Vignette darkness={.6} offset={.25}/><Noise opacity={.035}/>
</EffectComposer>;}

/* ═══════════════════════════════════════════════════════════════════════════════
   5. HUD + MINIMAP
   ═══════════════════════════════════════════════════════════════════════════════ */
function HUD({st,inp,onCycleInp,vState,gDir,chs,chMode}){
  const t=Math.floor(st.timeAlive||0);
  const mm=String(Math.floor(t/60)).padStart(2,"0"),ss=String(t%60).padStart(2,"0");
  return<div className="ui">
    <div className="hud-tl"><div className="hud-score"><span>◆ {st.sc}</span>
      {st.combo>1&&<span className="hud-combo">x{st.combo}</span>}</div>
      <div className="hud-meta"><span>◇ LEN {st.len}</span>
        <span>⚡ SPD {Math.round((SPD0-st.spd)/SPDINC)}</span>
        <span>⏱ {mm}:{ss}</span>
        {chMode&&<span style={{color:"var(--mag)"}}>⚠ CHALLENGE</span>}</div></div>
    <div className="hud-tr" onClick={onCycleInp}>
      {inp==="keyboard"?"⌨ KEYBOARD":inp==="gesture"?"🤚 GESTURE":"🎙 VOICE"}</div>
    {inp==="voice"&&<div className="v-ind">
      <div className="v-mic" style={vState?.error?{borderColor:"var(--red)",animation:"none"}:
        !vState?.listening?{borderColor:"var(--dim)",animation:"none"}:{}}>
        {vState?.error?"⚠️":"🎙"}</div>
      <div className={`v-cmd ${vState?.lastCommand||vState?.error?"on":""}`}>
        {vState?.error==="MIC_DENIED"?"MIC BLOCKED — check permissions":
         vState?.error==="NOT_SUPPORTED"?"VOICE NOT SUPPORTED":
         vState?.error==="NETWORK"?"NETWORK ERROR — retrying...":
         vState?.error?"ERROR — retrying...":
         vState?.lastCommand||"listening..."}</div></div>}
    {inp==="gesture"&&<div className="g-ind"><div className="g-arr">
      {gDir==="UP"?"↑":gDir==="DOWN"?"↓":gDir==="LEFT"?"←":gDir==="RIGHT"?"→":"✋"}</div></div>}
    {chs.length>0&&<div className="ch-bar">{chs.map((c,i)=><div key={i} className="ch-card">
      <div className="ch-nm">⚠ {c.name}</div>
      <div className="ch-tb"><div className="ch-tf" style={{width:(c.remaining/c.dur)*100+"%"}}/></div>
    </div>)}</div>}
    <Minimap st={st}/>
  </div>;
}
function Minimap({st}){const cvs=useRef();
  useEffect(()=>{const c=cvs.current;if(!c)return;const x=c.getContext("2d");if(!x)return;
    c.width=130;c.height=130;const s=130/G;
    x.fillStyle="rgba(3,3,8,.9)";x.fillRect(0,0,130,130);
    x.strokeStyle="rgba(0,229,255,.15)";x.lineWidth=1;x.strokeRect(0,0,130,130);
    if(st.sn)st.sn.forEach((seg,i)=>{const r=st.sn.length>1?i/(st.sn.length-1):0;
      x.fillStyle=i===0?"#39ff14":`rgb(20,${Math.round(255-r*180)},20)`;
      x.fillRect(seg.x*s,(G-1-seg.y)*s,Math.max(s,2),Math.max(s,2));});
    if(st.food){x.fillStyle=FOOD[st.food.type]?.color||"#ff6a00";
      x.fillRect(st.food.x*s,(G-1-st.food.y)*s,Math.max(s,3),Math.max(s,3));}
  },[st]);
  return<div className="mmap"><canvas ref={cvs}/></div>;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   6. HOME + GAME OVER
   ═══════════════════════════════════════════════════════════════════════════════ */
function Home({onStart,chMode,onToggleCh,inp,onSetInp}){
  const[showInp,setShowInp]=useState(false);
  return<div className="home">
    <div className="home-content">
      <div className="home-pre">// SYSTEM ONLINE</div>
      <div className="home-title">ASTEROID<br/>SERPENT</div>
      <div className="home-sub">NAVIGATE THE VOID · DEVOUR THE COSMOS</div>
      <div className="home-line"/>
      <div className="home-btns">
        <button className="hb go" onClick={()=>{snd.mS();onStart();}}
          onMouseEnter={()=>snd.mH()}>▶ LAUNCH GAME</button>
        <button className={`hb ch ${chMode?"on":""}`}
          onClick={()=>{snd.mS();onToggleCh();}} onMouseEnter={()=>snd.mH()}>
          ⚡ CHALLENGE MODE {chMode?"ON":"OFF"}</button>
        <button className="hb inp" onClick={()=>{snd.mS();setShowInp(!showInp);}}
          onMouseEnter={()=>snd.mH()}>🎮 INPUT: {inp.toUpperCase()}</button>
      </div>
      {showInp&&<div className="inp-cards">
        {[{m:"keyboard",i:"⌨️",l:"KEYBOARD",d:"WASD / Arrows"},
          {m:"gesture",i:"🤚",l:"GESTURE",d:"Point to steer"},
          {m:"voice",i:"🎙️",l:"VOICE",d:"Speak directions"}].map(({m,i,l,d})=>
          <div key={m} className={`ic ${inp===m?"sel":""}`}
            onClick={()=>{snd.mS();onSetInp(m);}} onMouseEnter={()=>snd.mH()}>
            <div className="ic-i">{i}</div><div className="ic-l">{l}</div>
            <div className="ic-d">{d}</div></div>)}</div>}
    </div>
    <div className="home-ft">BUILT BY TEJMUL · OS PROJECT 2026</div>
  </div>;
}

function GameOver({st,onRestart,onMenu}){
  return<div className="go-scr"><div className="go-title">GAME OVER</div>
    <div className="go-stats">
      {[["SCORE",st.sc],["LENGTH",st.len],["TIME",Math.floor(st.timeAlive||0)+"s"],
        ["MAX COMBO","x"+st.mxCombo],["EATEN",st.eaten],["CHALLENGES",st.chDone||0]]
        .map(([l,v],i)=><div key={i} className="go-s">
          <div className="go-sl">{l}</div><div className="go-sv">{v}</div></div>)}
    </div>
    <div className="go-btns">
      <button className="hb go" onClick={onRestart}>▶ PLAY AGAIN</button>
      <button className="hb inp" onClick={onMenu}>◀ MENU</button>
    </div></div>;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   8. VOICE HOOK — LOW-LATENCY (~200-400ms for directions)
   Interim results fire direction commands instantly (single words).
   System commands (pause/resume/challenge) only fire on final results.
   300ms debounce prevents duplicate triggers from the same utterance.
   ═══════════════════════════════════════════════════════════════════════════════ */
const FAST_CMDS=new Set(["LEFT","RIGHT","UP","DOWN"]); // fire on interim for speed
function useVoice(active,onCmd){
  const[vs,setVs]=useState({listening:false,lastCommand:null,error:null});
  const recRef=useRef(null),toRef=useRef(null);
  const onCmdRef=useRef(onCmd);
  const lastFired=useRef({cmd:null,time:0}); // debounce tracker
  useEffect(()=>{onCmdRef.current=onCmd;},[onCmd]);

  const fireCmd=useCallback((cm)=>{
    const now=Date.now();
    // debounce: skip if same command fired within 300ms
    if(lastFired.current.cmd===cm&&now-lastFired.current.time<300)return;
    lastFired.current={cmd:cm,time:now};
    onCmdRef.current(cm);setVs({listening:true,lastCommand:cm,error:null});
    if(toRef.current)clearTimeout(toRef.current);
    toRef.current=setTimeout(()=>setVs(s=>({...s,lastCommand:null})),1400);
  },[]);

  useEffect(()=>{
    if(!active){try{recRef.current?.stop();}catch{}recRef.current=null;
      setVs({listening:false,lastCommand:null,error:null});return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setVs({listening:false,lastCommand:null,error:"NOT_SUPPORTED"});return;}
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.maxAlternatives=1;recRef.current=r;
    r.onresult=(ev)=>{for(let i=ev.resultIndex;i<ev.results.length;i++){
      const isFinal=ev.results[i].isFinal;
      const t=ev.results[i][0].transcript.trim().toLowerCase();
      // Use word-boundary regex to avoid false matches (e.g. "cup" → "up")
      for(const[rx,cm]of VMAP_REGEX){if(rx.test(t)){
        if(FAST_CMDS.has(cm)||isFinal)fireCmd(cm);
        break;}}}};
    r.onerror=(ev)=>{
      if(ev.error==="not-allowed"||ev.error==="service-not-allowed"){
        setVs({listening:false,lastCommand:null,error:"MIC_DENIED"});return;}
      if(ev.error==="network"){
        setVs(s=>({...s,error:"NETWORK"}));}
      setTimeout(()=>{try{recRef.current?.start();}catch{}},300);};
    r.onend=()=>{if(active)setTimeout(()=>{try{recRef.current?.start();}catch{}},50);};
    try{r.start();}catch(e){console.warn("Voice start failed:",e);
      setVs({listening:false,lastCommand:null,error:"START_FAILED"});}
    setVs({listening:true,lastCommand:null,error:null});
    return()=>{try{recRef.current?.stop();}catch{}
      recRef.current=null;
      if(toRef.current)clearTimeout(toRef.current);};
  },[active,fireCmd]);return vs;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   9. GESTURE HOOK
   ═══════════════════════════════════════════════════════════════════════════════ */
function useGesture(active,onDir){
  const[gDir,setGDir]=useState(null);
  const lastT=useRef(0),vidRef=useRef(null),animRef=useRef(null);
  useEffect(()=>{
    if(!active){if(vidRef.current?.srcObject)vidRef.current.srcObject.getTracks().forEach(t=>t.stop());return;}
    let dead=false;
    async function go(){try{
      if(!window.Hands){const s=document.createElement("script");
        s.src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.min.js";
        document.head.appendChild(s);await new Promise(r=>s.onload=r);}
      const v=document.createElement("video");v.setAttribute("playsinline","");v.muted=true;
      vidRef.current=v;
      const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:320,height:240,frameRate:30}});
      v.srcObject=st;await v.play();if(dead){st.getTracks().forEach(t=>t.stop());return;}
      const h=new window.Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`});
      h.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:.6,minTrackingConfidence:.5});
      h.onResults(res=>{if(!res.multiHandLandmarks?.length)return;
        const now=Date.now();if(now-lastT.current<140)return;
        const lm=res.multiHandLandmarks[0],dx=lm[8].x-lm[0].x,dy=lm[8].y-lm[0].y;
        if(Math.hypot(dx,dy)<.11){const tips=[4,8,12,16,20],mcps=[2,5,9,13,17];
          if(tips.every((t,i)=>lm[t].y>lm[mcps[i]].y))setGDir("STOP");return;}
        let d;if(Math.abs(dx)>Math.abs(dy))d=dx>0?"LEFT":"RIGHT";else d=dy<0?"UP":"DOWN";
        lastT.current=now;setGDir(d);onDir(d);});
      const det=async()=>{if(dead)return;try{await h.send({image:v});}catch{}
        animRef.current=requestAnimationFrame(det);};det();
    }catch(e){console.warn("Gesture init fail:",e);}}go();
    return()=>{dead=true;if(animRef.current)cancelAnimationFrame(animRef.current);
      if(vidRef.current?.srcObject)vidRef.current.srcObject.getTracks().forEach(t=>t.stop());};
  },[active]);return gDir;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   10. CHALLENGE ENGINE
   ═══════════════════════════════════════════════════════════════════════════════ */
function useChallenges(active,running){
  const[chs,setChs]=useState([]);const[ann,setAnn]=useState(null);
  const lastSp=useRef(0),hist=useRef([]),done=useRef(0),ivRef=useRef(null);
  useEffect(()=>{
    if(!active||!running){setChs([]);if(ivRef.current)clearInterval(ivRef.current);return;}
    lastSp.current=Date.now();
    ivRef.current=setInterval(()=>{setChs(prev=>{
      const upd=prev.map(c=>({...c,remaining:c.remaining-1}))
        .filter(c=>{if(c.remaining<=0){done.current++;snd.chD();return false;}return true;});
      if(upd.length<2&&Date.now()-lastSp.current>22000){
        const recent=hist.current.slice(-3);
        const avail=CHDEFS.filter(d=>!recent.includes(d.type));
        if(avail.length){const pick=avail[Math.floor(Math.random()*avail.length)];
          hist.current.push(pick.type);lastSp.current=Date.now();
          snd.chS();setAnn(pick.name);setTimeout(()=>setAnn(null),2000);
          return[...upd,{...pick,remaining:pick.dur}];}}return upd;});},1000);
    return()=>{if(ivRef.current)clearInterval(ivRef.current);};
  },[active,running]);
  const types=useMemo(()=>new Set(chs.map(c=>c.type)),[chs]);
  return{chs,ann,types,chDone:done.current};
}

/* ═══════════════════════════════════════════════════════════════════════════════
   11. MAIN
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AsteroidSerpent(){
  useEffect(()=>{const s=document.createElement("style");s.textContent=CSS;
    document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);

  const[screen,setScreen]=useState("menu");
  const[gs,setGs]=useState(mkState);
  const[paused,setPaused]=useState(false);
  const[chMode,setChMode]=useState(false);
  const[inp,setInp]=useState("keyboard");
  const[camMode,setCamMode]=useState("top-down");
  const[exps,setExps]=useState([]);
  const nDir=useRef("RIGHT"),tickRef=useRef(null),t0=useRef(0);
  const running=screen==="playing"&&!paused;

  const{chs,ann,types,chDone}=useChallenges(chMode,running);

  // Voice stays active while playing (even when paused) so "resume" works
  const pausedRef=useRef(paused);pausedRef.current=paused;
  const vState=useVoice(inp==="voice"&&screen==="playing",
    useCallback(cmd=>{if(cmd==="PAUSE")setPaused(true);
      else if(cmd==="RESUME")setPaused(false);
      else if(cmd==="CHALLENGE")setChMode(c=>!c);
      else if(["UP","DOWN","LEFT","RIGHT"].includes(cmd)){
        // Ignore direction commands while paused
        if(pausedRef.current)return;
        if(OPP[cmd]!==nDir.current)nDir.current=cmd;}
    },[screen]));

  const gDir=useGesture(inp==="gesture"&&running,
    useCallback(d=>{if(OPP[d]!==nDir.current)nDir.current=d;},[]) );

  useEffect(()=>{const h=e=>{
    const km={ArrowUp:"UP",w:"UP",W:"UP",ArrowDown:"DOWN",s:"DOWN",S:"DOWN",
      ArrowLeft:"LEFT",a:"LEFT",A:"LEFT",ArrowRight:"RIGHT",d:"RIGHT",D:"RIGHT"};
    const d=km[e.key];
    if(d&&screen==="playing"){e.preventDefault();if(OPP[d]!==nDir.current)nDir.current=d;}
    if(e.key===" "&&screen==="playing"){e.preventDefault();setPaused(p=>!p);}
    if(e.key==="c"||e.key==="C")setChMode(c=>!c);
    if(e.key==="m"||e.key==="M")setCamMode(c=>c==="top-down"?"follow":c==="follow"?"cinematic":"top-down");};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[screen]);

  useEffect(()=>{
    if(screen!=="playing"||paused){if(tickRef.current)clearInterval(tickRef.current);return;}
    const doTick=()=>{setGs(prev=>{if(!prev.alive)return prev;const now=Date.now();
      const rev=types.has("reverse_controls");const prevFood=prev.food;
      let next=tick(prev,nDir.current,now,rev);
      if(types.has("mirror_snake")&&next.alive){const h=next.sn[0];
        for(const s of next.sn){if(h.x===G-1-s.x&&h.y===G-1-s.y){next={...next,alive:false};break;}}}
      if(next.food!==prevFood){
        setExps(e=>[...e.slice(-4),{id:Date.now(),position:[prevFood.x+.5,.5,prevFood.y+.5],
          color:FOOD[prevFood.type]?.color||"#ff6a00",startTime:Date.now()}]);
        if(prevFood.type==="golden")snd.eatG();else if(prevFood.type==="speed")snd.eatS();else snd.eat();
        if(next.combo>1)snd.cmb();}
      if(!next.alive){snd.die();setTimeout(()=>setScreen("gameover"),700);
        return{...next,timeAlive:(now-t0.current)/1000,chDone};}
      return{...next,timeAlive:(now-t0.current)/1000};});};
    const spd=gs.spd*(types.has("speed_surge")?.35:1);
    tickRef.current=setInterval(doTick,spd);
    return()=>{if(tickRef.current)clearInterval(tickRef.current);};
  },[screen,paused,gs.spd,types]);

  const startGame=useCallback(()=>{snd.init();setGs(mkState());nDir.current="RIGHT";
    t0.current=Date.now();setExps([]);setPaused(false);setScreen("playing");},[]);

  const hudSt=useMemo(()=>({sc:gs.sc,len:gs.len,spd:gs.spd,combo:gs.combo,
    mxCombo:gs.mxCombo,eaten:gs.eaten,timeAlive:gs.timeAlive||0,sn:gs.sn,food:gs.food}),[gs]);

  const fogOn=types.has("fog_of_war");

  return<div className="root">
    <div className={`scan-ov ${chMode&&running?"on":""}`}/>
    <div className="cvs">
      <Canvas camera={{position:[G/2,G*.82,G/2+G*.32],fov:52}} shadows
        gl={{antialias:true,alpha:false,powerPreference:"high-performance",
          toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:.85}} dpr={[1,1.5]}>
        <color attach="background" args={["#030308"]}/>
        <fog attach="fog" args={["#030308",fogOn?8:30,fogOn?18:65]}/>
        <Lighting ch={chMode&&running}/>
        <Stars radius={140} depth={70} count={7000} factor={3.5} saturation={0} fade speed={.2}/>
        <SpaceDust/>
        {screen==="playing"&&<>
          <Snake snake={gs.sn} dir={gs.dir} alive={gs.alive}/>
          <Food food={gs.food}/>
          <Explosions exps={exps}/>
          {types.has("mirror_snake")&&<MirrorSnake snake={gs.sn}/>}
          <FallingAsteroids active={types.has("asteroid_rain")}/>
          <Cam snake={gs.sn} dir={gs.dir} mode={camMode}/>
        </>}
        <PostFX ch={chMode&&running}/>
      </Canvas>
    </div>
    {screen==="playing"&&<HUD st={hudSt} inp={inp}
      onCycleInp={()=>{const ms=["keyboard","gesture","voice"];
        setInp(ms[(ms.indexOf(inp)+1)%ms.length]);}}
      vState={vState} gDir={gDir} chs={chs} chMode={chMode}/>}
    {ann&&<div className="ann">⚠ {ann}</div>}
    {screen==="playing"&&paused&&<div className="pause-ov"><div className="pause-txt">PAUSED</div></div>}
    {screen==="menu"&&<Home onStart={startGame} chMode={chMode}
      onToggleCh={()=>setChMode(c=>!c)} inp={inp} onSetInp={setInp}/>}
    {screen==="gameover"&&<GameOver st={{...gs,chDone}}
      onRestart={startGame} onMenu={()=>setScreen("menu")}/>}
    {typeof window!=="undefined"&&"ontouchstart"in window&&screen==="playing"&&
      <div className="dpad">
        <div className="dp u" onTouchStart={()=>{nDir.current="UP";}}>↑</div>
        <div className="dp l" onTouchStart={()=>{nDir.current="LEFT";}}>←</div>
        <div className="dp r" onTouchStart={()=>{nDir.current="RIGHT";}}>→</div>
        <div className="dp d" onTouchStart={()=>{nDir.current="DOWN";}}>↓</div>
      </div>}
  </div>;
}
