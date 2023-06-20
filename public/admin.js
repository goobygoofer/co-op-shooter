const socket = io();
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const spritesheet = document.getElementById("spritesheet");

const blocksize = 16;

canvas.width = 300;
canvas.height = 300;

var tile_map = null;

var serverData = {
  players:null,
  spy_tile_map:null//tile_map of player being viewed
}

var serverMsgs = [
  //list of msgs from server, like player disconnects, console.logs etc
];

socket.on('logMsg', (msg) => {
  serverMsgs.push(msg);
})

socket.on('serverUpdate', (data) => {//only gets this if pword correct
  serverData = JSON.parse(data);
  tile_map = serverData.map;
  players = serverData.players;
});

socket.on('boot', () => {//boot if pword not correct
  console.log("NOPE");
  socket.disconnect();
});

socket.on('start', () => {
  start();
})

function login(){
  let pword = window.prompt("Password: ", "");
  socket.emit("adminPword", pword);
}

function main(){
  //draw tile_map
  drawMap();
  //list of players
}

function start(){
  setInterval(main,100);
}

function drawMap(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y in tile_map){
    for (let x in tile_map[y]){
      for (let obj in tile_map[y][x].objects){
        let curObj = tile_map[y][x].objects[obj];
        ctx.drawImage(
          spritesheet,
          curObj.x, curObj.y,
          blocksize, blocksize,
          y*blocksize/4, x*blocksize/4,
          blocksize/4, blocksize/4
        );
      }
      for (let p in tile_map[y][x].players){
        let curP = tile_map[y][x].players[p];
        ctx.drawImage(
          spritesheet,
          curP.x, curP.y,
          blocksize, blocksize,
          y*blocksize/4, x*blocksize/4,
          blocksize/4, blocksize/4
        );
      }
    }
  }
}