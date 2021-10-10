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


  // Global Variables
// =========================

//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
                  
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
var g_angle01 = 0;                  // initial rotation angle
var g_frog_rate = 45.0;           // rotation speed, in degrees/second 

//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
var g_digits=5;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(g_digits)); // print 5 digits

var wheel_vertecies = [];
var car_vertecies = [];

var g_u_ModelMatrix;

var g_steerKey = "";

var g_steer_max_angle = 40;
var g_steer_rate = 40;
var g_steer_angle = 0;

var g_wheelspeed_max_rate = 1000;
var g_wheelspeed_rate = 100;
var g_wheel_angle = 0;

var g_frog_leg_angle_front = 0;
var g_frog_leg_angle_back = 0;
var g_frog_height = 0;
var g_frog_pos = 0;

var frog_body_vertecies = []
var frog_leg_vertecies = []
var frog_eye_vertecies = []

var g_zoom = 0.4

function main() {
//==============================================================================
  // Retrieve <canvas> element
  g_canvas.width = Math.min(window.innerWidth,window.innerHeight)
  g_canvas.height = Math.min(window.innerWidth,window.innerHeight)

  // Get the rendering context for WebGL
  gl = getWebGLContext(g_canvas);
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

  //MOUSE:
  window.addEventListener("mousedown", myMouseDown); 
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	

  //KEY:
  window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 0);

  // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 
  //gl.enable(gl.CULL_FACE)	  

  // Get storage location of u_ModelMatrix
  g_u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }


  // Start drawing
  var tick = function() {
    animate();  // Update the rotation angle
    draw(gl);   // Draw the triangle
    requestAnimationFrame(tick, g_canvas);   // Request that the browser ?calls tick
  };
  tick();
}

function initVertexBuffers(gl) {
//==============================================================================


car_vertecies = get_car_vertecies()
wheel_vertecies = get_wheel_vertecies(100, 100, 8)
frog_body_vertecies = get_frog_body_vertecies()
frog_leg_vertecies = get_frog_leg_vertecies()
frog_eye_vertecies = get_frog_eye_vertecies(0.7)
colorShape = new Float32Array(car_vertecies.length 
  + wheel_vertecies.length
  + frog_body_vertecies.length
  + frog_leg_vertecies.length
  + frog_eye_vertecies.length)
colorShape.set(car_vertecies
  .concat(wheel_vertecies)
  .concat(frog_body_vertecies)
  .concat(frog_leg_vertecies)
  .concat(frog_eye_vertecies))

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

function draw(gl) {
//==============================================================================
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Build our Robot Arm by successively moving our drawing axes

  //-------Draw Lower Arm---------------
  //modelMatrix.setTranslate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  g_modelMatrix.setTranslate(0,0,0)
  g_modelMatrix.scale(g_zoom,g_zoom,g_zoom)

  var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
  g_modelMatrix.rotate(-dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
  

  //  g_modelMatrix.rotate(currentAngle,0,0,1)
  //g_modelMatrix.scale(0.6,0.6,-0.6)
  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(0,-0.1,-0.5)
  g_modelMatrix.scale(0.6,0.6,0.6)
  drawCar(g_wheel_angle, g_steer_angle)
  g_modelMatrix = popMatrix(g_modelMatrix)

  pushMatrix(g_modelMatrix)
  g_modelMatrix.rotate(g_frog_pos,0,1,0)
  g_modelMatrix.translate(1.4,0,0)
  g_modelMatrix.rotate(90,0,1,0)
  g_modelMatrix.scale(0.2,0.2,0.2)
  g_modelMatrix.translate(0, g_frog_height, 0)
  drawFrog(g_frog_leg_angle_front, g_frog_leg_angle_back)
  g_modelMatrix = popMatrix(g_modelMatrix)
  
}
function drawFrog(front_angle, back_angle) {
  pushMatrix(g_modelMatrix)


  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, car_vertecies.length/7 + wheel_vertecies.length/7, 18);
  
  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_FAN, car_vertecies.length/7 + wheel_vertecies.length/7 + 18  , 10);

  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_FAN, car_vertecies.length/7 + wheel_vertecies.length/7 + 18 +10 , 10);

  drawFrogLeg(front_angle, back_angle)
  drawFrogEye()


    


}
function drawOneLeg(leg_angle) {

  //Leg right
  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(-0.7,-0.2,0)
  g_modelMatrix.rotate(90,0,1,0)
  g_modelMatrix.rotate(leg_angle-20,0,0,1)
  pushMatrix(g_modelMatrix)
  g_modelMatrix.scale(0.6,0.3,0.3)
  g_modelMatrix.translate(-1 ,0,0)
  drawLeg()
  g_modelMatrix = popMatrix()


  g_modelMatrix.translate(-1.2,0,0)
  g_modelMatrix.rotate(90,0,0,1)
  g_modelMatrix.rotate(-leg_angle+30,0,0,1)
  pushMatrix(g_modelMatrix)  
  g_modelMatrix.scale(0.6,0.2,0.2)
  g_modelMatrix.translate(-1 ,0,0)
  drawLeg()
  g_modelMatrix = popMatrix()


  g_modelMatrix.translate(-1.2,0,0)
  g_modelMatrix.rotate(-90,0,0,1)
  g_modelMatrix.rotate(-leg_angle*0.4,0,0,1)
  pushMatrix(g_modelMatrix)  
  g_modelMatrix.scale(0.4,0.2,0.2)
  g_modelMatrix.translate(-1 ,0,0)
  drawLeg()
  g_modelMatrix = popMatrix()



  g_modelMatrix = popMatrix()

}
function drawLeg() {
  g_u_ModelMatrix
gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
gl.drawArrays(gl.TRIANGLE_STRIP, 
  car_vertecies.length/7 
  + wheel_vertecies.length/7 
  + frog_body_vertecies.length/7, 18);

gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
gl.drawArrays(gl.TRIANGLE_FAN, 
  car_vertecies.length/7 
  + wheel_vertecies.length/7
  + frog_body_vertecies.length/7
  + 18  , 10);

gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
gl.drawArrays(gl.TRIANGLE_FAN, 
  car_vertecies.length/7 
  + wheel_vertecies.length/7 
  + frog_body_vertecies.length/7
  + 18 +10 , 10);
}
function drawFrogLeg(front_angle,back_angle) {
  pushMatrix(g_modelMatrix)

  drawOneLeg(back_angle)
  pushMatrix(g_modelMatrix)
  g_modelMatrix.scale(1,1,-1)
  drawOneLeg(back_angle)
  g_modelMatrix = popMatrix()



  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(1,0,0)
  drawOneLeg(front_angle)
  pushMatrix(g_modelMatrix)
  g_modelMatrix.scale(1,1,-1)
  drawOneLeg(front_angle)
  g_modelMatrix = popMatrix()

  g_modelMatrix = popMatrix()




  g_modelMatrix = popMatrix()

}

function drawEye() {
  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 
    car_vertecies.length/7 
    + wheel_vertecies.length/7 
    + frog_body_vertecies.length/7
    + frog_leg_vertecies.length/7, 18);
  
  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_FAN, 
    car_vertecies.length/7 
    + wheel_vertecies.length/7
    + frog_body_vertecies.length/7
    + frog_leg_vertecies.length/7
    + 18  , 10);

  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_FAN, 
    car_vertecies.length/7 
    + wheel_vertecies.length/7 
    + frog_body_vertecies.length/7
    + frog_leg_vertecies.length/7
    + 18 +10 , 10);

  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_FAN, 
    car_vertecies.length/7 
    + wheel_vertecies.length/7 
    + frog_body_vertecies.length/7
    + frog_leg_vertecies.length/7
    + 18 +10 + 10 , 10);
}

function drawFrogEye(eyeAngle) {
  eyeAngle = eyeAngle | 0


  pushMatrix(g_modelMatrix)

  
  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(0.65,0.7,0.13)
  g_modelMatrix.rotate(10+eyeAngle,0,1,0)
  g_modelMatrix.scale(0.2,0.2,0.2)
  drawEye()
  g_modelMatrix = popMatrix()

  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(0.65,0.7,-0.13)
  g_modelMatrix.rotate(-10+eyeAngle,0,1,0)
  g_modelMatrix.scale(0.2,0.2,0.2)
  drawEye()
  g_modelMatrix = popMatrix()

  g_modelMatrix = popMatrix()
  
}



function drawCar(wheel_rot_angle, wheel_steer_angle) {
  pushMatrix(g_modelMatrix)

  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, car_vertecies.length/7);

  //console.log(wheel_steer_angle)
  //TYRE FL
  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(-0.65,0,-0.1)
  g_modelMatrix.rotate(wheel_steer_angle,0,1,0)
  g_modelMatrix.rotate(wheel_rot_angle,0,0,1)
  s_factor = 0.17
  g_modelMatrix.scale(s_factor,s_factor,s_factor)

  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, car_vertecies.length/7, wheel_vertecies.length/7);
  
  g_modelMatrix = popMatrix()


  //TYRE FR
  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(-0.65,0,1.1)
  g_modelMatrix.rotate(wheel_steer_angle,0,1,0)
  g_modelMatrix.rotate(180,0,1,0)
  g_modelMatrix.rotate(-wheel_rot_angle,0,0,1)
  s_factor = 0.17
  g_modelMatrix.scale(s_factor,s_factor,s_factor)

  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, car_vertecies.length/7, wheel_vertecies.length/7);
  
  g_modelMatrix = popMatrix()


  //TYRE BL
  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(0.6,0,-0.1)
  g_modelMatrix.rotate(wheel_rot_angle,0,0,1)
  s_factor = 0.18
  g_modelMatrix.scale(s_factor,s_factor,s_factor)

  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, car_vertecies.length/7, wheel_vertecies.length/7);
  
  g_modelMatrix = popMatrix()

  //TYRE BR
  pushMatrix(g_modelMatrix)
  g_modelMatrix.translate(0.6,0,1.1)
  g_modelMatrix.rotate(180,0,1,0)
  g_modelMatrix.rotate(-wheel_rot_angle,0,0,1)
  s_factor = 0.18
  g_modelMatrix.scale(s_factor,s_factor,s_factor)

  gl.uniformMatrix4fv(g_u_ModelMatrix, false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, car_vertecies.length/7, wheel_vertecies.length/7);
  
  g_modelMatrix = popMatrix()


  g_modelMatrix = popMatrix()
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  //steer
  switch (g_steerKey) {
    case "left":
      if(g_steer_angle > -g_steer_max_angle ){
        g_steer_angle -= (g_steer_rate*elapsed)/1000.0
      }
      
      break;
    case "right":
      if(g_steer_angle < g_steer_max_angle ){
        g_steer_angle += (g_steer_rate*elapsed)/1000.0
      }
      
      break;
    case "fwd":
      if(g_wheelspeed_rate < g_wheelspeed_max_rate ){
        g_wheelspeed_rate += (g_wheelspeed_rate*elapsed)/1000.0
      }
      break;
    case "bwd":
      if(g_wheelspeed_rate > -g_wheelspeed_max_rate ){
        g_wheelspeed_rate -= (g_wheelspeed_rate*elapsed)/1000.0
      }     
      break;
    default:
      steer = (g_steer_rate*elapsed)/1000.0
      if(g_steer_angle > steer){
        g_steer_angle -= steer
      }else if(g_steer_angle < -steer){
        g_steer_angle += steer
      }
      break;
  }

  g_wheel_angle += (g_wheelspeed_rate*elapsed)/1000.0
  g_wheel_angle %= 360

  //FROG
  

  g_frog_pos += (g_frog_rate * elapsed) / 1000.0;
  g_frog_pos %= 360

  a = g_frog_pos/360.0 * Math.PI *10
  g_frog_leg_angle_back = 10+20*Math.sin(a)
  g_frog_leg_angle_front = 10+10*Math.sin(a)
  g_frog_height = (10+20*Math.sin(a))*0.01
  
}

function moreFrogSpeed() {
//==============================================================================

  g_frog_rate += 10; 
}

function lessFrogSpeed() {
//==============================================================================
  g_frog_rate -= 10; 
}

function zoomIN() {
  g_zoom += 0.1
}
function zoomOUT() {
  g_zoom -= 0.1
}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev) {

  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
               (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
               (g_canvas.height/2);

  g_isDrag = true;											// set our mouse-dragging flag
  g_xMclik = x;													// record where mouse-dragging began
  g_yMclik = y;
};
  
  
function myMouseMove(ev) {
  if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  //  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                (g_canvas.height/2);
  //	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  g_xMdragTot += (x - g_xMclik);					// Accumulate change-in-mouse-position,&
  g_yMdragTot += (y - g_yMclik);

  g_xMclik = x;													// Make next drag-measurement from here.
  g_yMclik = y;
};

function myMouseUp(ev) {

  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                (g_canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  g_isDrag = false;											// CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  g_xMdragTot += (x - g_xMclik);
  g_yMdragTot += (y - g_yMclik);
};

function myKeyDown(kev) {
   
  switch(kev.code) {

    //----------------Arrow keys------------------------
    case "ArrowLeft": 	
      g_steerKey = "left"
      break;
    case "ArrowRight":
      g_steerKey = "right"
      break;
    case "ArrowUp":		
      g_steerKey = "fwd"
      break;
    case "ArrowDown":
      g_steerKey = "bwd"
      break;	
    default:
      break;
  }
}
  
  function myKeyUp(kev) {
    g_steerKey = ""
  }