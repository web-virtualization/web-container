/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.ShowMeCallout.
jQuery.sap.declare("sap.sf.surj.shell.controls.ShowMeCallout");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new ShowMeCallout.
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
 * @name sap.sf.surj.shell.controls.ShowMeCallout
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.ShowMeCallout", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.ShowMeCallout with name <code>sClassName</code> 
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
 * @name sap.sf.surj.shell.controls.ShowMeCallout.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/ShowMeCallout.js

/**
 * @class
 * @extends sap.ui.core.Control
 * @name sap.sf.surj.shell.controls.SearchResultPopover
 */
sap.ui.define('sap/sf/surj/shell/controls/ShowMeCallout', [
            'sap/ui/core/Control',
            'sap/ui/layout/HorizontalLayout',
            'sap/ui/layout/VerticalLayout',
            'sap/sf/surj/shell/controls/Container',
            'sap/m/Popover',
            'sap/m/Image',
            'sap/m/Link',
            'sap/m/Text',
            'sap/m/Button'
          ], function(Control, HorizontalLayout, VerticalLayout, Container, Popover, Image, Link, Text, Button) {

  "use strict";
  var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');

  var THUMB_IMG_CONFIG = { width: '120px', height: '90px' };
  var MODALITY_MANAGE = 'manage';
  var MODALITY_AUTHOR = 'author';
  var MODALITY_PLAY = 'play';
  var imagePath = sap.ui.resource('sap.sf.surj.shell.img.showme', '');
  var howToThumbUrl = imagePath + 'show_me_how_to_thumb.jpg';
  var videoPlayButtonUrl = imagePath + 'video_play.png';
  var showMeAdminDoneBarUrl = imagePath + 'showme_admin_done_bar.png';

  return Control.extend('sap.sf.surj.shell.controls.ShowMeCallout', /** @lends sap.sf.surj.shell.controls.ShowMeCallout.prototype */ {
    metadata: {
      properties: {
        modality: {
          type: 'string',
          default: MODALITY_PLAY
        },
        isMobile: {
          type: 'boolean',
          default: false
        },
        thumbUrl: {
          type: 'string',
          default: ''
        },
        videoTitle: {
          type: 'string',
          default: ''
        },
        videoDesc: {
          type: 'string',
          default: ''
        },
        isDraft: {
          type: 'boolean',
          default: false
        },
        useDefaultContent: {
          type: 'boolean',
          default: false
        } 
      }
    },

    setEventHandler: function(eventHandlerFn) {
      this._eventHandlerFn = eventHandlerFn;
    },

    openBy: function(oControl) {
      if (!this._callout) {
        this._callout = new Popover({
          showHeader: false,
          placement: "Bottom",
          content: this._createContent(),
          footer: this._createFooter(),
        }).addStyleClass('surjShowMECO');
      }
      this._callout.openBy(oControl);
    },

    isOpen: function() {
      return this._callout && this._callout.isOpen();
    },

    close: function() {
      if (this._callout) {
        this._callout.close();
      }
    },

    _createContent: function() {
      var oThis = this;
      var action;
      if (this.getModality() == MODALITY_AUTHOR) {
        this.setThumbUrl(howToThumbUrl);
        action = 'playShowMeAuthorHelp';
      } else {
        action = 'playShowMe';
      }
      return new HorizontalLayout({
        content: [
          new Container({
            content: [
              new Image({
                src: oThis.getThumbUrl(),
                width: THUMB_IMG_CONFIG.width,
                height: THUMB_IMG_CONFIG.height,
                press: function() {
                  oThis._eventHandlerFn({
                    action: action
                  });
                }
              }),
              new Image({
                src: videoPlayButtonUrl,
                press: function() {
                  oThis._eventHandlerFn({
                    action: action 
                  });
                }
              }).addStyleClass('surjShowMeCOVideoPlayButton')
            ]
          }).addStyleClass('surjShowMeThumb'),
          oThis.getModality() == MODALITY_AUTHOR ? oThis._createContentAuthor() : oThis._createContentPlay()
        ]
      }).addStyleClass('surjShowMeCOContent');
    },

    _createContentPlay: function() {
      var oThis = this;
      return new VerticalLayout({
        content: [
          new Link({
            text: oThis.getVideoTitle(),
            press: function() {
              oThis._eventHandlerFn({
                action: 'playShowMe'
              });
            }
          }),
          new Text({
            text: oThis.getVideoDesc().replace(/\n/g, '<br>')
          })
        ]
      }).addStyleClass('surjShowMeCOText');
    },

    _createContentAuthor: function() {
      var oThis = this;
      var content = [];
      if (!this.getIsMobile()) {
        content.push(new Text({
          text: rb.getText('COMMON_SHOW_ME_AUTHOR_WELCOME')
        }));
        content.push(new Container({
          content: this._formatMessage(rb.getText('COMMON_SHOW_ME_LEARN_MORE'), function() {
            oThis._eventHandlerFn({
              action: 'playShowMeAuthorHelp'
            });
          })
        }).addStyleClass('surjShowMeFormattedMsgContainer'));
        content.push(new Button({
          text: rb.getText('COMMON_SHOW_ME_AUTHOR_LINK'),
          press: function() {
            oThis._eventHandlerFn({
              action: 'recordShowMe'
            });
          }
        }));
      } else {
        content.push(new Text({
          text: rb.getText('COMMON_SHOW_ME_MOBILE_AUTHOR')
        }));
      }
      return new VerticalLayout({
        content: content
      }).addStyleClass('surjShowMeCOText');
    },

    _createFooter: function() {
      var oThis = this;
      var content = [
        new Link({
          text: rb.getText('COMMON_DONT_SHOW_AGAIN'),
          press: function() {
            oThis._eventHandlerFn({
              action: 'notAgain',
              flag: true
            });
          }
        }).addStyleClass('surjShowMeCOFooterDontShowLink')
      ];
      if (this.getModality() == MODALITY_MANAGE) {
        var msgText;
        if (!this.getIsMobile()) {
          if (this.getIsDraft()) {
            msgText = rb.getText('COMMON_SHOW_ME_NOT_PUBLISHED');
          } else if (this.getUseDefaultContent()) {
            msgText = rb.getText('COMMON_SHOW_ME_MANAGE_DEFAULT_VIDEO');
          } else {
            msgText = rb.getText('COMMON_SHOW_ME_MANAGE_VIDEO');
          }
        } else {
          msgText = rb.getText('COMMON_SHOW_ME_MOBILE_MANAGE_VIDEO');
        }
        content.push(
          new VerticalLayout({
            content: [
              new Image({
                src: showMeAdminDoneBarUrl,
                width: '100%'
              }),
              new Container({
                content: oThis._formatMessage(msgText, function() {
                  oThis._eventHandlerFn({
                    action: 'manageShowMe'
                  });
                })
              }).addStyleClass('surjShowMeCOFooterMsgContainer surjShowMeFormattedMsgContainer')
            ]
          }).addStyleClass('surjShowMeCOFooterMain')
        );
      }
      return new VerticalLayout({
        width: '400px',
        content: content
      }).addStyleClass('surjShowMeCOFooter');
    },

    _formatMessage: function(msgText, callbackFn) {
      var components = [];
      var texts = msgText.split(/<a.*?>/);
      for (var i = 0; i < texts.length; ++i) {
        var text = texts[i];
        if (text) {
          text = text.replace(/<br\/>/g, '\n');
          var subTexts = text.split(/<\/a>/);
          if (subTexts.length > 1) {
            components.push(new Link({
              text: subTexts[0],
              press: callbackFn
            }));
            components.push(new Text({
              text: subTexts[1]
            }));
          } else {
            components.push(new Text({
              text: text
            }));
          }
        }
      }
      return components;
    }
  });
});
