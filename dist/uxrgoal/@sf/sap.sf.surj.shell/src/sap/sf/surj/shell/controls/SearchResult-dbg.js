/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.SearchResult.
jQuery.sap.declare("sap.sf.surj.shell.controls.SearchResult");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new SearchResult.
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
 * @name sap.sf.surj.shell.controls.SearchResult
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.SearchResult", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.SearchResult with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.SearchResult.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/SearchResult.js
/**
 * A SearchResult to display as a Suggestion for Input or SearchField.
 * 
 * @name sap.sf.surj.shell.controls.SearchResult
 * @extends sap.ui.core.Control
 * @class
 */

sap.ui.define('sap/sf/surj/shell/controls/SearchResult', [
           'jquery.sap.global', 
           'sap/ui/core/Control',
           'sap/sf/surj/shell/util/SearchUtil', 
           'sap/sf/surj/shell/controls/UserPhoto'
          ], function(jQuery, Control, SearchUtil, UserPhoto) {

    "use strict";

    return Control.extend('sap.sf.surj.shell.controls.SearchResult', /** @lends sap.sf.surj.shell.controls.SearchResult.prototype */ {
        metadata : {
            library : 'sap.sf.surj.shell',
            properties : {
                text : 'string',
                info : 'string',
                searchValue : 'string',
                subtitle : 'string',
                photoSrc : 'sap.sf.surj.shell.controls.UserPhotoSrc',
                isEscapedText : 'boolean'
            },
            aggregations : {
                _userPhoto : {
                    type : 'sap.sf.surj.shell.controls.UserPhoto',
                    visibility : 'hidden',
                    multiple : false
                }
            }
        },

        /**
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.SearchResult} oControl The control
         *            instance
         */
        renderer : function(oRm, oLi) {
            function writeInfo() {
                var sInfo = oLi.getInfo();
                if (sInfo) {
                    oRm.write('&nbsp;&nbsp;<span class="info">&#x200E;(');
                    oRm.write(sInfo);
                    oRm.write(')&#x200E;</span>&nbsp;&nbsp;');
                }
            }
            var sSubtitle = oLi.getSubtitle();
            oRm.write('<div');
            oRm.writeControlData(oLi);
            oRm.addClass('surjresult');
            oRm.writeClasses();
            oRm.write('>');
            var oUserPhoto = oLi.getAggregation('_userPhoto');
            oUserPhoto && oRm.renderControl(oUserPhoto);
            oRm.write('<div class="surjcontent">');
            if (sSubtitle != null) {
                oRm.write('<div class="surjli-Title">');
            }
            var bRtl = sap.ui.getCore().getConfiguration().getRTL();
            if (bRtl) {
                writeInfo();
            }
            oRm.write(SearchUtil.getHighlightedMarkup(oLi.getText(), oLi.getSearchValue(), '<em class="surjhighlight">', '</em>', oLi.getIsEscapedText()));
            if (!bRtl) {
                writeInfo();
            }
            if (sSubtitle != null) {
                oRm.write('</div>');
                if (sSubtitle) {
                    oRm.write('<div class="surjli-SubTitle">');
                    oRm.writeEscaped(sSubtitle);
                    oRm.write('</div>');
                }
            }
            oRm.write('</div></div>');
        },

        /**
         * @param {Object|String} oPhotoSrc
         */
        setPhotoSrc : function(oPhotoSrc) {
            var oUserPhoto = this.getAggregation('_userPhoto');
            if (oUserPhoto) {
                if (oPhotoSrc) {
                    oUserPhoto.setPhotoSrc(oPhotoSrc);
                } else {
                    oUserPhoto.destroy();
                }
            } else if (oPhotoSrc) {
                this.setAggregation('_userPhoto', new UserPhoto({
                    profile : {},
                    user : {
                        photoSrc : oPhotoSrc
                    }
                }));
            }
            return this.setProperty('photoSrc', oPhotoSrc);
        }
    });
});