// JointModel.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

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

  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

  if (!u_FragColor || !u_MvpMatrix) {
    console.log('Failed to get the storage location');
    return;
  }


  // Calculate the view projection matrix
  var viewProjMatrix = new Matrix4();
  viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(20.0, 10.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  // Register the event handler to be called when keys are pressed
  document.onkeydown = function (ev) { keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor) };

  draw(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor);
}

var ANGLE_STEP = 3.0;    // The increments of rotation angle (degrees)
var g_supportAngle = -90.0; // The rotation angle of arm1 (degrees)
var g_joint1Angle = 0.0; // The rotation angle of joint1 (degrees)
var g_fingerAngle = 0.0;

function keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor) {
  console.log(ev.keyCode);
  switch (ev.keyCode) {
    case 38: // Up arrow key -> the positive rotation of joint1 around the z-axis
      if (g_joint1Angle < 135.0) g_joint1Angle += ANGLE_STEP;
      break;
    case 40: // Down arrow key -> the negative rotation of joint1 around the z-axis
      if (g_joint1Angle > -135.0) g_joint1Angle -= ANGLE_STEP;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_supportAngle = (g_supportAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_supportAngle = (g_supportAngle - ANGLE_STEP) % 360;
      break;
    case 65:
      if (g_fingerAngle < 30.0) g_fingerAngle += ANGLE_STEP;
      break;
    case 68:
      if (g_fingerAngle > -30.0) g_fingerAngle -= ANGLE_STEP;
      break;
    default: return; // Skip drawing at no effective action
  }
  // Draw the robot arm
  draw(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor);
}

function initVertexBuffers(gl) {
  // Vertex coordinates（a cuboid 3.0 in width, 10.0 in height, and 3.0 in length with its origin at the center of its bottom)
  var vertices = new Float32Array([
    1.5, 10.0, 1.5, -1.5, 10.0, 1.5, -1.5, 0.0, 1.5, 1.5, 0.0, 1.5, // v0-v1-v2-v3 front
    1.5, 10.0, 1.5, 1.5, 0.0, 1.5, 1.5, 0.0, -1.5, 1.5, 10.0, -1.5, // v0-v3-v4-v5 right
    1.5, 10.0, 1.5, 1.5, 10.0, -1.5, -1.5, 10.0, -1.5, -1.5, 10.0, 1.5, // v0-v5-v6-v1 up
    -1.5, 10.0, 1.5, -1.5, 10.0, -1.5, -1.5, 0.0, -1.5, -1.5, 0.0, 1.5, // v1-v6-v7-v2 left
    -1.5, 0.0, -1.5, 1.5, 0.0, -1.5, 1.5, 0.0, 1.5, -1.5, 0.0, 1.5, // v7-v4-v3-v2 down
    1.5, 0.0, -1.5, -1.5, 0.0, -1.5, -1.5, 10.0, -1.5, 1.5, 10.0, -1.5  // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // right
    8, 9, 10, 8, 10, 11,    // up
    12, 13, 14, 12, 14, 15,    // left
    16, 17, 18, 16, 18, 19,    // down
    20, 21, 22, 20, 22, 23     // back
  ]);



  // Write the vertex property to buffers 
  if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();

function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor) {
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //pushMatrix(g_modelMatrix);

  //Base
  //var arm1Length = 10.0; // Length of arm1
  g_modelMatrix.setTranslate(0.0, -12.0, 0.0);
  g_modelMatrix.scale(3.5, 0.2, 3.5);
  drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor, [1.0, 1.0, 0.0, 1.0]); // Draw

  //Suporte
  g_modelMatrix.translate(0.0, 10.0, 0.0);
  g_modelMatrix.rotate(g_supportAngle, 0.0, 1.0, 0.0);
  g_modelMatrix.scale(0.3, 5.0, 0.3);
  drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor, [1.0, 0.0, 1.0, 1.0]);

  //Parte 1 
  g_modelMatrix.translate(0.0, 10, 0.0);
  g_modelMatrix.rotate(g_joint1Angle, 1.0, 0.0, 0.0);
  g_modelMatrix.scale(1.3, 1.2, 1.3);
  drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor, [0.0, 0.0, 1.0, 1.0]);

  //Parte 2
  g_modelMatrix.translate(0.0, 10, 0.0);
  g_modelMatrix.scale(1.3, 0.15, 0.5);
  drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor, [1.0, 1.0, 1.0, 1.0]);

  pushMatrix(g_modelMatrix);

  //Finger 1
  g_modelMatrix.translate(1.0, 10.0, 0.0);
  g_modelMatrix.scale(0.2, 0.8, 0.3);
  g_modelMatrix.rotate(-g_fingerAngle, 0.0, 0.0, 1.0);
  drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor, [0.0, 0.0, 1.0, 1.0]);

  g_modelMatrix = popMatrix();
  pushMatrix(g_modelMatrix);

  //Finger 2
  g_modelMatrix.translate(-1.0, 10, 0.0);
  g_modelMatrix.scale(0.2, 0.8, 0.3);
  g_modelMatrix.rotate(g_fingerAngle, 0.0, 0.0, 1.0);
  drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor, [0.0, 0.0, 1.0, 1.0]);
}

// Draw the cube
function drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_FragColor, cor) {
  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
  gl.uniform4f(u_FragColor, cor[0], cor[1], cor[2], cor[3]);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}