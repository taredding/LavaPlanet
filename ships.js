var ships = [];
const MAX_VELOCITY = 4.0;
const SHIP_MIN_X = -2.5;
const SHIP_MAX_X = 2.5;
const SHIP_MIN_Y = 0;
const SHIP_MAX_Y = 1;
const SHIP_MIN_Z = -2;
const SHIP_MAX_Z = 0.5;
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
  ships.push(new Ship(0.5, 0.5, 0.2));
  ships.push(new Ship(0.8, 0.5, 0.1));
  ships.push(new Ship(0.3, 0.5, -0.2));
  ships.push(new Ship(0.4, 0.8, 0.1));
  ships.push(new Ship(0.6, 0.8, 0.1));
  ships.push(new Ship(0.1, 0.2, -0.3));
  ships.push(new Ship(0.3, 0.9, -0.4));
  ships.push(new Ship(0.4, 0.8, 0.4));
  ships.push(new Ship(0.6, 0.8, 0.1));
  ships.push(new Ship(0.1, 0.2, -0.7));
  ships.push(new Ship(0.2, 0.3, -0.5));
  ships.push(new Ship(0.8, 0.1, 0.5));
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

  // new velocity
  var tempVelocity = vec3.create();
  //vec3.add(tempVelocity, tempVelocity, testMove);
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
    boundingVelocity[0] = MAX_VELOCITY;
  } else if (ships[index].position[0] > SHIP_MAX_X) {
    boundingVelocity[0] = -MAX_VELOCITY;
  }

  if (ships[index].position[1] < SHIP_MIN_Y) {
    boundingVelocity[1] = MAX_VELOCITY;
  } else if (ships[index].position[1] > SHIP_MAX_Y) {
    boundingVelocity[1] = -MAX_VELOCITY;
  }

  if (ships[index].position[2] < SHIP_MIN_Z) {
    boundingVelocity[2] = MAX_VELOCITY;
  } else if (ships[index].position[2] > SHIP_MAX_Z) {
    boundingVelocity[2] = -MAX_VELOCITY;
  }

  return boundingVelocity;
}

/* Calculate how far ship needs to move away from neighbors */
function calculateSeparation(index) {

  var s = vec3.create();
  var distanceVector = vec3.create();

  for (var i = 0; i < ships.length; i++) {
    if (i != index) {
      //console.log(ships[i].position);
      var distanceMagnitude = vec3.squaredDistance(ships[i].position, ships[index].position);
      //console.log("distanceMagnitude: " + distanceMagnitude);
      distanceVector = vec3.subtract(distanceVector, ships[i].position, ships[index].position);

      if (distanceMagnitude < SEPARATION_THRESHOLD) {
        vec3.subtract(s, s, distanceVector);
      }
    }
  }

  //return s;
  return vec3.scale(s, s, 2);
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
  vec3.scale(tempCOM, tempCOM, 0.8);

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

  vec3.scale(perceivedVelocity, perceivedVelocity, ships.length - 1);

  vec3.scale(perceivedVelocity, perceivedVelocity, 1/4);

  return perceivedVelocity;
}

function Ship(x, y, z) {
  this.speed = -0.05;

  this.velocity = vec3.fromValues(0, 0, 0);
  
  this.model = createModelInstance("ship", x, y, z);
  scaleUniform(this.model, 0.5);
  this.position = this.model.translation;
  this.model.center = vec3.fromValues(0, 0, 0);
  
  this.update = function(time, shipIndex) {
    var elapsedSeconds = time / 1000;
    this.velocity = updateShipVelocity(shipIndex);

    if (vec3.length(this.velocity) > MAX_VELOCITY) {
      vec3.normalize(this.velocity, this.velocity);
      vec3.scale(this.velocity, this.velocity, MAX_VELOCITY);
    }

    vec3.scale(this.velocity, this.velocity, elapsedSeconds);
    vec3.add(this.position, this.position, this.velocity);
    
    //var h = getHeightOfLava(this.position);
    
    
   //this.position[1] = h;
  }
  
}