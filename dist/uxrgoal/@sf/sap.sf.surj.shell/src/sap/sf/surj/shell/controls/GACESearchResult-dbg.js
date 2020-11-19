/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.GACESearchResult.
jQuery.sap.declare("sap.sf.surj.shell.controls.GACESearchResult");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new GACESearchResult.
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
 * @name sap.sf.surj.shell.controls.GACESearchResult
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.GACESearchResult", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.GACESearchResult with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.GACESearchResult.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/GACESearchResult.js
/**
 * A SearchResult to display as a Suggestion for Input or SearchField.
 *
 * @name sap.sf.surj.shell.controls.SearchResult
 * @extends sap.ui.core.Control
 * @class
 */
sap.ui.define('sap/sf/surj/shell/controls/GACESearchResult',
    ['jquery.sap.global',
      'sap/ui/core/Control',
      'sap/ui/core/Icon',
      'sap/sf/surj/shell/util/SearchUtil',
      'sap/sf/surj/shell/controls/UserPhoto'
    ],
    function ($, Control, Icon, SearchUtil, UserPhoto, BizXResourceBundle) {

      'use strict';
      var TRUE_PATTERN = /^(true|yes|y)$/i;
      var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');

      return Control.extend('sap.sf.surj.shell.controls.GACESearchResult', /** @lends sap.sf.surj.shell.controls.GACESearchResult.prototype */ {
        metadata: {
          library: 'sap.sf.surj.shell',
          properties: {
            text: 'string',
            searchValue: 'string',
            resultScope: 'string',
            personItem: 'any',
            photoSrc: 'sap.sf.surj.shell.controls.UserPhotoSrc',
            settings: 'object'
          },
          aggregations: {
            _userPhoto: {
              type: 'sap.sf.surj.shell.controls.UserPhoto',
              visibility: 'hidden',
              multiple: false
            }
          }
        },

        /**
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.SearchResult} oControl The control
         *            instance
         */
        renderer: function (oRm, oLi) {
          var oUserPhoto = oLi.getAggregation('_userPhoto');
          var sSearchValue = oLi.getSearchValue();
          var oSettings = oLi.getSettings();
          var oPersonItem = oLi.getPersonItem();
          var aEmployments = oPersonItem.employments || [];
          var sUserName = oPersonItem.userName;
          var ALTERNATE_EMPLOYMENT = 'COMMON_Person_AutoComplete_Alternate_Employment';
          oRm.write('<div');
          oRm.writeControlData(oLi);
          oRm.addClass('surjresult surjGaceResultImg' + (oPersonItem.subItem && !oPersonItem.firstSubItem ? ' surjGaceResultFrame' : ''));
          oRm.writeClasses();
          oRm.write('>');
          oRm.write('<div class="surjGacePhotoFrame">');
          if (oUserPhoto) {
            oRm.renderControl(oUserPhoto);
          }
          oRm.write('</div>');
          oRm.write('<div>');
          oRm.write('<div class="surjcontent surjGaceTitle">');
          var oAdditionalCriteria = (oSettings && oSettings.additionalCriteria) || {};
          var resultScopeParam = oAdditionalCriteria.resultScope;
          if (!oPersonItem.subItem || oPersonItem.firstSubItem) {
            var sTextMarkup = SearchUtil.getHighlightedMarkup(oPersonItem.name, sSearchValue, '<em class="surjhighlight surjAutoCompleteHighlight">', '</em>');
            oRm.write('<div class="surj-peui-name">', sTextMarkup);
            if (sUserName && sUserName != null && jQuery('#autocomplete\\.hideUserName').attr('content') != 'true') {
              oRm.write('<span>');
              oRm.write(" " + rb.getText('COMMON_PARENTHETICAL_PHRASE', $.sap.escapeHTML(sUserName)));
              oRm.write('</span>');
            }

            if (resultScopeParam && resultScopeParam.toUpperCase() == "PERSON") {
              if (oPersonItem.isActive == "false") {
                var inActiveText = rb.getText('COMMON_InActive');
                oRm.write('<span class="surjGACEInactive">');
                oRm.writeEscaped(" " + rb.getText('COMMON_PARENTHETICAL_PHRASE', [inActiveText]));
                oRm.write('</span>');
              }
            }
            oRm.write('</div>');
            oRm.write('</div>');
          }
          //STE: 3396: Show email Id on the UI when the resultScope is 'Person'
          if (resultScopeParam && resultScopeParam.toUpperCase() == "PERSON") {
            if (oPersonItem.email) {
              oRm.write('<div class="surjGACEEmail">');
              oRm.writeEscaped(oPersonItem.email);
              oRm.write('</div>');
            }
            oLi._renderContingentLabel(oRm, oPersonItem.isContingentWorker);
          } else {
            aEmployments.forEach(function (oEmployment, index) {
              var sTitle = null;
              var noDataStyleClass = "surj-peui-title";

              if (oPersonItem.hasEmploymentDifferentiatorText === true) {
                sTitle = rb.getText('COMMON_Person_AutoComplete_DiffText', [oEmployment.employmentDifferentiatorText]);
              } else {
                sTitle = oEmployment.title;
                var sLocation = oEmployment.locationName;
                if (sLocation) {
                  if (!oLi.isEmpty(sTitle) && !oLi.isEmpty(sLocation)) {
                    sTitle = rb.getText('COMMON_Person_AutoComplete_Title_And_Location', [sTitle, sLocation]);
                  } else if (!oLi.isEmpty(sTitle)) {
                    sTitle = rb.getText('COMMON_Person_AutoComplete_DiffText', [sTitle]);
                  } else if (!oLi.isEmpty(sLocation)) {
                    sTitle = rb.getText('COMMON_Person_AutoComplete_DiffText', [sLocation]);
                  } else {
                    sTitle = oLi.displayEmptyWhenOneEmployment(oPersonItem, rb.getText(ALTERNATE_EMPLOYMENT));
                  }
                }
              }

              var oIcon = new Icon({src: oLi.getIcon(oEmployment, oSettings)}).addStyleClass('surjGACEIcon');
              var noDataText = rb.getText('COMMON_Search_No_Information_Placeholder');
              if (sTitle == noDataText || oLi.isEmpty(sTitle)) {
                sTitle = oLi.displayEmptyWhenOneEmployment(oPersonItem, rb.getText(ALTERNATE_EMPLOYMENT));
              }
              oRm.write('<div class=' + noDataStyleClass + '>');
              //Extra span to hold title and icon separately. In case of multiple assignments, there will be multiple icons and
              //this extra span will help in adding CSS only for title. CSS for icon will remain as is.
              oRm.write('<span class="surj-empDiffColumn1">' + sTitle + '</span>');
              if (oEmployment.isActive == "false") {
                var inActiveText = rb.getText('COMMON_InActive');
                oRm.write('&nbsp;');
                oRm.write('<span class="surjGACEInactive">');
                oRm.writeEscaped(rb.getText('COMMON_PARENTHETICAL_PHRASE', [inActiveText]));
                oRm.write('</span>');
              }
              if (oEmployment.showIcon) {
                oIcon.addStyleClass("surj-sempDiffColumn2");
                oRm.renderControl(oIcon);
              }
              oRm.write('</div>');
              oLi._renderContingentLabel(oRm, oEmployment.isContingentWorker);

            });
          }
          oRm.write('</div></div></div>');
        },

        displayEmptyWhenOneEmployment: function (oPersonItem, title) {
          // For AFT-15317, we need to hide the "Alternate Employment" when the user only has one employment.
          if (oPersonItem['firstSubItem'] && oPersonItem['lastSubItem']) {
            return '&nbsp;';
          }
          return title;
        },

        isEmpty: function (text) {
          return text == null || text === "";
        },

        _renderContingentLabel: function (oRm, isContingentWorker) {
          if (isContingentWorker === 'Y') {
            oRm.write('<div class="surj-result-cgt">');
            oRm.writeEscaped(rb.getText('COMMON_Contingent_Worker'));
            oRm.write('</div>');
          } else if (isContingentWorker === '?') {
            var oIcon = new Icon({src: 'sap-icon://sys-help'}).addStyleClass('surj-result-cgt-noAuth');
            oIcon.setTooltip(rb.getText('COMMON_Contingent_Worker_No_Permission_Info'));
            oRm.renderControl(oIcon);
          }

        },
        /* To get the Icon based on the employment */
        getIcon: function (oEmployment, oSettings) {
          if (oEmployment.employmentType == "GA") {
            if (oEmployment.isHomeAssignment == "true") {
              return "sap-icon://home";
            } else {
              return "sap-icon://world";
            }
          } else if (oEmployment.employmentType == "ST" && oEmployment.isHomeAssignment == "true") {
            return "sap-icon://home";
          } else if (TRUE_PATTERN.test(oEmployment.isPrimaryEmployment) && oSettings && oSettings.additionalCriteria && TRUE_PATTERN.test(oSettings.additionalCriteria.includeSecondEmpl)) {
            return "sap-icon://favorite";
          }
        },

        /**
         * @param {Object|String} oPhotoSrc
         */
        setPhotoSrc: function (oPhotoSrc) {
          var oUserPhoto = this.getAggregation('_userPhoto');
          if (oUserPhoto) {
            if (oPhotoSrc) {
              oUserPhoto.setPhotoSrc(oPhotoSrc);
            } else {
              oUserPhoto.destroy();
            }
          } else if (oPhotoSrc) {
            this.setAggregation('_userPhoto', new UserPhoto({
              profile: {},
              user: {
                photoSrc: oPhotoSrc
              }
            }));
          }
          return this.setProperty('photoSrc', oPhotoSrc);
        }
      });
    });