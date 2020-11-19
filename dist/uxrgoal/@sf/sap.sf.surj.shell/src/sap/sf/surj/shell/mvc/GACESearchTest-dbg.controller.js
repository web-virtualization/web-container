(function($) {
    function prettify(json) {
        return JSON.stringify(json, null, 4);
    }
    function parse(string) {
        try {
            return JSON.parse(string);
        } catch(e) {
            return null;
        }
    }
    sap.ui.controller('sap.sf.surj.shell.mvc.GACESearchTest', {
        onInit : function() {
             // TODO: Replace with a sapui5 date formatter
            $.sap.require('sap.ui.core.format.DateFormat');
            var ISO8601Dateformatter = sap.ui.core.format.DateFormat.getDateInstance({
                pattern : 'yyyy-MM-dd'
            });
            var oModel = this.oModel =  new sap.ui.model.json.JSONModel({
                smartSuiteMode : true,
                useQuickcardSearch : false,
                ajaxServiceHasError : false,
                odataServiceHasError : false,
                ajaxServiceSuggestions : [{
					key: "quickcardController.searchPersonAdvanced",
					value: {
						serviceName: 'quickcardController',
						serviceMethod: 'searchPersonAdvanced',
						arguments: [
							{
								"searchParameters":
									[
										{
											"key": "FIRST_NAME",
											"ids": null,
											"values": ["carla", "admin", "vlad4"]
										},

										{
											"key": "LAST_NAME",
											"ids": null,
											"values": ["carla", "grant", "user"]
										}
									],
								"resultScope": "Person",
								"includeInactiveUsers": "YES",
								"includeInactivePersons": "YES",
								"includeExternalPersons": "YES",
								"includeHomeEmpl": "YES",
								"includeSecondEmpl": "YES",
								"matchType": "S",
								"page": 1
							}
						]
					}
				}, {
                    key : "quickcardController.getRenderingInfoPersonAdvancedSearch",
                    value : {
                        serviceName : 'quickcardController',
                        serviceMethod : 'getRenderingInfoPersonAdvancedSearch',
                        arguments : [[
                            "FIRST_NAME",
                            "LAST_NAME",
                            "USER_NAME",
                            "DEPARTMENT",
                            "LOCATION",
                            "USER_ROLE",
                            "RBP_ROLES"
                        ]]
                    }
                }, {
                    key : "foundationAutoCompleteController.search",
                    value : {
                        serviceName : "foundationAutoCompleteController",
                        serviceMethod : "search",
                        arguments : [
                            {
                                "baseElement": "jobInfo",
                                "searchType": "location",
                                "hrisElementField": "jobinfo-location",
                                "applyTC": "FALSE",
                                "target": "FoundationObject",    
                                "contextualSearchFields" : {
                                  "jobInfo-company" : "7",
                                  "start-date" : "2017-02-09"
                                }
                            }
                        ]
                    }
                }, {
                    key : "customFieldAsGOAutoCompleteController.search",
                    value : {
                        serviceName : "customFieldAsGOAutoCompleteController",
                        serviceMethod : "search",
                        arguments : [
                            {
                                "baseElement": "jobInfo",
                                "searchType": "Department",
                                "hrisElementField": "jobInfo-department",
                                "applyTC": "FALSE",
                                "target": "GenericObject",
                                "contextualSearchFields" : {
                                  "jobInfo-division" : "4",
                                  "start-date" : "2017-02-09"
                                }
                            }
                        ]
                    }
                }],
                odataServiceSuggestions : [{
					key: "oDataV2",
					label: "oData V2",
                    value : {
                        serviceName: 'personSimpleSearch',
                        baseUrl : '/odata/v2/restricted/',
                        urlParams : {
							"$format": "'json'",
							searchValue: "'cgrant'",
							page: 1,
							startIndex: 0,
							includeInactiveEmpl: false,
							includeInactivePersons: true,
							resultScope: "Employment",
							employmentEffectiveFrom: "'2020-02-19'",
							employmentEffectiveTo: "'2020-02-19'",
							includeSecondEmpl: true,
							includeECMasteredUsersOnly: false,
							enforceIgnoreProvisioningFlags: true,
							includeContingentWorkers: true,
							displayContingentWorkersInformation: true,
							includeExternalUsers: false,
							includeExternalPersonType: "''",
							includeHomeAssignment: true,
							includeLocationInfoPerEmpl: false,
							dynamicGroupId: "''",
							useAlternativePermissionType: "''"
						}
					}
				}, {
					key: "oDataV4",
					label: "oData V4",
					value: {
						serviceName: 'personSimpleSearch()',
						baseUrl: '/odata/v4/PersonSearch.svc/',
						urlParams: {
							"$format": "json",
							searchValue: "cgrant",
							page: 1,
							startIndex: 0,
							includeInactiveEmpl: false,
							includeInactivePersons: true,
							resultScope: "Employment",
							employmentEffectiveFrom: "2020-02-19",
							employmentEffectiveTo: "2020-02-19",
							includeSecondEmpl: true,
							includeECMasteredUsersOnly: false,
							enforceIgnoreProvisioningFlags: true,
							includeContingentWorkers: true,
							displayContingentWorkersInformation: true,
							includeExternalUsers: false,
							includeExternalPersonType: "",
							includeHomeAssignment: true,
							includeLocationInfoPerEmpl: false,
							dynamicGroupId: "",
							useAlternativePermissionType: ""
						}
					}
                }],
                settings : {
					oDataServiceKey: "oDataV2",
                    additionalCriteria : {
                        includeInactiveEmpl : "NO",
                        includeInactivePersons : "YES",
                        includeExternalPersons : "NO",
                        includeExternalPersonType : "",
                        resultScope : "Employment",
                        employmentEffectiveFrom : ISO8601Dateformatter.format(new Date()),
                        employmentEffectiveTo : ISO8601Dateformatter.format(new Date()),
                        includeHomeEmpl : "YES",
                        includeSecondEmpl : "YES",
                        displayLocation : "YES",
                        includeECMasteredUsersOnly:"NO",
                        enforceIgnoreProvisioningFlags : "YES",
                        dynamicGroupId : "",
                        useAlternativePermissionType : "",
                        includeContingentWorkers : "YES",
                        displayContingentWorkersInformation  :  "YES"
                    },
                    legacySearchCriteria : {
                        findtype : 'fullname',
                        maxresults : 10,
                        hideusername : false,
                        includeInactive : false,
                        includeExternalUsers : false,
                        includeExternalUsersNonMtr : false,
                        adminPage : false,
                        groupId : 0
                    },
                    fieldIds : [ "FIRST_NAME",
                                 "MIDDLE_NAME",
                                 "LAST_NAME",
                                 "PERSON_ID_EXTERNAL", 
                                 "USER_NAME", 
                                 "DEPARTMENT", 
                                 "LOCATION", 
                                 "DIVISION", 
                                 "USER_ROLE", 
                                 "RBP_ROLES", 
                                 "JOB_CODE", 
                                 "NATIONAL_ID",
                                 "PREFERRED_NAME",
                                 "FORMAL_NAME",
                                 "EMAIL",
                                 "HIRE_DATE"
                               ]
                }
            });

            var suggest = oModel.getProperty('/ajaxServiceSuggestions');
            $.each(suggest, function(i) {
                oModel.setProperty('/ajaxServiceSuggestions/'+i+'/value/arguments-text', prettify(this.value.arguments));
            });
            oModel.setProperty('/ajaxService', $.extend({}, suggest[0].value));
            suggest = oModel.getProperty('/odataServiceSuggestions');
            $.each(suggest, function(i) {
                oModel.setProperty('/odataServiceSuggestions/'+i+'/value/urlParams-text', prettify(this.value.urlParams));
            });
            this.selectODataService();
            oModel.setProperty('/additionalCriteria', prettify(oModel.getProperty('/settings/additionalCriteria')));
            oModel.setProperty('/legacySearchCriteria', prettify(oModel.getProperty('/settings/legacySearchCriteria')));
            oModel.setProperty('/fieldIds', prettify(oModel.getProperty('/settings/fieldIds')));
            this.getView().setModel(oModel);

            this.updateSmartSuiteMode();
        },

		/**
		 * Selects the oData service version to use based on the key in the settings.
		 */
		selectODataService: function() {
			var oModel = this.oModel;
			var suggest = oModel.getProperty('/odataServiceSuggestions');
			var sDataServiceKey = oModel.getProperty('/settings/oDataServiceKey');
			var oDataItem = suggest.find(function(item) {
				return item.key === sDataServiceKey;
			});
			oModel.setProperty('/odataService', $.extend({}, oDataItem.value));
		},

		/**
		 * Handles selection chnages between the oData versions
		 * @param {Object} oEvent 
		 */
		onDataServiceSelectionChange: function(oEvent) {
			this.oModel.setProperty('/settings/oDataServiceKey', oEvent.getSource().getSelectedKey());
			this.selectODataService();
		},

        changeAjaxSuggest : function(oEvent) {
            var value = oEvent.getParameter('selectedItem').getBindingContext().getObject().value;
            var oModel = this.getView().getModel();
            oModel.setProperty('/ajaxService', $.extend({}, value));
        },

        changeOdataSuggest : function(oEvent) {
            var value = oEvent.getParameter('selectedItem').getBindingContext().getObject().value;
            var oModel = this.getView().getModel();
            oModel.setProperty('/odataService', $.extend({}, value));
        },

        updateUseQuickcardSearch : function() {
            var oModel = this.getView().getModel();
            var useQuickcardSearch = oModel.getProperty('/useQuickcardSearch');
            var oSettings = oModel.getProperty('/settings');
            oSettings.legacySearchType = useQuickcardSearch ? 'People' : null;
            oModel.setProperty('/settings', oSettings);
        },

        invokeAjaxService : function() {
            try {
            	var that = this;
                var oModel = this.getView().getModel();
                sap.sf.surj.shell.util.DeferredUtil.invokeService({
                    type : 'ajaxService',
                    serviceName : oModel.getProperty('/ajaxService/serviceName'),
                    serviceMethod : oModel.getProperty('/ajaxService/serviceMethod'),
                    arguments : oModel.getProperty('/ajaxService/arguments')
                }).done(function(oResponse) {
                	that.serviceLog('/service-log', 'Response: ', oResponse);
                }).fail(function(sMsg, oErr) {
                	that.serviceLog('/service-log', 'Ajax Error: ', sMsg);
                });
            } catch(e) {
                surj.Logger.error(e);
                this.serviceLog('/service-log', 'Exception: ', e.message);
            }
        },

        invokeOdataService : function() {
            try {
                var that = this;
                var oModel = this.getView().getModel();
                sap.sf.surj.shell.util.DeferredUtil.invokeService({
                    type : 'ODataService',
                    serviceName : oModel.getProperty('/odataService/serviceName'),
                    baseUrl : oModel.getProperty('/odataService/baseUrl'),
                    urlParams : oModel.getProperty('/odataService/urlParams')
                }).done(function(oResponse) {
                    that.serviceLog('/odataservice-log', 'Response: ', oResponse);
                }).fail(function(sMsg, oErr) {
                    that.serviceLog('/odataservice-log', 'Ajax Error: ', sMsg);
                });
            } catch(e) {
                surj.Logger.error(e);
                this.serviceLog('/odataservice-log', 'Exception: ', e.message);
            }
        },

        readUrlParams : function() {
            var oModel = this.getView().getModel();
            var oUrlParams = parse(oModel.getProperty('/odataService/urlParams-text'));
            if (oUrlParams) {
                oModel.setProperty('/odataServiceHasError', false);
                oModel.setProperty('/odataService/urlParams', oUrlParams);
            } else {
                oModel.setProperty('/odataServiceErrorMessage', 'Invalid JSON Format');
                oModel.setProperty('/odataServiceHasError', true);
            }
        },

        readCriteriaText : function() {
            var oModel = this.getView().getModel();
            var oAdditionalCriteria = parse(oModel.getProperty('/additionalCriteria'));
            var oLegacySearchCriteria = parse(oModel.getProperty('/legacySearchCriteria'));
            var oFieldIds = parse(oModel.getProperty('/fieldIds'));
            var oSettings = oModel.getProperty('/settings');
            if (oAdditionalCriteria) {
                oSettings.additionalCriteria = oAdditionalCriteria;
            }
            if (oLegacySearchCriteria) {
                oSettings.legacySearchCriteria = oLegacySearchCriteria;
            }
            if (oFieldIds) {
            	oSettings.fieldIds = oFieldIds;
            }
            oModel.setProperty('/settings', oSettings);
        },

        updateSmartSuiteMode : function() {
            var oModel = this.getView().getModel();
            var globalSetting = jQuery('#autocomplete\\.personBased');
            if (!globalSetting.length) {
                globalSetting = jQuery('<meta id="autocomplete.personBased" content="">').appendTo('head');
            }
            globalSetting.attr('content', oModel.getProperty('/smartSuiteMode') ? 'true' : 'false');
        },

        updateArguments : function() {
            var oModel = this.getView().getModel();
            var aArguments = parse(oModel.getProperty('/ajaxService/arguments-text'));
            if (aArguments) {
                oModel.setProperty('/ajaxService/arguments', aArguments);
                oModel.setProperty('/ajaxServiceHasError', false);
            } else {
                oModel.setProperty('/ajaxServiceErrorMessage', 'Invalid JSON Format');
                oModel.setProperty('/ajaxServiceHasError', true);
            }
        },

        itemSelected : function(e) {
            this.serviceLog('/event-log', 'itemSelected: ', e.getParameter('selectedItem'));
        },

        serviceLog : function(sPath, sPrefix, oMessage) {
            var oModel = this.getView().getModel();
            var sValue = oModel.getProperty(sPath) || '';
            if (sValue) {
                sValue += '\n';
            }
            sValue += sPrefix + prettify(oMessage);
            oModel.setProperty(sPath, sValue);
        },

        advancedSearch : function(oEvent) {
        	var oModel = this.getView().getModel();
            var oAdditionalCriteria = parse(oModel.getProperty('/additionalCriteria'));
            var oFieldIds = parse(oModel.getProperty('/fieldIds'));
            $.sap.require('sap.sf.surj.shell.util.GACEAdvancedSearchUtil');
            sap.sf.surj.shell.util.GACEAdvancedSearchUtil.show({
                oDataServiceKey: oModel.getProperty('/settings/oDataServiceKey'),
                source : oEvent.getSource(),
                additionalCriteria : oAdditionalCriteria,
                fieldIds : oFieldIds
            });
        }
    })
})(jQuery);