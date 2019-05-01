var backGroundMusic = null;
var shipNoise = null;
var explosionNoise = null;

var launchAudio = null;
var returnAudio = null;
var scatterAudio = null;
var convergeAudio = null;

var audios = [];
var commandAudios = [];
var muted = true;
var audioInit = false;

var ships = [];
var frameNum = 0;
var slowDown = false;
var counter = 0.0;
function updateGame(elapsedTime) {
  frameNum++;
  
  for (var i = 0; i < lavaWaves.length; i++) {
    lavaWaves[i].update(elapsedTime);
  }
  var shipVolume = 0.0;
  for (var i = 0; i < ships.length; i++) {
    var dist = vec3.dist(Eye, ships[i].position) / LAVA_DEPTH;
    
    shipVolume += 1.0 / (dist + 0.001) / 2000.0;
  //console.log(shipVolume);
  //console.log(shipVolume);

  

    ships[i].update(elapsedTime, i);
  }
  shipVolume = Math.min(1.0, Math.max(0.0, shipVolume));
  //console.log(shipVolume);
  shipNoise.volume = shipVolume;
  
  updateFire(elapsedTime);
  counter += Math.PI / 1000.0 * elapsedTime;
  var val = 0.1 * Math.sin(counter);
  mothership.translation[1] = MOTHERSHIP_HEIGHT + val;
  for (var i = 0; i < beams.length; i++) {
    beams[i].translation[1] = BEAM_HEIGHT + 1.1 * 0.1 * Math.sin(counter + beams[i].offset); ;
  }
  
  //watchShip(0);
}

function watchShip(shipNum) {
  Center = vec3.clone(ships[shipNum].explosion.translation);
  Eye = vec3.clone(Center);
  Eye[1] += 0.4;
  Eye[2] += 0.3;
}

function setupGame() {
  audios = [];
  modelInstances = [];
  lavaPanels = [];
  lavaWaves = [];
  
  
  explosionNoise = createAudio("explosion.wav", 1.0, false, false);
  explosionNoise.volume = 0.5;
  
  loadFire();
  createShips();

  for (var i = 0; i < NUM_WAVES - 13; i++) {
    lavaWaves.push(new TinyWave());
  }
  for (var i = 0; i < 13; i++) {
    lavaWaves.push(new Wave());
  }
  
  backGroundMusic = createAudio("lava_ambience2.wav", 2.0, true, true);
  shipNoise = createAudio("ship3.ogg", 1.0, true, true);
  commandAudios = [];
  
  launchAudio = createAudio("launch.wav", 1.0, false, false);
  returnAudio = createAudio("return.wav", 1.0, false, false);
  convergeAudio = createAudio("converge.wav", 1.0, false, false);
  scatterAudio = createAudio("scatter.wav", 1.0, false, false);
  
  commandAudios.push(launchAudio, returnAudio, convergeAudio, scatterAudio);
  
  loadLava();
}


function playLaunchAudio() {
  playCommandAudio(launchAudio);
}

function playReturnAudio() {
  playCommandAudio(returnAudio);
}
function playConvergeAudio() {
  playCommandAudio(convergeAudio);
}
function playScatterAudio() {
  playCommandAudio(scatterAudio);
}
function playCommandAudio(audio) {
  if (audioInit) {
    for (var i = 0; i < commandAudios.length; i++) {
      commandAudios[i].pause();
      commandAudios[i].currentTime = 0;
    }
    audio.play();
  }
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
  if (!audioInit) {
    audioInit = true;
  }
  muted = !muted;
  for (var i = 0; i < audios.length; i++) {
    var a = audios[i];
    if (a.shouldAutoPlay && !muted) {
      a.play();
    }
    audios[i].muted = muted;
  }
}

function playExplosionNoise() {
  if (explosionNoise && audioInit) {
    explosionNoise.currentTime = 0.0;
    explosionNoise.play();
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
