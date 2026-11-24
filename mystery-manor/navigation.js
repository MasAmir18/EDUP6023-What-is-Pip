const radius=.17;
export const bounds={minX:-.36,maxX:6.36,minZ:-.36,maxZ:5.36};
export const reach=.96;
export function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}

export function walkable(room,x,z){
  if(x<bounds.minX || x>bounds.maxX || z<bounds.minZ || z>bounds.maxZ) return false;
  return !room.obstacles.some(obstacle=>{
    const dx=Math.max(0,Math.abs(x-obstacle.x)-obstacle.halfX);
    const dz=Math.max(0,Math.abs(z-obstacle.z)-obstacle.halfZ);
    return dx*dx+dz*dz<radius*radius;
  });
}

export function advance(room,start,dx,dz){
  const x=walkable(room,start.x+dx,start.z)?start.x+dx:start.x;
  const z=walkable(room,x,start.z+dz)?start.z+dz:start.z;
  return {x,z};
}

function clearPath(room,a,b){
  const count=Math.ceil(distance(a,b)/.075);
  for(let i=1;i<=count;i++){
    const t=i/count;
    if(!walkable(room,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)) return false;
  }
  return true;
}

// Tap destinations are routed around furniture. Keyboard movement stays continuous.
export function route(room,start,end,tolerance=0){
  if(distance(start,end)<=tolerance) return [];
  if(clearPath(room,start,end)) return [end];
  const stride=.18;
  const columns=1+Math.floor((bounds.maxX-bounds.minX)/stride);
  const rows=1+Math.floor((bounds.maxZ-bounds.minZ)/stride);
  const point=i=>({x:bounds.minX+(i%columns)*stride,z:bounds.minZ+Math.floor(i/columns)*stride});
  const queue=[];
  const previous=new Map();
  let nearest, best=Infinity;
  for(let i=0;i<columns*rows;i++){
    const pos=point(i);
    const d=distance(start,pos);
    if(d<best&&clearPath(room,start,pos)){nearest=i;best=d;}
  }
  if(nearest===undefined) return [];
  queue.push(nearest);previous.set(nearest,null);
  let closest=nearest;
  let gap=distance(point(nearest),end);
  for(let head=0;head<queue.length;head++){
    const index=queue[head], pos=point(index);
    const d=distance(pos,end);
    if(d<gap){closest=index;gap=d;}
    if(d<=tolerance) break;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const col=index%columns+dx,row=Math.floor(index/columns)+dz;
      if(col<0||col>=columns||row<0||row>=rows) continue;
      const neighbor=row*columns+col;
      if(previous.has(neighbor) || !clearPath(room,pos,point(neighbor))) continue;
      previous.set(neighbor,index);queue.push(neighbor);
    }
  }
  const points=[];
  for(let at=closest;at!==null;at=previous.get(at)) points.push(point(at));
  points.reverse();
  if(!tolerance&&clearPath(room,points.at(-1),end)) points.push(end);
  const short=[];
  for(let i=0;i<points.length;){
    let far=points.length-1;
    while(far>i&&!clearPath(room,short.at(-1)||start,points[far]))far--;
    short.push(points[far]);i=far+1;
  }
  return short;
}
