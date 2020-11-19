(function($) {
    var pkg = 'sap.sf.surj.shell.util';
    $.sap.declare(pkg + '.FOPeopleSearchUtil');
    $.sap.require(pkg + '.SearchUtil');
    $.sap.require(pkg + '.LinkUtil');
    var util = $.sap.getObject(pkg);
    var oCore = sap.ui.getCore();
    util.SearchUtil.register('FOPeople', {
        /**
         * @param {Object} oCriteria
         * @param {String} oCriteria.searchValue
         * @param {Array.<String>} oCriteria.keys
         * @param {Integer} oCriteria.maxresults
         */
        search : function(oCriteria) {
            var iPageIndex = 0;
            return createDeferred(oCriteria, iPageIndex, {});
        }
    });

    var AJAX_SERVICE = {
        type : 'ajaxService',
        serviceName : 'foundationAutoCompleteController',
        serviceMethod : 'search'
    };

    var DEFAULT_CRITERIA = {
        searchType : "WORKER",
        target : "worker",
        applyTC : false,
        displayBizPhone : true,
        displayJobTitle : true,
        pageNumber : 1,
        pageSize : 7,
        valueAttribute : undefined,
        baseElement : undefined,
        newHirePage : false

        /** Caller Parameters */
        //  userSysId : "admin",
        //  searchText : "alan",
        //  hrisElementField : "delegateeUser",
    };

    /**
     * @inner
     * @param {Object} oCriteria
     * @param {Integer} iPageIndex
     * @param {Object} oCrumbs
     * @return {Promise}
     */
    function createDeferred(oCriteria, iPageIndex, oCrumbs) {
        var oLegacyAdditionalCriteria = oCriteria.legacyAdditionalCriteria || {};
        var oRequest = $.extend({}, DEFAULT_CRITERIA, {
            searchText       : oCriteria.searchValue,
            pageNumber       : iPageIndex + 1,
            pageSize         : oCriteria.maxresults,
            userSysId        : oLegacyAdditionalCriteria.userSysId,
            hrisElementField : oLegacyAdditionalCriteria.hrisElementField
        });

        return util.DeferredUtil.createDeferred($.extend({
            arguments : [ oRequest ]
        }, AJAX_SERVICE)).then(function(oResponse) {

            /** [Convert Field] : "results" => "items" */
            var aItems = [];
            oResponse.results && oResponse.results.forEach(function (re) {
                aItems.push({
                    name     : re.name,
                    userName : re.userName,
                    userId   : re.id,
                    keys     : { TITLE : ((re.jobTitle || "") + (re.jobLocation || "")) }
                });
            });

            var iTotalCount = oCrumbs.totalCount;
            if (iTotalCount == null) {
                iTotalCount = oCrumbs.totalCount = oResponse.totalNumberOfRecords;
            }

            var iCurrentPageCount = aItems.length;

            var iTotalReturned = oCrumbs.totalReturned = (oCrumbs.totalReturned || 0) + iCurrentPageCount;
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
})(jQuery);
