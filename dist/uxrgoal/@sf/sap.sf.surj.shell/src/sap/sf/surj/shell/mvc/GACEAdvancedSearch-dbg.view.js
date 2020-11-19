/**
 * @class
 * @name sap.sf.surj.shell.mvc.GACEAdvancedSearch
 */

sap.ui.define([
    'jquery.sap.global',
    'sap/sf/surj/shell/controls/UserPhoto',
    'sap/sf/surj/shell/controls/Table',
    'sap/m/Column'
], function ($, UserPhoto, Table, Column) {
    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
    var employmentStatusFormatter = function (employments, isActive) {
        var status;
        if (employments && employments.length > 0) {
            status = employments[0].status;
        }
        if (!status) {
            status = (isActive == "true" ? rb.getText('COMMON_Active') : rb.getText('COMMON_InActive'));
        }
        return status;
    };
    var isContingentWorkerFormatter = function (sIsContingentWorker) {
        var sType = '';
        if (typeof sIsContingentWorker !== "string") {
            return sType;
        }

        var sLabel;
        if (sIsContingentWorker.search(/^(true|yes|y)$/i) > -1) {
            sLabel = 'COMMON_Yes';
        } else if (sIsContingentWorker.search(/^(false|no|n)$/i) > -1) {
            sLabel = 'COMMON_No';
        } else {
            sLabel = 'COMMON_Unknown';
        }
        sType = rb.getText(sLabel);
        return sType;
    };

    sap.ui.jsview('sap.sf.surj.shell.mvc.GACEAdvancedSearch', {
        createContent : function(oController) {
            /**
             * @inner
             * @param {String} sId
             * @param {Object} oContext
             */
            function createField(sId, oContext) {
                var oObject = oContext.getObject();
                var maxLength = 100;
                var valueStateText = rb.getText('UNIVERSAL_PERSON_SEARCH_MAX_CHARACTERS_EXCEEDED',[ maxLength ]);
                var input;
                switch (oObject.dataType) {
                    case "String":
                            input = new sap.m.Input({
                                width:'100%',
                                valueStateText: valueStateText,
                                value : "{/textSearchFieldValue/"+oObject.field+"}"
                            });
                            input.attachChange(oController.onDateTypeStringInputChange, oController);
                            break;
                            //create items
                    case "StringReadOnly":
                        this.mModel = oContext.getModel();
                        var param = {
                            id: oObject.fieldListValue[0],
                            name: oObject.fieldListValueLabel[0]
                        };
                        this.mModel.setProperty("/textSearchFieldValue/" + oObject.field, oObject.fieldListValueLabel[0]);
                        this.mModel.setProperty("/selectedFieldValues/" + oObject.field, param);
                            input = new sap.m.Input({
                                width:'100%',
                                value : oObject.fieldListValueLabel[0],
                                editable: false
                            });
                            break;
                            //create items
                    case "StringCombo":      
                            var items = [];
                            for(var i=0; i< oObject.fieldListValue.length; i++){
                                var item = new sap.ui.core.Item({
                                    text: oObject.fieldListValueLabel[i],
                                    key: oObject.fieldListValue[i]
                                });
                                items.push(item);
                            };
                            input = new sap.m.Select({
                                items: items,
                                selectedKey: "{/textSearchFieldValue/"+oObject.field+"}",
                                width:'100%'
                            });
                        break;

                    case "AutoComplete":
                        $.sap.require('sap.sf.surj.shell.controls.GACESearchInput');
                        input = new sap.sf.surj.shell.controls.GACESearchInput({
                            searchType : "GACESearchField",
                            value : "{/textSearchFieldValue/"+oObject.field+"}",
                            itemSelected: [oController.selectSearchResult, oController],
                            itemChange: [oController.onChange, oController],
                            showButton: true
                        });
                        break;

                    //Hire Date need DatePicker to select a date
                    case "DatePicker":
                        input = new sap.m.DatePicker({
                            displayFormat: rb.getText('COMMON_DateFormat'),
                            valueFormat: "yyyy-MM-dd",
                            width:'100%',
                            value : "{/textSearchFieldValue/"+oObject.field+"}"
                        });
                        input.attachChange(oController.onHireDateChange, oController);
                        break;
                    }
                    var oLabel = new sap.m.Label({
                        width : '100%',
                        labelFor : input.getId()
                    });
                    oLabel.setText(rb.getText('LABEL_FORMAT', [oObject.labelText]));
                    $.sap.require('sap.sf.surj.shell.controls.Container');
                    return new sap.sf.surj.shell.controls.Container({
                        content : [
                            oLabel,
                            input
                        ],
                        visible: oObject.visible
                    }).addStyleClass('surjGACESearchField');
            }
            var oHeader = new sap.m.Bar({
                contentLeft: [new sap.m.Label({
                    text: rb.getText('COMMON_FindUser_Search_Results'),
                    textAlign: "Left",
                }).addStyleClass('surjGACESubHeader')],
                contentRight: [new sap.m.ToggleButton({
                    icon: "sap-icon://show",
                    enabled: true,
                    pressed: false,
                    press: [oController.onTogglePress, oController]
                })]

            }).addStyleClass('surjGACEHeader');

            var nameLabel = new sap.m.Label({
                text: "{name}",
                tooltip: "{name}",
                customData: {
                    key: "assignmentId",
                    value: '{assignmentId}'
                }
            }).addStyleClass("leaf");

            var searchResultsTable = this.searchResultsTable = new Table(this.getId() + '-searchResultsTable', {
                updateFinished : [oController.resultsUpdateFinished, oController],
                columns : [
                    new Column({
                        width : '40px',
                        header: new sap.m.Label({
                            tooltip: rb.getText('COMMON_Select'),
                            text: rb.getText('COMMON_Select')
                        })
                    }),
                    new Column({
                        width: '50px',
                        visible: oController.getPhotoViewPermission(),
                        header: new sap.m.Label({
                            tooltip: rb.getText('COMMON_USER_PHOTO'),
                            text: rb.getText('COMMON_USER_PHOTO')
                        })
                    }),
                    new Column({
                        styleClass: Table.RESIZABLE_COLUMN_CLASS_NAME,
                        mergeDuplicates: true,
                        mergeFunctionName : "data#assignmentId",
                        visible : true,
                        header : new sap.m.Label({
                            tooltip : rb.getText('COMMON_Name'),
                            text : rb.getText('COMMON_Name')
                        })
                    }),
                    new Column({
                        styleClass: Table.RESIZABLE_COLUMN_CLASS_NAME,
                        visible:{
                            parts : [{
                                path:'/columnVisiblity/JOBTITLE'
                            },
                            {
                                path:'/columnViewSettings/JOBTITLE'
                            }
                            ],
                            formatter : function(showColumn, showCheckBox) {
                                return showColumn && showCheckBox;
                            }
                        },
                        header: new sap.m.Label({
                            tooltip: rb.getText('COMMON_Jobtitle'),
                            text: rb.getText('COMMON_Jobtitle')
                        })
                    }),
                    new Column({
                        styleClass: Table.RESIZABLE_COLUMN_CLASS_NAME,
                        visible:{
                            parts : [{
                                path:'/columnVisiblity/EMAIL'
                            },
                            {
                                path:'/columnViewSettings/EMAIL'
                            }
                            ],
                            formatter : function(showColumn, showCheckBox) {
                                return showColumn && showCheckBox;
                            }
                        },
                        header: new sap.m.Label({
                            tooltip: rb.getText('EMPFILE_HRIS_EMAIL'),
                            text: rb.getText('EMPFILE_HRIS_EMAIL')
                        })
                    }),
                    new Column({
                        styleClass: Table.RESIZABLE_COLUMN_CLASS_NAME,
                        visible:{
                            parts : [{
                                path:'/columnVisiblity/DIVISION'
                            },
                            {
                                path:'/columnViewSettings/DIVISION'
                            }
                            ],
                            formatter : function(showColumn, showCheckbox) {
                                return showColumn && showCheckbox;
                            }
                        },
                        header: new sap.m.Label({
                            tooltip: rb.getText('COMMON_Division'),
                            text: rb.getText('COMMON_Division')
                        })
                    }),
                    new Column({
                        styleClass: Table.RESIZABLE_COLUMN_CLASS_NAME,
                        visible: {
                            parts : [{
                                path:'/columnVisiblity/DEPARTMENT'
                            },
                            {
                                path:'/columnViewSettings/DEPARTMENT'
                            }
                            ],
                            formatter : function(showColumn, showCheckbox) {
                                return showColumn && showCheckbox;
                            }
                        },
                        header: new sap.m.Label({
                            tooltip: rb.getText('COMMON_GACEDepartment'),
                            text: rb.getText('COMMON_GACEDepartment')
                        })
                    }),
                    new Column({
                        styleClass: Table.RESIZABLE_COLUMN_CLASS_NAME,
                        visible: {
                            parts: [
                                {
                                    path: '/columnVisiblity/CONTINGENTWORKER'
                                },
                                {
                                    path: '/columnViewSettings/CONTINGENTWORKER'
                                }
                            ],
                            formatter: function (bShowColumn, bShowCheckBox) {
                                return bShowColumn && bShowCheckBox;
                            }
                        },
                        header: new sap.m.Label({
                            tooltip: rb.getText('COMMON_Contingent_Worker'),
                            text: rb.getText('COMMON_Contingent_Worker')
                        }).addStyleClass('surjGACEContingentWorkerColumn')
                    }),
                    new Column({
                        styleClass: Table.RESIZABLE_COLUMN_CLASS_NAME,
                        visible: {
                            parts : [{
                                path:'/columnVisiblity/LOCATION'
                            },
                            {
                                path:'/columnViewSettings/LOCATION'
                            }
                            ],
                            formatter : function(showColumn, showCheckbox) {
                                return showColumn && showCheckbox;
                            }
                        },
                        header: new sap.m.Label({
                            tooltip: rb.getText('COMMON_Location'),
                            text: rb.getText('COMMON_Location')
                        })
                    }),
                    new Column({
                        styleClass: Table.RESIZABLE_COLUMN_CLASS_NAME,
                        visible: "{/columnViewSettings/STATUS}",
                        header: new sap.m.Label({
                        tooltip: rb.getText('COMMON_Status'),
                        text: rb.getText('COMMON_Status')
                        })
                    })
                ],
                items : {
                    path : '/searchResultItems',
                    template : new sap.m.ColumnListItem({
                        cells : [
                            new sap.m.RadioButton({
                                selected: "{selectedItem}"
                            }).addAriaLabelledBy(nameLabel.getId()),
                            new UserPhoto({
                                tooltip: "{name}",
                                user: "{oUserPhoto}",
                                profile: sap.sf.surj.shell.controls.PhotoProfile.SQUARE_40,
                                nameDirection: sap.sf.surj.shell.controls.NameDirection.EAST
                            }).addStyleClass("surjResultPhoto"),
                            nameLabel,
                            new sap.m.HBox({
                                width: "100%",
                                items: [
                                    new sap.m.Label({
                                        width: '100%',
                                        tooltip: "{employments/0/title}",
                                        text: "{employments/0/title}"
                                    }).addStyleClass('surjGACETitle').addStyleClass("leaf"),
                                    new sap.ui.core.Icon({
                                        src: "{sIconName}",
                                        tooltip: "{sTooltip}"
                                    })
                                ]
                            }).addStyleClass("surjresult"),
                            new sap.m.Link({
                                href: {
                                    path: "email",
                                    formatter: function(email) {
                                        return "mailto:" + email;
                                    }
                                },
                                tooltip : "{email}",
                                text : "{email}"
                            }).addStyleClass("leaf"),
                            new sap.m.Label({
                                tooltip : "{employments/0/divisionName}",
                                text : "{employments/0/divisionName}"
                            }).addStyleClass("leaf"),
                            new sap.m.Label({
                                tooltip : "{employments/0/departmentName}",
                                text : "{employments/0/departmentName}"
                            }).addStyleClass("leaf"),
                            new sap.m.Label({
                                tooltip: {
                                    path: "isContingentWorker",
                                    formatter: isContingentWorkerFormatter
                                },
                                text: {
                                    path: "isContingentWorker",
                                    formatter: isContingentWorkerFormatter
                                }
                            }).addStyleClass("leaf"),
                            new sap.m.Label({
                                tooltip : "{employments/0/locationName}",
                                text : "{employments/0/locationName}"
                            }).addStyleClass("leaf"),
                            new sap.m.Label({
                                tooltip : {
                                    parts : ["employments", "isActive"],
                                    formatter : employmentStatusFormatter
                                },
                                text : {
                                    parts : ["employments", "isActive"],
                                    formatter: employmentStatusFormatter
                                }
                            }).addStyleClass("leaf"),
                        ]
                    }).addStyleClass("surjGACESearchResultTableRow").addStyleClass("globalMenuItem").data("sDuplicate","{sDuplicate}", true)
                }
            }).addStyleClass('sapUiSizeCompact').addStyleClass("surjGACESearchResultTable").addStyleClass("globalMenu");
            
            return new sap.m.NavContainer(this.getId() + '-advancedSearchContainer', {
                pages : [
                    new sap.m.Page(this.getId() + '-advancedSearchFields', {
                        showHeader : false,
                        busy : '{/busy}',
                        content : [
                            new sap.m.Panel({
                                content : {
                                    path : '/Fields',
                                    factory : createField
                                }
                            }).addStyleClass('surjGACEBorder'),
                            new sap.m.Panel({
                                headerText : rb.getText('COMMON_Advanced_Search_Options'),
                                expandable : true,
                                expanded : '{/expandAdvanced}',
                                visible : {
                                    parts : [{
                                        path: '/AdvancedFields/length'
                                    }],
                                    formatter : function(iLength){
                                        return iLength > 0;
                                    }
                                },
                                content : {
                                    path : '/AdvancedFields',
                                    factory : createField
                                }
                            }).addStyleClass('surjGACEPanelBorder')
                        ],
                        footer : new sap.m.Bar({
                            contentRight : [
                                new sap.m.Button({
                                    enabled : {
                                        parts : [{
                                            path:'/busy'
                                        }],
                                        formatter : function(bBusy) {
                                            return !bBusy;
                                        }
                                    },
                                    text : rb.getText('COMMON_Cancel'),
                                    press : [oController.cancelSearch, oController]
                                }),
                                new sap.m.Button(this.getId() + '-searchButton', {
                                    enabled : {
                                        parts : [{
                                            path:'/busy'
                                        }],
                                        formatter : function(bBusy) {
                                            return !bBusy;
                                        }
                                    },
                                    type : 'Emphasized',
                                    text : rb.getText('COMMON_Search'),
                                    press : [oController.search, oController]
                                })
                            ]
                        })
                    }).addStyleClass('surjGACEBackground'),

                    new sap.m.Page(this.getId() + '-advancedSearchResults', {
                        showHeader : true,
                        customHeader : oHeader,
                        content : [
                                   new sap.m.VBox(this.getId() + '-advancedSearchCheckBox', {
                                       visible: false,
                                       items: [
                                           new sap.m.HBox({
                                               items: [
                                                   new sap.m.CheckBox({
                                                       selected: "{/columnViewSettings/JOBTITLE}",
                                                       visible: "{/columnVisiblity/JOBTITLE}",
                                                       enabled: true,
                                                       tooltip: rb.getText('COMMON_Jobtitle'),
                                                       text: rb.getText('COMMON_Jobtitle')
                                                   }),
                                                   new sap.m.CheckBox({
                                                       selected: "{/columnViewSettings/EMAIL}",
                                                       visible: "{/columnVisiblity/EMAIL}",
                                                       enabled: true,
                                                       tooltip: rb.getText('EMPFILE_HRIS_EMAIL'),
                                                       text: rb.getText('EMPFILE_HRIS_EMAIL')
                                                   }),
                                                   new sap.m.CheckBox({
                                                	   selected: "{/columnViewSettings/DIVISION}",
                                                       visible: "{/columnVisiblity/DIVISION}",
                                                       tooltip: rb.getText('COMMON_Division'),
                                                       text: rb.getText('COMMON_Division')
                                                   }),
                                                   new sap.m.CheckBox({
                                                	   selected: "{/columnViewSettings/DEPARTMENT}",
                                                       visible: "{/columnVisiblity/DEPARTMENT}",
                                                       tooltip: rb.getText('COMMON_GACEDepartment'),
                                                       text: rb.getText('COMMON_GACEDepartment')
                                                   }),
                                                   new sap.m.CheckBox({
                                                       selected: "{/columnViewSettings/CONTINGENTWORKER}",
                                                       visible: "{/columnVisiblity/CONTINGENTWORKER}",
                                                       tooltip: rb.getText('COMMON_Contingent_Worker'),
                                                       text: rb.getText('COMMON_Contingent_Worker')
                                                   }),
                                                   new sap.m.CheckBox({
                                                	   selected: "{/columnViewSettings/LOCATION}",
                                                       visible: "{/columnVisiblity/LOCATION}",
                                                       tooltip: rb.getText('COMMON_Location'),
                                                       text: rb.getText('COMMON_Location')
                                                   }),
                                                   new sap.m.CheckBox({
                                                       selected: "{/columnViewSettings/STATUS}",
                                                       visible: true,
                                                       tooltip: rb.getText('COMMON_Status'),
                                                       text: rb.getText('COMMON_Status')
                                                   })
                                               ]

                                           }).addStyleClass('surjGACECheckbox')
                                       ]
                                   }),                                   
                            searchResultsTable
                        ],
                        footer : new sap.m.Bar({
                            contentRight : [
                                new sap.m.Button({
                                    enabled : {
                                        parts : [{
                                            path:'/busy'
                                        }],
                                        formatter : function(bBusy) {
                                            return !bBusy;
                                        }
                                    },
                                    text : rb.getText('COMMON_Cancel'),
                                    press : [oController.cancelSearch, oController]
                                }),
                                new sap.m.Button({
                                    enabled: {
                                        parts: [{
                                            path: '/busy'
                                        }],
                                        formatter: function(bBusy) {
                                            return !bBusy;
                                        }
                                    },
                                    text : rb.getText('COMMON_Select'),
                                    press: [oController.selectUser, oController]
                                })
                            ]
                        })
                    })
                ]
            });
        },

        /**
         * @return {String}
         */
        getControllerName : function() {
            return 'sap.sf.surj.shell.mvc.GACEAdvancedSearch';
        }
    });
});