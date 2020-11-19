sap.ui.define('sap/sf/surj/shell/mvc/GACEAdvancedSearch.controller',['jquery.sap.global','sap/ui/core/mvc/Controller','sap/sf/surj/shell/util/SearchUtil','sap/sf/surj/shell/controls/SearchInput','sap/ui/core/ValueState'],function($,C,S,a,V){"use strict";var c=sap.ui.getCore();var r=c.getLibraryResourceBundle('sap.sf.surj.shell.i18n');var p;var d;var b;return C.extend('sap.sf.surj.shell.mvc.GACEAdvancedSearch',{onInit:function(){this._errorMap={};},onAfterRendering:function(){var t=this;var v=this.getView();this.mModel=v.getModel();this.mModel.setProperty('/columnViewSettings',{"CONTINGENTWORKER":true,"LOCATION":true,"DIVISION":true,"DEPARTMENT":true,"JOBTITLE":true,"EMAIL":true,"STATUS":true});this.mModel.setSizeLimit(1000);var P=c.byId(v.getId()+'-advancedSearchResults');P.addEventDelegate({onAfterRendering:function(){var s=t.oScrollDelegate=P.getScrollDelegate();if(s){s.setGrowingList($.proxy(t.checkScrollPosition,t));}}});var T=c.byId(v.getId()+'-searchResultsTable');T.setShowNoData(false);},onTogglePress:function(e){var v=this.getView();var f=c.byId(v.getId()+'-advancedSearchCheckBox');if(e.getSource().getPressed()){f.setVisible(true);}else{f.setVisible(false);}},search:function(e){this.clearSearchResults();var o=this.createAdvancedSearchCriteria();var P=S.search("GACEAdvancedSearch",o);this.handleSearchPromise(P);this.navigateToSearchResults();},handleSearchPromise:function(P){this._lastSearchPromise=P;this.showLoading(P);P.done($.proxy(this.handleSearchResult,this));P.fail($.proxy(this.handleSearchError,this));},handleSearchResult:function(R){this._lastResponse=R;var e=R.items||[];var f=[];var s=pageHeaderJsonData.settings;var I=!(s&&s["advancedPersonSearch.personBased"]==='true');var g=this.mModel.getProperty('/additionalCriteria/resultScope');/^(employment|person)$/i.test(g)&&(I=/^(employment)$/i.test(g));for(var i=0;i<e.length;i++){var o=e[i];var h=o.employments;var k=r.getText('COMMON_InActive');var l=r.getText('COMMON_Active');if(h.length>1){for(var j=0;j<h.length;j++){var n=$.extend({},o);var m=o.employments[j];m.userId=m.assignmentId;var q=[];q.push(m);n.primaryEmploymentUserId=n.assignmentId;n.userId=m.userId;n.employments=q;if(!h[j].title){h[j].title="";}if(h[j].isHomeAssignment==="true"){n.sIconName="sap-icon://home";n.sTooltip=r.getText('COMMON_Home_Assignment');}else if(h[j].employmentType=="GA"){n.sIconName="sap-icon://world";n.sTooltip=r.getText('COMMON_Global_Assignment');}if(h[j].isPrimaryEmployment==="true"){n.sIconName="sap-icon://favorite";n.sTooltip=r.getText('COMMON_Primary_Employment');}if(I&&h[j].hasOwnProperty('isContingentWorker')){n.isContingentWorker=h[j].isContingentWorker;}if(j>0){n.sDuplicate="duplicate";}else{n.oUserPhoto={photoSrc:this.getPhotoSrc(n)};}h[j].status=(h[j].isActive=="false")?k:l;f.push(n);}}else{o.userId=o.assignmentId;var t=o.employments[0];if(t){if(!t.title){o.employments[0].title="";}if(I&&t.hasOwnProperty('isContingentWorker')){o.isContingentWorker=t.isContingentWorker;}t.status=(t.isActive=="false")?k:l;o.employments[0].userId=t.assignmentId;}o.oUserPhoto={photoSrc:this.getPhotoSrc(o)};f.push(o);}}var M=this.mModel.getProperty('/searchResultItems')||[];M.push.apply(M,f);this._scrollPosition=!this.oScrollDelegate?{x:0,y:0}:{x:this.oScrollDelegate.getScrollLeft(),y:this.oScrollDelegate.getScrollTop()};this.mModel.setProperty('/searchResultItems',M);var u={"CONTINGENTWORKER":true,"LOCATION":true,"DIVISION":true,"DEPARTMENT":true,"JOBTITLE":true,"EMAIL":true};for(var j=0;j<R.columnVisibility.length;j++){var v=R.columnVisibility[j].key;u[v]=(R.columnVisibility[j].value=="true")?true:false;}this.mModel.setProperty('/columnVisiblity',u);if(R.items.length==0){var w=this.getView();var T=c.byId(w.getId()+'-searchResultsTable');T.setShowNoData(true);}},resultsUpdateFinished:function(){var f=this.getView().searchResultsTable.getItems()[0];f&&f.focus();if(this.oScrollDelegate){this.oScrollDelegate.scrollTo(this._scrollPosition.x,this._scrollPosition.y,0);this.checkScrollPosition();}},handleSearchError:function(e,f){},loadMore:function(){if(this._lastResponse&&this._lastResponse.more){var P=this._lastResponse.more();this._lastResponse=null;this.handleSearchPromise(P);}},createAdvancedSearchCriteria:function(){var f=this.mModel.getProperty('/textSearchFieldValue');var s=this.mModel.getProperty('/selectedFieldValues');var e=[];var g;for(var h in f){if(s.hasOwnProperty(h)){g={};var n=[];var i=f[h];if(i){n.push(i);var j=[];var l=s[h].id;j.push(l);g={"key":h,"ids":j,"values":n};}}else{var v=f[h];v=v&&v.trim();if(v===""||v===null){continue;}var m=[];m.push(v);g={"key":h,"values":m};}g.key&&e.push(g);}var o=this.mModel.getProperty('/AdvancedFields');for(var k=0;k<o.length;k++){if(o[k].selectedValue){var j=[];var l=o[k].selectedValue;j.push(l);g={"key":o[k].field,"ids":j};g.key&&e.push(g);}}var A=this.mModel.getProperty('/additionalCriteria');A=$.extend({oDataVersion:this.mModel.getProperty('/oDataServiceKey'),searchParameters:e},A);return A;},clearSearchResults:function(){this._lastSearchPromise=null;this._lastResponse=null;this.mModel.setProperty('/searchResultItems',[]);},showLoading:function(P){var m=this.mModel;if(P.state()=="pending"){m.setProperty('/busy',true);P.always(function(){m.setProperty('/busy',false);});}},checkScrollPosition:function(){if(this.isScrolledBottom()){this.loadMore();}},isScrolledBottom:function(){if(this.oScrollDelegate){var s=this.oScrollDelegate.getScrollTop();var m=this.oScrollDelegate.getMaxScrollTop();return((m-s)<20);}return false;},navigateToSearchResults:function(){this.mModel.setProperty('/view','searchResults');var v=this.getView();c.byId(v.getId()+'-advancedSearchContainer').to(v.getId()+'-advancedSearchResults');},back:function(e){this.mModel.setProperty('/view','searchFields');var v=this.getView();c.byId(v.getId()+'-advancedSearchContainer').to(v.getId()+'-advancedSearchFields');var t=c.byId(v.getId()+'-searchResultsTable');if(t.getShowNoData()){t.setShowNoData(false);}},selectUser:function(e){var v=this.getView();var t=c.byId(v.getId()+'-searchResultsTable');var f=t.getModel().getData().searchResultItems;var s;for(var i=0;i<f.length;i++){if(f[i].selectedItem){s=f[i];}}var o=this.mModel.getProperty('/source');if(o instanceof a){var T=s&&s.employments[0]&&s.employments[0].title;var g=s&&s.name;if(T){g=r.getText('COMMON_Person_AutoComplete_Title_And_Location',[g,T]);}o.setValue(g);o.setObjectValue(s,true);o.fireItemSelected({selectedItem:s});}var h=this.mModel.getProperty('/callback');if(typeof h=='function'){h(s);}this.getView().getParent().close();},cancelSearch:function(){this.getView().getParent().close();},selectSearchResult:function(e){var i=e.getParameter("selectedItem");var s=e.getSource();var f=s.getBindingContext().getObject();this.clearChildFields(f,i.code);this.mModel.setProperty("/selectedFieldValues/"+f.field,i);if(s.getValueState()==V.Error){s.setValueState(V.None);this._errorMap[f.field]=false;this._updateSearchButtonState();}},clearChildFields:function(f,n){var o=this.mModel.getProperty("/selectedFieldValues/"+f.field);if(f.childFields&&f.childFields.length>0){var s=this.mModel.getProperty('/selectedFieldValues');for(var i=0;i<f.childFields.length;i++){var e=f.childFields[i];var g=o&&o.code;if(s.hasOwnProperty(e)&&g!=n){this.mModel.setProperty("/selectedFieldValues/"+e,'');this.mModel.setProperty("/textSearchFieldValue/"+e,'');}}}},onChange:function(e){var s=e.getSource();this._validateInput(s);},onDateTypeStringInputChange:function(e){var s=e.getSource();this._validateDateTypeStringInput(s);},_validateDateTypeStringInput:function(s){var o=s.getBindingContext().getObject();var f=o.field;var t=s.getValue().trim();if(t.length>100){s.setValueState(V.Error);this._errorMap[f]=true;}else if(s.getValueState()==V.Error){s.setValueState(V.None);this._errorMap[f]=false;}this._updateSearchButtonState();},onHireDateChange:function(e){var s=e.getSource();var D=sap.ui.core.format.DateFormat.getInstance({pattern:"yyyy-MM-dd"});var o=s.getDateValue();var f=D.format(o);s.setValue(f);var O=s.getBindingContext().getObject();if(O.field=="HIRE_DATE_FROM"){d=o;}else{b=o;}this._validateHireDate(s);},_validateHireDate:function(s){var o=s.getBindingContext().getObject();var f=o.field;if(d!=null&&b!=null){if(d>b){s.setValueState(V.Error);this._errorMap[f]=true;}else{s.setValueState(V.None);this._errorMap[f]=false;}}else if(s.getValueState()==V.Error){s.setValueState(V.None);this._errorMap[f]=false;}this._updateSearchButtonState();},_validateInput:function(s){var t=s.getValue().trim();var o=s.getBindingContext().getObject();var f=o.field;var e=this.mModel.getProperty('/selectedFieldValues');if(t){if(e.hasOwnProperty(f)){var g=e[f];var h=g.name;if(g.code){h=h+' ('+g.code+')';}if(h!==t){s.setValueState(V.Error);this._errorMap[f]=true;}}else{s.setValueState(V.Error);this._errorMap[f]=true;}}else if(s.getValueState()==V.Error){s.setValueState(V.None);this._errorMap[f]=false;}else if(e[f]){var i={};this.mModel.setProperty("/selectedFieldValues/"+f,i);this.clearChildFields(o,t);}this._updateSearchButtonState();},_updateSearchButtonState:function(){var e=true;for(var k in this._errorMap){if(this._errorMap[k]===true){e=false;break;}}c.byId(this.getView().getId()+'-searchButton').setEnabled(e);},getPhotoSrc:function(R){var P=null;if(!R){return P;}if(R.legacyItem){R=R.legacyItem;}if(R.UserId||R.userId||R.photoUrl||R.photoSrc){if(this.getPhotoViewPermission()){if(!R.photoViewable){if(!p){p=sap.ui.resource('sap.sf.surj.shell.img.userphoto','UserPhotoPlaceholder_50x50.png');}P=p;}else{P=R.photoUrl||R.photoSrc;}if(!P){P={userId:R.UserId||R.userId||'',urlType:'eduPhoto',photoType:'face',mod:R.photoMod};}}}return P;},getPhotoViewPermission:function(){var s=$.sap.getObject('pageHeaderJsonData.settings');return(s&&s['autocomplete.enablePhoto']==='true')||$('#autocomplete\\.enablePhoto').attr('content')==='true';}});});
