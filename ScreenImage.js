var fs = require('fs');

var VERT = fs.readFileSync(__dirname + '/ScreenImage.vert', 'utf8');
var FRAG = fs.readFileSync(__dirname + '/ScreenImage.frag', 'utf8');

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
