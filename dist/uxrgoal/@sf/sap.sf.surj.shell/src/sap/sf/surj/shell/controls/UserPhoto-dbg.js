/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.UserPhoto.
jQuery.sap.declare("sap.sf.surj.shell.controls.UserPhoto");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new UserPhoto.
 * 
 * Accepts an object literal <code>mSettings</code> that defines initial 
 * property values, aggregated and associated objects as well as event handlers. 
 * 
 * If the name of a setting is ambiguous (e.g. a property has the same name as an event), 
 * then the framework assumes property, aggregation, association, event in that order. 
 * To override this automatic resolution, one of the prefixes "aggregation:", "association:" 
 * or "event:" can be added to the name of the setting (such a prefixed name must be
 * enclosed in single or double quotes).
 *
 * The supported settings are:
 * <ul>
 * <li>Properties
 * <ul></ul>
 * </li>
 * <li>Aggregations
 * <ul></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul></ul>
 * </li>
 * </ul> 

 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * @extends sap.ui.core.Control
 * @version 1.0.2-SNAPSHOT
 *
 * @constructor
 * @public
 * @name sap.sf.surj.shell.controls.UserPhoto
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.UserPhoto", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.UserPhoto with name <code>sClassName</code> 
 * and enriches it with the information contained in <code>oClassInfo</code>.
 * 
 * <code>oClassInfo</code> might contain the same kind of informations as described in {@link sap.ui.core.Element.extend Element.extend}.
 *   
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] object literal with informations about the class  
 * @param {function} [FNMetaImpl] constructor function for the metadata object. If not given, it defaults to sap.ui.core.ElementMetadata.
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.sf.surj.shell.controls.UserPhoto.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/UserPhoto.js
/**
 * This is the pure UI5 implementation of UserPhoto.
 * 
 * A User Photo consists of a photo that is cropped to a specific dimension. It
 * can also contain an optional name displayed next to it.
 * 
 * Also utility functions are exposed that can construct a user photo URL given
 * just the user information.
 * 
 * Example Control Usage:
 * 
 * <pre>
 * new sap.sf.surj.shell.controls.UserPhoto({
 *     user : '{pageHeader>/userInfo}',
 *     profile : sap.sf.surj.shell.controls.PhotoProfile.CIRCLE_40,
 *     nameDirection : sap.sf.surj.shell.controls.NameDirection.EAST
 * });
 * </pre>
 * 
 * Example Utility Usage:
 * 
 * <pre>
 * var sPhotoUrl = sap.sf.surj.shell.controls.UserPhotoSrc.parse({
 *   userId : 'cgrant1',
 *   urlType : 'eduPhoto'
 * });
 * </pre>
 * 
 * For Avatar Rendering:
 * <pre>
 * new sap.sf.surj.shell.controls.UserPhoto({
 *     user : '{pageHeader>/userInfo}',
 *     useAvatar: true,
 *     displaySize: 'M',
 *     displayShape: 'Circle',
 *     nameDirection : sap.sf.surj.shell.controls.NameDirection.EAST,
 *     nameWidth: '200px'
 * });
 * </pre>
 * 
 * @class
 * @name sap.sf.surj.shell.controls.UserPhoto
 * @extends sap.ui.core.Control
 */
sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/Control',
    'sap/ui/base/DataType',
    'sap/ui/Device',
    'sap/ui/core/Icon',
    '../util/UserPhotoUtil',
    '../util/NameFormatter',
    '../util/Config',
    '../util/DeferredUtil',
    '../util/Util'
], function($, Control, DataType, Device, Icon, UserPhotoUtil, NameFormatter, Config, DeferredUtil, Util) {
    var lib = 'sap.sf.surj.shell';
    var pkg = lib + '.controls';
    var Pkg = $.sap.getObject(pkg, false);

    // ---------------------------------------------------------------------------
    // Data Types
    // ---------------------------------------------------------------------------

    /**
     * These properties are added to all profiles unless the profile explicitly
     * defines the value to override it.
     * 
     * @inner
     */
    var DEFAULT_PROFILE = {
        circle : false,
        cropping : 'MIDDLE_MIDDLE',
        fullNameInitials : false,
        maxHeight : 30,
        minFontSize : 8
    };

    var sImagePath = sap.ui.resource('sap.sf.surj.shell.img.userphoto', '');
    var PLACEHOLDERS = {
        P_180_240: sImagePath + 'UserPhotoPlaceholder_180x240.png',
        P_60_80: sImagePath + 'UserPhotoPlaceholder_60x80.png',
        S_112: sImagePath + 'UserPhotoPlaceholder_112x112.png',
        S_50: sImagePath + 'UserPhotoPlaceholder_50x50.png',
        S_30: sImagePath + 'UserPhotoPlaceholder_30x30.png'
    };

    /**
     * Built-in photo profiles.
     * 
     * The <code>DEFAULT_PROFILE</code> will be added to each one of these, as
     * well as the standard "css" attribute, ex: "surjUserPhoto-CIRCLE_234"
     * 
     * @lends sap.sf.surj.shell.controls.PhotoProfile
     */
    var PREDEFINED_PROFILES = {
        PORTRAIT_180_240 : {
            width : '180px',
            height : '240px',
            fullNameInitials : true,
            placeholder : PLACEHOLDERS.P_180_240
        },
        PORTRAIT_60_80 : {
            width : '60px',
            height : '80px',
            placeholder : PLACEHOLDERS.P_60_80
        },
        CIRCLE_234 : {
            circle : true,
            width : '234px',
            height : '234px',
            placeholder : PLACEHOLDERS.S_112
        },
        CIRCLE_180 : {
            circle : true,
            width : '180px',
            height : '180px',
            placeholder : PLACEHOLDERS.S_112
        },
        CIRCLE_140 : {
            circle : true,
            width : '140px',
            height : '140px',
            placeholder : PLACEHOLDERS.S_112
        },
        CIRCLE_90 : {
            circle : true,
            width : '90px',
            height : '90px',
            placeholder : PLACEHOLDERS.S_112
        },
        CIRCLE_40 : {
            circle : true,
            width : '40px',
            height : '40px',
            placeholder : PLACEHOLDERS.S_50
        },
        CIRCLE_64 : {
            circle : true,
            width : '64px',
            height : '64px',
            placeholder : PLACEHOLDERS.S_50
        },
        SQUARE_112 : {
            width : '112px',
            height : '112px',
            placeholder : PLACEHOLDERS.S_112
        },
        SQUARE_64 : {
            width : '64px',
            height : '64px',
            placeholder : PLACEHOLDERS.S_50
        },
        SQUARE_50 : {
            width : '50px',
            height : '50px',
            placeholder : PLACEHOLDERS.S_50
        },
        SQUARE_40 : {
            width : '40px',
            height : '40px',
            placeholder : PLACEHOLDERS.S_50
        },
        SQUARE_30 : {
            width : '30px',
            height : '30px',
            placeholder : PLACEHOLDERS.S_30
        }
    };

    /**
     * Url types correspond with different image servlets.
     * 
     * @inner
     */
    var URL_TYPES = {
        LOCAL : 'localpicture',
        EDU : 'eduPhoto'
    };

    /**
     * Validate a photo src object with these attributes.
     * 
     * @inner
     */
    var PHOTOSRC_VALIDATION = {
        userId : ['string', null],
        userIdEncoded : ['string', null],
        urlType : [ URL_TYPES.LOCAL, URL_TYPES.EDU, null ],
        photoType : [ 'string', null ],
        clientPhotoCachingEnabled : [ 'boolean', null ],
        baseUrl : [ 'string', null ],
        mod : [ 'string', 'number', null ]
    };

    /**
     * @inner
     */
    var PHOTOSRC_DEFAULTS = {
        photoType : 'quickCard'
    };

    /**
     * Validate a profile object.
     */
    var PROFILE_VALIDATION = {
        width : [ 'string', 'number', null ],
        height : [ 'string', 'number', null ],
        placeholder : [ 'string', null ],
        circle : [ 'boolean', null ],
        textOnSilhouette : [ 'initial', 'full', null ],
        css : [ 'string', null ],
        imageCss : [ 'string', null ],
        nameCss : [ 'string', null ],
        maxHeight : [ 'number', null ],
        minFontSize : [ 'number', null ]
    };

    /**
     * Each photo type has different query string parameter names.
     * 
     * @inner
     */
    var URLTYPE_PARAM_MAP = {
        localpicture : {
            photoAction : 'ps_p_action',
            photoType : 'p_type',
            userId : 'ps_p_uid'
        },
        eduPhoto : {
            photoType : 'photo_type',
            userId : 'user_id',
            userIdEncoded : 'user_id_encoded'
        }
    };

    /**
     * The PhotoProfile enumerates the commonly used photo sizes, as well as
     * acting as the DataType with validation.
     * 
     * @see PREDEFINED_PROFILES The profiles added to the enum
     * @name sap.sf.surj.shell.controls.PhotoProfile
     * @type sap.ui.base.DataType
     */
    var PhotoProfile = $.extend(DataType.createType(pkg + '.PhotoProfile', {
        isValid : function(oValue) {
            var sType = typeof oValue;
            if (typeof oValue == 'string') {
                return !!PREDEFINED_PROFILES[oValue]
            } else {
                return Config.validate(oValue, PROFILE_VALIDATION);
            }
        }
    }), PREDEFINED_PROFILES);

    /**
     * Data type validation for a user's photoSrc attribute. It can be either a
     * string, or an object with its own validation.
     * 
     * @see PHOTOSRC_VALIDATION
     * @name sap.sf.surj.shell.controls.UserPhotoSrc
     * @type sap.ui.base.DataType
     */
    var UserPhotoSrc = DataType.createType(pkg + '.UserPhotoSrc', {
        isValid : function(oValue) {
            return Config.validate(oValue, [ 'string', null, PHOTOSRC_VALIDATION ]);
        }
    });

    $.sap.setObject(pkg + '.PhotoProfile', PhotoProfile);
    $.sap.setObject(pkg + '.UserPhotoSrc', UserPhotoSrc);

    /**
     * Cropping types, how to fit the image to predefined dimensions. Which part
     * of the image is cropped or cut off.
     * 
     * @name sap.sf.surj.shell.controls.Cropping
     * @type sap.ui.base.DataType
     */
    $.sap.setObject(pkg + '.Cropping', {
        START : 'START', // aka left/top
        END : 'END', // aka right/bottom
        BOTH : 'BOTH', // aka both edges
        SCALE : 'SCALE' // aka no crop
    });

    /**
     * Define where to place the user's name in correlation with the photo.
     * 
     * @name sap.sf.surj.shell.controls.NameDirection
     */
    $.sap.setObject(pkg + '.NameDirection', {
        NORTH : 'NORTH',
        EAST : 'EAST',
        WEST : 'WEST',
        SOUTH : 'SOUTH',
        CENTER : 'CENTER'
    });

    /**
     * Defines the data type for the UserInfo object. You can either directly
     * provide the photoSrc and/or hiResPhotoSrc, or you can provide an object
     * which defines the options to generate the url from the user id.
     * 
     * @name sap.sf.surj.shell.controls.UserInfo
     */
    var UserInfo = Config.createDataType(pkg + '.UserInfo', {
        userId : [ 'string', null ],
        firstName : [ 'string', null ],
        mi : [ 'string', null ],
        lastName : [ 'string', null ],
        photoSrc : [ Config.dataType(pkg + '.UserPhotoSrc'), null ],
        hiResPhotoSrc : [ Config.dataType(pkg + '.UserPhotoSrc'), null ]
    });

    // ---------------------------------------------------------------------------
    // Control Class Definition
    // ---------------------------------------------------------------------------

    var UserPhoto = Control.extend(pkg + '.UserPhoto', /** @lends sap.sf.surj.shell.controls.UserPhoto.prototype */
    {
        metadata : {
            library : lib,
            interfaces : [ pkg + '.IUserPhoto' ],
            properties : {
                /** The user info object containing the name and url options. */
                user : pkg + '.UserInfo',

                /** 
                 * The options for the user object, deprecated, use the properties directly on the class. 
                 * Example, one option might be profile, directly use profile as a property instead
                 */
                options : {
                    type : 'object',
                    defaultValue : null
                },

                /** The profile, can be string or object form. */
                profile : pkg + '.PhotoProfile',

                /** How should the photo be cropped on the x axis. */
                horizontalCrop : {
                    type : pkg + '.Cropping',
                    defaultValue : Pkg.Cropping.BOTH
                },

                /** How should the photo be cropped on the y axis. */
                verticalCrop : {
                    type : pkg + '.Cropping',
                    defaultValue : Pkg.Cropping.BOTH
                },

                /** The direction of the name in relation to photo. */
                nameDirection : {
                    type : pkg + '.NameDirection',
                    defaultValue : Pkg.NameDirection.SOUTH
                },

                /** Can the user focus on this photo? */
                focusable : 'boolean',

                /** Show the user name or not. */
                showUserName : 'boolean',

                /** Show the highlight on hover. */
                showHoverBorder : 'boolean',

                /** Keys are additional user information to display. */
                keys : {
                    type : 'string[]'
                },

                /* The width of the displayed name */
                nameWidth: {type : "sap.ui.core.CSSSize", group : "Misc", defaultValue : null},

                /** Match width of name to width of photo. Will be ignored if nameWidth is provided. */
                wideAsPhoto : 'boolean',

                /** Match height of name to height of photo. */
                tallAsPhoto : 'boolean',

                /** Shrink the name to fit. */
                shrinkNameToFit : 'boolean',

                /** Will display user name on the silhouette when no photo */
                showNameWhenNoPhoto : {
                    type : 'boolean',
                    defaultValue : true
                },

                /** User can control style for the photo name */
                passedInNameStyle : 'string',

                /** Use can control class name for inner div. */
                useMButtonStyles : 'boolean',
                
                /** What is the button type. */
                buttonType : 'string',

                /** Will the name be split into individual parts. */
                splitName : {
                    type : 'boolean',
                    defaultValue : false
                },

                /** Render using sap.f.Avatar */
                useAvatar : {type : 'boolean', group: "Appearance", defaultValue : false},
                /**
                 * Defines the shape of the <code>Avatar</code>.
                 */
                displayShape: {type: "any", group: "Appearance", defaultValue: 'Circle'},
                /**
                 * Sets a predefined display size of the <code>Avatar</code>.
                 */
                displaySize: {type: "any", group: "Appearance", defaultValue: 'M'},

                showMenuIcon : 'boolean',

                highlightText : 'string',
                
                ariaLabel : 'string'
            },

            aggregations : {
                _menuIcon : {
                    type : 'sap.ui.core.Icon',
                    visibility : 'hidden',
                    multiple : false
                }
            },

            events : {
                ready : {},
                click : {},
                mouseover : {},
                mouseout : {},
                touchstart : {},
                touchend : {},
                keydown : {}
            }
        },

        /**
         * @param {Event} oEvent
         */
        onAfterRendering : function(oEvent) {
            var oEl = this.$();
            this._bindDomEvents(oEl);
            if (this.getFocusable()) {
                oEl.attr('type', 'button');
            }
            if (!this.mAspectRatio) {
                this._bindImageEvents($('img.surjUserPhotoImg', oEl));
            } else {
                this._updateStyles();
            }
            if (this.getShrinkNameToFit()) {
                this._shrinkNameToFit(oEl);
            }
        },

        /**
         * Handle the key down event for SPACE and ENTER. This implementation
         * differs from that of commons button. Commons listens to the click
         * event and ignores touchstart.
         * 
         * @param {jQuery.Event} oEvent - the keyboard event.
         * @private
         */
        onkeydown : function(oEvent) {
            var keyCombo;
            if (oEvent.ctrlKey && oEvent.shiftKey && oEvent.keyCode == 49) {
                keyCombo = 'control-shift-1';
            }
            if (oEvent.which === jQuery.sap.KeyCodes.SPACE || oEvent.which === jQuery.sap.KeyCodes.ENTER) {
                this._activeButton();
            }
            this.fireKeydown({
                keyEvent : oEvent,
                keyCombo : keyCombo
            });
        },

        /**
         * Handle the key up event for SPACE and ENTER.
         * 
         * @param {jQuery.Event} oEvent - the keyboard event.
         * @private
         */
        onkeyup : function(oEvent) {
            if (oEvent.which === jQuery.sap.KeyCodes.SPACE || oEvent.which === jQuery.sap.KeyCodes.ENTER) {
                this._inactiveButton();
            }
        },

        ontouchstart : function(oEvent) {
            if (oEvent.targetTouches.length === 1) {
                this._activeButton();
            }
        },

        ontouchend : function() {
            this._inactiveButton();
        },

        ontouchcancel : function() {
            this._inactiveButton();
        },

        /**
         * @private
         */
        _activeButton : function() {
            if (this.getUseMButtonStyles()) {
                this.$("inner").addClass("sapMBtnActive");
            }
        },

        /**
         * @private
         */
        _inactiveButton : function() {
            if (this.getUseMButtonStyles()) {
                this.$("inner").removeClass("sapMBtnActive");
            }
        },

        /**
         * @overrides
         * @param {Object} oUser
         * @param {Boolean=} bAnimate
         */
        setUser : function(oUser, bAnimate) {
            var useAvatar = this.getUseAvatar();
            this.setProperty('user', oUser, !useAvatar);
            this.refreshImage(bAnimate);
        },

        /**
         * Refresh the image DOM with a new image object.
         * 
         * @param {Boolean=} bAnimate
         */
        refreshImage : function(bAnimate) {
            if (this.getUseAvatar()) {
                var oAvatar = this._oAvatar;
                oAvatar && oAvatar.setSrc(this.getPhotoSrc());
                return;
            }

            var oEl = this.$();
            var oReplaceDom = $('img.surjUserPhotoImg', oEl).removeClass('surjUserPhotoImg');
            var oContainer = oReplaceDom.length || $('.surjUserPhotoWrapper', oEl);
            this.mAspectRatio = null;
            if (oReplaceDom.length || oContainer.length) {
                var oImg = $('<img class="surjUserPhotoImg">').attr({
                    src : this.getPhotoSrc(),
                    title : this.getTooltip_AsString() || this.getFullName(),
                    alt : this.getTooltip_AsString() || this.getFullName()
                }).css(UserPhotoRenderer.getImageStyles(this));
                this._bindImageEvents(oImg);
                if (oReplaceDom.length == 0) {
                    oContainer.prepend(oImg);
                } else if (bAnimate) {
                    oImg.insertAfter(oReplaceDom);
                    oReplaceDom.css({
                        position : 'absolute'
                    }).fadeOut(function() {
                        oReplaceDom.remove();
                    });
                } else {
                    oReplaceDom.replaceWith(oImg);
                }
            }
        },

        /**
         * @private
         * @param {jQuery} oImg
         */
        _bindImageEvents : function(oImg) {
            var _this = this;
            oImg && oImg.length && oImg.bind('load', function() {
                getImageAspectRatio(this).done(function(nAspectRatio) {
                    _this.mAspectRatio = nAspectRatio;
                    _this._updateStyles();
                    _this.fireReady();
                });
            }).bind('fail', function() {
                _this.mAspectRatio = null;
                _this.mBackupImage = true;
                _this.refreshImage();
            });
        },

        /**
         * @private
         * @param {jQuery} oEl
         */
        _bindDomEvents : function(oEl) {
            var _this = this;
            $.each([ 'click', 'mouseover', 'mouseout', 'touchstart', 'touchend' ], function(nIdx, nEventName) {
                oEl.bind(nEventName, function() {
                    _this.fireEvent(nEventName, {
                        user : _this.getUser()
                    });
                });
            });
        },

        /**
         * Shrink the font-size of the name so that the text will fit within the
         * width of the image.
         * 
         * @private
         * @param {jQuery} oEl
         */
        _shrinkNameToFit : function(oEl) {
            var oProfile = this.getProfile();
            $('.surjUserPhotoName, .surjUserPhotoNameNoPhoto', oEl).each(function() {
                var oEl = $(this);
                var nWidth = parseInt(oEl.css('width')) || parseInt(oEl.css('max-width'));
                if (!isNaN(nWidth)) {
                    // TODO: GET RID OF THIS OR MOVE IT
                    var sFontSize = getOptimizedFontSize(oEl.text(), this, $.extend({}, oProfile, {
                        width : nWidth
                    }));
                    oEl.css('font-size', sFontSize);
                }
            });
        },

        /**
         * @private
         */
        _updateStyles : function() {
            var oEl = this.$();
            if (oEl.length) {
                var oStyles = UserPhotoRenderer.getImageStyles(this);
                oStyles && $('.surjUserPhotoImg', oEl).css(oStyles);
                oStyles = UserPhotoRenderer.getNameStyles(this);
                oStyles && $('.surjUserPhotoName', oEl).css(oStyles)
                oStyles = UserPhotoRenderer.getImageWrapperStyles(this);
                oStyles && $('.surjUserPhotoWrapper', oEl).css(oStyles);
            }
        },

        /**
         * @public
         */
        updateStyles : function() {
            this._updateStyles();
        },

        /**
         * If user gave string as profile, return the profile object instead.
         * 
         * @return {Object}
         */
        getProfile : function() {
            return PhotoProfile.parse(this.getProperty('profile'));
        },

        /**
         * A helper to fetch the full name from the user object.
         * 
         * @return {String}
         */
        getFullName : function() {
            var oUser = this.getUser();

            if (!oUser) {
                return '';
            }

            /*
             * Use NameFormatter as a backup only if user object does not have a
             * full name.
             */
            var sFullName = oUser.name || oUser.fullName;
            if (sFullName) {
                return sFullName;
            } else {
                return NameFormatter.format(oUser);
            }
        },

        /**
         * A helper to fetch the user's initials.
         * 
         * @return {String}
         */
        getNameInitials : function() {
            return UserPhotoUtil.formatInitials(this.getUser());
        },

        /**
         * The following statement will always execute <code>true</code> when
         * using <em>en_US</em> locale:
         * 
         * <pre>
         * NameFormatter.splitFullName({firstName:'fn', lastName:'ln'}).join(' ') === 'fn ln'
         * </pre>
         * 
         * That is important for the following reasons:
         * 
         * <ul>
         * <li>Locale dictates the ordering and placement of each fragment.</li>
         * <li>The white space will always preserved.</li>
         * </ul>
         * 
         * @return {Array.<String>} An array of name fragments
         */
        getNameLines : function() {
            if (this.getSplitName()) {
                return NameFormatter.splitFullName(this.getUser());
            } else {
                return [ this.getFullName() ];
            }
        },

        /**
         * @return {Boolean}
         */
        hasPhoto : function() {
            var oUser = this.getUser();
            return oUser && oUser.photoSrc;
        },

        /**
         * Utility to get one of the following:
         * 
         * 1) High resolution user photo if supported
         * 
         * 2) Standard resolution user photo if supported
         * 
         * 3) A backup placeholder url if no photo or failure to load
         * 
         * @return {String}
         */
        getPhotoSrc : function() {
            var oUser = this.getUser();
            var bUseAvatar = this.getUseAvatar();
            if (!oUser) {
                return bUseAvatar ? 'sap-icon://person-placeholder' : null;
            }

            var oPhotoSrc = oUser.photoSrc;
            /*
             * Use the high resolution image if enabled, backup to regular image
             * if high resolution version is not provided.
             */
            if (isHighResolutionPhotoEnabled()) {
                oPhotoSrc = oUser.hiResPhotoSrc || oPhotoSrc;
            }
            if (oPhotoSrc == null || this.mBackupImage) {
                var oProfile = this.getProfile();
                if (oProfile.placeholder) {
                    return bUseAvatar ? null : oProfile.placeholder;
                } else {
                    return bUseAvatar ? null : sImagePath + 'UserPhotoPlaceholder_180x240.png';
                }
            } else {
                return UserPhotoSrc.parse(oPhotoSrc);
            }
        },

        /**
         * Options will send the attributes of the object as properties to this class.
         *
         * @param {Object} oOptions
         */
        setOptions : function(oOptions) {
            this.setProperty('options', oOptions, true);
            var oMetadata = this.getMetadata();
            for (var sProperty in oOptions) {
                if (oMetadata.hasProperty(sProperty)) {
                    this.setProperty(sProperty, oOptions[sProperty]);
                }
            }
        },

        getAvatar : function() {
            if (!this._oAvatar) {
                $.sap.require('sap.f.Avatar');
                this._oAvatar = new sap.f.Avatar({
                    src: this.getPhotoSrc(),
                    initials: this.getNameInitials(),
                    displayShape: this.getDisplayShape(),
                    displaySize: this.getDisplaySize(),
                    tooltip: this.getFullName()
                }).addStyleClass('surjUserPhotoWrapper');
            }
            return this._oAvatar;
        }, 

        getAccessibilityInfo : function() {
            return {
                description: this.getTooltip_AsString() || this.getFullName()
            };
        }
    });

    /**
     * The renderer for the UserPhoto.
     * 
     * @name sap.sf.surj.shell.controls.UserPhotoRenderer
     */
    var UserPhotoRenderer = Pkg.UserPhotoRenderer = {
        /**
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.UserPhoto} oControl The control
         *            instance
         */
        render : function(oRm, oControl) {
            var sTag = oControl.getFocusable() ? 'button' : 'div';
            var bShowUserName = oControl.getShowUserName();
            var sNameDirection = oControl.getNameDirection();
            var sTooltip = oControl.getTooltip_AsString();
            var oProfile = oControl.getProfile();
            var sAriaLabel = oControl.getAriaLabel();
            oRm.write('<', sTag);
            oRm.writeControlData(oControl);
            if (oProfile.css) {
                oRm.addClass(oProfile.css);
            }
            if (oControl.getUseMButtonStyles()) {
                oRm.addClass('sapMBtn');
            }
            oRm.addClass('surjUserPhoto');
            if (oControl.getShowHoverBorder()) {
                oRm.addClass('surjUserPhotoHighlight');
            }

            if (bShowUserName) {
                oRm.addClass('surjUserPhotoName-' + sNameDirection);
            }
            if (oProfile.circle) {
                oRm.addClass('surjUserPhotoCircle');
            }
            if (oProfile.innerCss) {
                oRm.addClass(oProfile.innerCss);
            }
            oRm.writeClasses();
            
            if (sTooltip) {
                oRm.write(' title="');
                oRm.writeEscaped(sTooltip);
                oRm.write('"');
            }
            
            if (sAriaLabel) {
                oRm.write(' aria-label="');
                oRm.writeEscaped(sAriaLabel);
                oRm.write('"');
            }
            
            oRm.write('><div');
            oRm.writeAttribute('id', oControl.getId() + '-inner');
            oRm.addClass('surjUserPhotoInner');
            if (bShowUserName && sNameDirection == 'CENTER') {
                oRm.addClass('surjUserPhotoCentered');
            }
            if (oControl.getUseMButtonStyles()) {
                var sType = oControl.getButtonType() || 'Default';
                oRm.addClass('sapMBtn' + sType);
                oRm.addClass('sapMBtnHoverable sapMBtnInner sapMFocusable');
                if (Device.browser.internet_explorer || Device.browser.edge) {
                    oRm.addClass('sapMIE');
                }
            }
            oRm.writeClasses();
            oRm.write('>');
            if (oControl.getUseMButtonStyles() && (Device.browser.internet_explorer || Device.browser.edge)) {
                oRm.write('<span class=\"sapMBtnFocusDiv\"></span>');
            }
            if (bShowUserName) {
                switch (sNameDirection) {
                case 'WEST':
                case 'NORTH':
                    this.renderName(oRm, oControl);
                    this.renderImage(oRm, oControl);
                    break;
                case 'CENTER':
                    this.renderImage(oRm, oControl);
                    this.renderName(oRm, oControl);
                    break;
                default:
                    this.renderImage(oRm, oControl);
                    this.renderName(oRm, oControl);
                }
            } else {
                this.renderImage(oRm, oControl);
            }
            if (oControl.getShowMenuIcon()) {
                var oMenuIcon = oControl.getAggregation('_menuIcon');
                if (!oMenuIcon) {
                    oMenuIcon = new Icon({
                        src : 'sap-icon://slim-arrow-down'
                    });
                    oMenuIcon.setTooltip(sTooltip);
                    oControl.setAggregation('_menuIcon', oMenuIcon);
                }
                oRm.renderControl(oMenuIcon);
            }
            oRm.write('</div>');
            oRm.write('</', sTag, '>');
        },

        /**
         * Render the image wrapper and the image element. In a separate
         * function because the name and image positions in the DOM can swap
         * places.
         * 
         * The <code>_bindImageEvents</code> is called after rendering to
         * attach the load event onto the &lt;img&gt; tag.
         * 
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.UserPhoto} oControl The control
         *            instance
         */
        renderImage : function(oRm, oControl) {
            var useAvatar = oControl.getUseAvatar();
            if (useAvatar) {
                oRm.renderControl(oControl.getAvatar());
                return;
            }
            
            var oProfile = oControl.getProfile();
            var sPhotoSrc = oControl.getPhotoSrc();
            var sNameDirection = oControl.getNameDirection();
            oRm.write('<div');
            oRm.addClass('surjUserPhotoWrapper');
            if (oProfile.imageCss) {
                oRm.addClass(oProfile.imageCss);
            }
            oRm.writeClasses();
            renderStyles(oRm, this.getImageWrapperStyles(oControl));
            oRm.write('>');

            if (sPhotoSrc) {
                oRm.write('<img class="surjUserPhotoImg"');
                oRm.writeAttribute('src', sPhotoSrc);
                oRm.writeAttributeEscaped('title', oControl.getTooltip_AsString() || oControl.getFullName());
                oRm.writeAttributeEscaped('alt', oControl.getTooltip_AsString() || oControl.getFullName());
                renderStyles(oRm, this.getImageStyles(oControl));
                oRm.write('/>');
            }

            /*
             * When the user does not have a photo, optionally the name can
             * display on top of the photo. This only really should be done if
             * show user name is false, otherwise the name will display twice.
             */
            if (!oControl.hasPhoto() && oControl.getShowNameWhenNoPhoto() && !oControl.getShowUserName()) {
                oRm.write('<div class="surjUserPhotoNameNoPhoto">');
                /* Non-latin languages do not work well displaying initials */
                if (!$('body').hasClass('nonLatin') && !oProfile.fullNameInitials) {
                    oRm.writeEscaped(oControl.getNameInitials());
                } else {
                    this.renderNameFragments(oControl, oRm);
                }
                oRm.write('</div>');
            }

            oRm.write('</div>');
        },

        /**
         * Render just the name div and contents.
         * 
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.UserPhoto} oControl The control
         *            instance
         */
        renderName : function(oRm, oControl) {
            oRm.write('<div');
            var oProfile = oControl.getProfile();
            var sNameDirection = oControl.getNameDirection();
            var sNameStyle = oControl.getPassedInNameStyle();
            oRm.addClass('surjUserPhotoName');
            if (sNameStyle) {
                oRm.addClass(sNameStyle);
            }
            if (oProfile.nameCss) {
                oRm.addClass(oProfile.nameCss);
            }
            var aKeys = oControl.getKeys();
            aKeys && $.each(aKeys, function(nIdx, sKey) {
                oRm.addClass('surjUserPhotoHas' + sKey);
            });
            oRm.writeClasses();
            renderStyles(oRm, this.getNameStyles(oControl));
            oRm.write('>');
            this.renderKeysPreName(oControl, oRm);
            this.renderNameFragments(oControl, oRm);
            this.renderKeys(oControl, oRm);
            oRm.write('</div>');
        },

        /**
         * Render the user's name fragments.
         * 
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.UserPhoto} oControl The control
         *            instance
         */
        renderNameFragments : function(oControl, oRm) {
            var sHighlightText = oControl.getHighlightText();
            var oRegExp = sHighlightText && new RegExp(RegExp.escape(sHighlightText), "i");
            var aKeys = oControl.getKeys();
            var bAddWrapper = aKeys && aKeys.length > 0;
            bAddWrapper && oRm.write('<div class="surjName">');
            if (oControl.getSplitName()) {
                $.each(oControl.getNameLines(), function(nIdx, sFrag) {
                    oRm.write('<span');
                    oRm.addClass('surjNameFragment');
                    oRm.addClass('surjNameFragment' + nIdx);
                    oRm.writeClasses();
                    oRm.write('>');
                    if (sHighlightText) {
                        oRm.write($.sap.encodeHTML(sFrag).replace(oRegExp, function($1) {
                            return '<em>' + $1 + '</em>';
                        }));
                    } else {
                        oRm.writeEscaped(sFrag);
                    }
                    oRm.write('</span>');
                });
            } else {
                var sFullName = oControl.getFullName();
                if (sHighlightText) {
                    oRm.write($.sap.encodeHTML(sFullName).replace(oRegExp, function($1) {
                        return '<em>' + $1 + '</em>';
                    }));
                } else {
                    oRm.writeEscaped(sFullName);
                }
            }
            bAddWrapper && oRm.write('</div>');
        },

        /**
         * The user object may have additional user info keys to render.
         * 
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.UserPhoto} oControl The control
         *            instance
         */
        renderKeysPreName : function(oControl, oRm) {
            var oUser = oControl.getUser();
            var aKeys = oControl.getKeys();
            aKeys && $.each(aKeys, function(nIdx, sKey) {
                if (sKey == 'PHONE') {
                    var sValue = oUser && oUser.keys && oUser.keys[sKey];
                    oRm.write('<div');
                    oRm.addClass('globalFloatRight');
                    oRm.addClass('surjUserInfoKey');
                    oRm.addClass('surjUserInfoKey' + sKey);
                    oRm.writeClasses();
                    oRm.write('>');
                    sValue && oRm.writeEscaped(sValue);
                    oRm.write('</div>');
                }
            });
        },

        /**
         * The user object may have additional user info keys to render.
         * 
         * @param {sap.ui.core.RenderManager} oRm The render manager
         * @param {sap.sf.surj.shell.controls.UserPhoto} oControl The control
         *            instance
         */
        renderKeys : function(oControl, oRm) {
            var oUser = oControl.getUser();
            var aKeys = oControl.getKeys();
            aKeys && $.each(aKeys, function(nIdx, sKey) {
                if (sKey != 'PHONE') {
                    var sValue = oUser && oUser.keys && oUser.keys[sKey];
                    oRm.write('<div');
                    oRm.addClass('surjUserInfoKey');
                    oRm.addClass('surjUserInfoKey' + sKey);
                    oRm.writeClasses();
                    oRm.write('>');
                    sValue && oRm.writeEscaped(sValue);
                    oRm.write('</div>');
                }
            });
        },

        /**
         * Get the inline styles to apply to the inner div, which will be
         * precisely the width and height this photo should be.
         * 
         * If the image cannot fit it will be cut off with overflow:hidden.
         */
        getImageWrapperStyles : function(oControl) {
            var oProfile = oControl.getProfile();
            var oStyles = {};
            if (oProfile.width) {
                oStyles.width = oProfile.width;
            }
            if (oProfile.height) {
                oStyles.height = oProfile.height;
            }
            return oStyles;
        },

        /**
         * Given the state of the control, determine all inline styles which
         * need to be applied to the image. This includes width, height,
         * margin-left, margin-top. The width/height must be calculated from the
         * aspectRatio of the actual image, and the resulting size will be the
         * final size of the image. The values highly depend on what cropping
         * algorithm is used.
         * 
         * By default cropping is set to BOTH on both x and y axis, which means
         * that by default the photo will be centered and left/right top/bottom
         * edges will be cut off. This is done using a negative margin to crop.
         * 
         * In the case the crop is set to "SCALE" instead the margin will be
         * positive.
         * 
         * @param {sap.sf.surj.shell.controls.UserPhoto} oControl
         * @return {Object} The inline styles for the image
         */
        getImageStyles : function(oControl) {
            var mAspectRatio = oControl.mAspectRatio;
            var oProfile = oControl.getProfile();
            var oStyles;
            if (mAspectRatio) {
                var cssWidth = oProfile.width;
                var cssHeight = oProfile.height;
                if (!cssWidth || !cssHeight) {
                    var oWrapper = $('.surjUserPhotoWrapper', oControl.$());
                    if (!oWrapper.length) {
                        return {};
                    } else {
                        if (oWrapper.css('width') === "100%") {
                            return {};
                        } else {
                            cssWidth = oWrapper.css('width');
                            cssHeight = oWrapper.css('height');
                        }
                    }
                }
                var mWidth = parseInt(cssWidth, 10);
                var mHeight = parseInt(cssHeight, 10);
                var aParts = /^[\d\.]+(\w+)$/.exec(cssWidth);
                if (aParts) {
                    var sUnits = aParts[1];
                    var nAspectRatio = mWidth / mHeight;
                    var bMatchHeight = mAspectRatio > nAspectRatio;
                    var sCrop = bMatchHeight ? oControl.getHorizontalCrop() : oControl.getVerticalCrop();
                    if (sCrop == 'SCALE') {
                        bMatchHeight = !bMatchHeight;
                        sCrop = bMatchHeight ? oControl.getHorizontalCrop() : oControl.getVerticalCrop();
                    }
                    var nHeight, nWidth;
                    if (bMatchHeight) {
                        // If the height of the image is matched
                        nHeight = mHeight;
                        nWidth = Math.round(mHeight * mAspectRatio);
                    } else {
                        // Otherwise width is matched
                        nWidth = mWidth;
                        nHeight = Math.round(mWidth / mAspectRatio);
                    }
                    oStyles = {
                        opacity : 1,
                        width : nWidth + sUnits,
                        height : nHeight + sUnits
                    };
                    var dWidth = mWidth - nWidth;
                    var dHeight = mHeight - nHeight;
                    switch (sCrop) {
                    case 'SCALE':
                    case 'BOTH':
                        if (bMatchHeight) {
                            oStyles['margin-left'] = Math.round(dWidth / 2) + sUnits;
                        } else {
                            oStyles['margin-top'] = Math.round(dHeight / 2) + sUnits;
                        }
                        break;
                    case 'START':
                        if (bMatchHeight) {
                            oStyles['margin-left'] = -dWidth + sUnits;
                        } else {
                            oStyles['margin-top'] = -dHeight + sUnits;
                        }
                        break;
                    }
                }
            } else {
                /*
                 * If the mAspectRatio is not yet available, it means the image
                 * has not loaded yet and we do not know how to scale it. In
                 * this case we want a low opacity, match the width, and set
                 * height to auto.
                 */
                oStyles = {
                    opacity : '0.1'
                };
            }

            return oStyles;
        },

        /**
         * @param {sap.sf.surj.shell.controls.UserPhoto} oControl
         * @return {Object}
         */
        getNameStyles : function(oControl) {
            var oStyles = {
                display : '',
                'margin-left' : '0',
                'margin-right' : '0',
                'min-height' : '0'
            };
            if (oControl.getShowUserName()) {
                var oProfile = oControl.getProfile();
                var sNameDirection = oControl.getNameDirection();
                var sNameWidth = oControl.getNameWidth();
                if (sNameWidth) {
                    oStyles.width = sNameWidth;
                } else if (oControl.getWideAsPhoto()) {
                    oStyles.width = oProfile.width;
                } else if (oControl.getTallAsPhoto()) {
                    var sSide = sNameDirection == 'EAST' ? 'left' : 'right';
                    oStyles['min-height'] = oProfile.height;
                    oStyles['margin-' + sSide] = oProfile.width;
                }
            } else {
                oStyles.display = 'none';
            }
            return oStyles;
        }
    };

    $.extend(PhotoProfile, {
        /**
         * If the user passed string, create a new profile json object using the
         * defaults provided in the enumeration.
         * 
         * Example:
         * 
         * <pre>
         * var oProfile = sap.sf.surj.shell.controls.PhotoProfile.parse('CIRCLE_40');
         * console.log(JSON.stringify(oProfile)); // {"width":40,"height":40,"circle":true,"cropping":{"vertical":"MIDDLE","horizontal":"MIDDLE"},"textOnSilhouette":"initial"}
         * </pre>
         * 
         * @param {String|Object} oValue The profile value, can be a string,
         *            object enum value, or user custom-defined object that will
         *            validate properly.
         * @return {Object}
         */
        parse : function(oValue) {
            if (oValue === undefined) {
                return PhotoProfile.parse('PORTRAIT_180_240');
            }
            /**
             * @inner
             * @param {Object} oResult
             */
            function updateDimensions(oResult) {
                if (typeof oResult.width == 'number') {
                    oResult.width = oResult.width + 'px';
                }
                if (typeof oResult.height == 'number') {
                    oResult.width = oResult.height + 'px';
                }
            }
            /*
             * If passed a string, you want the global defaults combined with
             * defaults for this specific profile value.
             */
            if (typeof oValue == 'string') {
                var oResult = $.extend({
                    css : 'surjUserPhoto-' + oValue
                }, DEFAULT_PROFILE, PREDEFINED_PROFILES[oValue]);
                updateDimensions(oResult);
                return oResult;
            } else {
                /*
                 * If object directly passed, pretend as though the key of that
                 * object was passed instead.
                 */
                for ( var sKey in PREDEFINED_PROFILES) {
                    if (oValue === PREDEFINED_PROFILES[sKey]) {
                        return PhotoProfile.parse(sKey);
                    }
                }
                /*
                 * oValue must be a custom user-defined object. For good measure
                 * lets validate it to be proactive.
                 */
                if (PhotoProfile.isValid(oValue)) {
                    var oResult = $.extend({}, oValue);
                    updateDimensions(oResult);
                    return oValue;
                } else {
                    throw new Error('[UserPhoto] Invalid profile object provided');
                }
            }
        }
    });

    $.extend(UserPhotoSrc, {
        /** @deprecated */
        TYPES : URL_TYPES,

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
         * @deprecated
         * @see sap.sf.surj.shell.util.UserPhotoUtil#formatUserPhoto
         */
        parse : function(oValue) {
            if (UserPhotoSrc.isValid(oValue)) {
                return UserPhotoUtil.formatUserPhoto(oValue);
            }
            throw new Error('[UserPhoto] Invalid user info');
        },

        /**
         * Generated the mod property for the url based on the ID and the lastModifiedTime of the photo
         * 
         * @deprecated
         * @see sap.sf.surj.shell.util.UserPhotoUtil#getPhotoMod
         * @param {string} photoId   The ID of the photo
         * @param {string|number} photoLastModified The last modified time of the photo
         * @return {string} The mod property for the photo
         */
        getPhotoMod : UserPhotoUtil.getPhotoMod
    });

    var ASPECT_PROMISES = {};

    /**
     * @inner
     * @param {HTMLElement} oEl
     * @return {Promise}
     */
    function getImageAspectRatio(oEl) {
        var sImageUrl = oEl.src;
        if (!ASPECT_PROMISES[sImageUrl]) {
            var oDfd = $.Deferred();
            ASPECT_PROMISES[sImageUrl] = oDfd.promise();
            //There is an issue in IE that $El.width() and $El.height() would return wrong value
            //so add this timeout to make IE get the correct value
            setTimeout(function() {
                var $El = $(oEl);
                var iWidth = $El.width();
                var iHeight = $El.height();
                var ratio = iWidth / iHeight;
                if (!isNaN(ratio) && ratio < 2 && ratio > 0.5) {
                    oDfd.resolve(ratio);
                } else {
                    var oImg = new Image();
                    oImg.onload = function() {
                        oDfd.resolve(oImg.width / oImg.height);
                    };
                    oImg.src = oEl.src;
                }
            }, 100);
        }
        return ASPECT_PROMISES[sImageUrl];
    }

    /**
     * @inner
     * @return {Boolean}
     */
    function isHighResolutionPhotoEnabled() {
        return window.devicePixelRatio && (window.devicePixelRatio > 1);
    }

    /**
     * @inner
     * @param {sap.ui.core.RenderManager} oRenderManager
     * @param {Object} oStyles
     */
    function renderStyles(oRm, oStyles) {
        if (oStyles) {
            $.each(oStyles, function(sAttr, sValue) {
                oRm.addStyle(sAttr, sValue);
            });
            oRm.writeStyles();
        }
    }

    /**
     * Copied from surj.Util
     * 
     * @inner
     */
    function getOptimizedFontSize(sText, oContextElement, oConfig) {
        /**
         * Utility to apply a scale ratio to a given font size, but applying a
         * min/max boundary condition.
         * 
         * @inner
         * @param {Number} nFontSize The original font size
         * @param {Number} nScale The scale to apply
         * @return {Number} A number between oConfig.minFontSize and
         *         oConfig.maxHeight
         */
        function scaleFontSize(nFontSize, nScale) {
            return Math.min(oConfig.maxHeight, Math.max(oConfig.minFontSize, Math.floor(nFontSize * nScale) - 1));
        }

        /**
         * Get the width/height of the given text in the given context. This
         * will create a test element and append it to the context, test the
         * size, then remove the tester. This might cause some performance
         * problems if done too many times.
         * 
         * @inner
         * @param {String=} sText Defaults to 'M'
         * @param {HTMLElement=} oContextElement Defaults to body
         * @param {String=} sFontSize Defaults to 1em
         */
        function getTextSize(sText, oContextElement, sFontSize) {
            oContextElement = oContextElement || document.body;
            sFontSize = sFontSize || '1em';
            sText = sText || 'M';
            var oTester = document.createElement('div');
            oTester.style.display = 'inline-block';
            oTester.style.lineHeight = '1em';
            oTester.style.fontSize = sFontSize;
            oTester.style.padding = 0;
            oTester.style.visibility = 'hidden';
            oTester.appendChild(document.createTextNode(sText));
            oContextElement.appendChild(oTester);
            var oTextSize = [ Math.max(oTester.offsetWidth, oTester.scrollWidth), oTester.offsetHeight ];
            oContextElement.removeChild(oTester);
            return oTextSize;
        }

        /*
         * Get some sizes: the size with no changes, size of single character,
         * and full text when font is minimized.
         */
        var aDefaultSize = getTextSize(sText, oContextElement);
        var aCharacterSize = getTextSize(null, oContextElement);
        var aSmallSize = getTextSize(sText, oContextElement, oConfig.minFontSize + 'px');

        if ((aSmallSize[0] < oConfig.width) && (aCharacterSize[1] < aDefaultSize[1])) {
            /*
             * if: the text at its smallest size can fit without wrapping and
             * the full size text needs to wrap
             * 
             * then: scale up the smallest font size to fit the text within the
             * preferred width
             */
            return scaleFontSize(oConfig.minFontSize, oConfig.width / aSmallSize[0]) + "px";
        } else if (oConfig.maxHeight && aDefaultSize[1] > oConfig.maxHeight) {
            /*
             * if: the default height of the text is larger than the max height
             * 
             * then: scale down the font size by the ratio of maxHeight to
             * actual height
             */
            return scaleFontSize(aCharacterSize[1], oConfig.maxHeight / aDefaultSize[1]) + "px"
        }
        return '1em';
    }

    return UserPhoto;
});