sap.ui.define([
    'jquery.sap.global'
], function($) {
    /**
     * @inner
     * @param {Object} oOptions
     * @return {String}
     */
    function getThemeCompanyId(oOptions) {
        var sCompanyId = oOptions && oOptions.companyId;
        if (!sCompanyId) {
            if (window.pageHeaderJsonData) {
                sCompanyId = window.pageHeaderJsonData.companyId;
            }
            if (!sCompanyId) {
                var oModel = sap.ui.getCore().getModel('pageHeader');
                if (oModel) {
                    sCompanyId = oModel.getProperty('/companyId');
                }
            }
        }
        return sCompanyId;
    }

    /**
     * @inner
     * @param {Object} oOptions
     * @return {String}
     */
    function getThemeBaseUrl(oOptions) {
        var sBaseUrl = oOptions && oOptions.baseUrl;
        return sBaseUrl || '';
    }


    var ThemeUtil = {
        /**
         * This will give the actual config JSON which contains main company
         * configurable attributes.
         * 
         * @param {Object=} oOptions
         * @param {String=} oOptions.baseUrl
         * @param {String=} oOptions.companyId
         * @return {Promise} A promise for the company theme config object
         */
        getThemeConfig : function(oOptions) {
            return ThemeUtil.getCompanyTheme(oOptions).then(function(oResponse) {
                var sThemeConfigUrl = getThemeBaseUrl(oOptions) + oResponse.urls.config + '&jsonp=?';
                return $.ajax({
                    url : sThemeConfigUrl,
                    dataType : 'jsonp'
                });
            });
        },

        /**
         * Deferred JSON Structure:
         * 
         * {id: String, lastModifiedDate: Long, urls: {config: String, css:
         * String}}
         * 
         * @param {Object=} oOptions
         * @param {String=} oOptions.baseUrl
         * @param {String=} oOptions.companyId
         * @return {Promise} A promise for the company theme
         */
        getCompanyTheme : function(oOptions) {
            var sCompanyId = getThemeCompanyId(oOptions);
            var sThemeUrl = getThemeBaseUrl(oOptions) + '/public/theme-api/info/' + getThemeCompanyId(oOptions) + ';jsonp=?';
            return $.ajax({
                url : sThemeUrl,
                dataType : 'jsonp'
            }).promise();
        }
    };
    
    $.sap.setObject('sap.sf.surj.util.ThemeUtil', ThemeUtil);
    return ThemeUtil;
});