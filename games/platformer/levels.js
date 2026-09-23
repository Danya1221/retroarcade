// The mountain ridge, castle site and cave recur in every era of Green Hills.
// Each chapter adds one clue during play. The ending is withheld until level 15.
export const levels = [
  ["Зелёные холмы",0,78,"station","Тропа к замку. Начни путь, собирай монеты и ищи тайники."],
  ["Знакомые руины",0,84,"vertical","Те же горы. Замок разрушен, а мост пропал. Сколько лет прошло?"],
  ["След по ту сторону",0,90,"guardian","Путешественник ждёт у разлома. Он знает о медальоне больше тебя."],
  ["До замка",1,94,"lab","На месте замка — храм. Его строители знали твой медальон."],
  ["Храм под горой",1,100,"shaft","На стенах храма изображён человек в красном капюшоне."],
  ["Первый отпечаток",1,106,"reactor","В тайнике лежит изображение медальона. Как оно попало сюда?"],
  ["Рельсы над мостом",2,108,"bridge","Рельсы проложены сквозь старую башню. Похититель только что был здесь."],
  ["Шахта у реки",2,114,"void","Знакомая пещера стала шахтой; внизу оставлен чужой лагерь."],
  ["Часовой механизм",2,124,"transmitter","На фотографии рядом с машиной времени — человек, похожий на тебя."],
  ["Комплекс на холме",3,102,"station","Комплекс вырос на фундаменте замка. Система узнаёт тебя."],
  ["Мост из света",3,108,"vertical","Открывающийся портал всегда на шаг впереди. Здесь что-то пошло не так."],
  ["Архив времени",3,112,"guardian","В архиве сохранилось предупреждение: медальон нельзя замкнуть."],
  ["Переписанная река",3,118,"bridge","Воды нет на старом месте. Кто-то уже изменил прошлое."],
  ["Последний разлом",3,124,"vertical","Путешественник оставил тебе путь. Он пытался спасти этот мир."],
  ["Первый день",3,132,"transmitter","Правда о медальоне ждёт там, где началась погоня."],
].map(([name,world,length,layout,story],i)=>({
  id:i+1,name,world,length,layout,boss:[2,5,8,11,14].includes(i),final:i===14,
  story,
  events: [
    [{x:31,lines:["Небо треснуло. В траву падает незнакомец.","Незнакомец: Где я?.. Какой сейчас год?","Ты помогаешь ему подняться."],kind:"rift"},
     {x:37,lines:["Незнакомец: Где ты взял медальон?","Герой: Он всегда был у меня.","Он выхватывает медальон и скрывается в разломе!"],kind:"theft"}],
    [{x:9,lines:["Те же горы. Но замок лежит в руинах.","На мосту остались лишь опоры."],kind:"ruins"},
     {x:52,lines:["За пропастью мелькнул красный свет его устройства."],kind:"chase"}],
    [{x:65,lines:["Незнакомец: Ты всё ещё думаешь, что я украл его у тебя?","Он уходит в разлом, прежде чем ты успеваешь спросить."],kind:"encounter"}],
    [{x:23,lines:["Замка ещё нет. На его месте стоит древний храм."],kind:"temple"}],
    [{x:45,lines:["В камне высечен твой силуэт. Но храм древнее тебя."],kind:"memory"}],
    [{x:54,lines:["Медальон изображён дважды — по обе стороны разлома."],kind:"memory"}],
    [{x:35,lines:["Паровой поезд проходит сквозь знакомую башню."],kind:"industrial"}],
    [{x:55,lines:["В пещере ещё тлеет костёр путешественника."],kind:"camp"}],
    [{x:60,lines:["На старой фотографии — человек с твоим лицом."],kind:"memory"}],
    [{x:26,lines:["IDENTITY CONFIRMED. Система знает твоё имя."],kind:"future"}],
    [{x:58,lines:["Портал закрывается в нескольких шагах впереди."],kind:"chase"}],
    [{x:55,lines:["Архив: НЕ ЗАМЫКАТЬ ЦЕПЬ. Повторение уничтожит долину."],kind:"memory"}],
    [{x:45,lines:["Старая река исчезла. Кто изменил её течение?"],kind:"memory"}],
    [{x:68,lines:["Путешественник: Я пытался остановить то, что мы начали."],kind:"encounter"}],
    [{x:96,lines:["Путешественник: Ты сам дал мне медальон. Тогда, в будущем.","Герой: Значит, я уже был здесь... во всех эпохах?","В первом разломе он забрал медальон, чтобы разорвать петлю."],kind:"reveal"}],
  ][i],
}));

export function buildLevel(level) {
  const def=levels[level-1]; if(!def) throw Error("Unknown level");
  const platforms=[{x:0,y:14,w:12,type:"ground"}];
  const gaps=def.layout==="bridge"?[12,25,39,54,70,88]:[12,30,49,68,88,106];
  let x=12;
  for(const gap of gaps.filter(n=>n<def.length-10)){
    // Keep every compulsory ground gap at three cells; the old increasing
    // gaps eventually exceeded the horizontal distance of a full jump.
    const start=x+3, width=Math.min(14+(level%3),def.length-start);
    if(width>0) platforms.push({x:start,y:14,w:width,type:"ground"});
    x=start+width;
  }
  if(x<def.length) platforms.push({x,y:14,w:def.length-x,type:"ground"});
  const elevated=[];
  for(let px=7,n=0;px<def.length-9;px+=6+(n++%2)){
    const vertical=["vertical","shaft","reactor"].includes(def.layout);
    // The first ledge is three cells above ground; taller routes climb in
    // two-cell steps with short enough horizontal gaps for the current jump.
    const y=vertical?[11,9,7,9,11][n%5]:[11,12,11,13][n%4];
    elevated.push({x:px,y,w:3+(n%3),type:n>0&&n%5===0&&level>2?"falling":n>0&&n%4===0?"moving":n>0&&level>6&&n%6===0?"vanish":"normal",baseX:px});
  }
  platforms.push(...elevated);
  const types=["patrol","flying","jumping","ranged","armored","fast"];
  const enemies=[];
  for(let ex=20,i=0;ex<def.length-12;ex+=11,i++) enemies.push({x:ex,y:12.8,vx:i%2?.045:-.045,type:types[(i+level)%types.length],hp:types[(i+level)%types.length]==="armored"?2:1,home:ex});
  if(def.boss) enemies.push({x:def.length-8,y:12,vx:.04,type:"boss",hp:def.final?10:5,home:def.length-8,mini:!def.final});
  const trapTypes=level<=2?["spikes"]:level<=5?["spikes","laser","fire"]:["spikes","laser","fire","pendulum","crusher"];
  const traps=[]; for(let tx=25,i=0;tx<def.length-10;tx+=18,i++) traps.push({x:tx,y:13,type:trapTypes[i%trapTypes.length]});
  const chests=Array.from({length:Math.floor((def.length-18)/21)},(_,i)=>({
    x:17+i*21,y:10.5,locked:i%2===1,opened:false,
  }));
  // Keys sit above the ground route, beside an accessible upper ledge.
  const keys=chests.filter(c=>c.locked).map(c=>({x:c.x-5,y:9.5,taken:false}));
  const ladders=elevated.filter((_,i)=>i%3===0).map(f=>({x:f.x+1,y:f.y,bottom:14}));
  return {...def,platforms,enemies,chests,keys,ladders,
    coins:Array.from({length:16},(_,i)=>({x:5+i*Math.max(4,Math.floor((def.length-12)/16)),y:10+(i%3)})).filter(c=>c.x<def.length-5),
    traps,secret:{x:def.layout==="vertical"?21:11,y:def.layout==="vertical"?10:11},
    checkpoint:{x:Math.floor(def.length*.52),y:12}};
}
