/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.PeopleSuggestionItem.
jQuery.sap.declare("sap.sf.surj.shell.controls.PeopleSuggestionItem");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new PeopleSuggestionItem.
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
 * @name sap.sf.surj.shell.controls.PeopleSuggestionItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.PeopleSuggestionItem", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.PeopleSuggestionItem with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.PeopleSuggestionItem.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/PeopleSuggestionItem.js
sap.ui.define([
    'jquery.sap.global',
    'sap/m/SuggestionItem',
    './UserPhoto'
], function($, SuggestionItem, UserPhoto) {
    "use strict";
    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');

    /**
     * @class
     * @extends sap.ui.core.Control
     * @name sap.sf.surj.shell.controls.PeopleSuggestionItem
     */
    var PeopleSuggestionItem = SuggestionItem.extend('sap.sf.surj.shell.controls.PeopleSuggestionItem', /** @lends sap.sf.surj.shell.controls.PeopleSuggestionItem.prototype */
    {
        metadata : {
            properties : {
                user : 'sap.sf.surj.shell.controls.UserInfo',
                sectionTitle : 'string',
                highlightedText : 'string',
                enablePhoto : 'boolean'
            },
            aggregations : {
                _userPhoto : {
                    type : 'sap.sf.surj.shell.controls.UserPhoto',
                    multiple : false,
                    visibility : 'hidden'
                }
            }
        },

        getA11yAnnouncement : function() {
            var oUser = this.getUser();
            var sUsername = oUser.userName;
            var oKeys = oUser.keys;
            var sTitle = oKeys && oKeys.TITLE;
            var sPhone = oKeys && oKeys.PHONE;
            var aAnnouncements = [];

            aAnnouncements.push(this.getSuggestionText());

            if (sUsername) {
                aAnnouncements.push(rb.getText('COMMON_PARENTHETICAL_PHRASE', [sUsername]));
            }

            if (oUser.contingentWorker || oUser.isContingentWorkerString == "Y") {
                aAnnouncements.push(rb.getText('COMMON_Contingent_Worker'));
            }

            if (oUser.multipleAssignment) {
                sTitle = rb.getText('ACTIONSEARCH_Multiple_Assignments');
            }
            if (oUser.multipleEmployment) {
                sTitle = rb.getText('ACTIONSEARCH_Multiple_Employments');
            }
            if (oUser.isActive === 'false') {
                sTitle = sTitle || '';
                sTitle = rb.getText('COMMON_User_Name_Inactive', [sTitle]);
            }

            sTitle && aAnnouncements.push(sTitle);
            
            if (sPhone) {
                aAnnouncements.push(rb.getText('COMMON_GlobalSearch_Announcement_PhoneNumber', [sPhone]));
            }

            return aAnnouncements.join(' ');
        },


        /**
         * @override
         * @param {sap.sf.surj.shell.controls.UserInfo} oUser
         */
        setUser : function(oUser) {
            var oPhotoUser = $.extend({}, oUser);
            var pageHeaderJsonData = window.pageHeaderJsonData;
            var settings = pageHeaderJsonData && pageHeaderJsonData.settings;
            var isEncryptedPhotoEnabled = settings && (settings.encryptUserIdInURLEnabled == "true");

            if (!oPhotoUser.photoSrc) {
                var sPhotoSrc = {
                    urlType : 'eduPhoto',
                    photoType : 'liveProfile',
                    mod : oUser.imageMod
                };
                if(isEncryptedPhotoEnabled) {
                    sPhotoSrc.userIdEncoded = oUser.userIdEncoded;
                } else {
                    sPhotoSrc.userId = oUser.userId;
                }
                oPhotoUser.photoSrc = sPhotoSrc;
            }
            this.setAggregation('_userPhoto', new UserPhoto({
                profile : {},
                user : oPhotoUser
            }));

            this.setProperty('user', oUser, false);
            this.setText(oUser.name);
        }
    });

    /**
     * @inner
     */
    function renderItemText(oRm, sText, sSearch) {
        var i;
        if (sText) {
            i = sText.toUpperCase().indexOf(sSearch.toUpperCase());
            if (i > -1) {
                oRm.writeEscaped(sText.slice(0, i));
                oRm.write('<b>');
                oRm.writeEscaped(sText.slice(i, i + sSearch.length));
                oRm.write('</b>');
                sText = sText.substring(i + sSearch.length);
            }
            oRm.writeEscaped(sText);
        }
    }

    /**
     * @param {sap.ui.core.RenderManager} oRenderManager
     * @param {sap.sf.surj.shell.controls.PeopleSuggestionItem} oItem
     * @param {String} sSearch
     * @param {Boolean} bSelected
     */
    PeopleSuggestionItem.prototype.render = function(oRenderManager, oItem, sSearch, bSelected) {
        var rm = oRenderManager;
        var oUser = oItem.getUser();
        var sName = oUser.name;
        var sUsername = oUser.userName;
        var oKeys = oUser.keys;
        var sTitle = oKeys && oKeys.TITLE;
        var sPhone = oKeys && oKeys.PHONE;
        var description = oItem.getDescription();
        sSearch = sSearch || '';
        
        var enablePhoto = this.getEnablePhoto();

        var oUserPhoto = oItem.getAggregation('_userPhoto');
        
        var sSectionTitle = oItem.getSectionTitle();
        if (sSectionTitle) {
            rm.write('<div class="bizXSuggestionTitle">');
            rm.writeEscaped(sSectionTitle);
            rm.write('</div>');
        }

        rm.write('<li');
        rm.writeElementData(oItem);
        rm.writeAttribute('role', 'option');
        rm.writeAttribute('role', 'listitem');
        rm.addClass('bizXSuggestionItem');
        rm.addClass('bizXPeopleSuggestionItem');
        if (enablePhoto && oUserPhoto) {
        	rm.addClass('bizXPSIHasPhoto');
        }
        if (oUser.contingentWorker || oUser.isContingentWorkerString == "Y") {
        	rm.addClass('bizXPSIHasTags');
        }
        rm.addClass('sapMSuLI');
        rm.addClass('sapMSelectListItem');
        rm.addClass('sapMSelectListItemBase');
        rm.addClass('sapMSelectListItemBaseHoverable');
        if (bSelected) {
            rm.addClass('sapMSelectListItemBaseSelected');
            rm.writeAttribute('aria-selected', 'true');
        }
        rm.writeClasses();
        rm.write('>');
        
        if (enablePhoto && oUserPhoto) {
            rm.renderControl(oUserPhoto);
        }
        
        rm.write('<div class="bizXPSINameWrap">');
        
        if (oUser.contingentWorker || oUser.isContingentWorkerString == "Y") {
            rm.write('<div class="bizXPSIContingent">');
            rm.writeEscaped(rb.getText('COMMON_Contingent_Worker'));
            rm.write('</div>'); 
        }
        
        if (sPhone) {
            rm.write('<span class="bizxPSIPN">');
            rm.writeEscaped(sPhone);
            rm.write('</span>');
        }
        
        rm.write('<span class="bizxPSIN">');
        renderItemText(rm, sName, oItem.getHighlightedText() || sSearch);

        if (sUsername) {
            rm.write(' <span class="bizxPSIUn">');
            rm.write(rb.getText('COMMON_PARENTHETICAL_PHRASE', [$.sap.escapeHTML(sUsername)]));
            rm.write('</span>');
        }

        rm.write('</span>');

        // Mockups attached to UI-2838 only show these 2 messages
        // so the back-end only gives us these 2 flags
        // Swap the title in case of multiple employments/assignments
        // TODO: back-end may give us a number to display
        // Or give flag to show as (On Global Assignment)
        if (oUser.multipleAssignment) {
            sTitle = rb.getText('ACTIONSEARCH_Multiple_Assignments');
        }
        if (oUser.multipleEmployment) {
            sTitle = rb.getText('ACTIONSEARCH_Multiple_Employments');
        }
        if (oUser.isActive === 'false') {
            sTitle = sTitle || '';
            sTitle = rb.getText('COMMON_User_Name_Inactive', [sTitle]);
        }
        if (sTitle) {
            rm.write('<span class="bizxPSIT">');
            rm.writeEscaped(sTitle);
            rm.write('</span>');
        }
        rm.write('</div>');
        
        rm.write('</li>');
    };

    return PeopleSuggestionItem;
});