/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.BizXPage.
jQuery.sap.declare("sap.sf.surj.shell.controls.BizXPage");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new BizXPage.
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
 * @name sap.sf.surj.shell.controls.BizXPage
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.BizXPage", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.BizXPage with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.BizXPage.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/BizXPage.js
/**
 * A Page control custom markup for theming for BizX Core. There should only
 * be one instance of this control on the page.
 * 
 * @class
 * @name sap.sf.surj.shell.controls.BizXPage
 * @extends sap.m.Page
 */

sap.ui.define('sap/sf/surj/shell/controls/BizXPage', [
    'jquery.sap.global',
    'sap/m/Page',
    'sap/m/PageAccessibleLandmarkInfo',
    'sap/sf/surj/shell/util/DeferredUtil',
    'sap/ui/core/ComponentContainer',
    './Container'
], function ($, Page, PageAccessibleLandmarkInfo, DeferredUtil, ComponentContainer, Container) {

    "use strict";
    var aPreferredPlacematIconsOrder = ["insightsPlacematIcon", "showMePlacematIcon"];

    return Page.extend('sap.sf.surj.shell.controls.BizXPage', /** @lends sap.sf.surj.shell.controls.BizXPage.prototype */ {
        metadata : {
            library : 'sap.sf.surj.shell',
            properties : {
                fullHeight : 'boolean',
                containerCSS : 'string',
                placematCSS : 'string'
            },
            aggregations : {
                // UI-18071 override customHeader type so that it can be a View rather than a Bar
                // technically it worked before, but this fixes an error in the console
                customHeader : {
                    type : 'sap.ui.core.Control',
                    multiple : false
                },
                placematButtons : {
                    type : 'sap.m.Button',
                    multiple : true
                },
                _placematIcons : {
                    visibility : 'hidden',
                    type : 'sap.ui.core.Control',
                    multiple : false
                },
                /* Override type for footer. */
                footer : {
                    type : 'sap.ui.core.Control',
                    multiple : false
                }
            },
            events : {
                heightAdjusted : {}
            }
        },

        /**
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.BizXPage} oPage The control
         *            instance
         */
        renderer : function(oRm, oPage) {
            var sTooltip = oPage.getTooltip_AsString();
            var sContainerCSS = oPage.getContainerCSS();
            var sPlacematCSS = oPage.getPlacematCSS();
            var oLandmarkInfo = oPage.getLandmarkInfo();

            oRm.write('<div');
            oRm.writeControlData(oPage);
            oRm.addClass('sapMPage');
            oRm.addClass('bizXPage');
            if (oPage.getFullHeight()) {
                oRm.addClass('bizXFullHeight');
            }
            oRm.writeClasses();
            if (sTooltip) {
                oRm.writeAttributeEscaped('title', sTooltip);
            }
            // TODO: Removev landmarkinfo ally fix on upgrading main to 1.52.0 or later
            if(PageAccessibleLandmarkInfo._writeLandmarkInfo) {
                PageAccessibleLandmarkInfo._writeLandmarkInfo(oRm, oPage, 'root');
            } else if(oPage._formatLandmarkInfo){
                oRm.writeAccessibilityState(oPage, oPage._formatLandmarkInfo(oLandmarkInfo, "Root"));
            }
            oRm.write('>');

            // TODO: Move header out of content section when fixedHeader is true

            // start content section
            oRm.write('<section id="' + oPage.getId() + '-cont">');

            // start lighting containers
            oRm.write('<div id="globalHeaderFullWidthBackground" class="globalHeaderFullWidthBackground"></div>');
            oRm.write('<div class="globalLighting1"><div class="globalLighting2"><div class="bizXContent"');

            if (sContainerCSS) {
                oRm.write(' style="', sContainerCSS, '"');
            }

            oRm.write('>');

            oRm.renderControl(oPage.getCustomHeader());

            // start page content
            oRm.write('<div id="content" role="main" class="globalPlacemat"');
            if (sPlacematCSS) {
                oRm.write(' style="', sPlacematCSS, '"');
            }
            oRm.write('>');

            // Placemat Buttons
            oRm.renderControl(oPage.getAggregation('_placematIcons'));

            oRm.write('<div class="bizXPageContentParent">');
            $.each(oPage.getContent() || [], function() {
                oRm.renderControl(this);
            });
            oRm.write('</div></div>');
            // end page content

            // footer
            oRm.renderControl(oPage.getFooter());

            oRm.write('</div></div></div>');
            // end lighting containers

            oRm.write('</section>');
            // end content section

            oRm.write('</div>');
        },

        init : function() {
            this._adjustFullHeight = $.proxy(this._adjustFullHeight, this);
            Page.prototype.init && Page.prototype.init.apply(this, arguments);
            this._aOrderedPlacematIconIndexs = [];
            this._oHeaderRendered = $.Deferred();
            this.setAggregation('_placematIcons', new Container().addStyleClass('placematIcons'));
        },

        /**
         * @param {sap.m.Button} oPlacematButton
         */
        addPlacematButton : function(oPlacematButton) {
            oPlacematButton.addStyleClass('globalToolbarIcon');

            var sId = oPlacematButton.getId();
            var iPreferredIndex = aPreferredPlacematIconsOrder.indexOf(sId);
            var aOrderedCurrentIconIndexs = this._aOrderedPlacematIconIndexs;
            var iIndex;
            var iIndexValue;
            for (var i = 0, len = aOrderedCurrentIconIndexs.length; i < len; i++) {
                var iCurrentIndex = aOrderedCurrentIconIndexs[i];
                if (iCurrentIndex > iPreferredIndex) {
                    iIndex = iIndexValue = i;
                    break;
                }
            }
            if(isNaN(iIndex)) {
                iIndex = aOrderedCurrentIconIndexs.length;
                iIndexValue = -1;
            }
            this._aOrderedPlacematIconIndexs.splice(iIndex, 0, iIndexValue);
            this.getAggregation('_placematIcons').insertAggregation('content', oPlacematButton, iIndex);
            setTimeout(this._adjustFullHeight.bind(this), 0);
        },

        /**
         * @protected
         */
        onAfterRendering : function() {
            var p = Page.prototype.onAfterRendering;
            p && p.apply(this, arguments);

            /*
             * If the page is full height
             */
            if (this.getFullHeight()) {
                $(window).bind('resize', this._adjustFullHeight);
                var that = this;
                $.when(DeferredUtil.whenUI5LibraryCSSReady(), this._oHeaderRendered).done(function() {
                    setTimeout(function() {
                        that._adjustFullHeight();
                    }, 0);
                });
            } else {
                var oScrollEl = this.$('cont');
                var oBackground = $('html, html body, .globalBackground, .globalLighting1, .globalLighting2');
                oScrollEl.scroll(function() {
                    oBackground.css('background-position-y', -oScrollEl.scrollTop() + 'px');
                });
            }
        },

        /**
         * @override
         */
        destroy : function() {
            Page.prototype.destroy.apply(this, arguments);
            $(window).unbind('resize', this._adjustFullHeight);
        },

        /**
         * @param
         */
        setCustomHeader: function(oHeader) {
            function _attachRendered(oControl) {
                oControl.addEventDelegate({
                    onAfterRendering: function() {
                        oHeaderRendered.resolve();
                    }
                });
            }

            Page.prototype.setCustomHeader.apply(this, arguments);
            var oHeaderRendered = this._oHeaderRendered;
            if (oHeader && oHeader.attachComponentCreated) {
                oHeader.attachComponentCreated(function(oEvent) {
                    var oControl = oEvent.getParameter("component").getRootControl();
                    _attachRendered(oControl);
                })
            }else if (oHeader instanceof sap.ui.core.Control) {
                _attachRendered(oHeader);
            }
        },

        /**
         * @private
         */
        _adjustFullHeight : function() {
            if (!this.getFullHeight()) {
                return;
            }
            var placemat = $('#content');
            var parent = placemat.parent()[0];
            if (parent.scrollHeight > 0) {
                placemat.css('height', '');
                if (this.getAggregation('_placematIcons').getContent().length) {
                    var bizXPageContentParent = placemat.find('.bizXPageContentParent');
                    var placematIcons = placemat.find('.placematIcons');
                    bizXPageContentParent.css({
                        height: "calc(100% - " + placematIcons.innerHeight() + "px)"
                    });
                }
                var delta = parent.scrollHeight - parent.offsetHeight;
                var topBorder = parseFloat(placemat.css('borderTopWidth'));
                var bottomBorder = parseFloat(placemat.css('borderTopWidth'));
                placemat.css('height', (placemat.innerHeight() - delta + topBorder + bottomBorder) + 'px');
                this.fireHeightAdjusted();
            }
        }
    });
});