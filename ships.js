const NUM_SHIPS = 200;
var ships = [];
const MAX_VELOCITY = 0.03;
const BOUND_VELOCITY = 0.03;
const SHIP_MIN_X = -2.5 + 0.5;
const SHIP_MAX_X = 2.5 - 0.5;
const SHIP_MIN_Y = 0;
const SHIP_MAX_Y = 0.5;
const SHIP_MIN_Z = -2 + 0.5;
const SHIP_MAX_Z = 0.5 - 0.5;
const SEPARATION_THRESHOLD = 0.015;

/*
ok so i need a function that calculates the updated velocity for all ships

farthest lava is -2.5z

separation
cohesion
alignment
*/


/* Spawn ships and push them to array */
function createShips() {
  ships = [];
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
  vec3.scale(tempCOM, tempCOM, 0.05);

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

function Ship(x, y, z) {
  this.speed = -0.05;

  this.velocity = vec3.fromValues(Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4);
  
  this.model = createModelInstance("ship", x, y, z);
  scaleUniform(this.model, 0.5);
  this.position = this.model.translation;
  this.model.center = vec3.fromValues(0, 0, 0);
  
  this.update = function(time, shipIndex) {
    var elapsedSeconds = time / 1000;
    var vAdd = updateShipVelocity(shipIndex);
    vec3.scale(vAdd, vAdd, elapsedSeconds);
    
    vec3.add(this.velocity, this.velocity, vAdd);
    
    if (vec3.length(this.velocity) > MAX_VELOCITY) {
      vec3.normalize(this.velocity, this.velocity);
      vec3.scale(this.velocity, this.velocity, MAX_VELOCITY);
    }
    

    vec3.add(this.position, this.position, this.velocity);
    
    //var h = getHeightOfLava(this.position);
    
    
   //this.position[1] = h;
  }
  
}