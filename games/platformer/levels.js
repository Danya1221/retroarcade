export const levels = [
  ["Первые искры",0,78,"station"],["Над туманом",0,84,"vertical"],["Зелёный сторож",0,90,"guardian"],
  ["Холодный пуск",1,94,"lab"],["Разрыв цепи",1,100,"shaft"],["Сердце лаборатории",1,106,"reactor"],
  ["Пепельный мост",2,108,"bridge"],["Обратная сторона",2,114,"void"],["Последний передатчик",2,124,"transmitter"],
].map(([name,world,length,layout],i)=>({id:i+1,name,world,length,layout,boss:[2,5,8].includes(i),final:i===8}));

export function buildLevel(level) {
  const def=levels[level-1]; if(!def) throw Error("Unknown level");
  const platforms=[{x:0,y:14,w:12,type:"ground"}];
  const gaps=def.layout==="bridge"?[12,25,39,54,70,88]:[12,30,49,68,88,106];
  let x=12;
  for(const gap of gaps.filter(n=>n<def.length-10)){
    const start=Math.max(x,gap+3), width=Math.min(14+(level%3),def.length-start);
    if(width>0) platforms.push({x:start,y:14,w:width,type:"ground"});
    x=start+width;
  }
  if(x<def.length) platforms.push({x,y:14,w:def.length-x,type:"ground"});
  const elevated=[];
  for(let px=7,n=0;px<def.length-9;px+=9+(n++%3)){
    const vertical=["vertical","shaft","reactor"].includes(def.layout);
    const y=vertical?11-(n%4)*2:9+(n%3);
    elevated.push({x:px,y,w:3+(n%3),type:n%5===0&&level>2?"falling":n%4===0?"moving":level>6&&n%6===0?"vanish":"normal",baseX:px});
  }
  platforms.push(...elevated);
  const types=["patrol","flying","jumping","ranged","armored","fast"];
  const enemies=[];
  for(let ex=20,i=0;ex<def.length-12;ex+=11,i++) enemies.push({x:ex,y:12.8,vx:i%2?.045:-.045,type:types[(i+level)%types.length],hp:types[(i+level)%types.length]==="armored"?2:1,home:ex});
  if(def.boss) enemies.push({x:def.length-8,y:12,vx:.04,type:"boss",hp:def.final?10:5,home:def.length-8,mini:!def.final});
  const trapTypes=level<=2?["spikes"]:level<=5?["spikes","laser","fire"]:["spikes","laser","fire","pendulum","crusher"];
  const traps=[]; for(let tx=25,i=0;tx<def.length-10;tx+=18,i++) traps.push({x:tx,y:13,type:trapTypes[i%trapTypes.length]});
  return {...def,platforms,enemies,
    coins:Array.from({length:16},(_,i)=>({x:5+i*Math.max(4,Math.floor((def.length-12)/16)),y:7+(i%4)})).filter(c=>c.x<def.length-5),
    traps,secret:{x:def.layout==="vertical"?34:11,y:def.layout==="vertical"?5:8},
    checkpoint:{x:Math.floor(def.length*.52),y:12}};
}
