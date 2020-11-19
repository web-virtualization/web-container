sap.ui.define(["sap/ui/core/util/MockServer"],function(e){"use strict";return{init:function(){var a=new e({rootUri:"/odata/v4/JpbAdoptionOdataService.svc/"});var t=jQuery.sap.getUriParameters();e.config({autoRespond:true,autoRespondAfter:t.get("serverDelay")||1e3});var o=jQuery.sap.getModulePath("sap.sf.competencypicker.localService");var r=a.getRequests();var n="Competencies By Id";var s="Behaviors By Id";var c=function(e,a){var t=[];var r="";switch(a){case n:r=o+"/mockdata/competencyDetailsByIds.json";t=JSON.parse(e.requestBody).competencyIds;break;case s:r=o+"/mockdata/behaviorDetailsByIds.json";t=JSON.parse(e.requestBody).behaviorIds;break}var c=jQuery.sap.sjax({url:r,dataType:"json"});var i=jQuery.sap.sjax({url:r,dataType:"json"});i.data={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',value:[]};t.forEach(function(e){i.data.value.push(c.data[e])});e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(i.data))};r.push({method:"POST",path:new RegExp("getLibraryNameAndFilterAction?(.*)"),response:function(e){console.log("Incoming request for getLibraryNameAndFilterAction");var a=JSON.parse(e.requestBody);var t=o+"/mockdata/libraries.json";if(a.competencyIds&&a.competencyIds.length>0){t=o+"/mockdata/libraries.filter.json"}if(a.selectionByCoreCompetency){t=o+"/mockdata/library.core.json"}var r=null;r=jQuery.sap.sjax({url:t,dataType:"json"});console.log(r.data);e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(r.data))}});r.push({method:"POST",path:new RegExp("getFamilyNamesAction?(.*)"),response:function(e){console.log("Incoming request for getFamilyNamesAction");var a=o+"/mockdata/families.json";var t=null;t=jQuery.sap.sjax({url:a,dataType:"json"});console.log(t.data);e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(t.data))}});r.push({method:"POST",path:new RegExp("getCompetencyDetailsByIdsAction?(.*)"),response:function(e){console.log("Incoming request for getCompetencyDetailsByIdsAction");c(e,n)}});r.push({method:"POST",path:new RegExp("getBehaviorDetailsByIdsAction?(.*)"),response:function(e){console.log("Incoming request for getCompetencyDetailsByIdsAction");c(e,s)}});r.push({method:"POST",path:new RegExp("getCategoryByLibraryAndFilterAction?(.*)"),response:function(e){console.log("Incoming request for getCategoryByLibraryAndFilterAction");var a=JSON.parse(e.requestBody);var t=o+"/mockdata/categories.json";if(a.filterIds&&a.filterIds.length>0){t=o+"/mockdata/categories.filter.json"}if(a.selectionByCoreCompetency){t=o+"/mockdata/category.core.json"}var r=null;r=jQuery.sap.sjax({url:t,dataType:"json"});e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(r.data[a.libraryName]))}});r.push({method:"POST",path:new RegExp("getRoleNamesAction?(.*)"),response:function(e){console.log("Incoming request for getRoleNamesAction");var a=JSON.parse(e.requestBody);var t=o+"/mockdata/roles.json";var r=null;r=jQuery.sap.sjax({url:t,dataType:"json"});e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(r.data[a.familyName]))}});r.push({method:"POST",path:new RegExp("getCompetencyByIdAndFilterAction?(.*)"),response:function(e){console.log("Incoming request for getCompetencyByIdAndFilterAction");var a=JSON.parse(e.requestBody);var t=o+"/mockdata/competenciesByRoleId.json";var r=null;r=jQuery.sap.sjax({url:t,dataType:"json"});console.log(r.data);e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(r.data[a.roleId]))}});r.push({method:"POST",path:new RegExp("getCompetencyByLibraryCategoryAndFilterAction?(.*)"),response:function(e){console.log("Incoming request for getCompetencyByLibraryCategoryAndFilterAction");var a=JSON.parse(e.requestBody);var t=o+"/mockdata/competencies.json";if(a.competencyIds&&a.competencyIds.length>0){t=o+"/mockdata/competencies.filter.json"}if(a.selectionByCoreCompetency){t=o+"/mockdata/competency.core.json"}var r=null;r=jQuery.sap.sjax({url:t,dataType:"json"});console.log(r.data);e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(r.data[a.libraryName][a.categoryName]))}});r.push({method:"POST",path:new RegExp("getBehaviorByCompetencyIdAndFilterAction?(.*)"),response:function(e){console.log("Incoming request for getBehaviorByCompetencyIdAndFilterAction");var a=JSON.parse(e.requestBody);var t=o+"/mockdata/behaviors.json";var r=null;r=jQuery.sap.sjax({url:t,dataType:"json"});console.log(r.data);e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(r.data[a.competencyId]))}});r.push({method:"POST",path:new RegExp("searchAction?(.*)"),response:function(e){console.log("Incoming request for searchAction");var a={};var t=JSON.parse(e.requestBody).searchRequest;if(t.libraryName.length>0&&t.categoryName.length>0&&t.competencyName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByLibraries:[],resultByCategories:[],resultByCompetencies:[],resultByBehaviors:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/libraries.json",dataType:"json"});r.data["libraryNames"].forEach(function(e){if(e.trim().toUpperCase().search(t.libraryName.trim().toUpperCase())!==-1){a["resultByLibraries"].push(e)}});var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/categories.json",dataType:"json"});jQuery.each(r.data,function(e,o){o["value"].forEach(function(o){if(o.trim().toUpperCase().search(t.categoryName.trim().toUpperCase())!==-1){a["resultByCategories"].push({libraryName:e,categoryName:o})}})});var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/competencies.json",dataType:"json"});jQuery.each(r.data,function(e,o){jQuery.each(o,function(o,r){r["value"].forEach(function(r){if(r.competencyName.trim().toUpperCase().search(t.competencyName.trim().toUpperCase())!==-1){a["resultByCompetencies"].push({libraryName:e,categoryName:o,competencyName:r.competencyName,competencyInternalId:r.competencyInternalId})}})})});if(t.useBehavior&&t.behaviorName.length>0){var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/behaviors.filter.json",dataType:"json"});jQuery.each(r.data,function(e,o){jQuery.each(o,function(o,r){jQuery.each(r,function(r,n){n["value"].forEach(function(n){if(n.behaviorName.trim().toUpperCase().search(t.behaviorName.trim().toUpperCase())!==-1){a["resultByBehaviors"].push({libraryName:e,categoryName:o,competencyName:r,behaviorName:n.behaviorName,behaviorInternalId:n.behaviorInternalId})}})})})})}}else if(t.libraryName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByLibraries:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/libraries.json",dataType:"json"});r.data["libraryNames"].forEach(function(e){if(e.trim().toUpperCase().search(t.libraryName.trim().toUpperCase())!==-1){a["resultByLibraries"].push(e)}})}else if(t.categoryName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByCategories:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/categories.json",dataType:"json"});jQuery.each(r.data,function(e,o){o["value"].forEach(function(o){if(o.trim().toUpperCase().search(t.categoryName.trim().toUpperCase())!==-1){a["resultByCategories"].push({libraryName:e,categoryName:o})}})})}else if(t.competencyName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByCompetencies:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/competencies.json",dataType:"json"});jQuery.each(r.data,function(e,o){jQuery.each(o,function(o,r){r["value"].forEach(function(r){if(r.competencyName.trim().toUpperCase().search(t.competencyName.trim().toUpperCase())!==-1){a["resultByCompetencies"].push({libraryName:e,categoryName:o,competencyName:r.competencyName,competencyInternalId:r.competencyInternalId})}})})})}else if(t.useBehavior&&t.behaviorName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByBehaviors:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/behaviors.filter.json",dataType:"json"});jQuery.each(r.data,function(e,o){jQuery.each(o,function(o,r){jQuery.each(r,function(r,n){n["value"].forEach(function(n){if(n.behaviorName.trim().toUpperCase().search(t.behaviorName.trim().toUpperCase())!==-1){a["resultByBehaviors"].push({libraryName:e,categoryName:o,competencyName:r,behaviorName:n.behaviorName,behaviorInternalId:n.behaviorInternalId})}})})})})}var r=null;e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(a))}});r.push({method:"POST",path:new RegExp("searchByRoleAction?(.*)"),response:function(e){console.log("Incoming request for searchByRoleAction");var a={};var t=JSON.parse(e.requestBody).searchByRoleRequest;if(t.familyName.length>0&&t.roleName.length>0&&t.competencyName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByFamilies:[],resultByRoles:[],resultByCompetencies:[],resultByBehaviors:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/families.filters.json",dataType:"json"});r.data["familyNames"].forEach(function(e){if(e.trim().toUpperCase().search(t.familyName.trim().toUpperCase())!==-1){a["resultByFamilies"].push(e)}});var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/roles.json",dataType:"json"});jQuery.each(r.data,function(e,o){o["value"].forEach(function(o){if(o.roleName.trim().toUpperCase().search(t.roleName.trim().toUpperCase())!==-1){a["resultByRoles"].push({familyName:e,roleName:o.roleName})}})});var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/competenciesByRole.json",dataType:"json"});jQuery.each(r.data,function(e,o){jQuery.each(o,function(o,r){r["value"].forEach(function(r){if(r.competencyName.trim().toUpperCase().search(t.competencyName.trim().toUpperCase())!==-1){a["resultByCompetencies"].push({familyName:e,roleName:o,roleId:r.roleId,competencyName:r.competencyName,competencyInternalId:r.competencyInternalId})}})})});if(t.useBehavior&&t.behaviorName.length>0){var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/behaviorsByRole.json",dataType:"json"});jQuery.each(r.data,function(e,o){jQuery.each(o,function(o,r){jQuery.each(r,function(r,n){n["value"].forEach(function(n){if(n.behaviorName.trim().toUpperCase().search(t.behaviorName.trim().toUpperCase())!==-1){a["resultByBehaviors"].push({familyName:e,roleName:o,roleId:n.roleId,competencyName:r,behaviorName:n.behaviorName,behaviorInternalId:n.behaviorInternalId})}})})})})}}else if(t.familyName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByFamilies:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/families.filters.json",dataType:"json"});r.data["familyNames"].forEach(function(e){if(e.trim().toUpperCase().search(t.familyName.trim().toUpperCase())!==-1){a["resultByFamilies"].push(e)}})}else if(t.roleName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByRoles:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/roles.json",dataType:"json"});jQuery.each(r.data,function(e,o){o["value"].forEach(function(o){if(o.roleName.trim().toUpperCase().search(t.roleName.trim().toUpperCase())!==-1){a["resultByRoles"].push({familyName:e,roleName:o.roleName})}})})}else if(t.competencyName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByCompetencies:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/competenciesByRole.json",dataType:"json"});jQuery.each(r.data,function(e,o){jQuery.each(o,function(o,r){r["value"].forEach(function(r){if(r.competencyName.trim().toUpperCase().search(t.competencyName.trim().toUpperCase())!==-1){a["resultByCompetencies"].push({familyName:e,roleName:o,competencyName:r.competencyName,competencyInternalId:r.competencyInternalId})}})})})}else if(t.useBehavior&&t.behaviorName.length>0){a={"@odata.context":"https://192.168.174.128:443/odata/v4/JpbAdoptionOdataService.svc/$metadata#Collection(Edm.String)","@odata.metadataEtag":'"d4e8acad-4d17-4dfc-8b5e-10d0ff2eb4fa"',resultByBehaviors:[]};var r=null;r=jQuery.sap.sjax({url:o+"/mockdata/behaviorsByRole.json",dataType:"json"});jQuery.each(r.data,function(e,o){jQuery.each(o,function(o,r){jQuery.each(r,function(r,n){n["value"].forEach(function(n){if(n.behaviorName.trim().toUpperCase().search(t.behaviorName.trim().toUpperCase())!==-1){a["resultByBehaviors"].push({familyName:e,roleName:o,competencyName:r,behaviorName:n.behaviorName,behaviorInternalId:n.behaviorInternalId})}})})})})}var r=null;e.respondJSON(200,{"OData-Version":"4.0"},JSON.stringify(a))}});a.setRequests(r);a.start()},_getsearchResult:function(e,a){var t=[];var o=null;o=jQuery.sap.sjax({url:e,dataType:"json"});o.data["value"].forEach(function(e){if(e.trim().search(a.trim())!==-1){t.push(e)}});return t}}});