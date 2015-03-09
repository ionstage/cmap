(function(global) {
  'use strict';
  var cmap = {};

  if (typeof module !== 'undefined' && module.exports)
    module.exports = cmap;
  else
    global.cmap = cmap;
})(this);