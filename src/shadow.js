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
	let SHADOW_VSHADER_ARR = [
		"attribute vec4 a_Position;",
		"uniform mat4 u_MvpMatrix;",
		"void main(){",
		"	gl_Position = u_MvpMatrix * a_Position;",
		"}"
	];
	let SHADOW_VSHADER_STR = SHADOW_VSHADER_ARR.join("\n");

	let SHADOW_FSHADER_ARR = [
		"#ifdef GL_ES",
		"precision mediump float;",
		"#endif",
		"void main(){",
		"	gl_FragColor = vec4( gl_FragCoord.z, 0.0, 0.0, 0.0 );",
		"}"
	]
	let SHADOW_FSHADER_STR = SHADOW_FSHADER_ARR.join("\n");

	let VSHADER_ARR = [
		"attribute vec4 a_Position;",
		"attribute vec4 a_Color;",
		"uniform mat4 u_MvpMatrix;",
		"uniform mat4 u_MvpMatrixFromLight;",
		"varying vec4 v_PositionFromLight;",
		"varying vec4 v_Color;",
		"void main(){",
		"	gl_Position = u_MvpMatrix * a_Position;",
		"	v_PositionFromLight = u_MvpMatrixFromLight * a_Position;",
		"	v_Color = a_Color;",
		"}"
	];
	let VSHADER_STR = VSHADER_ARR.join("\n");

	let FSHADER_ARR = [
		"#ifdef GL_ES",
		"precision mediump float;",
		"#endif",
		"uniform sampler2D u_ShadowMap;",
		"varying vec4 v_PositionFromLight;",
		"varying vec4 v_Color;",
		"void main(){",
		"	vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w) / 2.0 + 0.5;",
		"	vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);",
		"	float depth = rgbaDepth.r;",
		"	float visibility = (shadowCoord.z > depth + 0.005) ? 0.7: 1.0;",
		"	gl_FragColor = vec4( v_Color.rgb * visibility, v_Color.a );",
		"}"
	]
	let FSHADER_STR = FSHADER_ARR.join("\n");

	return {
		s_v_str: SHADOW_VSHADER_STR,
		s_f_str: SHADOW_FSHADER_STR,
		v_str: VSHADER_STR,
		f_str: FSHADER_STR
	};
}

//离屏渲染参数
const OFFSCREEN_WIDTH = 1024,
	OFFSCREEN_HEIGHT = 1024;
const LIGHT_X = 0,
	LIGHT_Y = 7,
	LIGHT_Z = 2;

//坐标系转换矩阵
let g_modelMatrix = new Matrix4();
let g_mvpMatrix = new Matrix4();

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

	//为生成shadow map初始化shader
	let shadowProgram = GLUtils.createProgram(gl, _shaderStrObj.s_v_str, _shaderStrObj.s_f_str);
	//获取并存储shadow shader变量地址
	shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, "a_Position");
	shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, "u_MvpMatrix");
	if (shadowProgram.a_Position < 0 || !shadowProgram.u_MvpMatrix) {
		console.log('Failed to get the storage location of attribute or uniform variable from shadowProgram');
		return;
	}

	//为正常绘制初始化shader
	let normalProgram = GLUtils.createProgram(gl, _shaderStrObj.v_str, _shaderStrObj.f_str);
	//获取并存储normal shader变量地址
	normalProgram.a_Position = gl.getAttribLocation(normalProgram, "a_Position");
	normalProgram.a_Color = gl.getAttribLocation(normalProgram, "a_Color");
	normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, "u_MvpMatrix");
	normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, "u_MvpMatrixFromLight");
	normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, "u_ShadowMap");
	if (normalProgram.a_Position < 0 || normalProgram.a_Color < 0 || !normalProgram.u_MvpMatrix ||
		!normalProgram.u_MvpMatrixFromLight || !normalProgram.u_ShadowMap) {
		console.log('Failed to get the storage location of attribute or uniform variable from normalProgram');
		return;
	}

	//创建顶点buffer
	let triangle = initVertexBuffersForTriangle(gl);
	let plane = initVertexBuffersForPlane(gl);
	if (!triangle || !plane) {
		console.log('Failed to set the vertex information');
		return;
	}

	//创建帧缓冲
	let fbo = initFrameBufferObject(gl);
	if (!fbo) {
		console.log('Failed to initialize frame buffer object');
		return;
	}
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

	//设置清屏颜色并开启深度检测
	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);

	//为生成shadow map设置视点投影变换矩阵
	let viewProjectMatrixFromLight = new Matrix4();
	viewProjectMatrixFromLight.setPerspective(70, OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT, 1.0, 100.0); //eye, lookat, up
	viewProjectMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, 0, 0, 0, 0, 1, 0);
	//为正常绘制设置视点投影变换矩阵
	let viewProjectMatrix = new Matrix4();
	viewProjectMatrix.setPerspective(35, _canvas.width / _canvas.height, 1.0, 100.0); //eye, lookat, up
	viewProjectMatrix.lookAt(0, 7, 9, 0, 0, 0, 0, 1, 0);

	let currentAngle = 0; //deg
	let mvpMatrixFromLight_t = new Matrix4();
	let mvpMatrixFromLight_p = new Matrix4();

	//帧函数
	let tick = function() {
		currentAngle = animate(currentAngle);

		//切换绘制目标为帧缓冲fbo
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		//使用shadow map程序对象
		gl.useProgram(shadowProgram);
		drawTriangle(gl, shadowProgram, triangle, currentAngle, viewProjectMatrixFromLight);
		mvpMatrixFromLight_t.set(g_mvpMatrix);
		drawPlane(gl, shadowProgram, plane, viewProjectMatrixFromLight);
		mvpMatrixFromLight_p.set(g_mvpMatrix);

		//切换绘制目标为颜色缓冲区
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, _canvas.width, _canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		//使用正常绘制程序对象
		gl.useProgram(normalProgram);
		//上传已经开启的gl.TEXTURE0到shader中
		gl.uniform1i(normalProgram.u_ShadowMap, 0);
		gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
		drawTriangle(gl, normalProgram, triangle, currentAngle, viewProjectMatrix);
		gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
		drawPlane(gl, normalProgram, plane, viewProjectMatrix);

		window.requestAnimationFrame(tick, _canvas);
	}
	tick();
}

//绘制三角形
function drawTriangle(gl, program, buffer, angle, viewProjectMatrix) {
	g_modelMatrix.setRotate(angle, 0, 1, 0);
	draw(gl, program, buffer, viewProjectMatrix);
}

//绘制平面
function drawPlane(gl, program, buffer, viewProjectMatrix) {
	g_modelMatrix.setRotate(-45, 0, 1, 1);
	draw(gl, program, buffer, viewProjectMatrix);
}

//绘制函数
function draw(gl, program, o, viewProjectMatrix) {
	initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
	if (program.a_Color != undefined) initAttributeVariable(gl, program.a_Color, o.colorBuffer);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

	//计算变换视点投影矩阵并上传至shader
	g_mvpMatrix.set(viewProjectMatrix);
	g_mvpMatrix.multiply(g_modelMatrix);
	gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

	gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
}

//将buffer指向shader变量并开启该变量
function initAttributeVariable(gl, a_attribute, buffer) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
	gl.enableVertexAttribArray(a_attribute);
}

//创建三角形顶点buffer
function initVertexBuffersForTriangle(gl) {
	// 创建三角形
	//       v2 ^ z
	//      / |	| 
	//     /  |	|
	//    /   |	O------>x
	//  v0----v1
	let vertices = new Float32Array([-0.8, 3.5, 0.0,
		0.8, 3.5, 0.0,
		0.0, 3.5, 1.8
	]);

	let colors = new Float32Array([
		1.0, 0.5, 0.0,
		1.0, 0.5, 0.0,
		1.0, 0.0, 0.0
	]);

	let indices = new Uint8Array([
		0, 1, 2
	]);

	let o = new Object();
	o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
	o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
	o.indexBuffer = initElementBufferArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
	if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null;

	o.numIndices = indices.length;

	//清空buffer绑定
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	return o;
}

//创建平面顶点buffer
function initVertexBuffersForPlane(gl) {
	// 创建平面
	//  v1------v0	^ z
	//  |        | 	|
	//  |        | 	|				
	//  |        |	O------>x
	//  v2------v3
	let vertices = new Float32Array([
		3.0, -1.7, 2.5, -3.0, -1.7, 2.5, -3.0, -1.7, -2.5,
		3.0, -1.7, -2.5 // v0-v1-v2-v3
	]);

	let colors = new Float32Array([
		1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, 1.0, 1.0
	]);

	let indices = new Uint8Array([
		0, 1, 2,
		0, 2, 3
	]);

	let o = new Object();
	o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
	o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
	o.indexBuffer = initElementBufferArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
	if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null;

	o.numIndices = indices.length;

	//清空buffer绑定
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	return o;
}

//创建array_buffer并写入数据,延迟使用
function initArrayBufferForLaterUse(gl, data, num, type) {
	let buffer = gl.createBuffer();
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return null;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

	buffer.num = num;
	buffer.type = type;

	return buffer;
}

//创建elements_array_buffer并写入数据,延迟使用
function initElementBufferArrayBufferForLaterUse(gl, data, type) {
	let buffer = gl.createBuffer();
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return null;
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

	buffer.type = type;
	return buffer;
}

//创建帧缓冲
function initFrameBufferObject(gl) {
	let frameBuffer, texture, depthBuffer;
	//创建帧缓冲
	frameBuffer = gl.createFramebuffer();
	if (!frameBuffer) {
		console.log('Failed to create the frameBuffer object');
		return null;
	}

	//创建贴图对象
	texture = gl.createTexture();
	if (!texture) {
		console.log('Failed to create texture object');
		return null;
	}
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_WIDTH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	//创建渲染缓冲
	depthBuffer = gl.createRenderbuffer();
	if (!depthBuffer) {
		console.log('Failed to create renderBuffer object');
		return error();
	}
	gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
	//表示渲染缓冲关联的是深度关联对象 具体参数查看gl.renderbufferStorage的API
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

	//将texture和渲染缓冲关联到帧缓冲
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

	//检查帧缓冲区配置状态是否正确
	let e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if (gl.FRAMEBUFFER_COMPLETE !== e) {
		console.log('Frame buffer object is incomplete: ' + e.toString());
		return null;
	}

	frameBuffer.texture = texture;

	//buffer对象解绑
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	return frameBuffer;
}

//角度变化参数
const ANGLE_STEP = 40;
let last = Date.now();
//根据帧间隔改变角度 return 新角度 deg
function animate(angle) {
	let now = Date.now();
	let elapsed = now - last;
	last = now;
	let newAngle = angle + (ANGLE_STEP * elapsed) * 0.001;
	return newAngle % 360;
}