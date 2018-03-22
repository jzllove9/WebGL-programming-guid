import {
	InitUtils
} from './init.js';
import * as GLUtils from './lib/cuon-utils.js';

/*初始化shader字符串*/
function initShaderString() {
	let VSHADER_ARR = [
		"attribute vec4 a_Position;",
		"uniform mat4 u_xfromMatrix;",
		"void main(){",
		"	gl_Position = u_xfromMatrix * a_Position;",
		"	gl_PointSize = 10.0;",
		"}"
	];
	let VSHADER_STR = VSHADER_ARR.join("\n");

	let FSHADER_ARR = [
		"precision mediump float;",
		"uniform vec4 u_FragColor;",
		"void main(){",
		"	gl_FragColor = u_FragColor;",
		"}"
	]

	let FSHADER_STR = FSHADER_ARR.join("\n");

	return {
		v_str: VSHADER_STR,
		f_str: FSHADER_STR
	};
}

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

	/*平移*/
	rotate_matrix(gl, -45);
	/*设置颜色*/
	setColor(gl);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
	let vertices = new Float32Array([
		0.0, 0.5, 
		-0.5, -0.5,
		0.5, -0.5

		/*-0.5, 0.5, -0.5, -0.5,
		0.5, 0.5, 0.5, -0.5*/
	]);
	let n = 3;

	let vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log("Failed to create the buffer object");
		return -1;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);

	return n;
}

function rotate_matrix(gl, angle) {
	let radian = (angle * Math.PI) / 180.0;
	let cosB = Math.cos(radian);
	let sinB = Math.sin(radian);

	let xfromMatrix = new Float32Array([
		cosB, sinB, 0, 0,
		-sinB, cosB, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	]);

	let u_xfromMatrix = gl.getUniformLocation(gl.program, "u_xfromMatrix");
	gl.uniformMatrix4fv(u_xfromMatrix, false, xfromMatrix);
}

function setColor(gl) {
	let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
	gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
}