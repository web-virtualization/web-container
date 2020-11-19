/* -----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying
 * source files only (*.type, *.js) or they will be lost after the next generation.
 * ----------------------------------------------------------------------------------- */

/**
 * Initialization Code and shared classes of library sap.sf.surj.shell (1.0.2-SNAPSHOT)
 */
jQuery.sap.declare("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Core");
/**
 * Common UI shell library
 *
 * @namespace
 * @name sap.sf.surj.shell
 * @public
 */


// library dependencies
jQuery.sap.require("sap.ui.core.library");

// delegate further initialization of this library to the Core
sap.ui.getCore().initLibrary({
	name : "sap.sf.surj.shell",
	dependencies : ["sap.ui.core"],
	types: [],
	interfaces: [],
	controls: [
		"sap.sf.surj.shell.controls.BizXApp",
		"sap.sf.surj.shell.controls.BizXMenuListItem",
		"sap.sf.surj.shell.controls.BizXMenuPopover",
		"sap.sf.surj.shell.controls.BizXPage",
		"sap.sf.surj.shell.controls.BizXSearchField",
		"sap.sf.surj.shell.controls.BizXShell",
		"sap.sf.surj.shell.controls.BizXSuggestionItem",
		"sap.sf.surj.shell.controls.Container",
		"sap.sf.surj.shell.controls.FocusMarker",
		"sap.sf.surj.shell.controls.GACESearchInput",
		"sap.sf.surj.shell.controls.GACESearchResult",
		"sap.sf.surj.shell.controls.GlobalAssignmentMenuItem",
		"sap.sf.surj.shell.controls.IntroSuggestionItem",
		"sap.sf.surj.shell.controls.NotificationWrapper",
		"sap.sf.surj.shell.controls.PeopleSuggestionItem",
		"sap.sf.surj.shell.controls.ResponsiveSidePanel",
		"sap.sf.surj.shell.controls.SearchInput",
		"sap.sf.surj.shell.controls.SearchResult",
		"sap.sf.surj.shell.controls.ShowMeCallout",
		"sap.sf.surj.shell.controls.ShowMoreSuggestionItem",
		"sap.sf.surj.shell.controls.Table",
		"sap.sf.surj.shell.controls.UserPhoto"
	],
	elements: [],
	version: "1.0.2-SNAPSHOT"
});

