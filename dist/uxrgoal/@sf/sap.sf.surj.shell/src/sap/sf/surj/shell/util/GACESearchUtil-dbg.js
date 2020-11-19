/**
 * Provides the back-end hooks for fetching the Person-based search results.
 *
 * @name sap.sf.surj.shell.util.PersonEmploymentSearchUtil
 */

sap.ui.define('sap/sf/surj/shell/util/GACESearchUtil', [
        'jquery.sap.global',
        'sap/sf/surj/shell/util/DeferredUtil',
        'sap/sf/surj/shell/util/SearchUtil'
    ], function($, DeferredUtil, SearchUtil) {

    "use strict";
    var oCore = sap.ui.getCore();
    var sServiceGroup = 'GACESearch';

    /**
     * Create a deferred for a person or employment-based Search query.
     *
     * @inner
     * @param {Object} oCriteria
     *     The criteria object
     * @param {String} oCriteria.searchValue
     *     The user entered search value
     * @param {String} oCriteria.additionalCriteria
     *     Any additional criteria to pass along to the query
     * @param {Integer} oCriteria.maxresults
     *     How many results expected
     * @param {Integer} nPageIndex
     *     The page index, starting with 0
     */
    function createGACEAutoCompletePromise(oCriteria, nPageIndex, iTotalPersons, startIndex) {
        oCriteria.oDataServiceKey = oCriteria.oDataServiceKey || DEFAULT_ODATA_SERVICE_KEY;
        var bIsODataV2 = oCriteria.oDataServiceKey === DEFAULT_ODATA_SERVICE_KEY;
        var oAdditionalCriteria = Object.assign({}, oCriteria.additionalCriteria);
        var sResultScope = (oAdditionalCriteria.resultScope || "EMPLOYMENT").toUpperCase();
        iTotalPersons = iTotalPersons || 0;
        //Start building the URL Parameters
        var searchValue = oCriteria.searchValue;
        //Replace YES/NO with boolean equivalents true/false
        // Additionally, for oData V2 requests encode all string parameters as required by the oData V2 API
        for (var key in oAdditionalCriteria) {
        	var oAdditionalCriteriaStr = oAdditionalCriteria[key].toString();
            if (oAdditionalCriteriaStr.toUpperCase() == "YES") {
                oAdditionalCriteria[key] = true;
            } else if (oAdditionalCriteriaStr.toUpperCase() == "NO") {
                oAdditionalCriteria[key] = false;
            }
            if (bIsODataV2 && (key == "employmentEffectiveFrom" || key == "employmentEffectiveTo")) {
                oAdditionalCriteria[key] = DeferredUtil.encodeStringForOData(oAdditionalCriteria[key]);
            }
            if(key == "displayLocation"){
            	oAdditionalCriteria.includeLocationInfoPerEmpl = oAdditionalCriteria[key];
            	delete oAdditionalCriteria.displayLocation;
            }
            if(key == "includeHomeEmpl"){
            	oAdditionalCriteria.includeHomeAssignment = oAdditionalCriteria[key];
            	delete oAdditionalCriteria.includeHomeEmpl;
            }
            if(key == "includeExternalPersons"){
            	oAdditionalCriteria.includeExternalUsers = oAdditionalCriteria[key];
            	delete oAdditionalCriteria.includeExternalPersons;
            }
            if(key == "includeExternalPersonType"){
            	if(oAdditionalCriteria[key].trim() == ""){
            		delete oAdditionalCriteria.includeExternalPersonType;
            	}
                if(bIsODataV2){
                    oAdditionalCriteria[key] = DeferredUtil.encodeStringForOData(oAdditionalCriteria[key]);
                }
            }
            if(key == "dynamicGroupId"){
                if(oAdditionalCriteria[key].trim() == ""){
                    delete oAdditionalCriteria.dynamicGroupId;
                }
                if (bIsODataV2) {
                    oAdditionalCriteria[key] = DeferredUtil.encodeStringForOData(oAdditionalCriteria[key]);
                }
            }
            if(key == "country"){
                if(oAdditionalCriteria[key].trim() == ""){
                    delete oAdditionalCriteria.country;
                }
                if (bIsODataV2) {
                    oAdditionalCriteria[key] = DeferredUtil.encodeStringForOData(oAdditionalCriteria[key]);
                }
            }
            if(key == "useAlternativePermissionType") {
                if(oAdditionalCriteria[key].trim() == ""){
                    delete oAdditionalCriteria.useAlternativePermissionType;
                }
                if(bIsODataV2){
                    oAdditionalCriteria[key] = DeferredUtil.encodeStringForOData(oAdditionalCriteria[key]);
                }
            }
        }
        var urlParams = $.extend({
            'searchValue': bIsODataV2 ? DeferredUtil.encodeStringForOData(searchValue) : searchValue,
            'page': nPageIndex + 1,
            'startIndex': startIndex ? startIndex + 1 : 0
        }, oAdditionalCriteria);
        return DeferredUtil.invokeService($.extend({
            urlParams: urlParams
        }, SEARCH_DEFERRED_SETTINGS_ODATA[oCriteria.oDataServiceKey || DEFAULT_ODATA_SERVICE_KEY])).then(function (oResponse) {
            // Normalize the response, since the oData V4 response is different than the oData V2 response.
            // Convert the data to the format in which we get ajax data: This is to avoid changing the UI mappings
            var oEntity = oResponse.PeopleSearchListEntity = oResponse.PeopleSearchListEntity || {
                items: { results: oResponse.items },
                hasMore: oResponse.hasMore,
                totalCount: oResponse.totalCount
            };
            // Request until we reach an empty page, then we know there aren't any more pages
            var aItems = flattenEmployments(oResponse, sResultScope);
            var bHasMore = false;
            if (aItems && aItems.length > 0) {
                iTotalPersons += aItems.length;
                bHasMore = oEntity.hasMore || iTotalPersons < oEntity.totalCount;
            }
            var maxIndexRef = Math.max.apply(Math, aItems.map(function(item){
                return isNaN(item.indexRef) ? 0 : item.indexRef;
            }));
            return {
                type: SEARCH_TYPE,
                items: aItems,
                totalCount: oEntity.totalCount,
                hasMore: bHasMore,
                more: bHasMore ? function() {
                    return createGACEAutoCompletePromise(oCriteria, nPageIndex + 1, iTotalPersons, maxIndexRef);
                } : null
            };
        });
    }

    /**
     * Flatten the Person Object response from back-end to individual selectable items
     * which convert to the associated SuggestionItem.
     *
     * IMPORTANT:
     * <li>The Person/Employment objects are merged
     * <li>Marked as subItem, with optional firstSubItem and/or lastSubItem
     * <li>subItem means this is a selectable title under a person's photo
     * <li>firstSubItem means this is the first selectable title
     * <li>lastSubItem means this is the last selectable title
     * <li>subItem false means the entire Person is selectable as one item
     *
     * This code was mostly copied from /ui/juic/js/components/SFPersonAutoComplete.js
     * Differences are due to different UI5 coding standards and usage of jQuery
     *
     * @inner
     * @param {Object} oResponse
     *     The back-end response object containing Person Objects
     * @return {Array.<Object>}
     *     An array of item objects
     */
    function flattenEmployments(oResponse, sResultScope) {
        // Copy the array so original oResponse is not modified
        var aItems = Array.prototype.slice.apply(oResponse.PeopleSearchListEntity.items.results);
        for (var x=0; x<aItems.length; x++){
        	if(aItems[x].employments && aItems[x].employments.results){
        		aItems[x].employments = aItems[x].employments.results;
        	}
        }
        // Flatten each employment as separate items in the list
        for (var i = aItems.length - 1; i >= 0; i--) {
            var oItem = aItems[i];
            if (oItem.employments && oItem.employments.length > 1) {
            	//Copy the 'userId' from oData response field assignmentId
            	for(var y=0; y<oItem.employments.length; y++){
            		oItem.employments[y].userId = oItem.employments[y].assignmentId;
            		oItem.employments[y].showIcon = true;
            	}
                var aAddEmployments = oItem.employments.splice(1, oItem.employments.length - 1);
                oItem.firstSubItem = true;
                oItem.subItem = true;
                oItem.userId = oItem.employments[0].assignmentId;
                oItem.primaryEmploymentUserId = oItem.assignmentId;
                for (var j = 0; j < aAddEmployments.length; j++) {
                    var oEmployment = aAddEmployments[j];
                    var oAddItem = $.extend({}, oItem);
                    oAddItem.employments = [ oEmployment ];
                    oAddItem.primaryEmploymentUserId = oAddItem.assignmentId;
                    oAddItem.userId = oEmployment.assignmentId;
                    aItems.splice(i + j + 1, 0, $.extend(oAddItem, {
                        firstSubItem : false,
                        lastSubItem : j == (aAddEmployments.length - 1)
                    }));
                }
            } else if (!oItem.employments || oItem.employments.length == 0) {
                    oItem.subItem = true;
                    oItem.firstSubItem = true;
                    oItem.lastSubItem = true;
                    oItem.userId = oItem.assignmentId;
            } else if (sResultScope == RESULT_SCOPE.EMPLOYMENT) {
                oItem.userId = oItem.employments[0].assignmentId;
                oItem.employments[0].userId = oItem.employments[0].assignmentId;
                oItem.employments[0].showIcon = false;
                oItem.firstSubItem = true;
                oItem.lastSubItem = true;
            }
        }

        aItems.forEach(function(oItem) {
            oItem.personBased = true;
        });

        return aItems;
    }

    /**
     * Create a deferred for the legacy employment-based search query.
     *
     * @inner
     * @param {Object} oCriteria
     * @param {String} oCriteria.searchValue
     * @param {Object} oCriteria.legacySearchCriteria
     *     Additional search criteria to pass along on the jsup request
     */
    function createLegacyAutoCompletePromise(oCriteria) {
        return SearchUtil.search('jsup', $.extend({
            query : oCriteria.searchValue
        }, oCriteria.legacySearchCriteria)).then(convertLegacyResponse);
    }

    /**
     * @inner
     * @param {Object} oItem
     */
    function convertLegacyItem(oItem) {
        return {
            "userId": oItem.UserId,
            "userName": oItem.UserName,
            "name": oItem.FullName,
            "firstName": oItem.FirstName,
            "lastName": oItem.LastName,
            "photoSrc": oItem.photoUrl,
            "legacyItem" : oItem
        };
    }

    /**
     * @inner
     * @param {Object} oResponse
     */
    function convertLegacyResponse(oResponse) {
        var aItems = oResponse.items;
        if (aItems) {
            aItems = aItems.concat();
            for (var i=0; i<aItems.length; i++) {
                var oItem = aItems[i];
                aItems[i] = convertLegacyItem(oItem);
            }
        }
        return $.extend({}, oResponse, {
            items : aItems,
            more : oResponse.more ? function() {
                return oRespose.more().then(convertLegacyResponse);
            } : null
        });
    }

    /**
     * Determine if the new smart suite mode search is enabled for this company.
     *
     * @inner
     * @param {String} sResultScope
     * @return {Boolean}
     *     Returns true if either result scope is Person, or when Smart Suite Mode is active
     */
    function isGACEAutoCompleteSearch(oCriteria) {
        // If the result scope is person, then legacy jsup is not supported
        var oAdditionalCriteria = oCriteria.additionalCriteria || {};
        var sResultScope = oAdditionalCriteria.resultScope;
        if (sResultScope && sResultScope.toUpperCase() == RESULT_SCOPE.PERSON) {
            return true;
        }

        var ignoreFlag = oAdditionalCriteria.enforceIgnoreProvisioningFlags;
        if ((typeof ignoreFlag == 'string' && ignoreFlag.toUpperCase() == 'YES') || ignoreFlag === true) {
            return true;
        }

        // Use the legacy jsup request, unless the setting in pageHeaderJsonData is true or this meta tag is present with true value set explicitly
        var oSettings = window.pageHeaderJsonData && pageHeaderJsonData.settings;
        return (oSettings && oSettings["autocomplete.personBased"] === "true") || $('#autocomplete\\.personBased').attr('content') === 'true';
    }

    DeferredUtil.registerODataService({
        baseUrl : '/odata/v2/restricted/',
        serviceGroup : sServiceGroup,
        serviceName : ['PeopleSearchListEntity','PersonSimpleSearchEntity','EmploymentDataEntity','personSimpleSearch']
    });
	DeferredUtil.registerODataService({
		baseUrl: '/odata/v4/PersonSearch.svc/',
		serviceGroup: sServiceGroup,
		serviceName: ['PeopleSearchListEntity', 'PersonSimpleSearchEntity', 'EmploymentDataEntity', 'personSimpleSearch']
	});
    DeferredUtil.finalizeODataRegistry('/odata/v2/restricted/', 'GACESearch');
    DeferredUtil.finalizeODataRegistry('/odata/v4/PersonSearch.svc/', sServiceGroup);

    var DEFAULT_ODATA_SERVICE_KEY = 'oDataV2';
    var SEARCH_DEFERRED_SETTINGS_ODATA = {
		oDataV2: {
			type: 'ODataService',
			serviceName: 'personSimpleSearch',
			serviceGroup: sServiceGroup,
			baseUrl: '/odata/v2/restricted/'
		},
		oDataV4: {
			type: 'ODataService',
			serviceName: 'personSimpleSearch()',
			serviceGroup: sServiceGroup,
			baseUrl: '/odata/v4/PersonSearch.svc/'
		}
    };

    var SEARCH_TYPE = 'Person-Employment-User';
    var RESULT_SCOPE = {
        EMPLOYMENT : 'EMPLOYMENT',
        PERSON : 'PERSON'
    };

    // Register this search type with the SearchUtil
    SearchUtil.register(SEARCH_TYPE, {
        search : function(oCriteria) {
            oCriteria = oCriteria || {};
            /*
             * Switch between the newer person search and the legacy employment search
             * depending on whether or not smart suite mode is enabled.
             */
            if (isGACEAutoCompleteSearch(oCriteria)) {
                return createGACEAutoCompletePromise(oCriteria, 0);
            } else {
                var sSearchType = oCriteria.legacySearchType;
                if (sSearchType == 'People') {
                    $.sap.require('sap.sf.surj.shell.util.PeopleSearchUtil');
                    return SearchUtil.search(sSearchType, $.extend({
                        keys: ['TITLE']
                    }, oCriteria));
                } else if (sSearchType == 'FOPeople') {
                    $.sap.require('sap.sf.surj.shell.util.FOPeopleSearchUtil');
                    return SearchUtil.search(sSearchType, $.extend({
                        keys: ['TITLE']
                    }, oCriteria));
                } else {
                    return createLegacyAutoCompletePromise(oCriteria);
                }
            }
        }
    });
    var GACESearchUtil = {
        flattenEmployments : flattenEmployments,
        isGACEAutoCompleteSearch : isGACEAutoCompleteSearch
    };

    $.sap.setObject('sap.sf.surj.shell.util.GACESearchUtil', GACESearchUtil);
    return GACESearchUtil;

});
