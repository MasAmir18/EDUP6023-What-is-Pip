import {bounds} from "./navigation.js";

const T=window.THREE;
const TAU=Math.PI*2;
const motion=matchMedia("(prefers-reduced-motion: reduce)");
const palettes=[
  {wall:0x583940,accent:0x7a3945, floor:[0x88785b,0xb39b75],stone:true},
  {wall:0x305653,accent:0x52716a, floor:[0x90734d,0x997d56]},
  {wall:0x662e42,accent:0x9e5155, floor:[0x9e7757,0xb18a63]},
  {wall:0x355e5d,accent:0x6e8c80, floor:[0x697f73,0x91a195],stone:true}
];
const center=(x,z)=>[x-3,z-2.5];

function flatBoard(nodes,viewButton){
  nodes.classList.add("flat");
  viewButton.hidden=true;
  const pawn=document.createElement("span");
  pawn.className="flat-pip"; pawn.setAttribute("aria-hidden","true");
  const place=(node,{x,z})=>{
    node.style.left=`${(x+.5)*100/7}%`;
    node.style.top=`${(z+.5)*100/6}%`;
  };
  return {
    room(data,index,buttons){
      for(const marker of data.markers) place(buttons.get(marker.key),marker);
      nodes.append(pawn);
    },
    update(point){place(pawn,point);},
    pick(clientX,clientY){
      const rect=nodes.getBoundingClientRect();
      const x=((clientX-rect.left)/rect.width)*7-.5;
      const z=((clientY-rect.top)/rect.height)*6-.5;
      return inside(x,z)?{x,z}:null;
    }
  };
}
function inside(x,z){
  return x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ;
}

export function createBoard(host,canvas,nodes){
  const viewButton=document.getElementById("view");
  if(!T) return flatBoard(nodes,viewButton);
  let renderer;
  try {
    renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  } catch {return flatBoard(nodes,viewButton);}

  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputEncoding=T.sRGBEncoding;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;
  renderer.setClearColor(0x000000,0);
  const scene=new T.Scene();
  const camera=new T.OrthographicCamera(-6,6,4,-4,.1,55);
  const target=new T.Vector3(0,.34,-.015);
  const screen=new T.Vector3();
  const hemisphere=new T.HemisphereLight(0xe9f5f6,0x3e2a2a,1.03);
  const warm=new T.DirectionalLight(0xffe2b5,2.0);
  warm.position.set(-5,10,4);warm.castShadow=true;
  warm.shadow.mapSize.set(1024,1024);
  Object.assign(warm.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:22});
  warm.shadow.bias=-.00044; warm.shadow.normalBias=.025;
  const soft=new T.DirectionalLight(0x9bd8d4,.63);
  soft.position.set(5,5,-4);
  scene.add(hemisphere,warm,soft);
  const material=(color,options={})=>new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness:.8,...options});
  const bronze=material(0xbb8543,{metalness:.32,roughness:.39});
  const gilt=material(0xe5b967,{metalness:.23,roughness:.39});
  const ginger=material(0xa9684c);
  const cream=material(0xe5c99a);
  const ebony=material(0x201c23);
  const umber=material(0x4b2f29);
  const teal=material(0x326d69);
  const slate=material(0x475265);
  const apron=material(0xd9dbc9);
  const velvet=material(0x80718d);
  const wool=material(0x803e4a);
  const leaf=material(0x42776a);
  const stone=material(0x9b9a83);
  const light=new T.MeshBasicMaterial({color:0xffc873});
  const mirror=material(0x799997,{metalness:.56,roughness:.23});
  const bones=material(0xc6b391);
  const exitMat=material(0x4b8d78);
  const plateMat=material(0x234543,{metalness:.18,roughness:.57});
  const shapes=new Map();
  const shared=new Set([bronze,gilt,ginger,cream,ebony,umber,teal,slate,wool,leaf,stone,light,mirror,bones,apron,velvet,exitMat,plateMat]);
  function geometry(key,build){
    if(!shapes.has(key)) shapes.set(key,build());
    return shapes.get(key);
  }
  function group(parent,x=0,y=0,z=0){
    const obj=new T.Group();
    obj.position.set(x,y,z);parent.add(obj);return obj;
  }
  function mesh(parent,geo,mat,x,y,z,shadow=true){
    const obj=new T.Mesh(geo,mat);obj.position.set(x,y,z);
    obj.castShadow=shadow;
    obj.receiveShadow=true;
    parent.add(obj);return obj;
  }
  function box(parent,mat,x,y,z,w,h,d,shadow=true){
    const obj=mesh(parent,geometry("box",()=>new T.BoxGeometry()),mat,x,y,z,shadow);
    obj.scale.set(w,h,d);return obj;
  }
  function ball(parent,mat,x,y,z,w,h,d){
    const obj=mesh(parent,geometry("ball",()=>new T.SphereGeometry(1,16,12)),mat,x,y,z);
    obj.scale.set(w,h,d);return obj;
  }
  function turned(parent,mat,x,y,z,top,bottom,height,sides=16){
    const name=`c${top},${bottom},${height},${sides}`;
    return mesh(parent,geometry(name,()=>new T.CylinderGeometry(top,bottom,height,sides)),mat,x,y,z);
  }
  function rod(parent,mat,a,b,r){
    const dir=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const obj=mesh(parent,geometry("rod",()=>new T.CylinderGeometry(1,1,1,9)),mat,
      (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
    obj.scale.set(r,dir.length(),r);
    obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());
    return obj;
  }
  function ring(parent,mat,x,y,z,r,t){
    return mesh(parent,geometry(`r${r},${t}`,()=>new T.TorusGeometry(r,t,8,24)),mat,x,y,z);
  }
  function arch(parent,mat,x,y,z,width,height){
    const radius=width/2;
    const shape=new T.Shape();
    shape.moveTo(-radius,0);
    shape.lineTo(radius,0);
    shape.lineTo(radius,height-radius);
    shape.absarc(0,height-radius,radius,0,Math.PI,false);
    shape.lineTo(-radius,0);
    return mesh(parent,new T.ExtrudeGeometry(shape,{depth:.039,bevelEnabled:true,bevelSize:.015,bevelThickness:.006,bevelSegments:1,curveSegments:12}),mat,x,y,z);
  }
  function windowFrame(parent,x,y,z,width,height,curtain){
    const window=group(parent,x,y,z);
    arch(window,bronze,0,0,0,width,height);
    arch(window,mirror,0,.038,.064,width-.12,height-.11);
    box(window,bronze,0,height*.43,.116,.035,height*.80,.021);
    box(window,bronze,0,.63,.116,width-.11,.029,.023);
    box(window,bronze,0,.007,.124,width+.14,.065,.207);
    if(curtain){
      rod(window,gilt,[-width*.66,height,.26],[width*.66,height,.26],.016);
      for(const sign of [-1,1]){
        for(let i=0;i<4;i++){
          ball(window,wool,sign*(width*.43+i*.044),height*.56,.19,.050,height*.47,.06);
        }
      }
    }
    return window;
  }

  function figure(parent,coat=teal,role="pip"){
    const result=group(parent);
    turned(result,ebony,0,.034,0,.192,.215,.068);
    turned(result,role==="pip"?gilt:bronze,0,.075,0,.175,.191,.027);
    ball(result,coat,0,.292,0,.164,.211,.128);
    ball(result,ginger,0,.561,0,.189,.167,.151);
    for(const sign of [-1,1]){
      ball(result,cream,sign*.067,.581,.110,.085,.084,.067);
      ball(result,ebony,sign*.061,.593,.164,.029,.033,.021);
      ball(result,cream,sign*.058,.606,.182,.008,.008,.004);
      ball(result,coat,sign*.142,.341,.008,.046,.118,.062).rotation.z=sign*.21;
      ball(result,ebony,sign*.071,.143,.057,.05,.034,.073);
    }
    const beak=turned(result,gilt,0,.538,.166,.040,.004,.059,4);
    beak.rotation.y=Math.PI/4;
    turned(result,coat,0,.703,0,.119,.158,.072);
    ball(result,coat,0,.670,.027,.196,.032,.158);
    turned(result,bronze,0,.665,.001,.151,.157,.021);
    if(role==="pip"){
      const lens=ring(result,gilt,.186,.444,.086,.056,.010);
      lens.rotation.y=.22;
      rod(result,gilt,[.176,.401,.082],[.148,.341,.052],.012);
      box(result,gilt,0,.326,.125,.022,.124,.014);
    }else if(role==="pierre"){
      turned(result,apron,0,.747,0,.13,.103,.13);
      ball(result,apron,0,.815,0,.155,.081,.129);
    }else if(role==="finch"){
      for(const x of [-.066,.066]) ring(result,bronze,x,.591,.182,.058,.008);
    }
    return result;
  }

  function plant(parent){
    turned(parent,wool,0,.116,0,.168,.124,.232);
    turned(parent,bronze,0,.231,0,.185,.176,.041);
    for(let i=0;i<7;i++){
      const angle=i*TAU/7;
      const frond=ball(parent,leaf,Math.cos(angle)*.116,.393+(i%3)*.034,Math.sin(angle)*.116,.060,.185,.061);
      frond.rotation.set(.49*Math.sin(angle),angle,-.52*Math.cos(angle));
    }
  }
  function clock(parent){
    box(parent,umber,0,.497,0,.36,.994,.239);
    box(parent,umber,0,.051,0,.41,.098,.30);
    arch(parent,umber,0,.71,.065,.377,.457);
    turned(parent,bones,0,.942,.159,.143,.143,.027,24).rotation.x=Math.PI/2;
    ring(parent,bronze,0,.942,.179,.136,.014);
    rod(parent,ebony,[0,.941,.194],[0,1.033,.194],.009);
    rod(parent,ebony,[0,.941,.194],[-.069,.901,.194],.009);
    box(parent,ebony,0,.47,.126,.209,.36,.015);
    rod(parent,gilt,[0,.606,.145],[0,.359,.145],.009);
    ball(parent,gilt,0,.363,.139,.067,.067,.024);
  }
  function rug(parent,wide=1.32,deep=.91){
    box(parent,gilt,0,.009,0,wide,.014,deep,false);
    box(parent,wool,0,.022,0,wide-.055,.011,deep-.05,false);
    for(let i=-1;i<=1;i++){
      box(parent,gilt,i*wide*.23,.030,0,.134,.006,.134,false).rotation.y=Math.PI/4;
    }
  }
  function stairs(parent){
    for(let i=0;i<6;i++){
      const h=(i+1)*.092;
      box(parent,umber,-.454+i*.194,h/2,0,.214,h,.65);
      box(parent,wool,-.454+i*.194,h+.008,0,.192,.019,.32);
      rod(parent,bronze,[-.454+i*.194,h,.31],[-.454+i*.194,h+.234,.31],.011);
    }
    rod(parent,gilt,[-.49,.31,.31],[.53,.792,.31],.026);
  }
  function settee(parent){
    box(parent,umber,0,.14,0,.96,.12,.42);
    box(parent,wool,0,.238,-.160,.95,.363,.148);
    box(parent,wool,0,.218,.024,.87,.106,.36);
    for(const sign of [-1,1]){
      ball(parent,wool,sign*.462,.288,.033,.103,.109,.224);
      box(parent,bronze,sign*.41,.059,.12,.085,.12,.087);
    }
  }
  function bookshelf(parent){
    box(parent,umber,0,.475,-.04,.77,.95,.28);
    for(const sign of [-1,1]) box(parent,umber,sign*.361,.49,.03,.084,.985,.32);
    const colors=[wool,teal,gilt,slate,bones,leaf];
    for(let row=0;row<3;row++){
      const y=.096+row*.292;
      box(parent,bronze,0,y,.080,.73,.042,.28);
      for(let col=0;col<7;col++){
        const h=.153+((row*13+col*3)%5)*.018;
        box(parent,colors[(col+row)%colors.length],-.253+col*.085,y+.031+h/2,.153,.065,h,.13);
      }
    }
  }
  function table(parent,banquet){
    const width=banquet?1.31:.88,depth=banquet?.59:.51;
    box(parent,umber,0,.372,0,width,.088,depth);
    for(const sign of [-1,1])for(const end of [-1,1]) {
      turned(parent,umber,sign*(width/2-.09),.17,end*(depth/2-.067),.037,.028,.34,8);
    }
    if(banquet) {
      box(parent,bones,0,.424,0,width-.16,.018,.19);
      for(const x of [-.37,0,.37]){
        rod(parent,gilt,[x,.425,0],[x,.575,0],.016);
        ball(parent,light,x,.591,0,.016,.033,.012);
      }
    }else{
      box(parent,bones,.16,.429,.036,.21,.011,.151);
      rod(parent,bronze,[-.23,.419,.06],[-.23,.626,.06],.015);
      ball(parent,leaf,-.23,.623,.058,.093,.040,.063);
    }
  }
  function displayCase(parent,glass){
    box(parent,umber,0,.204,0,.46,.408,.411);
    box(parent,wool,0,.434,0,.48,.039,.42);
    const panes=new T.MeshBasicMaterial({color:0x8db7b6,transparent:true,opacity:.23,depthWrite:false});
    box(parent,panes,0,.592,0,.432,.282,.392,false);
    for(const x of [-.222,.222])for(const z of [-.195,.195]){
      box(parent,bronze,x,.583,z,.016,.306,.016);
    }
    box(parent,bronze,0,.487,.202,.074,.052,.015);
    if(glass)box(parent,glass,0,.731,0,.433,.021,.396,false);
  }
  function model(kind,root){
    if(kind==="clock") clock(root);
    if(kind==="evelyn") figure(root,velvet,kind);
    if(kind==="pierre") figure(root,apron,kind);
    if(kind==="finch") figure(root,slate,kind);
    if(kind==="plant") plant(root);
    if(kind==="stair") stairs(root);
    if(kind==="settee") settee(root);
    if(kind==="rug") rug(root);
    if(kind==="books") bookshelf(root);
    if(kind==="desk"||kind==="banquet") table(root,kind==="banquet");
    if(kind==="window") windowFrame(root,0,0,0,1.15,1.19,true);
    if(kind==="bust"){
      turned(root,stone,0,.194,0,.139,.18,.388,6);
      ball(root,bones,0,.446,0,.11,.142,.09);
      ball(root,bones,0,.592,0,.105,.102,.093);
    }
    if(kind==="box"){
      box(root,umber,0,.12,0,.46,.24,.38);
      box(root,gilt,0,.179,.194,.075,.091,.022);
    }
    if(kind==="cabinet"){
      box(root,umber,0,.253,0,.66,.506,.39);
      box(root,bronze,0,.518,0,.704,.044,.43);
      for(const x of [-.18,.03,.21]) turned(root,bones,x,.589,.018,.054,.04,.121);
    }
    if(kind==="fountain"){
      turned(root,stone,0,.10,0,.346,.302,.2,24);
      const water=material(0x639190,{metalness:.25,roughness:.20});
      turned(root,water,0,.211,0,.310,.31,.023,24);
      turned(root,bones,0,.281,0,.077,.13,.175);
      turned(root,stone,0,.377,0,.223,.106,.059,18);
      turned(root,water,0,.415,0,.186,.186,.020,18);
      ball(root,water,0,.478,0,.027,.063,.026);
    }
    if(kind==="case") displayCase(root,mirror);
    if(kind==="fireplace"){
      box(root,stone,0,.402,0,.69,.803,.256);
      box(root,bones,0,.827,0,.77,.065,.348);
      arch(root,ebony,0,0,.135,.428,.524);
      for(let i=0;i<3;i++){
        ball(root,light,(i-1)*.083,.143+i*.020,.17,.029,.12,.036);
      }
    }
  }

  let root, player, buttonMap, activeRoom, angle=0, angleGoal=0, frame=0;
  let pose, contextLost=false, fallback;
  const ray=new T.Raycaster();
  const floor=new T.Plane(new T.Vector3(0,1,0),0);
  const hit=new T.Vector3();
  const pointer=new T.Vector2();
  function clear(){
    if(!root) return;
    const materials=new Set(),orphanGeometry=new Set();
    const reusable=new Set(shapes.values());
    root.traverse(obj=>{
      if(obj.geometry&&!reusable.has(obj.geometry)) orphanGeometry.add(obj.geometry);
      if(obj.material&&!shared.has(obj.material)) materials.add(obj.material);
    });
    materials.forEach(mat=>{mat.map?.dispose();mat.dispose();});
    orphanGeometry.forEach(geo=>geo.dispose());
    scene.remove(root);
  }
  function build(data,index,buttons){
    if(contextLost){fallback.room(data,index,buttons);return;}
    clear();
    root=group(scene);
    activeRoom=data; buttonMap=buttons;
    const palette=palettes[index];
    const wall=material(palette.wall), trim=material(palette.accent);
    const tiles=palette.floor.map(color=>material(color));
    const foundation=material(0x3d2c2c);
    box(root,foundation,0,-.237,0,7.65,.40,6.63);
    box(root,bronze,0,-.111,0,7.76,.055,6.72);
    box(root,plateMat,0,-.44,0,7.75,.085,6.71);
    for(const sign of [-1,1]) for(const end of [-1,1]){
      ball(root,bronze,sign*3.76,-.280,end*3.24,.11,.089,.11);
    }
    for(let z=0;z<6;z++)for(let x=0;x<7;x++){
      const [px,pz]=center(x,z);
      box(root,tiles[(x+z)%2],px,-.030,pz,.992,.066,.992,false);
      if(!palette.stone)for(let board=0;board<3;board++){
        box(root,tiles[(x+z+board)%2],px-.33+board*.33,.005,pz,.322,.009,.993,false);
      }
    }
    const exit=data.markers.find(marker=>marker.exit);
    const [exitX,exitZ]=center(exit.x,exit.z);
    turned(root,exitMat,exitX,.02,exitZ,.26,.26,.024,20);
    const rim=ring(root,gilt,exitX,.037,exitZ,.25,.009);
    rim.rotation.x=-Math.PI/2;
    const back=group(root,0,0,-3.13);
    const left=group(root,-3.63,0,0);
    left.rotation.y=Math.PI/2;
    box(back,wall,0,.628,0,7.49,1.27,.195);
    box(left,wall,0,.492,0,6.10,.99,.178);
    for(const [wallGroup,span,h] of [[back,7.48,1.26],[left,6.1,.99]]){
      box(wallGroup,umber,0,.210,.106,span,.405,.075);
      box(wallGroup,bronze,0,.426,.110,span,.034,.083);
      box(wallGroup,bronze,0,h,.005,span+.06,.049,.235);
      for(let i=0;i<Math.floor(span);i++){
        const x=i-(Math.floor(span)-1)/2;
        box(wallGroup,trim,x,.205,.151,.744,.274,.018);
      }
    }
    for(const x of [-2.60,-.82,.92,2.62]){
      if(index===3){
        windowFrame(back,x,.435,.113,.98,1.02,false);
      }else{
        const picture=group(back,x,.703,.119);
        box(picture,gilt,0,.062,0,.291,.251,.040);
        box(picture,trim,0,.062,.029,.240,.202,.016);
        ball(picture,bones,0,.064,.041,.042,.074,.025);
      }
    }
    for(const [kind,x,z] of data.decor){
      const [ox,oz]=center(x,z);
      const ornament=group(root,ox,.01,oz);
      model(kind,ornament);
    }
    player=figure(root);
  }

  function resize(){
    if(contextLost) return;
    const width=host.clientWidth;
    const height=host.clientHeight;
    if(!width||!height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5,1560/width,1000/height));
    renderer.setSize(width,height,false);
    const aspect=width/height;
    const half=Math.max(4.30,5.05/aspect);
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
    camera.updateProjectionMatrix();
    request();
  }
  function pointButtons(){
    const w=host.clientWidth,h=host.clientHeight;
    if(!buttonMap) return;
    for(const marker of activeRoom.markers){
      const button=buttonMap.get(marker.key);
      const [x,z]=center(marker.x,marker.z);
      screen.set(x,marker.exit?.09:.63,z).project(camera);
      button.style.left=`${(screen.x+1)*w/2}px`;
      button.style.top=`${(1-screen.y)*h/2}px`;
    }
  }
  function request(){if(!frame&&!contextLost) frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;
    const changing=Math.abs(angleGoal-angle)>.003;
    angle=motion.matches||!changing?angleGoal:angle+(angleGoal-angle)*.17;
    const slope=1-angle;
    camera.position.set(10.5*slope,10.85+5.4*angle,10.5*slope+.04);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    pointButtons();
    if(pose&&player){
      const {point,facing,walking}=pose;
      const [x,z]=center(point.x,point.z);
      const step=walking&&!motion.matches?Math.sin(now*.018)*.036:0;
      player.position.set(x,Math.abs(step),z);
      player.rotation.y=facing;
      player.rotation.z=step*.92;
    }
    renderer.render(scene,camera);
    if(changing)request();
  }
  function update(point,facing,walking,overhead){
    if(contextLost){fallback.update(point);return;}
    pose={point,facing,walking};
    angleGoal=Number(overhead);
    request();
  }
  function pick(clientX,clientY){
    if(contextLost) return fallback.pick(clientX,clientY);
    const rect=host.getBoundingClientRect();
    if(!rect.width||!rect.height) return null;
    pointer.set((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2);
    ray.setFromCamera(pointer,camera);
    if(!ray.ray.intersectPlane(floor,hit)) return null;
    const x=hit.x+3,z=hit.z+2.5;
    return inside(x,z)?{x,z}:null;
  }
  canvas.addEventListener("webglcontextlost",()=>{
    contextLost=true;
    cancelAnimationFrame(frame);
    canvas.hidden=true;
    fallback=flatBoard(nodes,viewButton);
    if(activeRoom) fallback.room(activeRoom,0,buttonMap);
    if(pose) fallback.update(pose.point);
  },{once:true});
  new ResizeObserver(resize).observe(host);
  return {room:build,update,pick};
}
