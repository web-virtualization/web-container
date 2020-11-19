sap.ui.define([
    'jquery.sap.global',
    'sap/ui/Device',
    'sap/m/Suggest',
    '../util/A11yPreferences'
], function($, Device, Suggest, A11yPreferences) {
    "use strict";

    /**
     * A simple class extending sap.m.Suggest that will have some hacks for BizX
     * Shell.
     * 
     * WARNING: This class is meant for use ONLY within BizXSearchField
     * 
     * IMPORTANT: Technically speaking sap.m.Suggest is not a sapui5 class. The
     * following statements will evaluate true:
     * 
     * <pre>
     * new sap.m.Suggest() instanceof sap.ui.base.Object === false;
     * typeof sap.m.Suggest.extend === 'undefined';
     * </pre>
     * 
     * So we cannot use sap.m.Suggest.extend, but we will need to ensure all the
     * following statements will evaluate true:
     * 
     * <pre>
     * new sap.m.Suggest() instanceof sap.sf.surj.shell.controls.BizXSuggest === false;
     * new sap.sf.surj.shell.controls.BizXSuggest() instanceof sap.m.Suggest;
     * new sap.sf.surj.shell.controls.BizXSuggest() instanceof sap.sf.surj.shell.controls.BizXSuggest;
     * </pre>
     * 
     * @constructor
     * @name sap.sf.surj.shell.controls.BizXSuggest
     * @extends sap.m.Suggest
     */
    function BizXSuggest(oParent) {
        var self = this;
        var bUseDialog = BizXSuggest.USE_DIALOG;
        var oParentSearch = oParent;

        /*
         * The picker is created by parent Suggest, but is protected by function
         * closure, we will hack it out later. For some reason the core team
         * decided not to allow customizing the behavior of the picker, but I
         * don't care - we want to customize its behavior anyway!
         */
        var picker = null;

        this._super.apply(this, arguments);
        superExtend(this, /** @lends sap.sf.surj.shell.controls.BizXSuggest.prototype */
        {
            /**
             * Expose the picker, which is disallowed by parent class.
             * 
             * @return {sap.m.Dialog|sap.m.Popover} The picker
             */
            getPicker : function() {
                return picker
            },

            /**
             * Expose the list, which is disallowed by parent class.
             * 
             * @return {sap.m.SuggestionList}
             */
            getList : function() {
                if (picker) {
                    // The list is the first content element of the picker
                    return picker.getContent()[0];
                }
            },

            /**
             * @overrides
             * @param {Integer} index
             * @param {Boolean} bRelative
             */
            setSelected : function(index, bRelative) {
                if (this.getHighlightedExternalSearch()) {
                    return;
                }
                var idx = this._super(index, bRelative);

                /*
                 * A relative selection is a number relative to the current
                 * selected index, so the user is moving the selection.
                 */
                if (bRelative) {
                    var oSuggestionItem = this.getSelectedSuggestionItem();
                    var oEl = oSuggestionItem && oSuggestionItem.$();
                    if (oEl && oEl.length) {
                        var oList = this.getList();
                        var oPopover = oList && oList.getParent();
                        var oScrollDelegate = oPopover && oPopover.getScrollDelegate();
                        var oContainer = oScrollDelegate._$Container;
                        if (oContainer && oContainer.length) {
                            var oContainerOffset = oContainer.offset();
                            var oSuggestionOffset = oEl.offset();
                            var iContainerBottom = oContainerOffset.top + oContainer.height();
                            var iSuggestionBottom = oSuggestionOffset.top + oEl.height();
                            var iDelta = 0;
                            if (iSuggestionBottom > iContainerBottom) {
                                iDelta = iSuggestionBottom - iContainerBottom;
                            } else if (oSuggestionOffset.top < oContainerOffset.top) {
                                iDelta = oSuggestionOffset.top - oContainerOffset.top;
                            }
                            if (iDelta != 0) {
                                var iX = oScrollDelegate.getScrollLeft();
                                var iY = oScrollDelegate.getScrollTop() + iDelta;
                                oScrollDelegate.scrollTo(iX, iY, 0);
                                if (oScrollDelegate._fnScrollLoadCallback) {
                                    oScrollDelegate._fnScrollLoadCallback();
                                }
                            }
                        }
                    }

                    if (oSuggestionItem) {
                        /*
                         * The external search is highlighted iff the relative
                         * selection moved downwards, and there was no selected
                         * item.
                         */
                        oParentSearch.quickcardRequest({
                            suggestionItem : oSuggestionItem
                        });
                    }
                } else if (idx < 0) {
                    // There is a bug in sap.m.SuggestionsList that highlights the last item
                    var list = this.getList();
                    list && list.$().children("li")
                        .eq(idx)
                        .removeClass("sapMSelectListItemBaseSelected")
                        .attr("aria-selected", "false");
                }
                
                return idx;
            },

            /**
             * Return the suggestion item that is currently selected by the
             * user.
             * 
             * @return {sap.m.SuggestionItem} The selected item, or null if none
             *         selected
             */
            getSelectedSuggestionItem : function() {
                var iSelectedIndex = this.getSelectedItemIndex();
                var aItems = this.getList().getItems();
                if (iSelectedIndex >= 0 && Array.isArray(aItems) && aItems.length > iSelectedIndex) {
                    return aItems[iSelectedIndex];
                }
            },

            /**
             * @return {Integer}
             */
            getSelectedItemIndex : function() {
                return this.getList().getSelectedItemIndex();
            },

            /**
             * @param {Boolean} bFooterHighlighted
             */
            setHighlightedExternalSearch : function(bFooterHighlighted) {
                this.bFooterHighlighted = bFooterHighlighted;
                if (this._externalSearchLink) {
                    this._externalSearchLink[bFooterHighlighted ? 'addStyleClass' : 'removeStyleClass']('surjFocused');
                }
            },

            /**
             * @return {Boolean}
             */
            getHighlightedExternalSearch : function() {
                return this.bFooterHighlighted;
            },

            /**
             * @return {Boolean}
             */
            isExternalSearchVisible : function() {
                return this._externalSearchLink && this._externalSearchLink.getVisible();
            },

            /**
             * @override
             */
            open : function() {
                // Just to be safe for function enclosure redeclare variable
                var oParentSearch = oParent;
                this._super();
                if (!picker) {
                    var $Pickers;
                    /*
                     * SFSF Hack
                     * 
                     * We need a reference to the picker created by
                     * sap.m.Suggest; we know that it just opened so we select
                     * the last one and get its id, then use byId to find the
                     * Control instance.
                     * 
                     * Sorry sap.m.Suggest developer who hid this (probably) on
                     * purpose with function closure, we'll get the Control
                     * reference anyway since we are customizing the behavior.
                     */
                    if (bUseDialog) {
                        $Pickers = $('.sapMDialog');
                    } else {
                        $Pickers = $('.sapMSltPicker');
                    }
                    var iLen = $Pickers.length;
                    if (iLen > 0) {
                        picker = sap.ui.getCore().byId($($Pickers[iLen - 1]).attr('id'));
                        picker.addStyleClass('bizXSuggestPicker');
                        if (A11yPreferences.isLowVisionEnabled()) {
                            picker.addStyleClass('globalLowVisionSupport');
                            picker.addStyleClass(A11yPreferences.getLowVisionType());
                        }

                        /*
                         * SFSF Hack
                         * 
                         * Removing the first event delegate from the picker,
                         * which we happen to know was added by sap.m.Suggest to
                         * the Popover/Dialog.
                         * 
                         * This BizXSuggest child class will handle those events
                         * instead.
                         */
                        picker.removeDelegate(picker.aDelegates[0].oDelegate);
                        picker.attachAfterClose && picker.attachAfterClose(function() {
                            oParentSearch.fireAfterSuggestClose();
                        });

                        if (bUseDialog) {
                            /*
                             * SFSF Hack
                             * 
                             * Replace the Dialog's SearchField instance with a
                             * BizXSearchField instance instead. We happen to
                             * know that this will be stored in the Dialog's
                             * (aka picker) customHeader's first contentLeft.
                             */
                            var oCustomHeader = picker.getCustomHeader();
                            oCustomHeader.removeContentLeft(0);
                            
                            picker.addStyleClass('bizXSuggestDialog');

                            sap.ui.require(['sap/sf/surj/shell/controls/BizXSearchField'], function(BizXSearchField) {
                            /*
                             * The ParentSearch object a search field which will
                             * open the Suggest.
                             * 
                             * The parent Suggest class has already created a
                             * sap.m.SearchField and placed it into the Dialog's
                             * custom header to act as the surragate for user
                             * action on the Dialog that will take the user
                             * actions while the Dialog is opened.
                             * 
                             * We will replace this instance with the
                             * BizXSearchField instance instead, that way we
                             * will get the BizX specific functionality on this
                             * surragate SearchField instance.
                             */
                            var oBizXSearchField = new BizXSearchField({
                                showRefreshButton : true,
                                showSearchButton : false,
                                showSearchType : '{universalSearch>/searchTypeVisible}',
                                transitiveText : '{universalSearch>/transitiveAction/actionLabel}',
                                placeholder : '{universalSearch>/placeholder}',
                                pending : '{universalSearch>/pending}',

                                liveChange : function(oEvent) {
                                    var value = oEvent.getParameter("newValue");
                                    oParentSearch.setValue(value);
                                    oParentSearch.fireLiveChange({
                                        newValue : value
                                    });
                                    oParentSearch.fireSuggest({
                                        suggestValue : value
                                    });
                                    self.update();
                                },

                                search : function(oEvent) {
                                    if (!oEvent.getParameter("clearButtonPressed")) {
                                        picker.close();
                                    }
                                }
                            });

                            /*
                             * Any listeners on the ParentSearch will now be
                             * added as listeners for the oBizXSearchField
                             * surragate.
                             */
                            $.each([ 'pressSearchType', 'reset' ], function(i, sEventId) {
                                $.each(oParentSearch.mEventRegistry[sEventId] || [], function(j, oEventInfo) {
                                    oBizXSearchField.attachEvent(sEventId, oEventInfo.oData, oEventInfo.fFunction, oEventInfo.oListener);
                                });
                            });

                            /*
                             * The BizX replacement SearchField surragate is
                             * added to the Dialog's custom header.
                             */
                            oCustomHeader.addContentLeft(oBizXSearchField);
                            });
                        } else {
                            var iWidth = oParentSearch.$().outerWidth();
                            picker.setContentWidth(iWidth + 'px');

                            var oLink = self._externalSearchLink = new sap.m.Link({
                                press : function() {
                                    oParentSearch.fireExternalSearch();
                                },
                                visible : '{universalSearch>/externalSearchVisible}',
                                text : '{universalSearch>/externalSearchText}'
                            }).addStyleClass('bizXSuggestExternalSearch');

                            if (self.bFooterHighlighted) {
                                // TODO: Is there a better CSS class?
                                oLink.addStyleClass('surjFocused');
                            }

                            picker.setFooter(self._externalSearchLink);

                            picker.addEventDelegate({
                                onmouseup : function(oEvent) {
                                    oParentSearch.__ignoreBlur = false;
                                },
                                onmousedown : function(oEvent) {
                                    /*
                                     * Prevents blur on SearchField when
                                     * clicking in popover
                                     */
                                    oParentSearch.__ignoreBlur = true;
                                    oEvent.preventDefault();
                                },
                                onAfterRendering : function() {
                                    /*
                                     * Resets the min-width value from parent.
                                     */
                                    var oEl = picker.getDomRef();
                                    oEl.style.maxWidth = iWidth + 'px';
                                }
                            });

                            var closeOnScroll = function() {
                                picker.close();
                            }
                            picker.attachAfterOpen(function() {
                                window.addEventListener('scroll', closeOnScroll);
                                oParentSearch.$('I').attr('aria-owns', picker.getId());
                            });
                            picker.attachBeforeClose(function() {
                                window.removeEventListener('scroll', closeOnScroll);
                                oParentSearch.$('I').removeAttr('aria-owns');
                            });
                        }

                        // TODO: Figure out how to limit height of popover
                        // Currently not possible with existing API
                    }
                }
            }
        });
    }
    
    BizXSuggest.USE_DIALOG = Device.system.phone;

    // Ensure that this will a proper "subclass" of parent constructor
    BizXSuggest.prototype = new Suggest();
    BizXSuggest.prototype._super = Suggest;
    $.sap.setObject('sap.sf.surj.shell.controls.BizXSuggest', BizXSuggest);

    /**
     * Extend the Suggest base object with everything from oImpl, also we will
     * provide this._super functionality for easy calling of the super class
     * implementation of the same function.
     * 
     * @param {Object} oThis
     * @param {Object} oImpl
     */
    function superExtend(oThis, oImpl) {
        $.each(oImpl, function(sAttr, fMethodImpl) {
            var fOverride = fMethodImpl
            if (typeof fMethodImpl == 'function' && FN_TEST.test(fMethodImpl)) {
                // Backup the super implementation
                var fSuperImpl = oThis[sAttr];
                fOverride = function() {
                    var _super = oThis._super;
                    var rtn;
                    // Backup the existing _super variable
                    oThis._super = fSuperImpl;
                    try {
                        rtn = fMethodImpl.apply(oThis, arguments);
                    } finally {
                        // Restore old _super (even on exception)
                        oThis._super = _super;
                    }
                    return rtn;
                }
            }
            oThis[sAttr] = fOverride;
        });
    }

    /**
     * Regular Expression for determing if a function uses this._super
     * 
     * @inner
     * @type {RegExp}
     */
    var FN_TEST = /xyz/.test(function() {
        xyz;
    }) ? /\b_super\b/ : /.*/;

    return BizXSuggest;
});