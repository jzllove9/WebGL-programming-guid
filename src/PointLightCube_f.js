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
		"attribute vec4 a_Normal;",
		"uniform mat4 u_ModelViewMatrix;",
		"uniform mat4 u_NormalMatrix;",
		"uniform mat4 u_ModelMatrix;",
		"varying vec3 v_normal;",
		"varying vec3 v_position;",
		"varying vec4 v_Color;",
		"void main(){",
		"	gl_Position = u_ModelViewMatrix * a_Position;",
		"	v_position = vec3( u_ModelMatrix * a_Position );",
		"	v_normal = vec3( u_NormalMatrix * a_Normal);;",
		"	gl_PointSize = 10.0;",
		"	v_Color = a_Color;",
		"}"
	];
	let VSHADER_STR = VSHADER_ARR.join("\n");

	let FSHADER_ARR = [
		"precision mediump float;",
		"varying vec4 v_Color;",
		"varying vec3 v_normal;",
		"varying vec3 v_position;",
		"uniform vec3 u_LightColor;",
		"uniform vec3 u_AmbientColor;",
		"uniform vec3 u_LightPosition;",
		"void main(){",
		//计算光照方向和法向量的点积
		"	vec3 normal = normalize( v_normal );",
		"	vec3 lightDirect = normalize(u_LightPosition - v_position);",
		"	float nDotL = max(dot(lightDirect, normal), 0.0);",
		//计算漫反射光的颜色
		"	vec3 diffuse = u_LightColor * vec3(v_Color) * nDotL;",
		"	vec3 ambient = u_AmbientColor * v_Color.rgb;",
		"	gl_FragColor = vec4( ambient + diffuse, v_Color.a);",
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
	let u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
	let u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
	let u_AmbientColor = gl.getUniformLocation(gl.program, "u_AmbientColor");
	let u_LightPosition = gl.getUniformLocation(gl.program, "u_LightPosition");
	let u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");

	//设置平行光线颜色
	gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
	//设置环境光颜色
	gl.uniform3f(u_AmbientColor, 0.2, 0.2, 0.2);
	//设置点光源位置
	let lightPosition = new Vector3([2, 4, 0]);
	gl.uniform3fv(u_LightPosition, lightPosition.elements);

	let viewMatrix = view_matrix(gl);
	globalObj = {
		gl: gl,
		currentAngle: currentAngle,
		modelMatrix: xfromMatrix,
		u_ModelViewMatrix: u_ModelViewMatrix,
		u_NormalMatrix: u_NormalMatrix,
		n: n,
		angle: 0,
		view_matrix: viewMatrix,
		u_ModelMatrix: u_ModelMatrix,
	};

	/*键盘事件*/
	document.onkeydown = function(ev) {
		keydown(ev);
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	//开启深度检测
	gl.enable(gl.DEPTH_TEST);
	//开启多边形偏移
	gl.enable(gl.POLYGON_OFFSET_FILL);
	/*gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, n);*/

	tick();
}

/*初始化顶点缓存*/
function initVertexBuffers(gl) {
	//顶点buffer
	let vertices = new Float32Array([
		0.0, 1, -4.4,
		-1, -1, -4.4,
		1, -1, -4.4,
		0.0, 1, -1.4, 
		-1, -1, -1.4,
		1, -1, -1.4,
		0.0, 1, -4.4,
		1, -1, -4.4,
		0.0, 1, -4.4,
		0.0, 1, -1.4, 
		-1, -1, -4.4,
		-1, -1, -4.4, 
		-1, -1, -1.4,
		1, -1, -1.4,
		1, -1, -4.4,
		1, -1, -1.4,
		0.0, 1, -1.4, 
		-1, -1, -1.4,
	]);

	if (!initBuffer(gl, vertices, 3, gl.FLOAT, "a_Position", "")) return -1;

	//颜色buffer
	let colors = new Float32Array([
		0.4, 0.4, 1.0,
		0.4, 0.4, 1.0,
		0.4, 0.4, 1.0,
		0.4, 1.0, 0.4,
		1.0, 0.4, 0.4,
		0.4, 1.0, 0.4,
		0.4, 1.0, 0.4,
		0.4, 1.0, 0.4,
		1.0, 0.4, 0.4,
		1.0, 0.4, 0.4,
		1.0, 0.4, 0.4,
		1.4, 1.4, 0.4,
		1.4, 1.4, 0.4,
		1.4, 1.4, 0.4,
		1.4, 1.4, 0.4,
		0.4, 1.4, 1.4,
		0.4, 1.4, 1.4,
		0.4, 1.4, 1.4,
	]);

	if (!initBuffer(gl, colors, 3, gl.FLOAT, "a_Color", "")) return -1;

	//法线buffer
	let normals = new Float32Array([
		0, 0, -1,
		0, 0, -1,
		0, 0, -1,
		2, 1, 0,
		-2, 1, 0, 
		2, 1, 0,
		2, 1, 0,
		2, 1, 0,
		-2, 1, 0,
		-2, 1, 0,
		-2, 1, 0,
		0, -1, 0,
		0, -1, 0,
		0, -1, 0,
		0, -1, 0,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1
	])

	if (!initBuffer(gl, normals, 3, gl.FLOAT, "a_Normal", "")) return -1;

	//索引buffer
	let indices = new Uint8Array([
		0, 1, 2,
		6, 7, 5,
		6, 5, 3,
		8, 9, 4,
		8, 4, 10,
		11, 12, 13,
		11, 13, 14,
		15, 17, 16
	]);

	if (!initBuffer(gl, indices, null, null, "", "elements")) return -1;

	return indices.length;
}

/*创建buffer*/
function initBuffer(gl, data, num, type, attribute, flag) {
	let _buffer = gl.createBuffer();

	if (flag == "elements") {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

		return true;
	} else {
		gl.bindBuffer(gl.ARRAY_BUFFER, _buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		let a_attribute = gl.getAttribLocation(gl.program, attribute);
		gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
		gl.enableVertexAttribArray(a_attribute);

		return true;
	}
	return false;
}

/*矩阵变幻*/
function model_view_matrix(flag) {
	//模型矩阵 + 变换
	if (flag) {
		// how to set rotate center
		/*globalObj.modelMatrix.setRotate(-globalObj.angle, 0, 0, 1);
		globalObj.modelMatrix.translate(1.5, 0, 0);*/
		globalObj.modelMatrix.setTranslate(-1, 0, 0);
		globalObj.modelMatrix.rotate(-globalObj.angle, 0, 0, 1);
	} else {
		globalObj.modelMatrix.setRotate(globalObj.angle, 0, 0, 1);
	}

	let modelMatrix = new Matrix4();
	modelMatrix.set(globalObj.modelMatrix);
	globalObj.gl.uniformMatrix4fv(globalObj.u_ModelMatrix, false, modelMatrix.elements);

	//法线变换矩阵
	let normalMatrix = new Matrix4();
	normalMatrix.setInverseOf(globalObj.modelMatrix);
	normalMatrix.transpose();
	globalObj.gl.uniformMatrix4fv(globalObj.u_NormalMatrix, false, normalMatrix.elements);

	//视点矩阵
	let viewMatrix = new Matrix4();
	viewMatrix.set(globalObj.view_matrix);
	let modelViewMatrix = viewMatrix.multiply(globalObj.modelMatrix);

	//投影矩阵
	let perspectiveMatrix = new Matrix4();
	perspectiveMatrix.setPerspective(60, 1, 0.1, 100.0);
	modelViewMatrix = perspectiveMatrix.multiply(modelViewMatrix);
	globalObj.gl.uniformMatrix4fv(globalObj.u_ModelViewMatrix, false, modelViewMatrix.elements);
	return modelViewMatrix;
}

/*设置视点矩阵*/
function view_matrix(gl) {
	let viewMatrix = new Matrix4();
	viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0); //(eye, lookat, up)
	return viewMatrix;
}

/*键盘事件响应*/
let g_eyeX = 0;
let g_eyeY = 2;
let g_eyeZ = 2;

function keydown(ev) {
	if (ev.keyCode == 39) { //右键
		g_eyeX += 0.01;
	} else if (ev.keyCode == 37) { //左键
		g_eyeX -= 0.01;
	} else {
		return;
	}

	globalObj.view_matrix = view_matrix(globalObj.gl);
	draw();
}

/*绘制&重绘*/
function draw() {

	globalObj.gl.clear(globalObj.gl.COLOR_BUFFER_BIT | globalObj.gl.DEPTH_BUFFER_BIT);

	model_view_matrix();
	//globalObj.gl.drawArrays(globalObj.gl.TRIANGLES, 0, globalObj.n);
	globalObj.gl.drawElements(globalObj.gl.TRIANGLES, globalObj.n, globalObj.gl.UNSIGNED_BYTE, 0);

	
	model_view_matrix(true);
	globalObj.gl.polygonOffset(1.0, 1.0);
	globalObj.gl.drawElements(globalObj.gl.TRIANGLES, globalObj.n, globalObj.gl.UNSIGNED_BYTE, 0);
	
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