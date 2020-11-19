/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.GlobalAssignmentMenuItem.
jQuery.sap.declare("sap.sf.surj.shell.controls.GlobalAssignmentMenuItem");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new GlobalAssignmentMenuItem.
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
 * @name sap.sf.surj.shell.controls.GlobalAssignmentMenuItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.GlobalAssignmentMenuItem", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.GlobalAssignmentMenuItem with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.GlobalAssignmentMenuItem.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/GlobalAssignmentMenuItem.js
/**
 * @class
 * @extends sap.ui.core.Control
 * @name sap.sf.surj.shell.controls.GlobalAssignmentMenuItem
 */
sap.ui.define('sap/sf/surj/shell/controls/GlobalAssignmentMenuItem', [
     'sap/sf/surj/shell/controls/BizXMenuListItem',
     'sap/ui/core/Icon'
    ], 
    function (BizXMenuListItem, Icon) {

    'use strict';
        
    return BizXMenuListItem.extend('sap.sf.surj.shell.controls.GlobalAssignmentMenuItem', /** @lends sap.sf.surj.shell.controls.GlobalAssignmentMenuItem.prototype */ {
        metadata : {
            properties : {
                dimmedText : 'string',
                secondaryText : 'string',
                assignmentTypeText : 'string'
            },
            aggregations : {
                supplementalIcons : {type: "sap.ui.core.Icon", multiple: true, singularName: "supplementalIcon"}
            }
        }
    });
});

/**
 * The renderer.
 * 
 * @name sap.sf.surj.shell.GlobalAssignmentMenuItemRenderer
 */

sap.ui.define('sap/sf/surj/shell/controls/GlobalAssignmentMenuItemRenderer', 
    ['jquery.sap.global',
     'sap/ui/core/Renderer',
     'sap/sf/surj/shell/controls/BizXMenuListItemRenderer'
    ], 
    function ($, Renderer, BizXMenuListItemRenderer) {

    'use strict';

    var oParentRenderer = $.sap.getObject('sap.sf.surj.shell.controls.BizXMenuListItemRenderer');
    var oRenderer = Renderer.extend(oParentRenderer);

    var GlobalAssignmentMenuItemRenderer = $.extend(oRenderer,  /** @lends sap.sf.surj.shell.controls.GlobalAssignmentMenuItemRenderer.prototype */ {
        renderLIAttributes : function(oRm, oLI) {
            oRm.addClass('bizxGAMI');
            oParentRenderer.renderLIAttributes(oRm, oLI);
        },
        closeItemTag : function(oRm, oLI) {
            var sDimmedText = oLI.getDimmedText();
            if (sDimmedText) {
                oRm.write('<span class="bizxGAMIDimmed">');
                oRm.writeEscaped(sDimmedText);
                oRm.write('</span>');
            }
            var aIcons = oLI.getSupplementalIcons();
            aIcons && $.each(aIcons, function() {
                this.addStyleClass('bizxGAMISupplIcon');
                oRm.renderControl(this);
            });
            var sAssignmentTypeText = oLI.getAssignmentTypeText();
            if (sAssignmentTypeText) {
                oRm.write('<span class="bizxGAMIAssignmentTypeText">');
                oRm.writeEscaped(sAssignmentTypeText);
                oRm.write('</span>');
            }
            var sSecondaryText = oLI.getSecondaryText();
            if (sSecondaryText) {
                oRm.write('<br/>');
                oRm.writeEscaped(sSecondaryText);
            }
            oParentRenderer.closeItemTag(oRm, oLI);
        }
    });

    $.sap.setObject('sap.sf.surj.shell.controls.GlobalAssignmentMenuItemRenderer', GlobalAssignmentMenuItemRenderer);
    return GlobalAssignmentMenuItemRenderer;
        
});