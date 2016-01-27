var FXStage = require('./FXStage');
require('./Render');
require('./Blit');
//require('./lib/Add');
//require('./lib/Blur3');
//require('./lib/Blur5');
//require('./lib/Blur');
//require('./lib/Downsample2');
//require('./lib/Downsample4');
//require('./lib/FXAA');
//require('./lib/CorrectGamma');
//require('./lib/TonemapReinhard');
//require('./lib/Save');
//require('./lib/Mult');
//require('./lib/SSAO');
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
