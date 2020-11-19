sap.ui.define(['./PostMessageAPI','./Util'],function(P,U){'use strict';var p=function(b){return b.result;};return{isSupported:function(){var s=U.findURLParam('sap-shell');return(s&&s.toLowerCase()==='flp'&&P.isSupported());},CrossApplicationNavigation:{hrefForExternal:function(a){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.hrefForExternal',{oArgs:a}).then(p);},historyBack:function(s){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.historyBack',{iSteps:s});},getSemanticObjectLinks:function(s,m,i){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.getSemanticObjectLinks',{sSemanticObject:s,mParameters:m,bIgnoreFormFactors:i}).then(p);},getLinks:function(s,a){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.getLinks',{semanticObject:s,params:a}).then(p);},isIntentSupported:function(i){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.isIntentSupported',{aIntents:i}).then(p);},isNavigationSupported:function(i){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.isNavigationSupported',{aIntents:i}).then(p);},toExternal:function(a){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.toExternal',{oArgs:a});},getAppStateData:function(a){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.getAppStateData',{sAppStateKey:a}).then(p);},setInnerAppRoute:function(a){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.setInnerAppRoute',{appSpecificRoute:a}).then(p);},setInnerAppStateData:function(d){return P.sendRequest('sap.ushell.services.CrossApplicationNavigation.setInnerAppStateData',{sData:d}).then(p);}},ShellUIService:{setDirtyFlag:function(i){return P.sendRequest('sap.ushell.services.ShellUIService.setDirtyFlag',{bIsDirty:i}).then(p);},setTitle:function(t){return P.sendRequest('sap.ushell.services.ShellUIService.setTitle',{sTitle:t}).then(p);},setHierarchy:function(h){return P.sendRequest('sap.ushell.services.ShellUIService.setHierarchy',{aHierarchyLevels:h});},setRelatedApps:function(r){return P.sendRequest('sap.ushell.services.ShellUIService.setRelatedApps',{aRelatedApps:r});},showShellUIBlocker:function(s){return P.sendRequest('sap.ushell.services.ShellUIService.showShellUIBlocker',{bShow:s});},getFLPUrl:function(i){return P.sendRequest('sap.ushell.services.ShellUIService.getFLPUrl',{bIncludeHash:i}).then(p);},getShellGroupIDs:function(){return P.sendRequest('sap.ushell.services.ShellUIService.getShellGroupIDs',{}).then(p);},addBookmark:function(o,g){return P.sendRequest('sap.ushell.services.ShellUIService.addBookmark',{oParameters:o,groupId:g});}},renderer:{addHeaderItem:function(i,t,I,v){return P.sendRequest('sap.ushell.services.renderer.addHeaderItem',{sId:i,sTooltip:t,sIcon:I,bVisible:v});},showHeaderItem:function(i){return P.sendRequest('sap.ushell.services.renderer.showHeaderItem',{aIds:i});},hideHeaderItem:function(i){return P.sendRequest('sap.ushell.services.renderer.hideHeaderItem',{aIds:i});},setHeaderTitle:function(t){return P.sendRequest('sap.ushell.services.renderer.setHeaderTitle',{sTitle:t});},setHeaderVisibility:function(v){return P.sendRequest('sap.ushell.services.renderer.setHeaderVisibility',{bVisible:v});}},ShellNavigation:{toExternal:function(a){return P.sendRequest('sap.ushell.services.ShellNavigation.toExternal',{oArgs:a});}},NavTargetResolution:{getDistinctSemanticObjects:function(){return P.sendRequest('sap.ushell.services.NavTargetResolution.getDistinctSemanticObjects',{});},expandCompactHash:function(h){return P.sendRequest('sap.ushell.services.NavTargetResolution.expandCompactHash',{sHashFragment:h});},isNavigationSupported:function(i){return P.sendRequest('sap.ushell.services.NavTargetResolution.isNavigationSupported',i);}},AppLifeCycle:{create:function(u,h){return P.sendRequest('sap.ushell.services.AppLifeCycle.create',{sUrl:u,sHash:h});},destroy:function(a){return P.sendRequest('sap.ushell.services.AppLifeCycle.destroy',{appId:a});},store:function(c){return P.sendRequest('sap.ushell.services.AppLifeCycle.store',{sCacheId:c});},restore:function(c,h){return P.sendRequest('sap.ushell.services.AppLifeCycle.restore',{sCacheId:c,sHash:h});}},sessionHandler:{logoutSession:function(){return P.sendRequest('sap.ushell.sessionHandler.logoutSession',{});},extendSessionEvent:function(){P.attachRequestHandler('sap.ushell.sessionHandler.extendSessionEvent',function(e){P.sendResponse(e.getParameter('data'),'success');});},notifyUserActive:function(){return P.sendRequest('sap.ushell.sessionHandler.notifyUserActive',{});}}};});
