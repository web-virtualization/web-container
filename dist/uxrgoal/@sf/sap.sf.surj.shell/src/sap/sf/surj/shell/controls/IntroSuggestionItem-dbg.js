/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.IntroSuggestionItem.
jQuery.sap.declare("sap.sf.surj.shell.controls.IntroSuggestionItem");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new IntroSuggestionItem.
 * 
 * Accepts an object literal <code>mSettings</code> that defines initial 
 * property values, aggregated and associated objects as well as event handlers. 
 * 
 * If the name of a setting is ambiguous (e.g. a property has the same name as an event), 
 * then the framework assumes property, aggregation, association, event in that order. 
 * To override this automatic resolution, one of the prefixes "aggregation:", "association:" 
 * or "event:" can be added to the name of the setting (such a prefixed name must be
 * enclosed in single or double quotes).
 *
 * The supported settings are:
 * <ul>
 * <li>Properties
 * <ul></ul>
 * </li>
 * <li>Aggregations
 * <ul></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul></ul>
 * </li>
 * </ul> 

 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * @extends sap.ui.core.Control
 * @version 1.0.2-SNAPSHOT
 *
 * @constructor
 * @public
 * @name sap.sf.surj.shell.controls.IntroSuggestionItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.IntroSuggestionItem", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.IntroSuggestionItem with name <code>sClassName</code> 
 * and enriches it with the information contained in <code>oClassInfo</code>.
 * 
 * <code>oClassInfo</code> might contain the same kind of informations as described in {@link sap.ui.core.Element.extend Element.extend}.
 *   
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] object literal with informations about the class  
 * @param {function} [FNMetaImpl] constructor function for the metadata object. If not given, it defaults to sap.ui.core.ElementMetadata.
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.sf.surj.shell.controls.IntroSuggestionItem.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/IntroSuggestionItem.js
 /**
  * @class
  * @extends sap.ui.core.Control
  * @name sap.sf.surj.shell.controls.IntroSuggestionItem
  */

sap.ui.define('sap/sf/surj/shell/controls/IntroSuggestionItem', 
    ['jquery.sap.global',
     'sap/m/SuggestionItem'
    ], 
    function ($, SuggestionItem) {

    'use strict';
        
    return SuggestionItem.extend('sap.sf.surj.shell.controls.IntroSuggestionItem', /** @lends sap.sf.surj.shell.controls.IntroSuggestionItem.prototype */ {
        metadata : {
            properties : {
                introSnippet : 'string'
            }
        },
        /**
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.IntroSuggestionItem} oControl The
         *            control instance
         */
        render : function(rm, oItem, sSearch, bSelected) {
            rm.write('<li');
            rm.writeElementData(oItem);
            rm.addClass('sapMSuLI');
            rm.addClass('bizXIntroSuggestionItem');
            rm.writeClasses();
            rm.write('>');
            rm.write(oItem.getIntroSnippet());
            rm.write('</li>');
        }
    });

});