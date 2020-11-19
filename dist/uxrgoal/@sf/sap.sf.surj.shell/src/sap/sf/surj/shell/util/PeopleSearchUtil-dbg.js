
sap.ui.define('sap/sf/surj/shell/util/PeopleSearchUtil', [
    'jquery.sap.global',
    'sap/sf/surj/shell/util/Util',
    'sap/sf/surj/shell/util/SearchUtil',
    'sap/sf/surj/shell/util/LinkUtil',
    'sap/sf/surj/shell/util/DeferredUtil',
    ], function ($, Util, SearchUtil, LinkUtil, DeferredUtil) {

    var oCore = sap.ui.getCore();
    SearchUtil.register('People', {
        /**
         * @param {Object} oCriteria
         * @param {String} oCriteria.searchValue
         * @param {Array.<String>} oCriteria.keys
         * @param {Integer} oCriteria.maxresults
         */
        search : function(oCriteria) {
            var iPageIndex = 0;
            if (oCriteria.actionId) {

            } else {
                return createDeferred(oCriteria, iPageIndex, {});
            }
        },

        /**
         * @param {Object} oCriteria
         * @param {String} oCriteria.searchValue
         * @return {String}
         */
        getExternalSearchUrl : function(oCriteria) {
            var oParams = {};
            oParams[EXTERNAL_SEARCH_PARAM] = oCriteria.searchValue;
            return Util.ensureBaseDomain(EXTERNAL_SEARCH_URL + '?' + $.param(oParams));
        },

        /**
         * Select a user from the search results.
         * 
         * @param {Object} oItemConfig
         * @param {Object} oItemConfig.item
         * @param {String=} oItemConfig.item.userId
         * @param {String=} oItemConfig.item.userIdEncoded
         */
        selectItem : function(oItemConfig) {
            var oUser = oItemConfig.item;
            var oParams = {};
            if(oUser.userId || oUser.userIdEncoded) {
                var oPageMetaData = window.pageHeaderJsonData;
                var oSettings = oPageMetaData && oPageMetaData.settings;
                var bEncryptUserId = oSettings && oSettings.encryptUserIdInURLEnabled == 'true';
                if (!bEncryptUserId) {
                    bEncryptUserId = $('#encryptUserIdInURLEnabled').attr('content') == 'true';
                }
                if(bEncryptUserId) {
                    oParams.selected_user_encoded = oUser.userIdEncoded;
                } else {
                    oParams.selected_user = oUser.userId;
                }
            } else {
                return this.externalSearch();
            }
            LinkUtil.gotoURL(Util.ensureBaseDomain(PROFILE_URL + '?' + $.param(oParams)));
        }
    });

    var EXTERNAL_SEARCH_URL = '/sf/directory';
    var PROFILE_URL = '/xi/ui/pages/empfile/liveprofile.xhtml';
    var EXTERNAL_SEARCH_PARAM = 'peopleSearchString';

    var AJAX_SERVICE = {
        type : 'ajaxService',
        module : 'hris',
        serviceName : 'quickcardController',
        serviceMethod : 'searchUser'
    };

    var DEFAULT_CRITERIA = {
        adminPage : 'false',
        findtype : 'fullname',
        groupId : '0',
        includeExternalUsers : 'true',
        includeInactive : false,
        m : 'quickcard',
        maxresults : 10
    };

    /**
     * @inner
     * @param {Object} oCriteria
     * @param {Integer} iPageIndex
     * @param {Object} oCrumbs
     * @return {Promise}
     */
    function createDeferred(oCriteria, iPageIndex, oCrumbs) {
        var oRequest = $.extend({}, DEFAULT_CRITERIA, {
            searchValue : oCriteria.searchValue,
            page : iPageIndex + 1,
            maxresults : oCriteria.maxresults,
            keys : oCriteria.keys
        });
        // UI-14743 Send the startIndex as the lastIndex calculated from previous pages + 1
        var iStartIndex = oCrumbs.lastIndex;
        if (iStartIndex === 0 || isNaN(iStartIndex)) {
            iStartIndex = iPageIndex * oRequest.maxresults;
        } else {
            iStartIndex++;
        }
        oRequest.startIndex = iStartIndex;
        return DeferredUtil.createDeferred($.extend({
            arguments : [ oRequest ]
        }, AJAX_SERVICE)).then(function(oResponse) {
            // Only use the totalCount returned by the first response
            var iTotalCount = oCrumbs.totalCount;
            if (iTotalCount == null) {
                iTotalCount = oCrumbs.totalCount = oResponse.totalCount;
            }
            // Loop through the response items to find the last index
            var aItems = oResponse.items;
            var iCurrentPageCount = (aItems && aItems.length) || 0;
            var iLastIndex = 0;
            if (iCurrentPageCount > 0) {
                for (var i=0; i<iCurrentPageCount; i++) {
                    var oItem = aItems[i];
                    // If solr is disabled, then indexRef will be undefined
                    var iIndex = oItem.indexRef;
                    if (iIndex > iLastIndex) {
                        iLastIndex = iIndex;
                    }
                }
            }
            // If solr is disabled, then iLastIndex will be 0
            oCrumbs.lastIndex = iLastIndex;
            // UI-14743 Copying the logic from ActionSearchUtil to determine if the next page is available
            var iTotalReturned = oCrumbs.totalReturned = (oCrumbs.totalReturned||0) + iCurrentPageCount;
            var bHasMore = iCurrentPageCount > 0 && iTotalReturned < iTotalCount;
            return {
                type : 'People',
                items : aItems,
                totalCount : iTotalCount,
                hasMore : bHasMore,
                more : bHasMore ? function() {
                    return createDeferred(oCriteria, iPageIndex + 1, oCrumbs);
                } : null
            };
        });
    }
});