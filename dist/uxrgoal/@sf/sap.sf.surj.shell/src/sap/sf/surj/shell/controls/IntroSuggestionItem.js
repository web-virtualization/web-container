jQuery.sap.declare("sap.sf.surj.shell.controls.IntroSuggestionItem");jQuery.sap.require("sap.sf.surj.shell.library");jQuery.sap.require("sap.ui.core.Control");sap.ui.core.Control.extend("sap.sf.surj.shell.controls.IntroSuggestionItem",{metadata:{library:"sap.sf.surj.shell"}});sap.ui.define('sap/sf/surj/shell/controls/IntroSuggestionItem',['jquery.sap.global','sap/m/SuggestionItem'],function($,S){'use strict';return S.extend('sap.sf.surj.shell.controls.IntroSuggestionItem',{metadata:{properties:{introSnippet:'string'}},render:function(r,i,s,b){r.write('<li');r.writeElementData(i);r.addClass('sapMSuLI');r.addClass('bizXIntroSuggestionItem');r.writeClasses();r.write('>');r.write(i.getIntroSnippet());r.write('</li>');}});});
