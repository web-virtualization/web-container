
sap.ui.define('sap/sf/surj/shell/controls/BizXButtonRenderer', ['jquery.sap.global', 'sap/ui/core/Renderer', 'sap/m/ButtonRenderer'], function ($, Renderer, ButtonRenderer) {

    "use strict";
    
    

    var BizXButtonRenderer = $.extend(Renderer.extend(ButtonRenderer), {
        renderAccessibilityAttributes : function(oRm, oButton, mAccProps) {
            var sAriaLabel = oButton.getAriaLabel();
            if (sAriaLabel) {
                mAccProps['label'] = sAriaLabel;
            }
        }
    });

    $.sap.setObject('sap.sf.surj.shell.controls.BizXButtonRenderer', BizXButtonRenderer);
    return BizXButtonRenderer; 
});