import {drawSnake} from "./snake-art.js";
import { worlds } from "/shared/content.js";
export function setupCanvas(canvas, w = 768, h = 544) {
  canvas.width = w;
  canvas.height = h;
  return canvas.getContext("2d");
}
function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
}
function tile(c, x, y, z, color, kind = 0) {
  const g=c.createLinearGradient(x,y,x,y+z);
  g.addColorStop(0,color); g.addColorStop(1,"#11151d");
  c.fillStyle=g; c.fillRect(Math.round(x),Math.round(y),Math.ceil(z),Math.ceil(z));
  rect(c,x,y,z,Math.max(2,z*.09),"#ffffff24");
  rect(c,x,y+z-Math.max(3,z*.12),z,Math.max(3,z*.12),"#0006");
  // deterministic stone/metal seams make the dungeon read as a place, not a grid
  rect(c,x+z*.12,y+z*.30,z*.34,Math.max(1,z*.055),"#0004");
  rect(c,x+z*.58,y+z*.62,z*.27,Math.max(1,z*.05),"#ffffff14");
  if(kind){
    rect(c,x+z-Math.max(2,z*.08),y,Math.max(2,z*.08),z,"#0004");
    c.fillStyle="#ffffff0d"; c.beginPath(); c.arc(x+z*.25,y+z*.72,Math.max(1,z*.06),0,Math.PI*2); c.fill();
  }
}
function actor(c, x, y, z, color, frame = 0, type = "player") {
  const p=z/16, bob=(frame%2)*p;
  c.save(); c.shadowColor="#0009"; c.shadowBlur=p*3;
  c.fillStyle="#0006"; c.beginPath(); c.ellipse(x+8*p,y+15*p,6*p,2*p,0,0,Math.PI*2); c.fill(); c.restore();
  if(type==="enemy"){
    const g=c.createLinearGradient(x,y,x,y+14*p);g.addColorStop(0,color);g.addColorStop(1,"#252238");
    c.fillStyle=g;c.beginPath();c.roundRect(x+3*p,y+3*p+bob,10*p,10*p,3*p);c.fill();
    c.fillStyle=color;c.beginPath();c.roundRect(x+5*p,y+bob,6*p,6*p,2*p);c.fill();
    c.fillStyle="#fff";c.fillRect(x+5*p,y+5*p+bob,2*p,2*p);c.fillRect(x+9*p,y+5*p+bob,2*p,2*p);
    c.fillStyle="#1a1822";c.fillRect(x+6*p,y+5*p+bob,p,p);c.fillRect(x+10*p,y+5*p+bob,p,p);
    c.fillStyle="#ffffff38";c.fillRect(x+5*p,y+2*p+bob,4*p,p);
    return;
  }
  const g=c.createLinearGradient(x,y,x,y+15*p);g.addColorStop(0,"#fff8");g.addColorStop(.15,color);g.addColorStop(1,"#252b38");
  c.fillStyle=g;c.beginPath();c.roundRect(x+4*p,y+2*p+bob,8*p,12*p,3*p);c.fill();
  c.fillStyle=color;c.beginPath();c.arc(x+8*p,y+4*p+bob,4*p,0,Math.PI*2);c.fill();
  c.fillStyle="#18202c";c.fillRect(x+7*p,y+3*p+bob,4*p,2*p);
  c.fillStyle="#ffffff66";c.fillRect(x+5*p,y+7*p+bob,2*p,5*p);
  c.fillStyle="#202532";c.fillRect(x+4*p,y+13*p+bob,3*p,2*p);c.fillRect(x+10*p,y+13*p+(bob?0:p),3*p,2*p);
}
function gem(c,x,y,z,color){
  const cx=x+z/2,cy=y+z/2,g=c.createRadialGradient(cx-z*.12,cy-z*.15,z*.05,cx,cy,z*.52);
  g.addColorStop(0,"#fff");g.addColorStop(.18,color);g.addColorStop(1,"#241d32");
  c.save();c.shadowColor=color;c.shadowBlur=z*.28;c.fillStyle=g;c.beginPath();
  c.moveTo(cx,cy-z*.5);c.lineTo(cx+z*.42,cy-z*.08);c.lineTo(cx+z*.25,cy+z*.42);c.lineTo(cx-z*.25,cy+z*.42);c.lineTo(cx-z*.42,cy-z*.08);c.closePath();c.fill();c.restore();
  c.strokeStyle="#ffffff55";c.lineWidth=Math.max(1,z*.035);c.stroke();
}
function background(c, w, h, color, t = 0) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, color);
  g.addColorStop(0.62, "#111722");
  g.addColorStop(1, "#080b10");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 55; i++) {
    const x = (i * 137 + t * (i % 3 === 0 ? .06 : .025)) % w,
      y = (i * 79) % Math.max(1, h * 0.68),
      pulse = .35 + .65 * Math.abs(Math.sin((t + i * 17) / 55));
    c.fillStyle = `rgba(220,235,255,${.05 + pulse * .12})`;
    c.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  for (let i = 0; i < 8; i++) {
    const x = (i * w) / 7 - ((t * 0.15) % 100);
    rect(c, x, h * 0.5 - (i % 3) * 30, w / 7 - 10, h, "#0002");
    rect(c, x + 4, h * 0.55 - (i % 3) * 30, 8, 18, "#bdff7010");
  }
  // 32-bit-era atmospheric particles: subtle depth without obscuring play.
  for(let i=0;i<18;i++){
    const px=(i*193+t*(.08+(i%4)*.025))%w, py=(i*113+t*.018)%h, r=1+(i%3);
    c.fillStyle=`rgba(255,255,255,${.025+(i%5)*.012})`;
    c.beginPath();c.arc(px,py,r,0,Math.PI*2);c.fill();
  }
  const vignette = c.createRadialGradient(w / 2, h * .45, h * .12, w / 2, h * .45, Math.max(w, h) * .7);
  vignette.addColorStop(0, "#0000");
  vignette.addColorStop(1, "#00000066");
  c.fillStyle = vignette;
  c.fillRect(0, 0, w, h);
}
function directionsForRender(dir) {
  return [[0,-1],[1,0],[0,1],[-1,0]][dir] || [1,0];
}
export function render(c, s, color = "#bdff70", settings = {}, skin = {}) {
  const w = c.canvas.width,
    h = c.canvas.height;
  const mazeZoom = s.game === "maze" ? 1.22 : 1;
  const z = Math.min(
    w / s.width,
    h / (s.game === "platformer" ? 17 : s.height),
  ) * mazeZoom;
  background(
    c,
    w,
    h,
    skin.background || (s.game === "platformer" ? worlds[s.world].sky : "#141b22"),
    s.tick,
  );
  c.save();
  let ox = (w - z * s.width) / 2,
    oy = (h - z * (s.game === "platformer" ? 17 : s.height)) / 2;
  if (s.game === "maze") {
    ox = w/2 - (s.player.x+.5)*z;
    oy = h/2 - (s.player.y+.5)*z;
    ox = Math.min(0,Math.max(w-z*s.width,ox));
    oy = Math.min(0,Math.max(h-z*s.height,oy));
  }
  c.translate(ox, oy);
  if(s.game==="racer"){
    const W=z*s.width,H=z*s.height,horizon=H*.31+s.hill*z*.7;
    c.fillStyle="#79b9df";c.fillRect(0,0,W,horizon);
    // layered 16-bit landscape
    c.fillStyle="#3d6d50";c.beginPath();c.moveTo(0,horizon);for(let x=0;x<=W;x+=W/10)c.lineTo(x,horizon-z*(.7+((x/W*13)%1)*1.2));c.lineTo(W,horizon);c.fill();
    c.fillStyle="#57923e";c.fillRect(0,horizon,W,H-horizon);
    // road as one solid polygon; kerbs are separate quads
    const N=48, pts=[];for(let i=0;i<=N;i++){const p=i/N,y=horizon+(H-horizon)*p*p,cx=W/2+(s.curve*(p*p)*.34+s.curveAhead*p*(1-p)*.16)*W,rw=W*(.045+p*.5);pts.push({p,y,cx,rw})}
    c.fillStyle="#3a3d42";c.beginPath();c.moveTo(pts[0].cx-pts[0].rw,pts[0].y);for(const q of pts)c.lineTo(q.cx-q.rw,q.y);for(let i=pts.length-1;i>=0;i--){const q=pts[i];c.lineTo(q.cx+q.rw,q.y)}c.closePath();c.fill();
    for(let i=0;i<N;i++){const q=pts[i],n=pts[i+1],kw=z*(.04+q.p*.2);c.fillStyle=(i>>1)%2?"#f4eee0":"#d8443d";c.beginPath();c.moveTo(q.cx-q.rw-kw,q.y);c.lineTo(q.cx-q.rw,q.y);c.lineTo(n.cx-n.rw,n.y);c.lineTo(n.cx-n.rw-kw*(1+n.p),n.y);c.fill();c.beginPath();c.moveTo(q.cx+q.rw,q.y);c.lineTo(q.cx+q.rw+kw,q.y);c.lineTo(n.cx+n.rw+kw*(1+n.p),n.y);c.lineTo(n.cx+n.rw,n.y);c.fill()}
    // lane perspective marks
    c.strokeStyle="#ffffff44";c.lineWidth=Math.max(1,z*.035);for(const lane of [-.34,.34]){c.beginPath();for(let i=4;i<pts.length;i++){const q=pts[i],x=q.cx+lane*q.rw;(i===4?c.moveTo(x,q.y):c.lineTo(x,q.y))}c.stroke()}
    const f1=(lane,depth,col,player=false)=>{const p=player?1:Math.max(.12,Math.min(.94,1-depth/620)),q=pts[Math.min(N,Math.max(0,Math.round(p*N)))],x=q.cx+lane*q.rw*.7,y=player?H-z*2.35:q.y,sc=player?z*2.25:z*(.38+p*1.55);c.save();c.translate(x,y);c.fillStyle="#101114";c.fillRect(-sc*.72,0,sc*.28,sc*.58);c.fillRect(sc*.44,0,sc*.28,sc*.58);c.fillStyle=col;c.fillRect(-sc*.78,sc*.15,sc*1.56,sc*.18);c.beginPath();c.moveTo(-sc*.48,sc*.35);c.lineTo(-sc*.3,-sc*.18);c.lineTo(-sc*.12,-sc*.42);c.lineTo(sc*.12,-sc*.42);c.lineTo(sc*.3,-sc*.18);c.lineTo(sc*.48,sc*.35);c.closePath();c.fill();c.fillStyle="#171b22";c.beginPath();c.ellipse(0,-sc*.18,sc*.17,sc*.16,0,0,Math.PI*2);c.fill();c.fillStyle="#eee";c.fillRect(-sc*.065,-sc*.24,sc*.13,sc*.08);c.restore()};
    const visible=s.cars.filter(a=>a.d>5&&a.d<620).sort((a,b)=>b.d-a.d);for(const a of visible)f1(a.lane,a.d,["#f4c542","#4ec3e8","#eee","#65c46a"][Math.abs(Math.floor(a.d))%4]);
    for(const p of s._remotePlayers||[]){const lane=Number(p.state?.x)||0,depth=Math.max(12,(Number(p.state?.distance)||0)-s.distance+90);if(depth<620)f1(lane,depth,["#55cfff","#d58cff","#78e78a","#ff9b4d"][Number(p.slot)%4])}
    f1(s.x,0,"#e63d35",true);
    // compact dashboard, kept inside canvas
    const dh=z*1.25;c.fillStyle="#10141a";c.fillRect(0,H-dh,W,dh);c.fillStyle="#222a33";c.fillRect(W*.29,H-dh+z*.12,W*.42,dh-z*.2);c.strokeStyle="#66727e";c.lineWidth=z*.06;c.strokeRect(W*.3,H-dh+z*.18,W*.4,dh-z*.32);c.textAlign="center";c.fillStyle="#f4eee0";c.font=`bold ${z*.34}px monospace`;c.fillText(Math.round(s.speed*115)+" KM/H   G"+s.gear,W/2,H-z*.55);c.fillStyle="#ffcf45";c.font=`bold ${z*.22}px monospace`;c.fillText("P"+s.position+"  LAP "+Math.min(s.lap,s.laps)+"/"+s.laps+"  "+s.trackName,W/2,H-z*.18);
  } else if(s.game==="tanks"){
    const W=z*s.width,H=z*s.height;c.fillStyle="#18251b";c.fillRect(0,0,W,H);
    for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){if(s.maze?.[y]?.[x]===1){const X=x*z,Y=y*z;c.fillStyle=(x+y)%2?"#4d5c43":"#56664a";c.fillRect(X,Y,z,z);c.fillStyle="#69775a";c.fillRect(X+z*.06,Y+z*.08,z*.88,z*.13);c.fillStyle="#303b2e";c.fillRect(X,Y+z*.82,z,z*.18)}else if((x*11+y*17)%23===0){c.fillStyle="#263a29";c.fillRect(x*z+z*.42,y*z+z*.35,z*.12,z*.3)}}
    const tank=(o,col)=>{const X=o.x*z,Y=o.y*z;c.save();c.translate(X,Y);c.rotate(o.dir*Math.PI/2);c.fillStyle="#101510";c.fillRect(-z*.44,-z*.4,z*.18,z*.8);c.fillRect(z*.26,-z*.4,z*.18,z*.8);c.fillStyle=col;c.fillRect(-z*.32,-z*.34,z*.64,z*.68);c.fillStyle="#a9ad72";c.beginPath();c.arc(0,0,z*.23,0,Math.PI*2);c.fill();c.fillRect(-z*.065,-z*.62,z*.13,z*.68);c.restore()};
    for(const b of s.bots)if(b.hp>0)tank(b,skin.enemy||"#b65d4e");for(const p of s._remotePlayers||[]){const slot=Number(p.slot)||0,ghost={x:Number(p.state?.x)||3+(slot%2)*18,y:Number(p.state?.y)||8+(slot%3)*2,dir:Number(p.state?.dir)||0};tank(ghost,["#69d7ff","#d58cff","#8cff9b","#ffb45f"][slot%4])}tank(s.player,skin.color||"#d8c86c");
    for(const q of s.shots){c.fillStyle=q.enemy?"#ff695c":"#fff2a0";c.beginPath();c.arc(q.x*z,q.y*z,z*.1,0,Math.PI*2);c.fill()}for(const d of s.drops)if(!d.taken){c.fillStyle="#ffd84e";c.beginPath();c.arc(d.x*z,d.y*z,z*.18,0,Math.PI*2);c.fill()}
    } else   if (s.game === "mines") {
    const cell=Math.min(z*1.9,56), bw=cell*9, bh=cell*9, sx=(z*s.width-bw)/2, sy=(z*s.height-bh)/2;
    const has=(a,x,y)=>a.includes(x+","+y), count=(x,y)=>{let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&has(s.mines,x+dx,y+dy))n++;return n};
    for(let y=0;y<9;y++)for(let x=0;x<9;x++){const X=sx+x*cell,Y=sy+y*cell,open=has(s.open,x,y),mine=has(s.mines,x,y);
      const g=c.createLinearGradient(X,Y,X,Y+cell);g.addColorStop(0,open?"#202b35":"#334754");g.addColorStop(1,open?"#121920":"#18252d");c.fillStyle=g;c.fillRect(X+2,Y+2,cell-4,cell-4);
      if(open&&!mine){const n=count(x,y);if(n){c.fillStyle=["","#72d7ff","#8cff9b","#ffd36b","#ff8b78","#d49bff"][Math.min(n,5)];c.font=`bold ${cell*.45}px monospace`;c.textAlign="center";c.textBaseline="middle";c.fillText(n,X+cell/2,Y+cell/2)}}
      if((s.over&&mine)||has(s.flags,x,y)){c.fillStyle=mine&&s.over?"#ff6d78":"#ffd36b";c.beginPath();c.arc(X+cell/2,Y+cell/2,cell*.18,0,Math.PI*2);c.fill()}
      if(s.cursor.x===x&&s.cursor.y===y){c.strokeStyle=color;c.lineWidth=3;c.strokeRect(X+3,Y+3,cell-6,cell-6)}
    }
  } else if (s.game === "merge2048") {
    const cell=Math.min(z*3.2,112), gap=8,bw=cell*4+gap*3,sx=(z*s.width-bw)/2,sy=(z*s.height-bw)/2;
    for(let y=0;y<4;y++)for(let x=0;x<4;x++){const v=s.board[y][x],X=sx+x*(cell+gap),Y=sy+y*(cell+gap),h=v?Math.min(52+Math.log2(v)*14,210):28;
      c.fillStyle=`hsl(${h} 55% ${v?38:16}%)`;c.beginPath();c.roundRect(X,Y,cell,cell,12);c.fill();if(v){c.fillStyle="#fff";c.font=`bold ${cell*(v>=1024?.25:.34)}px monospace`;c.textAlign="center";c.textBaseline="middle";c.fillText(v,X+cell/2,Y+cell/2)}
    }
  } else if (s.game === "snake") {
    drawSnake(c,s,z,skin,settings);
  }
  if (s.game === "maze") {
    for (let y = 0; y < s.height; y++)
      for (let x = 0; x < s.width; x++) {
        if (s.map[y][x]) tile(c, x * z, y * z, z, skin.terrain || "#47445e", 1);
        else if ((x * 17 + y * 3) % 7 === 0)
          rect(c, x * z + 3, y * z + z * 0.7, z * 0.4, 2, "#39344a");
      }
    for (const dot of s.pellets || []) if(!dot.taken){
      c.fillStyle="#f5e8c8"; c.beginPath(); c.arc((dot.x+.5)*z,(dot.y+.5)*z,Math.max(1.4,z*.075),0,Math.PI*2); c.fill();
    }
    for (const power of s.powers || []) if(!power.taken){
      const pulse=.22+Math.sin(s.tick/5)*.05;
      c.save();c.shadowColor=color;c.shadowBlur=z*.65;c.fillStyle=color;c.beginPath();
      c.arc((power.x+.5)*z,(power.y+.5)*z,z*pulse,0,Math.PI*2);c.fill();c.restore();
    }
    for (const wall of s.fakeWalls || []) {
      if (!wall.revealed) {
        tile(c, wall.x * z, wall.y * z, z, skin.terrain || "#47445e", 1);
        // tiny visual tell: a cracked seam, visible only to attentive players
        rect(c, wall.x*z+z*.48, wall.y*z+z*.18, Math.max(1,z*.06), z*.25, "#ffffff16");
        rect(c, wall.x*z+z*.34, wall.y*z+z*.43, z*.18, Math.max(1,z*.06), "#0005");
      }
    }
    for (const r of s.rooms) {
      const rx=(r.x+.5)*z, ry=(r.y+.5)*z;
      if (["treasure","challenge","rare","secret","event"].includes(r.type)) {
        c.save();
        c.globalAlpha=.13+.05*Math.sin((s.tick+r.x*7)/18);
        c.fillStyle=r.type==="rare"?"#8eefff":r.type==="treasure"?"#ffd06e":r.type==="challenge"?"#ff8c72":color;
        c.beginPath(); c.arc(rx,ry,z*1.7,0,Math.PI*2); c.fill(); c.restore();
      }
      if (r.type === "trap")
        rect(
          c,
          r.x * z,
          r.y * z,
          z,
          z,
          s.tick % 90 < 25 ? "#f8696977" : "#e7bb612a",
        );
      if (r.type === "rare" && s.rare)
        gem(c, r.x * z, r.y * z, z * 0.7, "#9ee7fb");
    }
    tile(c, s.exit.x * z, s.exit.y * z, z, s.keys && s.exitOpen ? "#a4d967" : "#a68b53");
    rect(
      c,
      s.exit.x * z + z * 0.45,
      s.exit.y * z + z * 0.2,
      3,
      z * 0.6,
      "#221b26",
    );
    if (!s.keyTaken) {
      if (s.keyMode === 2)
        tile(c, s.key.x * z + 2, s.key.y * z + 3, z - 4, "#a27745");
      else if (s.keyMode === 0) {
        gem(c, s.key.x * z + 4, s.key.y * z + 3, z * 0.4, "#ffd680");
        rect(
          c,
          s.key.x * z + z * 0.4,
          s.key.y * z + z * 0.5,
          3,
          z * 0.4,
          "#ffd680",
        );
      }
    }
    rect(
      c,
      s.secret.x * z + 2,
      s.secret.y * z + 2,
      3,
      3,
      s.secretFound ? "#bdff70" : "#665979",
    );
    for (const e of s.enemies)
      actor(
        c,
        e.x * z,
        e.y * z,
        z,
        s.tick < s.frightenedUntil
          ? (s.frightenedUntil-s.tick<75 && s.tick%12<6 ? "#eef0ff" : "#7187ff")
          : e.type === "boss"
          ? "#ff8066"
          : e.key
            ? "#edc368"
            : e.type === "hunter"
              ? "#b39bed"
              : skin.enemy || "#f28dad",
        Math.floor(s.tick / 10),
        "enemy",
      );
    for (const p of s.projectiles) gem(c, p.x * z, p.y * z, z * 0.4, "#ffb267");
    if (s.tick > s.invulnerable || s.tick % 6 < 3) {
      // Maze hero is a dedicated "eater": a glowing disc with an animated mouth.
      const px=(s.player.x+.5)*z, py=(s.player.y+.5)*z, dirs=[[0,-1],[1,0],[0,1],[-1,0]], d=dirs[s.facing??1], angle=Math.atan2(d[1],d[0]);
      const bite=.20+Math.abs(Math.sin(s.tick/3))*.38;
      c.save();c.shadowColor=color;c.shadowBlur=z*.5;c.fillStyle=color;c.beginPath();
      c.moveTo(px,py);c.arc(px,py,z*.39,angle+bite,angle+Math.PI*2-bite);c.closePath();c.fill();c.restore();
      c.fillStyle="#111722";c.beginPath();c.arc(px+d[1]*z*.12+d[0]*z*.08,py-d[0]*z*.12+d[1]*z*.08,Math.max(1.5,z*.055),0,Math.PI*2);c.fill();
    }
    if (settings.lighting !== false) {
      const g = c.createRadialGradient(
        (s.player.x + 0.5) * z,
        (s.player.y + 0.5) * z,
        z * 3,
        (s.player.x + 0.5) * z,
        (s.player.y + 0.5) * z,
        z * 17,
      );
      g.addColorStop(0, "#0000");
      g.addColorStop(1, "#070812bb");
      c.fillStyle = g;
      c.fillRect(0, 0, s.width * z, s.height * z);
    }
  }
  if (s.game === "platformer") {
    const camera = Math.max(0, Math.min(s.length - 24, s.player.x - 8));
    c.save();
    c.translate(-camera * z, 0);
    for (const f of s.platforms) {
      if (f.type === "falling" && f.trigger && s.tick - f.trigger > 22) continue;
      if (f.type === "vanish" && Math.floor(s.tick / 45) % 2) continue;
      for (let i = 0; i < f.w; i++) {
        tile(c, (f.x + i) * z, f.y * z, z, skin.terrain || worlds[s.world].tile, 1);
        rect(c, (f.x + i) * z, f.y * z, z, 4, worlds[s.world].accent);
        if (f.type === "ground")
          for (let j = 1; j < 4; j++)
            tile(c, (f.x + i) * z, (f.y + j) * z, z, "#30303c");
      }
    }
    for (const t of s.traps) {
      const phase=s.tick%120, on=t.type==="spikes"||(t.type==="laser"&&phase<48)||(t.type==="crusher"&&phase>65)||(t.type==="fire"&&phase>22&&phase<72)||(t.type==="pendulum"&&Math.abs(Math.sin(s.tick/20))>.45);
      if(t.type==="laser"){ rect(c,t.x*z,7*z,Math.max(3,z*.12),7*z,on?"#ff5e75":"#5b3945"); if(on){c.save();c.shadowColor="#ff5e75";c.shadowBlur=z;rect(c,t.x*z,7*z,Math.max(2,z*.08),7*z,"#ffb0b9");c.restore();}}
      else if(t.type==="fire"){ for(let i=0;i<3;i++){const flame=(on?1:.35)*(1+Math.sin((s.tick+i*7)/5)*.18);c.fillStyle=i%2?"#ffcf63":"#ff6b45";c.beginPath();c.moveTo((t.x+i*.25)*z,14*z);c.lineTo((t.x+i*.25+.13)*z,(14-flame)*z);c.lineTo((t.x+i*.25+.28)*z,14*z);c.fill();}}
      else if(t.type==="pendulum"){const a=Math.sin(s.tick/20)*1.05,px=(t.x+Math.sin(a)*3)*z,py=(7+Math.cos(a)*3)*z;c.strokeStyle="#8f93a4";c.lineWidth=3;c.beginPath();c.moveTo(t.x*z,6*z);c.lineTo(px,py);c.stroke();c.fillStyle="#ff8992";c.beginPath();c.arc(px,py,z*.35,0,Math.PI*2);c.fill();}
      else { for (let i=0;i<3;i++){c.fillStyle=on?"#ff8992":"#845363";c.beginPath();c.moveTo((t.x+i/3)*z,(t.y+1)*z);c.lineTo((t.x+i/3+.17)*z,t.y*z);c.lineTo((t.x+i/3+.33)*z,(t.y+1)*z);c.fill();}}
    }
    for (const coin of s.coins)
      if (!coin.taken)
        gem(
          c,
          coin.x * z,
          (coin.y + Math.sin(s.tick / 8) * 0.1) * z,
          z * 0.45,
          "#ffdc86",
        );
    rect(
      c,
      s.secret.x * z,
      s.secret.y * z,
      4,
      4,
      s.secretFound ? "#ffcd81" : "#7b9b79",
    );
    rect(c, s.checkpoint.x * z, 11 * z, 3, 3 * z, "#fff8");
    rect(
      c,
      s.checkpoint.x * z,
      11 * z,
      z * 0.6,
      z * 0.5,
      s.checkpointTaken ? "#bdff70" : "#8b98a9",
    );
    for (const e of s.enemies)
      actor(
        c,
        e.x * z,
        e.y * z,
        z * (e.type === "boss" ? 1.5 : 1),
        e.type === "boss" ? "#e37cc1" : (skin.enemy || "#fa9977"),
        Math.floor(s.tick / 8),
        "enemy",
      );
    for (const b of s.projectiles)
      gem(c, b.x * z, b.y * z, z * 0.35, "#fca568");
    tile(c, (s.length - 2) * z, 12 * z, z, worlds[s.world].accent);
    rect(c, (s.length - 2) * z, 11 * z, z, 2 * z, "#ffffff22");
    if (s.tick > s.invulnerable || s.tick % 6 < 3)
      actor(
        c,
        s.player.x * z,
        s.player.y * z,
        z,
        color,
        Math.floor(s.tick / 5),
      );
    c.restore();
  }
  c.restore();
}
export function preview(canvas, game, hero = false) {
  const c = setupCanvas(canvas, hero ? 500 : 360, hero ? 320 : 210),
    w = c.canvas.width,
    h = c.canvas.height;
  background(
    c,
    w,
    h,
    game === "snake" ? "#223024" : game === "maze" ? "#26233b" : "#322735",
  );
  const z = hero ? 20 : 15;
  if (game === "snake") {
    for (let y = 2; y < 12; y++)
      for (let x = 1; x < 24; x++) rect(c, x * z, y * z, 1, 1, "#fff2");
    const cells = [
      [4, 8],
      [5, 8],
      [6, 8],
      [7, 8],
      [7, 7],
      [7, 6],
      [8, 6],
      [9, 6],
      [10, 6],
      [10, 7],
      [10, 8],
      [11, 8],
      [12, 8],
      [13, 8],
      [14, 8],
      [14, 7],
      [14, 6],
      [14, 5],
      [15, 5],
      [16, 5],
    ];
    for (const [x, y] of cells) tile(c, x * z, y * z, z - 2, "#98cf65");
    gem(c, 18 * z, 5 * z, z, "#ff9cba");
  } else if (game === "maze") {
    for (let y = 2; y < 13; y++)
      for (let x = 1; x < 24; x++)
        if (x % 5 === 0 || y % 4 === 0) {
          if ((x + y) % 7) tile(c, x * z, y * z, z, "#656078", 1);
        }
    actor(c, 12 * z, 7 * z, z * 1.5, "#c5a2ff");
    gem(c, 17 * z, 6 * z, z, "#f3d48c");
    actor(c, 7 * z, 10 * z, z, "#f38da9", 0, "enemy");
  } else if (game === "mines") {
    for(let y=1;y<6;y++)for(let x=3;x<9;x++){tile(c,x*z,y*z,z-2,"#3c5664",1);if((x+y)%5===0)gem(c,x*z+z*.25,y*z+z*.25,z*.5,"#ff6d78")}
    actor(c,11*z,5*z,z*1.3,"#72d7ff");
  } else if (game === "merge2048") {
    const vals=[2,4,8,16,32,64,128,256];for(let i=0;i<8;i++){const x=5+i%4*3,y=3+Math.floor(i/4)*3;tile(c,x*z,y*z,z*2.4,"hsl("+(55+i*18)+" 55% 38%)",1);c.fillStyle="#fff";c.font="bold "+(z*.65)+"px monospace";c.fillText(vals[i],x*z+z*.65,y*z+z*1.4)}
  } else {
    for (let x = 0; x < 26; x++) {
      if (x < 9 || x > 12)
        for (let y = 11; y < 15; y++) tile(c, x * z, y * z, z, "#665d61");
      if (x > 4 && x < 10) tile(c, x * z, 7 * z, z, "#a59883");
      if (x > 14 && x < 20) tile(c, x * z, 8 * z, z, "#a59883");
    }
    actor(c, 7 * z, 5 * z, z * 1.5, "#ffc181");
    for (let x = 14; x < 18; x++) gem(c, x * z, 6 * z, z * 0.5, "#ffe0a1");
  }
}
