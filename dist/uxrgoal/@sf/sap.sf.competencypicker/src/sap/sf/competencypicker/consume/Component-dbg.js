sap.ui.define(['jquery.sap.global', 'sap/ui/core/UIComponent'],
	function(jQuery, UIComponent) {
	"use strict";

	var Component = UIComponent.extend("sap.sf.consume.Component", {
		metadata : {
			manifest : "json"
		}
	});
	return Component;
});