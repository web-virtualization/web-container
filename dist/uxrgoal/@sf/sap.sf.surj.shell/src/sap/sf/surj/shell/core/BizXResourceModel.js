sap.ui.define('sap/sf/surj/shell/core/BizXResourceModel',['jquery.sap.global','sap/ui/model/resource/ResourceModel','sap/sf/surj/shell/core/BizXResourceBundle'],function($,R,B){"use strict";return R.extend('sap.sf.surj.shell.core.BizXResourceModel',{constructor:function(){this._bizxbundle=new B();R.call(this,{bundleName:'bizx',bundle:this._bizxbundle});},loadResourceBundle:function(){return this._bizxbundle;}});});