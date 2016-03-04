var FXStage = require('./FXStage');
var glslify = require('glslify-sync');

var VERT = glslify(__dirname + '/ScreenImage.vert');
var FRAG = glslify(__dirname + '/Blur.frag');


FXStage.prototype.blur = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    var readRT = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var writeRT = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var source = this.getSourceTexture();
    var program = this.getShader(VERT, FRAG);

    var ctx = this.ctx;

    ctx.bindProgram(program);

    var iterations = options.iterations || 2;
    var strength = typeof(options.strength) === 'undefined' ? 2 : options.strength;

    ctx.pushState(ctx.PROGRAM_BIT | ctx.FRAMEBUFFER_BIT);
    for(var i=0; i<iterations * 2; i++) {
        var radius = (iterations - Math.floor(i / 2)) * strength;
        var direction = i % 2 === 0 ? [radius, 0] : [0, radius];

        var src = (i == 0) ? source : readRT.getColorAttachment(0).texture;

        ctx.bindFramebuffer(writeRT);
        ctx.setClearColor(0,0,1,1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        program.setUniform('direction', direction)
        this.drawFullScreenQuad(outputSize.width, outputSize.height, src, program);

        var tmp = writeRT;
        writeRT = readRT;
        readRT = tmp;
    }
    ctx.popState(ctx.PROGRAM_BIT | ctx.FRAMEBUFFER_BIT);

    return this.asFXStage(readRT, 'blur');
};

module.exports = FXStage;
