sap.ui.define(
    [
        'sap/ui/thirdparty/jquery', 
        'sap/sf/surj/shell/util/DeferredUtil',
        'sap/base/Log',
        'sap/ui/model/resource/ResourceModel'
    ], function($, DeferredUtil, Log, ResourceModel) {
    'use strict';
    var OdataV4Util = function(){};
    
    // ========================================
    //  API to get libraries
    // ========================================
    
    OdataV4Util.GetLibraries = function(inputParam, oDeferred){
    	var requestObject = {
                type: "ODataService",
                baseUrl: "/odata/v4",
                serviceName: "/JpbAdoptionOdataService.svc",
                method: "POST",
                data: {
                    competencyIds: inputParam.filterByCompetencyDetails.competencyIds,
                    behaviorIds: inputParam.filterByCompetencyDetails.behaviorIds,
                    libraryCategoryMap: inputParam.filterByCompetencyDetails.libraryCategoryMap,
                    locale: inputParam.filterByCompetencyDetails.locale,
                    useBehavior: inputParam.useBehavior,
                    selectionByCoreCompetency: inputParam.selectionByCoreCompetency
                },
                servicePath: "/getLibraryNameAndFilterAction"
            };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse){
                var libraries = [];
                var filterIds = [];
                if(odataResponse.libraryNames && odataResponse.libraryNames.length > 0){
                	odataResponse.libraryNames.forEach(function(library){
                        libraries.push({
                          text: library,
                          icon: "sap-icon://course-book",
                          nodes: [{}]
                        });	
					});
				};
               odataResponse.libraryNames = libraries;
               odataResponse.filterIds = odataResponse.filterIds;
               oDeferred.resolve(odataResponse);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };
    
    OdataV4Util.GetFamilies = function(inputParam, oDeferred, filterIds){
    	var requestObject = {
                type: "ODataService",
                baseUrl: "/odata/v4",
                serviceName: "/JpbAdoptionOdataService.svc",
                method: "POST",
                data: {
                	filterIds: filterIds,
                    useBehavior: inputParam.useBehavior,
                    selectionByCoreCompetency: inputParam.selectionByCoreCompetency
                },
                servicePath: "/getFamilyNamesAction"
            };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse){
                var families = [];
                if(odataResponse && odataResponse.value && odataResponse.value.length > 0){
                	odataResponse.value.forEach(function(family){
                		families.push({
                          text: family,
                          icon: "sap-icon://course-book",
                          nodes: [{}]
                        });	
					});
				};
               oDeferred.resolve(families);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };

    // ========================================
    //  API to get competencies which are already 
    //  -- selected by the user
    // ========================================
    OdataV4Util.GetSelectedCompetencies = function(inputParam, oDeferred){
        var requestObject = {
            type: "ODataService",
            baseUrl: "/odata/v4",
            serviceName: "/JpbAdoptionOdataService.svc",
            method: "POST",
            data: {
                competencyIds: inputParam.selectedIds
            },
            servicePath: "/getCompetencyDetailsByIdsAction"
        };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse && odataResponse.value && odataResponse.value.length > 0){
                var selectedCompetencies = [];
                if(!inputParam.useBehavior){
                    odataResponse.value.forEach(function(competency){
                        selectedCompetencies.push({
                            "name": competency.competencyName,
                            "internalId": competency.competencyInternalId,
                            "compSelected": true
                          })
                    });
                }
                oDeferred.resolve(selectedCompetencies);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };

// ========================================
    //  API to get behaviors which are already 
    //  -- selected by the user
    // ========================================
    OdataV4Util.GetSelectedBehaviors = function(inputParam, oDeferred){
        var requestObject = {
            type: "ODataService",
            baseUrl: "/odata/v4",
            serviceName: "/JpbAdoptionOdataService.svc",
            method: "POST",
            data: {
                behaviorIds: inputParam.selectedIds
            },
            servicePath: "/getBehaviorDetailsByIdsAction"
        };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse && odataResponse.value && odataResponse.value.length > 0){
                var selectedBehaviors = [];
                if(inputParam.useBehavior){
                    odataResponse.value.forEach(function(behavior){
                        selectedBehaviors.push({
                            "name": behavior.behaviorName,
                            "internalId": behavior.behaviorInternalId,
                            "compSelected": true
                          })
                    });
                }
                oDeferred.resolve(selectedBehaviors);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };

    // ========================================
    //  API to get categories
    // ========================================

    OdataV4Util.GetCategories = function(inputParam, oDeferred, sName, filterIds){
        var requestObject = {
            type: "ODataService",
            baseUrl: "/odata/v4",
            serviceName: "/JpbAdoptionOdataService.svc",
            method: "POST",
            data: {
                filterIds: filterIds,
                libraryName: sName,
                useBehavior: inputParam.useBehavior,
                selectionByCoreCompetency: inputParam.selectionByCoreCompetency
            },
            servicePath: "/getCategoryByLibraryAndFilterAction"
        };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse && odataResponse.value && odataResponse.value.length > 0){
                var aCategories = [];
                odataResponse.value.forEach(function(categoryName){
                aCategories.push({
                    "libraryName": sName,
                    "text": categoryName,
                    "nodes":[{}]
                    });
                });
                oDeferred.resolve(aCategories);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };
    
    // ========================================
    //  API to get roles
    // ========================================

    OdataV4Util.GetRoles = function(inputParam, oDeferred, filterIds, sName){
        var requestObject = {
            type: "ODataService",
            baseUrl: "/odata/v4",
            serviceName: "/JpbAdoptionOdataService.svc",
            method: "POST",
            data: {
            	familyName: sName,
            	filterIds: filterIds,
                useBehavior: inputParam.useBehavior,
                selectionByCoreCompetency: inputParam.selectionByCoreCompetency
            },
            servicePath: "/getRoleNamesAction"
        };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse && odataResponse.value && odataResponse.value.length > 0){
                var aRoles = [];
                odataResponse.value.forEach(function(role){
                	aRoles.push({
                    "familyName": sName,
                    "text": role.roleName,
                    "roleId": role.roleId,
                    "competencyIds": role.competencyIds,
                    "nodes":[{}]
                    });
                });
                oDeferred.resolve(aRoles);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };
    
    
    // ========================================
    //  API to get Competencies
    // ========================================
    OdataV4Util.GetCompetencies = function(inputParam, oDeferred, sLibraryName, sName, filterIds){
    var requestObject = {
            type: "ODataService",
            baseUrl: "/odata/v4",
            serviceName: "/JpbAdoptionOdataService.svc",
            method: "POST",
            data: {
                filterIds: filterIds,
                libraryName: sLibraryName,
                categoryName: sName,
                useBehavior: inputParam.useBehavior,
                selectionByCoreCompetency: inputParam.selectionByCoreCompetency
            },
            servicePath: "/getCompetencyByLibraryCategoryAndFilterAction"
        };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse && odataResponse.value && odataResponse.value.length > 0){
                var aCompetencies = [];
                
                if(!inputParam.useBehavior){
                    aCompetencies.push({
                        "libraryName": sLibraryName,
                        "categoryName": sName,
                        "count": odataResponse.value.length,
                        "internalId":"selectAllId"
                    });
                    odataResponse.value.forEach(function(competency){
                        aCompetencies.push({
                            "libraryName": sLibraryName,
                            "categoryName": sName,
                            "name": competency.competencyName,
                            "internalId": competency.competencyInternalId
                          })
                    });
                }else{
                    odataResponse.value.forEach(function(competency){
                        aCompetencies.push({
                            "libraryName": sLibraryName,
                            "categoryName": sName,
                            "text": competency.competencyName,
                            "competencyId": competency.competencyInternalId,
                            "nodes":[{}]
                          })
                    });
                }
                
                oDeferred.resolve(aCompetencies);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };

    // ========================================
    //  API to get CompetencyDetailsByIds
    // ========================================
    OdataV4Util.GetCompetencyDetailsByIds = function(inputParam, oDeferred, sFamilyName, sName, filterIds, roleId){
    var requestObject = {
            type: "ODataService",
            baseUrl: "/odata/v4",
            serviceName: "/JpbAdoptionOdataService.svc",
            method: "POST",
            data: {
                roleId: roleId,
                filterIds: filterIds,
                useBehavior: inputParam.useBehavior,
                selectionByCoreCompetency: inputParam.selectionByCoreCompetency
            },
            servicePath: "/getCompetencyByIdAndFilterAction"
        };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse && odataResponse.value && odataResponse.value.length > 0){
                var aCompetencies = [];
		if(!inputParam.useBehavior){
            aCompetencies.push({
                "familyName": sFamilyName,
                "roleName": sName,
                "count": odataResponse.value.length,
                "internalId":"selectAllId"
            });
                    odataResponse.value.forEach(function(competency){
                        aCompetencies.push({
                            "familyName": sFamilyName,
                            "roleName": sName,
                            "roleId": roleId,
                            "name": competency.competencyName,
                            "internalId": competency.competencyInternalId
                          })
                    });
                }else{
                    odataResponse.value.forEach(function(competency){
                        aCompetencies.push({
                            "familyName": sFamilyName,
                            "roleName": sName,
                            "roleId": roleId,
                            "text": competency.competencyName,
                            "competencyId": competency.competencyInternalId,
                            "nodes":[{}]
                          })
                    });
                }
                oDeferred.resolve(aCompetencies);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };

    // ========================================
    //  API to get behaviors
    // ========================================
    OdataV4Util.GetBehaviors = function(competencyId, oDeferred, sLibraryOrFamilyName, sCategoryOrRoleName, sCompetencyName, filterIds, roleId){
        var requestObject = {
            type: "ODataService",
            baseUrl: "/odata/v4",
            serviceName: "/JpbAdoptionOdataService.svc",
            method: "POST",
            data: {
            	filterIds: filterIds,
                competencyId: competencyId
            },
            servicePath: "/getBehaviorByCompetencyIdAndFilterAction"
        };
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse && odataResponse.value && odataResponse.value.length > 0){
                var aCompetencies = [];
                var aCompetencies = [{
                    "libraryName": sLibraryOrFamilyName,
                    "categoryName": sCategoryOrRoleName,
                    "competencyName": sCompetencyName,
                    "count": odataResponse.value.length,
                    "internalId":"selectAllId"
                }];
                odataResponse.value.forEach(function(behavior){
                  aCompetencies.push({
                      "libraryName": sLibraryOrFamilyName,
                      "categoryName": sCategoryOrRoleName,
                      "competencyName": sCompetencyName,
                      "name": behavior.behaviorName,
                      "internalId": behavior.behaviorInternalId,
                      "roleId": roleId
                    })
                });
                oDeferred.resolve(aCompetencies);
            }else{
                oDeferred.resolve([]);
            }
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };
    // ========================================
    //  API to get search results
    // ========================================
    OdataV4Util.Search = function(oDeferred, sSearchData){
    	var requestObject = {
                type: "ODataService",
                baseUrl: "/odata/v4",
                serviceName: "/JpbAdoptionOdataService.svc",
                method: "POST",
                data: {
                	searchRequest:sSearchData
                },
                servicePath: "/searchAction"
            };

        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
            if(odataResponse && odataResponse.resultByCategories && odataResponse.resultByCategories.length > 0){
                var aCategories = [];
                odataResponse.resultByCategories.forEach(function(sCategory){
                  sCategory.nodes = [{}];
                  aCategories.push({
                    "text": sCategory.categoryName,
                    "nodes":[{}],
                    "libraryName": sCategory.libraryName
                  })
                });
                odataResponse.resultByCategories = aCategories;
            }
            // libraries
            if(odataResponse && odataResponse.resultByLibraries && odataResponse.resultByLibraries.length > 0) {
                var aLibraries = [];
                odataResponse.resultByLibraries.forEach(function (sLibrary) {
                  aLibraries.push({
                    "text": sLibrary,
                    "icon": "sap-icon://course-book",
                    "nodes": [{}]
                  })
                });
                odataResponse.resultByLibraries = aLibraries;
            }
            // competencies
            if(odataResponse && odataResponse.resultByCompetencies && odataResponse.resultByCompetencies.length > 0) {
                var aCompetencies = [];
                if(!sSearchData.useBehavior){
                    odataResponse.resultByCompetencies.forEach(function(sCompetency){
                        aCompetencies.push({
                            "libraryName": sCompetency.libraryName,
                            "categoryName": sCompetency.categoryName,
                            "name": sCompetency.competencyName,
                            "internalId": sCompetency.competencyInternalId
                          })
                    });
                }else{
                    odataResponse.resultByCompetencies.forEach(function(sCompetency){
                        aCompetencies.push({
                            "libraryName": sCompetency.libraryName,
                            "categoryName": sCompetency.categoryName,
                            "text": sCompetency.competencyName,
                            "competencyId": sCompetency.competencyInternalId,
                            "nodes":[{}]
                          })
                    });
                }
                odataResponse.resultByCompetencies = aCompetencies;
            }
            
            // behaviors
            if(odataResponse && odataResponse.resultByBehaviors && odataResponse.resultByBehaviors.length > 0) {
                var aBehaviors = [];
                odataResponse.resultByBehaviors.forEach(function (sBehavior){
                	aBehaviors.push({
                        "libraryName": sBehavior.libraryName,
                        "categoryName": sBehavior.categoryName,
                        "competencyName": sBehavior.competencyName,
                        "name": sBehavior.behaviorName,
                        "internalId": sBehavior.behaviorInternalId,
                    })
                });
                odataResponse.resultByBehaviors = aBehaviors;
            }
            oDeferred.resolve(odataResponse);
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };
    
    // ========================================
    //  API to get search results
    // ========================================
    OdataV4Util.SearchByRole = function(oDeferred, sSearchData){
    	var requestObject = {
                type: "ODataService",
                baseUrl: "/odata/v4",
                serviceName: "/JpbAdoptionOdataService.svc",
                method: "POST",
                data: {
                	searchByRoleRequest:sSearchData
                },
                servicePath: "/searchByRoleAction"
            };
    	
        var promise = DeferredUtil.invokeService(requestObject);
        promise.then(function(odataResponse){
        	// roles
            if(odataResponse && odataResponse.resultByRoles && odataResponse.resultByRoles.length > 0){
                var aRoles = [];
                odataResponse.resultByRoles.forEach(function(sRole){
                  sRole.nodes = [{}];
                  aRoles.push({
                    "text": sRole.roleName,
                    "nodes":[{}],
                    "competencyIds": sRole.competencyIds,
                    "familyName": sRole.familyName,
                    "roleId": sRole.roleId
                  })
                });
                odataResponse.resultByRoles = aRoles;
            }
            // families
            if(odataResponse && odataResponse.resultByFamilies && odataResponse.resultByFamilies.length > 0) {
                var aFamilies = [];
                odataResponse.resultByFamilies.forEach(function (sFamily) {
                	aFamilies.push({
                    "text": sFamily,
                    "icon": "sap-icon://course-book",
                    "nodes": [{}]
                  })
                });
                odataResponse.resultByFamilies = aFamilies;
            }
            // competencies
            if(odataResponse && odataResponse.resultByCompetencies && odataResponse.resultByCompetencies.length > 0) {
                var aCompetencies = [];
                if(!sSearchData.useBehavior){
                    odataResponse.resultByCompetencies.forEach(function(sCompetency){
                        aCompetencies.push({
                            "familyName": sCompetency.familyName,
                            "roleName": sCompetency.roleName,
                            "roleId": sCompetency.roleId,
                            "name": sCompetency.competencyName,
                            "internalId": sCompetency.competencyInternalId
                          })
                    });
                }else{
                    odataResponse.resultByCompetencies.forEach(function(sCompetency){
                        aCompetencies.push({
                        	"familyName": sCompetency.familyName,
                            "roleName": sCompetency.roleName,
                            "roleId": sCompetency.roleId,
                            "text": sCompetency.competencyName,
                            "competencyId": sCompetency.competencyInternalId,
                            "nodes":[{}]
                          })
                    });
                }
                odataResponse.resultByCompetencies = aCompetencies;
            }
            
            // behaviors
            if(odataResponse && odataResponse.resultByBehaviors && odataResponse.resultByBehaviors.length > 0) {
                var aBehaviors = [];
                odataResponse.resultByBehaviors.forEach(function (sBehavior){
                	aBehaviors.push({
                		"familyName": sBehavior.familyName,
                        "roleName": sBehavior.roleName,
                        "roleId": sBehavior.roleId,
                        "competencyName": sBehavior.competencyName,
                        "name": sBehavior.behaviorName,
                        "internalId": sBehavior.behaviorInternalId,
                    })
                });
                odataResponse.resultByBehaviors = aBehaviors;
            }
            oDeferred.resolve(odataResponse);
        }, function(sErr, jqXHR){
            oDeferred.reject(sErr, jqXHR);
        });
        return oDeferred.promise();
    };

    // ========================================
    //  Method to construct request object
    // ========================================
    OdataV4Util._getRequestObject = function(inputParam, obj){
        var filterInputs = {
            competencyIds:[],
            behaviorIds:[],
            libraryCategoryMap:[],
            locale:""
        };

        if(inputParam.filterByCompetencyDetails){
            if(inputParam.filterByCompetencyDetails.competencyIds){
                filterInputs.competencyIds = inputParam.filterByCompetencyDetails.competencyIds;
            }
            if(inputParam.filterByCompetencyDetails.behaviorIds){
                filterInputs.behaviorIds = inputParam.filterByCompetencyDetails.behaviorIds;
            }
            if(inputParam.filterByCompetencyDetails.libraryCategoryMap){
                filterInputs.libraryCategoryMap = inputParam.filterByCompetencyDetails.libraryCategoryMap;
            }
            if(inputParam.filterByCompetencyDetails.locale){
                filterInputs.locale = inputParam.filterByCompetencyDetails.locale;
            }
        };

        var oConfig = {
            type: "ODataService",
            baseUrl: "/odata/v4",
            serviceName: "/JpbAdoptionOdataService.svc",
            method: "POST",
            data: {
              requestBody:filterInputs
            }
          }
          $.extend(true, oConfig, obj);
          return oConfig;
    };
    return OdataV4Util;
});
