var FXStage = require('./FXStage');
var glslify = require('glslify-sync');

var VERT = glslify(__dirname + '/ScreenImage.vert');
var FRAG = glslify(__dirname + '/CorrectGamma.frag');

FXStage.prototype.correctGamma = function (options) {
  var ctx = this.ctx;
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var program = this.getShader(VERT, FRAG);

  ctx.pushState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);
      ctx.bindFramebuffer(rt);
      ctx.setClearColor(0,0,0,0);
      ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

      ctx.bindTexture(this.getSourceTexture(), 0)

      ctx.bindProgram(program);
      program.setUniform('tex0', 0);

      this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  ctx.popState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);

  return this.asFXStage(rt, 'correctGamma');
};

module.exports = FXStage;
