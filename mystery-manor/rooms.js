export const rooms = [
  {
    name:"The Grand Foyer", short:"Grand Foyer", number:"I",
    note:"The clock stopped when the trophy vanished. Start with the objects by the front door.",
    clues:[[1,1.57,.33],[2,1.4,3.24],[3,4.97,2.86]],
    decor:[["clock",1.57,.25],["plant",1.0,1.03],["settee",5.02,3.88],["rug",1.42,3.22],["stair",5.58,-.06],["bust",4.12,1.82],["evelyn",4.97,2.86]]
  },
  {
    name:"The Study & Library", short:"Study & Library", number:"II",
    note:"Search the rug, desk, and shelves. Look for details that could tie someone to the display case.",
    clues:[[4,1.05,.55],[5,3.82,2.77],[6,5.02,3.02],[7,4.5,.16]],
    decor:[["fireplace",.12,-.38],["rug",1.05,.55],["books",4.05,-.44],["books",5.42,-.44],["desk",3.82,2.77],["box",5.02,3.02],["plant",1.1,4.10]]
  },
  {
    name:"The Dining Hall", short:"Dining Hall", number:"III",
    note:"The candles and teacups may tell you who was still awake. Chef Pierre is here to question.",
    clues:[[8,3,3.10],[9,.48,.13],[10,4.19,1.48],[11,5.5,3.97]],
    decor:[["window",.48,-.43],["banquet",3,3.10],["cabinet",4.19,1.48],["plant",1.16,4.07],["bust",5.30,.22],["pierre",5.5,3.97]]
  },
  {
    name:"The Moonlit Conservatory", short:"Conservatory", number:"IV",
    note:"Follow the trail to the empty trophy case and question Professor Finch.",
    clues:[[12,.46,1.14],[13,2.63,2.54],[14,2.48,.22],[15,5.9,3.25]],
    decor:[["plant",.46,1.14],["plant",1.06,3.98],["fountain",2.63,2.54],["case",2.48,.22],["plant",5.14,4.10],["cabinet",5.5,-.12],["finch",5.9,3.25]]
  }
];

const footprints = {
  clock:[.36,.27], plant:[.34,.34], settee:[1.10,.55], stair:[1.30,.70], bust:[.37,.37],
  fireplace:[.76,.36], books:[.81,.34], desk:[.89,.52], box:[.48,.40],
  banquet:[1.34,.60], cabinet:[.71,.44], fountain:[.69,.69], case:[.49,.43],
  evelyn:[.34,.34], pierre:[.34,.34], finch:[.34,.34]
};
for(const room of rooms){
  room.start={x:0,z:5};
  room.clueIds=room.clues.map(([id])=>id);
  room.markers=room.clues.map(([id,x,z])=>({key:String(id),clueId:id,x,z}));
  room.markers.push({key:"exit",x:6.30,z:.05,exit:true});
  room.obstacles=room.decor.flatMap(([kind,x,z])=>{
    const size=footprints[kind];
    return size?[{x,z,halfX:size[0]/2,halfZ:size[1]/2}]:[];
  });
}
