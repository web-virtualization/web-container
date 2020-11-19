sap.ui.define('sap/sf/surj/shell/util/NameFormatter',['jquery.sap.global'],function($){var r=sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');var u=r.getText('COMMON_User_Display_Name')||'{0} {1} {2}';var N={isFirstNameFirst:function(){return I<a;},splitFullName:function(b){var c=[];var m=b.middleInitial||b.mi||'';var f=b.firstName||b.fn||'';var l=b.lastName||b.ln||'';if(!f&&!l&&b.fullName){var i=b.fullName.indexOf(' ');if(i>=0){return[b.fullName.substring(0,i),b.fullName.substring(i+1)];}else{return[b.fullName];}}for(var d=0;d<S.length;d++){var e=$.sap.formatMessage(S[d],[f,m,l]);if(!/^\s*$/.exec(e)){c.push(e);}}return c;},format:function(n,h){var i=function(s){return!(!s||0===s.length||/^\s*$/.test(s));};if(!n){return"";}if(typeof h=='undefined'){h=true;}var f=n.firstName!=null?n.firstName:"";var m=n.mi!=null?n.mi:"";var l=n.lastName!=null?n.lastName:"";if(!h){m="";}if(i(f)||i(m)||i(l)){var b=$.sap.formatMessage(u,f,m,l);b=b.trim();b=b.replace(/\s{2,}/g," ");return b;}else{return"";}}};var I=u.indexOf('{0}');var a=u.indexOf('{2}');var O={'012':[[0,1],[2]],'021':[[0],[2,1]],'120':[[1,2],[0]],'102':[[1,0],[2]],'201':[[2],[0,1]],'210':[[2],[1,0]]};var S=(function(){var n=[];var i=0;for(var b=0;b<3;b++){var f=u.indexOf('{'+b+'}');if(f>=0){i++;}n.push({index:b,included:f>=0,formatIndex:f});}switch(i){case 0:return null;case 1:return[u];case 2:if(n[1].included){return[u];}case 3:var o=n.concat();o.sort(function(m,t){if(m.included&&t.included){return m.formatIndex<t.formatIndex?-1:1;}else{return m.included?-1:t.included?1:0;}});var c="";for(var b=0;b<3;b++){c+=o[b].index;if(o[b].included){var l=b-1;while(l>=0&&!o[l].included){l--;}var d=l<0?'^':'\\{'+o[l].index+'\\}[^\\s\\{]*';d+='(.*\\{'+o[b].index+'\\}';if(b==2){d+=".*)$";}else{d+='[^\\s\\{]*)';}o[b].message=new RegExp(d).exec(u)[1];}}var s=O[c];var e=[];for(var b=0;b<s.length;b++){var g=s[b];var h="";for(var j=0;j<g.length;j++){var k=n[g[j]];if(k.included){h+=k.message;}}e.push(h);}return e;}})();$.sap.setObject('sap.sf.surj.shell.util.NameFormatter',N);return N;});
