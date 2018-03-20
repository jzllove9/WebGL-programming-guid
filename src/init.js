function InitUtils(doc) {
	this._doc = doc;
}

InitUtils.prototype = {
	constructor: InitUtils,

	initCanvas: function(obj) {
		let _canvas = this._doc.createElement('canvas');

		_canvas.id = obj.id || "webgl";
		_canvas.width = obj.width || 500;
		_canvas.height = obj.height || 500;

		this._doc.body.appendChild(_canvas);

		return _canvas;
	}
}

export {
	InitUtils
};