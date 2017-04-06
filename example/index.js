'use strict'
const isBrowser = require('is-browser')
let W = isBrowser ? window.innerWidth : 1280
let H = isBrowser ? window.innerHeight : 720
const gl = require('pex-gl')(W, H)
const regl = require('regl')({
  gl: gl,
  pixelRatio: 2,
  extensions: ['OES_texture_float', 'WEBGL_depth_texture', 'WEBGL_draw_buffers']
})
const Mat4 = require('pex-math/Mat4')
const createCube = require('primitive-cube')
const createSphere = require('primitive-sphere')
const glsl = require('glslify')
const fx = require('..')(regl)
const random = require('pex-random')
const MathUtils = require('pex-math/Utils')
const Vec3 = require('pex-math/Vec3')
const flatten = require('flatten')

const box = createCube()
const floor = createCube(4, 0.1, 4)
const block = createCube(0.5, 2, 0.5)
const sphere = createSphere(0.5)
const rects = require('./rects.json')

const camera = require('./pex-cam/perspective')({
  position: Vec3.scale(Vec3.normalize([0, 1, 2]), 5),
  fov: Math.PI / 4,
  near: 0.1,
  far: 30,
  aspect: W / H
})

if (isBrowser) {
  require('./pex-cam/arcball')({
    camera: camera
  })
}

const SceneVert = glsl`
#ifdef GL_ES
#pragma glslify: transpose = require(glsl-transpose)
#endif
#pragma glslify: inverse = require(glsl-inverse)

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

varying vec3 vNormal;

void main () {
  mat4 modelViewMatrix = uViewMatrix * uModelMatrix;
  mat3 normalMatrix = mat3(transpose(inverse(modelViewMatrix)));
  vNormal = normalMatrix * aNormal;
  gl_Position = uProjectionMatrix * modelViewMatrix * vec4(aPosition, 1.0);
}
`

const SceneFrag = glsl`
#ifdef GL_ES
precision highp float;
#extension GL_EXT_draw_buffers : require
#endif

varying vec3 vNormal;

uniform vec4 uColor;

void main () {
  gl_FragData[0] = uColor;
  gl_FragData[1] = vec4(vNormal * 0.5 + 0.5, 1.0);
}
`
const drawGeom = regl({
  attributes: {
    aPosition: (context, props) => props.geom.positions,
    aNormal: (context, props) => props.geom.normals
  },
  elements: (context, props) => props.geom.cells,
  vert: regl.prop('vert'),
  frag: regl.prop('frag'),
  uniforms: {
    uProjectionMatrix: () => camera.projectionMatrix,
    uViewMatrix: () => camera.viewMatrix,
    uModelMatrix: (context, props) => {
      const mat = Mat4.createFromTranslation(props.position)
      if (props.scale) {
        Mat4.scale(mat, props.scale)
      }
      return mat
    },
    uColor: (context, props) => props.color || [1, 1, 1, 1]
  }
})

function drawScene (vert, frag) {
  drawGeom({ geom: floor, position: [0, 0, 0], vert: vert, frag: frag })
  drawGeom({ geom: block, position: [-1, 1, 1], vert: vert, frag: frag })
  drawGeom([
    { geom: sphere, position: [0, 0.5, 0], vert: vert, frag: frag, color: [0.8, 0.9, 0.2, 1.0] },
    { geom: sphere, position: [1, 0.5, 0], vert: vert, frag: frag, color: [0.8, 0.9, 0.2, 1.0] },
    { geom: sphere, position: [0.5, 0, 0.5], vert: vert, frag: frag, color: [0.8, 0.9, 0.2, 1.0] }
  ])
  rects.forEach(function (rect) {
    drawGeom({
      geom: box,
      position: [rect[0] + rect[2] / 2, 0.04 * (1 + rect[4]) / 2, rect[1] + rect[3] / 2],
      scale: [rect[2], 0.04 * (1 + rect[4]), rect[3]],
      vert: vert,
      frag: frag
    })
  })
  // ctx.translate([rect[0] + rect[2]/2, levelHeight*(1+rect[4])/2, rect[1] + rect[3]/2])
  // ctx.scale([rect[2], levelHeight*(1+rect[4]), rect[3]])
}

const depthMap = regl.texture({
  width: W,
  height: H,
  type: 'uint16',
  format: 'depth'
})

const colorMap = regl.texture({
  width: W,
  height: H,
  type: 'float'
})

const normalMap = regl.texture({
  width: W,
  height: H,
  type: 'float'
})

const fbo = regl.framebuffer({
  // depthStencil: depthMap,
  depth: depthMap,
  color: [colorMap, normalMap ]
})

const bindFbo = regl({
  framebuffer: fbo
})

random.seed(1)

const ssaoKernel = []
for (let i = 0; i < 64; i++) {
  const sample = [
    random.float() * 2 - 1,
    random.float() * 2 - 1,
    random.float(),
    1
  ]
  Vec3.normalize(sample)
  let scale = random.float()
  scale = MathUtils.lerp(0.1, 1.0, scale * scale)
  Vec3.scale(sample, scale)
  ssaoKernel.push(sample)
}
const ssaoKernelData = new Float32Array(flatten(ssaoKernel))

const ssaoNoise = []
for (let j = 0; j < 64; j++) {
  const noiseSample = [
    random.float() * 2 - 1,
    random.float() * 2 - 1,
    0,
    1
  ]
  Vec3.normalize(noiseSample)
  ssaoNoise.push(noiseSample)
}
const ssaoNoiseData = new Float32Array(flatten(ssaoNoise))

const ssaoKernelMap = regl.texture({
  data: ssaoKernelData,
  width: 8,
  height: 8,
  type: 'float',
  min: 'nearest',
  max: 'nearest',
  wrap: 'repeat'
})

// TODO: so is this 4x4 or 8x8? (it's 64 floats, but was w=4 h=4)
const ssaoNoiseMap = regl.texture({
  data: ssaoNoiseData,
  width: 8,
  height: 8,
  type: 'float',
  min: 'nearest',
  max: 'nearest',
  wrap: 'repeat'
})

let drawFrame = function () {
  // if (frame++ > 1) return

  regl.clear({
    color: [0.2, 0.2, 0.2, 1],
    depth: 1
  })

  const root = fx.reset()

  // const color = root.wrapRender({ width: W, height: H, depth: true }, () => {
  bindFbo(() => {
    regl.clear({
      color: [0, 0, 0, 1],
      depth: 1
    })
    drawScene(SceneVert, SceneFrag)
  })

  let ssao = root.ssao({
    width: W,
    height: H,
    depthMap: depthMap,
    normalMap: normalMap,
    camera: camera,
    noiseMap: ssaoNoiseMap,
    kernelMap: ssaoKernelMap,
    radius: 0.2
  })
  // .blur3().blur3()
  .bilateralBlur({ depthMap: depthMap, camera: camera, strength: 0.35 })

  let img = root.image(colorMap)

  const ssaoColor = img
    .mult(ssao, { scale: 0.2 })
  
  ssaoColor.blit({ x: 0, y: H / 2, width: W / 2, height: H / 2})

  ssaoColor
    .blur3()
    .blit({ x: W / 2, y: H / 2, width: W / 2, height: H / 2})
}

regl.frame(() => {
  try {
    drawFrame()
  } catch (e) {
    console.log(e)
    console.log(e.stack)
    drawFrame = () => {}
  }
})
