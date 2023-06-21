const socket = io();
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const spritesheet = document.getElementById("spritesheet");//new Image();

var going = true;

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);

function keydown(e){
  console.log(e);
  switch (e.key){
    case "W":
    case "w":
    case "ArrowUp":
      keystate.up = true;
      break;
    case "S":
    case "s":
    case "ArrowDown":
      keystate.down = true;
      break;
    case "A":
    case "a":
    case "ArrowLeft":
      keystate.left = true;
      break;
    case "D":
    case "d":
    case "ArrowRight":
      keystate.right = true;
      break;
    case " ":
      keystate.trigger = true;
      break;
  }
}

function keyup(e){
  console.log(e);
  switch (e.key){
    case "W":
    case "w":
    case "ArrowUp":
      keystate.up = false;
      break;
    case "S":
    case "s":
    case "ArrowDown":
      keystate.down = false;
      break;
    case "A":
    case "a":
    case "ArrowLeft":
      keystate.left = false;
      break;
    case "D":
    case "d":
    case "ArrowRight":
      keystate.right = false;
      break;
    case " ":
      keystate.trigger = false;
      break;
  }
}

canvas.width = 300;
canvas.height = 300;

const blocksize = 16;

var gameInterval = null;

var player = {
  x:0,
  y:0,
  hp:100,
  skin:0,//randomize skin (x coord on spritesheet) upon player creation
  facing:208//facing right by default
}

var keystate = {
  up:false,
  down:false,
  left:false,
  right:false,
  trigger:false
}

var tile_map = null;

socket.on('serverMsg', (msg) => {
  console.log(`Server: ${msg}`);
});

socket.on('reload', () => {
  setTimeout(() => {
    location.reload();
  }, 1000);
  
})

socket.on('kickPlayer', () => {
  socket.disconnect();
})

//socket.on("discPlayer", discPlayer());

socket.on('gameupdate', (game_update) => {
  //console.log(game_update);
  game_update = JSON.parse(game_update);
  tile_map = game_update.tile_map;
  player = game_update.player;
  //then any functions of things happening to the player (get hit/attacked, win etc)
});

socket.on('start', () => {
  start();
});

socket.on('damagePlayer', (dmg) => {
  takeDamage(dmg);
});

function takeDamage(dmg){
  console.log(`hit for ${dmg} damage`);
}

//updates last response with Date.now()
function tagServer(){
  socket.emit('tag');
}

function msgServer(msg){
  socket.emit('serverMsg', msg);
}

//emit to the server the player's input states
function emitKeystate(){
  socket.emit('playerKeystate', JSON.stringify(keystate));
}

function login(){
  let name = window.prompt("Enter your name ", "Bob");
  socket.emit("newPlayer", name);
}

function main(){
  //draw tile_map, player, and player_stats
  if (going === true){
    emitKeystate();
    drawPlayerView();
    drawHUD();
  }
}

function start(){
  console.log("Game starting!...");
  setInterval(main, 100);
}

function drawHUD(){
  //hp bar
  ctx.fillStyle = "black";
  ctx.fillRect(0, 279, 102, 12);
  ctx.fillStyle = "red";
  ctx.fillRect(1, 280, 100, 10);
  ctx.fillStyle = "green";
  ctx.fillRect(1, 280, (player.hp*100)/100, 10)
  ctx.fillStyle = "black";
  ctx.fillText(`${player.hp}/100`, 30, 288);
}

function drawPlayerView(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y in tile_map){
    for (let x in tile_map[y]){
      if (tile_map[y][x]===-1){
        ctx.drawImage(
          spritesheet,
          0, 48,
          blocksize, blocksize,
          y*blocksize, x*blocksize,
          blocksize, blocksize
        )
        if (Math.floor(Math.random()*100) > 98){
          ctx.drawImage(
            spritesheet,
            272, 1264,
            blocksize, blocksize,
            y*blocksize, x*blocksize,
            blocksize, blocksize
          )
        }
      }
      for (let obj in tile_map[y][x].objects){
        let curObj = tile_map[y][x].objects[obj];
        ctx.drawImage(
          spritesheet,
          curObj.x, curObj.y,
          blocksize, blocksize,
          y*blocksize, x*blocksize,
          blocksize, blocksize
        );
      }
      for (let p in tile_map[y][x].players){
        let curP = tile_map[y][x].players[p];
        ctx.drawImage(
          spritesheet,
          curP.x, curP.y,
          blocksize, blocksize,
          y*blocksize, x*blocksize,
          blocksize, blocksize
        );
        //draw hp bar over players head
        console.log(curP.hp);
        ctx.fillStyle = "red";
        ctx.fillRect((y*blocksize)-2, x*blocksize, blocksize, 2);
        ctx.fillStyle = "green";
        ctx.fillRect((y*blocksize)-2, x*blocksize, (curP.hp/blocksize)*100, 2);
      }
    }
  }
}
