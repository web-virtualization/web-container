sap.ui.define(["jquery.sap.global","sap/ui/core/Control","sap/ui/model/json/JSONModel","sap/ui/model/resource/ResourceModel","sap/m/Button","sap/m/ButtonType","sap/m/Dialog","sap/m/Tree","sap/m/OverflowToolbar","sap/m/Text","sap/m/CheckBox","sap/m/CustomTreeItem","sap/m/StandardTreeItem","sap/m/CustomListItem","sap/m/SplitContainer","sap/m/Page","sap/m/Bar","sap/m/Toolbar","sap/m/ToolbarSpacer","sap/m/Link","sap/m/List","sap/ui/layout/HorizontalLayout","sap/ui/core/Icon","sap/m/ComboBox","sap/ui/core/Item","sap/m/SearchField","sap/m/Title","sap/m/ListMode","sap/sf/competencypicker/module/OdataV4Util","sap/m/ToggleButton","sap/m/MessageBox"],function(e,t,r,i,s,a,o,n,l,h,p,c,d,_,m,g,u,P,y,C,f,E,I,T,b,M,N,S,v,O){"use strict";var D=t.extend("sap.sf.competencypicker.controls.CompetencyPicker",{metadata:{properties:{inputParam:{type:"object",defaultValue:{}},inputTitle:{type:"object",defaultValue:{}},resourceBundle:{type:"object",defaultValue:{}}},aggregations:{},events:{itemsSelected:{parameters:{selectedItems:{type:"object"}}}}},constructor:function(){t.apply(this,arguments);this._Model=new r({detailPage:[],detailPageForPreSelected:[],masterPage:{search:{},browse:{libraries:[]},breadcrumbs:null,enableFilter:false,selectedFilter:"all",filterOptions:[],existingCompetencies:[],pressedAll:true,pressedByRole:false}});this._busyLoading=new sap.m.BusyDialog},_oDialog:null,filterIds:[],isErrorShown:false});D.prototype._getFilterOptions=function(){var e=this._Model.getProperty("/masterPage/pressedAll");var t=[];if(e){t=[{name:"all",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_ALL")},{name:"libraries",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_LIBRARIES")},{name:"categories",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_CATEGORIES")},{name:"competencies",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_COMPETENCIES")}]}else{t=[{name:"all",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_ALL")},{name:"families",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_FAMILIES")},{name:"roles",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_ROLES")},{name:"competencies",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_COMPETENCIES")}]}return t};D.prototype.createDialog=function(){this._i18n=this.getResourceBundle();this._resolveHeaderFooterLabels();this._getDistinctCompetencyLibraries();this._getSelectedCompetenciesOrBehaviors();this._oDialog=new o({title:this.getInputTitle().dialogTitle,contentWidth:"54%",contentHeight:"70%",content:[this._getSplitContainer()],buttons:[new s({text:this.getInputTitle().detailPageFooterTitle,press:e.proxy(this._onDone,this),type:a.Emphasized}),new s({text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_CANCEL"),press:e.proxy(function(e){this._closeAndDestroy()},this)})],horizontalScrolling:false,verticalScrolling:false,busyIndicatorDelay:0,stretch:sap.ui.Device.system.phone}).addStyleClass("sapUiSizeCompact competenciesDialog");this._oDialog.setModel(this._Model);this._oDialog.open();this.competencyIdsInDetailPage=[]};D.prototype._resolveHeaderFooterLabels=function(){if(jQuery.isEmptyObject(this._i18n)){var e=new i({bundleName:"sap.sf.competencypicker.i18n.messagebundle"});sap.ui.getCore().setModel(e,"i18n");this._i18n=sap.ui.getCore().getModel("i18n").getResourceBundle()}var t=this.getInputParam().useBehavior;var r={dialogTitle:this._i18n.getText(t?"JDMNG_COMPETENCY_PICKER_DIALOG_TITLE_BEHAVIORS":"JDMNG_COMPETENCY_PICKER_DIALOG_TITLE_COMPETENCIES"),masterPageHeaderTitle:this._i18n.getText(t?"JDMNG_COMPETENCY_PICKER_MASTER_PAGE_HEADER_TITLE_BROWSE_BEHAVIORS":"JDMNG_COMPETENCY_PICKER_MASTER_PAGE_HEADER_TITLE_BROWSE_COMPETENCIES"),detailPageHeaderTitle:this._i18n.getText(t?"JDMNG_COMPETENCY_PICKER_DETAIL_PAGE_HEADER_TITLE_SELECTED_BEHAVIORS":"JDMNG_COMPETENCY_PICKER_DETAIL_PAGE_HEADER_TITLE_SELECTED_COMPETENCIES"),detailPageFooterTitle:this._i18n.getText("JDMNG_COMPETENCY_PICKER_DETAIL_PAGE_FOOTER_TITLE")};if(jQuery.isEmptyObject(this.getInputTitle())){this.setInputTitle(r)}else{var s=this.getInputTitle();for(const[e,t]of Object.entries(r)){if(!s[e]||s[e].length==0){s[e]=t}}this.setInputTitle(s)}};D.prototype._getSplitContainer=function(){var e=new m({masterPages:[this._getMasterPage()],detailPages:[this._getDetailPage()]});this._oSplitContainer=e;return e};D.prototype._getMasterPage=function(){var e=new g({id:"browseCompetenciesPage",customHeader:this._createMasterPageHeader(),subHeader:this._createMasterPageContent(),enableScrolling:false,content:[this._getNumSelectedAndBreadcrumbs(),this._getTree()]});this._updateSizeLimit(this);return e};D.prototype._createMasterPageHeader=function(){var t=new u({contentLeft:[new O("allBtnId",{text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_TAB_ALL"),press:e.proxy(this._handleByRole,this),pressed:"{/masterPage/pressedAll}",visible:this.getInputParam().showByRolesTab}),new O("roleBtnId",{text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_TAB_BY_ROLE"),press:e.proxy(this._handleByRole,this),pressed:"{/masterPage/pressedByRole}",visible:this.getInputParam().showByRolesTab})],contentMiddle:new N({text:this.getInputTitle().masterPageHeaderTitle,tooltip:this.getInputTitle().masterPageHeaderTitle})});return t};D.prototype._createMasterPageContent=function(){var e=new P({content:[this._getSearchField(),this._getFilter()]});return e};D.prototype._getSearchField=function(){this._oSearchField=new M({placeholder:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH"),search:e.proxy(this._handleSearch,this),value:"",liveChange:e.proxy(this._handleLiveChange,this),width:"66%"});return this._oSearchField};D.prototype._getFilter=function(){var t=this._Model.getProperty("/masterPage/pressedAll");var r=null;r=this._getFilterOptions();if(this.getInputParam().useBehavior&&r.length==4){r.push({name:"behaviors",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_BEHAVIORS")})}this._Model.oData.masterPage.filterOptions=r;var i=new T({items:{path:"/masterPage/filterOptions",template:new b({key:"{name}",text:"{label}",tooltip:"{label}"})},selectionChange:e.proxy(function(e){this._Model.setProperty("/masterPage/selectedFilter",e.getSource().getSelectedKey());this._searchCompetencyByDefinedEnum()},this),selectedKey:"{/masterPage/selectedFilter}",enabled:"{/masterPage/enableFilter}",width:"40%"});return i};D.prototype._getNumSelectedAndBreadcrumbs=function(){var e=new P({content:[new f({items:[this._getItems(),this._getHierarchyViewLabel()]})]}).addStyleClass("breadCrumbSize");return e};D.prototype._getTree=function(){var t=new sap.m.ScrollContainer("treeContainerId",{vertical:true,height:"calc(100% -  2rem  -  2%)",content:[this._buildTree("/masterPage/browse/libraries","librariesTreeId"),this._buildTree("/masterPage/search/libraries","librariesSearchTreeId"),this._buildTree("/masterPage/browse/families","familiesTreeId"),this._buildTree("/masterPage/search/families","familiesSearchTreeId"),this._buildTree("/masterPage/search/roles","rolesSearchTreeId"),this._buildTree("/masterPage/search/categories","categoriesSearchTreeId"),this._buildSearchCompetencyList("/masterPage/search/competencies"),this._buildSearchCompetencyList("/masterPage/search/behaviors"),new f({noDataText:this._i18n.getText("JDMNG_COMPETENCY_PICKER_NO_DATA_MASTER_PAGE"),visible:{parts:["/masterPage"],formatter:e.proxy(function(t){if(t&&t.browse&&t.search){if(e.isEmptyObject(t.browse.libraries)&&e.isEmptyObject(t.search.libraries)&&e.isEmptyObject(t.browse.families)&&e.isEmptyObject(t.search.families)&&e.isEmptyObject(t.search.categories)&&e.isEmptyObject(t.search.competencies)&&e.isEmptyObject(t.search.roles)&&e.isEmptyObject(t.search.behaviors)){return true}else{return false}}else{return false}},this)}})]});return t};D.prototype._getBreadcrumbsContent=function(){var t=[new I({src:"sap-icon://course-book"}),new h({text:{path:"/masterPage/breadcrumbs/libraryName",formatter:e.proxy(function(e){return this._trimContent(e)},this)}}),new I({src:"sap-icon://navigation-right-arrow"}),new h({text:{path:"/masterPage/breadcrumbs/categoryName",formatter:e.proxy(function(e){return this._trimContent(e)},this)}})];if(this.getInputParam().useBehavior){t.push(new I({src:"sap-icon://navigation-right-arrow"}),new h({text:{path:"/masterPage/breadcrumbs/competencyName",formatter:e.proxy(function(e){return this._trimContent(e)},this)}}))}return t};D.prototype._trimContent=function(e){var t=this.getInputParam().useBehavior?20:30;if(e&&e.length>t){return e.substring(0,t-4).concat(" ...")}else{return e}};D.prototype._getItems=function(){var e=new _({content:new E({content:this._getBreadcrumbsContent(),allowWrapping:false}).addStyleClass("addCompetenciesHLayoutBreadCrumbs"),visible:{parts:["/masterPage/breadcrumbs"],formatter:function(e){if(!e){return false}return true}}});return e};D.prototype._getHierarchyViewLabel=function(){var e=new _({content:new E({content:[new h({text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_HIERARCHY_VIEW")})]}).addStyleClass("addCompetenciesHLayoutBreadCrumbs"),visible:{parts:["/masterPage/breadcrumbs"],formatter:function(e){if(e){return false}return true}}});return e};D.prototype._buildTree=function(t,r){var i=new n(r,{headerToolbar:new l({content:[new N({text:{parts:[t],formatter:e.proxy(this._standardHeaderText,this)},wrapping:true,titleStyle:sap.ui.core.TitleLevel.H6})],visible:!t.includes("/browse/libraries")&&!t.includes("/browse/families")}),items:{path:t,factory:e.proxy(this._itemFactory,this)},toggleOpenState:e.proxy(this._handleToggleOpenState,this),visible:{parts:[t],formatter:this._standardFormatter}});return i};D.prototype._buildSearchCompetencyList=function(t){if(this.getInputParam().useBehavior&&t==="/masterPage/search/competencies"){return this._buildTree(t,"competenciesSearchTreeId")}else{var r=new n({headerToolbar:new l({content:[new N({text:{parts:[t],formatter:e.proxy(this._standardHeaderText,this)},wrapping:true,titleStyle:sap.ui.core.TitleLevel.H6})]}),items:{path:t,factory:e.proxy(this._itemFactory,this)},visible:{parts:[t],formatter:this._standardFormatter}});return r}};D.prototype._standardHeaderText=function(t){var r="";if(!t||e.isEmptyObject(t)){return r}var i=this._Model.getProperty("/masterPage/pressedAll");var s=t[0];if(i){if(s&&s.icon){r="JDMNG_COMPETENCY_PICKER_LIBRARIES_WITH_COUNT"}else if(s&&s.libraryName&&s.categoryName&&s.competencyName){r="JDMNG_COMPETENCY_PICKER_BEHAVIORS_WITH_COUNT"}else if(s&&s.internalId){r="JDMNG_COMPETENCY_PICKER_COMPETENCIES_WITH_COUNT"}else if(s&&s.libraryName&&s.categoryName){r="JDMNG_COMPETENCY_PICKER_COMPETENCIES_WITH_COUNT"}else if(s&&s.libraryName){r="JDMNG_COMPETENCY_PICKER_CATEGORIES_WITH_COUNT"}}else{if(s&&s.icon){r="JDMNG_COMPETENCY_PICKER_FAMILIES_WITH_COUNT"}else if(s&&s.familyName&&s.roleName&&s.competencyName){r="JDMNG_COMPETENCY_PICKER_BEHAVIORS_WITH_COUNT"}else if(s&&s.internalId){r="JDMNG_COMPETENCY_PICKER_COMPETENCIES_WITH_COUNT"}else if(s&&s.familyName&&s.roleName){r="JDMNG_COMPETENCY_PICKER_COMPETENCIES_WITH_COUNT"}else if(s&&s.familyName){r="JDMNG_COMPETENCY_PICKER_ROLES_WITH_COUNT"}}return this._i18n.getText(r,[t.length])};D.prototype._itemFactory=function(t,r){var i=r.getProperty("internalId");var s=null;if(i=="selectAllId"){var a=new C({text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SELECT_ALL","{count}"),press:e.proxy(this._handleSelectAllLink,this,true),emphasized:true});var o=new C({text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_UN_SELECT_ALL","{count}"),press:e.proxy(this._handleSelectAllLink,this,false),emphasized:true});return new c({content:[a,new C({text:" / ",emphasized:true}),o]})}if(i){var n=this._Model.getProperty("/masterPage/existingCompetencies")||[];var l=n.indexOf(i)!=-1;var h=new p({text:"{name}",tooltip:"{name}",selected:{parts:[{path:"compSelected"}],formatter:e.proxy(function(e){return e||l||this.competencyIdsInDetailPage.indexOf(i)>=0},this)},enabled:this.getInputParam().allowUserToChangeSelection?true:!l,wrapping:true,select:e.proxy(this._handleCheckBox,this)});s=new c({content:[h]})}else{s=new d({title:"{text}",tooltip:"{text}",icon:"{icon}"})}return s};D.prototype._standardFormatter=function(e){return e&&e.length>0||false};D.prototype._showErrorMessage=function(e){if(!this.isErrorShown){this.isErrorShown=true;return sap.m.MessageBox.error(this._i18n.getText(e),{onClose:function(e){this.isErrorShown=false}.bind(this)})}};D.prototype._getChildNodes=function(t,r,i){var s;var a=new e.Deferred;this._busyLoading.open();var o=r.getProperty("text");if(i){var n=this._Model.getProperty(t).libraryName;var l=this._Model.getProperty(t).categoryName;if(n&&!l){s=v.GetCompetencies(this.getInputParam(),a,n,o,this.filterIds)}else if(n&&l){var h=this._Model.getProperty(t).competencyId;s=v.GetBehaviors(h,a,n,l,o,this.filterIds,undefined)}else{s=v.GetCategories(this.getInputParam(),a,o,this.filterIds)}}else{var p=this._Model.getProperty(t).familyName;var c=this._Model.getProperty(t).roleName;var d=r.getProperty("roleId");if(p&&!c){s=v.GetCompetencyDetailsByIds(this.getInputParam(),a,p,o,this.filterIds,d)}else if(p&&c){var h=this._Model.getProperty(t).competencyId;s=v.GetBehaviors(h,a,p,c,o,this.filterIds,d)}else{s=v.GetRoles(this.getInputParam(),a,this.filterIds,o)}}s.then(function(e){this._onChildNodesLoaded(t,e);this._hideUnhideTrees();this._busyLoading.close()}.bind(this),function(e,t){this._showErrorMessage("JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA");this._busyLoading.close()}.bind(this))};D.prototype._updateSizeLimit=function(e){var t=this;t._Model.setSizeLimit(this._Model.iSizeLimit||100);if(Array.isArray(e)){this._Model.setSizeLimit(this._Model.iSizeLimit+e.length)}else if(!jQuery.isEmptyObject(e)){jQuery.each(e,function(r,i){if(Array.isArray(i)){t._Model.setSizeLimit(t._Model.iSizeLimit+e.length)}})}};D.prototype._getDetailPage=function(){var e=new g({id:"selectedCompetenciesPage",customHeader:this._createDetailPageHeader(),content:[this._createDetailPageContentToolBar(),this._selectedCompetenciesCountDisplay(),this._createDetailPageContentPreSelectedList(),this._createDetailPageContentSelectedList()]});return e};D.prototype._createInfo=function(){if(!this.getInputParam().useBehavior){var e=new sap.m.MessageStrip({text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_ADD_COMPETENCIES_INFO"),type:sap.ui.core.MessageType.Information,showIcon:true}).addStyleClass("addCompetenciesDetailPageSubHeaderText");return e}};D.prototype._createDetailPageHeader=function(){var t=new u({contentMiddle:[new s({icon:"sap-icon://arrow-left",tooltip:"Back",visible:sap.ui.Device.system.phone,press:e.proxy(function(e){this._oSplitContainer.toMaster("browseCompetenciesPage")},this)}),new N({text:this.getInputTitle().detailPageHeaderTitle,tooltip:this.getInputTitle().detailPageHeaderTitle})]});return t};D.prototype._createDetailPageContentToolBar=function(){var t=new P({content:[new y,new s({text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_REMOVE_ALL"),tooltip:this._i18n.getText("JDMNG_COMPETENCY_PICKER_REMOVE_ALL"),type:a.Emphasized,enabled:{parts:["/detailPage"],formatter:this._standardFormatter},press:e.proxy(this._handleRemoveAll,this)})]}).addStyleClass("removeAllBgColor");return t};D.prototype._selectedCompetenciesCountDisplay=function(){var t=new u({contentMiddle:new h({text:{parts:["/detailPage","/detailPageForPreSelected"],formatter:e.proxy(function(e,t){if(this.getInputParam().allowUserToChangeSelection){if(e){return this._i18n.getText("JDMNG_COMPETENCY_PICKER_SELECTED_COMPETENCIES_WITH_COUNT",[e.length])}}else{if(e&&t){return this._i18n.getText("JDMNG_COMPETENCY_PICKER_SELECTED_COMPETENCIES_WITH_COUNT",[e.length+t.length])}}},this)}})}).addStyleClass("selectedCountStyle");return t};D.prototype._createDetailPageContentPreSelectedList=function(){var e=new f({showNoData:false,items:{path:"/detailPageForPreSelected",template:new _({content:[new h({text:"{name}",tooltip:"{name}",wrapping:true})]}).addStyleClass("addCompetenciesSelectedItem")},visible:{parts:["/detailPageForPreSelected"],formatter:function(e){if(e&&e.length>0){return true}else{return false}}}});return e};D.prototype._createDetailPageContentSelectedList=function(){var t=new f({showNoData:false,items:{path:"/detailPage",template:new _({content:[new h({text:"{name}",tooltip:"{name}",wrapping:true})]}).addStyleClass("addCompetenciesSelectedItem")},visible:{parts:["/detailPage","/detailPageForPreSelected"],formatter:function(e,t){if(t&&t.length>0&&e.length==0){return false}else{return true}}},mode:S.Delete,delete:e.proxy(this._handleDelete,this)});return t};D.prototype._createDetailPageFooter=function(){var t=new l({content:[new y,new s({text:this.getInputTitle().detailPageFooterTitle,tooltip:this.getInputTitle().detailPageFooterTitle,press:e.proxy(this._onDone,this),type:a.Emphasized}),new s({text:this._i18n.getText("JDMNG_COMPETENCY_PICKER_CANCEL"),tooltip:this._i18n.getText("JDMNG_COMPETENCY_PICKER_CANCEL"),press:e.proxy(function(e){this._closeAndDestroy()},this)})]});return t};D.prototype._getDistinctCompetencyLibraries=function(){var t=new e.Deferred;var r=v.GetLibraries(this.getInputParam(),t);r.then(function(e){this._onLibrariesLoaded(e.libraryNames);this.filterIds=e.filterIds}.bind(this),function(e,t){this._showErrorMessage(t.responseJSON.error.message==="JDMNG_ERROR_NO_PERMISSION"?"JDMNG_COMPETENCY_PICKER_ERROR_NO_PERMISSION":"JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA")}.bind(this))};D.prototype._getSelectedCompetenciesOrBehaviors=function(){var t=new e.Deferred;var r=null;if(this.getInputParam().useBehavior){r=v.GetSelectedBehaviors(this.getInputParam(),t)}else{r=v.GetSelectedCompetencies(this.getInputParam(),t)}r.then(function(e){if(this.getInputParam().allowUserToChangeSelection){this._Model.setProperty("/detailPage",e)}else{this._Model.setProperty("/detailPageForPreSelected",e)}}.bind(this),function(e,t){this._showErrorMessage(t.responseJSON.error.message==="JDMNG_ERROR_NO_PERMISSION"?"JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA":"JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA")}.bind(this))};D.prototype._getDistinctFamilies=function(){var t=new e.Deferred;var r=v.GetFamilies(this.getInputParam(),t,this.filterIds);r.then(function(e){this._onFamiliesLoaded(e)}.bind(this),function(e,t){this._showErrorMessage("JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA")}.bind(this))};D.prototype._getSearchResults=function(t,r){var i=this._Model.getProperty("/masterPage/pressedAll");var s={};var a=new e.Deferred;var o={};if(i){s={libraryName:"",categoryName:"",competencyName:"",behaviorName:"",filterIds:this.filterIds,useBehavior:this.getInputParam().useBehavior,selectionByCoreCompetency:this.getInputParam().selectionByCoreCompetency};if(t=="libraries"){s.libraryName=r}else if(t=="categories"){s.categoryName=r}else if(t=="competencies"){s.competencyName=r}else if(t=="behaviors"){s.behaviorName=r}else{s.libraryName=r;s.categoryName=r;s.competencyName=r;if(s.useBehavior){s.behaviorName=r}}o=v.Search(a,s)}else{s={familyName:"",roleName:"",competencyName:"",behaviorName:"",filterIds:this.filterIds,useBehavior:this.getInputParam().useBehavior,includeInActive:this.getInputParam().includeInActive,selectionByCoreCompetency:this.getInputParam().selectionByCoreCompetency};if(t=="families"){s.familyName=r}else if(t=="roles"){s.roleName=r}else if(t=="competencies"){s.competencyName=r}else if(t=="behaviors"){s.behaviorName=r}else{s.familyName=r;s.roleName=r;s.competencyName=r;if(s.useBehavior){s.behaviorName=r}}o=v.SearchByRole(a,s)}o.then(function(e){this._onSearchResultsLoaded(e)}.bind(this),function(e,t){this._showErrorMessage("JDMNG_COMPETENCY_PICKER_ERROR_SEARCHING_DATA")}.bind(this))};D.prototype._onLibrariesLoaded=function(e){this._Model.setProperty("/masterPage/browse/libraries",e);this._clearSearchData(false);this._Model.setProperty("/masterPage/browse/families",[]);this._updateSizeLimit(e);if(!this._oDialog){}else{this._Model.setProperty("/masterPage/existingCompetencies",this.getInputParam().selectedIds);this._Model.refresh(true)}this._hideUnhideTrees()};D.prototype._onFamiliesLoaded=function(e){this._Model.setProperty("/masterPage/browse/families",e);this._Model.setProperty("/masterPage/browse/libraries",[]);this._clearSearchData(true);this._updateSizeLimit(e);this._hideUnhideTrees()};D.prototype._onChildNodesLoaded=function(e,t){this._Model.setProperty(e+"/nodes",t);this._updateSizeLimit(t);this._Model.refresh(true)};D.prototype._collapseTreeContainer=function(){var e=sap.ui.getCore().byId("treeContainerId");if(e){for(var t=0,r=e.getContent().length;t<r;t++){if(e.getContent()[t]instanceof n){e.getContent()[t].collapseAll()}}}};D.prototype._onSearchResultsLoaded=function(e){this._collapseTreeContainer();var t=this._Model.getProperty("/masterPage/pressedAll");if(t){this._Model.setProperty("/masterPage/browse/libraries",[]);this._Model.setProperty("/masterPage/search/libraries",e.resultByLibraries);this._Model.setProperty("/masterPage/search/categories",e.resultByCategories);this._updateSizeLimit(e.resultByLibraries)}else{this._Model.setProperty("/masterPage/browse/families",[]);this._Model.setProperty("/masterPage/search/families",e.resultByFamilies);this._Model.setProperty("/masterPage/search/roles",e.resultByRoles);this._updateSizeLimit(e.resultByFamilies)}this._Model.setProperty("/masterPage/search/competencies",e.resultByCompetencies);this._Model.setProperty("/masterPage/search/behaviors",e.resultByBehaviors);this._Model.refresh(true);this._hideUnhideTrees()};D.prototype._closeAndDestroy=function(){if(this._oDialog){this._oDialog.close();this._oDialog.destroy()}};D.prototype._handleToggleOpenState=function(e){var t=e.getParameter("itemContext");var r=t.getProperty("nodes");if(r&&r.length>0&&(r[0].text||r[0].competencyInternalId)){return}var i=t.getPath();var s=this._Model.getProperty("/masterPage/pressedAll");if(e.getParameter("expanded")){this._getChildNodes(i,t,s)}};D.prototype._handleSelectAllLink=function(e,t){var r=t.getSource();var i=r.getBindingContext().getPath();var s=r.getBindingContext().getObject();var a=i.split("/");a.pop();var o=a.join("/");var n=this._Model.getProperty(o);if(e){this._selectAll(n,o,s)}else{this._unSelectAll(n,o)}this._oSplitContainer.toDetail("selectedCompetenciesPage");this._Model.refresh(true);this._hideUnhideTrees(this._Model.oData.masterPage.pressedByRole)};D.prototype._selectAll=function(e,t,r){this._Model.setProperty("/masterPage/breadcrumbs",r);if(r.familyName){var i={libraryName:r.familyName,categoryName:r.roleName,name:r.name};this._Model.setProperty("/masterPage/breadcrumbs",i)}for(var s=1;s<e.length;s++){var a=e[s];var o=this._Model.getProperty("/detailPage").map(function(e){return e.internalId}).indexOf(a.internalId);var n=this._Model.getProperty("/detailPageForPreSelected").map(function(e){return e.internalId}).indexOf(a.internalId);if(o==-1&&n==-1){this._Model.setProperty(t+"/"+s+"/compSelected",true);this._Model.getProperty("/detailPage").push(a);this.competencyIdsInDetailPage.push(a.internalId)}}};D.prototype._unSelectAll=function(e,t){this._Model.setProperty("/masterPage/breadcrumbs",null);for(var r=1;r<e.length;r++){var i=e[r];this._Model.setProperty(t+"/"+r+"/compSelected",false);var s=this._Model.getProperty("/detailPage").map(function(e){return e.internalId}).indexOf(i.internalId);if(s!=-1){this._Model.getProperty("/detailPage").splice(s,1);var a=this.competencyIdsInDetailPage.indexOf(i.internalId);if(a!=-1){this.competencyIdsInDetailPage.splice(a,1)}var o=this._Model.getProperty("/masterPage/existingCompetencies").indexOf(i.internalId);if(o!=-1){this._Model.getProperty("/masterPage/existingCompetencies").splice(o,1)}}}};D.prototype._handleCheckBox=function(e){var t=e.getSource();var r=t.getBindingContext().getObject();this._Model.setProperty(t.getBindingContext().getPath()+"/compSelected",t.getSelected());if(t.getSelected()){this._Model.getProperty("/detailPage").push(r);this._Model.setProperty("/masterPage/breadcrumbs",r);this.competencyIdsInDetailPage.push(r.internalId);if(r.familyName){var i={libraryName:r.familyName,categoryName:r.roleName,competencyName:r.competencyName,name:r.name};this._Model.setProperty("/masterPage/breadcrumbs",i)}}else{var s=this._Model.getProperty("/detailPage").map(function(e){return e.internalId}).indexOf(r.internalId);if(s!=-1){this._Model.getProperty("/detailPage").splice(s,1);var a=this.competencyIdsInDetailPage.indexOf(r.internalId);this.competencyIdsInDetailPage.splice(a,1);this._Model.setProperty("/masterPage/breadcrumbs",null);var o=this._Model.getProperty("/masterPage/existingCompetencies").indexOf(r.internalId);if(o!=-1){this._Model.getProperty("/masterPage/existingCompetencies").splice(o,1)}}}this._oSplitContainer.toDetail("selectedCompetenciesPage");if(this.getInputParam().showByRolesTab){var n=this._Model.getProperty("/masterPage");this._enableMultipleOccurrencesCompetencies(r,n.browse.libraries);this._enableMultipleOccurrencesCompetencies(r,n.browse.families)}this._Model.refresh(true);this._hideUnhideTrees()};D.prototype._enableMultipleOccurrencesCompetencies=function(t,r){if(r){r.forEach(e.proxy(function(e){if(e&&e.internalId){if(!t||t.internalId==e.internalId){e.compSelected=t.compSelected}}else if(e.nodes&&!jQuery.isEmptyObject(e.nodes[0])){this._enableMultipleOccurrencesCompetencies(t,e.nodes)}},this))}};D.prototype._onDone=function(){this.fireItemsSelected({selectedItems:this._Model.getProperty("/detailPage")});this._closeAndDestroy()};D.prototype._handleDelete=function(e){var t=e.getParameter("listItem");var r=t.getBindingContext().getObject();var i=this._Model.getProperty("/detailPage").indexOf(r);if(i!=-1){this._Model.getProperty("/detailPage").splice(i,1);var s=this.competencyIdsInDetailPage.indexOf(r.internalId);this.competencyIdsInDetailPage.splice(s,1)}var a=this._Model.getProperty("/masterPage/existingCompetencies").indexOf(r.internalId);if(a!=-1){this._Model.getProperty("/masterPage/existingCompetencies").splice(a,1)}this._updateMasterData(r)};D.prototype._handleRemoveAll=function(e){this._Model.setProperty("/detailPage",[]);this.competencyIdsInDetailPage=[];if(this.getInputParam().allowUserToChangeSelection){this._Model.setProperty("/masterPage/existingCompetencies",[])}this._updateMasterData()};D.prototype._updateMasterData=function(e){var t=this._Model.getProperty("/masterPage");t.breadcrumbs=null;this._enableCompetencies(e,t.browse.libraries);this._enableCompetencies(e,t.browse.families);this._enableCompetencies(e,t.search.libraries);this._enableCompetencies(e,t.search.categories);this._enableCompetencies(e,t.search.families);this._enableCompetencies(e,t.search.roles);this._enableCompetencies(e,t.search.competencies);this._enableCompetencies(e,t.search.behaviors);this._Model.refresh(true);this._hideUnhideTrees()};D.prototype._enableCompetencies=function(t,r){if(r){r.forEach(e.proxy(function(e){if(e&&e.internalId){if(!t||t.internalId==e.internalId){e.compSelected=false}}else if(e.nodes&&!jQuery.isEmptyObject(e.nodes[0])){this._enableCompetencies(t,e.nodes)}},this))}};D.prototype._handleByRole=function(e){var t=e.getSource().sId=="roleBtnId";this._Model.setProperty("/masterPage/pressedByRole",t);this._Model.setProperty("/masterPage/pressedAll",!t);this._Model.setProperty("/masterPage/breadcrumbs",null);this._oSearchField.setValue("");this._collapseTreeContainer();var r=null;this._clearSearchData(t);if(t){var i=this._Model.getProperty("/masterPage/browse/families");if(!i||i.length==0){this._getDistinctFamilies()}}else{var s=this._Model.getProperty("/masterPage/browse/libraries");if(!s||s.length==0){this._getDistinctCompetencyLibraries()}}r=this._getFilterOptions();if(this.getInputParam().useBehavior&&r.length==4){r.push({name:"behaviors",label:this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_BEHAVIORS")})}this._Model.oData.masterPage.filterOptions=r;this._hideUnhideTrees()};D.prototype._hideTree=function(e){if(e instanceof n){e.setVisible(false)}};D.prototype._hideUnhideTrees=function(){if(this.getInputParam().showByRolesTab){var t=this._Model.getProperty("/masterPage");var r=this._Model.getProperty("/masterPage/pressedAll");if(r){if(!e.isEmptyObject(t.browse.libraries)){sap.ui.getCore().byId("librariesTreeId").setVisible(true)}sap.ui.getCore().byId("familiesTreeId").setVisible(false)}else{sap.ui.getCore().byId("librariesTreeId").setVisible(false);if(!e.isEmptyObject(t.browse.families)){sap.ui.getCore().byId("familiesTreeId").setVisible(true)}}}};D.prototype._handleSearch=function(e){var t=e.getParameter("query");this._Model.setProperty("/masterPage/searchedText",t);var r=this._Model.getProperty("/masterPage/pressedByRole");if(!t){if(r){var i=this._Model.getProperty("/masterPage/browse/families");if(!i||i.length==0){this._getDistinctFamilies()}}else{var s=this._Model.getProperty("/masterPage/browse/libraries");if(!s||s.length==0){this._getDistinctCompetencyLibraries()}}this._clearSearchData(!r);this._Model.setProperty("/masterPage/searchedText","");this._hideTree(sap.ui.getCore().byId("familiesSearchTreeId"));this._hideTree(sap.ui.getCore().byId("librariesSearchTreeId"))}else{this._searchCompetencyByDefinedEnum();this._clearSearchData(r)}if(t){this._hideTree(sap.ui.getCore().byId("familiesTreeId"));this._hideTree(sap.ui.getCore().byId("librariesTreeId"))}this._Model.refresh(true)};D.prototype._clearSearchData=function(e){if(e){this._Model.setProperty("/masterPage/search/libraries",[]);this._Model.setProperty("/masterPage/search/categories",[])}else{this._Model.setProperty("/masterPage/search/families",[]);this._Model.setProperty("/masterPage/search/roles",[])}this._Model.setProperty("/masterPage/search/competencies",[]);this._Model.setProperty("/masterPage/search/behaviors",[]);this._Model.setProperty("/masterPage/breadcrumbs",null)};D.prototype._searchCompetencyByDefinedEnum=function(){var e=this._Model.getProperty("/masterPage/searchedText");var t=this._Model.getProperty("/masterPage/selectedFilter");if(!e||!t){return}this._getSearchResults(t,e);this._hideTree(sap.ui.getCore().byId("familiesTreeId"));this._hideTree(sap.ui.getCore().byId("librariesTreeId"))};D.prototype._handleLiveChange=function(e){this._Model.setProperty("/masterPage/enableFilter",!!e.getParameter("newValue"))};return D});