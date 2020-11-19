sap.ui.define([
    './Util',
    './NameFormatter'
], function(Util, NameFormatter) {
    'use strict';

    var URLTYPE_PARAM_MAP = {
        localpicture : {
            photoAction : 'ps_p_action',
            photoType : 'p_type',
            userId : 'ps_p_uid'
        },
        eduPhoto : {
            photoAction : 'photo_action',
            photoType : 'photo_type',
            userId : 'user_id',
            userIdEncoded : 'user_id_encoded'
        }
    };

    var PHOTOSRC_DEFAULTS = {
        photoType : 'quickCard',
        photoAction : 'show'
    };

    /**
     * Utility to define formatter functions related to displaying a photo for a User, and formatting the name/initials to be
     * displayed in tooltips.
     */
    var UserPhotoUtil = {
        globalPhotoCacheEnabled: null,
        globalInvalidateCache: new Date().getTime(),

        /**
         * Shortcut to format a user photo using urlType="eduPhoto".
         * 
         * @see #formatUserPhoto
         * @param {String} userId The user id (required)
         * @param {String=} photoType The photoType, default is "quickCard"
         */
        formatUserPhotoSimple: function(userId, photoType) {
            return UserPhotoUtil.formatUserPhoto({
                urlType: 'eduPhoto',
                photoType: photoType,
                userId: userId
            });
        },

        /**
         * Convenience function to format a photo using the default urlType of 'eduPhoto' instead.
         * 
         * @see sap.sf.surj.shell.util.UserPhotoUtil#formatUserPhoto
         */
        formatEduPhoto: function() {
            return UserPhotoUtil.formatUserPhoto.apply(UserPhotoUtil, Array.prototype.slice(arguments).concat([{
                urlType: 'eduPhoto'
            }]));
        },

        /**
         * Construct a photo url given various options. Only user id is
         * required.
         * 
         * Example:
         * 
         * <pre>
         * var sPhotoUrl = sap.sf.surj.shell.controls.UserPhotoSrc.parse({userId:'cgrant1'});
         * </pre>
         * 
         * @param {Object...=} oValue Variable settings/entities to add more photo specific values.
         * 
         * @param {String} oValue.userId The user id
         * 
         * @param {String=} oValue.urlType Default is localpicture
         * 
         * @param {String=} oValue.photoType e.g. original, liveProfile,
         *            orgChart, quickCard, empDir, userExpressivePhoto
         * 
         * @param {String=} oValue.baseUrl Optional url to prepend
         * 
         * @param {String=} oValue.companyId Defaults to global company id
         * 
         * @param {String=} oValue.photoAction the photo action (applicable when
         *            urlType == 'localpicture'), e.g. "show"
         * 
         * @param {String=} oValue.mod used to specify the state of the photo
         * 
         * @param {Number=} oValue.expires Optional cache expire string
         * 
         * @param {boolean=} oValue.clientPhotoCachingEnabled flag used to
         *            specify whether photo caching is enabled or not; normally,
         *            this configuration is pulled automatically from a '<meta
         *            id="clientPhotoCachingEnabled">' tag, so no need to
         *            specify this flag in that case
         */
        formatUserPhoto: function(oValue) {
            /**
             * Find a property, since formatUserPhoto can take a variable number of entities/settings to allow flexibility
             * we search them all for a particular property.
             * @inner
             * @param {String} sProperty 
             */
            function findProperty(sProperty) {
                for (var i=0; i<aArguments.length; i++) {
                    var oArg = aArguments[i];
                    if (oArg && oArg[sProperty] != null) {
                        return oArg[sProperty]
                    }
                }
            }

            if (typeof oValue == 'string') {
                return oValue;
            }

            var aArguments = arguments,
                sUrlType = findProperty('urlType') || 'localpicture',
                oParamNames = URLTYPE_PARAM_MAP[sUrlType];

            if (!oParamNames) {
                throw new Error("Invalid urlType: " + sUrlType);
            }

            var companyId = findProperty('companyId');
            if (!companyId) {
                if (window.pageHeaderJsonData) {
                    companyId = pageHeaderJsonData.companyId;
                }
                if (!companyId) {
                    var oPageHeaderModel = sap.ui.getCore().getModel('pageHeader');
                    companyId = oPageHeaderModel && oPageHeaderModel.getProperty('/companyId');
                }
            }

            var oParams = {};

            if (companyId) {
                oParams.companyId = companyId;
            }

            Object.keys(oParamNames).forEach(function(sAttributeName) {
                var sParamName = oParamNames[sAttributeName],
                    sValue = findProperty(sAttributeName) || PHOTOSRC_DEFAULTS[sAttributeName];
                if (sValue) {
                    oParams[sParamName] = sValue;
                }
            });

            var bPhotoCachingEnabled = findProperty('clientPhotoCachingEnabled');
            if (bPhotoCachingEnabled || (bPhotoCachingEnabled == null && UserPhotoUtil.isPhotoCachingEnabled())) {
                oParams.mod = findProperty('mod') || '';
                var vExpires = findProperty('expires');
                if (typeof vExpires == 'number') {
                    oParams.expires = vExpires;
                }
            } else {
                oParams.invalidateCache = findProperty('invalidateCache') || UserPhotoUtil.globalInvalidateCache;
            }

            return Util.ensureBaseDomain('/' + sUrlType + '/view' + Object.keys(oParams).reduce(function(sQuery, sParamName) {
                return sQuery + (sQuery ? '&' : '?') + encodeURIComponent(sParamName) + '=' + encodeURIComponent(oParams[sParamName]);
            }, ''));
        },

        /**
         * Get the photo mod.
         * @param {String} sPhotoId The photo id
         * @param {Number} iPhotoLastModifiedTime The last modified timestamp
         * @return {Boolean}
         */
        getPhotoMod: function(sPhotoId, iPhotoLastModifiedTime) {
            if (sPhotoId && iPhotoLastModifiedTime) {
                return sPhotoId + "_" + iPhotoLastModifiedTime;
            } else {
                return "";
            }
        },

        /**
         * Check if photo caching is enabled globally.
         * @return {Boolean}
         */
        isPhotoCachingEnabled: function() {
            var bGlobalPhotoCacheEnabled = UserPhotoUtil.globalPhotoCacheEnabled;
            if (typeof bGlobalPhotoCacheEnabled == 'boolean') {
                return bGlobalPhotoCacheEnabled;
            }
            var pageHeaderJsonData = window.pageHeaderJsonData;
            var settings = pageHeaderJsonData && pageHeaderJsonData.settings;
            if (settings) {
                bGlobalPhotoCacheEnabled = (String(settings.clientPhotoCachingEnabled) == 'true');
            } else {
                var oMeta = document.getElementById('clientPhotoCachingEnabled');
                bGlobalPhotoCacheEnabled = oMeta && oMeta.content == 'true';
            }
            return UserPhotoUtil.globalPhotoCacheEnabled = !!bGlobalPhotoCacheEnabled;
        },

        /**
         * Format a user's initials given the User entity. The initials for the user, usually the first character 
         * of first/last name. The order depends on language.
         * @param {Object|String} oUser The UserEntity, or the full name string.
         * @return {String} 
         */
        formatInitials: function(oUser) {
            var aInitial = [];
            if (typeof oUser == 'string') {
                oUser = {
                    fullName: oUser
                };
            }
            if (oUser) {
                var bFirstNameFirst = NameFormatter.isFirstNameFirst();
                var sFirstName = oUser.firstName || oUser.fn;
                var sLastName = oUser.lastName || oUser.ln;
                var sFullName = oUser.fullName || oUser.defaultFullName;
                var sFirstInitial = sFirstName && (sFirstName.charAt(0));
                var sLastInitial = sLastName && (sLastName.charAt(0));
                sFirstInitial && aInitial.push(sFirstInitial);
                sLastInitial && aInitial.push(sLastInitial);
                if (!bFirstNameFirst && aInitial.length > 1) {
                    aInitial.reverse();
                }
                // if there is no first/lastname, but there is a fullName,
                // then take the first 2 letters at the beginning of each word boundary of the fullName
                if (aInitial.length == 0 && sFullName) {
                    var initial = oUser.fullName.match(/\b(\w)/g);
                    if (!initial) { // fallback incase the parsing fails for some chinese characters
                        initial = oUser.fullName.match(/^\s*\S/g);
                    }
                    // This is just incase even the fallback returns null, then just return the First char to be safe
                    if (initial) {
                        aInitial = initial.slice(0, 2);                    
                    } else {
                        aInitial = sFullName.charAt(0);
                    }
                }
            }
            return aInitial.map(function(sInitial) {
                return sInitial.toUpperCase();
            }).join('');
        },

        /**
         * Format the full name to be used in the photo tooltip.
         * @see sap.sf.surj.shell.util.NameFormatter#format
         * @param {Object} oUser The user entity
         * @return {String}
         */
        formatFullName: function(oUser) {
            if (!oUser) {
                return null;
            }
            var sFullName = oUser.defaultFullName;
            if (!sFullName) {
                sFullName = NameFormatter.format(oUser);
            }
            return sFullName;
        }
    };

    return UserPhotoUtil;
});