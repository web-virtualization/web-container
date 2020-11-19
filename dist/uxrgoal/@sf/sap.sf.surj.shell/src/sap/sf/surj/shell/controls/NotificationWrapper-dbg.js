/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.NotificationWrapper.
jQuery.sap.declare("sap.sf.surj.shell.controls.NotificationWrapper");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new NotificationWrapper.
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
 * @name sap.sf.surj.shell.controls.NotificationWrapper
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.NotificationWrapper", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.NotificationWrapper with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.NotificationWrapper.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/NotificationWrapper.js

/**
 * @class
 * @extends sap.ui.core.Control
 * @name sap.sf.surj.shell.controls.NotificationWrapper
 */


sap.ui.define('sap/sf/surj/shell/controls/NotificationWrapper', 
    ['jquery.sap.global',
     'sap/ui/core/Control'
    ], 
    function ($, Control) {

    'use strict';
    var oCore = sap.ui.getCore();
    var oRb = oCore.getLibraryResourceBundle('sap.sf.surj.shell.i18n');
        
    return Control.extend('sap.sf.surj.shell.controls.NotificationWrapper', /** @lends sap.sf.surj.shell.controls.NotificationWrapper.prototype */ {
        metadata : {
            properties : {
                text : 'string'
            },
            aggregations : {
                content : {
                    type : 'sap.ui.core.Control',
                    multiple : false
                }
            }
        },

        /**
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.NotificationWrapper} oControl The
         *            control instance
         */
        renderer : function(oRm, oControl) {
            oRm.write('<div');
            oRm.writeControlData(oControl);
            oRm.addClass('surjNotificationWrapper');
            oRm.writeClasses();
            oRm.write('>');
            var oContent = oControl.getContent();
            if (oContent) {
                oRm.renderControl(oContent);
            }
            oRm.write('</div>');
        },

        /**
         * 
         */
        onAfterRendering : function() {
            this._updateNotificationText();
        },

        /**
         * @private
         */
        _updateNotificationText : function() {
            var sText = this.getText();
            var el = this.$();
            if (el && el.length > 0) {
                var text = el.find('.surjNotificationText');
                if (text.length > 0) {
                    if (sText) {
                        text.text(sText);
                    } else {
                        text.remove();
                    }
                } else if (sText) {
                    var textEl = $('<div class="surjNotificationText globalHeaderAlertBadge"></div>').text(sText);
                    var btn = el.find('button');
                    if (btn.length > 0) {
                        btn.append(textEl);
                        var iCount = parseInt(sText ? sText : 0, 10) || 0;
                        var sTooltip;
                        if (iCount === 0) {
                            sTooltip = oRb.getText('HOME_Todo_MSG_ALL_COMPLETED');
                        } else {
                            sTooltip = (iCount === 1 ? oRb.getText('COMMON_You_Have_Todos_SINGULAR') : oRb.getText('COMMON_You_Have_Todos_PLURAL', [ iCount ]));
                        }
                        btn.find('#globalTodos-tooltip').text(sTooltip);
                    } else {
                        el.append(textEl);
                    }
                }
            }
        },

        setContent : function(oContent) {
            this.setAggregation('content', oContent);
            oContent.addEventDelegate({
                onAfterRendering : $.proxy(this._updateNotificationText, this)
            });
        },

        /**
         * @param {String} sText
         */
        setText : function(sText) {
            this.setProperty('text', sText, true);
            this._updateNotificationText();
        }
    });
});