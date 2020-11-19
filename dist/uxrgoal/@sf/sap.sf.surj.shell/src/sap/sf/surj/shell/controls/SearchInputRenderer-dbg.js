sap.ui.define(['jquery.sap.global', 'sap/ui/core/Renderer', 'sap/m/InputRenderer', 'sap/m/ComboBoxRenderer'], function(jQuery, Renderer, InputRenderer, ComboBoxRenderer) {
    "use strict";
    var SearchInputRenderer = Renderer.extend(InputRenderer);

    SearchInputRenderer.CSS_CLASS_COMBOBOXBASE = ComboBoxRenderer.CSS_CLASS_COMBOBOXBASE;

    SearchInputRenderer.addOuterClasses = function(oRm, oControl) {
        if (oControl.getPending()) {
            oRm.addClass('bizXSFPending');
        }
        InputRenderer.addOuterClasses(oRm, oControl);
    };

    return SearchInputRenderer;
}, /* bExport= */ true);