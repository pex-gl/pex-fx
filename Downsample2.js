var FXStage = require('./FXStage');
var fs = require('fs');

var VERT = fs.readFileSync(__dirname + '/ScreenImage.vert', 'utf8');
var FRAG = fs.readFileSync(__dirname + '/Downsample2.frag', 'utf8');

FXStage.prototype.downsample2 = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    outputSize.width /= 2;
    outputSize.height /= 2;
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

    return this.asFXStage(rt, 'downsample2');
};

module.exports = FXStage;
