const fireTextureWidth = 256;
const fireTextureHeight = fireTextureWidth;
var fireProgram;
// need to swap between these every frame
var fireTexture;
var fireTexture2;
var fireNoiseTexture;
var fireFrameBuffer;
var fireVPosAttribLoc;
var fireVertices = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
//var fireVertices = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
var fireTriangles = new Uint16Array([0, 1, 2, 1, 2, 3]);
var fireVBuffer;
var fireTriBuffer;

var fireFrameBuffer;
var attachmentPoint;

var fireTempUniform;
var fireUseEffectUniform;

var fireTexUniform;
var fireNoiseUniform;

var fireNoiseShift = 0.0;

var firePanel;

function updateFire(time) {
  return 0.0;
}

function loadFire() {
  // fire 7 and distortion 3 was best combo so far
  // fire 7 and distortion 4 was also good
  // fire 7 and distortion 5 was also good
  fireTexture = addTexture(BASE_URL + "textures/" + "fire7.jpg");
  fireTexture2 = addNullTexture();//addTexture(BASE_URL + "textures/" + "fire7.jpg");
  fireNoiseTexture = addTexture(BASE_URL + "textures/" + "distortion3.jpg")
  
  fireFrameBuffer = gl.createFramebuffer();
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, fireFrameBuffer);
  attachmentPoint = gl.COLOR_ATTACHMENT0;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, fireTexture2, 0);
  
  fireVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,fireVBuffer); // activate that buffer
  gl.bufferData(gl.ARRAY_BUFFER,fireVertices,gl.STATIC_DRAW);
  
  fireTriBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fireTriBuffer); // activate that buffer
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,fireTriangles,gl.STATIC_DRAW);
  
  /**firePanel = createModelInstance("panel", 0.5, 1.4, LAVA_MIN_Z, true);
  
  
  //scaleUniform(firePanel, 100.0);
  scaleModel(firePanel, 100, 50.0, 70.0);
  rotateX(firePanel, Math.PI / 2);
  textures.push(fireTexture2);
  firePanel.specialTexture = fireTexture2;
  firePanel.ignoreLighting = true;*/
  
}