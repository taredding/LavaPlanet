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
const MOTHERSHIP_HEIGHT = 2.0;

var colorPairs = [];
var mothership;

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
  console.log(c2);
  
  colors.push(c2);
  colorPairs.push(colors);
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
}

/* Spawn ships and push them to array */
function createShips() {
  ships = [];
  colorPairs = [];
  createColorPairs();
  
  // mothership
  mothership = createModelInstance("mothership", 0.5, MOTHERSHIP_HEIGHT, -2.5);
  rotateX(mothership,-1.0 * Math.PI / 2);
  rotateY(mothership,-1.0 * Math.PI / 2);
  rotateX(mothership,-1.0 * Math.PI / 2);
  rotateX(mothership,2.0 * Math.PI / 2);
  scaleUniform(mothership, 4.0)
  
  
  
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
  separation = calculateSeparation(shipIndex);
  cohesion = calculateCohesion(shipIndex);
  alignment = calculateAlignment(shipIndex);
  var lava = avoidLava(ships[shipIndex]);
  
  // new velocity
  
  var tempVelocity = vec3.create();
  vec3.add(tempVelocity, tempVelocity, lava);
  vec3.add(tempVelocity, tempVelocity, separation);
  vec3.add(tempVelocity, tempVelocity, cohesion);
  vec3.add(tempVelocity, tempVelocity, bound);
  vec3.add(tempVelocity, tempVelocity, alignment);
  
  

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

function avoidLava(ship) {
  var height = getHeightOfLava(ship.position);
  var lavaLoc = vec3.clone(ship.position);
  lavaLoc[1] = height;
  var velocity = vec3.create();
  
  if (ship.position[1] < lavaLoc[1]) {
    console.log("Ship hit lava!");
    vec3.set(ship.position, SHIP_MAX_X, 0.5, SHIP_MAX_Z);
  }
  
  var distance = vec3.distance(ship.position, lavaLoc);
  
  if (distance < 0.2) {
    velocity[1] += 0.5;
  }
  
  ship.model.lavaHeight = height;
  
  return velocity;
}

/* Calculate how far ship needs to move away from neighbors */
function calculateSeparation(index) {

  var s = vec3.create();
  var distanceVector = vec3.create();
  
  
  for (var i = 0; i < ships.length; i++) {
    if (i != index) {
      //console.log(ships[i].position);
      var distanceMagnitude = vec3.distance(ships[i].position, ships[index].position);
      //console.log("distanceMagnitude: " + distanceMagnitude);
      distanceVector = vec3.subtract(distanceVector, ships[i].position, ships[index].position);
      
      if (distanceMagnitude < 0.05) {
        vec3.scale(distanceVector, distanceVector, 1.0);
        vec3.subtract(s, s, distanceVector);
      }
    }
  }
  
  
  //return s;
  vec3.scale(s, s, 3.0);
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
  vec3.scale(tempCOM, tempCOM, 0.01);

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

  vec3.scale(perceivedVelocity, perceivedVelocity, 0.4);

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
  
  
  
  var colors = getRandomColors();
  this.model.colorOffset = colors[0];
  this.model.colorOffset2 = colors[1];
  
  vec3.normalize(this.model.colorOffset, this.model.colorOffset);
  
  this.update = function(time, shipIndex) {
    var elapsedSeconds = time / 1000;
    var vAdd = updateShipVelocity(shipIndex);
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
    
    vec3.add(this.position, this.position, this.velocity);
    rotateShip(this);
    
   //this.position[1] = h;
  }
  
}

