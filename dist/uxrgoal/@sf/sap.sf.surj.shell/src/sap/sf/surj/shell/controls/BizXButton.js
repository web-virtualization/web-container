sap.ui.define('sap/sf/surj/shell/controls/BizXButton',['jquery.sap.global','sap/m/Button','./BizXButtonRenderer'],function($,B,a){"use strict";return B.extend('sap.sf.surj.shell.controls.BizXButton',{metadata:{properties:{ariaLabel:'string'}},renderer:a,setTooltip:function(t){if(typeof t=='string'||t==null){this.setAggregation("tooltip",t,true);this.$().attr('title',t||'');}else{return oParentObject.prototype.setTooltip.apply(this,arguments);}},onAfterRendering:function(){var p=B.prototype.onAfterRendering;var r=p&&p.apply(this,arguments);this.$().attr('type','button').find('.sapMBtnInner').attr('onclick','return true;');return r;}});});
