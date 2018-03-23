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
		"uniform mat4 u_xfromMatrix;",
		"uniform vec2 u_CosSin;",
		"attribute vec2 a_TexCoord;",
		"varying vec2 v_TexCoord;",
		"void main(){",
		"	gl_Position = u_xfromMatrix * a_Position;",
		"	gl_PointSize = 10.0;",
		"	v_TexCoord.x = (a_TexCoord.x - 0.5) * u_CosSin.x - (a_TexCoord.y - 0.5) * u_CosSin.y + 0.5;",
		"	v_TexCoord.y = (a_TexCoord.x - 0.5) * u_CosSin.y + (a_TexCoord.y - 0.5) * u_CosSin.x + 0.5;",
		"}"
	];
	let VSHADER_STR = VSHADER_ARR.join("\n");

	let FSHADER_ARR = [
		"precision mediump float;",
		"uniform sampler2D u_Sampler;",
		"varying vec2 v_TexCoord;",
		"void main(){",
		"	gl_FragColor = texture2D(u_Sampler, v_TexCoord);",
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

	if(!initTextures(gl, n)){
		console.log("Failed to initalize textures");
		return;
	}

	/*设置颜色*/
	setTexture(gl);

	let currentAngle = 0;
	let xfromMatrix = new Matrix4();
	let u_xfromMatrix = gl.getUniformLocation(gl.program, "u_xfromMatrix");
	let u_CosSin = gl.getUniformLocation(gl.program, "u_CosSin");

	globalObj = {
		gl: gl,
		currentAngle: currentAngle,
		modelMatrix: xfromMatrix,
		u_ModelMatrix: u_xfromMatrix,
		u_CosSin: u_CosSin,
		n: n,
		angle: 0
	};

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	/*gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, n);*/

	
}

/*初始化顶点缓存*/
function initVertexBuffers(gl) {
	let vertices = new Float32Array([
		/*0.0, 0.5, 
		-0.5, -0.5,
		0.5, -0.5*/

		-0.5, 0.5, 0.0, 1.0,
		-0.5, -0.5, 0.0, 0.0,
		0.5, 0.5, 1.0, 1.0,
		0.5, -0.5, 1.0, 0.0,
	]);
	let n = 4;
	let FSIZE = vertices.BYTES_PER_ELEMENT;

	let vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log("Failed to create the buffer object");
		return -1;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
	gl.enableVertexAttribArray(a_Position);

	let a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
	gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
	gl.enableVertexAttribArray(a_TexCoord);

	return n;
}

/*矩阵旋转*/
function rotate_matrix() {
	globalObj.modelMatrix.translate(0.35, 0, 0);
	globalObj.modelMatrix.setRotate(globalObj.angle, 0, 0, 1);
	
	globalObj.gl.uniformMatrix4fv(globalObj.u_ModelMatrix, false, globalObj.modelMatrix.elements);

	let _angle = globalObj.angle;
	let _rad = _angle * Math.PI / 180.0;
	let _cos = Math.cos(_rad);
	let _sin = Math.sin(_rad);

	globalObj.gl.uniform2f(globalObj.u_CosSin, _cos, _sin);
}

/*设置片元着色器贴图*/
function setTexture(gl) {
	let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
	
}

/*加载贴图*/
function initTextures(gl, n){
	let texture = gl.createTexture();
	let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
	let image = new Image();
	image.onload = function(){
		loadTexture(gl, n, texture, u_Sampler, image);	
	}
	image.src = require('./resource/sky.jpg');
	return true;
}

/**/
function loadTexture(gl, n, texture, u_Sampler, image){
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

	gl.uniform1i(u_Sampler, 0);

	tick();
}

/*绘制&重绘*/
function draw() {
	rotate_matrix();

	globalObj.gl.clear(globalObj.gl.COLOR_BUFFER_BIT);
	globalObj.gl.drawArrays(globalObj.gl.TRIANGLE_STRIP, 0, globalObj.n);
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