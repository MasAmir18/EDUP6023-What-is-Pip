import {rooms} from "./rooms.js";
import {advance,distance,reach,route} from "./navigation.js";
import {evidence} from "./evidence.js";
import {createBoard} from "./board.js";
import {createManorCinema} from "./cutscene.js";

const el = id => document.getElementById(id);
const clues = new Map(evidence.clues.map(clue=>[clue.id,clue]));
const saveKey="ravenswood-case-v2";
const legacyKey="ravenswood-board-v1";
function read(key){
  try {return JSON.parse(localStorage.getItem(key));} catch {return null;}
}
const saved=read(saveKey);
let activeCase=saved?.active?.name?saved.active:null;
let legacy=read(legacyKey);
if(!legacy?.found?.length && !legacy?.attempted?.length) legacy=null;
const records=Array.isArray(saved?.records)?saved.records.filter(
  item=>typeof item?.name==="string" && Number.isFinite(item.score)):[];

const found=new Map();
const attempted=new Set();
let unlocked=0,roomIndex=0,complete=false;
let screen="menu";
const room = () => rooms[roomIndex];
let position, facing=.6, buttons, view=false;
let waypoints=[], arrival=null, nearest=null;
let frame=0, previousTick=0;
const held=new Set();
const direction={
  arrowup:[0,-1], w:[0,-1], arrowdown:[0,1], s:[0,1],
  arrowleft:[-1,0], a:[-1,0], arrowright:[1,0], d:[1,0]
};
const modal=el("modal"), dialog=el("dialog-body");
let board;
const cinema=createManorCinema(el("shot-canvas"));
const scenes=[
  ["The Mystery Theft","Lightning flashes over Ravenswood Manor. A shadowy figure sneaks into the Conservatory and steals the Golden Owl Trophy."],
  ["Detective Pip Arrives","Outside the manor, Pip sits in his classic car and strikes a match. As the rain falls, he considers what might have happened."],
  ["The Investigation Begins","Pip steps into the Grand Foyer. Search four rooms, question three suspects, and solve fifteen preposition clues."],
  ["The Golden Owl Is Recovered","Professor Finch admits he borrowed the trophy to polish it. He returns it safely to its velvet pedestal."]
];
let sceneIndex, sceneStarted, storyFrame, afterStory;

function writeSave(){
  try {localStorage.setItem(saveKey,JSON.stringify({active:activeCase,records}));} catch {}
}
function forgetLegacy(){
  legacy=null;
  try {localStorage.removeItem(legacyKey);} catch {}
}
function persist(){
  if(!activeCase) return;
  Object.assign(activeCase,{found:[...found],unlocked,roomIndex,attempted:[...attempted],complete});
  writeSave();
}
function loadCase(data){
  const entries=Array.isArray(data.found)?data.found.filter(entry=>
    Array.isArray(entry) && clues.has(entry[0]) && [20,30].includes(entry[1])):[];
  found.clear();
  for(const [id,points] of entries) found.set(id,points);
  attempted.clear();
  for(const id of Array.isArray(data.attempted)?data.attempted:[]){
    if(clues.has(id)) attempted.add(id);
  }
  unlocked=Number.isInteger(data.unlocked)?Math.min(rooms.length-1,Math.max(0,data.unlocked)):0;
  roomIndex=Number.isInteger(data.roomIndex)?Math.max(0,Math.min(unlocked,data.roomIndex)):0;
  complete=Boolean(data.complete && found.size===clues.size);
  activeCase=data;
}

function showScreen(next){
  stop();
  screen=next;
  el("case-menu").hidden=next!=="menu";
  el("game-shell").hidden=next!=="game";
  el("cutscene").hidden=next!=="story";
}
function showMenu(){
  showScreen("menu");
  el("continue-case").hidden=!(activeCase||legacy);
  el("continue-label").textContent=activeCase?.name||(legacy?"Saved progress":"");
  el("reset-case").hidden=!(activeCase||legacy);
  el("menu-title").focus();
}
function enterPlay(){
  showScreen("game");
  board ||= createBoard(el("board"),el("world"),el("nodes"));
  el("player-label").textContent=`${activeCase.name} · ${activeCase.className}`;
  selectRoom(roomIndex);
  el("main-menu").focus();
}

function startStory(ending,onFinish){
  if(modal.open) modal.close();
  showScreen("story");
  afterStory=onFinish;
  setScene(ending?3:0);
  storyFrame=requestAnimationFrame(drawStory);
}
function setScene(index){
  sceneIndex=index;sceneStarted=performance.now();
  el("scene-number").textContent=index===3?"Case closed":`Opening scene ${index+1} / 3`;
  el("scene-title").textContent=scenes[index][0];
  el("scene-text").textContent=scenes[index][1];
  el("shot-stage").style.backgroundImage=`url("manor-scene-${index}.webp")`;
  el("skip-scene").hidden=index===3;
  el("next-scene").textContent=index<2?"Next scene →":index===2?"Continue →":"See case score →";
  el("scene-title").focus();
}
function drawStory(now){
  cinema.show(sceneIndex,(now-sceneStarted)/1000);
  storyFrame=requestAnimationFrame(drawStory);
}
function finishStory(){
  if(screen!=="story") return;
  cancelAnimationFrame(storyFrame);
  cinema.close();
  const resume=afterStory;
  afterStory=null;
  resume();
}

function make(tag,cls,content){
  const node=document.createElement(tag);
  if(cls) node.className=cls;
  if(content) node.textContent=content;
  return node;
}
function pointsTotal(){return [...found.values()].reduce((sum,num)=>sum+num,0);}
function roomReady(){return room().clueIds.every(id=>found.has(id));}
function status(message){el("walk-status").textContent=message;}
function label(marker){
  return marker.clueId?clues.get(marker.clueId).objectName:"Room exit";
}
function selectRoom(index){
  roomIndex=index;
  stop();
  position={...room().start};facing=.6;nearest=null;
  el("room-title").textContent=room().name;
  el("room-overline").textContent="Room "+room().number;
  el("room-counter").textContent=(index+1)+" of "+rooms.length;
  el("room-notes").textContent=room().note;
  buttons=new Map();
  for(const marker of room().markers){
    const button=make("button","node");
    button.type="button";
    button.onclick=()=>walkTo(marker,marker);
    buttons.set(marker.key,button);
  }
  el("nodes").replaceChildren(...buttons.values());
  board.room(room(),index,buttons);
  board.update(position,facing,false,view);
  status("Click the floor or use WASD to explore.");
  update(); persist();
}

function update(){
  const ready=roomReady();
  for(const marker of room().markers){
    const button=buttons.get(marker.key);
    const solved=found.has(marker.clueId);
    button.className=["node",marker.exit?"exit":"clue",solved?"solved":"",
      marker.exit&&!ready?"locked":""].filter(Boolean).join(" ");
    button.setAttribute("aria-label",label(marker)+(solved?" · found":""));
    button.textContent=marker.exit?"↗":solved?"✓":"✦";
  }
  const remaining=room().clueIds.filter(id=>!found.has(id)).length;
  el("objective").textContent=remaining ? `Find ${remaining} ${remaining===1?"clue":"clues"}, then reach the exit.` :
    roomIndex===3?"Reach the exit to make your deduction.":"All evidence collected. Reach the exit.";
  el("global-progress").textContent=`${found.size} / ${clues.size}`;
  el("global-score").textContent=pointsTotal();
  el("deduce").disabled=found.size!==clues.size;
  el("deduce").textContent=complete?"Read the case verdict":"Make an accusation";
  el("rooms").replaceChildren(...rooms.map((item,i)=>{
    const button=make("button","room");
    button.type="button"; button.disabled=i>unlocked;
    if(i===roomIndex) button.setAttribute("aria-current","step");
    const count=item.clueIds.filter(id=>found.has(id)).length;
    button.append(make("span","ordinal",item.number),make("span","",item.short),
      make("span","total",button.disabled?"Locked":`${count}/${item.clueIds.length}`));
    button.onclick=()=>{if(i!==roomIndex) selectRoom(i);};
    return button;
  }));
  el("evidence").replaceChildren(...room().clueIds.map(id=>{
    const clue=clues.get(id);
    const solved=found.has(id);
    const btn=make("button",`evidence-card${solved?" found":""}`);
    btn.type="button"; btn.disabled=!solved;
    btn.append(make("span","stamp",solved?"✓":"✧"), make("span","",solved?clue.clueName:clue.objectName));
    btn.onclick=()=>openEvidence(clue);
    return btn;
  }));
  updateNearby();
}

function walkTo(point,marker=null){
  if(modal.open) return;
  if(marker && distance(position,marker)<=reach){
    stop();inspect(marker);return;
  }
  held.clear();
  waypoints=route(room(),position,point,marker?reach*.92:0);
  arrival=marker;
  if(waypoints.length) request();
}
function stop(){
  held.clear();waypoints=[];arrival=null;previousTick=0;
  if(frame){cancelAnimationFrame(frame);frame=0;}
  if(position && board) board.update(position,facing,false,view);
}
function request(){if(!frame) frame=requestAnimationFrame(tick);}
function updateNearby(){
  let closest=null, gap=reach;
  for(const marker of room().markers){
    const d=distance(position,marker);
    if(d<gap){closest=marker;gap=d;}
  }
  nearest=closest;
  for(const marker of room().markers){
    buttons.get(marker.key).classList.toggle("near",marker===closest);
  }
  el("interact").disabled=!closest;
  el("interact").textContent=closest?(closest.exit?"Use exit":"Inspect "+label(closest)):"Inspect clue";
}
function tick(now){
  frame=0;
  if(modal.open){stop();return;}
  const limit=2.85*Math.min(previousTick?(now-previousTick)*.001:1/60,.034);
  previousTick=now;
  const start=position;
  if(held.size){
    let x=0,z=0;
    for(const key of held){x+=direction[key][0];z+=direction[key][1];}
    const length=Math.hypot(x,z);
    if(length){
      const angle=view?0:Math.PI/4;
      const cos=Math.cos(angle), sin=Math.sin(angle);
      position=advance(room(),position,(cos*x+sin*z)*limit/length,(-sin*x+cos*z)*limit/length);
    }
  }else if(waypoints.length){
    const goal=waypoints[0], gap=distance(goal,position);
    if(gap<=limit){position=waypoints.shift();}
    else{
      position={x:position.x+(goal.x-position.x)*limit/gap,z:position.z+(goal.z-position.z)*limit/gap};
    }
  }
  const moved=distance(start,position)>.002;
  if(moved){
    facing=Math.atan2(position.x-start.x,position.z-start.z);
    updateNearby();
  }
  const moving=held.size>0||waypoints.length>0;
  board.update(position,facing,moved&&moving,view);
  if(moving){request();return;}
  const arrived=arrival;
  arrival=null;previousTick=0;
  if(arrived&&distance(position,arrived)<=reach) inspect(arrived);
}
function inspect(marker){
  if(marker.clueId){
    const clue=clues.get(marker.clueId);
    if(found.has(marker.clueId)) openEvidence(clue);
    else openClue(clue);
    return;
  }
  if(!roomReady()){
    status("Gather every clue in this room to open the exit.");
    return;
  }
  if(roomIndex===rooms.length-1){
    openDeduction(); return;
  }
  unlocked=Math.max(unlocked,roomIndex+1);
  selectRoom(roomIndex+1);
  status("Exit reached. A new room is open.");
}

function showDialog(label,title){
  stop();
  const close=make("button","close","×");close.type="button";close.setAttribute("aria-label","Close");
  close.onclick=()=>modal.close();
  const heading=make("h2","modal-title",title); heading.id="modal-title";
  dialog.replaceChildren(close,make("p","modal-eyebrow",label),heading);
  if(!modal.open) modal.showModal();
}
function nextButton(label,action){
  const footer=make("div","dialog-footer");
  const button=make("button","primary",label);
  button.type="button";button.onclick=action;
  footer.append(button);dialog.append(footer);
}
function openClue(clue){
  showDialog("Preposition of "+clue.category,clue.objectName);
  const heading=dialog.querySelector("h2");
  heading.tabIndex=-1;
  heading.focus();
  const options=make("div","answers");
  const feedback=make("p","feedback");feedback.setAttribute("role","status");
  dialog.append(make("p","modal-copy",clue.introLine),make("p","sentence",clue.sentence),options,feedback);
  clue.options.forEach(word=>{
    const answer=make("button","",word);answer.type="button";
    options.append(answer);
    answer.onclick=()=>{
      if(found.has(clue.id)) return;
      const first=!attempted.has(clue.id);
      attempted.add(clue.id);
      if(word!==clue.answer){
        answer.disabled=true;
        feedback.textContent=clue.hint;
        persist();
        return;
      }
      found.set(clue.id,first?30:20);
      persist();update();
      status(`Evidence collected. +${first?30:20} points.`);
      openEvidence(clue,"Return to the board");
      dialog.querySelector(".dialog-footer button").focus();
    };
  });
}
function openEvidence(clue,buttonLabel="Back"){
  showDialog("Evidence collected",clue.clueName);
  dialog.append(make("p","modal-copy",clue.clueDesc));
  nextButton(buttonLabel,()=>modal.close());
}
function openDeduction(){
  if(found.size!==clues.size) return;
  if(complete){showVerdict();return;}
  showDialog("Final deduction","Who took the Golden Owl?");
  dialog.append(make("p","modal-copy","Review the clues and choose the suspect whose story fits the evidence."));
  const suspects=make("div","suspects");
  const feedback=make("p","feedback");feedback.setAttribute("role","status");
  for(const suspect of evidence.suspects){
    const button=make("button","",suspect.name);button.type="button";
    button.append(make("small","",suspect.alibi));
    button.onclick=()=>{
      if(suspect.id==="finch"){
        complete=true;
        recordCase();
        persist();update();
        startStory(true,()=>{
          showScreen("game");
          showVerdict();
        });
      }else{
        feedback.textContent="Check the spectacle cloth, the missing coat button, and the gold polish.";
        button.disabled=true;
      }
    };
    suspects.append(button);
  }
  dialog.append(suspects,feedback);
}
function showVerdict(){
  showDialog("Case closed","The Golden Owl is safe");
  dialog.append(make("p","modal-copy","Professor Finch admits he borrowed the Golden Owl Trophy to polish it. The trophy is back on its velvet pedestal."));
  dialog.append(make("p","modal-copy",`Class: ${activeCase.className}`));
  dialog.append(make("p","sentence",`${activeCase.name} · ${found.size} clues solved · ${pointsTotal()} points`));
  nextButton("Return to the manor",()=>modal.close());
}
el("help").onclick=()=>{
  showDialog("Controls","How to play");
  dialog.append(make("p","modal-copy","Hold WASD or the arrow keys to walk. You can also click or tap anywhere on the floor to send Pip there."));
  dialog.append(make("p","modal-copy","Click a gold clue marker to walk over and inspect it, or press E when you’re close. Collect each room’s evidence, then use the green exit."));
  nextButton("Back to the manor",()=>modal.close());
};
el("interact").onclick=()=>{if(nearest) inspect(nearest);};
el("board").addEventListener("click",event=>{
  if(event.target.closest(".node")) return;
  const point=board.pick(event.clientX,event.clientY);
  if(point) walkTo(point);
});
el("retry").onclick=()=>{selectRoom(roomIndex);status("Back at the entrance. Your evidence is saved.");};
el("deduce").onclick=openDeduction;
el("view").onclick=()=>{
  view=!view;
  el("view").textContent=view?"Isometric view":"Overhead view";
  el("view").setAttribute("aria-pressed",String(view));
  board.update(position,facing,false,view);
};
window.addEventListener("keydown",event=>{
  if(screen!=="game" || modal.open || event.ctrlKey || event.metaKey || event.altKey) return;
  const key=event.key.toLowerCase();
  if(key==="e" && nearest && !event.repeat){event.preventDefault();inspect(nearest);return;}
  if(!direction[key]) return;
  event.preventDefault();
  waypoints=[];arrival=null;held.add(key);request();
});
window.addEventListener("keyup",event=>held.delete(event.key.toLowerCase()));
window.addEventListener("blur",stop);
function recordCase(){
  const {id,name,className}=activeCase;
  const record=records.find(item=>item.id===id);
  if(record){
    Object.assign(record,{name,className});
  }else{
    records.push({id,name,className,score:pointsTotal()});
    if(window.parent!==window) window.__pipSend?.("manor",pointsTotal(),clues.size*30,name);
  }
}
function requestRegistration(resuming=false){
  const savedCase=resuming?(activeCase||legacy):null;
  showDialog("Case registration","Enter your name and class");
  const message=resuming?"Enter your details to continue your saved investigation."
    :activeCase||legacy?"Starting a new case replaces your current progress. Completed scores stay in the case file."
    :"Your name and class will appear beside your score when you solve the case.";
  dialog.append(make("p","modal-copy",message));
  const form=make("form","case-form");
  function field(id,labelText,autocomplete,value=""){
    const label=make("label","",labelText);
    label.htmlFor=id;
    const input=make("input");
    input.id=id;input.name=id;input.type="text";input.required=true;input.maxLength=40;
    input.autocomplete=autocomplete;input.value=value;
    input.addEventListener("input",()=>input.setCustomValidity(""));
    form.append(label,input);
    return input;
  }
  const input=field("detective-name","Player name","nickname",savedCase?.name);
  const classInput=field("detective-class","Class name","off");
  const start=make("button","primary",resuming?"Resume investigation":"Start investigation");
  start.type="submit";form.append(start);
  dialog.append(form);
  form.addEventListener("submit",event=>{
    event.preventDefault();
    const name=input.value.trim().replace(/\s+/g," ");
    const className=classInput.value.trim().replace(/\s+/g," ");
    if(!name){
      input.setCustomValidity("Enter your name to start.");
      input.reportValidity();
      return;
    }
    if(!className){
      classInput.setCustomValidity("Enter your class name to start.");
      classInput.reportValidity();
      return;
    }
    const id=savedCase?.id||crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;
    loadCase({...savedCase,id,name,className});
    if(complete) recordCase();
    persist();forgetLegacy();
    modal.close();
    if(resuming) enterPlay();
    else startStory(false,enterPlay);
  });
  (input.value?classInput:input).focus();
}
function showScores(){
  showDialog("Case file","Case scores");
  if(!records.length){
    dialog.append(make("p","modal-copy","Completed investigations will appear here."));
  }else{
    const table=make("table","score-list");
    const head=make("thead"), row=make("tr");
    row.append(make("th","","Detective"),make("th","","Class"),make("th","","Score"));
    head.append(row);table.append(head);
    const body=make("tbody");
    for(const result of [...records].reverse().sort((a,b)=>b.score-a.score)){
      const entry=make("tr");
      entry.append(make("td","",result.name),make("td","",result.className||"—"),make("td","",String(result.score)));
      body.append(entry);
    }
    table.append(body);dialog.append(table);
  }
  nextButton("Back to main menu",()=>modal.close());
}
el("new-case").onclick=()=>requestRegistration();
el("continue-case").onclick=()=>{
  if(!activeCase?.className){if(activeCase||legacy) requestRegistration(true);return;}
  loadCase(activeCase);enterPlay();
};
el("watch-intro").onclick=()=>startStory(false,showMenu);
el("main-menu").onclick=()=>{persist();showMenu();};
el("case-scores").onclick=showScores;
el("reset-case").onclick=()=>{
  showDialog("Saved case","Reset your investigation?");
  dialog.append(make("p","modal-copy","This clears your current clue progress. Completed scores stay in the case file."));
  nextButton("Reset case",()=>{
    activeCase=null;forgetLegacy();writeSave();
    modal.close();showMenu();
  });
};
el("skip-scene").onclick=finishStory;
el("next-scene").onclick=()=>{
  if(sceneIndex<2) setScene(sceneIndex+1);
  else finishStory();
};
showMenu();
