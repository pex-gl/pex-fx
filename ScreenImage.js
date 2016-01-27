var VERT = '\
attribute vec4 aPosition; \
attribute vec2 aTexCoord0; \
varying vec2 vTexCoord0; \
void main() { \
    vTexCoord0 = aTexCoord0; \
    gl_Position = vec4(aPosition.xy, 0.0, 1.0); \
}';

//
//


var FRAG = '\
varying vec2 vTexCoord0; \
uniform sampler2D uTexture; \
void main() { \
    gl_FragColor = texture2D(uTexture, vTexCoord0); \
}';

function ScreenImage(ctx) {
    this.mesh = ctx.createMesh([
        { data: [[-1,-1], [1,-1], [1, 1], [-1, 1]], location: ctx.ATTRIB_POSITION },
        { data: [[ 0, 0], [1, 0], [1, 1], [ 0, 1]], location: ctx.ATTRIB_TEX_COORD_0 }
    ],  { data: [[0, 1, 2], [0, 2, 3]] });

    ctx.pushState(ctx.PROGRAM_BIT);
        this.program = ctx.createProgram(VERT, FRAG);
        ctx.bindProgram(this.program);
        this.program.setUniform('uTexture', 0);
    ctx.popState(ctx.PROGRAM_BIT);
}

module.exports = ScreenImage;
