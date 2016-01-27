var FXStage = require('./FXStage');
var glslify = require('glslify-sync');

var VERT = glslify(__dirname + '/ScreenImage.vert');
var FRAG = glslify(__dirname + '/Downsample4.frag');

FXStage.prototype.downsample4 = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    outputSize.width /= 4;
    outputSize.height /= 4;
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var source = this.getSourceTexture();
    var program = this.getShader(VERT, FRAG);

    var ctx = this.ctx;

    ctx.pushState(ctx.FRAMEBUFFER_BIT);
        ctx.bindFramebuffer(rt);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        this.drawFullScreenQuad(outputSize.width, outputSize.height, source, program);
    ctx.popState(ctx.FRAMEBUFFER_BIT);

    return this.asFXStage(rt, 'downsample4');
};

module.exports = FXStage;
