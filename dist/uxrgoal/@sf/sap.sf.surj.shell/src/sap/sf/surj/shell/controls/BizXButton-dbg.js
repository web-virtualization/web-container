    
sap.ui.define('sap/sf/surj/shell/controls/BizXButton', ['jquery.sap.global', 'sap/m/Button', './BizXButtonRenderer'], function ($, Button, BizXButtonRenderer) {
    "use strict";

    /**
     * @class
     * @extends sap.m.Button
     * @name sap.sf.surj.shell.controls.BizXButton
     */
    return Button.extend('sap.sf.surj.shell.controls.BizXButton', /** @lends sap.sf.surj.shell.controls.BizXButton.prototype */
    {
        metadata : {
            properties : {
                ariaLabel : 'string'
            }
        },
        renderer: BizXButtonRenderer,
        setTooltip : function(vTooltip) {
            if (typeof vTooltip == 'string' || vTooltip == null) {
                this.setAggregation("tooltip", vTooltip, true);
                this.$().attr('title', vTooltip || '');
            } else {
                return oParentObject.prototype.setTooltip.apply(this, arguments);
            }
        },
        onAfterRendering : function() {
            var fParentCall = Button.prototype.onAfterRendering;
            var result = fParentCall && fParentCall.apply(this, arguments);
            this.$().attr('type', 'button')
                    // UI-9352 add this seemingly useless onclick handler so we can detect if Jam has overridden it to be return false
                    .find('.sapMBtnInner').attr('onclick', 'return true;');
            return result;
        }
    });
});