const NUM_SHIPS = 200;
var ships = [];
const MAX_VELOCITY = 0.03;
const BOUND_VELOCITY = 0.03;
const SHIP_MIN_X = -2.5 + 0.5;
const SHIP_MAX_X = 2.5 - 0.5;
const SHIP_MIN_Y = 0;
const SHIP_MAX_Y = 1.5;
const SHIP_MIN_Z = -2 + 0.5;
const SHIP_MAX_Z = 0.5 - 0.5;
const SEPARATION_THRESHOLD = 0.015;
const MOTHERSHIP_HEIGHT = 1.5;
const BEAM_HEIGHT = MOTHERSHIP_HEIGHT - 0.42;
const DEF_EXP_TIME = 1.0;

var colorPairs = [];
var beams = [];
var beamTexture;
var beamNoiseTexture;
var beamOutputTexture;
var explosionTexture;
var explosionC1 = vec3.fromValues(0.5, 1.0, 0.5);
var explosionC2 = vec3.fromValues(0.9, 1.0, 0.9);

var mothership;

var defaultScale = vec3.fromValues(1, 1, 1);
vec3.normalize(defaultScale, defaultScale);
vec3.scale(defaultScale, defaultScale, 0.05);


var goalPoint = vec3.fromValues(0.5, 1.2, -1.3);
var goalPoint2 = vec3.fromValues(0.5, 1.6, -1.3);

const STATE_WAIT = 0;
const STATE_LEAVE_SHIP = 1;
const STATE_GOTO_MOTHER1 = 2;
const STATE_GOTO_MOTHER2 = 3;
const STATE_FLOCK = 4;
const STATE_PERMAWAIT = 5;


var cohesionCoefficient = 0.04;
var seperationCoefficient = 3.0;
var alignmentCoefficient = 0.4;

function converge() {
  playConvergeAudio();
  cohesionCoefficient = 0.04;
  seperationCoefficient = 3.0;
  alignmentCoefficient = 0.4;
} 

function scatter() {
  playScatterAudio();
  cohesionCoefficient = 0.00;
  seperationCoefficient = 5.0;
  alignmentCoefficient = 0.0;
}


/*
ok so i need a function that calculates the updated velocity for all ships

farthest lava is -2.5z

separation
cohesion
alignment
*/

function convertColor(color) {
  return color / 256.0;
}

function createColor(r, g, b) {
  return vec3.fromValues(convertColor(r), convertColor(g), convertColor(b));
}

function createColorPair(r, g, b, r2, g2, b2) {
  var colors = [];
  colors.push(createColor(r, g, b));
  var c2 = createColor(r2, g2, b2);
  vec3.scale(c2, c2, 0.4);
  //console.log(c2);
  
  colors.push(c2);
  colorPairs.push(colors);
  return colors;
}

function createColorPairs() {
  createColorPair(236, 155, 4, 197, 68, 5);
  createColorPair(163, 73, 164, 47, 56, 174);
  createColorPair(103, 251, 40, 24, 146, 31);
  createColorPair(200, 191, 231, 41, 55, 103);
  createColorPair(163, 73, 164, 103, 251, 40);
  createColorPair(22, 156, 150, 69, 228, 221);
  createColorPair(148, 12, 18, 256, 256, 256);
  createColorPair(97, 83, 20, 97, 83, 20);
  createColorPair(255, 201, 14, 173, 14, 22);
  createColorPair(255, 174, 201, 142, 147, 125);
  createColorPair(175, 31, 27, 112, 146, 190);
  //createColorPair(256, 0, 0, 0, 256, 0);
}

/* Spawn ships and push them to array */
function createShips() {
  ships = [];
  colorPairs = [];
  beams = [];
  
  
  var mColors = createColorPair(69, 20, 20, 20, 69, 20);
  // mothership
  mothership = createModelInstance("mothership", 0.5, MOTHERSHIP_HEIGHT, -2.5);
  rotateX(mothership,-1.0 * Math.PI / 2);
  rotateY(mothership,-1.0 * Math.PI / 2);
  rotateX(mothership,-1.0 * Math.PI / 2);
  rotateX(mothership,2.0 * Math.PI / 2);
  scaleUniform(mothership, 4.0);
  mothership.colorOffset = mColors[0];
  mothership.colorOffset2 = mColors[1];
  
  explosionTexture = addNullTexture(256);
  
  var beam1 = createModelInstance("beam", 0.5, MOTHERSHIP_HEIGHT, -1.5);
  beam1.offset = 0.3;
  var beam2 = createModelInstance("beam", 0.5, MOTHERSHIP_HEIGHT, -1.5);
  beam2.offset = 0.1;
  var beam3 = createModelInstance("beam", 0.5, MOTHERSHIP_HEIGHT, -1.5);
  beam3.offset = 0.1;
  var beam4 = createModelInstance("beam", 0.5, MOTHERSHIP_HEIGHT, -1.5);
  beam4.offset = 0.3;
  beams.push(beam1);
  beams.push(beam2);
  beams.push(beam3);
  beams.push(beam4);
  vec3.set(beam1.translation, mothership.translation[0] - 0.4, BEAM_HEIGHT, mothership.translation[2] + 0.6);
  vec3.set(beam2.translation, mothership.translation[0] + 0.415, BEAM_HEIGHT,  mothership.translation[2] + 0.6);
  vec3.set(beam3.translation, mothership.translation[0] - 0.4, BEAM_HEIGHT, mothership.translation[2] - 0.6);
  vec3.set(beam4.translation, mothership.translation[0] + 0.415, BEAM_HEIGHT, mothership.translation[2] -0.6);
  beamTexture = addTexture(BASE_URL + "textures/" + "webby.png");
  beamNoiseTexture = addTexture(BASE_URL + "textures/" + "black.png");
  beamOutputTexture = addNullTexture(256);
  for (var i = 0; i < beams.length; i++) {
    beams[i].specialTexture = beamOutputTexture;
    beams[i].ignoreLighting = true;
    rotateY(beams[i], Math.PI);
    scaleUniform(beams[i], 3.7);
  }
  
  
  colorPairs = [];
  createColorPairs();
  
  var xScale = SHIP_MAX_X - SHIP_MIN_X;
  var yScale = SHIP_MAX_Y - SHIP_MIN_Y;
  var zScale = SHIP_MAX_Z - SHIP_MIN_Z;
  for (var i = 0; i < NUM_SHIPS; i++) {
    
    ships.push(new Ship(Math.random() * xScale + SHIP_MIN_X, Math.random() * yScale + SHIP_MIN_Y, Math.random() * zScale + SHIP_MIN_Z));
  }
} 

/* Calculate the result of all behaviors */
function updateShipVelocity(shipIndex) {

  //console.log("updating ship " + shipIndex);
  var bound = vec3.create();
  var separation = vec3.create();
  var cohesion = vec3.create();
  var alignment = vec3.create();

  // for every ship
  // get each velocity change
  bound = boundPosition(shipIndex);
  separation = calculateSeparation(ships[shipIndex]);
  cohesion = calculateCohesion(shipIndex);
  alignment = calculateAlignment(shipIndex);
  var lavaResults = avoidLava(ships[shipIndex]);
  var lava = lavaResults.velocity;
  var mothership = avoidMothership(ships[shipIndex]);
  
  // new velocity
  
  var tempVelocity = vec3.create();
  if (!lavaResults.hitLava) {
    vec3.add(tempVelocity, tempVelocity, lava);
    vec3.add(tempVelocity, tempVelocity, separation);
    vec3.add(tempVelocity, tempVelocity, cohesion);
    vec3.add(tempVelocity, tempVelocity, bound);
    vec3.add(tempVelocity, tempVelocity, alignment);
    vec3.add(tempVelocity, tempVelocity, mothership);
  }
  

  //console.log("new ship velocity: " + tempVelocity);
  return tempVelocity;

}

/* Keep ships from leaving area */
function boundPosition(index) {
  var boundingVelocity = vec3.create();

  if (ships[index].position[0] < SHIP_MIN_X) {
    boundingVelocity[0] = BOUND_VELOCITY;
  } else if (ships[index].position[0] > SHIP_MAX_X) {
    boundingVelocity[0] = -BOUND_VELOCITY;
  }

  if (ships[index].position[1] < SHIP_MIN_Y) {
    boundingVelocity[1] = BOUND_VELOCITY;
  } else if (ships[index].position[1] > SHIP_MAX_Y) {
    boundingVelocity[1] = -BOUND_VELOCITY / 2.0;
  }

  if (ships[index].position[2] < SHIP_MIN_Z) {
    boundingVelocity[2] = BOUND_VELOCITY;
  } else if (ships[index].position[2] > SHIP_MAX_Z) {
    boundingVelocity[2] = -BOUND_VELOCITY;
  }

  return boundingVelocity;
}

function avoidMothership(ship) {
  const radius = 0.2;
  var avoidVel = vec3.fromValues(0.0, 0.0, 0.0);
  
  var dist = vec3.distance(ship.position, mothership.translation);
  
  if (dist <= 0.9) {
    var xDif = ship.position[0] - mothership.translation[0];
    var yDif = ship.position[0] - mothership.translation[0];
    var zDif = ship.position[0] - mothership.translation[0];
    
    if (xDif > 0 && xDif <= 0.75 + radius) {
      avoidVel[0] += 1.0;
    }
    else if (xDif < 0 && Math.abs(xDif) <= 0.9 + radius) {
      avoidVel[0] -= 1.0;
    }
    if (yDif > 0 && yDif <= 0.4 + radius) {
      avoidVel[1] += 1.0;
    }
    else if (yDif < 0 && Math.abs(yDif) <= 1.0 + radius) {
      avoidVel[1] -= 0.1;
    }
    if (zDif > 0 && zDif <= 0.4 + radius) {
      avoidVel[2] += 1.0;
    }
    else if (zDif < 0 && Math.abs(zDif) <= 0.4 + radius) {
      avoidVel[2] -= 1.0;
    }
    
  }
  
  vec3.normalize(avoidVel, avoidVel);
  vec3.scale(avoidVel, avoidVel, 0.4);
  return avoidVel;
}

function avoidLava(ship) {
  var height = getHeightOfLava(ship.position);
  var lavaLoc = vec3.clone(ship.position);
  lavaLoc[1] = height;
  var velocity = vec3.create();
  var hitLava = false;
  if (ship.position[1] < lavaLoc[1] && ship.position[2] >= LAVA_MIN_Z) {
    hitLava = true;
    console.log("Ship hit lava!");
    ship.showExplosion();
    ship.state = STATE_WAIT;
    vec3.set(ship.position, mothership.translation[0], mothership.translation[1], mothership.translation[2]);
    vec3.set(ship.velocity, 0, 0, MAX_VELOCITY);
    
  }
  
  var distance = vec3.distance(ship.position, lavaLoc);
  
  if (distance < 0.5) {
    velocity[1] += 0.08;
  }
  
  ship.model.lavaHeight = height;
  
  return {velocity:velocity, hitLava: hitLava};
}

/* Calculate how far ship needs to move away from neighbors */
function calculateSeparation(ship) {

  var s = vec3.create();
  var distanceVector = vec3.create();
  
  for (var i = 0; i < ships.length; i++) {
    if (ships[i] != ship) {
      //console.log(ships[i].position);
      var distanceMagnitude = vec3.distance(ships[i].position, ship.position);
      //console.log("distanceMagnitude: " + distanceMagnitude);
      distanceVector = vec3.subtract(distanceVector, ships[i].position, ship.position);
      
      if (distanceMagnitude < 0.1) {
        vec3.scale(distanceVector, distanceVector, 1.0);
        vec3.subtract(s, s, distanceVector);
      }
    }
  }
  
  
  //return s;
  vec3.scale(s, s, seperationCoefficient);
  return s;
}


/* Calculate how close ship needs to move to center of mass*/
function calculateCohesion(index) {
  var centerOfMass = vec3.create();
  var numShips = ships.length;

  for (var i = 0; i < numShips; i++) {
    if (i != index) {
      vec3.add(centerOfMass, centerOfMass, ships[i].position);
    }
  }

  vec3.scale(centerOfMass, centerOfMass, 1 / (numShips - 1));

  var tempCOM = vec3.create();
  vec3.subtract(tempCOM, centerOfMass, ships[index].position);
  vec3.scale(tempCOM, tempCOM, cohesionCoefficient);

  return tempCOM;
}

/* Calculate how ship needs to move to align with neighbors */
function calculateAlignment(index) {
  var perceivedVelocity = vec3.create();

  for (var i = 0; i < ships.length; i++) {
    if (i != index) {
      vec3.add(perceivedVelocity, perceivedVelocity, ships[i].velocity);
    }
  }

  vec3.scale(perceivedVelocity, perceivedVelocity, 1.0/(ships.length - 1));

  vec3.scale(perceivedVelocity, perceivedVelocity, alignmentCoefficient);

  return perceivedVelocity;
}
function rotateShip(ship) {
  var model = ship.model;
  vec3.set(model.yAxis, 0, 1, 0);
  vec3.set(model.xAxis, 1, 0, 0);
  
  var dir = vec3.create();
  var dir2 = vec3.create();
  vec3.normalize(dir, ship.velocity);
  dir2 = vec3.clone(dir);
  
  dir[1] = 0.0;
  dir2[0] = 0.0;
  var xDir = vec3.angle(dir, vec3.fromValues(1, 0, 0));
  if (dir[2] < 0) {
    xDir = 2.0 * Math.PI - xDir;
  }
  xDir += Math.PI / 2.0;
  
  
  var yDir = -1.0 * vec3.angle(dir2, Up) + Math.PI / 2.0;
  if (dir[2] < 0) {
    yDir *= -1.0;
  }
  //console.log(yDir * 57.2958);
  //console.log(dir[2]);
  rotateModelInstance(model, 0, xDir);
  rotateModelInstance(model, yDir, 0);
}
function rotateModelInstance(model, xRot, yRot) {
  
  var newRotation = mat4.create();
  mat4.fromRotation(newRotation,xRot,model.xAxis); // get a rotation matrix around passed axis
  vec3.transformMat4(model.xAxis,model.xAxis,newRotation); // rotate model x axis tip
  vec3.transformMat4(model.yAxis,model.yAxis,newRotation); // rotate model y axis tip
  
  newRotation = mat4.create();
  mat4.fromRotation(newRotation,yRot,model.yAxis); // get a rotation matrix around passed axis
  vec3.transformMat4(model.xAxis,model.xAxis,newRotation); // rotate model x axis tip
  vec3.transformMat4(model.yAxis,model.yAxis,newRotation); // rotate model y axis tip
  
}

function getRandomColors() {
  
  return colorPairs[Math.floor(Math.random() * colorPairs.length)];
  
  
}

var dir = 1.0;
function Ship(x, y, z) {
  this.speed = -0.05;

  this.velocity = vec3.fromValues(Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4);
  
  this.model = createModelInstance("ship", x, y, z);
  this.model.velocity = this.velocity;
  scaleUniform(this.model, 1.0);
  this.position = this.model.translation;
  this.model.center = vec3.fromValues(0, 0, 0);
  this.thruster = createModelInstance("thruster", x, y, z);
  this.thruster.ignoreLighting = true;
  this.thruster.translation = this.model.translation;
  this.explosion = createModelInstance("sphere", x, y, z);
  this.explosion.specialTexture = explosionTexture;
  this.explosion.invisible = true;
  this.explosion.ignoreLighting = true;
  this.explosionTime = DEF_EXP_TIME;
  var colors = getRandomColors();
  this.model.colorOffset = colors[0];
  this.model.colorOffset2 = colors[1];
  //this.explosionNoise = explosionNoise.cloneNode(true);
  //audios.push(this.explosionNoise);
  
  vec3.normalize(this.model.colorOffset, this.model.colorOffset);
  this.state = STATE_FLOCK;
  this.waitTime = Math.random() * 4.0 + 0.2;
  this.update = function(time, shipIndex) {
    var elapsedSeconds = time / 1000;
    
    
    
    var vAdd = vec3.fromValues(0, 0, 0);

    switch (this.state) {
      case STATE_WAIT:
        this.waitTime -= elapsedSeconds;
        
        if (this.waitTime <= 0) {
          this.waitTime = Math.random() * 4.0 + 0.2;
          this.state = STATE_LEAVE_SHIP;
        }
      break;
      case STATE_LEAVE_SHIP:
        vAdd = vec3.fromValues(0.0, 0.0, 0.0);
        if (vec3.distance(this.position, goalPoint) < 0.3) {
          vAdd[0] += Math.random() * 0.2 - 0.1;
          vAdd[1] += Math.random() * 0.2 - 0.1;
          this.state = STATE_FLOCK;
        }
        else {
          vec3.subtract(vAdd, goalPoint, this.position);
          vec3.add(vAdd, vAdd, calculateSeparation(this));
        }
        break;
      case STATE_GOTO_MOTHER1:
        var dist = vec3.distance(this.position, goalPoint);
        if (dist < 0.4) {
          this.state = STATE_GOTO_MOTHER2;
        }
        else {
          vec3.subtract(vAdd, goalPoint2, this.position);

          var sep = calculateSeparation(this);
          vec3.scale(sep, sep, Math.min(1.0, dist / 2.0));
          vec3.add(vAdd, vAdd, sep);
          vec3.add(vAdd, vAdd, avoidMothership(this));
        }
      break;
      case STATE_GOTO_MOTHER2:
        var dist = vec3.distance(this.position, mothership.translation);
        if (dist < 0.3) {
          vec3.set(this.position, mothership.translation[0], mothership.translation[1] + 0.2, mothership.translation[2]);
          vec3.set(this.velocity, 0, 0, 0);
          this.state = STATE_PERMAWAIT;
        }
        else {
          vec3.subtract(vAdd, mothership.translation, this.position);
          var sep = calculateSeparation(this);
          vec3.scale(sep, sep, Math.min(1.0, dist / 2.0));
          vec3.add(vAdd, vAdd, sep);
        }
      break;
      case STATE_FLOCK:
        vAdd = updateShipVelocity(shipIndex);
      break;
      case STATE_PERMAWAIT:
        vec3.set(this.position, mothership.translation[0], mothership.translation[1] + 0.2, mothership.translation[2]);
        vAdd = vec3.fromValues(0.0, 0.0, 0.0);
      break;
    

    }
    vec3.scale(vAdd, vAdd, elapsedSeconds);
    
    vec3.add(this.velocity, this.velocity, vAdd);
    
    if (vec3.length(this.velocity) > MAX_VELOCITY) {
      vec3.normalize(this.velocity, this.velocity);
      vec3.scale(this.velocity, this.velocity, MAX_VELOCITY);
    }
    
    //this.position = vec3.set(this.position, 0.2, this.position[1], -0.5);
    if (this.position[1] < 0.0) {
      dir = 1;
    }
    else if (this.position[1] > 1.5) {
      dir = -1;
    }
    //this.position[1] += dir * 0.01;
    if (this.state != STATE_WAIT && this.state != STATE_PERMAWAIT) {
      vec3.add(this.position, this.position, this.velocity);
    }
    rotateShip(this);
    this.thruster.yAxis = this.model.yAxis;
    this.thruster.xAxis = this.model.xAxis;
    var val = 0.005 * ( 1.0 + Math.sin(counter * 16.0)) + 0.02;
    //vec3.set(this.thruster.scaling, val, val, 0.022);
    //console.log(time);
    if (!this.explosion.invisible) {
      this.explosionTime -= time / 1000;
      scaleUniform(this.explosion, 1.02);
      if (this.explosionTime <= 0.0) {
        this.hideExplosion();
      }
    }
    
   //this.position[1] = h;
  }
  
  this.hideExplosion = function() {
    this.explosion.invisible = true;
  }
  this.showExplosion = function() {
    playExplosionNoise();
    //this.explosionNoise.volume = Math.max(1.0 - vec3.distance(this.position, Eye), 0.05);
    //this.explosionNoise.currentTime = 0.0;
    //if (!muted) {
      //this.explosionNoise.play();
    //}
    this.explosionTime = DEF_EXP_TIME;
    this.explosion.invisible = false;
    this.explosion.scaling = vec3.clone(defaultScale);
    this.explosion.translation = vec3.clone(this.model.translation);
  }
  
}

function returnToMothership() {
  playReturnAudio();
  for (var i = 0; i < ships.length; i++) {
    var ship = ships[i];
    
    var dist = vec3.distance(ship.position, mothership.translation);
    if (ship.state!= STATE_PERMAWAIT && ship.state != STATE_WAIT) {
    if (ship.state == STATE_GOTO_MOTHER2) {
      ship.state = STATE_GOTO_MOTHER2;
    }
    else {
      ship.state = STATE_GOTO_MOTHER1;
    }
    }
  }
}

function leaveMothership() {
  playLaunchAudio();
  for (var i = 0; i < ships.length; i++) {
    var ship = ships[i];
    if (ship.state == STATE_PERMAWAIT || ship.state == STATE_WAIT) {
      ship.waitTime = Math.random() * 4.0 + 0.2;
      ship.state = STATE_WAIT;
    }
    else if (ship.state != STATE_LEAVE_SHIP) {
     ship.state = STATE_FLOCK; 
    }
    
  }
}
