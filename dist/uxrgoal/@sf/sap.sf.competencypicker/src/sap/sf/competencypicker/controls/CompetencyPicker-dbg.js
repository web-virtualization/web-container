sap.ui.define([
    "jquery.sap.global",
    "sap/ui/core/Control",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/m/Dialog",
    "sap/m/Tree", "sap/m/OverflowToolbar", "sap/m/Text", "sap/m/CheckBox", "sap/m/CustomTreeItem",
    "sap/m/StandardTreeItem", "sap/m/CustomListItem", "sap/m/SplitContainer", "sap/m/Page", "sap/m/Bar",
    "sap/m/Toolbar", "sap/m/ToolbarSpacer", "sap/m/Link", "sap/m/List", "sap/ui/layout/HorizontalLayout",
    "sap/ui/core/Icon", "sap/m/ComboBox", "sap/ui/core/Item","sap/m/SearchField", "sap/m/Title", "sap/m/ListMode",
    "sap/sf/competencypicker/module/OdataV4Util", "sap/m/ToggleButton", "sap/m/MessageBox"
], function ($, Control, JSONModel, ResourceModel, Button, ButtonType, Dialog, Tree, OverflowToolbar, 
             Text, CheckBox, CustomTreeItem, StandardTreeItem, CustomListItem, 
             SplitContainer, Page, Bar, Toolbar, ToolbarSpacer, Link, List, HorizontalLayout,
             Icon, ComboBox, Item, SearchField, Title, ListMode, OdataV4Util, ToggleButton){
    "use strict";
    var oCompetencyPickerControl = Control.extend("sap.sf.competencypicker.controls.CompetencyPicker", {    
        metadata: {
          properties : {
            inputParam: {type : "object", defaultValue : {}},
            inputTitle: {type : "object", defaultValue : {}},
            resourceBundle : {type : "object", defaultValue : {}}
          },
          aggregations : { },
          events : {
            itemsSelected : {
              parameters : {
                selectedItems : {type : "object"}
              }
            }
          }
        },
        constructor: function(){
          Control.apply(this, arguments);
          this._Model = new JSONModel({
            "detailPage": [],
            "detailPageForPreSelected": [],
            "masterPage":{
              "search": {},
              "browse": {
                "libraries": []
              },
              "breadcrumbs": null,
              "enableFilter": false,
              "selectedFilter": "all",
              "filterOptions": [],
              "existingCompetencies": [],
              "pressedAll": true,
              "pressedByRole": false
            }
          });
          this._busyLoading = new sap.m.BusyDialog();
        },
        _oDialog : null,
        filterIds : [],
        isErrorShown : false
    });
    
    oCompetencyPickerControl.prototype._getFilterOptions = function(){
      var isAllTab = this._Model.getProperty('/masterPage/pressedAll');
      var filterOptions = [];
      if(isAllTab)
      {
    	  filterOptions = [
                            {"name": "all", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_ALL")},
                            {"name": "libraries", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_LIBRARIES")},
                            {"name": "categories", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_CATEGORIES")},
                            {"name": "competencies", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_COMPETENCIES")}
                          ];
      }
      else
      {
    	  filterOptions = [
                            {"name": "all", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_ALL")},
                            {"name": "families", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_FAMILIES")},
                            {"name": "roles", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_ROLES")},
                            {"name": "competencies", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_COMPETENCIES")}
                          ];
      }
      return filterOptions;
    }
    
    oCompetencyPickerControl.prototype.createDialog = function(){
      this._i18n = this.getResourceBundle();
      this._resolveHeaderFooterLabels();
      this._getDistinctCompetencyLibraries();
      this._getSelectedCompetenciesOrBehaviors();
      this._oDialog = new Dialog({
        title : this.getInputTitle().dialogTitle,
        contentWidth : "54%",
        contentHeight : "70%",
        content:[this._getSplitContainer()],
        buttons:[new Button({
                text: this.getInputTitle().detailPageFooterTitle,
                press: $.proxy(this._onDone, this),
                type: ButtonType.Emphasized
              }),
              new Button({
                text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_CANCEL"),
                press: $.proxy(function(oEvent) {
                  this._closeAndDestroy();
                }, this)
              })],
        horizontalScrolling: false,
        verticalScrolling: false,
        busyIndicatorDelay: 0,
        stretch: sap.ui.Device.system.phone
      }).addStyleClass("sapUiSizeCompact competenciesDialog");
        this._oDialog.setModel(this._Model);
        this._oDialog.open();
        this.competencyIdsInDetailPage = [];
    };
    
    oCompetencyPickerControl.prototype._resolveHeaderFooterLabels = function(){
      if(jQuery.isEmptyObject(this._i18n)){
    	  var oResourceModel = new ResourceModel({
    		  bundleName: "sap.sf.competencypicker.i18n.messagebundle"
    	});
    	sap.ui.getCore().setModel(oResourceModel, "i18n");
        this._i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
      }
      
      var isBehaviorPicker = this.getInputParam().useBehavior;
      var defaultInputTitle = {
  			dialogTitle: this._i18n.getText(isBehaviorPicker ? "JDMNG_COMPETENCY_PICKER_DIALOG_TITLE_BEHAVIORS" : "JDMNG_COMPETENCY_PICKER_DIALOG_TITLE_COMPETENCIES"),
  			masterPageHeaderTitle: this._i18n.getText(isBehaviorPicker ? "JDMNG_COMPETENCY_PICKER_MASTER_PAGE_HEADER_TITLE_BROWSE_BEHAVIORS" : "JDMNG_COMPETENCY_PICKER_MASTER_PAGE_HEADER_TITLE_BROWSE_COMPETENCIES"),
  			detailPageHeaderTitle: this._i18n.getText(isBehaviorPicker ? "JDMNG_COMPETENCY_PICKER_DETAIL_PAGE_HEADER_TITLE_SELECTED_BEHAVIORS" : "JDMNG_COMPETENCY_PICKER_DETAIL_PAGE_HEADER_TITLE_SELECTED_COMPETENCIES"),
  			detailPageFooterTitle: this._i18n.getText("JDMNG_COMPETENCY_PICKER_DETAIL_PAGE_FOOTER_TITLE")
  		};
  		
  	    if(jQuery.isEmptyObject(this.getInputTitle())){
			this.setInputTitle(defaultInputTitle);
  	  	}else{
  	  	    var _inputTitle = this.getInputTitle();
            for(const [key, value] of Object.entries(defaultInputTitle)){
                if(!_inputTitle[key] || _inputTitle[key].length == 0){
                    _inputTitle[key] = value;
                }
            }
            this.setInputTitle(_inputTitle);
  	  	}
    };
    
    oCompetencyPickerControl.prototype._getSplitContainer = function(){
      var oSplitContainer = new SplitContainer({
            masterPages:[this._getMasterPage()],
            detailPages:[this._getDetailPage()]
      });
      this._oSplitContainer = oSplitContainer;
      return oSplitContainer;
    };

    // ========================================
    //  Master Page
    // ========================================
    oCompetencyPickerControl.prototype._getMasterPage = function(){
        var oMasterPage = new Page({
            id: "browseCompetenciesPage",
            customHeader: this._createMasterPageHeader(),
            subHeader: this._createMasterPageContent(),
            enableScrolling: false,
            content:[
                this._getNumSelectedAndBreadcrumbs(),
                this._getTree()
            ]
        });
        this._updateSizeLimit(this);
          
        return oMasterPage;
    };

    oCompetencyPickerControl.prototype._createMasterPageHeader = function(){
        var oBar = new Bar({
            contentLeft: [new ToggleButton('allBtnId',{
              text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_TAB_ALL"),
              press: $.proxy(this._handleByRole, this),
              pressed:"{/masterPage/pressedAll}",
              visible: this.getInputParam().showByRolesTab
            }),
            new ToggleButton('roleBtnId',{
              text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_TAB_BY_ROLE"),
              press: $.proxy(this._handleByRole, this),
              pressed:"{/masterPage/pressedByRole}",
              visible: this.getInputParam().showByRolesTab
            })],
            contentMiddle: new Title({
                text: this.getInputTitle().masterPageHeaderTitle,
                tooltip: this.getInputTitle().masterPageHeaderTitle
            })
        });
        return oBar;
    }

    oCompetencyPickerControl.prototype._createMasterPageContent = function(){
        var oToolBar = new Toolbar({
            content:[
              this._getSearchField(),
              this._getFilter()
            ]
          });
        return oToolBar;
    };

    oCompetencyPickerControl.prototype._getSearchField = function(){
    	this._oSearchField = new SearchField({
    	  placeholder: this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH"),
          search: $.proxy(this._handleSearch, this),
          value: "",
          liveChange: $.proxy(this._handleLiveChange, this),
          width:"66%"
        });
        return this._oSearchField;
    };

    oCompetencyPickerControl.prototype._getFilter = function(){
    	var isAllTab = this._Model.getProperty('/masterPage/pressedAll');
        var filterOptions = null;
    	filterOptions = this._getFilterOptions();
        if(this.getInputParam().useBehavior && filterOptions.length == 4){
          filterOptions.push({"name": "behaviors", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_BEHAVIORS")});
        }
        this._Model.oData.masterPage.filterOptions = filterOptions;
        var oComboBox = new ComboBox({
          items: {
            path: "/masterPage/filterOptions",
            template: new Item({
              key: "{name}",
              text: "{label}",
              tooltip: "{label}"
            })
          },
          selectionChange: $.proxy(function(oEvent){
            this._Model.setProperty("/masterPage/selectedFilter", oEvent.getSource().getSelectedKey());
            this._searchCompetencyByDefinedEnum();
          }, this),
          selectedKey: "{/masterPage/selectedFilter}",
          enabled: "{/masterPage/enableFilter}",
          width:"40%"
        });
        return oComboBox;
    };

    oCompetencyPickerControl.prototype._getNumSelectedAndBreadcrumbs = function(){
      var oToolBar = new Toolbar({
        content:[
          new List({
            // Commented below line to not show the number of competencies selected in the competency picker over breadcrumbs
            //infoToolbar: this._getInfoToolBar(),
              items: [this._getItems(), this._getHierarchyViewLabel()]
          })
        ]
      }).addStyleClass("breadCrumbSize");
      return oToolBar;
    };

    oCompetencyPickerControl.prototype._getTree = function(){
      var oScrollContainer = new sap.m.ScrollContainer("treeContainerId",{
        vertical: true,
        height: "calc(100% -  2rem  -  2%)",
        content:[
             this._buildTree("/masterPage/browse/libraries", "librariesTreeId"),
             this._buildTree("/masterPage/search/libraries", "librariesSearchTreeId"),
             this._buildTree("/masterPage/browse/families", "familiesTreeId"),
             this._buildTree("/masterPage/search/families", "familiesSearchTreeId"),
             this._buildTree("/masterPage/search/roles", "rolesSearchTreeId"),
             this._buildTree("/masterPage/search/categories", "categoriesSearchTreeId"),
             this._buildSearchCompetencyList("/masterPage/search/competencies"),
             this._buildSearchCompetencyList("/masterPage/search/behaviors"),
             new List({
                 noDataText: this._i18n.getText("JDMNG_COMPETENCY_PICKER_NO_DATA_MASTER_PAGE"),
                 visible:{
                 parts:["/masterPage"],
                 formatter: $.proxy(function(oMasterPage){
                     if(oMasterPage &&  oMasterPage.browse && oMasterPage.search){
                       if ($.isEmptyObject(oMasterPage.browse.libraries) && $.isEmptyObject(oMasterPage.search.libraries) &&
                       $.isEmptyObject(oMasterPage.browse.families) && $.isEmptyObject(oMasterPage.search.families) &&
                       $.isEmptyObject(oMasterPage.search.categories) && $.isEmptyObject(oMasterPage.search.competencies)
                       && $.isEmptyObject(oMasterPage.search.roles) && $.isEmptyObject(oMasterPage.search.behaviors)){
                       return true;
                       } else {
                       return false;
                       }
                     }else {
                        return false;
                     }
                 }, this)
                 }
             })
        ]
      })
      return oScrollContainer;
    };

    // TODO: Commenting as of now, Will be removing once confirmation from PP3 team

//    oCompetencyPickerControl.prototype._getInfoToolBar = function(){
//        var oInfoToolBar = new OverflowToolbar({
//            content:[
//                new Title({
//                    text: {
//                    parts: ["/detailPage"],
//                    formatter: $.proxy(function(oDetailPage) {
//                      if (oDetailPage && oDetailPage.length == 1) {
//                        return "1";
//                      } else if(oDetailPage){
//                        return oDetailPage.length;
//                      }else{
//                        return ""
//                      }
//                    }, this)
//                    }
//                })
//            ],
//            visible:{
//                parts: ["/detailPage"],
//                formatter: this._standardFormatter
//            }
//        });
//        return oInfoToolBar;
//    };

    oCompetencyPickerControl.prototype._getBreadcrumbsContent = function(){

      var content = [
        new Icon({
          src: "sap-icon://course-book"
        }),new Text({
          text: {
            path:"/masterPage/breadcrumbs/libraryName",
            formatter: $.proxy(function(oLibName){
              return this._trimContent(oLibName);
            }, this)
          }
        }),new Icon({
          src: "sap-icon://navigation-right-arrow"
        }),new Text({
          text: {
            path: "/masterPage/breadcrumbs/categoryName",
            formatter: $.proxy(function(ocatName){
              return this._trimContent(ocatName);
            }, this)
          }
         })
      ];
      if(this.getInputParam().useBehavior){
        content.push(
          new Icon({
            src: "sap-icon://navigation-right-arrow"
          }),new Text({
            text: {
              path: "/masterPage/breadcrumbs/competencyName",
              formatter: $.proxy(function(oCompName){
                return this._trimContent(oCompName);
              }, this)
            }
          })
        );
      }
      return content;
    };

    oCompetencyPickerControl.prototype._trimContent = function(stringToTrim){
     // find a length of breadcrumb content
      var maxLength = this.getInputParam().useBehavior ? 20:30;
      if(stringToTrim && stringToTrim.length > maxLength){
          return stringToTrim.substring(0, maxLength-4).concat(' ...');
      }else{
          return stringToTrim;
      }
    }

    oCompetencyPickerControl.prototype._getItems = function(){
        var oCustomListItem = new CustomListItem({
            content: new HorizontalLayout({
              content: this._getBreadcrumbsContent(),
              allowWrapping: false
            }).addStyleClass("addCompetenciesHLayoutBreadCrumbs"),
            visible:{
              parts:["/masterPage/breadcrumbs"],
              formatter: function(oBreadCrumbs){
                if (!oBreadCrumbs){
                  return false;
                }
                return true;
              }
            }
        });
        return oCustomListItem;
    };

    oCompetencyPickerControl.prototype._getHierarchyViewLabel = function(){
        var oCustomListItem = new CustomListItem({
            content: new HorizontalLayout({
              content: [
                new Text({text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_HIERARCHY_VIEW")})
              ]
            }).addStyleClass("addCompetenciesHLayoutBreadCrumbs"),
            visible:{
              parts:["/masterPage/breadcrumbs"],
              formatter: function(oBreadCrumbs){
                if (oBreadCrumbs){
                  return false;
                }
                return true;
              }
            }
        });
        return oCustomListItem;
    };

    oCompetencyPickerControl.prototype._buildTree = function(sItemsPath, sIdTree){
        var oTree = new Tree(sIdTree, {
          headerToolbar: new OverflowToolbar({
            content:[
              new Title({
                text: {
                  parts:[sItemsPath],
                  formatter: $.proxy(this._standardHeaderText, this)
                },
                wrapping: true,
                titleStyle: sap.ui.core.TitleLevel.H6
              })
            ],
            visible:!sItemsPath.includes("/browse/libraries") && !sItemsPath.includes("/browse/families")
          }),
          items: {
            path: sItemsPath,
            factory: $.proxy(this._itemFactory, this)
          },
          toggleOpenState: $.proxy(this._handleToggleOpenState, this),
          visible:{
            parts:[sItemsPath],
            formatter: this._standardFormatter
          }
        });
        return oTree;
    };

    oCompetencyPickerControl.prototype._buildSearchCompetencyList = function(sItemsPath){
      if(this.getInputParam().useBehavior && sItemsPath === "/masterPage/search/competencies"){
        return this._buildTree(sItemsPath, "competenciesSearchTreeId");
      }else {
        var oTree = new Tree({
          headerToolbar: new OverflowToolbar({
            content:[
              new Title({
                text: {
                  parts: [sItemsPath],
                  formatter: $.proxy(this._standardHeaderText, this)
                },
                wrapping: true,
                titleStyle: sap.ui.core.TitleLevel.H6
              })
            ]
          }),
          items: {
            path: sItemsPath,
            factory: $.proxy(this._itemFactory, this)
          },
          visible:{
            parts:[sItemsPath],
            formatter: this._standardFormatter
          }
        });
        return oTree;
      } 
    };

    oCompetencyPickerControl.prototype._standardHeaderText = function(aItems){
        var sText = "";
        if (!aItems || ($.isEmptyObject(aItems))){
          return sText;
        }
        var isAllTab = this._Model.getProperty('/masterPage/pressedAll');
        var item = aItems[0];
        if(isAllTab)
        {
	        if (item && item.icon){
	          sText = "JDMNG_COMPETENCY_PICKER_LIBRARIES_WITH_COUNT";
	        } else if (item && item.libraryName && item.categoryName && item.competencyName){
	          sText = "JDMNG_COMPETENCY_PICKER_BEHAVIORS_WITH_COUNT";
	        } else if (item && item.internalId){
	          sText = "JDMNG_COMPETENCY_PICKER_COMPETENCIES_WITH_COUNT";
	        } else if (item && item.libraryName && item.categoryName){
	          sText = "JDMNG_COMPETENCY_PICKER_COMPETENCIES_WITH_COUNT";
	        } else if (item && item.libraryName){
	          sText = "JDMNG_COMPETENCY_PICKER_CATEGORIES_WITH_COUNT";
	        }
        }
        else
        {
	        if (item && item.icon){
	          sText = "JDMNG_COMPETENCY_PICKER_FAMILIES_WITH_COUNT";
	        } else if (item && item.familyName && item.roleName && item.competencyName){
	          sText = "JDMNG_COMPETENCY_PICKER_BEHAVIORS_WITH_COUNT";
	        } else if (item && item.internalId){
	          sText = "JDMNG_COMPETENCY_PICKER_COMPETENCIES_WITH_COUNT";
	        } else if (item && item.familyName && item.roleName){
	          sText = "JDMNG_COMPETENCY_PICKER_COMPETENCIES_WITH_COUNT";
	        } else if (item && item.familyName){
	          sText = "JDMNG_COMPETENCY_PICKER_ROLES_WITH_COUNT";
	        }
        }
        return this._i18n.getText(sText, [aItems.length]);
    };

    oCompetencyPickerControl.prototype._itemFactory  = function(sId, oContext){
        var internalId = oContext.getProperty("internalId");
        var oItem = null;
        if(internalId == "selectAllId"){
            var oSelectAllLink = new Link({
                text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_SELECT_ALL", "{count}"),
                press: $.proxy(this._handleSelectAllLink, this, true),
                emphasized: true
            });
            var aUnSelectAllLink = new Link({
                text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_UN_SELECT_ALL", "{count}"),
                press: $.proxy(this._handleSelectAllLink, this, false),
                emphasized: true
            });
            return new CustomTreeItem({
                content: [oSelectAllLink, new Link({text:"\u00a0/\u00a0", emphasized:true}), aUnSelectAllLink]
            });
        }
        if (internalId){
          var aExistingCompetencies = this._Model.getProperty("/masterPage/existingCompetencies") || [];
          var bExistingCompetency = aExistingCompetencies.indexOf(internalId) != -1;
          var oCheckBox = new CheckBox({
            text:"{name}",
            tooltip:"{name}",
            selected: {
              parts:[{path: "compSelected"}],
              formatter: $.proxy(function(compSelected){
                return compSelected || bExistingCompetency || this.competencyIdsInDetailPage.indexOf(internalId) >= 0
              }, this)
            },
            enabled: this.getInputParam().allowUserToChangeSelection ? true : !bExistingCompetency,
            wrapping: true,
            select: $.proxy(this._handleCheckBox, this)
          });
          oItem = new CustomTreeItem({
            content: [oCheckBox]
          });
        } else {
          oItem = new StandardTreeItem({
            title: "{text}",
            tooltip: "{text}",
            icon: "{icon}"
          });
        }
        return oItem;
    };

    oCompetencyPickerControl.prototype._standardFormatter = function(aItems){
        return (aItems && aItems.length > 0) || false;
    };
    
    oCompetencyPickerControl.prototype._showErrorMessage = function(message){
    	if(!this.isErrorShown){
    		this.isErrorShown =  true;
    		return sap.m.MessageBox.error(this._i18n.getText(message), {onClose: function (oAction) {this.isErrorShown = false }.bind(this)});
    	}
    };

    oCompetencyPickerControl.prototype._getChildNodes = function(sPath, oItemContext, isAllTab){
      var promise;
      var oDeferred = new $.Deferred();
      this._busyLoading.open();
      var sName = oItemContext.getProperty("text");
      if(isAllTab){

        var sLibraryName = this._Model.getProperty(sPath).libraryName;
        var sCategoryName = this._Model.getProperty(sPath).categoryName;

        if (sLibraryName && !sCategoryName){
            promise = OdataV4Util.GetCompetencies(this.getInputParam(), oDeferred, sLibraryName, sName, this.filterIds);
        }else if (sLibraryName && sCategoryName) {
            var competencyId = this._Model.getProperty(sPath).competencyId;
            promise = OdataV4Util.GetBehaviors(competencyId, oDeferred, sLibraryName, sCategoryName, sName, this.filterIds, undefined);
        }else {
            promise = OdataV4Util.GetCategories(this.getInputParam(), oDeferred, sName, this.filterIds);
        }

      }else {

        var sFamilyName = this._Model.getProperty(sPath).familyName;
        var sRoleName = this._Model.getProperty(sPath).roleName;
        var roleId = oItemContext.getProperty("roleId");
        if (sFamilyName && !sRoleName){
            promise = OdataV4Util.GetCompetencyDetailsByIds(this.getInputParam(), oDeferred, sFamilyName, sName, this.filterIds, roleId);
        }else if (sFamilyName && sRoleName) {
            var competencyId = this._Model.getProperty(sPath).competencyId;
            promise = OdataV4Util.GetBehaviors(competencyId, oDeferred, sFamilyName, sRoleName, sName, this.filterIds, roleId);
        }else {
            promise = OdataV4Util.GetRoles(this.getInputParam(), oDeferred, this.filterIds, sName);
        }

      }

      promise.then(function(childNodes){
        this._onChildNodesLoaded(sPath, childNodes);
        this._hideUnhideTrees();
        this._busyLoading.close();
      }.bind(this), function(sErr, jqXHR){
    	  this._showErrorMessage("JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA");
    	  this._busyLoading.close();
      }.bind(this));
    };

    oCompetencyPickerControl.prototype._updateSizeLimit = function(odataResponse){
      var that = this;
      // resetting to default value
      that._Model.setSizeLimit(this._Model.iSizeLimit || 100);
      if(Array.isArray(odataResponse)){
        this._Model.setSizeLimit(this._Model.iSizeLimit+odataResponse.length);
      }else if(!jQuery.isEmptyObject(odataResponse)){
        jQuery.each(odataResponse, function(sKey, response){
          if(Array.isArray(response)){
            that._Model.setSizeLimit(that._Model.iSizeLimit+odataResponse.length);
          }
        })
      }
    };

    // ========================================
    //  Detail Page
    // ========================================

    oCompetencyPickerControl.prototype._getDetailPage = function(){
        var p = new Page({
            id: "selectedCompetenciesPage",
            customHeader: this._createDetailPageHeader(),
            content:[
              //this._createInfo(),
              this._createDetailPageContentToolBar(), 
              this._selectedCompetenciesCountDisplay(), 
              this._createDetailPageContentPreSelectedList(), 
              this._createDetailPageContentSelectedList()
            ]
        });
        return p;
    };

    oCompetencyPickerControl.prototype._createInfo = function(){
      if(!this.getInputParam().useBehavior){
        var messageStrip = new sap.m.MessageStrip({
          text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_ADD_COMPETENCIES_INFO"),
          type: sap.ui.core.MessageType.Information,
          showIcon: true
        }).addStyleClass("addCompetenciesDetailPageSubHeaderText");
        return messageStrip;
      }
    }

    oCompetencyPickerControl.prototype._createDetailPageHeader = function (){
        var oBar = new Bar({
            contentMiddle: [
                new Button({
                    icon: "sap-icon://arrow-left",
                        tooltip: "Back",
                        visible: sap.ui.Device.system.phone,
                        press: $.proxy(function(oEvent){
                        this._oSplitContainer.toMaster("browseCompetenciesPage")
                        }, this)
                }),
                new Title({
                    text: this.getInputTitle().detailPageHeaderTitle,
                    tooltip: this.getInputTitle().detailPageHeaderTitle
                })
            ]
        });
        return oBar;
    };

    oCompetencyPickerControl.prototype._createDetailPageContentToolBar = function (){
        var oToolBar = new Toolbar({
            content:[
                new ToolbarSpacer(),
                new Button({
                  text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_REMOVE_ALL"),
                  tooltip: this._i18n.getText("JDMNG_COMPETENCY_PICKER_REMOVE_ALL"),
                  type: ButtonType.Emphasized,
                  enabled: {
                    parts: ["/detailPage"],
                    formatter: this._standardFormatter
                  },
                  press: $.proxy(this._handleRemoveAll, this)
                })
            ]
        }).addStyleClass("removeAllBgColor");
        return oToolBar;
    };

    oCompetencyPickerControl.prototype._selectedCompetenciesCountDisplay = function (){
      var oBar = new Bar({
        contentMiddle: new Text({
          text: {
            parts: ["/detailPage", "/detailPageForPreSelected"],
            formatter: $.proxy(function(oDetailPage, oDetailPageForPreSelected) {
              if(this.getInputParam().allowUserToChangeSelection){
                if (oDetailPage) {
                   return this._i18n.getText("JDMNG_COMPETENCY_PICKER_SELECTED_COMPETENCIES_WITH_COUNT", [oDetailPage.length]);
                }
              }else{
                if(oDetailPage && oDetailPageForPreSelected){
                    return this._i18n.getText("JDMNG_COMPETENCY_PICKER_SELECTED_COMPETENCIES_WITH_COUNT", [oDetailPage.length + oDetailPageForPreSelected.length]);
                }
              }
            }, this)
          }
        })
      }).addStyleClass("selectedCountStyle");
      return oBar;
    };

    oCompetencyPickerControl.prototype._createDetailPageContentPreSelectedList = function(){
        var oList = new List({
            showNoData:false,
            items:{
              path:"/detailPageForPreSelected",
              template: new CustomListItem({
                content:[
                  new Text({
                    text: "{name}",
                    tooltip: "{name}",
                    wrapping: true
                  })
                ]
              }).addStyleClass("addCompetenciesSelectedItem")
            },
            visible: {
                parts:["/detailPageForPreSelected"],
                formatter: function(preSelectedList){
                    if(preSelectedList && preSelectedList.length > 0){
                        return true;
                    }else{
                        return false;
                    }
                }
            }
        });
        return oList;
    }

    oCompetencyPickerControl.prototype._createDetailPageContentSelectedList = function(){
      var oList = new List({
        showNoData:false,
        items:{
          path:"/detailPage",
          template: new CustomListItem({
            content:[
              new Text({
                text: "{name}",
                tooltip: "{name}",
                wrapping: true
              })
            ]
          }).addStyleClass("addCompetenciesSelectedItem")
        },
        visible: {
            parts:["/detailPage", "/detailPageForPreSelected"],
            formatter: function(selectedList, preSelectedList){
                if (preSelectedList && preSelectedList.length > 0 && selectedList.length == 0){
                  return false;
                }else{
                  return true;
                }
            }
        },
        mode: ListMode.Delete,
        delete: $.proxy(this._handleDelete, this)
    });
    return oList;
    };

    oCompetencyPickerControl.prototype._createDetailPageFooter = function(){
        var oOverflowToolBar = new OverflowToolbar({
            content: [
              new ToolbarSpacer(),
              new Button({
                text: this.getInputTitle().detailPageFooterTitle,
                tooltip: this.getInputTitle().detailPageFooterTitle,
                press: $.proxy(this._onDone, this),
                type: ButtonType.Emphasized
              }),
              new Button({
                text: this._i18n.getText("JDMNG_COMPETENCY_PICKER_CANCEL"),
                tooltip: this._i18n.getText("JDMNG_COMPETENCY_PICKER_CANCEL"),
                press: $.proxy(function(oEvent) {
                  this._closeAndDestroy();
                }, this)
              })
            ]
        });

        return oOverflowToolBar;
    };

    // ========================================
    //  Odata Requests
    // ========================================
    oCompetencyPickerControl.prototype._getDistinctCompetencyLibraries = function(){
      var oDeferred = new $.Deferred();
      var promise = OdataV4Util.GetLibraries(this.getInputParam(), oDeferred);
      promise.then(function(filterResult){
        this._onLibrariesLoaded(filterResult.libraryNames);
        this.filterIds = filterResult.filterIds;
      }.bind(this), function(sErr, jqXHR){
    	  this._showErrorMessage(jqXHR.responseJSON.error.message === "JDMNG_ERROR_NO_PERMISSION" ? "JDMNG_COMPETENCY_PICKER_ERROR_NO_PERMISSION" : "JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA");
	  }.bind(this));
    };

    oCompetencyPickerControl.prototype._getSelectedCompetenciesOrBehaviors = function(){
      var oDeferred1 = new $.Deferred();
      var promise1 = null;
      if(this.getInputParam().useBehavior){
	      promise1 = OdataV4Util.GetSelectedBehaviors(this.getInputParam(), oDeferred1);}
      else{
	      promise1 = OdataV4Util.GetSelectedCompetencies(this.getInputParam(), oDeferred1);}
      promise1.then(function(selectedComps){
        if(this.getInputParam().allowUserToChangeSelection){
            this._Model.setProperty("/detailPage", selectedComps);
        }else{
            this._Model.setProperty("/detailPageForPreSelected", selectedComps);
        }

      }.bind(this), function(sErr, jqXHR){
    	  this._showErrorMessage(jqXHR.responseJSON.error.message === "JDMNG_ERROR_NO_PERMISSION" ? "JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA" : "JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA");
      }.bind(this));
    }
    
    oCompetencyPickerControl.prototype._getDistinctFamilies = function(){
        var oDeferred = new $.Deferred();
        var promise = OdataV4Util.GetFamilies(this.getInputParam(), oDeferred, this.filterIds);
        promise.then(function(families){
          this._onFamiliesLoaded(families);
        }.bind(this), function(sErr, jqXHR){
        	this._showErrorMessage("JDMNG_COMPETENCY_PICKER_ERROR_LOADING_DATA");
		}.bind(this));
      };

    oCompetencyPickerControl.prototype._getSearchResults = function(sFilter, sSearchedText){
      var isAllTab = this._Model.getProperty('/masterPage/pressedAll');
      var searchData = {};
      var oDeferred = new $.Deferred();
      var promise = {};
      if(isAllTab)
      {
    	  searchData = {
    		        libraryName: "",
    		        categoryName: "",
    		        competencyName: "",
    		        behaviorName: "",
    		        filterIds: this.filterIds,
    		        useBehavior: this.getInputParam().useBehavior,
    		        selectionByCoreCompetency: this.getInputParam().selectionByCoreCompetency
    		      };
          if(sFilter == "libraries"){
              searchData.libraryName = sSearchedText;
          }else if(sFilter == "categories"){
              searchData.categoryName = sSearchedText;
          }else if(sFilter == "competencies"){
              searchData.competencyName = sSearchedText;
          }else if(sFilter == "behaviors"){
              searchData.behaviorName = sSearchedText;
          }else{
            searchData.libraryName = sSearchedText;
            searchData.categoryName = sSearchedText;
            searchData.competencyName = sSearchedText;
            if(searchData.useBehavior){
              searchData.behaviorName = sSearchedText;
            }
          }
          promise = OdataV4Util.Search(oDeferred, searchData);
      }
      else
      {
    	  searchData = {
    	          familyName: "",
    	          roleName: "",
    	          competencyName: "",
    	          behaviorName: "",
    	          filterIds: this.filterIds,
    	          useBehavior: this.getInputParam().useBehavior,
    	          includeInActive: this.getInputParam().includeInActive,
    	          selectionByCoreCompetency: this.getInputParam().selectionByCoreCompetency
    	        };
    	  if(sFilter == "families"){
            searchData.familyName = sSearchedText;
          }else if(sFilter == "roles"){
            searchData.roleName = sSearchedText;
          }else if(sFilter == "competencies"){
            searchData.competencyName = sSearchedText;
          }else if(sFilter == "behaviors"){
        	searchData.behaviorName = sSearchedText;
          }else{
            searchData.familyName = sSearchedText;
            searchData.roleName = sSearchedText;
            searchData.competencyName = sSearchedText;
            if(searchData.useBehavior){
              searchData.behaviorName = sSearchedText;
            }
          }
    	  promise = OdataV4Util.SearchByRole(oDeferred, searchData);
      }
      
      promise.then(function(searchResults){
        this._onSearchResultsLoaded(searchResults);
      }.bind(this), function(sErr, jqXHR){
    	  this._showErrorMessage("JDMNG_COMPETENCY_PICKER_ERROR_SEARCHING_DATA");
	  }.bind(this));
    }

    // ========================================
    //  On Odata Response
    // ========================================

    oCompetencyPickerControl.prototype._onLibrariesLoaded = function(libraries){
      this._Model.setProperty("/masterPage/browse/libraries", libraries);
      this._clearSearchData(false);
      this._Model.setProperty("/masterPage/browse/families", []);
      this._updateSizeLimit(libraries);
      if(!this._oDialog){
        //this._Model.setProperty("/masterPage/filterOptions", dwrResponse.filterOptions);
        //this._Model.setProperty("/masterPage/existingCompetencies", dwrResponse.existingCompetencies);
        //this.open(dwrResponse);
      }else{
        this._Model.setProperty("/masterPage/existingCompetencies", this.getInputParam().selectedIds);
        //this._Model.setProperty("/detailPage", []);
        this._Model.refresh(true);
      }
      this._hideUnhideTrees();
    };
    
    oCompetencyPickerControl.prototype._onFamiliesLoaded = function(families){
	    this._Model.setProperty("/masterPage/browse/families", families);
        this._Model.setProperty("/masterPage/browse/libraries", []);
	    this._clearSearchData(true);
        this._updateSizeLimit(families);
        this._hideUnhideTrees();
      };

    oCompetencyPickerControl.prototype._onChildNodesLoaded = function(sPath, aNodes){
      this._Model.setProperty(sPath + "/nodes", aNodes);
      this._updateSizeLimit(aNodes);
      this._Model.refresh(true);
    };

    oCompetencyPickerControl.prototype._collapseTreeContainer = function(){
       var oTreeContainer = sap.ui.getCore().byId("treeContainerId");
        if(oTreeContainer){
            for(var idx = 0, len = oTreeContainer.getContent().length; idx < len; idx++){
              if(oTreeContainer.getContent()[idx] instanceof Tree){
                oTreeContainer.getContent()[idx].collapseAll();
              }
            }
        }
    };

    oCompetencyPickerControl.prototype._onSearchResultsLoaded = function(searchResults){      
      this._collapseTreeContainer();
      var isAllTab = this._Model.getProperty('/masterPage/pressedAll');
      if(isAllTab){
        this._Model.setProperty("/masterPage/browse/libraries", []);
        this._Model.setProperty("/masterPage/search/libraries", searchResults.resultByLibraries);
        this._Model.setProperty("/masterPage/search/categories", searchResults.resultByCategories); 
        this._updateSizeLimit(searchResults.resultByLibraries);
      }
      else{
    	this._Model.setProperty("/masterPage/browse/families", []);
        this._Model.setProperty("/masterPage/search/families", searchResults.resultByFamilies);
        this._Model.setProperty("/masterPage/search/roles", searchResults.resultByRoles);   
        this._updateSizeLimit(searchResults.resultByFamilies);
      }
      this._Model.setProperty("/masterPage/search/competencies", searchResults.resultByCompetencies);
      this._Model.setProperty("/masterPage/search/behaviors", searchResults.resultByBehaviors);
      this._Model.refresh(true);
      this._hideUnhideTrees();
    };

    // ========================================
    //  Event Handlers
    // ========================================

    oCompetencyPickerControl.prototype._closeAndDestroy = function(){
        if (this._oDialog){
          this._oDialog.close();
          this._oDialog.destroy();
        }
    };

    oCompetencyPickerControl.prototype._handleToggleOpenState = function(oEvent){
      var oItemContext = oEvent.getParameter("itemContext");
      var aNodes = oItemContext.getProperty("nodes");
      if (aNodes && aNodes.length > 0 && (aNodes[0].text || aNodes[0].competencyInternalId)){
        return;
      }
      var sPath = oItemContext.getPath();
      var isAllTab = this._Model.getProperty('/masterPage/pressedAll');
      if(oEvent.getParameter("expanded")){
        this._getChildNodes(sPath, oItemContext, isAllTab);
      }
    };

    oCompetencyPickerControl.prototype._handleSelectAllLink = function(oSelectAllFlag, oEvent){
      var oSource = oEvent.getSource();
      var sPath = oSource.getBindingContext().getPath()
      var oSelectedCompData = oSource.getBindingContext().getObject();
      var aSplit = sPath.split("/");
      aSplit.pop();
      var aNodesPath = aSplit.join('/');
      var aNodes = this._Model.getProperty(aNodesPath);
      if(oSelectAllFlag){
        this._selectAll(aNodes, aNodesPath, oSelectedCompData);
      }else{
        this._unSelectAll(aNodes, aNodesPath);
      }
     this._oSplitContainer.toDetail("selectedCompetenciesPage");
     this._Model.refresh(true);
     this._hideUnhideTrees(this._Model.oData.masterPage.pressedByRole);
    }

    oCompetencyPickerControl.prototype._selectAll = function (aNodes, aNodesPath, oSelectedCompData){
        this._Model.setProperty("/masterPage/breadcrumbs", oSelectedCompData);
        if(oSelectedCompData.familyName){
            var oCompByRoleData = {
                libraryName: oSelectedCompData.familyName,
                categoryName: oSelectedCompData.roleName,
                name:oSelectedCompData.name
            };
            this._Model.setProperty("/masterPage/breadcrumbs", oCompByRoleData);
        }
        for(var i=1; i<aNodes.length; i++){
          var aNode = aNodes[i];
          var aIndex = this._Model.getProperty("/detailPage").map(function(e) { return e.internalId; }).indexOf(aNode.internalId);
          var bIndex = this._Model.getProperty("/detailPageForPreSelected").map(function(e) {return e.internalId; }).indexOf(aNode.internalId);
          if(aIndex == -1 && bIndex == -1){
            this._Model.setProperty(aNodesPath+'/'+i+'/compSelected', true);
            this._Model.getProperty("/detailPage").push(aNode);
            this.competencyIdsInDetailPage.push(aNode.internalId);
          }
        }
    }
    oCompetencyPickerControl.prototype._unSelectAll = function(aNodes, aNodesPath){
        this._Model.setProperty("/masterPage/breadcrumbs", null);
        for(var i=1; i<aNodes.length; i++){
          var aNode = aNodes[i];
          this._Model.setProperty(aNodesPath+'/'+i+'/compSelected', false);
          var aIndex = this._Model.getProperty("/detailPage").map(function(e) { return e.internalId; }).indexOf(aNode.internalId);
          if(aIndex != -1){
            this._Model.getProperty("/detailPage").splice(aIndex, 1);
            var bIndex = this.competencyIdsInDetailPage.indexOf(aNode.internalId);
            if(bIndex != -1){
                this.competencyIdsInDetailPage.splice(bIndex, 1);
            }
            var oIndex = this._Model.getProperty("/masterPage/existingCompetencies").indexOf(aNode.internalId);
            if(oIndex != -1){
              this._Model.getProperty("/masterPage/existingCompetencies").splice(oIndex, 1);
            }
          }
        }
    };

    oCompetencyPickerControl.prototype._handleCheckBox = function(oEvent){
      var oSource = oEvent.getSource();
      var oSelectedCompData = oSource.getBindingContext().getObject();
      this._Model.setProperty(oSource.getBindingContext().getPath()+"/compSelected", oSource.getSelected());
      if (oSource.getSelected()){
        this._Model.getProperty("/detailPage").push(oSelectedCompData);
        this._Model.setProperty("/masterPage/breadcrumbs", oSelectedCompData);
        this.competencyIdsInDetailPage.push(oSelectedCompData.internalId);
        if(oSelectedCompData.familyName){
            var oCompByRoleData = {
                libraryName: oSelectedCompData.familyName,
                categoryName: oSelectedCompData.roleName,
                competencyName: oSelectedCompData.competencyName,
				name: oSelectedCompData.name
            };
            this._Model.setProperty("/masterPage/breadcrumbs", oCompByRoleData);
        }
      } else {
        var sIndex = this._Model.getProperty("/detailPage").map(function(e) { return e.internalId; }).indexOf(oSelectedCompData.internalId);
        if(sIndex != -1){
          this._Model.getProperty("/detailPage").splice(sIndex, 1);
          var idIndex = this.competencyIdsInDetailPage.indexOf(oSelectedCompData.internalId);
          this.competencyIdsInDetailPage.splice(idIndex, 1);
          this._Model.setProperty("/masterPage/breadcrumbs", null);
          var oIndex = this._Model.getProperty("/masterPage/existingCompetencies").indexOf(oSelectedCompData.internalId);
          if(oIndex != -1){
            this._Model.getProperty("/masterPage/existingCompetencies").splice(oIndex, 1);
          }
        }
      }
      this._oSplitContainer.toDetail("selectedCompetenciesPage");
      if(this.getInputParam().showByRolesTab){
        var oMasterPage = this._Model.getProperty("/masterPage");
        this._enableMultipleOccurrencesCompetencies(oSelectedCompData, oMasterPage.browse.libraries);
        this._enableMultipleOccurrencesCompetencies(oSelectedCompData, oMasterPage.browse.families);
      }
      this._Model.refresh(true);
      this._hideUnhideTrees();
    };

    oCompetencyPickerControl.prototype._enableMultipleOccurrencesCompetencies = function(oSelectedCompData, oTreeData){
        if(oTreeData){
           oTreeData.forEach($.proxy(function(oData){
              if(oData && oData.internalId){
                if(!oSelectedCompData || (oSelectedCompData.internalId == oData.internalId)){
                  oData.compSelected = oSelectedCompData.compSelected;
                }
              }else if(oData.nodes && !jQuery.isEmptyObject(oData.nodes[0])){
                this._enableMultipleOccurrencesCompetencies(oSelectedCompData, oData.nodes);
              }
           }, this));
        }
    }

    oCompetencyPickerControl.prototype._onDone = function(){
      this.fireItemsSelected({
        selectedItems : this._Model.getProperty("/detailPage")
      });
      this._closeAndDestroy();
    };

    oCompetencyPickerControl.prototype._handleDelete = function(oEvent){
      var oItem = oEvent.getParameter("listItem");
      var oCompetency = oItem.getBindingContext().getObject();
      var sIndex = this._Model.getProperty("/detailPage").indexOf(oCompetency);
      if(sIndex != -1){
        this._Model.getProperty("/detailPage").splice(sIndex, 1);
        var idIndex = this.competencyIdsInDetailPage.indexOf(oCompetency.internalId);
        this.competencyIdsInDetailPage.splice(idIndex, 1);
      }
      var aIndex = this._Model.getProperty("/masterPage/existingCompetencies").indexOf(oCompetency.internalId);
      if(aIndex != -1){
        this._Model.getProperty("/masterPage/existingCompetencies").splice(aIndex, 1);
      }
      this._updateMasterData(oCompetency);
    };

    /**
     * Invoked when "Remove All" link is clicked in detail page
     * @private
     */
    oCompetencyPickerControl.prototype._handleRemoveAll = function(oEvent){
      this._Model.setProperty("/detailPage", []);
      this.competencyIdsInDetailPage = [];
      if(this.getInputParam().allowUserToChangeSelection){
        this._Model.setProperty("/masterPage/existingCompetencies", []);
      }
      this._updateMasterData();
    };

    oCompetencyPickerControl.prototype._updateMasterData = function(oCompetency){
      var oMasterPage = this._Model.getProperty("/masterPage");
      oMasterPage.breadcrumbs = null;
      this._enableCompetencies(oCompetency, oMasterPage.browse.libraries);
      this._enableCompetencies(oCompetency, oMasterPage.browse.families);
      this._enableCompetencies(oCompetency, oMasterPage.search.libraries);
      this._enableCompetencies(oCompetency, oMasterPage.search.categories);
      this._enableCompetencies(oCompetency, oMasterPage.search.families);
      this._enableCompetencies(oCompetency, oMasterPage.search.roles);
      this._enableCompetencies(oCompetency, oMasterPage.search.competencies);
      this._enableCompetencies(oCompetency, oMasterPage.search.behaviors);
      this._Model.refresh(true);
      this._hideUnhideTrees();
    };

    /**
     * Updates competency data in the model and refreshes it
     * @param oCompetency
     * @param oMasterData
     * @private
     */
    oCompetencyPickerControl.prototype._enableCompetencies = function(oCompetency, oMasterData){
      if(oMasterData){
        oMasterData.forEach($.proxy(function(oData){
          if(oData && oData.internalId){
            if(!oCompetency || (oCompetency.internalId == oData.internalId)){
              oData.compSelected = false;
            }
          }else if(oData.nodes && !jQuery.isEmptyObject(oData.nodes[0])){
            this._enableCompetencies(oCompetency, oData.nodes);
          }
        }, this));
      }
    };

    oCompetencyPickerControl.prototype._handleByRole = function(oEvent){
        var isRoleTab = oEvent.getSource().sId == 'roleBtnId';
        this._Model.setProperty('/masterPage/pressedByRole', isRoleTab);
        this._Model.setProperty('/masterPage/pressedAll', !isRoleTab);
        this._Model.setProperty("/masterPage/breadcrumbs", null);
        this._oSearchField.setValue("");
        this._collapseTreeContainer();
        var filterOptions = null;
        this._clearSearchData(isRoleTab);
        if(isRoleTab){
          var families = this._Model.getProperty("/masterPage/browse/families");
          if(!families || families.length == 0){
            this._getDistinctFamilies();
		  }
        }
        else {
          var libraries = this._Model.getProperty("/masterPage/browse/libraries");
          if(!libraries || libraries.length == 0){
			this._getDistinctCompetencyLibraries();
          }
        }
        filterOptions = this._getFilterOptions();
        if(this.getInputParam().useBehavior && filterOptions.length == 4){
          filterOptions.push({"name": "behaviors", "label": this._i18n.getText("JDMNG_COMPETENCY_PICKER_SEARCH_BEHAVIORS")});
        }
        this._Model.oData.masterPage.filterOptions = filterOptions;
        this._hideUnhideTrees();
    };
       
    oCompetencyPickerControl.prototype._hideTree = function(oTree){
      if(oTree instanceof Tree){
        oTree.setVisible(false);
      }
    }
    
    oCompetencyPickerControl.prototype._hideUnhideTrees = function(){
      if(this.getInputParam().showByRolesTab){
        var oMasterPage = this._Model.getProperty("/masterPage");
        var isAllTab = this._Model.getProperty("/masterPage/pressedAll");
        if(isAllTab){
          if(! $.isEmptyObject(oMasterPage.browse.libraries)){
            sap.ui.getCore().byId("librariesTreeId").setVisible(true);
          }
          sap.ui.getCore().byId("familiesTreeId").setVisible(false);
        }else{
          sap.ui.getCore().byId("librariesTreeId").setVisible(false);
          if(! $.isEmptyObject(oMasterPage.browse.families)){
            sap.ui.getCore().byId("familiesTreeId").setVisible(true);
          }
        }
      }
    };

    oCompetencyPickerControl.prototype._handleSearch = function(oEvent){
      var sQuery = oEvent.getParameter("query");
      this._Model.setProperty("/masterPage/searchedText", sQuery);
      var isRoleTab = this._Model.getProperty('/masterPage/pressedByRole');
      if (!sQuery){
        if(isRoleTab) {
          var families = this._Model.getProperty("/masterPage/browse/families");
          if(!families || families.length == 0){
            this._getDistinctFamilies();
          }
        }
        else {
          var libraries = this._Model.getProperty("/masterPage/browse/libraries");
          if(!libraries || libraries.length == 0){
			this._getDistinctCompetencyLibraries();
          }
        }
        this._clearSearchData(!isRoleTab);
        this._Model.setProperty("/masterPage/searchedText", "");
        this._hideTree(sap.ui.getCore().byId("familiesSearchTreeId"));
        this._hideTree(sap.ui.getCore().byId("librariesSearchTreeId"));
      } else {
          this._searchCompetencyByDefinedEnum();
          this._clearSearchData(isRoleTab);
      }
      if (sQuery){
        this._hideTree(sap.ui.getCore().byId("familiesTreeId"));
        this._hideTree(sap.ui.getCore().byId("librariesTreeId"));
      }
      this._Model.refresh(true);
    };
    
    oCompetencyPickerControl.prototype._clearSearchData = function(isRoleTab){
      if(isRoleTab) {
        this._Model.setProperty("/masterPage/search/libraries", []);
        this._Model.setProperty("/masterPage/search/categories", []);
      }
      else {
        this._Model.setProperty("/masterPage/search/families", []);
        this._Model.setProperty("/masterPage/search/roles", []);
      }
      this._Model.setProperty("/masterPage/search/competencies", []);
      this._Model.setProperty("/masterPage/search/behaviors", []);
      this._Model.setProperty("/masterPage/breadcrumbs", null);
    }

    oCompetencyPickerControl.prototype._searchCompetencyByDefinedEnum = function(){
      var sSearchedText = this._Model.getProperty("/masterPage/searchedText");
      var sFilter = this._Model.getProperty("/masterPage/selectedFilter");
      if(!sSearchedText || !sFilter){
        return;
      }
      this._getSearchResults(sFilter, sSearchedText);
      this._hideTree(sap.ui.getCore().byId("familiesTreeId"));
      this._hideTree(sap.ui.getCore().byId("librariesTreeId"));
    };

    oCompetencyPickerControl.prototype._handleLiveChange = function(oEvent){
      this._Model.setProperty("/masterPage/enableFilter", !!oEvent.getParameter("newValue"));
    };

    return oCompetencyPickerControl;
});