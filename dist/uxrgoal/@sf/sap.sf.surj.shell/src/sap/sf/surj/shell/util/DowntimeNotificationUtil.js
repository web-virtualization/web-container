sap.ui.define(['sap/sf/surj/shell/util/DeferredUtil','sap/m/Dialog','sap/m/Button','sap/ui/core/HTML'],function(D,a,B,H){return{show:function(s){if(s){var f=s.fromDate;var t=s.toDate;D.whenUI5LibraryCSSReady().done(function(){var r=sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');var h=['<div>','<div class="time bottompad15">',r.getText('COMMON_DOWNTIME_TIME_WINDOW',[f,t]),'</div>','<div class="bottompad15">',s.text||r.getText('COMMON_DOWNTIME_NOTIFY_TEXT1'),'</div>','<div class="bottompad15">',s.text2||r.getText('COMMON_DOWNTIME_NOTIFY_TEXT2'),'</div>','</div>'];var d=new a({title:s.title||r.getText('COMMON_DOWNTIME_NOTIFY_TITLE'),state:'Warning',contentWidth:'550px',content:[new H({content:h.join('')})],buttons:[new B({text:r.getText("COMMON_BTN_Continue"),press:function(){d.close();}})]}).addStyleClass('surjDowntimeNotification').open();});}}};});