jQuery.sap.declare("sap.sf.surj.shell.controls.FocusMarker");jQuery.sap.require("sap.sf.surj.shell.library");jQuery.sap.require("sap.ui.core.Control");sap.ui.core.Control.extend("sap.sf.surj.shell.controls.FocusMarker",{metadata:{library:"sap.sf.surj.shell"}});sap.ui.define('sap/sf/surj/shell/controls/FocusMarker',['jquery.sap.global','sap/ui/core/Control'],function($,C){'use strict';var r=sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');return C.extend('sap.sf.surj.shell.controls.FocusMarker',{metadata:{},renderer:function(R,c){R.write('<button');R.writeControlData(c);R.addClass('sfFocusMarker');R.addClass('hiddenAriaContent');R.writeClasses();R.writeAttributeEscaped('title',r.getText('COMMON_HIDDEN_FOCUS_MARKER_TITLE'));R.writeAccessibilityState(c,{hidden:true});R.write('></button>');}});});
