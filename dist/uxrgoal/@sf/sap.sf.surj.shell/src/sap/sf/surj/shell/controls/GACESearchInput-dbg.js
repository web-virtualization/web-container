/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.GACESearchInput.
jQuery.sap.declare("sap.sf.surj.shell.controls.GACESearchInput");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new GACESearchInput.
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
 * @name sap.sf.surj.shell.controls.GACESearchInput
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.GACESearchInput", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.GACESearchInput with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.GACESearchInput.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/GACESearchInput.js

/**
 * An extension of SearchInput Control for supporting GA/CE scenario
 * 
 * @name sap.sf.surj.shell.controls.GACESearchInput
 * @extends sap.sf.surj.shell.controls.SearchInput
 * @class
 */

sap.ui.define('sap/sf/surj/shell/controls/GACESearchInput', 
    ['jquery.sap.global',
     'sap/sf/surj/shell/controls/SearchInput'
    ], 
    function ($, SearchInput) {

    'use strict';
        
    return SearchInput.extend('sap.sf.surj.shell.controls.GACESearchInput', /** @lends sap.sf.surj.shell.controls.GACESearchInput.prototype */ {
        metadata : {
            library : 'sap.sf.surj.shell'
        },
        renderer: {},
        _createCriteria : function(sQuery) {

            var searchType= this.getSearchType();
            
            	var oCriteria = $.extend({
                     searchValue : sQuery
                 }, this.getSettings() || {});
            	 var bindingContext= this.getBindingContext();
            	 oCriteria.bindingContext=bindingContext;            	
            
            return oCriteria;
        },
        _getDisplayText : function(oResultItem) {
            var displayText = '';
            if(oResultItem) {
                displayText = oResultItem.name;
                if(oResultItem.code) {
                    displayText += ' (' + oResultItem.code + ')';
                }
            }
        	return displayText;
        },
        _getDisplayInfo : function(oResultItem) {
        	
        },
        _getPhotoSrc : function(oResultItem) {
        	
        }
    });
});