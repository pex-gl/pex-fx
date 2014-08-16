var FXStage = require('./FXStage');
var geom = require('pex-geom');
var glu = require('pex-glu')
var Vec2 = geom.Vec2;
var fs = require('fs');

var SSAOGLSL = fs.readFileSync(__dirname + '/SSAO.glsl', 'utf8');

FXStage.prototype.ssao = function (options) {
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  rt.bind();
  var depthMap = this.getSourceTexture(options.depthMap);
  depthMap.bind(0);
  var program = this.getShader(SSAOGLSL);
  program.use();
  program.uniforms.textureSize(Vec2.create(outputSize.width, outputSize.height));
  program.uniforms.depthMap(0);
  program.uniforms.near(options.camera.getNear());
  program.uniforms.far(options.camera.getFar());
  if (program.uniforms.strength) program.uniforms.strength(typeof(options.strength) !== "undefined" ? options.strength : 1);
  if (program.uniforms.offset) program.uniforms.offset(typeof(options.offset) !== "undefined" ? options.offset : 0);
  this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  rt.unbind();
  return this.asFXStage(rt, 'ssao');
};

module.exports = FXStage;