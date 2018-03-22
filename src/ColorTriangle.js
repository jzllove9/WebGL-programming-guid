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
		"attribute vec4 v_color;",
		"uniform mat4 u_xfromMatrix;",
		"varying vec4 a_color;",
		"void main(){",
		"	gl_Position = u_xfromMatrix * a_Position;",
		"	a_color = v_color;",
		"}"
	];
	let VSHADER_STR = VSHADER_ARR.join("\n");

	let FSHADER_ARR = [
		"precision mediump float;",
		"varying vec4 a_color;",
		"void main(){",
		"	gl_FragColor = a_color;",
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

	/*设置颜色*/
	setColor(gl);

	let currentAngle = 0;
	let xfromMatrix = new Matrix4();
	let u_xfromMatrix = gl.getUniformLocation(gl.program, "u_xfromMatrix");

	globalObj = {
		gl: gl,
		currentAngle: currentAngle,
		modelMatrix: xfromMatrix,
		u_ModelMatrix: u_xfromMatrix,
		n: n,
		angle: 0
	};

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	/*gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, n);*/

	tick();
}

/*初始化顶点缓存*/
function initVertexBuffers(gl) {
	let vertices = new Float32Array([
		0.0, 0.5, 1.0,0.0,0.0,
		-0.5, -0.5,0.0,1.0,0.0,
		0.5, -0.5,0.0,0.0,1.0

		/*-0.5, 0.5, -0.5, -0.5,
		0.5, 0.5, 0.5, -0.5*/
	]);
	let n = 3;

	let FSIZE = vertices.BYTES_PER_ELEMENT;

	let vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log("Failed to create the buffer object");
		return -1;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	let v_color = gl.getAttribLocation(gl.program, 'v_color');

	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
	gl.enableVertexAttribArray(a_Position);

	gl.vertexAttribPointer(v_color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
	gl.enableVertexAttribArray(v_color);

	return n;
}

/*矩阵旋转*/
function rotate_matrix() {
	globalObj.modelMatrix.translate(0.35, 0, 0);
	globalObj.modelMatrix.setRotate(globalObj.angle, 0, 0, 1);
	

	globalObj.gl.uniformMatrix4fv(globalObj.u_ModelMatrix, false, globalObj.modelMatrix.elements);
}

/*设置片元着色器颜色*/
function setColor(gl) {
	let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
	gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
}

/*绘制&重绘*/
function draw() {
	rotate_matrix();

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