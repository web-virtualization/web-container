sap.ui.define('sap/sf/surj/shell/util/GACESearchUtil',['jquery.sap.global','sap/sf/surj/shell/util/DeferredUtil','sap/sf/surj/shell/util/SearchUtil'],function($,D,S){"use strict";var c=sap.ui.getCore();var s='GACESearch';function a(C,n,t,i){C.oDataServiceKey=C.oDataServiceKey||h;var I=C.oDataServiceKey===h;var A=Object.assign({},C.additionalCriteria);var r=(A.resultScope||"EMPLOYMENT").toUpperCase();t=t||0;var j=C.searchValue;for(var m in A){var o=A[m].toString();if(o.toUpperCase()=="YES"){A[m]=true;}else if(o.toUpperCase()=="NO"){A[m]=false;}if(I&&(m=="employmentEffectiveFrom"||m=="employmentEffectiveTo")){A[m]=D.encodeStringForOData(A[m]);}if(m=="displayLocation"){A.includeLocationInfoPerEmpl=A[m];delete A.displayLocation;}if(m=="includeHomeEmpl"){A.includeHomeAssignment=A[m];delete A.includeHomeEmpl;}if(m=="includeExternalPersons"){A.includeExternalUsers=A[m];delete A.includeExternalPersons;}if(m=="includeExternalPersonType"){if(A[m].trim()==""){delete A.includeExternalPersonType;}if(I){A[m]=D.encodeStringForOData(A[m]);}}if(m=="dynamicGroupId"){if(A[m].trim()==""){delete A.dynamicGroupId;}if(I){A[m]=D.encodeStringForOData(A[m]);}}if(m=="country"){if(A[m].trim()==""){delete A.country;}if(I){A[m]=D.encodeStringForOData(A[m]);}}if(m=="useAlternativePermissionType"){if(A[m].trim()==""){delete A.useAlternativePermissionType;}if(I){A[m]=D.encodeStringForOData(A[m]);}}}var u=$.extend({'searchValue':I?D.encodeStringForOData(j):j,'page':n+1,'startIndex':i?i+1:0},A);return D.invokeService($.extend({urlParams:u},k[C.oDataServiceKey||h])).then(function(p){var E=p.PeopleSearchListEntity=p.PeopleSearchListEntity||{items:{results:p.items},hasMore:p.hasMore,totalCount:p.totalCount};var q=f(p,r);var H=false;if(q&&q.length>0){t+=q.length;H=E.hasMore||t<E.totalCount;}var v=Math.max.apply(Math,q.map(function(w){return isNaN(w.indexRef)?0:w.indexRef;}));return{type:l,items:q,totalCount:E.totalCount,hasMore:H,more:H?function(){return a(C,n+1,t,v);}:null};});}function f(r,m){var I=Array.prototype.slice.apply(r.PeopleSearchListEntity.items.results);for(var x=0;x<I.length;x++){if(I[x].employments&&I[x].employments.results){I[x].employments=I[x].employments.results;}}for(var i=I.length-1;i>=0;i--){var o=I[i];if(o.employments&&o.employments.length>1){for(var y=0;y<o.employments.length;y++){o.employments[y].userId=o.employments[y].assignmentId;o.employments[y].showIcon=true;}var A=o.employments.splice(1,o.employments.length-1);o.firstSubItem=true;o.subItem=true;o.userId=o.employments[0].assignmentId;o.primaryEmploymentUserId=o.assignmentId;for(var j=0;j<A.length;j++){var E=A[j];var n=$.extend({},o);n.employments=[E];n.primaryEmploymentUserId=n.assignmentId;n.userId=E.assignmentId;I.splice(i+j+1,0,$.extend(n,{firstSubItem:false,lastSubItem:j==(A.length-1)}));}}else if(!o.employments||o.employments.length==0){o.subItem=true;o.firstSubItem=true;o.lastSubItem=true;o.userId=o.assignmentId;}else if(m==R.EMPLOYMENT){o.userId=o.employments[0].assignmentId;o.employments[0].userId=o.employments[0].assignmentId;o.employments[0].showIcon=false;o.firstSubItem=true;o.lastSubItem=true;}}I.forEach(function(o){o.personBased=true;});return I;}function b(C){return S.search('jsup',$.extend({query:C.searchValue},C.legacySearchCriteria)).then(e);}function d(i){return{"userId":i.UserId,"userName":i.UserName,"name":i.FullName,"firstName":i.FirstName,"lastName":i.LastName,"photoSrc":i.photoUrl,"legacyItem":i};}function e(r){var I=r.items;if(I){I=I.concat();for(var i=0;i<I.length;i++){var o=I[i];I[i]=d(o);}}return $.extend({},r,{items:I,more:r.more?function(){return oRespose.more().then(e);}:null});}function g(C){var A=C.additionalCriteria||{};var r=A.resultScope;if(r&&r.toUpperCase()==R.PERSON){return true;}var i=A.enforceIgnoreProvisioningFlags;if((typeof i=='string'&&i.toUpperCase()=='YES')||i===true){return true;}var o=window.pageHeaderJsonData&&pageHeaderJsonData.settings;return(o&&o["autocomplete.personBased"]==="true")||$('#autocomplete\\.personBased').attr('content')==='true';}D.registerODataService({baseUrl:'/odata/v2/restricted/',serviceGroup:s,serviceName:['PeopleSearchListEntity','PersonSimpleSearchEntity','EmploymentDataEntity','personSimpleSearch']});D.registerODataService({baseUrl:'/odata/v4/PersonSearch.svc/',serviceGroup:s,serviceName:['PeopleSearchListEntity','PersonSimpleSearchEntity','EmploymentDataEntity','personSimpleSearch']});D.finalizeODataRegistry('/odata/v2/restricted/','GACESearch');D.finalizeODataRegistry('/odata/v4/PersonSearch.svc/',s);var h='oDataV2';var k={oDataV2:{type:'ODataService',serviceName:'personSimpleSearch',serviceGroup:s,baseUrl:'/odata/v2/restricted/'},oDataV4:{type:'ODataService',serviceName:'personSimpleSearch()',serviceGroup:s,baseUrl:'/odata/v4/PersonSearch.svc/'}};var l='Person-Employment-User';var R={EMPLOYMENT:'EMPLOYMENT',PERSON:'PERSON'};S.register(l,{search:function(C){C=C||{};if(g(C)){return a(C,0);}else{var i=C.legacySearchType;if(i=='People'){$.sap.require('sap.sf.surj.shell.util.PeopleSearchUtil');return S.search(i,$.extend({keys:['TITLE']},C));}else if(i=='FOPeople'){$.sap.require('sap.sf.surj.shell.util.FOPeopleSearchUtil');return S.search(i,$.extend({keys:['TITLE']},C));}else{return b(C);}}}});var G={flattenEmployments:f,isGACEAutoCompleteSearch:g};$.sap.setObject('sap.sf.surj.shell.util.GACESearchUtil',G);return G;});