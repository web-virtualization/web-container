
sap.ui.define('sap/sf/surj/shell/util/GACEAdvancedSearchUtil', [
        'jquery.sap.global',
        'sap/sf/surj/shell/util/DeferredUtil',
        'sap/sf/surj/shell/util/SearchUtil',
        'sap/m/MessageBox',
        '../library'
    ], function($, DeferredUtil, SearchUtil, MessageBox) {
    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');

    var SEARCH_ODATA_SERVICES = {
        oDataV2: {
            initializer: {
                type: 'ODataService',
                method: 'POST',
                serviceName: 'advancedSearchGetRenderingInformation',
                baseUrl: '/odata/v2/restricted/'
            },
            searchField : {
                type : 'ODataService',
                method: 'POST',
                serviceName : 'advancedSearchFieldDataProvider',
                baseUrl: '/odata/v2/restricted/'
            },
            searchResult :{
                type : 'ODataService',
                method: 'POST',
                serviceName : 'advancedSearchFindPersons',
                baseUrl: '/odata/v2/restricted/'
            }
        },
        oDataV4: {
            initializer: {
                type: 'ODataService',
                method: 'POST',
                serviceName: 'advancedSearchGetRenderingInformation',
                baseUrl: '/odata/v4/PersonSearch.svc/'
            },
            searchField : {
                type : 'ODataService',
                method: 'POST',
                serviceName : 'advancedSearchFieldDataProvider',
                baseUrl: '/odata/v4/PersonSearch.svc/'
            },
            searchResult :{
                type : 'ODataService',
                method: 'POST',
                serviceName : 'advancedSearchFindPersons',
                baseUrl: '/odata/v4/PersonSearch.svc/'
            }
        }
    };
    var DEFAULT_ODATA_SERVICE_KEY = 'oDataV2';

    /**
     * @inner
     * @return {Promise.<Object>}
     */
    function createSearchFieldPromise(oCriteria, iPageIndex, iTotalResults) {
        var oBindingContext = oCriteria.bindingContext;
        var oField = oBindingContext.getObject();
        var oModel= oBindingContext.getModel();
        var oDataVersion = oModel.getProperty('/oDataServiceKey') || DEFAULT_ODATA_SERVICE_KEY;
        var oContextualFields = new sap.ui.model.json.JSONModel();
        var parentFields = oField.parentFields;
        if (parentFields && parentFields.length > 0){
            for(var j=0; j<parentFields.length; j++){
                var oData=oModel.getProperty('/selectedFieldValues/'+parentFields[j]);
                var tempProperty="/"+parentFields[j];
                if (oData && oData.code){
                    oContextualFields.setProperty(tempProperty,oData.id);
                }
            }
        }
        var pageNumber = iPageIndex + 1;        
        var requestCriteria = {
            "searchField": oField.field,
            "searchText": oCriteria.searchValue,
            "parentValues" : oContextualFields.oData,
            "pageNumber" : pageNumber
        };

        if (requestCriteria.parentValues && oDataVersion !== DEFAULT_ODATA_SERVICE_KEY) {
            // Apply the correct format for all 'parentValues' items, if the request uses the oData V4 API version 
            requestCriteria.parentValues = Object.keys(requestCriteria.parentValues).reduce(function(arr, key) {
                arr.push({ key: key, value: requestCriteria.parentValues[key] });
                return arr;
            }, []);
        }
        iTotalResults = iTotalResults || 0;
        //oData call:
        var searchFieldData = $.extend({data : requestCriteria}, SEARCH_ODATA_SERVICES[oDataVersion].searchField);
    	return DeferredUtil.invokeService(searchFieldData).then(function(oResponse) {
            var aItems;
            var bHasMore = false;
            var iTotalNumberOfRecords;

            // Normalize the response, since the oData V4 response is different than the oData V2 response.
            // Convert the data to the format in which we get ajax data: This is to avoid changing the UI mappings
            if(oDataVersion === DEFAULT_ODATA_SERVICE_KEY) {
                aItems = oResponse.AdvancedSearchFieldResponse.results.results;
                iTotalNumberOfRecords = oResponse.AdvancedSearchFieldResponse.totalNumberOfRecords;
            } else {
                aItems = oResponse.results;
                iTotalNumberOfRecords = oResponse.totalNumberOfRecords;
            }
            if (aItems && aItems.length > 0) {
                iTotalResults += aItems.length;
                bHasMore = iTotalResults < iTotalNumberOfRecords;
            }
            var result = {
                items: aItems, 
                hasMore : bHasMore,
                more : bHasMore ? function() {
                    return createSearchFieldPromise(oCriteria, iPageIndex + 1, iTotalResults);
                } : null 
            };
            return result;
    	});
    }
    
    function createAdvancedSearchPromise(oCriteria, iPageIndex, iTotalPersons, iStartIndex) {
        var requestCriteria = $.extend({ page: iPageIndex + 1, startIndex: parseInt(iStartIndex) || 0 }, oCriteria);
        var oDataVersion = oCriteria.oDataVersion || DEFAULT_ODATA_SERVICE_KEY;

        // remove the 'oDataVersion' from the criteria, since it is not needed for the request
        delete requestCriteria.oDataVersion;
        iTotalPersons = iTotalPersons || 0;
        for (var key in requestCriteria) {
        	var requestCriteriaStr = requestCriteria[key].toString();
            if (requestCriteriaStr.toUpperCase() == "YES") {
            	requestCriteria[key] = true;
            } else if (requestCriteriaStr.toUpperCase() == "NO") {
            	requestCriteria[key] = false;
            }
            if(key == "displayLocation"){
            	requestCriteria.includeLocationInfoPerEmpl = requestCriteria[key];
            	delete requestCriteria.displayLocation;
            }
            if(key == "includeHomeEmpl"){
            	requestCriteria.includeHomeAssignment = requestCriteria[key];
            	delete requestCriteria.includeHomeEmpl;
            }
            if(key == "includeExternalPersons"){
            	requestCriteria.includeExternalUsers = requestCriteria[key];
            	delete requestCriteria.includeExternalPersons;
            }
            if(key == "includeExternalPersonType"){
            	if(requestCriteria[key].trim() == ""){
            		delete requestCriteria.includeExternalPersonType;
            	}
            }
            if(key == "dynamicGroupId"){
            	if(requestCriteria[key].trim() == ""){
            		delete requestCriteria.dynamicGroupId;
            	}
            }
        }
        var searchParamsData = $.extend({ data: requestCriteria }, SEARCH_ODATA_SERVICES[oDataVersion].searchResult);

        if(oDataVersion !== DEFAULT_ODATA_SERVICE_KEY) {
            // For oData V4 requests the 'ids' values of each 'searchParam' should be strings (not integers, as for the oData V2 requests)
            var aSearchParameters = searchParamsData.data && searchParamsData.data.searchParameters;
            if(aSearchParameters) {
                for(var i = 0, j, oItem; i < aSearchParameters.length; i++) {
                    oItem = aSearchParameters[i];
                    if(oItem && oItem.ids instanceof Array) {
                        for(j = 0; j < oItem.ids.length; j++) {
                            oItem.ids[j] = '' + oItem.ids[j];
                        }
                    }
                }
            }
        }

        var oDataPromise = DeferredUtil.invokeService(searchParamsData).then(function(oResponse) {
            var aColumnVisibility;
            var iTotalCount;
            var aItems;
        	var bHasMore = false;

            // Normalize the response, since the oData V4 response is different than the oData V2 response.
            // Convert the data to the format in which we get ajax data: This is to avoid changing the UI mappings
            if(oDataVersion === DEFAULT_ODATA_SERVICE_KEY) {
                aColumnVisibility = oResponse.PeopleSearchListEntity.columnVisiblity.results;
                aItems = oResponse.PeopleSearchListEntity.items.results;
                iTotalCount = parseInt(oResponse.PeopleSearchListEntity.totalCount) || 0;
                bHasMore = oResponse.PeopleSearchListEntity.hasMore;
            } else {
                aColumnVisibility = oResponse.columnVisiblity;
                aItems = oResponse.items;
                iTotalCount = parseInt(oResponse.totalCount) || 0;
                bHasMore = oResponse.hasMore;
            }
        	for (var x=0; x<aItems.length; x++){
            	if(aItems[x].employments && aItems[x].employments.results){
            		aItems[x].employments = aItems[x].employments.results;
            	}        	
            }
            if (aItems && aItems.length > 0) {
                iTotalPersons += aItems.length;
                (typeof bHasMore === 'boolean') || (bHasMore = iTotalPersons < iTotalCount);
            }
            var iMaxIndexRef = Math.max.apply(Math, aItems.map(function(oItem){
                return isNaN(oItem.indexRef) ? 0 : oItem.indexRef;
            }));        
            var result = {
            	columnVisibility: aColumnVisibility,	
                items: aItems,
                hasMore : bHasMore,
                more : bHasMore ? function() {
                    return createAdvancedSearchPromise(oCriteria, iPageIndex + 1, iTotalPersons, iMaxIndexRef + 1);
                } : null
            };
            return result;
        });
        
        showLoading(oDataPromise);
        return oDataPromise;
    }

    /**
     * Request Advanced Search Rendering info
     * @return {Promise}
     */
    function getInitializer(oSettings) { 
        var oDataVersion = oSettings.oDataServiceKey || DEFAULT_ODATA_SERVICE_KEY;
    	//Odata call test
        var oRequest = {
            data : { activeFields: oSettings && oSettings.fieldIds || [] }
        };

        if(oDataVersion === DEFAULT_ODATA_SERVICE_KEY) {
            oRequest.additionalCriteria = oSettings && oSettings.additionalCriteria || [];
        }
        oRequest = $.extend(oRequest, SEARCH_ODATA_SERVICES[oDataVersion].initializer);
    	return DeferredUtil.invokeService(oRequest).then(function(fields) {
            // Normalize the response, since the oData V4 response is different than the oData V2 response.
            // Convert the data to the format in which we get ajax data: This is to avoid changing the UI mappings
            if(oDataVersion === DEFAULT_ODATA_SERVICE_KEY) {
                for(var j = 0; j < fields.length; j++){
                    fields[j].childFields = fields[j].childFields.results;
                    fields[j].parentFields = fields[j].parentFields.results;
                    fields[j].fieldListValue = fields[j].fieldListValue && fields[j].fieldListValue.results ? fields[j].fieldListValue.results : fields[j].fieldListValue;
                    fields[j].fieldListValueLabel = fields[j].fieldListValueLabel && fields[j].fieldListValueLabel.results ? fields[j].fieldListValueLabel.results : fields[j].fieldListValueLabel;
                }    
            } else  {
                fields = fields.value;
                for(var j = 0; j < fields.length; j++){
                    fields[j].fieldListValue = fields[j].fieldListValue && fields[j].fieldListValue.results ? fields[j].fieldListValue.results : fields[j].fieldListValue;
                    fields[j].fieldListValueLabel = fields[j].fieldListValueLabel && fields[j].fieldListValueLabel.results ? fields[j].fieldListValueLabel.results : fields[j].fieldListValueLabel;
                }    
            }
    		//Split the fields to regular & advancedFields sections
    		var advancedFields = [];
            for (var i = fields.length-1; i>=0; i--) {
                var field = fields[i];
                if (field.isOptionalParameter === "true") {
                    fields.splice(i, 1);
                    advancedFields.splice(0, 0, field);
                } 
            }

            for(var y=0; y<advancedFields.length; y++){
            	advancedFields[y].visible = (advancedFields[y].selectedValue) ? false : true;
            }
            return {
            	Fields : fields,
            	AdvancedFields : advancedFields
            };
    	});
    }

    /**
     * @inner
     * @return {Promise.<sap.ui.model.json.JSONModel>}
     */
    function getModel(oSettings) {
        return getInitializer(oSettings).then(function(oData) {
            return new sap.ui.model.json.JSONModel($.extend({
                view : 'searchFields',
                expandAdvanced : false,
                selectedFieldValues : {},
                textSearchFieldValue: {},
            }, oSettings || {}, oData));
        });
    }

    /**
     * @inner
     * @param {Object} oPromise
     */
    function showLoading(oPromise) {
    	var oBusyDialog;
    	oPromise.done(function() {
    	    if (oBusyDialog != null) {
    	        oBusyDialog.close();
    	    }
    	});
    	oPromise.fail(function(sErr, jqXHR) {
    		oBusyDialog && oBusyDialog.close();
    		var errorMessage = $.sap.getObject('responseJSON.error.message.value', true, jqXHR) || rb.getText('COMMON_AJAX_DEFAULT_ERROR');
    		MessageBox.error(errorMessage, {
                icon: sap.m.MessageBox.Icon.ERROR
            });
    	});
        setTimeout(function() {
            if (oPromise.state() == 'pending') {
                $.sap.require('sap.m.BusyDialog');
                oBusyDialog = new sap.m.BusyDialog();
                oBusyDialog.open();
            }
        }, 100);
    }

    // Register the search for the SearchField searches
    SearchUtil.register("GACESearchField", {
        search : function(oCriteria) {
            return createSearchFieldPromise(oCriteria, 0);
        }
    });
    
    // Register the search for the SearchField searches
    SearchUtil.register("GACEAdvancedSearch", {
        search : function(oCriteria) {
            return createAdvancedSearchPromise(oCriteria, 0);
        }
    });

    var GACEAdvancedSearchUtil = {
            show: function(oSettings) {
                return new Promise(function(res, rej) {
                    var oModelPromise = getModel(oSettings);
                    showLoading(oModelPromise);
                    oModelPromise.then(function(oModel) {
                        try {
                            var oController = sap.ui.controller('sap.sf.surj.shell.mvc.GACEAdvancedSearch');
                            var oDialog = new sap.m.Dialog({
                                contentWidth: '85%',
                                contentHeight: '500px',
                                resizable: true,
                                draggable: true,
                                models: oModel,
                                title: rb.getText('COMMON_Find_Employee'),
                                verticalScrolling: true,
                                afterOpen: function() {
                                    res(oDialog);
                                },
                                afterClose: function() {
                                    oDialog.destroy();
                                },
                                customHeader: new sap.m.Bar({
                                    contentLeft: new sap.m.Button({
                                        icon: 'sap-icon://nav-back',
                                        tooltip: rb.getText('COMMON_Back'),
                                        visible: {
                                            parts: [{
                                                path: '/view'
                                            }],
                                            formatter: function(sView) {
                                                return sView !== 'searchFields';
                                            }
                                        },
                                        press: [oController.back, oController]
                                    }),
                                    contentMiddle: new sap.m.Text({
                                        text: rb.getText('COMMON_Find_Employee')
                                    })
                                }),
                                content: sap.ui.view({
                                    type: 'JS',
                                    height: '100%',
                                    controller: oController,
                                    viewName: 'sap.sf.surj.shell.mvc.GACEAdvancedSearch'
                                })
                            }).removeStyleClass('sapUiPopupWithPadding').addStyleClass('surjAdvSearchDialog').open();
                        } catch(e) {
                            $.sap.log.error('Exception creating dialog', e);
                            rej(e);
                        }
                    });
                });
            },
            createAdvancedSearchPromise: createAdvancedSearchPromise,
            getModel : getModel
        };

    $.sap.setObject('sap.sf.surj.shell.util.GACEAdvancedSearchUtil', GACEAdvancedSearchUtil);
    return GACEAdvancedSearchUtil;
});