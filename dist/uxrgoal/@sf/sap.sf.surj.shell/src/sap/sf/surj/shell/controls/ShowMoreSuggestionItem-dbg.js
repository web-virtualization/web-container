/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.ShowMoreSuggestionItem.
jQuery.sap.declare("sap.sf.surj.shell.controls.ShowMoreSuggestionItem");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new ShowMoreSuggestionItem.
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
 * @name sap.sf.surj.shell.controls.ShowMoreSuggestionItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.ShowMoreSuggestionItem", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.ShowMoreSuggestionItem with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.ShowMoreSuggestionItem.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/ShowMoreSuggestionItem.js

/**
 * @class
 * @extends sap.ui.core.Control
 * @name sap.sf.surj.shell.controls.ShowMoreSuggestionItem
 */

sap.ui.define('sap/sf/surj/shell/controls/ShowMoreSuggestionItem', [
           'sap/m/SuggestionItem'
          ], function(SuggestionItem) {

    "use strict";

    return SuggestionItem.extend('sap.sf.surj.shell.controls.ShowMoreSuggestionItem', /** @lends sap.sf.surj.shell.controls.ShowMoreSuggestionItem.prototype */ {
        metadata : {
            properties : {
                a11yAnnouncement : 'string'
            }
        },
        /**
         * @param {sap.ui.core.RenderManager} oRenderManager
         * @param {sap.sf.surj.shell.controls.ShowMoreSuggestionItem} oItem
         * @param {String} sSearch
         * @param {Boolean} bSelected
         */
        render : function(rm, oItem, sSearch, bSelected) {
            rm.write('<li');
            rm.writeElementData(oItem);
            rm.addClass('bizXSuggestionItem');
            rm.addClass('bizXShowMoreSuggestionItem');
            rm.addClass('sapMSuLI');
            rm.addClass('sapMSelectListItem');
            rm.addClass('sapMSelectListItemBase');
            rm.writeClasses();
            rm.write('>');
            rm.writeEscaped(oItem.getText());
            rm.write('</li>');
        }
    });
});