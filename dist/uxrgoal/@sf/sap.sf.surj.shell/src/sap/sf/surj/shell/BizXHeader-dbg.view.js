sap.ui.define('sap/sf/surj/shell/BizXHeader.view', [
    'jquery.sap.global', 
    'sap/ui/core/CustomData',
    'sap/ui/core/delegate/ItemNavigation',
    './controls/Container',
    './controls/NotificationWrapper',
    './controls/FocusMarker',
    './controls/BizXButton',
    './controls/BizXSearchField',
    './controls/UserPhoto',
    './util/SuppIconPool',
    './util/A11yPreferences',
    './util/Util',
    'sap/m/SearchField',
    'sap/m/SuggestionItem',
    'sap/m/Bar',
    'sap/m/Text',
    'sap/m/Image',
    'sap/m/OverflowToolbar',
    'sap/m/Link',
    'sap/ui/core/theming/Parameters'
], function ($, CustomData, ItemNavigation, Container, NotificationWrapper, FocusMarker, BizXButton, BizXSearchField, UserPhoto, SuppIconPool, A11yPreferences, Util, SearchField, SuggestionItem, Bar, Text, Image, OverflowToolbar, Link, Parameters) {
    "use strict";
    var oCore = sap.ui.getCore();
    var rb = oCore.getLibraryResourceBundle('sap.sf.surj.shell.i18n');
    var FIORI_3_HEADER = 3;
    sap.ui.jsview('sap.sf.surj.shell.BizXHeader', {
        /**
         * @param {Object} oController The controller instance
         */
        createContent : function(oController) {
            this.addStyleClass('sfRevolutionTopNavigationMobile globalHeaderContainerWidthBackground globalNavigationContainer globalHeaderHeight surjTopNav globalHeader');
            if (A11yPreferences.isLowVisionEnabled()) {
                this.addStyleClass('globalLowVisionSupport');
                this.addStyleClass(A11yPreferences.getLowVisionType());
            }
            var oContent = [ this.createCustomHeader(oController), this.createSubHeader(oController) ];

            /*
             * The AccessKeysHandler is something special to ushell page
             * Contents inside the page cannot manually receive focus and
             * require manual javascript control to focus into it.
             * 
             * To solve this we add focus markers between the header and
             * content, when focus lands on the first focus marker it means we
             * need to focus into the content of the ushell using the
             * AccessKeysHandler object.
             * 
             * If focus lands on the second marker, it means the user has
             * shift-tab focus back from the ushell to the header.
             */
            if ($.sap.getObject('sap.ushell.renderers.fiori2.AccessKeysHandler')) {
                var oFocusContent = new FocusMarker();
                var oFocusHeader = new FocusMarker();
                oFocusContent.addEventDelegate({
                    onfocusin : function() {
                        oController.focusContent();
                    }
                });
                oFocusHeader.addEventDelegate({
                    onfocusin : function() {
                        oController.focusHeader();
                    }
                });
                oContent.push(oFocusContent, oFocusHeader);
            }

            return oContent;
        },

        /**
         * @param {Object} oController The controller instance
         */
        createCustomHeader : function(oController) {
            var that = this;
            var oModel = oCore.getModel('pageHeader');
            var iHeaderVersion = oModel.getProperty('/headerVersion');
            var isFiori3HeaderEnabled = iHeaderVersion >= FIORI_3_HEADER;

            var field = new SearchField({
                enableSuggestions : true,
                suggestionItems : [ new SuggestionItem({
                    text : 'test'
                }), new SuggestionItem({
                    text : 'test'
                }), new SuggestionItem({
                    text : 'test'
                }) ],
                suggest : function() {
                    field.suggest(true);
                }
            });

            var oSearchField = new BizXSearchField('bizXSearchField', {
                resetOnBlur : true,
                showRefreshButton : true,
                showSearchButton : false,
                visible : {
                    parts : [{path:'universalSearch>/searchEnabled'}],
                    formatter : function(bSearchEnabled) {
                        return bSearchEnabled && !bUseDialog;
                    }
                },
                a11yLabel : '{universalSearch>/a11yLabel}',
                a11yAnnouncement : '{universalSearch>/a11yAnnouncement}',
                value : '{universalSearch>/filter}',
                transitiveText : '{universalSearch>/transitiveAction/actionLabel}',
                showSearchType : '{universalSearch>/searchTypeVisible}',
                searchTypeTooltip : rb.getText('COMMON_Global_Action_Search_Selector_Aria_Label'),
                searchTypeAriaLabel : rb.getText('COMMON_SEARCH_SELECTOR_A11Y'),
                tooltip : '{universalSearch>/tooltip}', // UI-8575
                placeholder : '{universalSearch>/placeholder}',
                enableSuggestions : '{universalSearch>/enableSuggestions}',
                pending : '{universalSearch>/pending}',
                pressSearchType : [ oController.showSearchType, oController ],
                search : [ oController.search, oController ],
                suggest : [ oController.searchSuggest, oController ],
                reset : [ oController.reset, oController ],
                scrollDelegateAvailable : [ oController.setSearchScrollDelegate, oController ],
                suggestionItemSelected : [ oController.selectSuggestItem, oController ],
                enableExternalSearch : '{universalSearch>/enableExternalSearch}',
                externalSearch : [ oController.externalSearch, oController ],
                quickcardRequest : [oController.quickcardRequest, oController ],
                focusQuickcard : [ oController.focusQuickcard, oController ],
                highlightExternalSearch : [ oController.highlightExternalSearch, oController ],
                afterSuggestClose : [ oController.afterSuggestClose, oController ],
                customData: new CustomData({
                    key: "help-id",
                    value: 'bizxHeaderSearchField',
                    writeToDom: true
                })
            });

            var bUseDialog = oSearchField.isUseDialog();
            var oSuggestButton = new BizXButton('bizXSuggestButton', {
                icon : 'sap-icon://search',
                tooltip : '{universalSearch>/placeholder}',
                press : [ oController.openSearchSuggestion, oController ],
                visible : {
                    parts : [{path:'universalSearch>/searchEnabled'}],
                    formatter : function(bSearchEnabled) {
                        return bSearchEnabled && bUseDialog;
                    }
                },
                customData: new CustomData({
                    key: "help-id",
                    value: 'bizxHeaderSuggestButton',
                    writeToDom: true
                })
            });

            if (bUseDialog) {
                /*
                 * SFSF Hack
                 * 
                 * When using the Dialog for suggest, the suggest button will
                 * act as a placeholder for the search field to open its suggest
                 * flow. However, because SuggestItems are children of
                 * SearchField, the events (such as tap) will not propagate to
                 * the Dialog parent because the SuggestItems are actually
                 * children of SearchField which is not really active in Mobile.
                 * 
                 * To get around this, make the SearchField isActive return the
                 * active state of the Suggest button - which will be displayed
                 * instead on mobile (see the visible attribute setting of the
                 * SuggestButton and the SearchField).
                 */
                oSearchField.isActive = function() {
                    return oSuggestButton.isActive();
                }
            }

            var oModulePicker;

            var oCustomHeader = new Bar('bizXShellCustomHeader', {
                design : 'Header',
                contentLeft : [
                    new BizXButton('bizXShellHomeIcon', {
                        visible : {
                            parts : ['pageHeader>/enableHomeIcon', 'pageHeader>/homeModule'],
                            formatter : function(enableHomeIcon, homeModule) {
                                return homeModule && (enableHomeIcon && !isFiori3HeaderEnabled) ;
                            }
                        },
                        icon : 'sap-icon://home',
                        press : [ oController.navigateToHome, oController ],
                        tooltip : rb.getText('COMMON_Go_To_Home_Page'),
                        ariaLabel: rb.getText('COMMON_Home'),
                        customData: new CustomData({
                            key: "help-id",
                            value: 'bizxHeaderHomeIcon',
                            writeToDom: true
                        })
                    }).addStyleClass('surjTopNavHomeButton bizXDisableMobile'),

                    oModulePicker = new BizXButton("customHeaderModulePickerBtn", {
                        visible : {
                            path: 'pageHeader>/modules',
                            formatter: function(modules) {
                                return modules.length > 0;
                            }
                        },
                        ariaLabel : rb.getText('COMMON_MENU_MAIN_NAVIGATION'),
                        icon : isFiori3HeaderEnabled ? 'sap-icon://megamenu' : 'sap-icon://slim-arrow-down',
                        text : {
                            parts : [{path : 'pageHeader>/title'}],
                            formatter : function(title) {
                                return that.unescapeHTML(title);
                            }
                        },
                        press : [ oController.showModulePicker, oController ],
                        iconFirst : false,
                        tooltip : {
                            parts : [
                                'pageHeader>/title',
                                'pageHeader>/selectedModule',
                                'pageHeader>/modules'
                            ],
                            formatter : function(sTitle, oSelectedModule, aModules) {
                                var iSelectedIndex = 0;
                                for (iSelectedIndex = aModules.length - 1; iSelectedIndex >= 0; iSelectedIndex--) {
                                    if(aModules[iSelectedIndex].isSelected) break;
                                }
                                var sSelectedModule = (oSelectedModule ? oSelectedModule.title : sTitle);
                                return rb.getText('COMMON_MENU_CURRENT_MODULE_MAIN_NAVIGATION', [sSelectedModule, ++iSelectedIndex, aModules.length]);
                            }
                        },
                        customData: new CustomData({
                            key: "help-id",
                            value: 'bizxHeaderModulePicker',
                            writeToDom: true
                        })
                    }).addStyleClass('bizXShellDropMenuButton bizXDisableMobile').addEventDelegate({
                        onAfterRendering: function () {
                            var $modulePickerBtn = $("#customHeaderModulePickerBtn");
                            $modulePickerBtn.attr({
                                "aria-haspopup": true,
                                "aria-expanded": false,
                                "aria-controls": ($modulePickerBtn.attr("id") + "-menuPopover")
                            });
                        }
                    }),

                    new BizXButton({
                        visible : {
                            path: 'pageHeader>/modules',
                            formatter: function(modules) {
                                return modules.length > 0;
                            }
                        },
                        icon : isFiori3HeaderEnabled ? 'sap-icon://megamenu' : 'sap-icon://menu2',
                        press : [ oController.showModulePicker, oController ]
                    }).addStyleClass('bizXMobileOnly'),

                    new Text({
                        text : {
                            parts : [{path : 'pageHeader>/title'}],
                            formatter : function(title) {
                                return that.unescapeHTML(title);
                            }
                        },
                        visible : !isFiori3HeaderEnabled
                    }).addStyleClass('surjTopNavTitle globalHeaderText bizXMobileOnly')
                ],

                contentRight : [

                oSuggestButton,

                oSearchField,

                this.createGlobalNotificationButton(oController),

                this.createTodoButton(oController),

                this.createJobPickerButton(oController),

                this.createUserMenuButton(oController),

                this.createProductSwitcherButton(oController)
                ]
            }).addStyleClass('globalHeaderBar surjTopNavHeaderBar');

            var oSettings = oModel.getProperty('/settings');
            var hideGlobalNavigationMenuEnabled;
            if (oSettings && (oSettings.hideGlobalNavigationMenuEnabled != null)) {
                hideGlobalNavigationMenuEnabled = (String(oSettings.hideGlobalNavigationMenuEnabled) == 'true');
            } else {
                hideGlobalNavigationMenuEnabled = ($('#hideGlobalNavigationMenuEnabled').attr('content') == 'true');
            }
            if (hideGlobalNavigationMenuEnabled) {
                oModulePicker.addStyleClass('hiddenGlobalNavigationMenu');
            }

            oCustomHeader.addEventDelegate({
                onAfterRendering: function () {
                    oCustomHeader.$().attr('role', 'banner');
                    /*
                     * UI-20292 sap.m.Bar will explicitly set the width of contentRight sometimes in Edge after rendering.
                     * The width makes the header wider than body.clientWidth,
                     * the header goes beyond the viewport and the calcuation of body width in bodyResize handler is impacted.
                     * The reason to set the width is not clear, but removing the width makes header display properly in Edge.
                     */
                    var headerBarRight = $('.sapMBarRight', oCustomHeader.$());
                    if (headerBarRight && headerBarRight.css('width')) {
                        headerBarRight.css('width', '');
                    }

                    /*
                     * UI-22991 The style issue for search icon is wrapper form tag is missing and only happened in acme page when web assistant is enabled. 
                     * The root cause is there is unmatched html form tag in the page and it is revealed by UI5 upgrading to 1.71
                     * When help icon is inserted by web assistnat script, the form tag wrapping the search is not outputted by new renderControl mechanism,
                     * because of the mismatch form tag in the page.
                     * Forcefully rerender the search field will output the form tag.
                     */
                    if (jQuery('#'+ oSearchField.getId() + '>form').length == 0) {
                        setTimeout(function() {
                            oSearchField.rerender();
                        }, 500);
                    }
                }
            });

            var oLogoImage = new Image({
                densityAware : false,
                src : "{pageHeader>/logoInfo/url}",
                decorative : true,
            }).addStyleClass('globalLogoPrimaryImage sapMBtnHoverable sapMFocusable');

            var globalLogoUploadedImageRevealer = new Container().addStyleClass('globalLogoUploadedImageRevealer');

            globalLogoUploadedImageRevealer.addEventDelegate({
                onAfterRendering: function() {
                    Util.waitForGlobalTheme().then(function() {
                        var globalLogoUploadedImageRevealer = jQuery(".globalLogoUploadedImageRevealer");
                        if (globalLogoUploadedImageRevealer.length > 0 && globalLogoUploadedImageRevealer.css("left") == "1px") {
                            var logoUploadedUrl = globalLogoUploadedImageRevealer.css("background-image");
                            if (logoUploadedUrl != "none") {
                                oLogoImage.setSrc((logoUploadedUrl.match(/url\("?([^"]*)"?\)/) || [])[1]);
                            }
                        }
                    });
                }
            });

            var oCompanyLogo = new Container('bizXHeaderCompanyLogo', {
                customData: new CustomData({
                    key: "help-id",
                    value: 'bizxHeaderCompanyLogo',
                    writeToDom: true
                }),
                content : [

                oLogoImage,

                globalLogoUploadedImageRevealer

                ]
            }).addStyleClass('bizXDesktopOnly globalLogo company-logo');

            oCompanyLogo.addEventDelegate({
                onAfterRendering: function() {
                    oCompanyLogo.$().attr({
                        'role' : 'button',
                        'tabindex' : 0,
                        'title': rb.getText('COMMON_LOGO_ALT', oModel.getProperty('/logoInfo/altText'))
                   });
                }
            });
            oCompanyLogo.onclick = oController.navigateToHome.bind(oController);
            oCompanyLogo.onkeydown = function(event) {
                if(event.keyCode === $.sap.KeyCodes.ENTER || event.keyCode === $.sap.KeyCodes.SPACE) {
                    oController.navigateToHome();
                }
            };
            oController.insertCompanyLogo(oCustomHeader, oCompanyLogo);
            this.oHeaderBar = oCustomHeader;
            return oCustomHeader;
        },

        /**
         * The Sub Tabs directly under the Header Bar.
         * 
         * @return {sap.ui.core.Control}
         */
        createSubHeader : function(oController) {
            var that = this;
            sap.m._overflowToolbarHelpers.OverflowToolbarAssociativePopoverControls._mSupportedControls['sap.m.Link'] = {
                canOverflow: true,
                listenForEvents: ["press"],
                noInvalidationProps: ["enabled", "type"]
            };
            var oSelectedInvisibleText = new sap.ui.core.InvisibleText({
                text: rb.getText('COMMON_Selected')
            }).toStatic();
            var firstTimeToolbarRender = true;
            var toolbar = new OverflowToolbar('surjSubTabBar', {
                visible : {
                    parts : [ {
                        path : 'pageHeader>/subTabs/length'
                    }, {
                        path : 'pageHeader>/subTabs/0/alwaysShow'
                    } ],
                    formatter : function(iSubTabsLength, bAlwaysShow) {
                        return iSubTabsLength > 1 || !!bAlwaysShow;
                    }
                },
                ariaLabelledBy: new sap.ui.core.InvisibleText({
                    text: rb.getText('COMMON_Subnavigation')
                }).toStatic(),
                content : {
                    path : 'pageHeader>/subTabs',
                    factory : function(sId, oContext) {
                        var oObject = oContext.getObject();
                        var oLink = new Link(oObject.id ? "bizxSubTab_" + oObject.id : sId, {
                            text: '{pageHeader>label}',
                            tooltip: {
                                parts: [{path: 'pageHeader>title'}],
                                formatter: that.unescapeHTML.bind(that)
                            },
                            href: {
                                parts: [{path: 'pageHeader>url'}],
                                formatter: that.unescapeHTML.bind(that)
                            }
                        })
                            .addStyleClass(oObject.isSelected ? 'globalNavigationActiveItem' : 'globalNavigationItem')
                            .addStyleClass('surjSubTabItem');
                        if (oObject.isSelected) {
                            oLink.addAriaDescribedBy(oSelectedInvisibleText);
                        }
                        oLink.addEventDelegate({
                            onAfterRendering : function() {
                                var oEl = oLink.$().removeClass('sapMLnk');
                                var onclick = that.unescapeHTML(oObject.onclick);
                                if (oEl.length > 0 && onclick) {
                                    if (typeof onclick == 'string') {
                                        oEl.attr('onclick', onclick);
                                    } else if (typeof onclick == 'function') {
                                        oEl[0].onclick = onclick;
                                    }
                                }
                            }
                        });
                        return oLink;
                    }
                }
            }).addEventDelegate({
                onAfterRendering: function() {
                    function updateButtonType() {
                        jQuery('#surjSubTabBar-overflowButton').attr('type', 'button');
                    }
                    if (firstTimeToolbarRender) {
                        updateButtonType();
                        var overflowButton = toolbar.getAggregation("_overflowButton");
                        overflowButton.addEventDelegate({
                            onAfterRendering: function() {
                                updateButtonType();
                            }
                        });

                        var overflowPopover = toolbar.getAggregation("_popover");
                        overflowPopover.addStyleClass('globalMenu');

                        overflowPopover.attachBeforeOpen(function() {
                            var overflowContentIds = this.getAssociatedContent();
                            overflowContentIds.forEach(function(item) {
                                oCore.byId(item).addStyleClass('globalMenuItem surjOverflowItem')
                            })
                        });
                        overflowPopover.attachBeforeClose(function() {
                            var overflowContentIds = this.getAssociatedContent();
                            overflowContentIds.forEach(function(item) {
                                oCore.byId(item).removeStyleClass('globalMenuItem surjOverflowItem')
                            })
                        });
                        /* ItemNavigation helps with arrow key navigation treating
                           sub navigation links as one composite control */
                        if (!this._subTabItemNav) {
                            this._subTabItemNav = new ItemNavigation().setCycling(false);
                            toolbar.addDelegate(this._subTabItemNav); 
                        }

                        firstTimeToolbarRender = false;
                    }
                    /* ItemNaviagtion directly works on DOM references so need to update the 
                       references everytime the toolbar control renders */
                    if (this._subTabItemNav) {
                        var oToolbarDom = toolbar.getDomRef();
                        var oToolbarChildDoms = oToolbarDom.children;
                        var iSetSize = oToolbarChildDoms.length;
                        var iSelectedIndex = 0;
                        for (var i = 0, oChildDom; i < iSetSize; i++) {
                            oChildDom = oToolbarChildDoms[i];
                            oChildDom.setAttribute('aria-posinset', i + 1);
                            oChildDom.setAttribute('aria-setsize', iSetSize);
                            oChildDom.setAttribute('role', 'menuitem');
                            if(oChildDom.classList.contains('globalNavigationActiveItem')) {
                                iSelectedIndex = i;
                            }
                        }
                        this._subTabItemNav.setRootDomRef(oToolbarDom);
                        this._subTabItemNav.setItemDomRefs(oToolbarChildDoms);
                        this._subTabItemNav.setSelectedIndex(iSelectedIndex);
                    }
                    /* Set toolbar role to tablist as the sub menu links are being set with a role of tab */
                    toolbar.getDomRef().setAttribute('role', 'menubar');
                }
            }).addStyleClass('surjSubTabBar globalNavigation sub-nav-container');

            return toolbar;
        },

        /**
         * @private
         * @return {sap.m.Button}
         */
        createJobPickerButton : function(oController) {
            var oEventDelegates = {
                mouseenter : $.proxy(oController.mouseEnterJobPicker, oController),
                mouseleave : $.proxy(oController.mouseLeaveJobPicker, oController)
            };
            var oJobPicker = new BizXButton({
                icon : 'sap-icon://switch-classes',
                tooltip : {
                    parts : [ {
                        path : 'pageHeader>/selectedAssignment'
                    } ],
                    formatter : function(oSelectedAssignment) {
                        if (oSelectedAssignment) {
                            return rb.getText('COMMON_Select_Employment_Tooltip_Text', [ oSelectedAssignment.label ]);
                        }
                        return rb.getText('COMMON_Select_Employment_Tooltip_Text_NoSelection');
                    }
                },
                ariaLabelledBy : new sap.ui.core.InvisibleText({
                    text : {
                        parts : [ {
                            path : 'pageHeader>/selectedAssignment'
                        } ],
                        formatter : function(oSelectedAssignment) {
                            if (oSelectedAssignment) {
                                return rb.getText('COMMON_Select_Employment_Tooltip_Text', [ oSelectedAssignment.label ]);
                            }
                            return rb.getText('COMMON_Select_Employment_Aria_Text_NoSelection');
                        }
                    }
                }).toStatic(),
                visible : {
                    parts : [ {
                        path : 'pageHeader>/globalAssignmentLinks'
                    } ],
                    formatter : function(aGlobalAssignmentLinks) {
                        return !sap.ui.Device.system.phone && !!aGlobalAssignmentLinks && aGlobalAssignmentLinks.length > 1;
                    }
                },
                press : [ oController.pressJobPicker, oController ],
                customData: new CustomData({
                    key: "help-id",
                    value: 'bizxHeaderJobPickerButton',
                    writeToDom: true
                })
            }).addStyleClass('jobSelectorButton').addEventDelegate({
                onAfterRendering : function() {
                    oJobPicker.$().unbind(oEventDelegates).bind(oEventDelegates);
                }
            });
            return oJobPicker;
        },

        /**
         * Jam Notification : Count as text, go to Jam when pressed.
         * 
         * @param {Object} oController
         * @return {sap.ui.core.Control}
         */
        createGlobalNotificationButton : function(oController) {
            return new NotificationWrapper({
                text : {
                    parts : [ {
                        path : 'globalNotification>/newCount'
                    }, {
                        path : 'jamNotification>/newCount'
                    } ],
                    formatter : function(globalCount, jamCount) {
                        var totalCount = parseInt(globalCount ? globalCount : 0, 10) + parseInt(jamCount ? jamCount : 0, 10);
                        return totalCount > 50 ? '50+' : (totalCount ? totalCount : '');
                    }
                },
                visible : {
                    parts : [ {
                        path : 'globalNotification>/visible'
                    }, {
                        path : 'jamNotification>/visible'
                    } ],
                    formatter : function(globalEnabled, jamEnabled) {
                        return !!(globalEnabled || jamEnabled);
                    }
                },
                content : new BizXButton('current-user-notification-count', {
                    icon : 'sap-icon://bell',
                    ariaLabel : rb.getText('COMMON_Notification_title'),
                    tooltip : {
                        parts : [ {
                            path : 'globalNotification>/newCount'
                        }, {
                            path : 'jamNotification>/newCount'
                        } ],
                        formatter : function(globalCount, jamCount) {
                            var totalCount = parseInt(globalCount ? globalCount : 0, 10) + parseInt(jamCount ? jamCount : 0, 10);
                            return (totalCount != 1) ? rb.getText('COMMON_Global_Notifications_new_count_plural', [ totalCount ]) :
                                rb.getText('COMMON_Global_Notifications_new_count_singular');
                        }
                    },
                    press : [ oController.toggleGlobalNotificationPanel, oController ],
                    customData: new CustomData({
                        key: "help-id",
                        value: 'bizxHeaderNotificationButton',
                        writeToDom: true
                    })
                }).addStyleClass('surjNotificationBtn').addEventDelegate({
                    onAfterRendering : $.proxy(oController._onAfterRenderingNotification, oController)
                })
            });
        },

        /**
         * @param {Object} oController
         * @return {sap.m.Button}
         */
        createTodoButton : function(oController) {
            return new NotificationWrapper({
                text : {
                    parts : [ {
                        path : 'pageHeader>/globalTodoCount'
                    } ],
                    formatter : function(iCount) {
                        if (iCount === 0) {
                            return '';
                        }
                        if (iCount > 99) {
                            return '99+';
                        }
                        return iCount;
                    }
                },
                visible : {
                    path: 'pageHeader>/enableGlobalTodos',
                    formatter : function(bEnableGlobalTodos) {
                        return !sap.ui.Device.system.phone && !!bEnableGlobalTodos;
                    }
                },
                content : new BizXButton('globalTodos', {
                    ariaLabel : rb.getText('COMMON_You_Have_Todos'),
                    icon : 'sap-icon://sys-enter',
                    tooltip : {
                        parts : [ {
                            path : 'pageHeader>/globalTodoCount'
                        } ],
                        formatter : function(count) {
                            if (count === 0) {
                                return rb.getText('HOME_Todo_MSG_ALL_COMPLETED');
                            }
                            if(count > 99) {
                                return rb.getText('COMMON_You_Have_Todos_PLURAL', ['99+'])
                            }
                            return count === 1 ? rb.getText('COMMON_You_Have_Todos_SINGULAR') : rb.getText('COMMON_You_Have_Todos_PLURAL', [ count ]);
                        }
                    },
                    press : [ oController.showTodoPanel, oController ],
                    customData: new CustomData({
                        key: "help-id",
                        value: 'bizxHeaderTodoButton',
                        writeToDom: true
                    })
                }).addStyleClass('surjTodoButton').addEventDelegate({
                    onAfterRendering: function () {
                        var oGlobalTodoButton = oCore.byId('globalTodos');
                        if(oGlobalTodoButton) {
                            oGlobalTodoButton.$().attr({
                                'aria-expanded': false,
                                'aria-controls': 'globalTodoPanel'
                            });
                        }
                    }
                })
            });
        },

        /**
         * UserPhoto : Do not show user name on phone
         * 
         * @return {sap.ui.core.Control}
         */
        createUserMenuButton : function(oController) {
            // TODO: We should remove any dependency on model through the use of binding/formatters
            var oModel = oCore.getModel('pageHeader');
            var iHeaderVersion = oModel.getProperty('/headerVersion');
            var oMenuBtn, buttonSettings;
            var clickBehavior = [ oController.showUtilityLinks, oController ];
            var surjUtilityLinksMenuId = 'utilityLinksMenuId';

            if (oModel && !oModel.getProperty('/userInfo/photoEnabled') && iHeaderVersion < FIORI_3_HEADER) {
                buttonSettings = {
                    press: clickBehavior,
                    enabled: {
                        parts : ['pageHeader>/actionLinks/length'],
                        formatter : function(iLength) {
                            return iLength > 0;
                        }
                    },
                    ariaLabel : rb.getText('COMMON_MENU_ACCOUNT_NAVIGATION_ARIA_LABEL'),
                    icon: {
                        parts : ['pageHeader>/actionLinks/length', 'pageHeader>/headerVersion'],
                        formatter : function(iLength, iHeaderVersion) {
                            return iLength > 0 && iHeaderVersion < FIORI_3_HEADER ? 'sap-icon://slim-arrow-down' : null;
                        }
                    },
                    text : {
                        parts : ['pageHeader>/userTopNav/fullName', 'pageHeader>/headerVersion'],
                        formatter : function(fullName, iHeaderVersion) {
                            return iHeaderVersion < FIORI_3_HEADER ? fullName : '';
                        }
                    },
                    tooltip : {
                        parts : ['pageHeader>/userTopNav/fullName'],
                        formatter : function(sFullName) {
                            return rb.getText('COMMON_MENU_ACCOUNT_NAVIGATION', sFullName);
                        }
                    },
                    iconFirst : false,
                    customData: new CustomData({
                        key: "help-id",
                        value: 'bizxHeaderUserMenuButton',
                        writeToDom: true
                    })
                };

                oMenuBtn = new BizXButton(surjUtilityLinksMenuId, buttonSettings).addStyleClass('bizXShellDropMenuButton surjUtilityLinksMenu');

            } else {
                buttonSettings = {
                    click : clickBehavior,
                    ariaLabel : rb.getText('COMMON_MENU_ACCOUNT_NAVIGATION_ARIA_LABEL'),
                    tooltip : {
                        parts : ['pageHeader>/userTopNav/fullName'],
                        formatter : function(sFullName) {
                            return rb.getText('COMMON_MENU_ACCOUNT_NAVIGATION', sFullName);
                        }
                    },
                    user : '{pageHeader>/userTopNav}',
                    profile : {
                        circle : true,
                        placeholder : sap.ui.resource('sap.sf.surj.shell.img.userphoto','') + 'UserPhotoPlaceholder_50x50.png'
                    },
                    focusable : {
                        parts : ['pageHeader>/actionLinks/length'],
                        formatter : function(iLength) {
                            return iLength > 0;
                        }
                    },
                    showUserName : {
                        parts: ['pageHeader>/headerVersion'],
                        formatter: function (iHeaderVersion) {
                            return iHeaderVersion < FIORI_3_HEADER;
                        }
                    },
                    nameDirection : 'EAST',
                    showMenuIcon : {
                        parts : ['pageHeader>/actionLinks/length', 'pageHeader>/headerVersion'],
                        formatter : function(iLength, iHeaderVersion) {
                            return iLength > 0 && iHeaderVersion < FIORI_3_HEADER;
                        }
                    },
                    useMButtonStyles : {
                        parts : ['pageHeader>/actionLinks/length'],
                        formatter : function(iLength) {
                            return iLength > 0;
                        }
                    },
                    customData: new CustomData({
                        key: "help-id",
                        value: 'bizxHeaderUserMenuButton',
                        writeToDom: true
                    }),
                    useAvatar: {
                        parts: ['pageHeader>/headerVersion', 'pageHeader>/userInfo/photoEnabled'],
                        formatter: function (iHeaderVersion, photoEnabled) {
                            return iHeaderVersion >= FIORI_3_HEADER && !photoEnabled;
                        }
                    },
                    displaySize: {
                        parts: ['pageHeader>/headerVersion'],
                        formatter: function (iHeaderVersion) {
                            return iHeaderVersion >= FIORI_3_HEADER ? "XS" : "M";
                        }    
                    }
                };

                oMenuBtn = new UserPhoto(surjUtilityLinksMenuId, buttonSettings).addStyleClass('globalPlacematText surjUtilityLinksMenu');
            }
            var notificationWrapper = new NotificationWrapper({
                text: {
                    parts: [
                        {path: 'pageHeader>/enableGlobalTodos'},
                        {path: 'pageHeader>/globalTodoCount'}
                    ],
                    formatter: function (bEnableGlobalTodos, iCount) {
                        if (sap.ui.Device.system.phone && !!bEnableGlobalTodos && iCount > 0) {
                            return '' + iCount;
                        }
                        return '';
                    }
                },
                content: oMenuBtn
            });
            oMenuBtn.addEventDelegate({
                onAfterRendering: function () {
                    oMenuBtn.$().attr('aria-expanded', false);
                    oController.adjustNameSize.bind(oController);
                }
            });
            return notificationWrapper;
        },
        createProductSwitcherButton: function(oController) {
            var oModel = oCore.getModel('pageHeader');
            var isProductSwitcherEnabled = oModel.getProperty('/productSwitcherEnabled') && (Util.isRunningBaseDomain() || Util.isBaseDomainCORSEnabled());
            if (isProductSwitcherEnabled) {
                var switcherButton = new BizXButton('productSwitcherBtn', {
                    icon : 'sap-icon://grid',
                    press : [ oController.pressProductSwitcher, oController ]
                });
                return switcherButton;
            }
        },
        addCopilotButton: function (oCopilotButton) {
            var oHeaderBar = this.oHeaderBar;
            if (!oHeaderBar || !oCopilotButton) return;

            var oModel = oCore.getModel('pageHeader');
            var iHeaderVersion = oModel.getProperty('/headerVersion');
            
            if (iHeaderVersion >= FIORI_3_HEADER) {
                oCopilotButton.setIcon(this._getCopilotImage());
                oHeaderBar.addContentMiddle(oCopilotButton);
            } else {
                oHeaderBar.insertContentRight(oCopilotButton, 2);
            }
        },
        _getCopilotImage: function () {
            var sCopilotDesign = Parameters.get('_sap_f_Shell_Bar_Copilot_Design');
            var sCopilotImgUrl;
            if (sCopilotDesign && sCopilotDesign != 'dark') {
                sCopilotImgUrl = 'sap/f/shellBar/CoPilot_white.svg';
            } else {
                sCopilotImgUrl = 'sap/f/shellBar/CoPilot_dark.svg';
            }
            return sap.ui.require.toUrl(sCopilotImgUrl);
        },

        /**
         * @return {String}
         */
        getControllerName : function() {
            return 'sap.sf.surj.shell.BizXHeader';
        },
        unescapeHTML : function(html) {
            if (this.getController().isLegacyEscaped()) {
                return jQuery('<span>' + html + '</span>').text();
            } else {
                return html;
            }
        }
    });
});
