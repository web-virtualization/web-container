sap.ui.define('sap/sf/surj/shell/util/Polyfill',[],function(){"use strict";if(!sap.ui.require('sap/base/Log')){sap.ui.requireSync('jquery.sap.global');sap.ui.define('sap/base/Log',function(){return jQuery.sap.log;});}});