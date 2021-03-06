import {
	InitUtils
} from './init.js';
import * as GLUtils from './lib/cuon-utils.js';
import {
	Matrix4,
	Vector3,
	Vector4
} from './lib/cuon-matrix.js';

/*初始化shader字符串*/
function initShaderString() {
	let VSHADER_ARR = [
		"attribute vec4 a_Position;",
		"attribute vec4 a_Color;",
		"uniform mat4 u_ModelViewMatrix;",
		"varying vec4 v_Color;",
		"void main(){",
		"	gl_Position = u_ModelViewMatrix * a_Position;",
		"	gl_PointSize = 10.0;",
		"	v_Color = a_Color;",
		"}"
	];
	let VSHADER_STR = VSHADER_ARR.join("\n");

	let FSHADER_ARR = [
		"precision mediump float;",
		"varying vec4 v_Color;",
		"void main(){",
		"	gl_FragColor = v_Color;",
		"}"
	]

	let FSHADER_STR = FSHADER_ARR.join("\n");

	return {
		v_str: VSHADER_STR,
		f_str: FSHADER_STR
	};
}

let globalObj = {};

window.onload = function() {
	let _initUtils = new InitUtils(document);
	let _canvas = _initUtils.initCanvas({
		id: "_webgl",
		width: 600,
		height: 600
	});

	let _shaderStrObj = initShaderString();

	let gl = GLUtils.getWebGLContext(_canvas);
	if (!gl) {
		console.log('Faild to get the rendering context for WebGL');
		return;
	}

	if (!GLUtils.initShaders(gl, _shaderStrObj.v_str, _shaderStrObj.f_str)) {
		console.log('Faild to initalize shaders.');
		return;
	}

	let n = initVertexBuffers(gl);
	if (n < 0) {
		console.log("Failed to set the positions of the vertices");
		return;
	}

	let currentAngle = 0;
	let xfromMatrix = new Matrix4();
	let u_ModelViewMatrix = gl.getUniformLocation(gl.program, "u_ModelViewMatrix");

	let viewMatrix = view_matrix(gl);
	globalObj = {
		gl: gl,
		currentAngle: currentAngle,
		modelMatrix: xfromMatrix,
		u_ModelViewMatrix: u_ModelViewMatrix,
		n: n,
		angle: 0,
		view_matrix: viewMatrix
	};

	/*键盘事件*/
	document.onkeydown = function(ev){
		keydown(ev,gl,n);
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	/*gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, n);*/

	tick();
}

/*初始化顶点缓存*/
function initVertexBuffers(gl) {
	let vertices = new Float32Array([
		0.0, 0.5, -0.4, 0.4, 1.0, 0.4,  //green
		-0.5, -0.5, -0.4, 0.4, 1.0, 0.4,
		0.5, -0.5, -0.4, 1.0, 0.4, 0.4,

		0.5, 0.4, -0.2, 1.0, 0.4, 0.4, //yellow
		-0.5, 0.4, -0.2, 1.0, 1.0, 0.4,
		0.0, -0.6, -0.2, 1.0, 1.0, 0.4,

		0.0, 0.5, 0.0, 0.4, 0.4, 1.0,  //blue
		-0.5, -0.5, 0.0, 0.4, 0.4, 1.0,
		0.5, -0.5, 0.0, 1.0, 0.4, 0.4
	]);
	let n = 9;
	let FSIZE = vertices.BYTES_PER_ELEMENT;

	let vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log("Failed to create the buffer object");
		return -1;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	let a_Position = gl.getAttribLocation(gl.program, 'a_Position');

	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
	gl.enableVertexAttribArray(a_Position);

	let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
	gl.enableVertexAttribArray(a_Color);

	return n;
}

/*矩阵变换*/
function model_view_matrix() {
	//globalObj.modelMatrix.translate(0.35, 0, 0);
	globalObj.modelMatrix.setRotate(globalObj.angle, 0, 0, 1);
	//console.log(globalObj.angle);

	let viewMatrix = new Matrix4();
	viewMatrix.set(globalObj.view_matrix);
	let modelViewMatrix = viewMatrix.multiply(globalObj.modelMatrix);
	globalObj.gl.uniformMatrix4fv(globalObj.u_ModelViewMatrix, false, modelViewMatrix.elements);
}

/*设置视点矩阵*/
function view_matrix(gl){
	let viewMatrix = new Matrix4();
	viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0); //(eye, lookat, up)
	return viewMatrix;
}

/*键盘事件响应*/
let g_eyeX = 0.20;
let g_eyeY = 0.25;
let g_eyeZ = 0.25;
function keydown(ev){
	if(ev.keyCode == 39){ //右键
		g_eyeX += 0.01;
	}else if(ev.keyCode == 37){ //左键
		g_eyeX -= 0.01;
	}else{
		return;
	}

	globalObj.view_matrix = view_matrix(globalObj.gl);
	draw();
}

/*绘制&重绘*/
function draw() {
	model_view_matrix();

	globalObj.gl.clear(globalObj.gl.COLOR_BUFFER_BIT);
	globalObj.gl.drawArrays(globalObj.gl.TRIANGLES, 0, globalObj.n);
}

/*重绘调用*/
function tick() {
	globalObj.angle = animate(globalObj.angle);
	draw();
	requestAnimationFrame(tick);
}

/*角度变化*/
const ANGLE_STEP = 45;
let g_last = Date.now();

function animate(angle) {
	let now = Date.now();
	let elapsed = now - g_last;
	g_last = now;

	let newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
	return newAngle %= 360;
}