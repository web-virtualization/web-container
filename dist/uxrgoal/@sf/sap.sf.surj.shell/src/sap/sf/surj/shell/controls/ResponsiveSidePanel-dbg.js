/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.ResponsiveSidePanel.
jQuery.sap.declare("sap.sf.surj.shell.controls.ResponsiveSidePanel");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new ResponsiveSidePanel.
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
 * @name sap.sf.surj.shell.controls.ResponsiveSidePanel
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.ResponsiveSidePanel", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.ResponsiveSidePanel with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.ResponsiveSidePanel.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/ResponsiveSidePanel.js
/**
 * A Responsive Side Panel is a popup which will come in from the side.
 * 
 * @class
 * @name sap.sf.surj.commons.ResponsiveSidePanel
 * @extends sap.sf.surj.core.Control
 */

sap.ui.define('sap/sf/surj/shell/controls/ResponsiveSidePanel', 
    ['jquery.sap.global',
     'sap/ui/core/Control', 
     'sap/ui/core/Popup',
     'sap/ui/Device',
     'sap/sf/surj/shell/util/A11yPreferences'
    ], 
    function ($, Control, Popup, Device, A11yPreferences) {

      "use strict";

      return Control.extend('sap.sf.surj.shell.controls.ResponsiveSidePanel', /** @lends sap.sf.surj.shell.controls.ResponsiveSidePanel.prototype */ {
        metadata : {
            library : 'sap.sf.surj.shell',
            interfaces : [ 'sap.ui.core.PopupInterface' ],
            publicMethods : [ 'show', 'hide', 'isShown' ],
            events : {
                afterHide : {},
                afterShow : {}
            },
            properties : {
                closeOnClick : 'boolean',
                from : 'string',
                refocusRef : 'any',
                widthThreshold : {
                    type : 'int',
                    defaultValue : 320
                },
                resizeHide : {
                    type : 'boolean',
                    defaultValue : false
                },
                top : {
                    type : 'any',
                    defaultValue : 0
                },
                left : 'string',
                modal : 'boolean'
            },
            aggregations : {
                header : {
                    multiple : false,
                    type : 'sap.m.IBar'
                },
                content : {
                    multiple : true,
                    type : 'sap.ui.core.Control',
                    singularName : 'content'
                }
            },
            defaultAggregation : 'content'
        },

        init : function() {
            var that = this;
            this.oPopup = new Popup(this);
            this.oPopup.setModal(true, 'transparentShim');
            this.oPopup.setDurations(250, 250);
            this.oPopup.onsapescape = $.proxy(this.hide, this);
            this.oPopup.attachClosed(function() {
                var oRefocusRef = that.getRefocusRef();
                jQuery.sap.focus(oRefocusRef);
                that.fireAfterHide();
                if (window.SFBodyEventDispatcher) {
                    SFBodyEventDispatcher.handleBodyReset(false, true);
                }
            });
        },

        exit : function() {
            if (this.oPopup) {
                this.oPopup.destroy();
                this.oPopup = null;
            }
        },

        /**
         * Show the popup.
         */
        show : function() {
            // Best for adding as a listener to a dom event
            if (this.hide === $.sap.getObject('sap.sf.surj.shell.controls.ResponsiveSidePanel').prototype.hide) {
                this.hide = $.proxy(this.hide, this);
            }

            var oPopup = this.oPopup;
            var sFrom = this.getFrom();
            var iTop = parseInt(this.getTop());
            var bRTL = sap.ui.getCore().getConfiguration().getRTL();
            if (sFrom == 'begin') {
                sFrom = bRTL ? 'right' : 'left';
            }
            if (sFrom == 'end') {
                sFrom = bRTL ? 'left' : 'right';
            }
            var oPlacemat = $('#content');
            oPopup.setPosition(sFrom + ' top+' + iTop, sFrom + ' top', document.body, '0 0');

            /*
             * The animation is a sliding animation, the popup contents are
             * temporarily moved into a fixed width div, then the width of the
             * popup is increased. We do not want the contents of the popup to
             * slide from offscreen, because that would cause the viewport to go
             * crazy on mobile.
             */
            oPopup.setAnimations($.proxy(function($Popup, iDuration, fnCallback) {
                var $Wrapper = this.$('wrapper');
                var sOverflow = $Popup.css('overflow');
                $Wrapper.css({
                    position : 'absolute',
                    width : $Popup.width() + 'px'
                }).css(sFrom == 'left' ? 'right' : 'left', 0);
                $Popup.css({
                    width : 0,
                    display : 'block'
                }).animate({
                    width : this.getWidth() + 'px'
                }, iDuration, null, function() {
                    $Wrapper.css({
                        position : 'static',
                        width : '100%'
                    });
                    $Popup.css('overflow', sOverflow);
                    fnCallback && fnCallback();
                    /*
                     * This is a hack for mobile, the focus is usually put on a
                     * large <ul> rather than smaller <li> which causes the
                     * window to scroll down a little bit in some cases. Move
                     * the scroll back to the top.
                     */
                    window.scrollTo(window.scrollX, 0);
                });
            }, this), $.proxy(function($Popup, iDuration, fnCallback) {
                var sOverflow = $Popup.css('overflow');
                this.$('wrapper').css({
                    position : 'absolute',
                    width : $Popup.width() + 'px'
                });
                $Popup.animate({
                    width : 0
                }, iDuration, null, fnCallback);
            }, this));
            oPopup.open();
            this.mInitWidth = $(window).width();
            /*
             * Touching on the block layer closes the popup, delay the listener
             * because sometimes the initial click on the button to open the
             * side panel could cause this event to fire causing the panel to
             * immediately close.
             */
            setTimeout($.proxy(function() {
                $('#sap-ui-blocklayer-popup').on('mousedown touchstart', this.hide);
            }, this), 100);
        },

        /**
         * Hide the popup.
         */
        hide : function() {
            if (this.isShown()) {
                $('#sap-ui-blocklayer-popup').off('mousedown touchstart', this.hide);
                if (window.SFBodyEventDispatcher) {
                    SFBodyEventDispatcher.removeResizeListener(null, this);
                } else {
                    jQuery(window).off('resize', this._resizeHandler);
                }
                this.oPopup.close();
            }
        },

        isShown : function() {
            return this.oPopup.isOpen();
        },

        /**
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.commons.ResponsiveSidePanel} oControl The control
         *            instance
         */
        renderer : function(oRm, oControl) {
            oRm.write('<div');
            oRm.writeControlData(oControl);
            oRm.addClass('globalPortletBodyBackground');
            oRm.addClass('surjResponsiveSidePanel');
            if (A11yPreferences.isLowVisionEnabled()) {
                oRm.addClass('globalLowVisionSupport');
                oRm.addClass(A11yPreferences.getLowVisionType());
            }
            oRm.writeClasses();
            oRm.write(' style="width:', oControl.getWidth(), 'px;height:', oControl._getHeight(), 'px;overflow:hidden">');
            oRm.write('<div id="', oControl.getId(), '-wrapper" style="width:100%;height:100%;">');
            var oHeader = oControl.getHeader();
            oHeader && oRm.renderControl(oHeader);
            var aContent = oControl.getContent();
            oRm.write('<div id="', oControl.getId(), '-content" style="width:100%;height:', oControl._getContentHeight(), 'px">');
            $.each(aContent, function(nIdx, oContent) {
                oRm.renderControl(oContent);
            });
            oRm.write('</div></div></div>');
        },

        getWidth : function() {
            var iWidth = $(window).width();
            var iThreshold = this.getWidthThreshold();
            if (Device.system.phone || iWidth < iThreshold) {
                return iWidth;
            } else {
                return iThreshold;
            }
        },

        onAfterRendering : function() {
            if (window.SFBodyEventDispatcher) {
                SFBodyEventDispatcher.addResizeListener(this, '_onWindowResize');
            } else {
                this._resizeHandler = this._resizeHandler || $.proxy(this._onWindowResize, this);
                $(window).on('resize', this._resizeHandler);
            }
            this.fireAfterShow();
        },

        _onWindowResize : function() {
            var iWidth = $(window).width();
            if (this.getResizeHide() && (Math.abs(this.mInitWidth - iWidth) > 30)) {
                this.hide();
            } else {
                this.$().css({
                    height : this._getHeight() + 'px',
                    width : this.getWidth() + 'px'
                });
                this.$('content').css('height', this._getContentHeight() + 'px');
            }
        },

        _getHeight : function() {
            return $(window).height() - parseInt(this.getTop());
        },

        _getContentHeight : function() {
            return this._getHeight() - (this.getHeader() ? 48 : 0);
        }
    });
});