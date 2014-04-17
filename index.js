var FXStage = require('./lib/FXStage');
require('./lib/Render');
require('./lib/Blit');
require('./lib/Blur5');
require('./lib/Downsample4');
require('./lib/FXAA');
require('./lib/CorrectGamma');
require('./lib/TonemapReinhard');

var globalFx;

module.exports = function() {
  if (!globalFx) {
    globalFx = new FXStage();
  }
  globalFx.reset();
  return globalFx;
};