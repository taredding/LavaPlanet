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
    var dist = vec3.dist(Eye, ships[i].position) / LAVA_DEPTH;
    
    shipVolume += 1.0 / dist / 1000.0;
  //console.log(shipVolume);
  //console.log(shipVolume);
  shipVolume = Math.min(1.0, Math.max(0.0, shipVolume));
  
  //shipNoise.volume = shipVolume;
    ships[i].update(elapsedTime, i);
  }
  updateFire(elapsedTime);

  //watchShip(0);
}

function watchShip(shipNum) {
  Center = vec3.clone(ships[shipNum].position);
  Eye = vec3.clone(Center);
  Eye[1] += 0.4;
  Eye[2] += 0.3;
}

function setupGame() {
  audios = [];
  modelInstances = [];
  lavaPanels = [];
  lavaWaves = [];

  createShips();

  for (var i = 0; i < NUM_WAVES - 13; i++) {
    lavaWaves.push(new TinyWave());
  }
  for (var i = 0; i < 13; i++) {
    lavaWaves.push(new Wave());
  }
  
  backGroundMusic = createAudio("lava_ambience2.wav", 2.0, true, true);
  shipNoise = createAudio("shipNoise.wav", 1.0, false, true);
  
  loadLava();
}

function createAudio(name, speed, play, loop) {
  var a = new Audio('audio/' + name);
  a.volume = 1.0;
  a.muted = muted;
  audios.push(a);
  a.shouldAutoPlay = play;
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
    var a = audios[i];
    if (a.shouldAutoPlay && !muted) {
      a.play();
    }
    audios[i].muted = muted;
  }
}

function main() {
  setupWebGL(); // set up the webGL environment
  //loadModels(); // load in the models from tri file
  loadResources();
  setupShaders(); // setup the webGL shaders
  
  setupGame();
  loadFire();
  renderModels(); // draw the triangles using webGL
} // end main
