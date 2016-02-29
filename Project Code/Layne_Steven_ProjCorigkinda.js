//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex Shader Program 
var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'attribute vec4 a_Color;\n' +
'attribute vec4 a_Normal;\n' +
'uniform mat4 u_ProjMatrix;\n' +
'uniform mat4 u_ViewMatrix;\n' +
'uniform mat4 u_ModelMatrix;\n' +
'uniform mat4 u_NormalMatrix;\n' +
'uniform vec3 u_Ke;\n' +
'uniform vec3 u_Kd;\n' +
'uniform vec3 u_Ka;\n' +
'uniform vec3 u_Ks;\n' +
'varying vec3 v_Ke;\n' +
'varying vec3 v_Kd;\n' +
'varying vec3 v_Ka;\n' +
'varying vec3 v_Ks;\n' +
'varying vec3 v_Normal;\n' +
'varying vec3 v_Position;\n' +
'void main() {\n' +
' gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
' v_Position = vec3(u_ModelMatrix * a_Position);\n' +
' v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
' v_Kd = vec3(u_Kd);\n' +
' v_Ke = vec3(u_Ke);\n' +
' v_Ks = vec3(u_Ks);\n' +
' v_Ka = vec3(u_Ka);\n' +
'}\n';

// Fragment shader program
var FSHADER_SOURCE =
'#ifdef GL_ES\n' +
'precision mediump float;\n' +
'#endif\n' +

'uniform vec3 u_light1Pos;\n' +
'uniform vec3 u_light1Amb;\n' +
'uniform vec3 u_light1Diff;\n' +
'uniform vec3 u_light1Spec;\n' +
'uniform vec3 u_EyePos;\n' +

'uniform vec3 u_light0Diff;\n' +
'uniform vec3 u_light0Spec;\n' +
'uniform vec3 u_light0Pos;\n' +
'uniform vec3 u_light0Amb;\n' +


'varying vec3 v_Normal;\n' +
'varying vec3 v_Position;\n' +

'varying vec3 v_Ke;\n' +
'varying vec3 v_Ka;\n' +
'varying vec3 v_Kd;\n' +
'varying vec3 v_Ks;\n' +

'uniform int u_Kshiny;\n' +

'void main() {\n' +
' vec3 normal = normalize(v_Normal);\n' +
' vec3 eyeDirection = normalize(u_EyePos - v_Position);\n vec3 lightDirection0 = vec3(u_light0Pos - v_Position);\n' +
' float r0 = sqrt(pow(lightDirection0.x, 2.0) + pow(lightDirection0.y, 2.0) + pow(lightDirection0.z, 2.0));\n' +
' float att0 = 1.0/(1.0+0.0*r0+0.0*pow(r0, 2.0));\n' +
' lightDirection0 = normalize(lightDirection0);\n' +
' float nDotL0 = dot(lightDirection0, normal);\n' +
' vec3 reflect0 = normalize(2.0*nDotL0*v_Normal - lightDirection0);\n' +
' float eDotR0 = dot(eyeDirection, reflect0);\n' +
' vec3 lightDirection1 = vec3(u_light1Pos - v_Position);\n' +
' float r1 = sqrt(pow(lightDirection1.x, 2.0) + pow(lightDirection1.y, 2.0) + pow(lightDirection1.z, 2.0));\n' +
' float att1 = 1.0/(1.0+0.0*r1+0.0*pow(r1, 2.0));\n' +
' lightDirection1 = normalize(lightDirection1);\n' +
' float nDotL1 = dot(lightDirection1, normal);\n' +
' vec3 reflect1 = normalize(2.0*nDotL1*v_Normal - lightDirection1);\n' +
' float eDotR1 = dot(eyeDirection, reflect1);\n' +
' vec3 emissive = v_Ke;\n' +
' vec3 ambient = v_Ka*(u_light0Amb + u_light1Amb);\n' +
' vec3 diffuse = v_Kd*(att0*(max(0.0, nDotL0)*u_light0Diff)+att1*(max(0.0, nDotL1)*u_light1Diff));\n' +
' vec3 specular = v_Ks*(att0*u_light0Spec*pow(max(0.0, eDotR0), float(u_Kshiny)) + att1*u_light1Spec*pow(max(0.0, eDotR1), float(u_Kshiny)));\n' +
'   gl_FragColor = vec4(1.0*emissive + 1.0*ambient + 1.0*diffuse + 1.0*specular, 1.0);\n' +
'}\n';

// Global Variables
var ANGLE_STEP = 45.0;
var ANGLE_STEP2 = 45.0;     // Rotation angle rate (degrees/second)
var floatsPerVertex = 10;  // # of Float32Array elements used for each vertex
                          // (x,y,z,w)position + (r,g,b)color
                          // Later, see if you can add:
                          // (x,y,z) surface normal + (tx,ty) texture addr.

var currentAngle = 0.0;
var currentAngle2 = 0.0;
var modelMatrix;
var projMatrix;
var u_ModelMatrix;
var u_ProjMatrix;
var normalMatrix;
var u_NormalMatrix;
var mvpMatrix;
var u_MvpMatrix;
var viewMatrix;
var normal = new Float32Array([1,-3, 0]); //arbitrary normal vector assign these to all shapes you dont want to shade. Should be parallel to light source


// Global vars for mouse click-and-drag for rotation.
var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0; 

var g_EyeX = 0.0, g_EyeY = 0.0, g_EyeZ = 0.0; //origin
var uX = 0.0, uY = 0.0, uZ = 1.0; //Stagnant
var lX = 1.0, lY = 0.0, lZ = 0.0; //
var theta = 0;


function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

    canvas.width = window.innerWidth*0.98;
    canvas.height = window.innerHeight*0.98;
    
    

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
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    u_light0Pos = gl.getUniformLocation(gl.program, 'u_light0Pos');
    u_light0Amb = gl.getUniformLocation(gl.program, 'u_light0Amb');
    u_light0Diff = gl.getUniformLocation(gl.program, 'u_light0Diff');
    u_light0Spec = gl.getUniformLocation(gl.program, 'u_light0Spec');
    
    u_light1Pos = gl.getUniformLocation(gl.program, 'u_light1Pos');
    u_light1Amb = gl.getUniformLocation(gl.program, 'u_light1Amb');
    u_light1Diff = gl.getUniformLocation(gl.program, 'u_light1Diff');
    u_light1Spec = gl.getUniformLocation(gl.program, 'u_light1Spec');
    
    if( !u_light0Pos || !u_light0Amb || !u_light0Diff || !u_light0Spec
    ||  !u_light1Pos || !u_light1Amb || !u_light1Diff || !u_light1Spec  ) {
      console.log('Failed to get the lights storage locations');
      return;
    }
    

    u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
    u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
    u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
    u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
    u_Kshiny = gl.getUniformLocation(gl.program, 'u_Kshiny');
    
    if(!u_Ke || !u_Ka  ||
     !u_Kd ||
      !u_Ks 
      || !u_Kshiny
     ) {
    console.log('Failed to get the Phong Reflectance storage locations');
  }
    

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    
    if (!u_ModelMatrix  || !u_ProjMatrix || !u_NormalMatrix || !u_ViewMatrix) {
      console.log('Failed to get matrix storage locations');
      return;
    }
    
    //Eye pos
    u_EyePos = gl.getUniformLocation(gl.program, 'u_EyePos');
    
    if (!u_EyePos) {
      console.log('Failed to get u_EyePos storage location');
      return;
    }
    
    
    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    
    var modelMatrix = new Matrix4();
  var viewMatrix = new Matrix4();
  var projMatrix = new Matrix4();
  var normalMatrix = new Matrix4();
    
    var tick = function() {
    
    currentAngle = animate(currentAngle);
    draw(gl, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix, u_ModelMatrix, modelMatrix, u_NormalMatrix, normalMatrix);
    requestAnimationFrame(tick, canvas);
    
  }
  
  document.onkeydown = function(ev) { keydown(ev, gl, u_ViewMatrix, viewMatrix, 
                               u_ProjMatrix, projMatrix, 
                               u_ModelMatrix, modelMatrix);};
    
    window.addEventListener('resize', function() {
      canvas.width = window.innerWidth*0.99;
      canvas.height = window.innerHeight*0.99;
      gl = getWebGLContext(canvas);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      //currentAngle = animate(currentAngle);
    //draw(gl, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix, u_ModelMatrix, modelMatrix);
    }, false);
    
    light0Pos = new Vector3([-3.0, 5.0, 2.5]);
    light0Amb = new Vector3([0.15, 0.15, 0.15]);
    light0Diff = new Vector3([1.0, 1.0, 1.0]);
    light0Spec = new Vector3([1.0, 1.0, 1.0]);
    
    light1Amb = new Vector3([0.15, 0.15, 0.15]);
    light1Diff = new Vector3([1.0, 1.0, 1.0]);
    light1Spec = new Vector3([1.0, 1.0, 1.0]);
    
    
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  tick();
  

  }


function initVertexBuffers(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.
 
 	// Make each 3D shape in its own array of vertices:
  makeCylinder();					// create, fill the cylVerts array
  makeSphere();						// create, fill the sphVerts array
  makeTorus();						// create, fill the torVerts array
  //makeHexagon();
  makeT();
  makeAxes();
  makeSeptagon();
  makeSeptAlt();
  makeATop();
  makeGroundGrid();				// create, fill the gndVerts array
  // how many floats total needed to store all shapes?
  

  
	var mySiz = (cylVerts.length + sphVerts.length + 
							 + sepVerts.length + torVerts.length + sepAltVerts.length + topAVerts.length + tVerts.length + gndVerts.length + axesVerts.length);

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
  for(i=0,j=0; j< cylVerts.length; i++,j++) {
  	colorShapes[i] = cylVerts[j];
		}
		sphStart = i;						// next, we'll store the sphere;
	for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphVerts[j];
		}
		sepStart = i;
	for(j=0; j< sepVerts.length; i++, j++) {
		colorShapes[i] = sepVerts[j];
		}
    torStart = i;           // next, we'll store the sphere;
  for(j=0; j< torVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = torVerts[j];
    }
    septAStart = i;           // next, we'll store the sphere;
  for(j=0; j< sepAltVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = sepAltVerts[j];
    }
    axStart = i;
  for(j=0; j< axesVerts.length; i++, j++) {
    colorShapes[i] = axesVerts[j];
    }
    topAStart = i;
    for(j=0; j< topAVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = topAVerts[j];
    }
    tStart = i;
    for(j=0; j< tVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = tVerts[j];
    }
    gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		colorShapes[i] = gndVerts[j];
		}
  // Create a buffer object on the graphics hardware:
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  // Use handle to specify how to retrieve **POSITION** data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  /*var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }*/
  // Use handle to specify how to retrieve **COLOR** data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * floatsPerVertex, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data
    
    //normal
    
    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if(a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
    }
    // Use handle to specify how to retrieve color data from our VBO:
    gl.vertexAttribPointer(
                           a_Normal, 				// choose Vertex Shader attribute to fill with data
                           3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
                           gl.FLOAT, 			// data type for each value: usually gl.FLOAT
                           false, 					// did we supply fixed-point data AND it needs normalizing?
                           FSIZE * floatsPerVertex, 			// Stride -- how many bytes used to store each vertex?
                           // (x,y,z,w, r,g,b) * bytes/value
                           FSIZE * 7);			// Offset -- how many bytes from START of buffer to the
    // value we will actually use?  Need to skip over x,y,z,w
    
    gl.enableVertexAttribArray(a_Normal);

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from g_EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on g_EyeX position.


function keydown(ev, currentAngle, currentAngle2, gl, u_ModelMatrix, modelMatrix, projMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

    if(ev.keyCode == 39) { // The right arrow key was pressed
//      g_EyeX += 0.01;
        g_EyeY -= 0.1;    // INCREASED for perspective camera)
        lY -= 0.1;    // INCREASED for perspective camera)
    } else 
    if (ev.keyCode == 37) { // The left arrow key was pressed
//      g_EyeX -= 0.01;
        g_EyeY += 0.1;    // INCREASED for perspective camera)
        lY += 0.1;    // INCREASED for perspective camera)
    } else
    if(ev.keyCode == 38) { // The up arrow key was pressed
//      g_EyeX += 0.01;
        g_EyeZ += 0.1;    // INCREASED for perspective camera)
        lZ += 0.1;    // INCREASED for perspective camera)
    } else 
    if(ev.keyCode == 40) { // The down arrow key was pressed
//      g_EyeX += 0.01;
        g_EyeZ -= 0.1;    // INCREASED for perspective camera)
        lZ -= 0.1;    // INCREASED for perspective camera)
    } else 

    if(ev.keyCode == 65) { // The a key was pressed
        
        theta += .05;
        console.log('a key');
        lX = g_EyeX + Math.cos(theta);
        lY = g_EyeY + Math.sin(theta);
        console.log('lx and ly: ' +lX +' '+ lY);
        console.log('Theta: ' + Math.cos(theta));
        //lX += 0.1;

    } else 
	    if(ev.keyCode == 188) { // The , key was pressed
        lX -= 0.1; //displace x
		g_EyeX -= 0.1;

    } else 
    if(ev.keyCode == 190) { // The . key was pressed
        lX += 0.1; //displace x
		g_EyeX += 0.1; 
    } else
	
    if(ev.keyCode == 83) { // The s key was pressed
        theta -= .05;
        console.log('a key');
        lX = g_EyeX + Math.cos(theta);
        lY = g_EyeY + Math.sin(theta);
        console.log('lx and ly: ' +lX +' '+ lY);
        console.log('Theta: ' + Math.cos(theta));
        console.log('s key pressed');
    } else
    if(ev.keyCode == 68) { // The d key was pressed
        lZ += 0.01; //tilt of the camera
		//g_EyeZ += 0.01;
    } else 
    if(ev.keyCode == 70) { // The f key was pressed
        lZ -= 0.01; //tilt of the camera
		//g_EyeZ += 0.01;
    } else
	if(ev.keyCode == 219){ //controls { //
		ySpeed -= 1;
		console.log("ySpeed: " + ySpeed);
	}else 
	if(ev.keyCode == 221){ //controls } //
		ySpeed += 1;
		console.log("ySpeed: " + ySpeed);
	}
	else 
    { return; } // Prevent the unnecessary drawing
    draw(gl, currentAngle, currentAngle2, u_ModelMatrix, modelMatrix, projMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix);
}

function draw(gl, currentAngle, currentAngle2, u_ModelMatrix, modelMatrix, projMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var canvas = document.getElementById('webgl'); 
  // Using OpenGL/ WebGL 'viewports':
  // these determine the mapping of CVV to the 'drawing context',
	// (for WebGL, the 'gl' context describes how we draw inside an HTML-5 canvas)
	// Details? see
	//
  //  https://www.khronos.org/registry/webgl/specs/1.0/#2.3
  // Draw in the FIRST of several 'viewports'
  //------------------------------------------
	// CHANGE our default viewport:
	// gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	// to a smaller one:
		gl.viewport(0										, 				// Viewport lower-left corner
					0, 		// location(in pixels)
					canvas.width/2, 				// viewport width, height.
					canvas.height);

  // Set the matrix to be used for to set the camera view
viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,   // eye position
                        lX, lY, lZ,                // look-at point (origin)
                        uX, uY, uZ);// up vector (+y)
 projMatrix.setPerspective(40, (canvas.width/2)/canvas.height, 1, 100);
 gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
 
  // Pass the view projection matrix
   mvpMatrix.set(viewMatrix).multiply(modelMatrix);
   gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

	// Draw the scene:
	drawMyScene(gl, u_ModelMatrix, modelMatrix, u_NormalMatrix, normalMatrix, currentAngle, currentAngle2);
 
    // Draw in the SECOND of several 'viewports'
  //------------------------------------------
	 gl.viewport(canvas.width/2,        // Viewport lower-left corner
              0,                              // location(in pixels)
              canvas.width/2,        // viewport width, height.
              canvas.height);
   viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,   // eye position
                        lX, lY, lZ,                // look-at point (origin)
                        uX, uY, uZ)
    //console.log(canvas.height)
  projMatrix.setOrtho(-canvas.width/700, canvas.width/700, -canvas.height/350, canvas.height/350, 0, 100);      // near, far; (always >=0)
      
  // Pass the view projection matrix to our shaders:
  //gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 //projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
	// Draw the scene:
 drawMyScene(gl, u_ModelMatrix, modelMatrix, u_NormalMatrix, normalMatrix, currentAngle, currentAngle2);
}

function drawMyScene(myGL, myu_ModelMatrix, myModelMatrix, myu_NormalMatrix, myNormalMatrix, currentAngle, currentAngle2) {
//===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

// DON'T clear <canvas> or you'll WIPE OUT what you drew 
  // in all previous viewports!
  // myGL.clear(gl.COLOR_BUFFER_BIT);             
  
  // Draw the 'forest' in the current 'world' coord sy`stem:
  // (where +y is 'up', as defined by our setLookAt() function call above...)
  
    //console.log('currentangle2: ' + currentAngle2);
  // Drawing:
    pushMatrix(myModelMatrix);
  	myModelMatrix.setTranslate(0,0,0); //Initializes the cvv to 0,0,0
	mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
   myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	pushMatrix(myModelMatrix);
  // Draw just the the cylinder's vertices:
    myGL.drawArrays(myGL.LINES,             // use this drawing primitive, and
                gndStart/floatsPerVertex, // start at this vertex number, and
                gndVerts.length/floatsPerVertex);   // draw this many vertices
    myGL.drawArrays(myGL.LINES,
                    axStart/floatsPerVertex,
                    axesVerts.length/floatsPerVertex);
  
    myModelMatrix.translate(-7, 1, 0);
	mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
   myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                torStart/floatsPerVertex, // start at this vertex number, and
                torVerts.length/floatsPerVertex); // draw this many vertices.
	myGL.drawArrays(myGL.LINES,
              axStart/floatsPerVertex,
              axesVerts.length/floatsPerVertex);

	  	  
   myModelMatrix.translate(-1.5,-3,1);  // 'set' means DISCARD old matrix,
   mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
   myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.
	
    myModelMatrix.translate(2.5,-3,0);  // 'set' means DISCARD old matrix,
	myModelMatrix.rotate(currentAngle *2,0,0,1);
	mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
	myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	
    myNormalMatrix.setInverseOf(myModelMatrix);
    myNormalMatrix.transpose();
    myGL.uniformMatrix4fv(myu_NormalMatrix, false, myNormalMatrix.elements);
    
    myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                sphStart/floatsPerVertex, // start at this vertex number, and
                sphVerts.length/floatsPerVertex); // draw this many vertices.
  
 function buildASnake(){
        
        //head
        var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
        // why add 0.001? avoids divide-by-zero in next statement
        // in cases where user didn't drag the mouse.)
        myModelMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
        myModelMatrix.translate(0, 0, 0);
		
		mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
		
        myNormalMatrix.setInverseOf(myModelMatrix);
        myNormalMatrix.transpose();
        myGL.uniformMatrix4fv(myu_NormalMatrix, false, myNormalMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES,         // use this drawing primitive, and
                        topAStart/floatsPerVertex, // start at this vertex number, and
                        topAVerts.length / floatsPerVertex); // draw this many vertices.
        

        myModelMatrix.translate(0,2,0);
        myModelMatrix.translate(0,-1,0);
        myModelMatrix.translate(0, 1, 0);
        
        myModelMatrix.rotate(ySpeed,1,1,1);
        
        //myModelMatrix.rotate(-ySpeed,1,0,1);
		mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                        sepStart / floatsPerVertex, // start at this vertex number, and
                        7); // draw this many vertices.
        myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                        sepStart / floatsPerVertex + 7, // start at this vertex number, and
                        7); // draw this many vertices.
        myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                        sepStart / floatsPerVertex + 7 + 7,  // start at this vertex number, and
                        16);
        
        
        
        myModelMatrix.rotate(90, 1, 0, 0);
        myModelMatrix.translate(0, 0, -2);
        myModelMatrix.translate(0, 0, 1);
        
		mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);      
        myGL.drawArrays(myGL.TRIANGLE_STRIP,         // use this drawing primitive, and
                        torStart/floatsPerVertex, // start at this vertex number, and
                        torVerts.length / floatsPerVertex); // draw this many vertices.
        myModelMatrix.translate(0, 0, 1);
        
		mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);    
        myGL.drawArrays(myGL.TRIANGLE_STRIP,         // use this drawing primitive, and
                        torStart/floatsPerVertex, // start at this vertex number, and
                        torVerts.length / floatsPerVertex); // draw this many vertices.
        
        //SECOND LINK
        for (var b = 0; b<5; b++){
            myModelMatrix.rotate(-90, 1, 0, 0);
            myModelMatrix.translate(0, 1, 0);
            if (b > 2){
                if (b > 6){
                    myModelMatrix.scale(.88,.88,.88);
                }
                else{
                    
                    myModelMatrix.scale(.95,.95,.95);
                }
            }
            myModelMatrix.rotate(-ySpeed,1,0,1);
            
            //myModelMatrix.rotate(-ySpeed,1,0,1);
            
            mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
			myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
            
            myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                            sepStart / floatsPerVertex, // start at this vertex number, and
                            7); // draw this many vertices.
            myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                            sepStart / floatsPerVertex + 7, // start at this vertex number, and
                            7); // draw this many vertices.
            myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
                            sepStart / floatsPerVertex + 7 + 7,  // start at this vertex number, and
                            16);
            myModelMatrix.rotate(90, 1, 0, 0);
            myModelMatrix.translate(0, 0, -2);
            myModelMatrix.translate(0, 0, 1);
            
            myModelMatrix.rotate(ySpeed,1,0,1); //This is what causes the wriggling.
			
           	mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
			myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
			
			myGL.drawArrays(myGL.TRIANGLE_STRIP,         // use this drawing primitive, and
                            torStart/floatsPerVertex, // start at this vertex number, and
                            torVerts.length / floatsPerVertex); // draw this many vertices.
            myModelMatrix.translate(0, 0, 1);
            
            mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
			myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
			
            myGL.drawArrays(myGL.TRIANGLE_STRIP,         // use this drawing primitive, and
                            torStart/floatsPerVertex, // start at this vertex number, and
                            torVerts.length / floatsPerVertex); // draw this many vertices.
        }
        //draw tail
        myModelMatrix.rotate(-90, 1, 0, 0);
        myModelMatrix.scale(5,5,5);
        myModelMatrix.rotate(currentAngle, 0, 1, 0);
        myModelMatrix.translate(-.25, .5, .25); // Offset to keep snake balanced
		
		mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);	
        myGL.drawArrays(myGL.TRIANGLES,         // use this drawing primitive, and
                        tStart/floatsPerVertex, // start at this vertex number, and
                        tVerts.length / floatsPerVertex); // draw this many vertices.
        
    }

function buildTree(){
		  mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		  myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
		  myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
								  sepStart / floatsPerVertex,	// start at this vertex number, and
								  7);	// draw this many vertices.
		  myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
									sepStart / floatsPerVertex + 7,	// start at this vertex number, and
									7);	// draw this many vertices.
		  myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
								   sepStart / floatsPerVertex + 7 + 7,	// start at this vertex number, and
								   16);	// draw this many vertices.
			pushMatrix(myModelMatrix);
			myModelMatrix.translate(0.4,.5,0);
			myModelMatrix.rotate(-90,0,0,1);
			myModelMatrix.scale(0.05,0.05,0.05);

			myModelMatrix= popMatrix();
			pushMatrix(myModelMatrix);
			myModelMatrix.translate(-0.4, .5, 0);
			myModelMatrix.rotate(90,0,0,1);

			myModelMatrix = popMatrix();
			pushMatrix(myModelMatrix);
			// Move box so that we pivot
		  myModelMatrix.translate(0, 1, 0);
		  //myModelMatrix.scale(0.5, 0.5, 0.5);
		  myModelMatrix.rotate(-currentAngle * 1/3, 1, 1, 1);
		  myModelMatrix.rotate(xSpeed, 0, 0, 1);
		  mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		  myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
		 
		  myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
						sepStart / floatsPerVertex, // start at this vertex number, and
						7); // draw this many vertices.
		  myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
									sepStart / floatsPerVertex + 7, // start at this vertex number, and
									7); // draw this many vertices.
		  myGL.drawArrays(myGL.TRIANGLE_STRIP,        // use this drawing primitive, and
								   sepStart / floatsPerVertex + 7 + 7,  // start at this vertex number, and
								   16); 
		myGL.drawArrays(myGL.LINES,
				axStart/floatsPerVertex,
				axesVerts.length/floatsPerVertex);

		 myModelMatrix.translate(0, 1, 0);
		  myModelMatrix.scale(0.5, 0.5, 0.5);
		  myModelMatrix.rotate(-currentAngle * 1/3, 0, 0, 1);
		  
		  mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		  myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
		  myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
								  sepStart / floatsPerVertex,	// start at this vertex number, and
								  7);	// draw this many vertices.
		  myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
									sepStart / floatsPerVertex + 7,	// start at this vertex number, and
									7);	// draw this many vertices.
		  myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
								   sepStart / floatsPerVertex + 7 + 7,	// start at this vertex number, and
								   16);	// draw this many vertices.
            myModelMatrix.translate(0, 1, 0);
            myModelMatrix.scale(0.5, 0.5, 0.5);
            myModelMatrix.rotate(currentAngle * 1/2, 0, 0, 1);
			
            mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
	        myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
            myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
                            sepStart / floatsPerVertex,	// start at this vertex number, and
                            7);	// draw this many vertices.
            myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
                            sepStart / floatsPerVertex + 7,	// start at this vertex number, and
                            7);	// draw this many vertices.
            myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
                            sepStart / floatsPerVertex + 7 + 7,	// start at this vertex number, and
                            16);	// draw this many vertices.
			myGL.drawArrays(myGL.LINES,
					axStart/floatsPerVertex,
					axesVerts.length/floatsPerVertex);
            myModelMatrix.translate(0, 1, 0);
            myModelMatrix.scale(0.5, 0.5, 0.5);
            myModelMatrix.rotate(-currentAngle * 1/3, 0, 0, 1);
			
			mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
			myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
            myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
                            sepStart / floatsPerVertex,	// start at this vertex number, and
                            7);	// draw this many vertices.
            myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
                            sepStart / floatsPerVertex + 7,	// start at this vertex number, and
                            7);	// draw this many vertices.
            myGL.drawArrays(myGL.TRIANGLE_STRIP, 				// use this drawing primitive, and
                            sepStart / floatsPerVertex + 7 + 7,	// start at this vertex number, and
                            16);	// draw this many vertices.
			//--------Draw Spinning top

		 myModelMatrix.translate(-.25, .5, .25);
		  //myModelMatrix.scale(0.5, 0.5, 0.5);
		  myModelMatrix.rotate(ySpeed, 0, 0, 1);
		  //console.log("yspeed is: ", ySpeed)
		  mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
		  myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
		  myGL.drawArrays(myGL.TRIANGLES, 				// use this drawing primitive, and
								  tStart/floatsPerVertex,	// start at this vertex number, and
								  tVerts.length / floatsPerVertex);	// draw this many vertices.
		myGL.drawArrays(myGL.LINES,
				axStart/floatsPerVertex,
				axesVerts.length/floatsPerVertex);
		myModelMatrix = popMatrix();

		}
	
function build4(){
		pushMatrix(myModelMatrix);
		myModelMatrix.translate(1, 4, 0.0);
		myModelMatrix.rotate(90,1,0,0);
		buildTree();
		myModelMatrix = popMatrix();
		
		pushMatrix(myModelMatrix);
		myModelMatrix.translate(2, 7, 0.0);
		myModelMatrix.rotate(90,1,0,0);
		buildTree();
		myModelMatrix = popMatrix();
        
        pushMatrix(myModelMatrix);
        myModelMatrix.translate(6, 2, 0.0);
        myModelMatrix.rotate(90,1,0,0);
        buildTree();
        myModelMatrix = popMatrix();
        
        pushMatrix(myModelMatrix);
        myModelMatrix.translate(3, 6, 0.0);
        myModelMatrix.rotate(90,1,0,0);
        buildTree();
        myModelMatrix = popMatrix();
        
        pushMatrix(myModelMatrix);
        myModelMatrix.translate(9, 5, 0.0);
        myModelMatrix.rotate(90,1,0,0);
        buildTree();
        myModelMatrix = popMatrix();
        
		}

myModelMatrix = popMatrix();
build4();

	pushMatrix(myModelMatrix);
    myModelMatrix.translate(0,-5,0);
    myModelMatrix.rotate(90, 1, 0, 0);
    myModelMatrix.rotate(currentAngle * 1/6, 0, 0 ,1);
	mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
	myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	
    myNormalMatrix.setInverseOf(myModelMatrix);
    myNormalMatrix.transpose();
    myGL.uniformMatrix4fv(myu_NormalMatrix, false, myNormalMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES,         // use this drawing primitive, and
                    topAStart/floatsPerVertex, // start at this vertex number, and
                    topAVerts.length / floatsPerVertex); // draw this many vertices.
    
    myModelMatrix  = popMatrix();
    myModelMatrix.translate(-3, 7, 1);
    myModelMatrix.rotate(currentAngle2, 0, 0,1) ;
    //myModelMatrix.rotate(90,1,0,0);
	mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
	myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 				// use this drawing primitive, and
                    tStart/floatsPerVertex,	// start at this vertex number, and
                    tVerts.length / floatsPerVertex);	// draw this many vertices.
	mvpMatrix.set(viewMatrix).multiply(myModelMatrix);
	myGL.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    myGL.drawArrays(myGL.LINES,
                    axStart/floatsPerVertex,
                    axesVerts.length/floatsPerVertex);
    myModelMatrix.translate(-3, 7, -1);
	buildASnake();
}

function myMouseDown(ev, gl, canvas) {
    //==============================================================================
    // Called when user PRESSES down any mouse button;
    //                  (Which button?    console.log('ev.button='+ev.button);   )
    //    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
    //    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)
    
    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    //  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
    
    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
    (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
    (canvas.height/2);
    //  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
    
    isDrag = true;                      // set our mouse-dragging flag
    xMclik = x;                         // record where mouse-dragging began
    yMclik = y;
};

function myMouseMove(ev, gl, canvas) {
    //==============================================================================
    // Called when user MOVES the mouse with a button already pressed down.
    //                  (Which button?   console.log('ev.button='+ev.button);    )
    //    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
    //    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)
    
    if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'
    
    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    //  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
    
    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
    (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
    (canvas.height/2);
    //  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);
    
    // find how far we dragged the mouse:
    xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
    yMdragTot += (y - yMclik);
    xMclik = x;                         // Make next drag-measurement from here.
    yMclik = y;
    //console.log(xMdragTot);
};

function r(){
	return Math.random();
}
function makeT(){
  tVerts = new Float32Array([
//Top Side
    0, .5,-.5, 1, r(), r(), r(),normal[0], normal[1], normal[2],//B
    .5,.5,-.5, 1, r(), r(), r(), normal[0], normal[1], normal[2],//C
    .25, 1, -.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],//Top Point

     0, .5,-.5, 1, r(), r(), r(), normal[0], normal[1], normal[2],//B
     0, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//H
     .25, 1, -.25, 1, r(), r(), r(),normal[0], normal[1], normal[2], //Top Point

     0, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//H
     .5, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//E
     .25, 1, -.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],//Top Point

    .5,.5,-.5, 1, r(), r(), r(), normal[0], normal[1], normal[2],//C
    .5, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//E
    .25, 1, -.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],//Top Point
  //Bottom Side
      0, 0,-.5, 1, r(), r(), r(), normal[0], normal[1], normal[2],//A
    .5,0,-.5, 1, r(), r(), r(), normal[0], normal[1], normal[2],//D
    .25, -.5, -.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],//Bottom Point

     0, 0,-.5, 1, r(), r(), r(), normal[0], normal[1], normal[2],//A
     0, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//G
     .25, -.5, -.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],//Bottom Point

     0, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//G
     .5, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//F
     .25, -.5, -.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],//Bottom Point

    .5,0,-.5, 1, r(), r(), r(), normal[0], normal[1], normal[2],//D
    .5, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//F
    .25, -.5, -.25, 1, r(), r(), r(),normal[0], normal[1], normal[2], //Bottom Point

    //Front Side
     .5, .5, 0 , 1, r(), r(), r(),normal[0], normal[1], normal[2], //E
     .5, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//F
     .25,.25,.5,1, r(), r(),r(), normal[0], normal[1], normal[2],// Front point

     0, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//H
     .5, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//E
     .25,.25,.5,1, r(), r(),r(), normal[0], normal[1], normal[2],// Front point

      0, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//H
      0, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//G
      .25,.25,.5,1, r(), r(),r(), normal[0], normal[1], normal[2],// Front point

      0, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//G
     .5, 0, 0 , 1, r(), r(), r(),normal[0], normal[1], normal[2],//F
     .25,.25,.5,1, r(), r(),r(), normal[0], normal[1], normal[2],// Front point

      //Back Side
     .5, .5, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//C
     .5, 0, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//D
     .25,.25,-1,1, r(), r(),r(), normal[0], normal[1], normal[2],// Front point

     0, .5, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//B
     .5, .5, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//C
     .25,.25,-1,1, r(), r(),r(), normal[0], normal[1], normal[2],// Front point

      0, .5, -.5 , 1, r(), r(), r(),normal[0], normal[1], normal[2], //B
      0, 0, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//A
      .25,.25,-1,1, r(), r(),r(), normal[0], normal[1], normal[2],// Front point

      0, 0, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//A
     .5, 0, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//D
     .25,.25,-1,1, r(), r(),r(), normal[0], normal[1], normal[2],// Front point

     //Left Side

     0, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//H
    0, .5, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//B
    -.5,.25,-.25, 1, r(), r(), r(),normal[0], normal[1], normal[2], // Left point

    0, .5, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//B
     0, 0, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//A
     -.5,.25,-.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],// Left point

    0, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//G
    0, 0, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//A
    -.5,.25,-.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],// Left point

    0, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//H
    0, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//G
    -.5,.25,-.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],// Left point
         
    //Right Side

    .5, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//H
    .5, .5, -.5 , 1, r(), r(), r(),normal[0], normal[1], normal[2],//B
    1,.25,-.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],// Left point

    .5, .5, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//B
    .5, 0, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//A
    1,.25,-.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],// Left point

    .5, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//G
    .5, 0, -.5 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//A
    1,.25,-.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],// Left point

    .5, .5, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//H
    .5, 0, 0 , 1, r(), r(), r(), normal[0], normal[1], normal[2],//G
    1,.25,-.25, 1, r(), r(), r(), normal[0], normal[1], normal[2],// Left point



    ]);
  }

function makeATop(){ //uses real normals
    trinorm1 = normalize(cross(makeV(new Vector3([.2, 1, .2]), new Vector3([.2, 1, -.2])), makeV(new Vector3([.2, 1, .2]), new Vector3([0, 2, 0]))));
    var aa = trinorm1.elements[0];
    var bb = trinorm1.elements[1];
    var cc = trinorm1.elements[2];
    
    trinorm2 = normalize(cross(makeV(new Vector3([.2, 1, .2]), new Vector3([-.2, 1, .2])), makeV(new Vector3([.2, 1, .2]), new Vector3([0.0,2,0.0]))));
    var dd = trinorm2.elements[0];
    var ee = trinorm2.elements[1];
    var ff = trinorm2.elements[2];
    
    trinorm3 = normalize(cross(makeV(new Vector3([-.2, 1, .2, 1]), new Vector3([-.2, 1, -.2])), makeV(new Vector3([-.2, 1, .2, 1]), new Vector3([0,2,0]))));
    var gg = trinorm3.elements[0];
    var hh = trinorm3.elements[1];
    var ii = trinorm3.elements[2];
    
    trinorm4 = normalize(cross(makeV(new Vector3([.2, 1, -.2]), new Vector3([-.2, 1, -.2])), makeV(new Vector3([.2, 1, -.2]), new Vector3([0, 2, 0]))));
    var jj = trinorm4.elements[0];
    var kk = trinorm4.elements[1];
    var ll = trinorm4.elements[2];
   
    trinorm5 = normalize(cross(makeV(new Vector3([.2, 1, .2]), new Vector3([.2, 1, -.2])), makeV(new Vector3([.2, 1, .2]), new Vector3([0, 0, 0]))));
    var mm = trinorm5.elements[0];
    var nn = trinorm5.elements[1];
    var oo = trinorm5.elements[2];
    
    trinorm6 = normalize(cross(makeV(new Vector3([.2, 1, .2]), new Vector3([-.2, 1, .2])), makeV(new Vector3([.2, 1, .2]), new Vector3([0, 0, 0]))));
    var pp = trinorm6.elements[0];
    var qq = trinorm6.elements[1];
    var rr = trinorm6.elements[2];
    
    trinorm7 = normalize(cross(makeV(new Vector3([-.2, 1, .2]), new Vector3([-.2, 1, -.2])), makeV(new Vector3([-.2, 1, .2]), new Vector3([0, 0, 0]))));
    var ss = trinorm7.elements[0];
    var tt = trinorm7.elements[1];
    var uu = trinorm7.elements[2];
    
    trinorm8 = normalize(cross(makeV(new Vector3([.2, 1, -.2]), new Vector3([-.2, 1, -.2])), makeV(new Vector3([.2, 1, -.2]), new Vector3([0, 0, 0]))));
    var vv = trinorm8.elements[0];
    var ww = trinorm8.elements[1];
    var xx = trinorm8.elements[2];
    
    
    topAVerts = new Float32Array([
    .2, 1, .2, 1, r(), r(), r(), -aa,-bb,-cc, //1
    .2, 1, -.2, 1, r(), r(), r(),-aa,-bb,-cc, //0
    0, 2, 0, 1, r(), r(), r(),-aa,-bb,-cc, // T*/

    .2, 1, .2, 1,r(),r(),r(), -dd,-ee,-ff,//1
    -.2, 1, .2, 1,r(),r(),r(), -dd,-ee,-ff,//2
    0.0,2,0.0, 1, r(),r(),r(), -dd,-ee,-ff,// T

    -.2, 1, .2, 1,r(),r(),r(), -gg,-hh,-ii,//2
    -.2, 1, -.2, 1,r(),r(),r(),-gg,-hh,-ii, //3
    0,2,0,1, r(),r(),r(), -gg,-hh,-ii,// T

    .2, 1, -.2, 1,r(),r(),r(), -jj, -kk, -ll, //0
    -.2, 1, -.2, 1,r(),r(),r(), -jj,-kk,-ll,//3
    0, 2, 0, 1, r(), r(), r(), -jj,-kk,-ll,// T
        //bottom half
        .2, 1, .2, 1, r(), r(), r(),-mm,-nn,-oo, //1
    .2, 1, -.2, 1, r(), r(), r(),-mm,-nn,-oo, //0
    0, 0, 0, 1, r(), r(), r(),-mm,-nn,-oo, // T*/

    .2, 1, .2, 1, r(), r(), r(), -pp,-qq,-rr,//1
    -.2, 1, .2, 1, r(), r(), r(), -pp,-qq,-rr,//2
    0.0, 0, 0.0, 1, r(), r(), r(), -pp,-qq,-rr,// T

    -.2, 1, .2, 1, r(), r(), r(),-ss,-tt,-uu, //2
    -.2, 1, -.2, 1, r(), r(), r(),-ss,-tt,-uu, //3
    0, 0, 0, 1, r(), r(), r(),-ss,-tt,-uu, // T

    .2, 1, -.2, 1, r(), r(), r(),-vv,-ww,-xx, //0
    -.2, 1, -.2, 1, r(), r(), r(),-vv,-ww,-xx, //3
    0, 0, 0, 1, r(), r(), r(),-vv,-ww,-xx, // T
    ]);
  for (var c = 0; c < topAVerts.length; c++){
    if (c%floatsPerVertex == 0){
      topAVerts[c] = topAVerts[c] *5;
      topAVerts[c+2] = topAVerts[c+2] *5;
    }
  }
  //console.log(topAVerts);
}
function makeSeptAlt(){
  sepAltVerts = new Float32Array([  
    0.2,-0.4,0,1,r(),r(),r(), normal[0], normal[1], normal[2],//6
    -0.2,-0.4,0,1, r(), r(), r(), normal[0], normal[1], normal[2],//5
    0.42,-0.1,0,1, r(),r(),r(),normal[0], normal[1], normal[2], //0
    -0.42,-.1,0,1,r(),r(),r(),normal[0], normal[1], normal[2], //4
    0.35,0.29,0,1,r(),r(),r(), normal[0], normal[1], normal[2],//1
    -0.35,0.29,0,1,r(),r(),r(), normal[0], normal[1], normal[2],//3
    0,0.44,0,1,r(),r(),r(), normal[0], normal[1], normal[2], //2

    0.2,-0.4,1,1, r(), r(), r(), normal[0], normal[1], normal[2],//6'
    -0.2,-0.4,1,1, r(), r(), r(), normal[0], normal[1], normal[2],//5'
    0.42,-0.1,1,1, r(), r(), r(), normal[0], normal[1], normal[2],//0'
    -0.42,-.1,1,1,r(),r(),r(), normal[0], normal[1], normal[2],//4'
    0.35,0.29,1,1,r(),r(),r(), normal[0], normal[1], normal[2],//1'
    -0.35,0.29,1,1,r(),r(),r(), normal[0], normal[1], normal[2],//3'
    0,0.44,1,1,r(),r(),r(),  normal[0], normal[1], normal[2],//2'

    0.42,-0.1,0,1, r(),r(),r(), normal[0], normal[1], normal[2],//0
    0.42,-0.1,1,1, r(), r(), r(), normal[0], normal[1], normal[2],//0'
    0.35,0.29,0,1,r(),r(),r(), normal[0], normal[1], normal[2],//1
    0.35,0.29,1,1,r(),r(),r(), normal[0], normal[1], normal[2],//1'
  0,0.44,0,1,r(),r(),r(),  normal[0], normal[1], normal[2],//2
    0,0.44,1,1,r(),r(),r(),  normal[0], normal[1], normal[2],//2'
    -0.35,0.29,0,1,r(),r(),r(), normal[0], normal[1], normal[2],//3
    -0.35,0.29,1,1,r(),r(),r(), normal[0], normal[1], normal[2],//3'
    -0.42,-.1,0,1,r(),r(),r(), normal[0], normal[1], normal[2],//4
    -0.42,-.1,1,1,r(),r(),r(),normal[0], normal[1], normal[2], //4'
    -0.2,-0.4,0,1, r(), r(), r(),normal[0], normal[1], normal[2], //5
    -0.2,-0.4,1,1, r(), r(), r(), normal[0], normal[1], normal[2],//5'
    0.2,-0.4,0,1,r(),r(),r(),normal[0], normal[1], normal[2], //6
    0.2,-0.4,1,1, r(), r(), r(), normal[0], normal[1], normal[2],//6'
    0.42,-0.1,0,1, r(),r(),r(), normal[0], normal[1], normal[2],//0
    0.42,-0.1,1,1, r(), r(), r(), normal[0], normal[1], normal[2],//0'
  ]);  
}
function makeSeptagon() {
//==============================================================================
// Make a 4-cornered pyramid from one OpenGL TRIANGLE_STRIP primitive.
// All vertex coords are +/1 or zero; pyramid base is in xy plane.

  	// YOU write this one...

  	sepVerts = new Float32Array([  
  	0.2,0,-0.4,1,r(),r(),r(), normal[0], normal[1], normal[2], //6
  	-0.2,0,-0.4,1, r(), r(), r(), normal[0], normal[1], normal[2],//5
  	0.42,0,-0.1,1, r(),r(),r(), normal[0], normal[1], normal[2],//0
  	-0.42,0,-.1,1,r(),r(),r(),normal[0], normal[1], normal[2], //4
  	0.35,0,0.29,1,r(),r(),r(),normal[0], normal[1], normal[2], //1
  	-0.35,0,0.29,1,r(),r(),r(), normal[0], normal[1], normal[2],//3
  	0,0,0.44,1,r(),r(),r(), normal[0], normal[1], normal[2], //2

  	0.2,1,-0.4,1, r(), r(), r(), normal[0], normal[1], normal[2],//6'
  	-0.2,1,-0.4,1, r(), r(), r(), normal[0], normal[1], normal[2],//5'
  	0.42,1,-0.1,1, r(), r(), r(),normal[0], normal[1], normal[2], //0'
  	-0.42,1,-.1,1, r(), r(), r(), normal[0], normal[1], normal[2],//4'
  	0.35,1,0.29,1, r(), r(), r(), normal[0], normal[1], normal[2],//1'
  	-0.35,1,0.29,1, r(), r(), r(), normal[0], normal[1], normal[2],//3'
  	0, 1, 0.44, 1, r(), r(), r(), normal[0], normal[1], normal[2], //2'

    0.42, 0, -0.1, 1, r(), r(), r(),normal[0], normal[1], normal[2], //0
    0.42, 1, -0.1, 1, r(), r(), r(),normal[0], normal[1], normal[2],   //0
    0.35, 0, 0.29, 1, r(), r(), r(),normal[0], normal[1], normal[2],    //1'
    0.35, 1, 0.29, 1, r(), r(), r(), normal[0], normal[1], normal[2],    //1'
    0, 0, 0.44, 1, r(), r(), r(),     normal[0], normal[1], normal[2],   //2'
    0, 1, 0.44, 1, r(), r(), r(),    normal[0], normal[1], normal[2],   //2'
    -0.35, 0, 0.29, 1, r(), r(), r(), normal[0], normal[1], normal[2],//3'
    -0.35, 1, 0.29, 1, r(), r(), r(), normal[0], normal[1], normal[2],//3'
    -0.42, 0, -.1, 1, r(), r(), r(), normal[0], normal[1], normal[2],//4'
    -0.42, 1, -.1, 1, r(), r(), r(),normal[0], normal[1], normal[2], //4'
    -0.2, 0, -0.4, 1, r(), r(), r(), normal[0], normal[1], normal[2],//5'
    -0.2, 1, -0.4, 1, r(), r(), r(), normal[0], normal[1], normal[2],//5'
    0.2, 0, -0.4, 1, r(), r(), r(), normal[0], normal[1], normal[2],//6'
    0.2, 1, -0.4, 1, r(), r(), r(), normal[0], normal[1], normal[2],//6'
    0.42, 0, -0.1, 1, r(), r(), r(), normal[0], normal[1], normal[2],//0
    0.42, 1, -0.1, 1, r(), r(), r(), normal[0], normal[1], normal[2],//0


	]);  

	/*sepVerts = new Float32Array([  
  	0.2,-0.4,1,1,r(),r(),r(),
  	-0.2,-0.4,1,1, r(),r(),r(),
  	0.42,-0.1,1,1, r(),r(),r(),
  	-0.42,-.1,1,1,r(),r(),r(),
  	0.35,0.29,1,1,r(),r(),r(),
  	-0.35,0.29,1,1,r(),r(),r(),
  	0,0.44,1,1,r(),r(),r(),r(),   
	])*/
}

function makeAxes() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.
  
  // Create an (global) array to hold this ground-plane's vertices:
  axesVerts = new Float32Array([
    0, 0, 0, 1, 1, 0, 0, normal[0], normal[1], normal[2],
    1, 0, 0, 1, 1, 0, 0, normal[0], normal[1], normal[2],
    0, 0, 0, 1, 0, 1, 0, normal[0], normal[1], normal[2],
    0, 1, 0, 1, 0, 1, 0, normal[0], normal[1], normal[2],
    0, 0, 0, 1, 0, 0, 1, normal[0], normal[1], normal[2],
    0, 0, 1, 1, 0, 0, 1, normal[0], normal[1], normal[2],
  ]);
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
}


function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var ctrColr = new Float32Array([0.2, 0.2, 0.2]);	// dark gray
 var topColr = new Float32Array([0.4, 0.7, 0.4]);	// light green
 var botColr = new Float32Array([0.5, 0.5, 1.0]);	// light blue
 var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.6;		// radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] = 1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
			cylVerts[j+4]=ctrColr[0]; 
			cylVerts[j+5]=ctrColr[1]; 
			cylVerts[j+6]=ctrColr[2];
            cylVerts[j+7]=normal[0];
            cylVerts[j+8]=normal[1];
            cylVerts[j+9]=normal[2];
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=topColr[0]; 
			cylVerts[j+5]=topColr[1]; 
			cylVerts[j+6]=topColr[2];
            cylVerts[j+7]=normal[0];
            cylVerts[j+8]=normal[1];
            cylVerts[j+9]=normal[2];
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=topColr[0]; 
				cylVerts[j+5]=topColr[1]; 
				cylVerts[j+6]=topColr[2];
                cylVerts[j+7]=normal[0];
                cylVerts[j+8]=normal[1];
                cylVerts[j+9]=normal[2];
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=botColr[0]; 
				cylVerts[j+5]=botColr[1]; 
				cylVerts[j+6]=botColr[2];
                cylVerts[j+7]=normal[0];
                cylVerts[j+8]=normal[1];
                cylVerts[j+9]=normal[2];
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=botColr[0]; 
			cylVerts[j+5]=botColr[1]; 
			cylVerts[j+6]=botColr[2];
            cylVerts[j+7]=normal[0];
            cylVerts[j+8]=normal[1];
            cylVerts[j+9]=normal[2];
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =-1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
			cylVerts[j+4]=botColr[0]; 
			cylVerts[j+5]=botColr[1]; 
			cylVerts[j+6]=botColr[2];
            cylVerts[j+7]=normal[0];
            cylVerts[j+8]=normal[1];
            cylVerts[j+9]=normal[2];
		}
	}
}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.

	// Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.
										
	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;	
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;	
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = cos0;		
				sphVerts[j+3] = 1.0;
                sphVerts[j+7] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); ;
                sphVerts[j+8] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);
                sphVerts[j+9] = cos0;
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;
                sphVerts[j+7] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
                sphVerts[j+8] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
                sphVerts[j+9] = cos1;
                // w.
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=topColr[0]; 
				sphVerts[j+5]=topColr[1]; 
				sphVerts[j+6]=topColr[2];

				}
			else if(s==slices-1) {
				sphVerts[j+4]=botColr[0]; 
				sphVerts[j+5]=botColr[1]; 
				sphVerts[j+6]=botColr[2];	
			}
			else {
					sphVerts[j+4]=Math.random();// equColr[0]; 
					sphVerts[j+5]=Math.random();// equColr[1]; 
					sphVerts[j+6]=Math.random();// equColr[2];					
			}
		}
	}
}

function makeTorus() {
//==============================================================================
// 		Create a torus centered at the origin that circles the z axis.  
// Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
// into a circle around the z-axis. The bent bar's centerline forms a circle
// entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
// bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
// around the z-axis in counter-clockwise (CCW) direction, consistent with our
// right-handed coordinate system.
// 		This bent bar forms a torus because the bar itself has a circular cross-
// section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
// around the bar's centerline, circling right-handed along the direction 
// forward from the bar's start at theta=0 towards its end at theta=2PI.
// 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
// a slight increase in phi moves that point in -z direction and a slight
// increase in theta moves that point in the +y direction.  
// To construct the torus, begin with the circle at the start of the bar:
//					xc = rbend + rbar*cos(phi); 
//					yc = 0; 
//					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
// and then rotate this circle around the z-axis by angle theta:
//					x = xc*cos(theta) - yc*sin(theta) 	
//					y = xc*sin(theta) + yc*cos(theta)
//					z = zc
// Simplify: yc==0, so
//					x = (rbend + rbar*cos(phi))*cos(theta)
//					y = (rbend + rbar*cos(phi))*sin(theta) 
//					z = -rbar*sin(phi)
// To construct a torus from a single triangle-strip, make a 'stepped spiral' along the length of the bent bar; successive rings of constant-theta, using the same design used for cylinder walls in 'makeCyl()' and for 'slices' in makeSphere().  Unlike the cylinder and sphere, we have no 'special case' for the first and last of these bar-encircling rings.
//
var rbend = 1.0;										// Radius of circle formed by torus' bent bar
var rbar = 0.5;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the 
																		// number of vertices in its cross-section)
																		// >=3 req'd;
																		// more sides for more-circular cross-section
// for nice-looking torus with approx square facets, 
//			--choose odd or prime#  for barSides, and
//			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
// EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.

	// Create a (global) array to hold this torus's vertices:
 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
//	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
// triangle and last slice will skip its last triangle. To 'close' the torus,
// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																			// (WHY HALF? 2 vertices per step in phi)
	// s counts slices of the bar; v counts vertices within one slice; j counts
	// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=floatsPerVertex) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
            torVerts[j+7] = normal[0];
            torVerts[j+8] = normal[1];
            torVerts[j+9] = normal[2];
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
            torVerts[j+7] = normal[0];
            torVerts[j+8] = normal[1];
            torVerts[j+9] = normal[2];
			j+=7; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
            torVerts[j+7] = normal[0];
            torVerts[j+8] = normal[1];
            torVerts[j+9] = normal[2];}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 100;     // # of lines to draw in x,y to make the grid.
  var ycount = 100;   
  var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([1.0, 1.0, 0.3]);  // bright yellow
  var yColr = new Float32Array([0.5, 1.0, 0.5]);  // bright green.

  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    gndVerts[j+4] = xColr[0];     // red
    gndVerts[j+5] = xColr[1];     // grn
    gndVerts[j+6] = xColr[2];     // blu
    gndVerts[j+7] = normal[0];
    gndVerts[j+8] = normal[1];
    gndVerts[j+9] = normal[2];
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    gndVerts[j+4] = yColr[0];     // red
    gndVerts[j+5] = yColr[1];     // grn
    gndVerts[j+6] = yColr[2];     // blu
    gndVerts[j+7] = normal[0];
    gndVerts[j+8] = normal[1];
    gndVerts[j+9] = normal[2];
  }
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate2(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >   20.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle <  -85.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    //console.log(elapsed);
  return newAngle %= 360;
}

var g_last = Date.now();
var ANGLE_STEP2 = 45;

function animate(angle) {
    //==============================================================================
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last + 5;
    g_last = now;
    
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP2 * elapsed) / 1000.0;
    if(newAngle > 180.0) newAngle = newAngle - 360.0;
    if(newAngle <-180.0) newAngle = newAngle + 360.0;
    //console.log(elapsed +5);
    return newAngle;
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}
 function clearDrag() {
// Called when user presses 'Clear' button in our webpage
  xMdragTot = 0.0;
  yMdragTot = 0.0;
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function spinUp() {
  ANGLE_STEP += 25; 
}



function winResize() {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="winResize()">

  var nuCanvas = document.getElementById('webgl');  // get current canvas
  var nuGL = getWebGLContext(nuCanvas);             // and context:

  //Report our current browser-window contents:

//  console.log('nuCanvas width,height=', nuCanvas.width, nuCanvas.height);
 //console.log('Browser window: innerWidth,innerHeight=',
                       //         innerWidth, innerHeight); // http://www.w3schools.com/jsref/obj_window.asp

  
  //Make canvas fill the top 3/4 of our browser window:
  nuCanvas.width = innerWidth;
  nuCanvas.height = innerHeight*3/4;
  //IMPORTANT!  need to re-draw screen contents
  draw(nuGL, currentAngle, currentAngle2, u_ModelMatrix, modelMatrix, projMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix);
     
}

function cross(a, b){
    if (a.elements.length == 4){
        return new Vector4([(a.elements[1] * b.elements[2]) - (a.elements[2] * b.elements[1]) ,
                            (a.elements[2] *b.elements[0]) - (a.elements[0] * b.elements[2]),
                            (a.elements[0] * b.elements[1]) - (a.elements[1] * b.elements[0]),
                            1]);
    }
    if(a.elements.length == 3){
        return new Vector3([
                            (a.elements[1] * b.elements[2]) - (a.elements[2] * b.elements[1]) ,
                            (a.elements[2] *b.elements[0]) - (a.elements[0] * b.elements[2]),
                            (a.elements[0] * b.elements[1]) - (a.elements[1] * b.elements[0])
                            ])
    }
}
function makeV(p1, p2){
    
    if((p1.elements.length == 3) & (p2.elements.length == 3)){
        unitVec = new Vector3([p1.elements[0] - p2.elements[0], p1.elements[1] - p2.elements[1], p1.elements[2] - p2.elements[2]]);
    }if((p1.elements.length == 4) & (p2.elements.length == 4)){
        unitVec = new Vector4([p1.elements[0] - p2.elements[0], p1.elements[1] - p2.elements[1], p1.elements[2] - p2.elements[2], p1.elements[3] - p2.elements[3]]);
    }
    return unitVec;
}

function normalize(aVec){
    total = 0;
    for(i = 0; i < aVec.elements.length; i++)
    {
        total = total + (aVec.elements[i] * aVec.elements[i]);
        //console.log('Total: ' + total);
    }
    magnitude = Math.sqrt(total);
    if(aVec.elements.length == 3){
        unitVec = new Vector3;
    }else{
        unitVec = new Vector4; 
        //console.log('Vec 4: ' + magnitude);
    }
    for(i = 0; i < aVec.elements.length; i++)
    {
        unitVec.elements[i] = (aVec.elements[i] / magnitude);
    }
    
    return unitVec;
}

var helpString = 'Instructions on Operating This Page! \n There are animations operating on the objects in this page.\n\nINTERACTIONS:\n- Left Arrow Key:  Translates user view the negative Y direction. \n-Right Arrow Key: Translates user view the positive Y direction\n-Up Arrow Key:  Translates user view the positive Z direction\n-Down Arrow Key:  Translates user view the negative Z direction\n < Translates the user view in the negative X direction. \n > translates the view in the positive X direction.\n- Mouse Drag: Allows the user to change the orientation of the revolving snake.\n A key: Rotates the view. \n S Key: Rotates view in opposite direction. \n [ adjust the elasticity of the swirly trees. \n ] adjust the elasticity of the swirly trees in the opposite direction. \n-Clear: Clears the effects of user mouse drags\n\nClick the Help! button again to see this message!';

function help() {
  alert(helpString);
}