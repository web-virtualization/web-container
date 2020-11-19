/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.BizXMenuListItem.
jQuery.sap.declare("sap.sf.surj.shell.controls.BizXMenuListItem");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new BizXMenuListItem.
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
 * @name sap.sf.surj.shell.controls.BizXMenuListItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.BizXMenuListItem", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.BizXMenuListItem with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.BizXMenuListItem.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/BizXMenuListItem.js
sap.ui.define([
    'sap/m/ListItemBase',
    'sap/sf/surj/shell/util/Util',
    './BizXMenuListItemRenderer'
], function(ListItemBase, Util, BizXMenuListItemRenderer) {
    "use strict";

    /**
     * @class
     * @extends sap.ui.core.Control
     * @name sap.sf.surj.shell.controls.BizXMenuListItem
     */
    var BizXMenuListItem = ListItemBase.extend('sap.sf.surj.shell.controls.BizXMenuListItem', /** @lends sap.sf.surj.shell.controls.BizXMenuListItem.prototype */
    {
        metadata : {
            properties : {
                icon : 'string',
                label : 'string',
                indicatorText : 'string',
                url : 'string',
                onclick : 'string',
                target : 'string'
            }
        },

        renderer: BizXMenuListItemRenderer,
        
        isActionable : function() {
            return false;
        },

        onmouseover : function() {
            this.focus();
        },
        
        onfocusin : function() {
            this.$().find('.globalMenuItem').addClass('globalMenuItemFocus');
        },
        
        onfocusout : function() {
            this.$().find('.globalMenuItem').removeClass('globalMenuItemFocus');
        },

        onclick: function(event) {
            var onClickStr = this.$().attr('data-onclick');
            if (this.$().attr('data-preventClickDefault') === 'true') {
                event.preventDefault();
            }
            if (onClickStr) {
                Util.dangerouslyEvalScript("(function(){" + onClickStr + "})()");
            }
        },

        onAfterRendering : function() {
            var fParentCall = sap.m.ListItemBase.prototype.onAfterRendering;
            fParentCall && fParentCall.apply(this, arguments);
            this.updateAccessibilityState();
        }
    });
    
    BizXMenuListItem.prototype._getImage = function(sImgId, sImgStyle, sSrc, bIconDensityAware) {
        var oImage = this._image;

        if (oImage) {
            oImage.setSrc(sSrc);
            if (oImage instanceof sap.m.Image) {
                oImage.setDensityAware(bIconDensityAware);
            }
        } else {
            oImage = sap.ui.core.IconPool.createControlByURI({
                id: sImgId,
                src : sSrc,
                densityAware : bIconDensityAware,
                useIconTooltip : false
            }, sap.m.Image).setParent(this, null, true);
        }

        if (oImage instanceof sap.m.Image) {
            oImage.addStyleClass(sImgStyle, true);
        } else {
            oImage.addStyleClass(sImgStyle + "Icon", true);
        }

        this._image = oImage;
        return this._image;
    };

    return BizXMenuListItem;
});