var FXStage = require('./FXStage');

var wrapCmd;
FXStage.prototype.wrapRender = function (options, drawFunc) {
    options = options || {};
    var regl = this.regl
    var outputSize = this.getOutputSize(options.width, options.height);
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);

    var ctx = this.ctx;

  if (!wrapCmd) {
    console.log('setup cmd')
    // TODO: what if the viewport size / target output has changed?
    // FIXME: i don't know how to pass my uniform to drawFullScreenQuad command,
    // so i'm just doing all of it here
    // how can i inject new uniforms if i don't know their name in the
    // drawFullScreenQuad function, can cmd(props) take props.uniforms somehow?
    wrapCmd = regl({
      framebuffer: rt,
      viewport: { x: 0, y: 0, width: outputSize.width, height: outputSize.height },
    })
  }

  wrapCmd(drawFunc)

  return this.asFXStage(rt, 'render');
};

module.exports = FXStage;
