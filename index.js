var FXStage = require('./FXStage');
require('./Render');
require('./Blit');
//require('./Add');
//require('./Blur3');
//require('./Blur5');
//require('./Blur');
require('./Downsample2');
require('./Downsample4');
//require('./FXAA');
//require('./CorrectGamma');
//require('./TonemapReinhard');
//require('./Save');
//require('./Mult');
//require('./SSAO');
//
//var globalFx;
//
//module.exports = function() {
//  if (!globalFx) {
//    globalFx = new FXStage();
//  }
//  globalFx.reset();
//  return globalFx;
//};

module.exports = function(ctx) {
    return new FXStage(ctx);
}

module.exports.FXStage = FXStage;
