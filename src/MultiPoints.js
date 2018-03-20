import {
	InitUtils
} from './init.js';
import * as GLUtils from './lib/cuon-utils.js';

/*初始化shader字符串*/
function initShaderString() {
	let VSHADER_ARR = [
		"attribute vec4 a_Position;",
		"void main(){",
		"	gl_Position = a_Position;",
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
	if(n < 0){
		console.log("Failed to set the positions of the vertices");
		return;
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, n)
}

function initVertexBuffers(gl) {
	let vertices = new Float32Array([
		/*0.0, 0.5, -0.5, -0.5,
		0.5, -0.5*/

		-0.5, 0.5, -0.5, -0.5,
		0.5, 0.5, 0.5, -0.5
	]);
	let n = 4;

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