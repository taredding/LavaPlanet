/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
var INPUT_TRIANGLES_URL = "https://taredding.github.io/tempLava/models.json"; // triangles file loc
var BASE_URL = "https://taredding.github.io/tempLava/";

var INPUT_TRIANGLES_URL = "http://127.0.0.1/CGA_Proj_3/models.json"; // triangles file loc
var BASE_URL = "http://127.0.0.1/CGA_Proj_3/";


var defaultEye = vec3.fromValues(0.5,0.5,0.5); // default eye position in world space


//INPUT_TRIANGLES_URL = "https://taredding.github.io/Snake3D/models.json"; // triangles file loc
//BASE_URL = "https://taredding.github.io/Snake3D/";


var defaultCenter = vec3.fromValues(0.5,0.5,-0.5); // default view direction in world space
var defaultUp = vec3.fromValues(0,1,0); // default view up vector
var lightAmbient = vec3.fromValues(0.75,0.75,0.75); // default light ambient emission
var lightDiffuse = vec3.fromValues(0.5,0.5,0.5); // default light diffuse emission
var lightSpecular = vec3.fromValues(0.5,0.5,0.5); // default light specular emission
var lightPosition = vec3.fromValues(0.5,0.9,-.9); // default light position
var rotateTheta = Math.PI/50; // how much to rotate models by with each key press
var Blinn_Phong = true;
/* webgl and geometry data */
var gl = null; // the all powerful gl object. It's all here folks!
var inputTriangles = []; // the triangle data as loaded from input files
var numTriangleSets = 0; // how many triangle sets in input scene
var inputEllipsoids = []; // the ellipsoid data as loaded from input files
var numEllipsoids = 0; // how many ellipsoids in the input scene
var vertexBuffers = []; // this contains vertex coordinate lists by set, in triples
var normalBuffers = []; // this contains normal component lists by set, in triples
var triSetSizes = []; // this contains the size of each triangle set
var triangleBuffers = []; // lists of indices into vertexBuffers by set, in triples
var viewDelta = -.05; // how much to displace view with each key press

/* shader parameter locations */
var shaderProgram;

var vPosAttribLoc; // where to put position for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc; // where to put project model view matrix for vertex shader
var ambientULoc; // where to put ambient reflecivity for fragment shader
var diffuseULoc; // where to put diffuse reflecivity for fragment shader
var specularULoc; // where to put specular reflecivity for fragment shader
var shininessULoc; // where to put specular exponent for fragment shader
var Blinn_PhongULoc;
var muted = true;
var uvAttrib;


/* interaction variables */
var Eye = vec3.clone(defaultEye); // eye position in world space
var Center = vec3.clone(defaultCenter); // view direction in world space
var Up = vec3.clone(defaultUp); // view up vector in world space

var textures = [];
var uvBuffers = [];
var texToggleUniform;
var texToggle = false;

var alphaUniform;

var modelInstances = [];

var player;

var lavaWaves = [];
var lavaPanels = [];

var now,delta,then = Date.now();
var interval = 1000/30;
var counter = 0;



var timers = [];

var lightPositionULoc;

var speedSlider = document.getElementById("speed");
var fpsIndicator = document.getElementById("fps");
var fpsIndicatorSmooth = document.getElementById("fpsSmooth");

var gameUpdateIndicator = document.getElementById("gameLogicTime");
var renderUpdateIndicator = document.getElementById("renderTime");

// set up needed view params
var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create(); // lookat, right & temp vectors
lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye)); // get lookat vector
viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up)); // get view right vector

// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input json file

// does stuff when keys are pressed
function handleKeyDown(event) {
    
    const modelEnum = {TRIANGLES: "triangles", ELLIPSOID: "ellipsoid"}; // enumerated model type
    const dirEnum = {NEGATIVE: -1, POSITIVE: 1}; // enumerated rotation direction
    
    function highlightModel(modelType,whichModel) {
        if (handleKeyDown.modelOn != null)
            handleKeyDown.modelOn.on = false;
        handleKeyDown.whichOn = whichModel;
        if (modelType == modelEnum.TRIANGLES)
            handleKeyDown.modelOn = modelInstances[whichModel]; 
        else
            handleKeyDown.modelOn = inputEllipsoids[whichModel]; 
        handleKeyDown.modelOn.on = true; 
    } // end highlight model
    
    function translateModel(offset) {
        if (handleKeyDown.modelOn != null)
            vec3.add(handleKeyDown.modelOn.translation,handleKeyDown.modelOn.translation,offset);
    } // end translate model

    function rotateModel(axis,direction) {
        if (handleKeyDown.modelOn != null) {
            var newRotation = mat4.create();

            mat4.fromRotation(newRotation,direction*rotateTheta,axis); // get a rotation matrix around passed axis
            vec3.transformMat4(handleKeyDown.modelOn.xAxis,handleKeyDown.modelOn.xAxis,newRotation); // rotate model x axis tip
            vec3.transformMat4(handleKeyDown.modelOn.yAxis,handleKeyDown.modelOn.yAxis,newRotation); // rotate model y axis tip
        } // end if there is a highlighted model
    } // end rotate model
    

    
    // highlight static variables
    handleKeyDown.whichOn = handleKeyDown.whichOn == undefined ? -1 : handleKeyDown.whichOn; // nothing selected initially
    handleKeyDown.modelOn = handleKeyDown.modelOn == undefined ? null : handleKeyDown.modelOn; // nothing selected initially

    switch (event.code) {
        
            
        // view change
        case "KeyA": // translate view left, rotate left with shift
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,viewDelta));
            if (!event.getModifierState("Shift"))
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,viewDelta));
            break;
        case "KeyD": // translate view right, rotate right with shift
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,-viewDelta));
            if (!event.getModifierState("Shift"))
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,-viewDelta));
            break;
        case "KeyS": // translate view backward, rotate up with shift
            if (event.getModifierState("Shift")) {
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
                Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
            } else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,-viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,-viewDelta));
            } // end if shift not pressed
            break;
        case "KeyW": // translate view forward, rotate down with shift
            if (event.getModifierState("Shift")) {
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
                Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
            } else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,viewDelta));
            } // end if shift not pressed
            break;
        case "KeyE": // translate view forward, rotate down with shift
              Eye[1] -= viewDelta;
              Center[1] -= viewDelta;
            break;
        case "KeyQ": // translate view forward, rotate down with shift
              Eye[1] += viewDelta;
              Center[1] += viewDelta;
            break;
        case "KeyM": // Mute/Unmute
          toggleAudio();
        break;
          
    } // end switch
} // end handleKeyDown

// set up the webGL environment
function setupWebGL() {
    
    // Set up keys
    document.onkeydown = handleKeyDown; // call this when key pressed
    

    
     // create a webgl canvas and set it up
     var webGLCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
     gl = webGLCanvas.getContext("webgl"); // get a webgl object from it
     try {
       if (gl == null) {
         throw "unable to create gl context -- is your browser gl ready?";
       } else {
         //gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
         gl.clearDepth(1.0); // use max when we clear the depth buffer
         gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
       }
     } // end try
     
    
    catch(e) {
      console.log(e);
    } // end catch

} // end setupWebGL

// read models in, load them into webgl buffers
function loadModel(model) {

    
    

    try {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var vtxToAdd; // vtx coords to add to the coord array
        var normToAdd; // vtx normal to add to the coord array
        var triToAdd; // tri indices to add to the index array
        var maxCorner = vec3.fromValues(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE); // bbox corner
        var minCorner = vec3.fromValues(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE); // other corner
        var whichSet = inputTriangles.length;
        inputTriangles.push(model);
        inputTriangles[whichSet].textureNumber = whichSet;
        inputTriangles[whichSet].realTextureNumber = whichSet;
        inputTriangles[whichSet].instanceNumber = whichSet;
        
        // set up hilighting, modeling translation and rotation
        inputTriangles[whichSet].center = vec3.fromValues(0,0,0);  // center point of tri set
        inputTriangles[whichSet].on = false; // not highlighted
        inputTriangles[whichSet].translation = vec3.fromValues(0,0,0); // no translation
        inputTriangles[whichSet].xAxis = vec3.fromValues(1,0,0); // model X axis
        inputTriangles[whichSet].yAxis = vec3.fromValues(0,1,0); // model Y axis 

        // set up the vertex and normal arrays, define model center and axes
        inputTriangles[whichSet].glVertices = []; // flat coord list for webgl
        inputTriangles[whichSet].glNormals = []; // flat normal list for webgl
        
        inputTriangles[whichSet].gluvs = [];
        
        var numVerts = inputTriangles[whichSet].vertices.length; // num vertices in tri set
        for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) { // verts in set
            vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert]; // get vertex to add
            normToAdd = inputTriangles[whichSet].normals[whichSetVert]; // get normal to add
            
            uvsToAdd = inputTriangles[whichSet].uvs[whichSetVert];
            
            inputTriangles[whichSet].glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
            inputTriangles[whichSet].glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // put normal in set coord list
            
            inputTriangles[whichSet].gluvs.push(uvsToAdd[0], uvsToAdd[1]);
            
            vec3.max(maxCorner,maxCorner,vtxToAdd); // update world bounding box corner maxima
            vec3.min(minCorner,minCorner,vtxToAdd); // update world bounding box corner minima
            vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd); // add to ctr sum
        } // end for vertices in set
        vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts); // avg ctr sum
        
         
        // send the vertex coords and normals to webGL
        vertexBuffers[whichSet] = gl.createBuffer(); // init empty webgl set vertex coord buffer
        
        
        
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichSet]); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glVertices),gl.STATIC_DRAW); // data in
        
        inputTriangles.vertBuffer = vertexBuffers[whichSet];
        
        normalBuffers[whichSet] = gl.createBuffer(); // init empty webgl set normal component buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichSet]); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glNormals),gl.STATIC_DRAW); // data in
        inputTriangles[whichSet].normBuffer = normalBuffers[whichSet];
        
        uvBuffers.push(gl.createBuffer());
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffers[whichSet]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inputTriangles[whichSet].gluvs), gl.STATIC_DRAW);
        
        inputTriangles[whichSet].uvBuffer = uvBuffers[whichSet];
        
        // set up the triangle index array, adjusting indices across sets
        inputTriangles[whichSet].glTriangles = []; // flat index list for webgl
        triSetSizes[whichSet] = inputTriangles[whichSet].triangles.length; // number of tris in this set
        for (whichSetTri=0; whichSetTri<triSetSizes[whichSet]; whichSetTri++) {
            triToAdd = inputTriangles[whichSet].triangles[whichSetTri]; // get tri to add
            inputTriangles[whichSet].glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list
        } // end for triangles in set

        // send the triangle indices to webGL
        triangleBuffers.push(gl.createBuffer()); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(inputTriangles[whichSet].glTriangles),gl.STATIC_DRAW); // data in
        
        inputTriangles.triBuffer = triangleBuffers[whichSet];
        
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end load models

function createModelInstance(name, x, y, z, dontAddToInstances) {
  var loc = vec3.fromValues(x, y, z);
  var oldSet = getModelByName(name);
  var set = Object.assign({}, oldSet);
  var nextLen = modelInstances.length;
  set.instanceNumber = nextLen;
  set.translation = loc;
  set.material = Object.assign({}, oldSet.material);
  set.material.ambient = oldSet.material.ambient.slice();
  set.material.diffuse = oldSet.material.diffuse.slice();
  set.material.specular = oldSet.material.specular.slice();
  set.yAxis = vec3.fromValues(0, 1, 0);
  set.xAxis = vec3.fromValues(1, 0, 0);
  set.scaling = vec3.clone(set.scaling);
  if (!dontAddToInstances) {
    modelInstances.push(set);
    numTriangleSets = modelInstances.length;
  }
  return set;
}

function scaleModel(model, x, y, z) {
  vec3.set(model.scaling, x * model.scaling[0], y * model.scaling[1], z * model.scaling [2]);
}
function scaleUniform(model, val) {
  scaleModel(model, val, val, val);
}
function rotateY (model, amount) {
  var rotato = mat4.create();
  mat4.fromRotation(rotato, amount, vec3.fromValues(0, 0, 1));
  vec3.transformMat4(model.yAxis, model.yAxis, rotato);
  vec3.transformMat4(model.xAxis,model.xAxis, rotato);
}

function rotateX (model, amount) {
  var rotato = mat4.create();
  mat4.fromRotation(rotato, amount, vec3.fromValues(1, 0, 0));
  vec3.transformMat4(model.yAxis, model.yAxis, rotato);
  vec3.transformMat4(model.xAxis,model.xAxis, rotato);
}

// get the file from the passed URL
function getFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return httpReq.response; 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input json file




function getModelByName(name) {
  for (var i = 0; i < inputTriangles.length; i++) {
    if (name === inputTriangles[i].name) {
      return inputTriangles[i];
    }
  }
  throw new Error("Couldn't find model with name: " + name);
}


function handleImageLoad(texture, myImage) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  myImage.addEventListener('load', function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  gl.RGBA, gl.UNSIGNED_BYTE, myImage);
    if (isPow2(myImage.width) && isPow2(myImage.height)) {
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  });
}

// setup the webGL shaders
function setupShaders() {
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        attribute vec3 aVertexNormal; // vertex normal
        attribute vec2 a_uv;
        
        
        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        
        varying vec3 vWorldPos; // interpolated world position of vertex
        varying vec3 vVertexNormal; // interpolated normal for frag shader
        
        varying vec2 uv;

        void main(void) {
            
            // vertex position
            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

            // vertex normal (assume no non-uniform scale)
            vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
            vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z)); 
            uv = a_uv;
        }
    `;
    
    var lavaVShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        uniform float sinValue;
        
        
        const int NUM_WAVES =` + NUM_WAVES + `;
        
        
        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        uniform vec3 wavePos[NUM_WAVES];
        uniform float waveRot[NUM_WAVES];
        uniform float waveLen[NUM_WAVES];
        uniform float waveWid[NUM_WAVES];
        
        varying vec3 vWorldPos; // interpolated world position of vertex
        varying float shortHeight;
        varying float sinValue2;
        varying vec3 normalVector;

        void main(void) {
            


            
            // vertex position
            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
            
            float idleChange = 0.0;
            float heightChange = 0.0;
            shortHeight = 0.0;
            for (int i = 0; i < NUM_WAVES; i++) {
              float waveHeight = wavePos[i].y;
              float dx = vWorldPos.x - wavePos[i].x;
              float dz = vWorldPos.z - wavePos[i].z;
              //float dist = sqrt(dx*dx + dz*dz);
              
              float bob = waveRot[i] + waveLen[i] + waveWid[i];
              
              float cosT = cos(waveRot[i]);
              float sinT = sin(waveRot[i]);
              
              float x = cosT * dx + sinT * dz;
              float z = -1.0 * sinT * dx + cosT * dz;
              float insideSqrt = 1.0 - x * x / (waveWid[i] * waveWid[i]) - z * z / (waveLen[i] * waveLen[i]);
              if (insideSqrt >= 0.0) {
                float y = waveHeight * waveHeight * sqrt(insideSqrt);
                y = sign(waveHeight) * y;
                heightChange += y; //max(heightChange, y);
                  shortHeight += atan(5.0*y) - 1.0*y;
                
              }
            
            }
            shortHeight -= 0.5;
            
              //idleChange = 0.005 * sin(sinValue + vWorldPos.x + vWorldPos.z);
            
            vec4 newPos = vec4(aVertexPosition.x, heightChange, aVertexPosition.z, 1.0);
            vWorldPos.y = heightChange;
            
            gl_Position = upvmMatrix * newPos;
 
            //uv = a_uv;
            //float temp = sin(sinValue);
            //uv.x += temp;
            //uv.y -= temp;
            sinValue2 = sinValue;
        }
    `;
    
    var fireVShaderCode = `
        attribute vec2 aVertexPosition;
        varying vec2 uv;
        void main(void) {
          gl_Position = vec4(aVertexPosition.x, aVertexPosition.y, 0.0, 1.0);
          uv = vec2((aVertexPosition.x + 1.0) / 2.0, (aVertexPosition.y + 1.0) / 2.0);
        }
    `;
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float; // set float to medium precision

        // eye location
        uniform vec3 uEyePosition; // the eye's position in world
        
        // light properties
        uniform vec3 uLightAmbient; // the light's ambient color
        uniform vec3 uLightDiffuse; // the light's diffuse color
        uniform vec3 uLightSpecular; // the light's specular color
        uniform vec3 uLightPosition; // the light's position
        uniform bool texToggle;
        uniform float alpha;
        
        // material properties
        uniform vec3 uAmbient; // the ambient reflectivity
        uniform vec3 uDiffuse; // the diffuse reflectivity
        uniform vec3 uSpecular; // the specular reflectivity
        uniform float uShininess; // the specular exponent
        uniform bool Blinn_Phong;  // Blinn_Phong x Phong toggle
        // geometry properties
        varying vec3 vWorldPos; // world xyz of fragment
        varying vec3 vVertexNormal; // normal of fragment
        uniform sampler2D u_texture;
        varying vec2 uv;
        
        
        void main(void) {
        
            // ambient term
            vec3 lightColor = vec3(3.0, 2.6, 0.3) * (2.0 - vWorldPos.y);
            
            
            vec3 ambient = 1.0*lightColor; 
            
            // diffuse term
            vec3 normal = normalize(vVertexNormal); 
            vec3 light = normalize(vec3(vWorldPos.x, alpha, vWorldPos.z) - vWorldPos);//normalize(uLightPosition - vWorldPos);
            float lambert = max(0.0,dot(normal,light));
            vec3 diffuse = lightColor*lambert; // diffuse term
            // specular term
            vec3 eye = normalize(uEyePosition - vWorldPos);
            vec3 halfVec = normalize(light+eye);
            float ndotLight = 2.0*dot(normal, light);
            vec3 reflectVec = normalize(ndotLight*normal - light);
            float highlight = 0.0;
            if(Blinn_Phong) {
              
              
              
              
           	 	highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
              vec3 specular = uSpecular*lightColor*highlight; // specular term
              // combine to output color
              vec3 colorOut = vec3(diffuse);
              vec4 texColor = texture2D(u_texture, uv);
              
              float intensity = texColor.r + 0.4;
              // ship windsheild and fin tip color
              vec3 color1 = texColor.g * intensity * uLightPosition;       
              vec3 color2 = texColor.b * intensity * uAmbient;
              texColor = vec4(color1 + color2, 1.0);
              
              
              //float amount = max(0.0, 2.0 - (vWorldPos.y / 1.5));

              //vec3 lightAmount = vec3(amount * 1.0, amount * 1.0, amount * 0.3);
              
              colorOut = ambient + diffuse + specular;
              colorOut *= texColor.rgb;
              
              vec4 fogColor = vec4(1.0, 1.0, 0.7, 1.0);
              float dist = abs(vWorldPos.z - uEyePosition.z);
              float fogAmount = 0.0;
              
              // fog
              float effectDist = 1.2;
              if (dist > effectDist) {
                dist -= effectDist;
                fogAmount = dist / effectDist;
                fogAmount = max(0.0, fogAmount);
                fogAmount = min(1.0, fogAmount);
                colorOut = mix(vec4(colorOut, 1.0), fogColor, fogAmount * min(max(1.0 / vWorldPos.y, 0.0), 1.0)).rgb;
              }
              
              
              
              
              gl_FragColor = vec4(colorOut.rgb, 1.0);
            }
           	else {
           		gl_FragColor = texture2D(u_texture, uv);
            }

            
            
        }
    `;
    
    var lavaFShaderCode = `
        
        precision mediump float; // set float to medium precision
        // geometry properties
        uniform vec3 uEyePosition;
        varying vec3 vWorldPos; // world xyz of fragment
        varying float shortHeight;
        varying float sinValue2;
        uniform sampler2D u_texture;
        uniform sampler2D u_texture2;
        void main(void) {
            float height = shortHeight;
            // combine to output color
            vec2 newUV = vec2(vWorldPos.x, vWorldPos.z);
            //newUV.x += ;
            vec4 texColor = texture2D(u_texture, newUV);
            vec4 texColor2 = texture2D(u_texture2, newUV);
            
            float val = height;// - 0.35*fract(sin(dot(vec2(vWorldPos.x / 10.0, vWorldPos.z/ 10.0) ,vec2(sinValue2,78.233))) * 43758.5453) + 0.35;
            float r = val;
            float g = val;
            float b = val;
            //if (height > 0.045) {
              //val /= 10.0;
            //}
            vec3 heightColor = vec3(val, val, val);
            float mixAmount = max(0.0, vWorldPos.y) * 2.0;
            texColor = mix(texColor, texColor2, mixAmount);
            
            vec4 colorOut = vec4((texColor.rgb - heightColor), 1.0);
            vec4 fogColor = vec4(1.0, 1.0, 0.5, 1.0);
            float dist = abs(vWorldPos.z - uEyePosition.z);
            float fogAmount = 0.0;
            // fog
            if (dist > 0.9) {
              dist -= 0.9;
              fogAmount = dist;
              fogAmount = max(0.0, fogAmount);
              fogAmount = min(1.0, fogAmount);
              colorOut = mix(colorOut, fogColor, fogAmount);
            }
            if (height < -0.1) {
              vec4 fogColor2 = vec4(1.0, 1.0, 1.0, 1.0);
              fogAmount = -0.1 - height;
              fogAmount = max(0.0, fogAmount);
              fogAmount = min(1.0, fogAmount);
              colorOut = mix(colorOut, fogColor2, fogAmount);
            } 
            
            gl_FragColor = colorOut;
            
            
        }
    `;
    
    var fireFShaderCode = `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D texture;
      uniform sampler2D noise;
      uniform float temp;
      uniform float useEffect;

      // https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
      float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }
      
      void main(void) {
        float delta = 1.0 / 256.0;
        vec2 newUV = uv;
        //vec2 uv = vec2(gl_FragCoord.x + 1.0, gl_FragCoord.y);
        
        float texDelta = fract(temp * 0.001 * 0.2);
        
        newUV.y -= texDelta;
        vec4 distortion = texture2D(noise, vec2(uv.x + temp, uv.y)) * 0.1 ;
        
        
        vec4 texColor = texture2D(texture, newUV + distortion.rb);
        texColor += 1.0;
        texColor.a = 1.0;
        
        float grad = mix(1.0, 0.0, uv.y + 0.45) - 0.1;
        vec4 gradientTexture = vec4(grad, grad, grad, 1.0);
        
        //gl_FragColor = texColor;
        gl_FragColor = gradientTexture + texColor * 0.55;
        gl_FragColor = vec4(gl_FragColor.r, gl_FragColor.r, gl_FragColor.r, 1.0);
        //gl_FragColor = getColorRamp(clamp(gl_FragColor.r, 0.0, 1.0), 0.15);
        vec4 colorTexture = mix(vec4(1.0, 1.0, 0.5, 1.0), vec4(1.0, 0.4, 0.2, 1.0), 1.2 * uv.y);
        gl_FragColor *= colorTexture;
      }

    `
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // ptr to vertex normal attrib
                gl.enableVertexAttribArray(vNormAttribLoc); // connect attrib to array
                
                uvAttrib = gl.getAttribLocation(shaderProgram, "a_uv");
                gl.enableVertexAttribArray(uvAttrib);
                
                // locate vertex uniforms
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
                
                // locate fragment uniforms
                var eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition"); // ptr to eye position
                var lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // ptr to light ambient
                var lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // ptr to light diffuse
                var lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // ptr to light specular
                lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); // ptr to light position
                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // ptr to ambient
                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // ptr to diffuse
                specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // ptr to specular
                shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // ptr to shininess
                Blinn_PhongULoc = gl.getUniformLocation(shaderProgram, "Blinn_Phong");
                
                texToggleUniform = gl.getUniformLocation(shaderProgram, "texToggle");
                
                alphaUniform = gl.getUniformLocation(shaderProgram, "alpha");
                
                // pass global constants into fragment uniforms
                gl.uniform3fv(eyePositionULoc,Eye); // pass in the eye's position
                gl.uniform3fv(lightAmbientULoc,lightAmbient); // pass in the light's ambient emission
                gl.uniform3fv(lightDiffuseULoc,lightDiffuse); // pass in the light's diffuse emission
                gl.uniform3fv(lightSpecularULoc,lightSpecular); // pass in the light's specular emission
                gl.uniform3fv(lightPositionULoc,lightPosition); // pass in the light's position
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,lavaFShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,lavaVShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram2 = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram2, fShader); // put frag shader in program
            gl.attachShader(shaderProgram2, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram2); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram2, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram2);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram2); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                lavaVPosAttribLoc = gl.getAttribLocation(shaderProgram2, "aVertexPosition"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(lavaVPosAttribLoc); // connect attrib to array
                
                
                // locate vertex uniforms
                lavaMMatrixULoc = gl.getUniformLocation(shaderProgram2, "umMatrix"); // ptr to mmat
                lavaPVMMatrixULoc = gl.getUniformLocation(shaderProgram2, "upvmMatrix"); // ptr to pvmmat
                
                lavaEyePositionULoc = gl.getUniformLocation(shaderProgram2, "uEyePosition");
                lavaSinValueUniform = gl.getUniformLocation(shaderProgram2, "sinValue");
                
                lavaTexToggleUniform = gl.getUniformLocation(shaderProgram2, "texToggle");
                
                //lavaAlphaUniform = gl.getUniformLocation(shaderProgram2, "alpha");
                
                wavePosUniform = gl.getUniformLocation(shaderProgram2, "wavePos");
                waveRotationUniform = gl.getUniformLocation(shaderProgram2, "waveRot");
                waveLengthUniform = gl.getUniformLocation(shaderProgram2, "waveLen");
                waveWidthUniform = gl.getUniformLocation(shaderProgram2, "waveWid");
                
                var lavaTex1Uniform = gl.getUniformLocation(shaderProgram2, "u_texture");
                var lavaTex2Uniform = gl.getUniformLocation(shaderProgram2, "u_texture2");
                
                gl.uniform1i(lavaTex1Uniform, 0);  // texture unit 0
                gl.uniform1i(lavaTex2Uniform, 1);  // texture unit 1
                
                lavaShaderProgram = shaderProgram2;
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fireFShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,fireVShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fire fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during fire vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram3 = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram3, fShader); // put frag shader in program
            gl.attachShader(shaderProgram3, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram3); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram2, gl.LINK_STATUS)) { // bad program link
                throw "error during fire shader program linking: " + gl.getProgramInfoLog(shaderProgram3);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram3); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                fireVPosAttribLoc = gl.getAttribLocation(shaderProgram3, "aVertexPosition"); // ptr to
                fireTempUniform = gl.getUniformLocation(shaderProgram3, "temp");
                fireUseEffectUniform = gl.getUniformLocation(shaderProgram3, "useEffect");
                
                fireTexUniform = gl.getUniformLocation(shaderProgram3, "texture");
                fireNoiseUniform = gl.getUniformLocation(shaderProgram3, "noise");
                
                gl.uniform1i(fireTexUniform, 0);  // texture unit 0
                gl.uniform1i(fireNoiseUniform, 1);  // texture unit 1
                
                fireShaderProgram = shaderProgram3;
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders


var lastFPS = 0;
var updateNum = 0;
function updateFPS(elapsedTime) {
  elapsedTime = elapsedTime / 1000;
  updateNum++;
  if (updateNum % 60 == 0) {
    updateNum = 0;
    var temp = 1.0 / lastFPS;
    fpsIndicatorSmooth.innerHTML = temp.toFixed(1);
  }
  var temp = 1.0/elapsedTime;
  fpsIndicator.innerHTML = temp.toFixed(1);
  lastFPS = lastFPS * 0.9 + 0.1 * elapsedTime
  
}


var lastRenderTime = 0;
var lastGameUpdateTime = 0;
updaterNum = 0;
function updateTimers(gameTime, renderTime) {
  lastGameUpdateTime = 0.9 * lastGameUpdateTime + 0.1 * gameTime;
  lastRenderTime = 0.9 * lastGameUpdateTime + 0.1 * renderTime;
  updaterNum++;
  if (updaterNum % 30 == 0) {
    updaterNum = 0;
    gameUpdateIndicator.innerHTML = lastGameUpdateTime.toFixed(5);
    renderUpdateIndicator.innerHTML = lastRenderTime.toFixed(5);
  }
}

// render the loaded model
var startTime = Date.now();
var endTime = Date.now();
var lastUpdateTime = Date.now();
timeSinceLastUpdate = 0;
var c = 0;
function renderModels() {
    c++;
    var gUpdateTime = Date.now();
    updateGame(Date.now() - lastUpdateTime);
    lastUpdateTime = Date.now();
    gUpdateTime = Date.now() - gUpdateTime;
    var renderUpdateTime = Date.now();
    
      // construct the model transform matrix, based on model state
      function makeModelTransform(currModel) {
          var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

          // move the model to the origin
          mat4.fromTranslation(mMatrix,vec3.negate(negCtr,currModel.center)); 
          
          // scale
          mat4.multiply(mMatrix,mat4.fromScaling(temp,currModel.scaling),mMatrix); // S(1.2) * T(-ctr)
          
          // rotate the model to current interactive orientation
          vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis)); // get the new model z axis
          mat4.set(sumRotation, // get the composite rotation
              currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
              currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
              currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
              0, 0,  0, 1);
          mat4.multiply(mMatrix,sumRotation,mMatrix); // R(ax) * S(1.2) * T(-ctr)
          
          // translate back to model center
          mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.center),mMatrix); // T(ctr) * R(ax) * S(1.2) * T(-ctr)

          // translate model to current interactive orientation
          mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.translation),mMatrix); // T(pos)*T(ctr)*R(ax)*S(1.2)*T(-ctr)
          
      } // end make model transform
      
      function renderTriangles() {
        gl.useProgram(shaderProgram); // activate shader program (frag and vert)        
        // render each triangle set
        var currSet; // the tri set and its material properties
        for (var whichTriSet=0; whichTriSet<modelInstances.length; whichTriSet++) {
            var textureNumber = modelInstances[whichTriSet].textureNumber;
            var instanceNumber = whichTriSet;
            
            var thisInstance = modelInstances[whichTriSet];
            
            var lavaHeight = 0.0;
            if (thisInstance.lavaHeight) {
              lavaHeight = thisInstance.lavaHeight;
            }
            
            currSet = modelInstances[instanceNumber];
            makeModelTransform(thisInstance);
            mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
            gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
            gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
            
            
            var colorOffset = lightPosition;
            if (thisInstance.colorOffset) {
              colorOffset = thisInstance.colorOffset;
            }
            gl.uniform3fv(lightPositionULoc,colorOffset);
            
            // reflectivity: feed to the fragment shader
            
            var colorOffset2 = currSet.material.ambient;
            if (thisInstance.colorOffset) {
              colorOffset2 = thisInstance.colorOffset2;
            }
            
            gl.uniform3fv(ambientULoc,colorOffset2); // pass in the ambient reflectivity
            gl.uniform3fv(diffuseULoc,currSet.material.diffuse); // pass in the diffuse reflectivity
            gl.uniform3fv(specularULoc,currSet.material.specular); // pass in the specular reflectivity
            gl.uniform1f(shininessULoc,currSet.material.n); // pass in the specular exponent
            
            var bp = Blinn_Phong;
            if (thisInstance.ignoreLighting == true) {
              bp = false;
            }
            
            gl.uniform1i(Blinn_PhongULoc, bp);
            // vertex buffer: activate and feed into vertex shader
            gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[textureNumber]); // activate
            gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
            gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[textureNumber]); // activate
            gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed
            
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffers[textureNumber]);
            gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 0, 0);
            
            gl.uniform1f(alphaUniform, lavaHeight);
            
            
            var tex;
            if (!thisInstance.specialTexture) {
              tex = textures[thisInstance.realTextureNumber];
            }
            else {
              tex = thisInstance.specialTexture;
            }
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            
            gl.uniform1i(texToggleUniform, texToggle);
            // triangle buffer: activate and render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[textureNumber]); // activate
            gl.drawElements(gl.TRIANGLES,3*triSetSizes[textureNumber],gl.UNSIGNED_SHORT,0); // render

            
        } // end for each triangle set
      }
      
      function renderLava() {
        gl.useProgram(lavaShaderProgram); // activate shader program (frag and vert)        
        sinValue = Date.now() / 60 % 360 * (Math.PI * 2.0);
        // render each triangle set
        var currSet; // the tri set and its material properties
        for (var whichTriSet=0; whichTriSet<lavaPanels.length; whichTriSet++) {
            var textureNumber = lavaPanels[whichTriSet].textureNumber;
            var instanceNumber = whichTriSet;
            var thisInstance = lavaPanels[whichTriSet];
            currSet = lavaPanels[instanceNumber];
            makeModelTransform(thisInstance);
            mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
            gl.uniformMatrix4fv(lavaMMatrixULoc, false, mMatrix); // pass in the m matrix
            gl.uniformMatrix4fv(lavaPVMMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
            
            // vertex buffer: activate and feed into vertex shader
            gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[textureNumber]); // activate
            gl.vertexAttribPointer(lavaVPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
            
            
            gl.uniform1f(lavaAlphaUniform, currSet.material.alpha);
            
            gl.uniform1f(lavaSinValueUniform, sinValue);
            
            
            gl.uniform3fv(wavePosUniform,getWavePositionArray());
            gl.uniform1fv(waveRotationUniform,getWaveRotations());
            gl.uniform1fv(waveWidthUniform,getWaveWidths());
            gl.uniform1fv(waveLengthUniform,getWaveLengths());
            gl.uniform3fv(lavaEyePositionULoc,Eye);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, lavaTexture1);
            
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, lavaTexture2);
            
            // triangle buffer: activate and render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[textureNumber]); // activate
            gl.drawElements(gl.TRIANGLES,3*triSetSizes[textureNumber],gl.UNSIGNED_SHORT,0); // render

            
        } // end for each triangle set
      }
      
      function renderFire() {
        if (c % 4 == 0) {
          fireNoiseShift = Math.random();
        }

        
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 200, 0, 255]));
        
        //gl.subImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, );
        gl.bindFramebuffer(gl.FRAMEBUFFER, fireFrameBuffer);
        attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, fireTexture2, 0);
        
        function run(val) {

                  
        gl.useProgram(fireShaderProgram);
          
          gl.uniform1f(fireTempUniform, Date.now() % 5000.0);
          gl.uniform1f(fireUseEffectUniform, val);
          
          gl.bindBuffer(gl.ARRAY_BUFFER, fireVBuffer);
          gl.vertexAttribPointer(fireVPosAttribLoc, 2, gl.FLOAT, false, 0, 0);
          
          
          
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, fireTexture);
          
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, fireNoiseTexture);
          
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,fireTriBuffer);
          gl.drawElements(gl.TRIANGLES,3 * 2,gl.UNSIGNED_SHORT,0); // render
          //gl.bindFramebuffer(gl.FRAMEBUFFER, fireFrameBuffer);
          
        }
        gl.viewport(0, 0, 256, 256);
        run(1.0);
        gl.viewport(0, 270, 800, 800);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        run(0.0);
        // Clear depth so that fire appears behind everything
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, 800, 800);
      }
      
      // var hMatrix = mat4.create(); // handedness matrix
      var pMatrix = mat4.create(); // projection matrix
      var vMatrix = mat4.create(); // view matrix
      var mMatrix = mat4.create(); // model matrix
      var pvMatrix = mat4.create(); // hand * proj * view matrices
      var pvmMatrix = mat4.create(); // hand * proj * view * model matrices
      

      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
      
      // set up projection and view
      // mat4.fromScaling(hMatrix,vec3.fromValues(-1,1,1)); // create handedness matrix
      mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10); // create projection matrix
      mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
      mat4.multiply(pvMatrix,pvMatrix,pMatrix); // projection
      mat4.multiply(pvMatrix,pvMatrix,vMatrix); // projection * view
      
      renderFire();
      renderLava();
      renderTriangles();
      
      
      
      renderUpdateTime = Date.now() - renderUpdateTime;
      endTime = Date.now();
      updateFPS((endTime - startTime));
      updateTimers(gUpdateTime, renderUpdateTime);
      startTime = endTime;
      window.requestAnimationFrame(renderModels); // set up frame render callback
    
} // end render model

function isPow2(value) {
    return (value & (value - 1)) == 0;
}

 
function loadModelFromObj(url, desc) {
  var str = getFile(url, desc) + "";
  var file = str.split("\n");
  
  var model = {};
  model.name = desc;
  model.material = {"ambient": [0.5,0.5,0.5], "diffuse": [0.6,0.4,0.4], "specular": [0.3,0.3,0.3], "n": 11, "alpha": 1.0, "texture": "snakeHeadUV.png"}
  model.vertices = [];
  model.normals = [];
  model.uvs = [];
  model.triangles = [];
  model.v = [];
  model.vn = [];
  model.vt = [];
  model.texture = "royal_wall.jpg";
  model.scaling = vec3.fromValues(1.0, 1.0, 1.0);
  for (var i = 0; i < file.length; i++) {
    var nextLine = file[i].split(" ");
    
    if (nextLine[0] === "v") {
      var v = [];
      v.push(parseFloat(nextLine[1]), parseFloat(nextLine[2]), parseFloat(nextLine[3]));
      model.v.push(v);
    }
    else if(nextLine[0] === "vt") {
      var vt = [];
      vt.push(parseFloat(nextLine[1]), parseFloat(nextLine[2]));
      model.vt.push(vt);
    }
    else if(nextLine[0] === "vn") {
      var vn = [];
      vn.push(parseFloat(nextLine[1]), parseFloat(nextLine[2]), parseFloat(nextLine[3]));
      model.vn.push(vn);
    }
    else if(nextLine[0] === "f") {
      var triangles = [];
      for (var j = 1; j < 4; j++) { 
        var vals = nextLine[j].split("/");
        
        var vIndex = parseInt(vals[0]) - 1;
        var uvIndex = parseInt(vals[1]) - 1;
        var nIndex = parseInt(vals[2]) - 1;
        
        if (!vIndex || !uvIndex || !nIndex) {
          //console.log("Indices: " + vIndex + " " + uvIndex + " " + nIndex);
        }
        
        if (!model.v[vIndex] || !model.vt[uvIndex] || !model.vn[nIndex]) {
          console.log("Missing something, look here: "  +"Indices: " + vIndex + " " + uvIndex + " " + nIndex + " vals: " + model.v[vIndex] + " " + model.vt[uvIndex] + " " + model.vn[nIndex]);
        }
        
        model.vertices.push(model.v[vIndex]);
        triangles.push(model.vertices.length - 1);
        model.uvs.push(model.vt[uvIndex]);
        model.normals.push(model.vn[nIndex]);
      }
      model.triangles.push(triangles);
    }
  }
  //console.log(model);
  loadModel(model);
  scaleUniform(model, 0.025);
  return model;
} 
function addTexture(resourceURL) {
  var whichSet = textures.length;
  textures.push(gl.createTexture());
  gl.bindTexture(gl.TEXTURE_2D, textures[whichSet]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 200, 0, 255]));
  var myImage = new Image();
  myImage.crossOrigin = "Anonymous";
  myImage.src = resourceURL;
  handleImageLoad(textures[whichSet], myImage);
  return textures[textures.length - 1];
}
function loadResources() {
  var resources = getJSONFile(BASE_URL + "resources.json", "resources");
  
  var modelInfo = resources;
  
  for (var i = 0; i < modelInfo.length; i++) {
    var nextModelInfo = modelInfo[i];
    var nextPos = inputTriangles.length;
    
    var nextModel = loadModelFromObj(BASE_URL + "models/" + nextModelInfo.model, nextModelInfo.name);
    inputTriangles[nextPos].name = nextModelInfo.name;
    inputTriangles[nextPos].material = nextModelInfo.material;
    vec3.set(inputTriangles[nextPos].center, 0.0, 0.0, 0.0);
    addTexture(BASE_URL + "textures/" + nextModelInfo.material.texture);
  }
}
