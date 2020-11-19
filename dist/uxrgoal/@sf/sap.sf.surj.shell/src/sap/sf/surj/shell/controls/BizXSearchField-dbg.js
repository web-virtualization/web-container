/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.BizXSearchField.
jQuery.sap.declare("sap.sf.surj.shell.controls.BizXSearchField");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new BizXSearchField.
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
 * @name sap.sf.surj.shell.controls.BizXSearchField
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.BizXSearchField", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.BizXSearchField with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.BizXSearchField.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/BizXSearchField.js

/**
 * @class
 * @name sap.sf.surj.shell.controls.BizXSearchField
 * @extends sap.m.SearchField
 */
sap.ui.define('sap/sf/surj/shell/controls/BizXSearchField', 
    ['jquery.sap.global',
     'sap/m/SearchField',
     'sap/ui/Device',
     'sap/ui/core/InvisibleText',
     'sap/sf/surj/shell/controls/BizXSuggest',
     'sap/sf/surj/shell/util/Logger',
     'sap/ui/events/KeyCodes',
     'jquery.sap.encoder' // Must be included but is not used in this file
    ], 
    function ($, SearchField, Device, InvisibleText, BizXSuggest, Logger, KeyCodes, Encoder) {

    "use strict";

    /**
     * Open the suggestions, overridden so that we can use the custom
     * BizXSuggest class instead.
     * 
     * @param {sap.m.SearchField} oSF a SearchField instance
     */
    function openSuggestions(oSF) {
        if (oSF.getEnableSuggestions()) {
            var firstTime = !oSF._oSuggest;
            if (firstTime) {
                var oSuggest = new BizXSuggest(oSF);
                oSF._oSuggest = oSuggest;
            }
            oSF._oSuggest.open();
            firstTime && oSF.fireScrollDelegateAvailable({
                scrollDelegate : oSF._oSuggest.getPicker().getScrollDelegate()
            });
        }
    }

    return SearchField.extend('sap.sf.surj.shell.controls.BizXSearchField', /** @lends sap.sf.surj.shell.controls.BizXSearchField.prototype */ {
        metadata : {
            library : 'sap.sf.surj.shell',
            properties : {
                a11yLabel : 'string',
                resetOnBlur : 'boolean',
                showSearchType : 'any',
                searchTypeAriaLabel : 'string',
                searchTypeTooltip : 'string',
                transitiveText : 'string',
                pending : 'boolean',
                enableExternalSearch : 'boolean',
                a11yAnnouncement : 'string'
            },
            events : {
                reset : {},
                pressSearchType : {},
                scrollDelegateAvailable : {},
                suggestionItemSelected : {},
                externalSearch : {},
                quickcardRequest : {},
                focusQuickcard : {},
                highlightExternalSearch : {},
                afterSuggestClose : {}
            }
        },

        renderer : function(rm, oSF) {
            // render nothing if control is invisible
            if (!oSF.getVisible()) {
                return;
            }

            // -----------------------------------------------------------
            // Start: Customized by BizX
            rm.addClass('bizXSF'); // BizXSearchField

            if (oSF.getShowSearchType()) {
                rm.addClass('bizXSFHasST'); // BizXSearchField Has Search Type
            }

            if (oSF.getTransitiveText()) {
                rm.addClass('bizXSFHasTT'); // BizXSearchField Has Transitive
                // Text
            }

            if (oSF.getPending()) {
                rm.addClass('bizXSFP'); // BizXSearchField Pending
            }
            // End: Customized by BizX
            // -----------------------------------------------------------

            var sPlaceholder = oSF.getPlaceholder(), sValue = oSF.getValue(), sWidth = oSF.getProperty('width'), sId = oSF.getId(), bShowRefreshButton = oSF.getShowRefreshButton(), bShowSearchBtn = oSF.getShowSearchButton(), oAccAttributes = {}; // additional
            // accessibility
            // attributes

            // container
            rm.write('<div');
            rm.writeControlData(oSF);
            if (sWidth) {
                rm.writeAttribute('style', 'width:' + sWidth + ';');
            }

            rm.addClass('sapMSF');

            if (sValue) {
                rm.addClass('sapMSFVal');
            }
            if (!oSF.getEnabled()) {
                rm.addClass('sapMSFDisabled');
            }

            rm.writeClasses();
            var sTooltip = oSF.getTooltip_AsString();
            if (sTooltip) {
                rm.writeAttributeEscaped('title', sTooltip);
            }
            rm.write('>');

            // 1. Input type="search".
            // Enclose input into a <form> to show a correct keyboard
            // method="post" to prevent unneeded "?" at the end of URL
            rm.write('<form method="post" action="javascript:void(0);"');
            rm.writeAttribute('id', sId + '-F');
            rm.addClass('sapMSFF');
            if (!bShowSearchBtn) {
                rm.addClass('sapMSFNS'); // no search button
            } else if (bShowRefreshButton) {
                rm.addClass('sapMSFReload');
            } else {
                rm.addClass('sapMSFSBNR');
            }
            rm.writeClasses();
            rm.write('>');

            // -----------------------------------------------------------
            // Start: Customized by BizX
            rm.write('<div class="bizXSFB bizXSFSI"></div>');
            rm.write('<span class="bizXSFTT"></span>'); // transitive text

            // -----------------------------------------------------------

            // self-made placeholder
            // Notes: _hasPlacehoder is a typo in UI5 1.52.15 source. We need to make it compatible with newer version.
            if ((!oSF._hasPlacehoder && !oSF._hasPlaceholder) && sPlaceholder) {
                rm.write('<label ');
                rm.writeAttribute('id', sId + '-P');
                rm.writeAttribute('for', oSF.getReferenceId());

                rm.addClass('sapMSFPlaceholder');
                rm.writeClasses();
                rm.write('>');
                rm.writeEscaped(sPlaceholder);
                rm.write('</label>');
            }

            rm.write('<input type="search" autocorrect="off" autocomplete="off"');
            rm.writeAttribute('id', oSF.getReferenceId());

            // UI-18976 according to Mastan the role should match https://haltersweb.github.io/Accessibility/autocomplete.html
            // In this test case the input has no role attribute, so I am commenting this out
            // rm.writeAttribute('role', 'autocomplete');

            rm.addClass('sapMSFI');

            if (Device.os.android && Device.os.version >= 4 && Device.os.version < 4.1) {
                rm.addClass('sapMSFIA4'); // specific CSS layout for Android
                // 4.0x
            }

            rm.writeClasses();

            if (oSF.getEnableSuggestions() && Device.system.phone) {
                // Always open a dialog on a phone if suggestions are on.
                // To avoid soft keyboard flickering, set the readonly
                // attribute.
                rm.writeAttribute('readonly', 'readonly');
            }
            if (!oSF.getEnabled()) {
                rm.writeAttribute('disabled', 'disabled');
            }
            if (sPlaceholder) {
                rm.writeAttributeEscaped('placeholder', sPlaceholder);
            }
            if (oSF.getMaxLength()) {
                rm.writeAttribute('maxLength', oSF.getMaxLength());
            }
            if (sValue) {
                rm.writeAttributeEscaped('value', sValue);
            }

            // ARIA attributes
            if (oSF.getEnabled() && bShowRefreshButton) {
                if(oSF._a11yText) {
                    var a11yTextId = oSF._a11yText.getId();
                    oAccAttributes.describedby = {
                        value: a11yTextId,
                        append: true
                    };
                }
            }

            if (sPlaceholder) {
                oAccAttributes.label = sPlaceholder;
            }
            rm.writeAccessibilityState(oSF, oAccAttributes);

            rm.write('>');

            rm.write('<div');
            rm.writeAttribute('id', oSF.getId() + '-a11yAnnouncement');
            rm.addClass('sapUiPseudoInvisibleText');
            rm.writeClasses();
            rm.writeAttribute('aria-live', 'assertive');
            rm.write('></div>');

            if (oSF.getEnabled()) {
                // 2. Reset button
                rm.write('<div');
                rm.writeAttribute('id', oSF.getId() + '-reset');
                rm.addClass('sapMSFR'); // reset
                rm.addClass('sapMSFB'); // button
                if (Device.browser.firefox) {
                    rm.addClass('sapMSFBF'); // firefox, active state by
                    // peventDefault
                }
                if (!bShowSearchBtn) {
                    rm.addClass('sapMSFNS'); // no search button
                }
                rm.writeClasses();
                rm.write('></div>');

                // 3. Search/Refresh button
                if (bShowSearchBtn) {
                    rm.write('<div');
                    rm.writeAttribute('id', oSF.getId() + '-search');
                    rm.addClass('sapMSFS'); // search
                    rm.addClass('sapMSFB'); // button
                    if (Device.browser.firefox) {
                        rm.addClass('sapMSFBF'); // firefox, active state by
                        // peventDefault
                    }
                    rm.writeClasses();
                    if (oSF.getRefreshButtonTooltip()) {
                        rm.writeAttributeEscaped('title', oSF.getRefreshButtonTooltip());
                    }
                    rm.write('></div>');
                }

                // -----------------------------------------------------------
                // Start: Customized by BizX
                if (oSF.getShowSearchType()) {
                    rm.write('<button id="', oSF.getId(), '-searchType" class="bizXSFB bizXSFST"');
                    var sSearchTypeAriaLabel = oSF.getSearchTypeAriaLabel();
                    if (sSearchTypeAriaLabel) {
                        rm.write(' aria-label="');
                        rm.writeEscaped(sSearchTypeAriaLabel);
                        rm.write('"');
                    }
                    var sSearchTypeTooltip = oSF.getSearchTypeTooltip();
                    if (sSearchTypeTooltip) {
                        rm.write(' title="');
                        rm.writeEscaped(sSearchTypeTooltip);
                        rm.write('"');
                    }
                    rm.write(' data-help-id="bizxHeaderSearchType" type="button"></button>');
                }
                // End: Customized by BizX
                // -----------------------------------------------------------
            }

            rm.write('</form>');

            rm.write('</div>');
        },

        getReferenceId : function() {
            return this.getId() + '-I';
        },

        /**
         * @override
         */
        onkeydown : function(oEvent) {
            var iKeyCode = oEvent.keyCode;
            if (iKeyCode == KeyCodes.BACKSPACE && this.getValue() == '') {
                this.fireReset();
            }
            if (iKeyCode == KeyCodes.F6 && this._oSuggest && this._oSuggest.isExternalSearchVisible()) {
                oEvent.preventDefault();
            }
            // We do not call parent onkeydown, since we do not want the
            // behavior
        },

        /**
         * @override
         * @param {Event} oEvent
         */
        onkeyup : function(oEvent) {
            var oSrc = oEvent.target;
            var oSearchTypeEl = this.$('searchType');
            var iKeyCode = oEvent.keyCode;

            // Enter or Spacebar on the searchType button
            if (iKeyCode == KeyCodes.ENTER || iKeyCode == KeyCodes.SPACE) {
                if (oSrc.id == this.getId() + '-searchType') {
                    oEvent.preventDefault();
                    this.firePressSearchType({
                        target : oSrc
                    });
                }
            }

            // Handle when user presses "F6" and external search is available
            if (iKeyCode == KeyCodes.F6 && this._oSuggest && this._oSuggest.isExternalSearchVisible()) {
                oEvent.preventDefault();
                this._pressedF6();
            }
            
            // Enter key while focused on the Input element
            if (oSrc.id == this.getReferenceId()) {
                // ENTER key handled by onsapenter event
                if (iKeyCode == KeyCodes.ESCAPE) {
                    oEvent.preventDefault();
                    this._pressedEscape();
                }
            }

            // control-shift-1
            if (oEvent.ctrlKey && oEvent.shiftKey && iKeyCode == 49) {
                oEvent.preventDefault();
                this._pressedCtrlShift1();
            }
        },

        onsapenter : function(oEvent) {
            var oSrc = oEvent.target;
            if (oSrc.id == this.getReferenceId()) {
                oEvent.preventDefault();
                this._pressedEnter();
            }
        },

        fireSearch: function(oParameters) {
            var result = SearchField.prototype.fireSearch.apply(this, arguments);
            if (oParameters && oParameters.suggestionItem) {
                this.fireSuggestionItemSelected({
                    selectedItem: oParameters.suggestionItem
                });
            }
            return result;
        },

        _pressedEnter : function() {
            if (this._oSuggest) {
                var iItemIndex = this._oSuggest.getSelected();
                if (iItemIndex >= 0) {
                    this.fireSuggestionItemSelected({
                        selectedItem : this.getSuggestionItems()[iItemIndex]
                    });
                } else if (this._oSuggest.getHighlightedExternalSearch() || (this.getEnableExternalSearch() && !this._oSuggest.isExternalSearchVisible())) {
                    // if you have not selected anything, and either you have highlighted the external search select item (by pressing F6)
                    // or the external search is not visible (added to fix UI-17878 Jam external search not being triggered)
                    this.fireExternalSearch();
                } else {
                    this._oSuggest.setSelected(0, false);
                }
            } else if (this.getEnableExternalSearch()) {
                // If the Suggest Popup was not created, pressing enter should fire the external search
                this.fireExternalSearch();
            }
        },

        _pressedEscape : function() {
            this.fireReset();
        },

        _pressedCtrlShift1 : function() {
            this.fireFocusQuickcard();
        },

        _pressedF6 : function() {
            // If the external search is currently highlighted, then move focus back to the item result
            if (this._oSuggest.getHighlightedExternalSearch()) {
                // Unhighlight external search, then select that item index
                var iItemIndex = this._iLastSelectedIndex;
                this._oSuggest.setHighlightedExternalSearch(false);
                this._oSuggest.setSelected(iItemIndex, false);
                if (iItemIndex >= 0) {
                    // Show the quickcard for that item index
                    this.fireQuickcardRequest({
                        suggestionItem: this.getSuggestionItems()[iItemIndex]
                    });
                }
            } else {
                // Otherwise move focus to the external search
                // Deselect any item, then highlight the external search
                this._iLastSelectedIndex = this._oSuggest.getSelected();
                this._oSuggest.setSelected(-1);
                this._oSuggest.setHighlightedExternalSearch(true);
                this.fireHighlightExternalSearch();
            }
        },

        /**
         * Set the available item count, announcing it immediately.
         */
        setA11yAnnouncement : function(sA11yAnnouncement) {
            var sId = 'a11yAnnouncement';
            this.setProperty(sId, sA11yAnnouncement, true);
            if (this._liveAnnounceTimeout != null) {
                clearTimeout(this._liveAnnounceTimeout);
            }
            var that = this;
            var el = this.$(sId);
            if (sA11yAnnouncement) {
                Logger.info('Announcing: ' + sA11yAnnouncement);
                el.text(sA11yAnnouncement);
                this._liveAnnounceTimeout = setTimeout(function() {
                    that._liveAnnounceTimeout = null;
                    el.text('');
                }, 1000);
            } else {
                el.text('');
            }
        },

        quickcardRequest : function(oConfig) {
            this.fireQuickcardRequest(oConfig);
        },

        /** 
         * @override
         * JIRA: WEF-4120
         * The parent class sap.m.SearchField  _fireChangeEvent method process unconditionally when it's called, and this is causing issue when it is hidden.
         * To workaround it, we need override this method/event only to executes when visible
         * NOTE:
         * In this case we have to break the encapsulation because "s/m/Suggest" is calling a private method _fireChangeEvent of "sap/m/SearchField" and there is no other choice
        */
       _fireChangeEvent: function() {
            if (this.getVisible()) {
                return SearchField.prototype._fireChangeEvent.apply(this, arguments);
            }
        },

        /**
         * @override
         * @param {Event} oEvent
         */
        ontouchend : function(oEvent) {
            if (oEvent.originalEvent.button === 2) {
                return; // no action on the right mouse button
            }

            var oSrc = oEvent.target;

            if ($(oSrc).hasClass('sapMSFF') || $(oSrc).hasClass('bizXSFSI')) {
                this.focus();
            }

            if (oSrc.id == this.getId() + "-reset") {
                var bEmpty = !this.getValue();
                this.clear({
                    clearButton : true
                });

                // When a user presses "x":
                // - always focus input on desktop
                // - focus input only if the soft keyboard is already opened on
                // touch devices (avoid keyboard jumping)
                // When there was no "x" visible (bEmpty):
                // - always focus
                var active = document.activeElement;
                if ((Device.system.desktop || bEmpty || /(INPUT|TEXTAREA)/i.test(active.tagName) || active === this._resetElement && this._active === this._inputElement // IE
                // Mobile
                ) && (active !== this._inputElement)) {
                    this._inputElement.focus();
                }
                this.fireSuggest({
                    suggestValue : ''
                });
            } else if (oSrc.id == this.getId() + '-searchType') {
                this.firePressSearchType({
                    target : oSrc
                });
            } else {
                SearchField.prototype.ontouchend.apply(this, arguments);
            }
        },

        onmouseover : function(oEvent) {
            var oEl = $(oEvent.toElement);
            if (oEl.hasClass('bizXSFST')) {
                this.$('F').removeClass('hover');
            } else if (oEl.closest('.sapMSFF').length > 0) {
                this.$('F').addClass('hover');
            }
        },

        onmouseout : function(oEvent) {
            if ($(oEvent.toElement).closest('#' + this.getId()).length == 0) {
                this.$('F').removeClass('hover');
            }
        },
        
        onFocus : function() {
            if (this.__ignoreBlur) {
                return;
            }
            SearchField.prototype.onFocus.apply(this, arguments);
        },
        
        onBlur : function() {
            if (this.__ignoreBlur) {
                return;
            }
            SearchField.prototype.onBlur.apply(this, arguments);
        },

        /**
         * @override
         */
        onfocusin : function(oEvent) {
            if (oEvent.target.tagName == 'INPUT') {
                if (this.__ignoreBlur) {
                    return;
                }
                var that = this;
                var $El = this.$();
                var sOldWidth = $El.css('width');
                SearchField.prototype.onFocus.apply(this, arguments);
                this._animateToCurrentWidth($El, sOldWidth).done(function() {
                    if (that.getEnableSuggestions()) {
                        that.suggest(true);
                    }
                });
            }
        },

        /**
         * @override
         */
        onfocusout : function(oEvent) {
            if (oEvent.target.tagName == 'INPUT') {
                if (this.__ignoreBlur) {
                    this.focus();
                    return;
                }
                var $El = this.$();
                var sOldWidth = $El.css('width');
                SearchField.prototype.onBlur.apply(this, arguments);
                this._animateToCurrentWidth($El, sOldWidth);
                if (this.getResetOnBlur()) {
                    this.fireReset();
                }
                var that = this;
                setTimeout(function() {
                    if (window.BizXHeaderController && !BizXHeaderController._quickcardFocused) {
                        that.suggest(false);
                    }
                },10);
            }
        },

        /**
         * @override
         * @param {Boolean}
         */
        suggest : function(bShow) {
            if (this.getEnableSuggestions()) {
                bShow = bShow === undefined || !!bShow;
                if (bShow && (this.getSuggestionItems().length || Device.system.phone)) {
                    openSuggestions(this);
                } else {
                    SearchField.prototype.suggest.call(this, bShow);
                }
            }
            return this;
        },

        setA11yLabel : function(sA11yLabel) {
            this.setProperty('a11yLabel', sA11yLabel, true);
            if (!this._a11yText) {
                this._a11yText = new InvisibleText().toStatic();
                this._a11yText.setParent(this);
            }
            this._a11yText.setText(sA11yLabel);
        },

        setResetOnBlur : function(bResetOnBlur) {
            this.setProperty('resetOnBlur', bResetOnBlur, true);
        },

        setPending : function(bPending) {
            this.setProperty('pending', bPending, true);
            this.$()[bPending ? 'addClass' : 'removeClass']('bizXSFP');
        },

        setTransitiveText : function(sTransitiveText) {
            this.setProperty('transitiveText', sTransitiveText, true);
            var oEl = this.$();
            oEl[sTransitiveText ? 'addClass' : 'removeClass']('bizXSFHasTransitive');
            var oTransitiveEl = $('.bizXSFTT', oEl).text(sTransitiveText);
            $('.sapMSFI', oEl).css({
                width : sTransitiveText ? 'calc(100% - ' + oTransitiveEl.outerWidth() + 'px)' : '100%'
            });
        },

        /**
         * Override so the input field doesn't re-render when placeholder
         * changes.
         * 
         * @override
         * @param {String} sPlaceholder
         */
        setPlaceholder : function(sPlaceholder) {
            this.$('P').text(sPlaceholder);
            this.$('I').attr('placeholder', sPlaceholder);
            this.setProperty('placeholder', sPlaceholder, true);
        },

        setEnableSuggestions : function(bEnableSuggestions) {
            this.setProperty('enableSuggestions', bEnableSuggestions, true);
        },

        isUseDialog : function() {
            return BizXSuggest.USE_DIALOG;
        },

        /**
         * Animate an element to its current width from a previous recorded
         * width before some action was taken (such as removing/adding a CSS
         * class to that element).
         * 
         * @private
         */
        _animateToCurrentWidth : function($El, sOldWidth) {
            // Stops any current animation
            if (this.mAnimDfd) {
                this.mAnimDfd.reject();
            }
            var oDfd = $.Deferred();
            var sNewWidth = $El.css('width');
            if (sNewWidth != sOldWidth) {
                this.mAnimDfd = oDfd.fail(function() {
                    $El.stop(true, true);
                });
                var that = this;
                $El.css('width', sOldWidth).animate({
                    width : sNewWidth
                }, {
                    complete : function() {
                        $El.css('width', '');
                        that.mAnimDfd = null;
                        oDfd.resolve();
                    }
                });
            } else {
                oDfd.resolve();
            }
            return oDfd.promise();
        }
    });
});