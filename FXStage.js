var FXResourceMgr = require('./FXResourceMgr');
var ScreenImage = require('./ScreenImage');
var FXStageCount = 0;

function FXStage(ctx, source, resourceMgr, fullscreenQuad) {
    this.id = FXStageCount++;
    this.ctx = ctx;
    this.source = source || null;
    this.resourceMgr = resourceMgr || new FXResourceMgr(ctx);
    this.fullscreenQuad = fullscreenQuad || new ScreenImage(ctx);
    this.defaultBPP = 8;
}

FXStage.prototype.reset = function() {
    this.resourceMgr.markAllAsNotUsed();
    return this;
};

FXStage.prototype.getOutputSize = function(width, height) {
    if (width && height) {
        return {
            width: width,
            height: height
        };
    }
    else if (this.source && this.source.width) {
        return {
            width: this.source.width,
            height: this.source.height
        };
    }
    else if (this.source && this.source.getWidth) {
        return {
            width: this.source.getWidth(),
            height: this.source.getHeight()
        };
    }
    else {
        var viewport = this.ctx.getViewport()
        return {
            width: viewport[2],
            height: viewport[3]
        };
    }
};

FXStage.prototype.getRenderTarget = function(w, h, depth, bpp) {
    depth = depth || false;
    bpp = bpp || this.defaultBPP;
    var resProps = {
        w: w,
        h: h,
        depth: depth,
        bpp: bpp
    };
    var res = this.resourceMgr.getResource('RenderTarget', resProps);
    var ctx = this.ctx;
    if (!res) {
        console.log('getRenderTarget', w, h)
        var colorTex = ctx.createTexture2D(null, w, h, { magFilter: ctx.LINEAR, minFilter: ctx.LINEAR, type: ctx.UNSIGNED_BYTE });
        var colorAttachments = [{
            texture: colorTex
        }]

        var depthAttachment = null;
        if (depth) {
            var depthTex = ctx.createTexture2D(null, w, h, { magFilter: ctx.NEAREST, minFilter: ctx.NEAREST, format: ctx.DEPTH_COMPONENT, type: ctx.UNSIGNED_SHORT });
            depthAttachment = {
                texture: depthTex
            }
        }

        var renderTarget = ctx.createFramebuffer(colorAttachments, depthAttachment);
        res = this.resourceMgr.addResource('RenderTarget', renderTarget, resProps);
    }
    res.used = true;
    return res.obj;
};

FXStage.prototype.getFXStage = function(name) {
    var resProps = {};
    var res = this.resourceMgr.getResource('FXStage', resProps);
    if (!res) {
        var fxState = new FXStage(this.ctx, null, this.resourceMgr, this.fullscreenQuad);
        res = this.resourceMgr.addResource('FXStage', fxState, resProps);
    }
    res.used = true;
    return res.obj;
};

FXStage.prototype.asFXStage = function(source, name) {
    var stage = this.getFXStage(name);
    stage.source = source;
    stage.name = name + '_' + stage.id;
    return stage;
};

FXStage.prototype.getShader = function(vert, frag) {
    var resProps = { vert: vert, frag: frag };
    var res = this.resourceMgr.getResource('Program', resProps);
    if (!res) {
        var ctx = this.ctx;
        var program = ctx.createProgram(vert, frag);
        res = this.resourceMgr.addResource('Program', program, resProps);
    }
    res.used = true;
    return res.obj;
};

FXStage.prototype.getSourceTexture = function(source) {
    if (source) {
        if (source.source) {
            if (source.source.getColorAttachment) {
                return source.source.getColorAttachment(0).texture;
            }
            else return source.source;
        }
        else if (source.getColorAttachment) {
            return source.getColorAttachment(0).texture;
        }
        else return source;
    }
    else if (this.source) {
        if (this.source.getColorAttachment) {
            return this.source.getColorAttachment(0).texture;
        }
        else return this.source;
    }
    else throw 'FXStage.getSourceTexture() No source texture!';
};

FXStage.prototype.drawFullScreenQuad = function(width, height, image, program) {
    this.drawFullScreenQuadAt(0, 0, width, height, image, program);
};

FXStage.prototype.drawFullScreenQuadAt = function(x, y, width, height, image, program) {
    var ctx = this.ctx;
    program = program || this.fullscreenQuad.program
    ctx.pushState(ctx.DEPTH_BIT | ctx.VIEWPORT_BIT | ctx.MESH_BIT | ctx.PROGRAM_BIT | ctx.TEXTURE_BIT);
        ctx.setDepthTest(false);
        ctx.setDepthMask(0);
        ctx.setViewport(x, y, width, height);
        ctx.bindMesh(this.fullscreenQuad.mesh);
        ctx.bindProgram(program);
        if (program.hasUniform('imageSize')) {
            var w = image.width || image.getWidth()
            var h = image.height || image.getHeight()
            program.setUniform('imageSize', [w, h]); //TODO: reuse imageSize array
        }
        ctx.bindTexture(image, 0);
        ctx.drawMesh();
    ctx.popState(ctx.DEPTH_BIT | ctx.VIEWPORT_BIT | ctx.MESH_BIT | ctx.PROGRAM_BIT | ctx.TEXTURE_BIT);
};

FXStage.prototype.getImage = function(path) {
    throw new Error('FXStage.getImage is not implemented!');
    //var resProps = { path: path };
    //var res = this.resourceMgr.getResource('Image', resProps);
    //if (!res) {
    //    var image = Texture2D.load(path);
    //    res = this.resourceMgr.addResource('Image', image, resProps);
    //}
    //res.used = false;
    ////can be shared so no need for locking
    //return res.obj;
};

FXStage.prototype.getFullScreenQuad = function() {
    return this.fullscreenQuad;
};

module.exports = FXStage;
