var canvas;
var gl;

var maxNumTriangles = 1000;
var maxNumVertices  = 3 * maxNumTriangles;
var index = 0;

var lastTriangleX = [];
var lastTriangleY = [];
var lastColorId;
var colorId = 0;

var redraw = false;

const Mouse = { Brush: 0, Eraser: 1, Select: 2 };
var mouse = Mouse.Brush;

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
}

function buttonRed() {
    colorId = 1;
}

function buttonYellow() {
    colorId = 2;
}

function buttonGreen() {
    colorId = 3;
}

function buttonBlue() {
    colorId = 4;
}

function buttonMagenta() {
    colorId = 5;
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" ); 

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    canvas.addEventListener("mousedown", function(event){
      redraw = true;
    });

    canvas.addEventListener("mouseup", function(event){
      redraw = false;
    });
    //canvas.addEventListener("mousedown", function(){
    canvas.addEventListener("mousemove", function(event){

          if(redraw && mouse === Mouse.Brush) {
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

            if (lastTriangleX[0] === verticeX[0] &&
              lastTriangleX[1] === verticeX[1] &&
              lastTriangleX[2] === verticeX[2] &&
              lastColorId === colorId ) {
              return;
            }
            
            for (var i = 0; i < 3; i++) {
              gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
              var t = vec2(2*verticeX[i]/canvas.width-1,
              2*(canvas.height-verticeY[i])/canvas.height-1);
              gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(t));

              gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
              t = vec4(colors[colorId]);
              gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(t));
              index++;
            }

            lastTriangleX = verticeX;
            lastTriangleY = verticeY;
            lastColorId = colorId;
          }

    } );


    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );


    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    render();

}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, index );

    window.requestAnimFrame(render);

}
