sap.ui.define([
	"sap/ui/core/util/MockServer"
], function (MockServer) {
	"use strict";

	return {

		init: function () {

			// create
			var oMockServer = new MockServer({
				rootUri: "/odata/v4/JpbAdoptionOdataService.svc/"
			});

			var oUriParameters = jQuery.sap.getUriParameters();

			// configure mock server with a delay
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: oUriParameters.get("serverDelay") || 1000
			});

			// simulate
			var sPath = jQuery.sap.getModulePath("sap.sf.competencypicker.localService");
			//oMockServer.simulate(sPath + "/metadata.xml", sPath + "/mockdata");
			
			// handling mocking a function import call step
			var aRequests = oMockServer.getRequests();

			var COMPETENCIES_BY_ID = "Competencies By Id";
			var BEHAVIORS_BY_ID = "Behaviors By Id";

			var getCompetencyOrBehaviorDetailsByIds = function(oXhr, calledContext){
                var ids = [];
                var sResourcePath = "";
                switch (calledContext){
                    case COMPETENCIES_BY_ID:
                        sResourcePath = sPath+"/mockdata/competencyDetailsByIds.json";
                        ids = JSON.parse(oXhr.requestBody).competencyIds;
                        break;
                    case BEHAVIORS_BY_ID:
                        sResourcePath = sPath+"/mockdata/behaviorDetailsByIds.json";
                        ids = JSON.parse(oXhr.requestBody).behaviorIds;
                        break;
                }
				var oCompResponse = jQuery.sap.sjax({
					url: sResourcePath,
					dataType : 'json'
				});
				var oResponse = jQuery.sap.sjax({
					url: sResourcePath,
					dataType : 'json'
				});
				oResponse.data = {
					"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
					"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
					"value": []
				};

				ids.forEach(function(id){
                    oResponse.data.value.push(oCompResponse.data[id]);
                });
                oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(oResponse.data));
			};
			
			/**
			 * Load Libraries
			 */
			aRequests.push({
                method: "POST",
                path: new RegExp("getLibraryNameAndFilterAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getLibraryNameAndFilterAction");
					var requestBody = JSON.parse(oXhr.requestBody);	
					var sResourcePath = sPath+"/mockdata/libraries.json";				
					if(requestBody.competencyIds && requestBody.competencyIds.length > 0){
						sResourcePath = sPath+"/mockdata/libraries.filter.json";
					}
					if(requestBody.selectionByCoreCompetency){
						sResourcePath = sPath+"/mockdata/library.core.json";
					}
					var oResponse = null;
					oResponse = jQuery.sap.sjax({
						url: sResourcePath,
						dataType : 'json'
					});
					console.log(oResponse.data);

					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(oResponse.data));
				}
			});
			
			/**
			 * Load Families
			 */
			aRequests.push({
                method: "POST",
                path: new RegExp("getFamilyNamesAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getFamilyNamesAction");
					var sResourcePath = sPath+"/mockdata/families.json";				
					var oResponse = null;
					oResponse = jQuery.sap.sjax({
						url: sResourcePath,
						dataType : 'json'
					});
					console.log(oResponse.data);

					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(oResponse.data));
				}
			});

			/**
			 * Load Selected Competency
			 */
			aRequests.push({
                method: "POST",
                path: new RegExp("getCompetencyDetailsByIdsAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getCompetencyDetailsByIdsAction");
                    getCompetencyOrBehaviorDetailsByIds(oXhr, COMPETENCIES_BY_ID);
				}
			});

			/**
			 * Load Selected Behaviors
			 */
			aRequests.push({
                method: "POST",
                path: new RegExp("getBehaviorDetailsByIdsAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getCompetencyDetailsByIdsAction");
                    getCompetencyOrBehaviorDetailsByIds(oXhr, BEHAVIORS_BY_ID);
				}
			});

			/**
			 * Load Categories
			 */
			aRequests.push({
                method: "POST",
                path: new RegExp("getCategoryByLibraryAndFilterAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getCategoryByLibraryAndFilterAction");
					var requestBody = JSON.parse(oXhr.requestBody);
					var sResourcePath = sPath+"/mockdata/categories.json";					
					if(requestBody.filterIds && requestBody.filterIds.length > 0){
						sResourcePath = sPath+"/mockdata/categories.filter.json";
					}
					if(requestBody.selectionByCoreCompetency){
						sResourcePath = sPath+"/mockdata/category.core.json";
					}
					var oResponse = null;
					oResponse = jQuery.sap.sjax({
						url: sResourcePath,
						dataType : 'json'
					});
					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(oResponse.data[requestBody.libraryName]));
				}
			});
			
			/**
			 * Load Roles
			 */
			aRequests.push({
                method: "POST",
                path: new RegExp("getRoleNamesAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getRoleNamesAction");
					var requestBody = JSON.parse(oXhr.requestBody);
					var sResourcePath = sPath+"/mockdata/roles.json";					
					var oResponse = null;
					oResponse = jQuery.sap.sjax({
						url: sResourcePath,
						dataType : 'json'
					});
					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(oResponse.data[requestBody.familyName]));
				}
			});

			/**
			 * Get competency details by ids
			 */
			 aRequests.push({
                method: "POST",
                path: new RegExp("getCompetencyByIdAndFilterAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getCompetencyByIdAndFilterAction");
					var requestBody = JSON.parse(oXhr.requestBody);
					var sResourcePath = sPath+"/mockdata/competenciesByRoleId.json";
					var oResponse = null;
					oResponse = jQuery.sap.sjax({
						url: sResourcePath,
						dataType : 'json'
					});
					console.log(oResponse.data)
					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(oResponse.data[requestBody.roleId]));
				}
			});


			/**
			 * Load Competencies
			 */
			aRequests.push({
                method: "POST",
                path: new RegExp("getCompetencyByLibraryCategoryAndFilterAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getCompetencyByLibraryCategoryAndFilterAction");
					var requestBody = JSON.parse(oXhr.requestBody);
					var sResourcePath = sPath+"/mockdata/competencies.json";
					if(requestBody.competencyIds && requestBody.competencyIds.length > 0){
						sResourcePath = sPath+"/mockdata/competencies.filter.json";
					}
					if(requestBody.selectionByCoreCompetency){
						sResourcePath = sPath+"/mockdata/competency.core.json";
					}
					var oResponse = null;
					oResponse = jQuery.sap.sjax({
						url: sResourcePath,
						dataType : 'json'
					});
					console.log(oResponse.data)
					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(oResponse.data[requestBody.libraryName][requestBody.categoryName]));
				}          
			});

			/**
			 * Load Behaviors
			 */
			aRequests.push({
                method: "POST",
                path: new RegExp("getBehaviorByCompetencyIdAndFilterAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for getBehaviorByCompetencyIdAndFilterAction");
					var requestBody = JSON.parse(oXhr.requestBody);
					var sResourcePath = sPath+"/mockdata/behaviors.json";
//					if(requestBody.competencyIds && requestBody.competencyIds.length > 0){
//						sResourcePath = sPath+"/mockdata/behaviors.filter.json"
//					}
					var oResponse = null;
					oResponse = jQuery.sap.sjax({
						url: sResourcePath,
						dataType : 'json'
					});
					console.log(oResponse.data)
					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(oResponse.data[requestBody.competencyId]));
				}
			});

			/**
			 * Load Search Results
			 */	
			aRequests.push({
                method: "POST",
                path: new RegExp("searchAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for searchAction");
					var jsonData = {};
					var requestBody = JSON.parse(oXhr.requestBody).searchRequest;
					if(requestBody.libraryName.length > 0
					    && requestBody.categoryName.length > 0
						&& requestBody.competencyName.length > 0){

						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByLibraries":[],
							"resultByCategories":[],
							"resultByCompetencies":[],
							"resultByBehaviors":[]
						};

						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/libraries.json",
							dataType : 'json'
						});
						oResponse.data["libraryNames"].forEach(function(name){
						if(name.trim().toUpperCase().search(requestBody.libraryName.trim().toUpperCase()) !== -1){
							jsonData["resultByLibraries"].push(name);
						}
						});

						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/categories.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							obj["value"].forEach(function(name){
								if(name.trim().toUpperCase().search(requestBody.categoryName.trim().toUpperCase()) !== -1){
									jsonData["resultByCategories"].push({
										"libraryName":sKey,
										"categoryName":name
									});
								}
							})
						})

						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/competencies.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							jQuery.each(obj, function(sKey1, obj1){
								obj1["value"].forEach(function(comp){
									if(comp.competencyName.trim().toUpperCase().search(requestBody.competencyName.trim().toUpperCase()) !== -1){
										jsonData["resultByCompetencies"].push({
											"libraryName":sKey,
											"categoryName":sKey1,
											"competencyName":comp.competencyName,
											"competencyInternalId":comp.competencyInternalId
										});
									}
								})
							})
						})

						if(requestBody.useBehavior && requestBody.behaviorName.length > 0){
							var oResponse = null;
							oResponse = jQuery.sap.sjax({
								url: sPath+"/mockdata/behaviors.filter.json",
								dataType : 'json'
							});
							jQuery.each(oResponse.data, function(sKey, obj){
								jQuery.each(obj, function(sKey1, obj1){
									jQuery.each(obj1, function(sKey2, obj2){
										obj2["value"].forEach(function(behavior){
											if(behavior.behaviorName.trim().toUpperCase().search(requestBody.behaviorName.trim().toUpperCase()) !== -1){
												jsonData["resultByBehaviors"].push({
													"libraryName":sKey,
													"categoryName":sKey1,
													"competencyName":sKey2,
													"behaviorName":behavior.behaviorName,
													"behaviorInternalId":behavior.behaviorInternalId
												});
											}
										})
									})
								})
							})
						}

					} else if (requestBody.libraryName.length > 0){
						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByLibraries":[]
						};
						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/libraries.json",
							dataType : 'json'
						});
						oResponse.data["libraryNames"].forEach(function(name){
						if(name.trim().toUpperCase().search(requestBody.libraryName.trim().toUpperCase()) !== -1){
							jsonData["resultByLibraries"].push(name);
						}
						});
					} else if(requestBody.categoryName.length > 0){
						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByCategories":[]
						};
						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/categories.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							obj["value"].forEach(function(name){
								if(name.trim().toUpperCase().search(requestBody.categoryName.trim().toUpperCase()) !== -1){
									jsonData["resultByCategories"].push({
										"libraryName":sKey,
										"categoryName":name
									});
								}
							})
						})
						//sResourcePath = sPath+"/mockdata/searchResultsByCategories.json"
					} else if(requestBody.competencyName.length > 0){
						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByCompetencies":[]
						};
						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/competencies.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							jQuery.each(obj, function(sKey1, obj1){
								obj1["value"].forEach(function(comp){
									if(comp.competencyName.trim().toUpperCase().search(requestBody.competencyName.trim().toUpperCase()) !== -1){
										jsonData["resultByCompetencies"].push({
											"libraryName":sKey,
											"categoryName":sKey1,
											"competencyName":comp.competencyName,
											"competencyInternalId":comp.competencyInternalId
										});
									}
								})
							})
						})
					} else if(requestBody.useBehavior && requestBody.behaviorName.length > 0){
						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByBehaviors":[]
						};
						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/behaviors.filter.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							jQuery.each(obj, function(sKey1, obj1){
								jQuery.each(obj1, function(sKey2, obj2){
									obj2["value"].forEach(function(behavior){
										if(behavior.behaviorName.trim().toUpperCase().search(requestBody.behaviorName.trim().toUpperCase()) !== -1){
											jsonData["resultByBehaviors"].push({
												"libraryName":sKey,
												"categoryName":sKey1,
												"competencyName":sKey2,
												"behaviorName":behavior.behaviorName,
												"behaviorInternalId":behavior.behaviorInternalId
											});
										}
									})
								})
							})
						})
					}
					var oResponse = null;
					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(jsonData));
				}
				
			});
			
			/**
			 * Load SearchByRole Results
			 */	
			aRequests.push({
                method: "POST",
                path: new RegExp("searchByRoleAction?(.*)"),
                response: function(oXhr) {
					console.log("Incoming request for searchByRoleAction");
					var jsonData = {};
					var requestBody = JSON.parse(oXhr.requestBody).searchByRoleRequest;
					if(requestBody.familyName.length > 0
					    && requestBody.roleName.length > 0
						&& requestBody.competencyName.length > 0){

						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByFamilies":[],
							"resultByRoles":[],
							"resultByCompetencies":[],
							"resultByBehaviors":[]
						};

						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/families.filters.json",
							dataType : 'json'
						});
						oResponse.data["familyNames"].forEach(function(name){
						if(name.trim().toUpperCase().search(requestBody.familyName.trim().toUpperCase()) !== -1){
							jsonData["resultByFamilies"].push(name);
						}
						});

						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/roles.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							obj["value"].forEach(function(role){
								if(role.roleName.trim().toUpperCase().search(requestBody.roleName.trim().toUpperCase()) !== -1){
									jsonData["resultByRoles"].push({
										"familyName":sKey,
										"roleName":role.roleName
									});
								}
							})
						})

						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/competenciesByRole.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							jQuery.each(obj, function(sKey1, obj1){
								obj1["value"].forEach(function(comp){
									if(comp.competencyName.trim().toUpperCase().search(requestBody.competencyName.trim().toUpperCase()) !== -1){
										jsonData["resultByCompetencies"].push({
											"familyName":sKey,
											"roleName":sKey1,
											"roleId":comp.roleId,
											"competencyName":comp.competencyName,
											"competencyInternalId":comp.competencyInternalId
										});
									}
								})
							})
						})

						if(requestBody.useBehavior && requestBody.behaviorName.length > 0){
							var oResponse = null;
							oResponse = jQuery.sap.sjax({
								url: sPath+"/mockdata/behaviorsByRole.json",
								dataType : 'json'
							});
							jQuery.each(oResponse.data, function(sKey, obj){
								jQuery.each(obj, function(sKey1, obj1){
									jQuery.each(obj1, function(sKey2, obj2){
										obj2["value"].forEach(function(behavior){
											if(behavior.behaviorName.trim().toUpperCase().search(requestBody.behaviorName.trim().toUpperCase()) !== -1){
												jsonData["resultByBehaviors"].push({
													"familyName":sKey,
													"roleName":sKey1,
													"roleId":behavior.roleId,
													"competencyName":sKey2,
													"behaviorName":behavior.behaviorName,
													"behaviorInternalId":behavior.behaviorInternalId
												});
											}
										})
									})
								})
							})
						}

					} else if (requestBody.familyName.length > 0){
						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByFamilies":[]
						};
						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/families.filters.json",
							dataType : 'json'
						});
						oResponse.data["familyNames"].forEach(function(name){
						if(name.trim().toUpperCase().search(requestBody.familyName.trim().toUpperCase()) !== -1){
							jsonData["resultByFamilies"].push(name);
						}
						});
					} else if(requestBody.roleName.length > 0){
						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByRoles":[]
						};
						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/roles.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							obj["value"].forEach(function(role){
								if(role.roleName.trim().toUpperCase().search(requestBody.roleName.trim().toUpperCase()) !== -1){
									jsonData["resultByRoles"].push({
										"familyName":sKey,
										"roleName":role.roleName
									});
								}
							})
						})
						//sResourcePath = sPath+"/mockdata/searchResultsByCategories.json"
					} else if(requestBody.competencyName.length > 0){
						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByCompetencies":[]
						};
						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/competenciesByRole.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							jQuery.each(obj, function(sKey1, obj1){
								obj1["value"].forEach(function(comp){
									if(comp.competencyName.trim().toUpperCase().search(requestBody.competencyName.trim().toUpperCase()) !== -1){
										jsonData["resultByCompetencies"].push({
											"familyName":sKey,
											"roleName":sKey1,
											"competencyName":comp.competencyName,
											"competencyInternalId":comp.competencyInternalId
										});
									}
								})
							})
						})
					} else if(requestBody.useBehavior && requestBody.behaviorName.length > 0){
						jsonData = {
							"@odata.context": "https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)",
							"@odata.metadataEtag": "\"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa\"",
							"resultByBehaviors":[]
						};
						var oResponse = null;
						oResponse = jQuery.sap.sjax({
							url: sPath+"/mockdata/behaviorsByRole.json",
							dataType : 'json'
						});
						jQuery.each(oResponse.data, function(sKey, obj){
							jQuery.each(obj, function(sKey1, obj1){
								jQuery.each(obj1, function(sKey2, obj2){
									obj2["value"].forEach(function(behavior){
										if(behavior.behaviorName.trim().toUpperCase().search(requestBody.behaviorName.trim().toUpperCase()) !== -1){
											jsonData["resultByBehaviors"].push({
												"familyName":sKey,
												"roleName":sKey1,
												"competencyName":sKey2,
												"behaviorName":behavior.behaviorName,
												"behaviorInternalId":behavior.behaviorInternalId
											});
										}
									})
								})
							})
						})
					}
					var oResponse = null;
					oXhr.respondJSON(200, {"OData-Version": "4.0"}, JSON.stringify(jsonData));
				}
				
			});

            oMockServer.setRequests(aRequests);

			// start
			oMockServer.start();
		},
		_getsearchResult: function(jsonPath, searchString){
			var sResultArr = [];
			var oResponse = null;
			oResponse = jQuery.sap.sjax({
				url: jsonPath,
				dataType : 'json'
			});
			oResponse.data["value"].forEach(function(name){
			if(name.trim().search(searchString.trim()) !== -1){
				sResultArr.push(name);
			}
			});
			return sResultArr;
		}
	};

});
