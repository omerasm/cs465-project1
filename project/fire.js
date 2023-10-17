var canvas;
var gl;


var maxNumTriangles = 30000;
var maxNumVertices = 3 * maxNumTriangles;

var index = 0;
var lastTriangleX = [];
var lastTriangleY = [];
var lastColorId;
var lastMouse;
var colorId = 0;

var redraw = false;

const Mouse = { Brush: 0, Eraser: 1, Select: 2 };
var mouse = Mouse.Brush;

var undoTClone = [];
var redoTClone = [];


var vBuffer = [];
var cBuffer = [];

var allVertices = [];

var indexHolder = [];
var indexRedoer = [];

var colorHolder = [];
var colorChanger = 0;

var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var aspect = 1.0;       // Viewport aspect ratio
var near = 0.3;
var far = 3.0;
var radius = 4.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var modelViewMatrix
var modelViewMatrixLoc


var colors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
];

function buttonBrush() {
  mouse = Mouse.Brush
}

function buttonEraser() {
  mouse = Mouse.Eraser
}

function buttonSelect() {
  mouse = Mouse.Select
}

function buttonBlack() {
    colorId = 0;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
    
}

function buttonRed() {
    colorId = 1;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function buttonYellow() {
    colorId = 2;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function buttonGreen() {
    colorId = 3;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function buttonBlue() {
    colorId = 4;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function buttonMagenta() {
    colorId = 5;
    if (colorHolder[colorHolder.length - 1] != colorId) {
        colorHolder.push(colorId);
    }
}

function saveState() {
    var tClone = deepClone(allVertices);
    undoTClone.push(tClone);
    indexHolder.push(index);
    redoTClone = [];
    console.log("save state: ", index)
}
function undo_op() {
    index = 0;
    if (undoTClone.length > 0 && undoTClone.length < 10) {
        var temp = indexHolder.pop();
        indexRedoer.push(temp);
        console.log(indexRedoer);

        var cloneTemp = undoTClone.pop()
        var popped = deepClone(cloneTemp);
        redoTClone.push(popped);
        lengthPopped = popped.length;
        colorChanger = 0;
        colorId = colorHolder[0];
        for (let i = 0; i < lengthPopped; i++) {
            console.log(i, colorChanger, colorHolder, indexHolder[colorChanger])
            if ((i * 3 >= indexHolder[colorChanger+1]) && (colorChanger < colorHolder.length)) {
                colorChanger++;
                colorId = colorHolder[colorChanger];
            }
            var vertices = popped[i];
            draw(vertices[0], vertices[1]);
        }

        if (indexHolder.length > 0) {
            index = indexHolder[indexHolder.length - 1];
        }

    }

}

function deepClone(clown) {
    var deepCopy = [];
    for (let i = 0; i < clown.length; i++) {
        deepCopy[i] = clown[i].slice();
    }
    return deepCopy;
}

function redo_op() {
    colorId = colorHolder[0];
    if (redoTClone.length > 0) {
        colorChanger = 0
        index = 0;
        var pushed = deepClone(redoTClone.pop());
        undoTClone.push(pushed);
        lengthPushed = pushed.length;
        colorId = colorHolder[0];
        for (let i = 0; i < lengthPushed; i++) {
            console.log(i, colorChanger, colorHolder, indexHolder[colorChanger] )
            if ((i*3 >= indexHolder[colorChanger+1]) && (colorChanger < colorHolder.length)) {
                colorChanger++;
                colorId = colorHolder[colorChanger];
            }
            var vertices = pushed[i];
            draw(vertices[0], vertices[1]);
        }
        index = indexRedoer.pop();
        indexHolder.push(index);
        console.log(index);
    }
}

function zoom_in(){
    fovy = fovy;
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" ); 

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) { alert("WebGL isn't available"); }

    canvas.addEventListener("mousedown", function(event){
      redraw = true;
    });

    canvas.addEventListener("mouseup", function(event){
        redraw = false;
        saveState();
    });
    indexHolder.push(0);
    colorHolder.push(0);

    //canvas.addEventListener("mousedown", function(){
    canvas.addEventListener("mousemove", function(event){

          if(redraw && mouse === Mouse.Brush) {

            var [verticeX, verticeY] = getTriangle(event);
            // burasi brush eraser arasi switchlerken bozabilir ama ayarlarizzz 
            if (lastTriangleX[0] === verticeX[0] &&
              lastTriangleX[1] === verticeX[1] &&
              lastTriangleX[2] === verticeX[2] &&
              lastTriangleY[0] === verticeY[0] &&
              lastTriangleY[1] === verticeY[1] &&
              lastTriangleY[2] === verticeY[2] &&
              lastColorId === colorId &&
              lastMouse === Mouse.Brush ) {
              return;
            }
              draw(verticeX, verticeY);
              var vertice = [verticeX, verticeY];
              allVertices.push(vertice);
              
            lastTriangleX = verticeX;
            lastTriangleY = verticeY;
            lastColorId = colorId;
            lastMouse = Mouse.Brush;
          }
          else if(redraw && mouse === Mouse.Eraser) {
            var diff;
            var [verticeX, verticeY] = getTriangle(event);
            if (lastTriangleX[0] === verticeX[0] &&
              lastTriangleX[1] === verticeX[1] &&
              lastTriangleX[2] === verticeX[2] &&
              lastTriangleY[0] === verticeY[0] &&
              lastTriangleY[1] === verticeY[1] &&
              lastTriangleY[2] === verticeY[2] &&
              lastMouse === Mouse.Eraser) {
              return;
            }
            lastTriangleX = verticeX;
            lastTriangleY = verticeY;
            lastMouse = Mouse.Eraser;
            var newTri = new Float32Array(6);
            for ( var i = 0; i < 3; i++ ) {
              newTri[2*i] = 2*verticeX[i]/canvas.width-1;
              newTri[2*i+1] = 2*(canvas.height-verticeY[i])/canvas.height-1;
            }
            for ( var i = 0; i < index / 3; i+=1 ) {
              diff = false;
              gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
              var oldTri = new Float32Array(6);
              gl.getBufferSubData(gl.ARRAY_BUFFER, 24*i, oldTri, 0);
              for ( var j = 0; j < 6; j++ ) {
                if (oldTri[j] !== newTri[j]) {
                  diff = true;
                }
              }
              if (!diff) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 24*i, flatten([0,0,0,0,0,0]));
                gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 48*i, flatten([0,0,0,0,0,0,0,0,0,0,0,0]));
              }
            }
          }
    } );

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1, 0.9, 0.9, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vColor);

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    render();

}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, index );

    window.requestAnimFrame(render);

}

function draw(verticeX, verticeY) {
    for (var i = 0; i < 3; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        var t = vec2(2 * verticeX[i] / canvas.width - 1,
            2 * (canvas.height - verticeY[i]) / canvas.height - 1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(t));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        t = vec4(colors[colorId]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(t));
        index++;
    }
}

function zoomer() {
    //gl.clear(gl.COLOR_BUFFER_BIT);

    //projectionMatrix = perspective(60, aspect, near, far);

    //gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    //requestAnimFrame(render);
}

function getTriangle(event) {
            const rect = canvas.getBoundingClientRect();
            var reloX = event.clientX - rect.left;
            var reloY = event.clientY - rect.top;
            var squareX = reloX - (reloX%20) + 10;
            var squareY = reloY - (reloY%20) + 10;
            var verticeX = [];
            var verticeY = [];
            verticeX.push(squareX);
            verticeY.push(squareY);

            if (reloX - reloY > squareX - squareY) {
              // up/right
              verticeX.push(squareX + 10);
              verticeY.push(squareY - 10);
            }
            else {
              // down/left
              verticeX.push(squareX - 10);
              verticeY.push(squareY + 10);
            }
            if (reloX + reloY > squareX + squareY) {
              // right/down
              verticeX.push(squareX + 10);
              verticeY.push(squareY + 10);
            }
            else {
              // up/left
              verticeX.push(squareX - 10);
              verticeY.push(squareY - 10);
            }

            return [verticeX, verticeY]
}
