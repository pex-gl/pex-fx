var FXStage = require('./FXStage')
var fs = require('fs')

var VERT = fs.readFileSync(__dirname + '/ScreenImage.vert', 'utf8')
var FRAG = fs.readFileSync(__dirname + '/BilateralBlur.frag', 'utf8')

const viewport = { x: 0, y: 0, width: 0, height: 0 }

FXStage.prototype.bilateralBlur = function (options) {
  var regl = this.regl
  options = options || {}
  var outputSize = this.getOutputSize(options.width, options.height)
  var readRT = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp)
  var writeRT = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp)
  var source = this.getSourceTexture()
  var depthMap = this.getSourceTexture(options.depthMap)

  var iterations = options.iterations || 1
  var sharpness = typeof options.sharpness === 'undefined' ? 1 : options.sharpness
  var strength = typeof options.strength === 'undefined' ? 0.5 : options.strength

  var cmd = this.getCommand(VERT, FRAG)
  if (!cmd) {
    cmd = this.addCommand(VERT, FRAG, regl({
      attributes: this.fullscreenQuad.attributes,
      elements: this.fullscreenQuad.elements,
      framebuffer: regl.prop('framebuffer'),
      viewport: regl.prop('viewport'),
      vert: VERT,
      frag: FRAG,
      uniforms: {
        image: regl.prop('image'),
        imageSize: (context, props) => [props.image.width, props.image.height],
        rtWidth: regl.prop('rtWidth'),
        rtHeight: regl.prop('rtHeight'),
        uOffset: [0, 0],
        uSize: [1, 1],
        direction: regl.prop('direction'),
        radius: regl.prop('radius'),
        sharpness: regl.prop('sharpness'),
        depthMap: regl.prop('depthMap'),
        depthMapSize: (context, props) => [props.depthMap.width, props.depthMap.height],
        near: (context, props) => props.camera.near,
        far: (context, props) => props.camera.far
      }
    }))
  }

  viewport.width = outputSize.width
  viewport.height = outputSize.height

  for (var i = 0; i < iterations * 2; i++) {
    var radius = (iterations - Math.floor(i / 2)) * strength
    var direction = i % 2 === 0 ? [radius, 0] : [0, radius]

    var src = (i === 0) ? source : this.getSourceTexture(readRT)

    cmd({
      framebuffer: writeRT,
      viewport: viewport,
      image: src,
      direction: direction,
      radius: radius,
      sharpness: sharpness,
      depthMap: depthMap,
      camera: options.camera
    })

    var tmp = writeRT
    writeRT = readRT
    readRT = tmp
  }

  return this.asFXStage(readRT, 'bilateralBlur')
}

module.exports = FXStage
