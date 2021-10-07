/**
 * Initial version copyed from NormalRobotArm20.js
 */
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';



// Global Variable -- Rotation angle rate (degrees/second)
var ANGLE_STEP = 45.0;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  canvas.width = Math.min(window.innerWidth,window.innerHeight)
  canvas.height = Math.min(window.innerWidth,window.innerHeight)

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices into an array, transfer
  // array contents to a Vertex Buffer Object created in the
  // graphics hardware.
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 0);

  // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  

  // Get storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
	// Explain on console:
	console.log('\ndraw() fcn, line 151: translate1. rotate1. translate2.\n Draw box; Lower arm now complete.\n');
	console.log('Upper Arm, line 178: translate3. scale1. rotate2. translate4. \n Draw box. Upper Arm now complete.\n');
	console.log('Pincer: line 199: translate5. PUSHmatrix! rotate3. scale2. \n Draw box. lower, inner jaw now complete.\n');
	console.log('lower, outer jaw: line 238: translate6. rotate4. translate7. \n Draw box. lower, outer jaw now complete. \n');
	console.log('upper, inner jaw: line 247: POPmatrix! (return to \'wrist\' coords). rotate5. scale3. translate8. \n Draw box. upper, inner jaw now complete. \n');
	console.log('upper, outer jaw: line 268: translate9. rotate6. translate10. \n Draw box.  Upper, outer jaw now complete.\n');
	console.log('Entire Robot Arm now complete!\n\n');

  // Current rotation angle
  var currentAngle = 0.0;
  // Model matrix
  var modelMatrix = new Matrix4();

  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw the triangle
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}

function ballMesh(depth, segments) {
  var colorShape = new Float32Array(segments*14)
  var theta = 0
  var phi = 0
  var x = Math.cos(theta)*Math.cos(phi)
  var y = Math.cos(theta)*Math.sin(phi)
  var z = Math.sin(theta)

  colorShape[ 0] = x
  colorShape[ 1] = y
  colorShape[ 2] = z
  colorShape[ 3] = 1.0
  colorShape[ 4] = 1.0
  colorShape[ 5] = 0.0
  colorShape[ 6] = 0.0

  for(i =  7.0; i<segments*14; i+=14){
    var theta = i/(segments*14) * Math.PI/2.0
    var phi = 0
    var x = Math.cos(theta)*Math.cos(phi)
    var y = Math.cos(theta)*Math.sin(phi)
    var z = Math.sin(theta)

    colorShape[i+ 0] = x
    colorShape[i+ 1] = y
    colorShape[i+ 2] = z
    colorShape[i+ 3] = 1.0
    colorShape[i+ 4] = 1.0
    colorShape[i+ 5] = 0.0
    colorShape[i+ 6] = 0.0

    var phi = Math.PI/20
    var x = Math.cos(theta)*Math.cos(phi)
    var y = Math.cos(theta)*Math.sin(phi)
    var z = Math.sin(theta)

    colorShape[i+ 7] = x
    colorShape[i+ 8] = y
    colorShape[i+ 9] = z
    colorShape[i+ 10] = 1.0
    colorShape[i+ 11] = 0.0
    colorShape[i+ 12] = 1.0
    colorShape[i+ 13] = 0.0
  }

  return colorShape

}

function initVertexBuffers(gl) {
//==============================================================================
  var colorShape = ballMesh(0,100)
  console.log(colorShape)
  
  /* new Float32Array ([
    1.0, 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
    1.0, -1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
    -1.0, -1.0, 1.0, 1.0,  1.0, 1.0, 1.0,

    -1.0, -1.0, 1.0, 1.0,  0.0, 0.0, 1.0,
    -1.0, 1.0, 1.0, 1.0,  0.0, 0.0, 1.0,
    1.0, 1.0, 1.0, 1.0,  0.0, 0.0, 1.0,
    

    1.0, 1.0, -1.0, 1.0,  1.0, 1.0, 1.0,
    1.0, -1.0, -1.0, 1.0,  1.0, 1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0,  1.0, 1.0, 1.0,

    -1.0, -1.0, -1.0, 1.0,  1.0, 0.0, 0.0,
    -1.0, 1.0, -1.0, 1.0,  1.0, 0.0, 0.0,
    1.0, 1.0, -1.0, 1.0,  1.0, 0.0, 0.0,
    
    
  ]);

*/





  var n = colorShape.length/7;   // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, colorShape, gl.STATIC_DRAW);

  var FSIZE = colorShape.BYTES_PER_ELEMENT

  // Assign the buffer object to a_Position variable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 7, 0);
	
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);


  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 7, FSIZE * 4);
  
  gl.enableVertexAttribArray(a_Color);  

  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
	

  return n;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Build our Robot Arm by successively moving our drawing axes

  //-------Draw Lower Arm---------------
  //modelMatrix.setTranslate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  
  modelMatrix.setRotate(currentAngle,0.4,1,1)

  modelMatrix.translate(0,1,0)
  modelMatrix.rotate(90,0,0,1)
  modelMatrix.rotate(90,0,1,0)
  modelMatrix.translate(0.0,0.0,-1.0)
  //modelMatrix.rotate(-90,0,0,1)

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, n);
  
  var angle = 20
  for(i = 0; i < 360; i+= angle){
    modelMatrix.rotate(angle,0,0,1)

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }

 
  
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >  360.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle <  0.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function moreCCW() {
//==============================================================================

  ANGLE_STEP += 10; 
}

function lessCCW() {
//==============================================================================
  ANGLE_STEP -= 10; 
}
