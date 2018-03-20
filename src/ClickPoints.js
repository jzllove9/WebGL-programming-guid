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

	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	_canvas.onmousedown = function(e) {
		click(e, gl, _canvas, a_Position, u_FragColor);
	}
}

let g_points = [];
let g_colors = [];

function click(e, gl, canvas, a_Position, u_FragColor) {
	let x = e.clientX;
	let y = e.clientY;
	let rect = e.target.getBoundingClientRect();

	x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
	y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

	g_points.push([x, y]);
	g_colors.push([x * 0.5 + 0.5, y * 0.5 + 0.5, (x - y + 1) * 0.5, 1.0]);

	gl.clear(gl.COLOR_BUFFER_BIT);

	let len = g_points.length;
	for (let i = 0; i < len; ++i) {
		let xy = g_points[i];
		let rgba = g_colors[i];

		gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
		gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

		gl.drawArrays(gl.POINTS, 0, 1);
	}
}