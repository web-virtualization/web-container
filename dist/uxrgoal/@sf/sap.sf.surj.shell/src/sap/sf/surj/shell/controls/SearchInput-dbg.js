/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.SearchInput.
jQuery.sap.declare("sap.sf.surj.shell.controls.SearchInput");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new SearchInput.
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
 * @name sap.sf.surj.shell.controls.SearchInput
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.SearchInput", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.SearchInput with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.SearchInput.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/SearchInput.js
/**
 * An SearchInput can be used instead of sfAutoComplete (legacy YUI) but
 * uses pure UI5.
 * 
 * @name sap.sf.surj.shell.controls.SearchInput
 * @extends sap.m.Input
 */

sap.ui.define('sap/sf/surj/shell/controls/SearchInput', 
    ['jquery.sap.global',
     'sap/m/Input',
     'sap/m/Popover',
     'sap/m/PlacementType',
     'sap/m/ColumnListItem',
     'sap/m/Column',
     'sap/sf/surj/shell/controls/SearchResult',
     'sap/sf/surj/shell/controls/GACESearchResult',
     'sap/sf/surj/shell/util/SearchUtil',
     'sap/sf/surj/shell/util/A11yPreferences',
     './SearchInputRenderer',
     'sap/sf/surj/shell/util/GACESearchUtil' // Must be included but is not used in this file
    ], 
    function ($, Input,  Popover, PlacementType, ColumnListItem, Column, SearchResult, GACESearchResult, SearchUtil, A11yPreferences, SearchInputRenderer, GACESearchUtil) {

      "use strict";
      var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
      var sPhotoNotAvailable;

      return Input.extend('sap.sf.surj.shell.controls.SearchInput', /** @lends sap.sf.surj.shell.controls.SearchInput.prototype */ {
        metadata : {
            properties : {
                settings : 'object',
                searchType : {type: 'string', defaultValue: 'jsup'},
                scrollThreshold : {type: 'int', defaultValue: 20},
                alwaysBottom : {type: 'boolean', defaultValue: false},
                showButton : {type: 'boolean', defaultValue: false},
                pending : {type: 'boolean', defaultValue: false},
                objectValue : 'any',
                forceItemSelection : {type: 'boolean', defaultValue: false}
            },
            renderer: SearchInputRenderer,
            library : 'sap.sf.surj.shell',
            events : {
                itemSelected : {
                    parameters : {
                        /**
                         * The current value which has been typed in the input.
                         */
                        selectedItem : {
                            type : "any"
                        }
                    }
                },
                itemChange : { }
            },
            aggregations : {
                _buttonLabelText: {type : "sap.ui.core.InvisibleText", multiple : false, visibility : "hidden"}
            }
        },

        /**
         * @param {String=} sId
         * @param {Object=} oConfig
         */
        constructor : function(sId, oConfig) {
            if (typeof sId == 'object') {
                oConfig = sId;
                sId = undefined;
            }

            var me = this;

            // Settings for base class generated
            var oSettings = this._getBaseSettings(oConfig);

            this._oThrottle = SearchUtil.createThrottle();
            this._oThrottle.attachEvent('pageReady', $.proxy(this._onPageReady, this));
            this._oThrottle.attachEvent('pending', $.proxy(this._onPending, this));

            if (typeof sId == 'string') {
                Input.call(this, sId, oSettings);
            } else {
                Input.call(this, oSettings);
            }
        },

        ontap : function(oEvent) {
            var CSS_CLASS = this.getRenderer().CSS_CLASS_COMBOBOXBASE,
                oControl = oEvent.srcControl;

            // in case of a non-editable or disabled combo box, the picker popup cannot be opened
            if (!this.getEnabled() || !this.getEditable()) {
                return;
            }

            // mark the event for components that needs to know if the event was handled
            oEvent.setMarked();

            if (oControl.isOpenArea && oControl.isOpenArea(oEvent.target)) {

                if (this.isOpen()) {
                    this.close();
                    this.removeStyleClass(CSS_CLASS + "Pressed");
                    return;
                }

                this.open();
            } else {
                var supertap = Input.prototype.ontap;
                supertap && supertap.apply(this, arguments);
            }

            if (this.isOpen()) {

                // add the active state to the control's field
                this.addStyleClass(CSS_CLASS + "Pressed");
            }
        },

        ontouchstart : function(oEvent) {
            if (!this.getEnabled() || !this.getEditable()) {
                return;
            }

            // mark the event for components that needs to know if the event was handled
            oEvent.setMarked();

            if (this.isOpenArea(oEvent.target)) {
                this.bOpenedByButton = true;

                // add the active state to the control's field
                this.addStyleClass(this.getRenderer().CSS_CLASS_COMBOBOXBASE + "Pressed");
            } else {
                var supertouchstart = Input.prototype.ontouchstart;
                supertouchstart && supertouchstart.apply(this, arguments);
            }
        },

        ontouchend : function(oEvent) {
            if (!this.getEnabled() || !this.getEditable()) {
                return;
            }

            // mark the event for components that needs to know if the event was handled
            oEvent.setMarked();

            if (!this.isOpen() && this.isOpenArea(oEvent.target)) {

                // remove the active state of the control's field
                this.removeStyleClass(this.getRenderer().CSS_CLASS_COMBOBOXBASE + "Pressed");
            }
        },

        onsapshow : function(oEvent) {
            // in case of a non-editable or disabled combo box, the picker popup cannot be opened
            if (!this.getShowButton() || !this.getEnabled() || !this.getEditable()) {
                return;
            }

            // mark the event for components that needs to know if the event was handled
            oEvent.setMarked();

            // note: prevent browser address bar to be open in ie9, when F4 is pressed
            if (oEvent.keyCode === jQuery.sap.KeyCodes.F4) {
                oEvent.preventDefault();
            }

            if (this.isOpen()) {
                this.close();
                return;
            }

            this.bOpenedByButton = true;
            this.open();
        },

        getStartSuggestion : function() {
            if (this.bOpenedByButton) {
                return 0;
            }
            return Input.prototype.getStartSuggestion.call(this);
        },

        open : function() {
            this.focus();
            this._onSuggest("");
        },

        focus: function() {
            Input.prototype.focus.call(this);
            /*
                * UI-18396/UI-18343 For the case that when selecting the item from 
                * popup, the event onsapfocusleave will be triggered and focus will 
                * be called in the handler. Somehow the text will be selected when
                * the dom of input is focused. The itemSelected event is thrown in
                * the event handler for ontap, but the selected text prevent 
                * itemSelected from being thrown. To fix this, removing the selected 
                * text in the input after focused.
            */
            if(this.isOpen() && window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        },

        close : function() {
            this._closeSuggestionPopup();
        },

        _onPopoverOpening : function() {
        },

        _onPopoverClosed : function(oEvent) {
            this.bOpenedByButton = false;
        },

        isOpen : function() {
            var oPopup = this._oSuggestionPopup;
            return oPopup && oPopup.isOpen();
        },

        isOpenArea : function(oDomRef) {
            var oOpenAreaDomRef = this.getOpenArea();
            return oOpenAreaDomRef && oOpenAreaDomRef.contains(oDomRef);
        },

        getOpenArea : function() {
            return this.getDomRef("arrow");
        },


        /**
         * Get settings for base Input control.
         * 
         * @return {Object}
         * @protected
         */
        _getBaseSettings : function(oConfig) {
            return $.extend({}, oConfig, {
                //disable this autocomplete function because of ticket UI-21059, UI5 team fixed in in 1.71, so we could
                //add this feature back once when upgrade to 1.71
                autocomplete: false,
                filterSuggests : false,
                showSuggestion : true,
                showTableSuggestionValueHelp : false,
                suggestionColumns : this._getSuggestionColumns(),
                suggestionItemSelected : $.proxy(this._onSuggestionItemSelected, this),
                suggest : $.proxy(this._onSuggest, this),
                change : $.proxy(this._onChange, this)
            });
        },
        
        _onChange : function(oEvt) {
        	this.fireItemChange();
        },

        /**
         * @param {sap.ui.base.Event} oEvt
         * @protected
         */
        _onSuggestionItemSelected : function(oEvt) {
            var oResultItem = oEvt.getParameter('selectedRow').__oResultItem;
            var sDisplayText = this._getDisplayText(oResultItem, true);
            this._oThrottle.abort();
            this.setValue(sDisplayText || '');
            if (oResultItem) {
                this.setProperty("objectValue", oResultItem, true);
                this.fireItemSelected({
                    selectedItem : oResultItem
                });
            }
        },

        /**
         * Called when the user live changes the search input.
         * 
         * @param {sap.ui.base.Event|String} oEvt
         * @protected
         */
        _onSuggest : function(oEvt) {
            // TODO: We might might want to remove when pageReady
            this.removeAllSuggestionRows();

            // TODO: Maybe this can be done in constructor
            this._initSuggestionPopup();

            var sQuery = typeof oEvt == 'string' ? oEvt : oEvt.getParameter('suggestValue');
            if (sQuery.length >= this.getStartSuggestion() || oEvt === "") {
                this._doSearch(sQuery);
            }
        },

        /**
         * When a page of data is available, start adding the suggestion rows.
         * 
         * @param {sap.ui.base.Event} oEvt
         * @protected
         */
        _onPageReady : function(oEvt) {
            var me = this;
            var oCriteria = oEvt.getParameter('criteria');
            var sQuery = oCriteria.searchValue || oCriteria.query;
            var aItems = oEvt.getParameter('items');
            if (aItems && aItems.length > 0) {
                $.each(aItems, function(i, oResultItem) {
                    var columnListItem = new ColumnListItem({
                        cells : me._createSearchResult(oResultItem, sQuery)
                    }).addEventDelegate({
                        onAfterRendering: function(oEvent) {
                            jQuery("#" + oEvent.srcControl.getId()).attr("role","menuitem");
                        }
                    }).addStyleClass(me._getListItemStyleClass(oResultItem));
                    me.addSuggestionRow($.extend(columnListItem, {
                        __oResultItem : oResultItem
                    }));
                });
                this._checkScroll();
            } else {
                this.addSuggestionRow(new ColumnListItem({
                    cells : $.extend(new SearchResult({
                        text: rb.getText('COMMON_No_Results')
                    }), {
                        __bNoResults : true
                    })
                }));
            }
        },

        /**
         * @protected
         */
        _onPending : function(oEvt) {
            this.setPending(oEvt.getParameter('pending'));
        },

        /**
         * @param {Boolean} bPending
         */
        setPending : function(bPending) {
            this.setProperty('pending', bPending, true);
            this[bPending ? 'addStyleClass' : 'removeStyleClass']('bizXSFPending');
        },

        /**
         * Handle user input by starting the search.
         * 
         * @param {String} sQuery
         * @protected
         */
        _doSearch : function(sQuery) {
            // We ensure that the search is throttled
            this._oThrottle.change(this.getSearchType(), this._createCriteria(sQuery));
        },

        /**
         * Create the full criteria object give the entered user search query
         * string.
         * 
         * @param {String} sQuery
         * @return {String}
         * @protected
         */
        _createCriteria : function(sQuery) {
            var oCriteria;
            if (this.getSearchType() == 'jsup') {
                oCriteria = $.extend({
                    query : sQuery
                }, this.getSettings() || {});
            } else {
                oCriteria = $.extend({
                    searchValue : sQuery
                }, this.getSettings() || {});
            }
            return oCriteria;
        },

        /**
         * Check the scroll of the popover, if it has scrolled to the bottom
         * then we can load more items.
         * 
         * @protected
         */
        _checkScroll : function() {
            if(this.isOpen()) {
                if (!this._oScrollDelegate) {
                    this._oScrollDelegate = this._oSuggestionPopup.getScrollDelegate();
                    this._oScrollDelegate && this._oScrollDelegate.setGrowingList($.proxy(this._checkScroll, this));
                }
                if (this._isScrolledBottom() && this._oThrottle.hasMore()) {
                    this._oThrottle.more();
                }
            } else if(!this.bIsDestroyed) {
                setTimeout($.proxy(this._checkScroll, this), 10);
            }
        },

        /**
         * @private
         */
        _isScrolledBottom : function() {
            if (this._oScrollDelegate) {
                var iScrollTop = this._oScrollDelegate.getScrollTop();
                var iMaxScrollTop = this._oScrollDelegate.getMaxScrollTop();
                return iMaxScrollTop - iScrollTop < this.getScrollThreshold();
            }
            return false;
        },

        /**
         * @protected
         */
        _initSuggestionPopup : function() {
            if (!this._popupInit) {
                /*
                 * Popover would always open upwards since there is slightly
                 * more room above the proxy search input. This hacks the
                 * popover to always place on the bottom.
                 */
                var oPopover = this._oSuggestionPopup;
                if (oPopover && this.getAlwaysBottom()) {
                    oPopover._calcVertical = function() {
                        Popover.prototype._calcVertical.call(this);
                        this._oCalcedPos = PlacementType.Bottom;
                    }
                }
                oPopover.addStyleClass('surjliSuggest');

                oPopover.addStyleClass('globalMenu');
                oPopover.addStyleClass('globalContainerHoverSansFocus');
                oPopover.attachBeforeOpen($.proxy(this._onPopoverOpening, this));
                oPopover.attachAfterClose($.proxy(this._onPopoverClosed, this));
                this._popupInit = true;
            }
        },

        /**
         * Create a single search result item.
         * 
         * @param {Object} oResultItem
         * @return {sap.ui.core.Control}
         * @protected
         */
        _createSearchResult : function(oResultItem, sQuery) {
            if (this._isGACESearchResultItem(oResultItem)) {
                var oSettings = this.getSettings();
                var sResultScope = (oSettings && oSettings.additionalCriteria && oSettings.additionalCriteria.resultScope) || 'EMPLOYMENT';
                var oPhotoSrc;
                if (!oResultItem.subItem || oResultItem.firstSubItem) {
                    oPhotoSrc = this._getPhotoSrc(oResultItem)
                }
                return new GACESearchResult({
                    resultScope : sResultScope,
                    personItem : oResultItem,
                    settings : oSettings
                }).setText(this._getDisplayText(oResultItem, false))
                  .setPhotoSrc(oPhotoSrc)
                  .setSearchValue(sQuery);
            } else {
                var searchResult = new SearchResult().setSearchValue(sQuery)
                  .setText(this._getDisplayText(oResultItem, false))
                  .setInfo(this._getDisplayInfo(oResultItem))
                  .setSubtitle(this._getSubtitle(oResultItem));
                if (this._hasPhoto(oResultItem)) {
                    searchResult.setPhotoSrc(this._getPhotoSrc(oResultItem));
                }
                return searchResult;
            }
        },
        /**
         * @param {Object} oResultItem
         * @return {String|Object}
         * @private
         */
        _getPhotoSrc : function(oResultItem) {
            var oPhotoSrc;
            if (oResultItem.legacyItem) {
                oResultItem = oResultItem.legacyItem;
            }
            if (this._hasPhoto(oResultItem)) {
                // handle case when RBP does not allow user image to be visible, a.k.a. oResultItem.photoViewable = false;
                if (!oResultItem.photoViewable) {
                    if (!sPhotoNotAvailable) {
                        sPhotoNotAvailable = sap.ui.resource('sap.sf.surj.shell.img.userphoto', 'UserPhotoPlaceholder_50x50.png');
                    }
                    oPhotoSrc = sPhotoNotAvailable;
                } else {
                    oPhotoSrc = oResultItem.photoUrl || oResultItem.photoSrc;
                }
                if (!oPhotoSrc) {
                    var sUserId = oResultItem.UserId || oResultItem.userId;
                    var sPhotoMod = oResultItem.photoMod;
                    oPhotoSrc = {
                        userId : sUserId,
                        urlType : 'eduPhoto',
                        photoType : 'face',
                        mod : sPhotoMod
                    };
                }
            }
            return oPhotoSrc;
        },

        /**
         * Return the info to display in parenthesis next to the display text.
         * 
         * @return {String}
         */
        _getDisplayInfo : function(oResultItem) {
            if (oResultItem.legacyItem) {
                oResultItem = oResultItem.legacyItem;
            }
            if (this._isUserSearch()) {
                if (this._isHideUserName()) {
                    var aTerms = [];
                    if (oResultItem.Location) {
                        aTerms.push(oResultItem.Location);
                    }
                    if (oResultItem.Department) {
                        aTerms.push(oResultItem.Department);
                    }
                    if (aTerms.length > 0) {
                        return aTerms.join(', ');
                    }
                } else {
                    // jsup response contains capitalized
                    // quickcardController returns lower-case
                    return oResultItem.userName || oResultItem.UserName;
                }
            }
            return null;
        },

        _getSubtitle : function(oResultItem) {
            var subtitle = oResultItem.keys && oResultItem.keys.TITLE;
            return subtitle === null ? '' : subtitle;
        },

        /**
         * @param {Object} oResultItem
         * @return {String}
         * @protected
         */
        _getDisplayText : function(oResultItem, itemSelection) {
            var oOriginalItem = oResultItem;
            if (!oResultItem) {
                return null;
            }
            var oLegacyItem = oResultItem.legacyItem;
            if (oLegacyItem) {
                oResultItem = oLegacyItem;
            }
            if (this._isGACESearchResultItem(oOriginalItem)) {
                var oEmployment = oResultItem.employments && oResultItem.employments[0];
                var sTitle = oEmployment && oEmployment.title;
                
                if(oResultItem.hasEmploymentDifferentiatorText === true){
                	return rb.getText('COMMON_Person_AutoComplete_Title_And_Location', [oResultItem.name, oEmployment.employmentDifferentiatorText]);
                }
                
                if (sTitle) {
                    return rb.getText('COMMON_Person_AutoComplete_Title_And_Location', [oResultItem.name, sTitle]);
                }
                
                if(itemSelection == true && !oResultItem.name) {
                	//In GACE PMU users scenario, if name is empty, email should be considered
                	return oResultItem.email;                
                }
                return oResultItem.name;
            } else if (this._isUserSearch()) {
                // jsup response contains capitalized
                // quickcardController returns lower-case
                var sFullName = oResultItem.FullName || oResultItem.fullName || oResultItem.name;
                if (!sFullName) {
                    sFullName = rb.getText('COMMON_User_Display_Name', [ oResultItem.firstName || oResultItem.FirstName, '', oResultItem.lastName || oResultItem.LastName ]);
                }
                return sFullName;
            } else {
                return oResultItem.name || oResultItem.actionLabel;
            }
        },

        /**
         * @param {Object} oResultItem
         * @return {String}
         * @protected
         */
        _getListItemStyleClass : function(oResultItem) {
            var classes = ['surjli'];
            var oOriginalItem = oResultItem;
            var oLegacyItem = oResultItem.legacyItem;
            if (oLegacyItem) {
                oResultItem = oLegacyItem;
            }
            if (this._isGACESearchResultItem(oOriginalItem)) {
            	if(this._hasPhoto(oResultItem)){
            		classes.push('surjli-personEmployment');
            	}
                classes.push('surjli-personEmploymentGACE');
                if (oResultItem.subItem) {
                    classes.push('surjli-subItem');
                }
                if (oResultItem.firstSubItem) {
                    classes.push('surjli-firstSubItem');
                }else {
                    classes.push('surjli-nonFirstSubItem');  
                }
                if (oResultItem.lastSubItem) {
                    classes.push('surjli-lastSubItem');
                }else {
                	classes.push('surjli-nonLastSubItem');
                }
            } else if (this._getSubtitle(oResultItem) != null) {
                classes.push('surjli-hasSubTitle');
            }
            if (this._hasPhoto(oResultItem)) {
                classes.push('surjli-hasphoto');
            }

            if (A11yPreferences.isLowVisionEnabled()) {
                classes.push('globalLowVisionSupport');
                classes.push(A11yPreferences.getLowVisionType());
            }

            classes.push('globalMenuItem');
            classes.push('globalMenuItemBackground');

            return classes.join(' ');
        },

        /**
         * @param {Object} oResultItem
         * @return {Boolean}
         * @protected
         */
        _hasPhoto: function (oResultItem) {
            var oSettings = $.sap.getObject('pageHeaderJsonData.settings');
            return this._isPersonResult(oResultItem) && ((oSettings && oSettings['autocomplete.enablePhoto'] == 'true')
                || $('#autocomplete\\.enablePhoto').attr('content') == 'true');
        },

        /**
         * @param {Object} oResultItem
         * @return {Boolean}
         * @protected
         */
        _isPersonResult: function(oResultItem) {
            return oResultItem.UserId || oResultItem.userId || oResultItem.photoUrl || oResultItem.photoSrc;
        },

        /**
         * @return {Boolean}
         * @protected
         */
        _isHideUserName : function() {
            return $.sap.getObject('pageHeaderJsonData.settings')['autocomplete.hideUserName'] == 'true'
                || $('#autocomplete\\.hideUserName').attr('content') == 'true';
        },

        /**
         * @return {Boolean}
         * @protected
         */
        _isUserSearch : function() {
            switch (this.getSearchType()) {
            case 'jsup':
                var oSettings = this.getSettings();
                var sFindType = (oSettings && oSettings.findtype) || 'fullname';
                return 'firstname lastname username fullname proxy customUserSearch'.indexOf(sFindType) >= 0;
            case 'Person-Employment-User':
            case 'People':
                return true;
            }
            // TODO: can other search types be a user?
            return false;
        },

        /**
         * @return {Boolean}
         */
        _isGACESearchResultItem : function(oResultItem) {
            return this.getSearchType() == 'Person-Employment-User' && oResultItem.personBased;
        },

        /**
         * Can be overridden if suggestion rows needs more columns.
         * 
         * @return {Array.<sap.m.Column>}
         */
        _getSuggestionColumns : function() {
            return [ new Column() ];
        },

        onBeforeRendering : function() {
            Input.prototype.onBeforeRendering.apply(this, arguments);
            this._initArrowButton();
        },

        onfocusout : function(oEvent) {
            if (this.getForceItemSelection()) {
                if (this._focusOutId == null) {
                    this._focusOutId = setTimeout(function() {
                        this._focusOutId = null;
                        this.setValue(this._getDisplayText(this.getObjectValue(), false));
                    }.bind(this), 0);
                }
            }
            var fFocusOut = Input.prototype.onfocusout;
            fFocusOut && fFocusOut.apply(this, arguments);
        },

        onfocusin : function(oEvent) {
            // The arrow button is receiving focus
            var oOpenArea = this.getOpenArea();
            var oTarget = oEvent.target;
            if (oOpenArea == oTarget || (oOpenArea && oOpenArea.parentNode == oTarget)) {
                this.focus();
            }
            var fFocusIn = Input.prototype.onfocusin;
            fFocusIn && fFocusIn.apply(this, arguments);
        },

        _initArrowButton: function() {
            var that = this;
            var oIcon = this._arrowButton;

            if (!oIcon && this.getShowButton()) {
                var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.m");

                oIcon = this._arrowButton = this.addEndIcon({
                    id: this.getId() + "-arrow",
                    src: "sap-icon://slim-arrow-down",
                    noTabStop: true,
                    alt: oRb.getText("COMBOBOX_BUTTON"),
                    decorative: false,
                    // UI-20728, when the control does not have a value, 'onfocusin' will update the suggestions list.
                    // To avoid an extra backend roundtrip, when the control does have a value refresh
                    // the suggestions list only when the down-arrow icon is pressed.
                    press: function() {
                        if (that.getValue()) {
                            that._onSuggest('');
                        }
                    }
                });

                oIcon.addAriaLabelledBy("");
            }
            if (oIcon) {
                oIcon.setVisible(this.getShowButton());
            }
        },

        setShowButton: function(bShowButton) {
            var o = this.setProperty("showButton", bShowButton, true);
            this._initArrowButton();
            return o;
        }
    });
});