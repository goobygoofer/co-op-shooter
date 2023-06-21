const crypto = require('crypto');
const express = require('express');
const app = express();
app.use(express.static(`${__dirname}/public`))
const http = require('http');
const server = http.createServer(app);
const { Server } = require ("socket.io");
const io = new Server(server);
const PORT = 3000;

var admin = {
  password: "password",
  updateInt: null,
  id:null
}

var tile_map = [];
for (i = 0; i<100; i++){
  let innerList = [];
  for (j = 0; j<100; j++){
    innerList.push({
               //tile object
      objects:[//default grass!
        {
          x:0,
          y:0,
          id:null
        }
      ],
      players:[//drawn differently so separate from objects
      /*
      {
        id:player id here for removing object,
        skinX:0,//skinX/skinY derived from player skin (x) and player facing (y)
        skinY:208
      }
      */
      ],
    })
  }
  tile_map.push(innerList);
}

//generic player data to be copied upon player creation
var player_data = {
  hp:100,
  keystate:{
    up:false,
    down:false,
    left:false,
    right:false,
    trigger:false,
  },
  direction:{x:1,y:0},//default direction right
  facing:208,         //facing right sprite y is 208, left 224 for all skins
  skin:0,             //0 player empty handed, 16 player holding, 32 empty 48  holding etc etc...
  x:0,
  y:0,
  lastMove:null,
  lastShot:null,
  lastResponse:null,
  ready:false         //delay before putting player in game
}

var players = {
  /*
  12345:{
    socket_id:12345,
    name:John,
    data: JSON.parse(JSON.stringify(player_data))
  },
  133769:{
    socket_id:133769
    ...
  }
  */
};

//generic projectile data to be copied
var projectile = {
  player_id:null,     //players id so we know who flung it!
  id:null,            //crypto.randomUUID() on creation
  x:null,
  y:null,
  direction:{x:0,y:0},//-1 or 1 when created
  distance:8,         //decremented to 0 then deleted in updateProjectiles unless collision
  spriteX:208,
  spriteY:240
}

var projectiles = [
  /*
  data:JSON.parse(JSON.stringify(projectile))
  */
];

function updateProjectiles(){
  for (proj in projectiles){
    let p = projectiles[proj];
    p.distance-=1;
    if (p.distance <= 0 || p.x < 0 || p.x > 99 || p.y < 0 || p.y > 99){
      removeProjectile(p);
      continue;
    }
    if (tile_map[p.x][p.y].players.length!==0){
      let tPlayers = tile_map[p.x][p.y].players;
      if (tile_map[p.x][p.y].players[0].id!==p.player_id && tile_map[p.x][p.y].players[0].id!==undefined){
        //first player on tile hit!
        projectileHitPlayer(tile_map[p.x][p.y].players[0].id);
        removeProjectile(p);
        continue;
      }
    }
    //remove from current tile, put on new tile
    removeFromListById(tile_map[p.x][p.y].objects, p.id);
    //add to next tile
    p.x+=p.dir.x;
    p.y+=p.dir.y;
    if (p.distance <= 0 || p.x < 0 || p.x > 99 || p.y < 0 || p.y > 99){
      p.x-=p.dir.x;
      p.y-=p.dir.y;
      removeProjectile(p);
      continue;
    }
    tile_map[p.x][p.y].objects.push(
      {
        id:p.id,
        x:p.spriteX,
        y:p.spriteY
      }
    )
  }
}

function removeProjectile(p){
  removeFromListById(tile_map[p.x][p.y].objects, p.id);
  removeFromListById(projectiles, p.id);
}

function projectileHitPlayer(id){
  //add hitsplat that follows player for a few frames
  console.log(`projectile hit player ${id}`);
  players[id].data.hp -= 10;
  io.to(id).emit("damagePlayer", -10);
}

function makeProjectile(x, y, dir, pid){
  let proj = JSON.parse(JSON.stringify(projectile));
  proj.id = generateId();
  proj.x = x;
  proj.y = y;
  proj.dir = dir;
  proj.player_id = pid;
  proj.spriteX = getArrowSpriteByDir(dir);
  tile_map[x][y].objects.push(
    {
      id:proj.id,
      x:proj.spriteX,
      y:proj.spriteY
    }
  )
  projectiles.push(proj);
}

function getArrowSpriteByDir(dir){
  switch (dir.x){
    case 1:
      return 256;
    case -1:
      return 240;
  }
  switch (dir.y){
    case 1:
      return 224;
    case -1:
      return 208;
  }
}

function generateId(){
  return crypto.randomUUID();
}

function updatePlayers(){
  for (p in players){
    if (checkPlayerDeath(players[p])===true || players[p].data.ready===false || players[p].data.ready===undefined){
      continue;
    };
    playerMove(players[p]);
    playerShoot(players[p]);
    sendUpdate(p);
  }
}

function sendUpdate(id){
  io.to(id).emit('gameupdate', JSON.stringify({
    "tile_map":surroundingTiles(players[id].data.x, players[id].data.y),
    "player":{
      hp: players[id].data.hp,
      x:players[id].data.x,
      y:players[id].data.y,
      skin:players[p].data.skin,
      facing:players[p].data.facing,
    }
  }));
}

function playerShoot(p){
  if (p.data.lastShot + 500 > Date.now()){
    return;
  }
  if (p.data.keystate.trigger === true){
    p.data.lastShot = Date.now();
    console.log(`player ${p.socket_id} shoots!`);
    makeProjectile(p.data.x, p.data.y, p.data.direction, p.socket_id); 
  }
}

function playerMove(p){
  if (p.data.lastMove + 200 > Date.now()){
    return;
  }
  for (key in p.data.keystate){
    if (key === "trigger") {
      continue;
    }
    let keypress = p.data.keystate[key];
    if (keypress === true){
      //console.log(`key ${key} true`);
      switch (key){
        case "up":
          p.data.direction = {x:0,y:-1};
          break;
        case "down":
          p.data.direction = {x:0,y:1};
          break;
        case "left":
          p.data.direction = {x:-1,y:0};
          p.data.facing=224;
          break;
        case "right":
          p.data.direction = {x:1,y:0};
          p.data.facing=208;
          break;
      }
      p.data.lastMove = Date.now();
      let potentialTile = nextTile(p.data.x, p.data.y, key);
      if (checkCollision(potentialTile)===true){
        console.log(`collision or out of bounds`);
        return;
      }
      removeFromListById(tile_map[p.data.x][p.data.y].players, p.socket_id);
      p.data.x = potentialTile.x;
      p.data.y = potentialTile.y;
      addPlayerToTile(p);
    }
  }
}

function nextTile(x, y, dir){
  switch (dir){
    case "up":
      y+=-1
      break;
    case "down":
      y+=1;
      break;
    case "left":
      x+=-1;
      break;
    case "right":
      x+=1;
      break;
  }
  return {x:x, y:y};
}

function checkCollision(coords){
  if (coords.x < 0 || coords.x > 99 || coords.y < 0 || coords.y > 99){
    return true;
  }
  //check if any tile objects has collision

  //if fxn hasn't returned by here, no collision
  return false;
}

function surroundingTiles(x, y){
  //x -/+ 10, y -/+ 10
  let map_section = [];
  x=x+1;
  y=y+1;
  for (let i = x-10; i < x+9; i++){
    let innerList = [];
    for (let j = y-10; j < y+9; j++){
       
      if (i < 0 || i > 99 || j < 0 || j > 99){
        innerList.push(-1);//out of bounds tile
      } else {
        innerList.push(
          tile_map[i][j]
        );
      }
    }
    map_section.push(innerList)
  }
  return map_section;
}

function checkPlayerDeath(p){
  if (p.data.hp <= 0){
    console.log("player died!");
    io.to(p.socket_id).emit("reload");
    discPlayerCleanup(players[p.socket_id]);
    //do stuff because dead
    return true;
  } else {
    return false;
  }
}

function removePlayer(id){
  delete players[id];
}

function removeFromListById(list, id){
  for (let item in list){
    if (list[item].id===id){
      list.splice(item, 1);
      return true;
    }
  }
  return false;
}

function createNewPlayer(name, id){
  let temp_player_data = { 
    "socket_id":id,
    "name":name,
    "data":JSON.parse(JSON.stringify(player_data))
  }
  temp_player_data.data.lastMove = Date.now();
  temp_player_data.data.lastShot = Date.now();
  temp_player_data.data.lastResponse = Date.now();
  players[id]=temp_player_data;
  //then randomize x,y or something, spawn points etc
  setTimeout(() => {
    
    addPlayerToTile(players[id]);
    readyPlayer(players[id]);
  }, 2000);
}

function addPlayerToTile(p){
  tile_map[p.data.x][p.data.y].players.push(
    {
      x:p.data.skin,
      y:p.data.facing,
      id:p.socket_id,
      hp:p.data.hp
    }
  )
}

function readyPlayer(p){
  io.to(p.socket_id).emit("start");
  p.data.ready = true;
  let pSkinX = p.data.skin;
  let pSkinY;
  p.facing=208;
  tile_map[p.data.x][p.data.y].players.push(
    //id and skin/sprite
    {
      id:p.data.id,
      skinX:pSkinX,
      skinY:pSkinY
    }
  )
  console.log("New player ready!");
  logPlayers();
}

function discPlayerCleanup(p){
  if (p===undefined){
    return;
  }
  console.log("Player disconnected...");
  logPlayers();
  removeFromListById(tile_map[p.data.x][p.data.y].players, p.socket_id);
  removePlayer(p.socket_id);
}

function playerExists(id){
  if (players[id]===undefined){
    return false;
  }
  return true;
}

function logPlayers(){
  let pString = 'players:\n';
  for (p in players){
    pString+=`${players[p].name}: ${p}, `;
  }
  console.log(pString);
}

function updateAdmin(){
  let adminData = {
    //should probably be generated depending on admin settings
    players:players,
    map:tile_map
  };
  io.to(admin.id).emit("serverUpdate", JSON.stringify(adminData));
}

function adminLogin(pword, id){
  if (pword === admin.password){
    console.log("admin logged in!");
    admin.id = id;
    admin.updateInt = setInterval(updateAdmin, 100);
    io.to(id).emit("start");
  }
}

function checkDummies(){
  for (x in tile_map){
    for (y in tile_map[x]){
      for (p in tile_map[x][y].players){
        let pCheck = tile_map[x][y].players[p];
        if (pCheck.id===undefined){
          tile_map[x][y].players.splice(p,1);
        }
      }
    }
  }
}

function main(){
  updatePlayers();
  updateProjectiles();
  checkDummies();
}

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/public/client.html`);
});

app.get('/admin', (req, res) => {
  res.sendFile(`${__dirname}/public/admin.html`);
});


io.on('connection', (socket) => {

  console.log("Someone connecting...");

  socket.on('newPlayer', (name) => {
    createNewPlayer(name, socket.id);
  })

  socket.on('disconnect', () => {
      discPlayerCleanup(players[socket.id]);
  })

  socket.on('adminPword', (pword) => {
    adminLogin(pword, socket.id);
  })

  socket.on('serverMsg', (msg) => {
    console.log(`${socket.id}: ${msg}`);
    io.to(socket.id).emit('serverMsg', "Message received...");
  });

  socket.on('playerKeystate', (keystate) => {
    try{
      players[socket.id].data.keystate = JSON.parse(keystate);
    } catch (err) {
      //player probably dead, happens when player disconnects/dies
      //console.log(`Key from old player error: ${err}`);
      io.to(socket.id).emit("kickPlayer");
      removePlayer(socket.id);
    }
  });

  socket.on('tag', () => {
    players[socket.id].lastResponse = Date.now();
  });

});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

setInterval(main, 100);