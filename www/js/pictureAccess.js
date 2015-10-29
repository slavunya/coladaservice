/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



var PictureAccess = function() {

};

/*
*	success - success callback
*	fail - error callback
*/
PictureAccess.prototype.checkAccess = function(success, fail) {
  if (device.platform.toLowerCase() != 'ios') {
    success();
    return;
  }
  cordova.exec(success, fail, "PictureAccess", "checkAccess");
};
if(!window.plugins) {
    window.plugins = {};
}
if (!window.plugins.pictureAccess) {
    window.plugins.pictureAccess = new PictureAccess();
}

if (typeof module != 'undefined' && module.exports) {
  module.exports = PictureAccess;
}