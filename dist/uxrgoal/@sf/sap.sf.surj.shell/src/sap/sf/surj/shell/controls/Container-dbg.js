/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.Container.
jQuery.sap.declare("sap.sf.surj.shell.controls.Container");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new Container.
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
 * @name sap.sf.surj.shell.controls.Container
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.Container", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.Container with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.Container.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/Container.js
/**
 * A simple container.
 * 
 * @extends surj.core.Control
 * @name sap.sf.surj.common.Container
 */

sap.ui.define('sap/sf/surj/shell/controls/Container', 
    ['jquery.sap.global',
     'sap/ui/core/Control'
    ], 
    function ($, Control) {

    'use strict';

    return Control.extend('sap.sf.surj.shell.controls.Container', {
        metadata : {
            properties : {
                tagName : {
                    type : 'string',
                    defaultValue : 'div'
                }
            },
            defaultAggregation: "content",
            aggregations : {
                content : {
                    multiple : true,
                    type : 'sap.ui.core.Control'
                }
            },
            associations : {

                /**
                 * Association to controls / ids which describe this control (see WAI-ARIA attribute aria-describedby).
                 */
                ariaDescribedBy : {type : "sap.ui.core.Control", multiple : true, singularName : "ariaDescribedBy"},

                /**
                 * Association to controls / ids which label this control (see WAI-ARIA attribute aria-labelledby).
                 */
                ariaLabelledBy : {type : "sap.ui.core.Control", multiple : true, singularName : "ariaLabelledBy"}
            }
        },

        /**
         * @param {sap.ui.core.RenderManager} oRm
         * @param {sap.sf.surj.common.Container} oControl
         */
        renderer : function(oRm, oControl) {
            var sTagName = oControl.getTagName();
            oRm.write('<' + sTagName);
            if (sTagName == 'button') {
                oRm.write(' type="button"');
            }
            oRm.writeAccessibilityState(oControl);
            oRm.writeControlData(oControl);
            oRm.addClass('surjContainer');
            oRm.writeClasses();
            oRm.write('>');
            $.each(oControl.getContent() || [], function(i, oContent) {
                oRm.renderControl(oContent);
            });
            oRm.write('</' + sTagName + '>');
        }
    });
});