var backGroundMusic = null;
var shipNoise = null;
var audios = [];
var muted = true;

var ships = [];
var frameNum = 0;
var slowDown = false;
function updateGame(elapsedTime) {
  frameNum++;
  
  for (var i = 0; i < lavaWaves.length; i++) {
    lavaWaves[i].update(elapsedTime);
  }
  var shipVolume = 0.0;
  for (var i = 0; i < ships.length; i++) {
    ships[i].update(elapsedTime);
    var dist = vec3.dist(Eye, ships[i].position) / LAVA_DEPTH;
    
    shipVolume += 1.0 / dist / 1000.0;
  }
  //console.log(shipVolume);
  //console.log(shipVolume);
  shipVolume = Math.min(1.0, Math.max(0.0, shipVolume));
  
  shipNoise.volume = shipVolume;
  player.update(elapsedTime);
  

  
}

function setupGame() {
  audios = [];
  modelInstances = [];
  lavaPanels = [];
  lavaWaves = [];
  ships = [];
  for (var i = 0; i < NUM_WAVES - 13; i++) {
    lavaWaves.push(new TinyWave());
  }
  for (var i = 0; i < 13; i++) {
    lavaWaves.push(new Wave());
  }

  for (i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      ships.push(new Ship(0.0 + j * 0.2, 0.0, -1 + i * 0.1));
    }
  }
  player = new Ship(0.5, 0.5, 0.0);
  
  backGroundMusic = createAudio("lava_ambience2.wav", 2.0, true, true);
  shipNoise = createAudio("shipNoise.wav", 1.0, false, true);
  //backGroundMusic.playBackSpeed = 2.0;
  loadLava();
}

function createAudio(name, speed, play, loop) {
  var a = new Audio('audio/' + name);
  a.volume = 1.0;
  a.muted = muted;
  audios.push(a);
  if (play) {
    a.play().then(function(){
      console.log("Started audio '" + name + "' successfully.");
    }, function (err){
      console.log("Error playing audio: " + err);
    });
  }
  if (speed != undefined && speed != null) {
    a.playBackSpeed = speed;
  }
  if (loop != undefined && loop != null) {
    a.loop = loop;
  }
  return a;
}

function toggleAudio() {
  muted = !muted;
  for (var i = 0; i < audios.length; i++) {
    audios[i].muted = muted;
  }
}

function main() {
  setupWebGL(); // set up the webGL environment
  //loadModels(); // load in the models from tri file
  loadResources();
  setupShaders(); // setup the webGL shaders
  setupGame();
  renderModels(); // draw the triangles using webGL
} // end main
