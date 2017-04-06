var FXStage = require('./FXStage')
var fs = require('fs')

var VERT = fs.readFileSync(__dirname + '/ScreenImage.vert', 'utf8')
var FRAG_H = fs.readFileSync(__dirname + '/Blur3H.frag', 'utf8')
var FRAG_V = fs.readFileSync(__dirname + '/Blur3V.frag', 'utf8')

const viewport = { x: 0, y: 0, width: 0, height: 0 }

FXStage.prototype.blur3 = function (options) {
  var regl = this.regl
  options = options || {}

  var outputSize = this.getOutputSize(options.width, options.height)
  var rtH = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp)
  var rtV = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp)

  var source = this.getSourceTexture()

  var cmdH = this.getCommand(VERT, FRAG_H)
  var cmdV = this.getCommand(VERT, FRAG_V)

  if (!cmdH) {
    cmdH = this.addCommand(VERT, FRAG_H, regl({
      attributes: this.fullscreenQuad.attributes,
      elements: this.fullscreenQuad.elements,
      framebuffer: regl.prop('framebuffer'),
      viewport: regl.prop('viewport'),
      vert: VERT,
      frag: FRAG_H,
      uniforms: {
        image: regl.prop('image'),
        imageSize: (context, props) => [props.image.width, props.image.height],
        rtWidth: regl.prop('rtWidth'),
        rtHeight: regl.prop('rtHeight'),
        uOffset: [0, 0],
        uSize: [1, 1]
      }
    }))
  }

  if (!cmdV) {
    cmdV = this.addCommand(VERT, FRAG_H, regl({
      attributes: this.fullscreenQuad.attributes,
      elements: this.fullscreenQuad.elements,
      framebuffer: regl.prop('framebuffer'),
      viewport: regl.prop('viewport'),
      vert: VERT,
      frag: FRAG_V,
      uniforms: {
        image: regl.prop('image'),
        imageSize: (context, props) => [props.image.width, props.image.height],
        uOffset: [0, 0],
        uSize: [1, 1]
      }
    }))
  }

  viewport.width = outputSize.width
  viewport.height = outputSize.height

  cmdH({
    framebuffer: rtH,
    viewport: viewport,
    image: source
  })

  cmdV({
    framebuffer: rtV,
    viewport: viewport,
    image: this.getSourceTexture(rtH)
  })

  return this.asFXStage(rtV, 'mult')
}

module.exports = FXStage
