const rnd=s=>((s.rng=(s.rng*1664525+1013904223)>>>0)/4294967296);
const hit=(a,b,r=.65)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
const key=(x,y)=>Math.floor(x)+","+Math.floor(y);
function makeMaze(s){
 const W=31,H=23,grid=Array.from({length:H},()=>Array(W).fill(1));
 const stack=[[1,1]];grid[1][1]=0;
 while(stack.length){const [x,y]=stack[stack.length-1],opts=[];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const nx=x+dx,ny=y+dy;if(nx>0&&ny>0&&nx<W-1&&ny<H-1&&grid[ny][nx])opts.push([nx,ny,dx,dy])}if(!opts.length){stack.pop();continue}const [nx,ny,dx,dy]=opts[Math.floor(rnd(s)*opts.length)];grid[y+dy/2][x+dx/2]=0;grid[ny][nx]=0;stack.push([nx,ny])}
 // Open selected walls to create wide arenas and loops instead of narrow Pac-Man corridors.
 for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++)if(grid[y][x]&&rnd(s)<.34){const horiz=!grid[y][x-1]&&!grid[y][x+1],vert=!grid[y-1][x]&&!grid[y+1][x];if(horiz||vert)grid[y][x]=0}
 for(const [cx,cy] of [[4,4],[15,5],[26,5],[8,16],[22,17]])for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++)if(x>0&&y>0&&x<W-1&&y<H-1)grid[y][x]=0;
 return {W,H,grid,walls:new Set(grid.flatMap((r,y)=>r.map((v,x)=>v?x+","+y:null).filter(Boolean)))};
}
const blocked=(s,x,y,r=.36)=>{for(const ox of [-r,r])for(const oy of [-r,r])if(s.walls.has(key(x+ox,y+oy)))return true;return false};
const openSpot=(s,far=false)=>{for(let n=0;n<300;n++){const x=1.5+Math.floor(rnd(s)*(s.width-3)),y=1.5+Math.floor(rnd(s)*(s.height-3));if(!blocked(s,x,y)&&(!far||Math.hypot(x-s.player.x,y-s.player.y)>7))return{x,y}}return{x:2.5,y:2.5}};
export function init(s){const m=makeMaze(s);Object.assign(s,{width:m.W,height:m.H,walls:m.walls,maze:m.grid,player:{x:2.5,y:2.5,dir:1,hp:3,cool:0},bots:[],shots:[],coins:0,drops:[],lastInput:0});for(let i=0;i<7;i++){const p=openSpot(s,true);s.bots.push({...p,dir:2,hp:2,cool:20+i*7,turn:0})}return s}
function fire(s,o,enemy=false){if(o.cool>0)return;o.cool=12;const d=[[0,-1],[1,0],[0,1],[-1,0]][o.dir];s.shots.push({x:o.x,y:o.y,dx:d[0]*.34,dy:d[1]*.34,enemy,life:90})}
function move(s,o,dx,dy){const nx=o.x+dx,ny=o.y+dy;if(!blocked(s,nx,o.y))o.x=nx;if(!blocked(s,o.x,ny))o.y=ny}
export function step(s,input){const p=s.player;if(p.cool>0)p.cool--;let dx=0,dy=0;if(input&1){dy=-.12;p.dir=0}else if(input&2){dx=.12;p.dir=1}else if(input&4){dy=.12;p.dir=2}else if(input&8){dx=-.12;p.dir=3}move(s,p,dx,dy);if((input&32)&&!(s.lastInput&32))fire(s,p);s.lastInput=input;
 for(const b of s.bots){if(b.hp<=0)continue;if(b.cool>0)b.cool--;b.turn--;const vx=p.x-b.x,vy=p.y-b.y;if(b.turn<=0){b.turn=16+Math.floor(rnd(s)*35);if(Math.abs(vx)>Math.abs(vy))b.dir=vx>0?1:3;else b.dir=vy>0?2:0;if(rnd(s)<.28)b.dir=Math.floor(rnd(s)*4)}const d=[[0,-.045],[.045,0],[0,.045],[-.045,0]][b.dir],ox=b.x,oy=b.y;move(s,b,d[0],d[1]);if(Math.abs(b.x-ox)+Math.abs(b.y-oy)<.005){b.dir=(b.dir+(rnd(s)<.5?1:3))%4;b.turn=5}if(Math.hypot(vx,vy)<10&&rnd(s)<.028)fire(s,b,true)}
 for(const q of s.shots){q.x+=q.dx;q.y+=q.dy;q.life--;if(blocked(s,q.x,q.y,.08)){q.life=0;continue}if(q.enemy){if(hit(q,p,.5)){p.hp--;q.life=0}}else for(const b of s.bots)if(b.hp>0&&hit(q,b,.5)){b.hp--;q.life=0;if(b.hp<=0){s.score+=100;if(rnd(s)<.45)s.drops.push({x:b.x,y:b.y})}}}
 s.shots=s.shots.filter(q=>q.life>0&&q.x>0&&q.x<s.width&&q.y>0&&q.y<s.height);for(const d of s.drops)if(!d.taken&&hit(d,p,.7)){d.taken=true;s.coins++;s.score+=25}if(p.hp<=0)s.over=true;if(s.bots.every(b=>b.hp<=0)){s.won=true;s.over=true;s.score+=500}}
