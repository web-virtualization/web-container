sap.ui.define(['jquery.sap.global','sap/sf/surj/shell/controls/UserPhoto','sap/sf/surj/shell/controls/Table','sap/m/Column'],function($,U,T,C){var r=sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');var e=function(b,i){var s;if(b&&b.length>0){s=b[0].status;}if(!s){s=(i=="true"?r.getText('COMMON_Active'):r.getText('COMMON_InActive'));}return s;};var a=function(i){var t='';if(typeof i!=="string"){return t;}var l;if(i.search(/^(true|yes|y)$/i)>-1){l='COMMON_Yes';}else if(i.search(/^(false|no|n)$/i)>-1){l='COMMON_No';}else{l='COMMON_Unknown';}t=r.getText(l);return t;};sap.ui.jsview('sap.sf.surj.shell.mvc.GACEAdvancedSearch',{createContent:function(c){function b(I,o){var O=o.getObject();var m=100;var v=r.getText('UNIVERSAL_PERSON_SEARCH_MAX_CHARACTERS_EXCEEDED',[m]);var d;switch(O.dataType){case"String":d=new sap.m.Input({width:'100%',valueStateText:v,value:"{/textSearchFieldValue/"+O.field+"}"});d.attachChange(c.onDateTypeStringInputChange,c);break;case"StringReadOnly":this.mModel=o.getModel();var p={id:O.fieldListValue[0],name:O.fieldListValueLabel[0]};this.mModel.setProperty("/textSearchFieldValue/"+O.field,O.fieldListValueLabel[0]);this.mModel.setProperty("/selectedFieldValues/"+O.field,p);d=new sap.m.Input({width:'100%',value:O.fieldListValueLabel[0],editable:false});break;case"StringCombo":var f=[];for(var i=0;i<O.fieldListValue.length;i++){var g=new sap.ui.core.Item({text:O.fieldListValueLabel[i],key:O.fieldListValue[i]});f.push(g);};d=new sap.m.Select({items:f,selectedKey:"{/textSearchFieldValue/"+O.field+"}",width:'100%'});break;case"AutoComplete":$.sap.require('sap.sf.surj.shell.controls.GACESearchInput');d=new sap.sf.surj.shell.controls.GACESearchInput({searchType:"GACESearchField",value:"{/textSearchFieldValue/"+O.field+"}",itemSelected:[c.selectSearchResult,c],itemChange:[c.onChange,c],showButton:true});break;case"DatePicker":d=new sap.m.DatePicker({displayFormat:r.getText('COMMON_DateFormat'),valueFormat:"yyyy-MM-dd",width:'100%',value:"{/textSearchFieldValue/"+O.field+"}"});d.attachChange(c.onHireDateChange,c);break;}var l=new sap.m.Label({width:'100%',labelFor:d.getId()});l.setText(r.getText('LABEL_FORMAT',[O.labelText]));$.sap.require('sap.sf.surj.shell.controls.Container');return new sap.sf.surj.shell.controls.Container({content:[l,d],visible:O.visible}).addStyleClass('surjGACESearchField');}var h=new sap.m.Bar({contentLeft:[new sap.m.Label({text:r.getText('COMMON_FindUser_Search_Results'),textAlign:"Left",}).addStyleClass('surjGACESubHeader')],contentRight:[new sap.m.ToggleButton({icon:"sap-icon://show",enabled:true,pressed:false,press:[c.onTogglePress,c]})]}).addStyleClass('surjGACEHeader');var n=new sap.m.Label({text:"{name}",tooltip:"{name}",customData:{key:"assignmentId",value:'{assignmentId}'}}).addStyleClass("leaf");var s=this.searchResultsTable=new T(this.getId()+'-searchResultsTable',{updateFinished:[c.resultsUpdateFinished,c],columns:[new C({width:'40px',header:new sap.m.Label({tooltip:r.getText('COMMON_Select'),text:r.getText('COMMON_Select')})}),new C({width:'50px',visible:c.getPhotoViewPermission(),header:new sap.m.Label({tooltip:r.getText('COMMON_USER_PHOTO'),text:r.getText('COMMON_USER_PHOTO')})}),new C({styleClass:T.RESIZABLE_COLUMN_CLASS_NAME,mergeDuplicates:true,mergeFunctionName:"data#assignmentId",visible:true,header:new sap.m.Label({tooltip:r.getText('COMMON_Name'),text:r.getText('COMMON_Name')})}),new C({styleClass:T.RESIZABLE_COLUMN_CLASS_NAME,visible:{parts:[{path:'/columnVisiblity/JOBTITLE'},{path:'/columnViewSettings/JOBTITLE'}],formatter:function(d,f){return d&&f;}},header:new sap.m.Label({tooltip:r.getText('COMMON_Jobtitle'),text:r.getText('COMMON_Jobtitle')})}),new C({styleClass:T.RESIZABLE_COLUMN_CLASS_NAME,visible:{parts:[{path:'/columnVisiblity/EMAIL'},{path:'/columnViewSettings/EMAIL'}],formatter:function(d,f){return d&&f;}},header:new sap.m.Label({tooltip:r.getText('EMPFILE_HRIS_EMAIL'),text:r.getText('EMPFILE_HRIS_EMAIL')})}),new C({styleClass:T.RESIZABLE_COLUMN_CLASS_NAME,visible:{parts:[{path:'/columnVisiblity/DIVISION'},{path:'/columnViewSettings/DIVISION'}],formatter:function(d,f){return d&&f;}},header:new sap.m.Label({tooltip:r.getText('COMMON_Division'),text:r.getText('COMMON_Division')})}),new C({styleClass:T.RESIZABLE_COLUMN_CLASS_NAME,visible:{parts:[{path:'/columnVisiblity/DEPARTMENT'},{path:'/columnViewSettings/DEPARTMENT'}],formatter:function(d,f){return d&&f;}},header:new sap.m.Label({tooltip:r.getText('COMMON_GACEDepartment'),text:r.getText('COMMON_GACEDepartment')})}),new C({styleClass:T.RESIZABLE_COLUMN_CLASS_NAME,visible:{parts:[{path:'/columnVisiblity/CONTINGENTWORKER'},{path:'/columnViewSettings/CONTINGENTWORKER'}],formatter:function(S,d){return S&&d;}},header:new sap.m.Label({tooltip:r.getText('COMMON_Contingent_Worker'),text:r.getText('COMMON_Contingent_Worker')}).addStyleClass('surjGACEContingentWorkerColumn')}),new C({styleClass:T.RESIZABLE_COLUMN_CLASS_NAME,visible:{parts:[{path:'/columnVisiblity/LOCATION'},{path:'/columnViewSettings/LOCATION'}],formatter:function(d,f){return d&&f;}},header:new sap.m.Label({tooltip:r.getText('COMMON_Location'),text:r.getText('COMMON_Location')})}),new C({styleClass:T.RESIZABLE_COLUMN_CLASS_NAME,visible:"{/columnViewSettings/STATUS}",header:new sap.m.Label({tooltip:r.getText('COMMON_Status'),text:r.getText('COMMON_Status')})})],items:{path:'/searchResultItems',template:new sap.m.ColumnListItem({cells:[new sap.m.RadioButton({selected:"{selectedItem}"}).addAriaLabelledBy(n.getId()),new U({tooltip:"{name}",user:"{oUserPhoto}",profile:sap.sf.surj.shell.controls.PhotoProfile.SQUARE_40,nameDirection:sap.sf.surj.shell.controls.NameDirection.EAST}).addStyleClass("surjResultPhoto"),n,new sap.m.HBox({width:"100%",items:[new sap.m.Label({width:'100%',tooltip:"{employments/0/title}",text:"{employments/0/title}"}).addStyleClass('surjGACETitle').addStyleClass("leaf"),new sap.ui.core.Icon({src:"{sIconName}",tooltip:"{sTooltip}"})]}).addStyleClass("surjresult"),new sap.m.Link({href:{path:"email",formatter:function(d){return"mailto:"+d;}},tooltip:"{email}",text:"{email}"}).addStyleClass("leaf"),new sap.m.Label({tooltip:"{employments/0/divisionName}",text:"{employments/0/divisionName}"}).addStyleClass("leaf"),new sap.m.Label({tooltip:"{employments/0/departmentName}",text:"{employments/0/departmentName}"}).addStyleClass("leaf"),new sap.m.Label({tooltip:{path:"isContingentWorker",formatter:a},text:{path:"isContingentWorker",formatter:a}}).addStyleClass("leaf"),new sap.m.Label({tooltip:"{employments/0/locationName}",text:"{employments/0/locationName}"}).addStyleClass("leaf"),new sap.m.Label({tooltip:{parts:["employments","isActive"],formatter:e},text:{parts:["employments","isActive"],formatter:e}}).addStyleClass("leaf"),]}).addStyleClass("surjGACESearchResultTableRow").addStyleClass("globalMenuItem").data("sDuplicate","{sDuplicate}",true)}}).addStyleClass('sapUiSizeCompact').addStyleClass("surjGACESearchResultTable").addStyleClass("globalMenu");return new sap.m.NavContainer(this.getId()+'-advancedSearchContainer',{pages:[new sap.m.Page(this.getId()+'-advancedSearchFields',{showHeader:false,busy:'{/busy}',content:[new sap.m.Panel({content:{path:'/Fields',factory:b}}).addStyleClass('surjGACEBorder'),new sap.m.Panel({headerText:r.getText('COMMON_Advanced_Search_Options'),expandable:true,expanded:'{/expandAdvanced}',visible:{parts:[{path:'/AdvancedFields/length'}],formatter:function(l){return l>0;}},content:{path:'/AdvancedFields',factory:b}}).addStyleClass('surjGACEPanelBorder')],footer:new sap.m.Bar({contentRight:[new sap.m.Button({enabled:{parts:[{path:'/busy'}],formatter:function(B){return!B;}},text:r.getText('COMMON_Cancel'),press:[c.cancelSearch,c]}),new sap.m.Button(this.getId()+'-searchButton',{enabled:{parts:[{path:'/busy'}],formatter:function(B){return!B;}},type:'Emphasized',text:r.getText('COMMON_Search'),press:[c.search,c]})]})}).addStyleClass('surjGACEBackground'),new sap.m.Page(this.getId()+'-advancedSearchResults',{showHeader:true,customHeader:h,content:[new sap.m.VBox(this.getId()+'-advancedSearchCheckBox',{visible:false,items:[new sap.m.HBox({items:[new sap.m.CheckBox({selected:"{/columnViewSettings/JOBTITLE}",visible:"{/columnVisiblity/JOBTITLE}",enabled:true,tooltip:r.getText('COMMON_Jobtitle'),text:r.getText('COMMON_Jobtitle')}),new sap.m.CheckBox({selected:"{/columnViewSettings/EMAIL}",visible:"{/columnVisiblity/EMAIL}",enabled:true,tooltip:r.getText('EMPFILE_HRIS_EMAIL'),text:r.getText('EMPFILE_HRIS_EMAIL')}),new sap.m.CheckBox({selected:"{/columnViewSettings/DIVISION}",visible:"{/columnVisiblity/DIVISION}",tooltip:r.getText('COMMON_Division'),text:r.getText('COMMON_Division')}),new sap.m.CheckBox({selected:"{/columnViewSettings/DEPARTMENT}",visible:"{/columnVisiblity/DEPARTMENT}",tooltip:r.getText('COMMON_GACEDepartment'),text:r.getText('COMMON_GACEDepartment')}),new sap.m.CheckBox({selected:"{/columnViewSettings/CONTINGENTWORKER}",visible:"{/columnVisiblity/CONTINGENTWORKER}",tooltip:r.getText('COMMON_Contingent_Worker'),text:r.getText('COMMON_Contingent_Worker')}),new sap.m.CheckBox({selected:"{/columnViewSettings/LOCATION}",visible:"{/columnVisiblity/LOCATION}",tooltip:r.getText('COMMON_Location'),text:r.getText('COMMON_Location')}),new sap.m.CheckBox({selected:"{/columnViewSettings/STATUS}",visible:true,tooltip:r.getText('COMMON_Status'),text:r.getText('COMMON_Status')})]}).addStyleClass('surjGACECheckbox')]}),s],footer:new sap.m.Bar({contentRight:[new sap.m.Button({enabled:{parts:[{path:'/busy'}],formatter:function(B){return!B;}},text:r.getText('COMMON_Cancel'),press:[c.cancelSearch,c]}),new sap.m.Button({enabled:{parts:[{path:'/busy'}],formatter:function(B){return!B;}},text:r.getText('COMMON_Select'),press:[c.selectUser,c]})]})})]});},getControllerName:function(){return'sap.sf.surj.shell.mvc.GACEAdvancedSearch';}});});