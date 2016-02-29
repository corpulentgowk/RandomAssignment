var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
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

var floatsPerVertex = 6;
var ANGLE_STEP = 45.0;
var currentAngle = 0.0;

var up_vec = new Vector3([0.0, 0.0, 1.0]);
var right_vec = new Vector3([1.0, 0.0, 0.0]);
var forward_vec = new Vector3([0.0, 1.0, 0.0]);
var speed = 0.0;
var g_eyeX = 0.25, g_eyeY = -20.0, g_eyeZ = 4.60;
var g_lookX = 0.0, g_lookY = 0.0, g_lookZ = 0.0;
var MAGNITUDE = 10.0;

var gndPos, gndNorm, gndInd, gndStart;
var sphPos, sphNorm, sphInd, sphStart;
var cylPos, cylNorm, cylInd, cylStart;
var sepPos, sepNorm, sepStart;
var cubePos, cubeNorm, cubeInd, cubeStart;
var conePos, coneNorm, coneInd, coneStart;

var u_EyePos;

var light0Pos, light0Amb, light0Diff, light0Spec;
var light1Pos, light1Amb, light1Diff, light1Spec;


var u_light0Pos, u_light0Amb, u_light0Diff, u_light0Spec;
var u_light1Pos, u_light1Amb, u_light1Diff, u_light1Spec;

var u_Ke, u_Ka, u_Kd, u_Ks, u_Kshiny;
var redE = 0;
var greenE = 0;
var blueE = 0;
var redA = 0;
var greenA = 0;
var blueA = 0;
var redD = 0;
var greenD = 0;
var blueD = 0;
var redS = 0;
var greenS = 0;
var blueS = 0;


var currentAngle2 = 0;


var eVec = new Vector3([redE, greenE, blueE]); 
var aVec = new Vector3([redA, greenA, blueA]);
var dVec = new Vector3([redD, greenD, blueD]);
var sVec = new Vector3([redS, greenS, blueS]);

/*var eVec = new Vector3([0.0, 0.0, 0.0]);
var aVec = new Vector3([0.0, 0.0, 0.0]);
var dVec = new Vector3([0.0, 0.0, 0.0]);
var sVec = new Vector3([0.0, 0.0, 0.0]);*/

var eOn = false;
var aOn = false;
var dOn = false;
var sOn = false;

function main()
{
    // get Canvas
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
    
    currentAngle = animate2(currentAngle);
    currentAngle2 = currentAngle;
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

function createGnd() {


  var xcount = 500;     
  var ycount = 500;   
  var xymax = 500.0;      
  var xColr = new Float32Array([1.0, 1.0, 0.3]);  
  var yColr = new Float32Array([0.5, 1.0, 0.5]);  
  

  gndPos = new Float32Array(3*2*(xcount+ycount));
  gndInd = [];
            
  var xgap = xymax/(xcount-1);    
  var ygap = xymax/(ycount-1);    
  
  
  for(k = 0, v=0, j=0; v<2*xcount; v++, j+= 3, k++) {
    if(v%2==0) {  
      gndPos[j] = -xymax + (v  )*xgap;  
      gndPos[j+1] = -xymax;       
      gndPos[j+2] = 0.0;          
      gndInd.push(k);
    }
    else {        
      gndPos[j] = -xymax + (v-1)*xgap;  
      gndPos[j+1] = xymax;        
      gndPos[j+2] = 0.0;          
      gndInd.push(k);
    }
    gndPos[j+3] = yColr[0];    
      gndPos[j+4] = yColr[1];    
      gndPos[j+5] = yColr[2];    
  }
  
  for(v=0; v<2*ycount; v++, j+= 3, k++) {
    if(v%2==0) {    
      gndPos[j] = -xymax;         
      gndPos[j+1] = -xymax + (v  )*ygap;  
      gndPos[j+2] = 0.0;          
      gndInd.push(k);
    }
    else {          
      gndPos[j] = xymax;          
      gndPos[j+1] = -xymax + (v-1)*ygap;  
      gndPos[j+2] = 0.0;          
      gndInd.push(k);
    }
    gndPos[j+3] = yColr[0];     
      gndPos[j+4] = yColr[1];     
      gndPos[j+5] = yColr[2];     
  }
  gndNorm = new Float32Array(gndPos);
}

function createSphere()
{
  var SPHERE_DIV = 36;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  sphPos = [];
  sphInd = [];
  sphNorm = [];

  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      sphPos.push(si * sj);  
      sphPos.push(cj);       
      sphPos.push(ci * sj);  
      
      sphNorm.push(si*sj);
      sphNorm.push(cj);
      sphNorm.push(ci*sj);
    }
  }


  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      sphInd.push(p1);
      sphInd.push(p2);
      sphInd.push(p1 + 1);

      sphInd.push(p1 + 1);
      sphInd.push(p2);
      sphInd.push(p2 + 1);
    }
  }
}

function createCylinder()
{
  var CYL_DIV = 36;
  var i, ai, si, ci;
  var p1, p2;
  
  cylPos = [];
  cylInd = [];
  cylNorm = [];
  
  cylPos.push(0.0);
  cylPos.push(0.0);
  cylPos.push(-0.5);
  cylNorm.push(0.0);
  cylNorm.push(0.0);
  cylNorm.push(-1.0);
  for(i = 0; i <= CYL_DIV; i++) {
    ai = i * 2 * Math.PI / CYL_DIV;
    ci = Math.cos(ai);
    si = Math.sin(ai);
    cylPos.push(ci);
    cylPos.push(si);
    cylPos.push(-0.5);
    cylNorm.push(0.0);
    cylNorm.push(0.0);
    cylNorm.push(-1.0);
  }
  for(i = 0; i <= CYL_DIV; i++) {
    ai = i * 2 * Math.PI / CYL_DIV;
    ci = Math.cos(ai);
    si = Math.sin(ai);
    cylPos.push(ci);
    cylPos.push(si);
    cylPos.push(0.5);
    cylNorm.push(0.0);
    cylNorm.push(0.0);
    cylNorm.push(1.0);
  }
  cylPos.push(0.0);
  cylPos.push(0.0);
  cylPos.push(0.5);
  cylNorm.push(0.0);
  cylNorm.push(0.0);
  cylNorm.push(1.0);
  for (i = 1; i <=CYL_DIV; i++) {
    cylInd.push(0);
    cylInd.push(i);
    cylInd.push(i+1);
  }
  for (i = 1; i <= CYL_DIV; i++) {
    cylInd.push((CYL_DIV+1)*2 + 1);
    cylInd.push(CYL_DIV+i+1);
    cylInd.push(CYL_DIV+i+2);
  }
  j = (CYL_DIV+1)*2 + 1;
  for(i = 0; i <= CYL_DIV; i++) {
    ai = i * 2 * Math.PI / CYL_DIV;
    ci = Math.cos(ai);
    si = Math.sin(ai);
    cylPos.push(ci);
    cylPos.push(si);
    cylPos.push(-0.5);
    cylNorm.push(ci);
    cylNorm.push(si);
    cylNorm.push(0.0);
  }
  for(i = 0; i <= CYL_DIV; i++) {
    ai = i * 2 * Math.PI / CYL_DIV;
    ci = Math.cos(ai);
    si = Math.sin(ai);
    cylPos.push(ci);
    cylPos.push(si);
    cylPos.push(0.5);
    cylNorm.push(ci);
    cylNorm.push(si);
    cylNorm.push(0.0);
  }
  for (i = 1; i <=CYL_DIV; i++) {
    cylInd.push(j+i);
    cylInd.push(j+i+CYL_DIV+1);
    cylInd.push(j+i+1);
    
    cylInd.push(j+i+CYL_DIV+1);
    cylInd.push(j+i+CYL_DIV+2);
    cylInd.push(j+i+1);
  }
}

function createCone()
{
  var CONE_DIV = 72;
  var i, ai, si, ci, j;
  conePos = [];
  coneNorm = [];
  coneInd = [];
  conePos.push(0.0);
  conePos.push(0.0);
  conePos.push(0.0);
  coneNorm.push(0.0);
  coneNorm.push(0.0);
  coneNorm.push(-1.0);
  for(i = 0; i <= CONE_DIV; i++) {
    ai = i * 2 * Math.PI / CONE_DIV;
    ci = Math.cos(ai);
    si = Math.sin(ai);
    conePos.push(ci);
    conePos.push(si);
    conePos.push(0.0);
    coneNorm.push(0.0);
    coneNorm.push(0.0);
    coneNorm.push(-1.0);
  }
  for(i = 0; i <= CONE_DIV; i++) {
    ai = i * 2 * Math.PI / CONE_DIV;
    ci = Math.cos(ai);
    si = Math.sin(ai);
    conePos.push(ci);
    conePos.push(si);
    conePos.push(0.0);
    coneNorm.push(ci/Math.sqrt(2));
    coneNorm.push(si/Math.sqrt(2));
    coneNorm.push(1/Math.sqrt(2));
  }
  for(i = 0; i <= CONE_DIV; i++) {
    ai = i * 2 * Math.PI / CONE_DIV;
    ci = Math.cos(ai);
    si = Math.sin(ai);
    conePos.push(0.0);
    conePos.push(0.0);
    conePos.push(1.0);
    coneNorm.push(ci/Math.sqrt(2));
    coneNorm.push(si/Math.sqrt(2));
    coneNorm.push(1/Math.sqrt(2));
  }
  for (i = 1; i <=CONE_DIV; i++) {
    coneInd.push(0);
    coneInd.push(i);
    coneInd.push(i+1);
  }
  j = CONE_DIV + 1;
  for (i = 1; i <=CONE_DIV; i++) {
    coneInd.push(j+i);
    coneInd.push(j*2+i);
    coneInd.push(j+i+1);
  }
}

function makeSeptagon() {
//==============================================================================
// Make a 4-cornered pyramid from one OpenGL TRIANGLE_STRIP primitive.
// All vertex coords are +/1 or zero; pyramid base is in xy plane.

    // YOU write this one...

    sepPos = new Float32Array([  
   /* 0.2,0,-0.4,      //6
    -0.2,0,-0.4,     //5
    0.42,0,-0.1,     //0
    -0.42,0,-.1,     //4
    0.35,0,0.29,    //1
    -0.35,0,0.29,    //3
    0,0,0.44,        //2

    0.2,1,-0.4,      //6'
    -0.2,1,-0.4,     //5'
    0.42,1,-0.1,     //0'
    -0.42,1,-.1,     //4'
    0.35,1,0.29,     //1'
    -0.35,1,0.29,    //3'
    0, 1, 0.44,      //2'*/

    0.42, 0, -0.1,  //0 1
    0.42, 1, -0.1,  //0 2
    0.35, 0, 0.29,   //1' 3
    0.35, 1, 0.29,  //1' 4
    0, 0, 0.44,      //2' 5
    0, 1, 0.44,      //2' 6
    -0.35, 0, 0.29,  //3' 7
    -0.35, 1, 0.29,  //3' 8
    -0.42, 0, -.1,   //4' 9
    -0.42, 1, -.1,   //4' 10
    -0.2, 0, -0.4,   //5' 11
    -0.2, 1, -0.4,   //5' 12
    0.2, 0, -0.4,    //6' 13
    0.2, 1, -0.4,    //6' 14
    0.42, 0, -0.1,   //0 15
    0.42, 1, -0.1,   //0 16
  ]);
  
  sepNorm = new Float32Array([
    /*0, 0, 1, 
    0, 0, 1, 
    0, 0, 1, 
    0, 0, 1,
    0, 0, -1, 
    0, 0, -1, 
    0, 0, -1, 
    0, 0, -1,
    0, 1, 0, 
    0, 1, 0, 
    0, -1, 0, 
    0, -1, 0,*/
    0, 1, 0, 
    0, 1, 0, 
    0, -1, 0, 
    0, -1, 0,
    1, 0, 0,
    -1, 0, 0,
    1, 0, 0, 
    -1, 0, 0,
    1, 0, 0, 
    -1, 0, 0, 
    1, 0, 0, 
    -1, 0, 0,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, -1,
    0, 0, -1
    ]);

    sepInd = [0, 1, 2, 
         1, 2, 3,
         4, 5, 6, 
         5, 6, 7,
         10, 11, 14, 
         11, 14, 15,
         8, 9, 12, 
         9, 12, 13,];
}


function createCube()
{
  cubePos = new Float32Array([
    0.5, 0.5, 0.5,    
    -0.5, 0.5, 0.5,   
    0.5, -0.5, 0.5,   
    -0.5, -0.5, 0.5,  
    0.5, 0.5, -0.5,   
    -0.5, 0.5, -0.5,  
    0.5, -0.5, -0.5,  
    -0.5, -0.5, -0.5, 
    0.5, 0.5, 0.5,    
    -0.5, 0.5, 0.5,   
    0.5, -0.5, 0.5,   
    -0.5, -0.5, 0.5,  
    0.5, 0.5, -0.5,   
    -0.5, 0.5, -0.5,  
    0.5, -0.5, -0.5,  
    -0.5, -0.5, -0.5, 
    0.5, 0.5, 0.5,    
    -0.5, 0.5, 0.5,   
    0.5, -0.5, 0.5,   
    -0.5, -0.5, 0.5,  
    0.5, 0.5, -0.5,   
    -0.5, 0.5, -0.5,  
    0.5, -0.5, -0.5,  
    -0.5, -0.5, -0.5  
    ]);
  cubeNorm = new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0,
    0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0,
    1, 0, 0, -1, 0, 0, 1, 0, 0, -1, 0, 0,
    1, 0, 0, -1, 0, 0, 1, 0, 0, -1, 0, 0]);
  cubeInd = [0, 1, 2, 
         1, 2, 3,
         4, 5, 6, 
         5, 6, 7,
         10, 11, 14, 
         11, 14, 15,
         8, 9, 12, 
         9, 12, 13,
         17, 19, 21, 
         19, 21, 23,
         16, 18, 20,
         18, 20, 22];
    
}

function initVertexBuffers(gl) { 

  createSphere();
  createGnd();
  createCylinder();
  createCube();
  createCone();
  makeSeptagon();
  var positions = [];
  var normals = [];
  var indices = [];
  
  sphStart = 0;
  for (i = 0, j = 0; i < sphInd.length; i++, j++) {
    indices.push(sphInd[i]);
  }
  for (i = 0, k = 0; i < sphPos.length; i++, k++) {
    positions.push(sphPos[i]);
    normals.push(sphNorm[i]);
  }
  
  gndStart = j*2;
  for (i = 0; i < gndInd.length; i++, j++) {
    indices.push(gndInd[i]+k/3);
  }
  for (i = 0; i < gndPos.length; i++, k++) {
    positions.push(gndPos[i]);
    normals.push(gndNorm[i]);
  }
  
  cylStart = j*2;
  for (i = 0; i < cylInd.length; i++, j++) {
    indices.push(cylInd[i]+k/3);
  }
  for (i = 0; i < cylPos.length; i++, k++) {
    positions.push(cylPos[i]);
    normals.push(cylNorm[i]);
  }
  
  cubeStart = j*2;
  for (i = 0; i < cubeInd.length; i++, j++) {
    indices.push(cubeInd[i]+k/3);
  }
  for (i = 0; i < cubePos.length; i++, k++) {
    positions.push(cubePos[i]);
    normals.push(cubeNorm[i]);
  }
  
  coneStart = j*2;
  for (i = 0; i < coneInd.length; i++, j++) {
    indices.push(coneInd[i]+k/3);
  }
  for (i = 0; i < conePos.length; i++, k++) {
    positions.push(conePos[i]);
    normals.push(coneNorm[i]);
  }
    sepStart = j*2;
  for (i = 0; i < sepInd.length; i++, j++) {
    indices.push(sepInd[i]+k/3);
  }
  for (i = 0; i < sepPos.length; i++, k++) {
    positions.push(sepPos[i]);
    normals.push(sepNorm[i]);
  }

  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(normals), gl.FLOAT, 3))  return -1;
  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

 
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create buffer
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
 
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function setPhong(gl, Ke, Ka, Kd, Ks, Kshiny)
{
  gl.uniform3f(u_Ke, Ke.x, Ke.y, Ke.z);   
  gl.uniform3f(u_Ka, Ka.x, Ka.y, Ka.z);   
  gl.uniform3f(u_Kd, Kd.x, Kd.y, Kd.z);   
  gl.uniform3f(u_Ks, Ks.x, Ks.y, Ks.z);   
  gl.uniform1i(u_Kshiny, Kshiny);       
}


var g_last = Date.now();
function animate(angle) {
  var nowT = Date.now();
  var elapsed = nowT - g_last;
  var newAngles;
  g_last = nowT;
  newAngle = (angle + ANGLE_STEP*elapsed/1000) % 360;
  g_eyeX += forward_vec.x*speed;
  g_eyeY += forward_vec.y*speed;
  g_eyeZ += forward_vec.z*speed;
  return newAngle;
}
var ANGLE_STEP2 = 45;

function animate2(angle){
      //==============================================================================
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >   20.0 && ANGLE_STEP2 > 0) ANGLE_STEP2 = -ANGLE_STEP2;
  if(angle <  -85.0 && ANGLE_STEP2 < 0) ANGLE_STEP2 = -ANGLE_STEP2;
  
  var newAngle = angle + (ANGLE_STEP2 * elapsed) / 1000.0;
    //console.log(elapsed);
  return newAngle %= 360;
}


function keydown(ev, gl, u_ViewMatrix, viewMatrix,u_ProjMatrix, projMatrix, u_ModelMatrix, modelMatrix)
{
  console.log(ev.keyCode);
  var q = new Quaternion(0,0,0,1);
  if(ev.keyCode == 39) {      //right key
    g_eyeX += 0.2;
  } else if(ev.keyCode == 37) { //left key
    g_eyeX -= 0.2;
  } else if(ev.keyCode == 87) { //w key
    q.setFromAxisAngle(right_vec.x,right_vec.y,right_vec.z, 0.50);
    q.multiplyVector3(forward_vec);
    q.multiplyVector3(up_vec);
  } else if(ev.keyCode == 83) { //s key
    q.setFromAxisAngle(right_vec.x,right_vec.y,right_vec.z, -0.50);
    q.multiplyVector3(forward_vec);
    q.multiplyVector3(up_vec);
  } else if(ev.keyCode == 68) { //d key
    q.setFromAxisAngle(up_vec.x,up_vec.y,up_vec.z, -0.50);
    q.multiplyVector3(forward_vec);
    q.multiplyVector3(right_vec);
  } else if(ev.keyCode == 65) { //a 
    q.setFromAxisAngle(up_vec.x,up_vec.y,up_vec.z, 0.50);
    q.multiplyVector3(forward_vec);
    q.multiplyVector3(right_vec);
  } else if(ev.keyCode == 81) {//q 
    g_eyeY += 0.2;
  } else if(ev.keyCode == 69) {//e 
    g_eyeY -= 0.2;
  } else if(ev.keyCode == 38) {// upkey
    g_eyeZ += 0.2;
  } else if(ev.keyCode == 40) {//downkey
    g_eyeZ -= 0.2;
  } else if(ev.keyCode == 73) {//i
    light0Pos.y += 0.20;
  } else if(ev.keyCode == 74) {//j
    light0Pos.x -= 0.20;
  } else if(ev.keyCode == 75) {//k
    light0Pos.y -= 0.20;
  } else if(ev.keyCode == 76) {//l
    light0Pos.x += 0.20;
  } else if(ev.keyCode == 85) {//u
    light0Pos.z += 0.20;
  } else if(ev.keyCode == 79) {//o
    light0Pos.z -= 0.20;
  } else {
    return;
  }
}


function drawMyScene(gl, u_ModelMatrix, modelMatrix, u_NormalMatrix, normalMatrix)
{
  var Ke, Ka, Kd, Ks, Kshiny;
  
  pushMatrix(modelMatrix);
  
  Ke = new Vector3([redE, greenE, blueE]); 
  Ka = new Vector3([redA, greenA, blueA]);
  Kd = new Vector3([redD, greenD, blueD]);
  Ks = new Vector3([redS, greenS, blueS]);

  /*Ke = eVec; 
  Ka = aVec;
  Kd = dVec;
  Ks = sVec;*/
  Kshiny = 1;

  setPhong(gl, Ke, Ka, Kd, Ks, Kshiny);
  modelMatrix.translate(light0Pos.x, light0Pos.y, light0Pos.z);
  modelMatrix.scale(0.4, 0.4, 0.4);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, sphInd.length, gl.UNSIGNED_SHORT, sphStart);
  modelMatrix = popMatrix();
  //HeadLight Orb 
  pushMatrix(modelMatrix);


//Tree Building
  var matIndex = 17;
  Ke = new Vector3([Material(matIndex)["emissive"][0], Material(matIndex)["emissive"][1], Material(matIndex)["emissive"][2]]);
  Ka = new Vector3([Material(matIndex)["ambient"][0], Material(matIndex)["ambient"][1], Material(matIndex)["ambient"][2]]);
  Kd = new Vector3([Material(matIndex)["diffuse"][0], Material(matIndex)["diffuse"][1], Material(matIndex)["diffuse"][2]]);
  Ks = new Vector3([Material(matIndex)["specular"][0], Material(matIndex)["specular"][1], Material(matIndex)["specular"][2]]);
  Kshiny = Material(matIndex)["shiny"];
  setPhong(gl, Ke, Ka, Kd, Ks, Kshiny);
function buildTree(){

  modelMatrix.translate(0, 0, 1);
  modelMatrix.scale(1, 1, 2);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cylInd.length, gl.UNSIGNED_SHORT, cylStart);

  modelMatrix.translate(0, 0, .8);
  //console.log('CurrentAngle2: ' + currentAngle2);
  modelMatrix.scale(.90, .90,.90 );
  modelMatrix.rotate(currentAngle * 1/3.5, 1, 0, 0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cylInd.length, gl.UNSIGNED_SHORT, cylStart);

  modelMatrix.translate(0, 0, .8);
  //console.log('CurrentAngle2: ' + currentAngle2);
  modelMatrix.scale(.90, .90,.90 );
  modelMatrix.rotate(-currentAngle * 1/3.5, 1, 0, 0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cylInd.length, gl.UNSIGNED_SHORT, cylStart);
  
  modelMatrix.translate(0, 0, .8);
  //console.log('CurrentAngle2: ' + currentAngle2);
  modelMatrix.scale(.90, .90,.90 );
  modelMatrix.rotate(currentAngle * 1/3.5, 1, 0, 0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cylInd.length, gl.UNSIGNED_SHORT, cylStart);
  
  modelMatrix.translate(0, 0, .8);
  modelMatrix.scale(.7, .7,.7 );
  modelMatrix.rotate(-currentAngle * 1/3.5, 1, 0, 0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cylInd.length, gl.UNSIGNED_SHORT, cylStart);

  modelMatrix.translate(0, 0, .5);
  modelMatrix.scale(.4, .4,.4 );
  modelMatrix.rotate(currentAngle * 1/3.5, 1, 0, 0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cylInd.length, gl.UNSIGNED_SHORT, cylStart);

}
function build4(){

    pushMatrix(modelMatrix);
    modelMatrix.translate(1, 4, 0.0);
    buildTree();
    modelMatrix = popMatrix();
    
    pushMatrix(modelMatrix);
    modelMatrix.translate(2, 7, 0.0);
    buildTree();
    modelMatrix = popMatrix();
        
    pushMatrix(modelMatrix);
    modelMatrix.translate(6, 2, 0.0);
    buildTree();
    modelMatrix = popMatrix();
      
    pushMatrix(modelMatrix);
    modelMatrix.translate(3, 6, 0.0);
    buildTree();
    modelMatrix = popMatrix();
    
    pushMatrix(modelMatrix);
    modelMatrix.translate(9, 5, 0.0);
    buildTree();
    modelMatrix = popMatrix();
}
build4();

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(-14, -8, 0);
build4();

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);




  
  //chair
  pushMatrix(modelMatrix);
  
  Ke = new Vector3([0.0, 0.0, 0.0]);
  Ka = new Vector3([0.329412, 0.223529, 0.027451]);
  Kd = new Vector3([0.780392, 0.568627, 0.113725]);
  Ks = new Vector3([0.992157, 0.941176, 0.807843]);
  Kshiny = 28;
  setPhong(gl, Ke, Ka, Kd, Ks, Kshiny);
  
  modelMatrix.translate(-3.5, 0.0, 0.0);
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5*Math.sin((30.0+20.0*Math.sin(currentAngle*Math.PI/180))*Math.PI/180), 0.0, 0.05);
  
  pushMatrix(modelMatrix);
  modelMatrix.rotate(90.0, 1, 0, 0);
  modelMatrix.scale(0.1, 0.1, 1.8);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cylInd.length, gl.UNSIGNED_SHORT, cylStart);
  modelMatrix = popMatrix();
  
  modelMatrix.rotate(30.0+20.0*Math.sin(currentAngle*Math.PI/180), 0, 1, 0)
  modelMatrix.translate(0.0, -0.1, 1.5);
  
  pushMatrix(modelMatrix);
  modelMatrix.scale(0.08, 0.2, 3.0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cubeInd.length, gl.UNSIGNED_SHORT, cubeStart);
  modelMatrix = popMatrix();
  
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5*Math.sin((30.0+20.0*Math.sin(currentAngle*Math.PI/180))*Math.PI/180), 0.0, 0.05);
  
  pushMatrix(modelMatrix);
  modelMatrix.rotate(90.0, 1, 0, 0);
  modelMatrix.scale(0.1, 0.1, 1.8);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cylInd.length, gl.UNSIGNED_SHORT, cylStart);
  modelMatrix = popMatrix();
  
  modelMatrix.rotate(30.0+20.0*Math.sin(currentAngle*Math.PI/180), 0, -1, 0)
  modelMatrix.translate(0.0, 0.1, 1.5);
  
  pushMatrix(modelMatrix);
  modelMatrix.scale(0.08, 0.2, 3.0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cubeInd.length, gl.UNSIGNED_SHORT, cubeStart);
  modelMatrix = popMatrix();
  
  modelMatrix = popMatrix();
  
  Ke = new Vector3([0.0, 0.0, 0.0]);
  Ka = new Vector3([0.2,    0.2,   0.2]);
  Kd = new Vector3([0.1,    0.1,   0.1]);
  Ks = new Vector3([0.4,     0.4,    0.4]);
  Kshiny = 10;
  setPhong(gl, Ke, Ka, Kd, Ks, Kshiny);
  
  modelMatrix.translate(0, 0, Math.cos((30.0+20.0*Math.sin(currentAngle*Math.PI/180))*Math.PI/180)*1.5*2+0.05);
  modelMatrix.scale(3.0, 1.0, 0.1);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawElements(gl.TRIANGLES, cubeInd.length, gl.UNSIGNED_SHORT, cubeStart);
  
  
  modelMatrix = popMatrix();
  

 


}

function draw(gl, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix, u_ModelMatrix, modelMatrix, u_NormalMatrix, normalMatrix)
{
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  var Ke, Ka, Kd, Ks, Kshiny;
  
  var vpAspect = (gl.drawingBufferWidth)/(gl.drawingBufferHeight);
  
  gl.uniform3f(u_light0Pos, light0Pos.x, light0Pos.y, light0Pos.z);
  
  light0Amb.x = redA;
  light0Amb.y = greenA;
  light0Amb.z = redA;

  light0Diff.x = redD;
  light0Diff.y = greenD;
  light0Diff.z = redD;

  light0Spec.x = redS;
  light0Spec.y = greenS;
  light0Spec.z = redS;

   
    gl.uniform3f(u_light0Amb, light0Amb.x, light0Amb.y, light0Amb.z);   
    gl.uniform3f(u_light0Diff, light0Diff.x, light0Diff.y, light0Diff.z); 
    gl.uniform3f(u_light0Spec, light0Spec.x, light0Spec.y, light0Spec.z); 
    
    gl.uniform3f(u_light1Pos, g_eyeX, g_eyeY, g_eyeZ);
  
    gl.uniform3f(u_light1Amb, light1Amb.x, light1Amb.y, light1Amb.z);   
    gl.uniform3f(u_light1Diff, light1Diff.x, light1Diff.y, light1Diff.z); 
    gl.uniform3f(u_light1Spec, light1Spec.x, light1Spec.y, light1Spec.z); 
    
  gl.uniform3f(u_EyePos, g_eyeX, g_eyeY, g_eyeZ);
  
  
  projMatrix.setPerspective(40.0, vpAspect, 1, 100);
  viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, g_eyeX+forward_vec.x*MAGNITUDE, g_eyeY+forward_vec.y*MAGNITUDE, g_eyeZ+forward_vec.z*MAGNITUDE, up_vec.x, up_vec.y, up_vec.z);
  modelMatrix.setRotate(0.0, 0, 1, 0);
  normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  
  Ke = new Vector3([1.0, 1.0, 1.0]);
  Ka = new Vector3([0.0, 0.0, 0.0]);
  Kd = new Vector3([0.0, 0.0, 0.0]);
  Ks = new Vector3([0.0, 0.0, 0.0]);
  Kshiny = 100;
  setPhong(gl, Ke, Ka, Kd, Ks, Kshiny);
  gl.drawElements(gl.LINES, gndInd.length, gl.UNSIGNED_SHORT, gndStart);
  
  drawMyScene(gl, u_ModelMatrix, modelMatrix, u_NormalMatrix, normalMatrix);
  
}

var helpString = 'Instructions on Operating This Page! \nThere is an animation operating on the objects in this page.\n\nINTERACTIONS:\nCamera Controls\n -Left Arrow Key:  Move Left \n -Right Arrow Key:  Move Right\n -Up Arrow Key:  Move Up\n -Down Arrow Key:  Move Down\n -W Key:  Pan Up\n -S Key:  Pan Down\n -A Key:  Pan Left\n -D Key:  Pan Right\n -Q Key:  Zoom In\n -E Key:  Zoom Out\n\nLight Source Controls\n -I Key:  Move Light Source Back\n -K Key:  Bring Light Source Forward\n -J Key:  Move Light Source Left\n -L Key:  Move Light Source Right\n -U Key:  Move Light Source Up\n -O Key:  Move Light Source Down\n\nClick the Help! button again to see this message!';
function help() {
  alert(helpString);
}

function setEmmissive() {
  eOn = !eOn;
  if(eOn) {
    redE = 1;
    greenE = 1;
    blueE = 0;
    console.log('set eVec');
  }
  else {
    redE = 0;
    greenE = 0;
    blueE = 0;
    console.log('clear eVec');
  }
}

function setAmbient() {
  aOn = !aOn;
  if(aOn) {
    redA = 1;
    greenA = 1;
    blueA = 0;
    console.log('set aVec');
  }
  else {
    redA = 0;
    greenA = 0;
    blueA = 0;
    console.log('clear aVec');
  }
}

function setDiffuse() {
  dOn = !dOn;
  if(dOn) {
    redD = 1;
    greenD = 1;
    blueD = 0;
    console.log('set dVec');
  }
  else {
    redD = 0;
    greenD = 0;
    blueD = 0;
    console.log('clear dVec');
  }
}

function setSpecular() {
  sOn = !sOn;
  if(sOn) {
    redS = 1;
    greenS = 1;
    blueS = 0;
    console.log('set sVec');
  }
  else {
    redS = 0;
    greenS = 0;
    blueS = 0;
    console.log('clear sVec');
  }
}

function setRGB() {
  eOn = true;
  aOn = true;
  dOn = true;
  sOn = true;

  redE = 0 + document.getElementById('redIn').value;
  blueE = 0 + document.getElementById('blueIn').value;
  greenE = 0 + document.getElementById('greenIn').value;

  redA = 0 + document.getElementById('redIn').value;
  blueA = 0 + document.getElementById('blueIn').value;
  greenA = 0 + document.getElementById('greenIn').value;

  redD = 0 + document.getElementById('redIn').value;
  blueD = 0 + document.getElementById('blueIn').value;
  greenD = 0 + document.getElementById('greenIn').value;

  redS = 0 + document.getElementById('redIn').value;
  blueS = 0 + document.getElementById('blueIn').value;
  greenS = 0 + document.getElementById('greenIn').value;

}