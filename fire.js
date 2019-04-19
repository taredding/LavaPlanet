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

function updateFire(time) {
  return 0.0;
}

function loadFire() {
  fireTexture = addTexture(BASE_URL + "textures/" + "black.png");
  fireTexture2 = addTexture(BASE_URL + "textures/" + "black.png");
  fireNoiseTexture = addTexture(BASE_URL + "textures/" + "fireNoise.png")
  
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
  
}