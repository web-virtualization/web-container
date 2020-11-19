
sap.ui.define("sap/sf/surj/shell/util/FormGenerationUtil", [
    "sap/base/util/isEmptyObject",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Label",
    "sap/m/Table",
    "sap/m/Text",
    "sap/ui/core/ListItem",
    "sap/ui/layout/form/FormElement",
    "sap/ui/mdc/Field",
    "sap/ui/mdc/enum/FieldDisplay",
    "sap/ui/mdc/enum/EditMode",
    "sap/ui/mdc/field/InParameter",
    "sap/ui/mdc/field/FieldValueHelp",
    "sap/ui/mdc/field/FieldValueHelpMTableWrapper",
    "sap/ui/mdc/field/ListFieldHelp",
    "sap/ui/mdc/field/OutParameter",
    "sap/ui/model/odata/v4/ODataModel"
], function(isEmptyObject, Column, ColumnListItem, Label, Table, Text, ListItem, FormElement, 
    Field, FieldDisplay, EditMode, InParameter, FieldValueHelp, FieldValueHelpMTableWrapper, ListFieldHelp, OutParameter,
    ODataModel) {

    var FormGenerationUtil = /** @lends sap.sf.surj.shell.util.FormGenerationUtil */ {

        /**
        * The function returns the Promise for an Array of FormElements wrapping fields based on the annotations for the provided entity type.
        *
        * @param {object} oConfig The config object. It should have the entity type, service url or meta model to query the annotations.
        * @returns {Promise.<Array>} A Promise for an Array, which has FormElements wrapping fields created based on the annotations.
        *
        */
        createFormElements : function(oConfig) {
            return new Promise(function(resolve, reject) {
                var sEntityType = oConfig.entityType;
                var oMetaModel = oConfig.metaModel;
                var sServiceUrl = oConfig.serviceUrl;
                if (!sEntityType) {
                    reject("There is no entity type specified!");
                } else if (!oMetaModel) {
                	if(!sServiceUrl){
                		reject("There is no service url provided to create the odata v4 model!");
                	} else {
                		oMetaModel = new ODataModel({
                            serviceUrl: sServiceUrl,
                            annotationURI: oConfig.annotationURI || sServiceUrl + "/Annotations.xml",
                            synchronizationMode: "None"
                        }).getMetaModel();
                	}
                }
                //sap.ui.getCore().loadLibrary("sap.ui.mdc");
                var sSchema = sEntityType.split(".")[0];
                oMetaModel.requestObject("/" + sEntityType).then(function(oData) {
                    var aEntries = Object.entries(oData);
                    var aFormElements = [];
                    aEntries.forEach(function(oEntry) {
                        var sName = oEntry[0];
                        var oTypeInfo = oEntry[1];
                        if (!sName.startsWith("$")) {
                            var oAnnotations = oMetaModel.getObject("/" + sEntityType + "/" + sName + "@");
                            if (!isEmptyObject(oAnnotations)) {
                            	aFormElements.push(FormGenerationUtil.createFormElement(sName, oTypeInfo, oAnnotations, oMetaModel, sSchema));
                            }
                        }
                    });
                    resolve(aFormElements);
                });
            });
        },
        
        editFormatter : function(){
        	var sEditMode = EditMode.Editable;
        	for(var i=0; i < arguments.length; i++){
        		if(arguments[i] === false || arguments[i] === EditMode.ReadOnly){
        			sEditMode = EditMode.ReadOnly;
        			break;
        		}
        	}
        	return sEditMode;
        },
        
        createFormElement : function(sName, oTypeInfo, oAnnotations, oMetaModel, sSchema, aEditCondition){
        	 var sType = oTypeInfo.$Type.split(".")[1];
             var oFieldHelp, sDisplay,
                 oAdditionalValueFormatter = null, oFieldControls = {};
             if(aEditCondition){
            	 oFieldControls.editModeFormatter = {
            		parts : aEditCondition,
            		formatter : this.editFormatter
            	}
             }
             var aAnnotationKeys = Object.keys(oAnnotations);
             aAnnotationKeys.forEach(function(sAnnotationKey) {
                 var aAnnotation = sAnnotationKey.split("#");
                 //var sQualifier = aAnnotation[1];
                 var oAnnotation = oAnnotations[sAnnotationKey]
                 switch (aAnnotation[0]) {
                     case "@com.sap.vocabularies.Common.v1.Text":
                         oAdditionalValueFormatter = FormGenerationUtil.parseTextAnnotation(oAnnotation);
                         break;
                     case "@com.sap.vocabularies.UI.v1.TextArrangement":
                         sDisplay = FormGenerationUtil.parseTextArrangementAnnotation(oAnnotation);
                         break;
                     case "@com.sap.vocabularies.UI.v1.ConnectedFields":
                         var oResult = FormGenerationUtil.parseConnectedFieldsAnnotation(oAnnotation);
                         oAdditionalValueFormatter = oResult.additionValueFormatter;
                         sDisplay = oResult.display;
                         break;
                     case "@com.sap.vocabularies.Common.v1.ValueList":
                         if (oAnnotations["@com.sap.vocabularies.Common.v1.ValueListWithFixedValues"]) {
                             oFieldHelp = FormGenerationUtil.parseFixedValueListAnnotation(oAnnotation);
                         } else {
                             oFieldHelp = FormGenerationUtil.parseValueListAnnotation(oAnnotation, oMetaModel, sSchema);
                         }
                         break;
                     case "@com.sap.vocabularies.Common.v1.FieldControl":
                         oFieldControls = FormGenerationUtil.parseFieldControlAnnotation(oAnnotation);
                         break;
                     default:
                         break;
                 }
             });

             return new FormElement({
                 label: new Label({
                     text: oAnnotations["@com.sap.vocabularies.Common.v1.Label"]
                 }),
                 fields: [
                     new Field({
                         required: oFieldControls.requiredFormatter ? oFieldControls.requiredFormatter : false,
                         value: "{path: '" + sName +  "', type: 'sap.ui.model.odata.type." + sType + "' " + FormGenerationUtil.getFormatOptions(sType, oTypeInfo) + (sName.includes("/") ? ", parameters: { $$noPatch: true }" : "" ) + "}",
                         additionalValue: oAdditionalValueFormatter ? oAdditionalValueFormatter : "",
                         display: sDisplay,
                         fieldHelp: oFieldHelp,
                         editMode: oFieldControls.editModeFormatter ? oFieldControls.editModeFormatter : EditMode.Editable,
                         visible: oFieldControls.visibleFormatter ? oFieldControls.visibleFormatter : true,
                         delegate: {
                             name: "sap/ui/mdc/odata/v4/FieldBaseDelegate",
                             payload : {}
                         }
                     }).addDependent(oFieldHelp)
                 ]
             });         
        },
        
        getFormatOptions : function(sType, oTypeInfo){
        	var sFormatOptions = "";
            if(sType == "TimeOfDay"){
            	sFormatOptions = ", formatOptions: {style: 'short'}, targetType: 'string'"
            } else if(sType === "Decimal"){
            	sFormatOptions = ", formatoptions: {maxFractionDigits: "+oTypeInfo.$Scale+", decimalSeparator: '.'}, constraints: {precision: "+oTypeInfo.$Precision+", scale: "+oTypeInfo.$Scale+"}"
            }
            return sFormatOptions;
        },
        
        parseTextAnnotation: function(oTextAnnotation) {
            return {path: oTextAnnotation.$Path};
        },

        parseTextArrangementAnnotation: function(oTextArrangementAnnotation) {
            var sDisplay = oTextArrangementAnnotation.$EnumMember.split("/")[1];
            switch (sDisplay) {
                case "TextFirst":
                    sDisplay = FieldDisplay.DescriptionValue;
                    break;
                case "TextLast":
                    sDisplay = FieldDisplay.ValueDescription;
                    break;
                case  "TextSeparate":
                    sDisplay = FieldDisplay.Value;
                    break;
                case "TextOnly":
                    sDisplay = FieldDisplay.Description;
                    break;
                default:
                    break;
            }
            return sDisplay;
        },

        parseConnectedFieldsAnnotation: function(oConnectedFieldsAnnotation) {
            var oResult = {
                display: FieldDisplay.Description
            };
            var aParts = [];
            var aFieldsMap = {};
            var aFieldEntries = Object.entries(oConnectedFieldsAnnotation.Data);
            aFieldEntries.forEach(function(oFieldEntry, index) {
                aParts.push(oFieldEntry[1].Value.$Path);
                aFieldsMap["{" + oFieldEntry[0] + "}"] = index; //Store the index of the path for formatter
            });
            var sTemplate = oConnectedFieldsAnnotation.Template;
            oResult.additionValueFormatter = {
                parts: aParts,
                formatter: function() {
                    var args = arguments;
                    return sTemplate.replace(/\{\w+\}/g, function(match) {
                        return args[aFieldsMap[match]];
                    });
                }
            };
            return oResult;
        },

        parseValueListAnnotation: function(oValueListAnnotation, oMetaModel, sSchema) {
            var sPath = oValueListAnnotation.CollectionPath;
            var aParameters = oValueListAnnotation.Parameters;
            var aInParameters = [], aOutParameters = [], mValueListProperties = {}, oFieldHelp;
            aParameters.forEach(function(oParameter) {
                var sParamType = oParameter.$Type;
                mValueListProperties[oParameter.ValueListProperty] = oMetaModel.getObject("/" + sSchema + "." + sPath + "/" + oParameter.ValueListProperty + "@com.sap.vocabularies.Common.v1.Label");
                switch (sParamType) {
                    case "com.sap.vocabularies.Common.v1.ValueListParameterInOut":
                        aInParameters.push(new InParameter({
                            value: "{" + oParameter.LocalDataProperty.$PropertyPath + "}",
                            helpPath: oParameter.ValueListProperty
                        }));
                        aOutParameters.push(new OutParameter({
                            value: "{" + oParameter.LocalDataProperty.$PropertyPath + "}",
                            helpPath: oParameter.ValueListProperty
                        }));
                        break;
                    case "com.sap.vocabularies.Common.v1.ValueListParameterIn":
                        aInParameters.push(new InParameter({
                            value: "{" + oParameter.LocalDataProperty.$PropertyPath + "}",
                            helpPath: oParameter.ValueListProperty
                        }));
                        break;
                    case "com.sap.vocabularies.Common.v1.ValueListParameterOut":
                        aOutParameters.push(new OutParameter({
                            value: "{" + oParameter.LocalDataProperty.$PropertyPath + "}",
                            helpPath: oParameter.ValueListProperty
                        }));
                        break;
                    default:
                        break;
                }
            });
            var sFilterFields = oValueListAnnotation.SearchSupported ? "*" + Object.keys(mValueListProperties).join(",") + "*" : "";
            var sTitle = oValueListAnnotation.Label;
            var aColumns = [], aCells = [];
            var aColumnEntries = Object.entries(mValueListProperties);
            aColumnEntries.forEach(function(oColumnEntry) {
                aColumns.push(new Column({header: new Label({text: oColumnEntry[1]})}));
                aCells.push(new Text({text: "{" + oColumnEntry[0] + "}"}));
            });
            oFieldHelp = new FieldValueHelp({
                filterFields: sFilterFields,
                title: sTitle,
                inParameters: aInParameters,
                outParameters: aOutParameters,
                content: new FieldValueHelpMTableWrapper({
                    table: new Table({
                        width: "40rem",
                        columns: aColumns,
                        items: {
                            path: "/" + sPath,
                            template: new ColumnListItem({
                                cells: aCells
                            }),
                            templateShareable: true
                        }
                    })
                }),
                delegate: {
                    name: "sap/ui/mdc/odata/v4/FieldValueHelpDelegate",
                    payload: {}
                }
            }).attachOpen(function(oEvent) {
                // adapt table width by reading out suggestion parameter;
            });
            return oFieldHelp;
        },

        parseFixedValueListAnnotation: function(oValueListAnnotation) {
            var sPath = oValueListAnnotation.CollectionPath;
            var aParameters = oValueListAnnotation.Parameters;
            var sItemKey, sItemText, oFieldHelp;
            aParameters.forEach(function(oParameter) {
                var sType = oParameter.$Type;
                if (sType == "com.sap.vocabularies.Common.v1.ValueListParameterOut") {
                    sItemKey = oParameter.ValueListProperty;
                } else if (sType == "com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly") {
                    sItemText = oParameter.ValueListProperty;
                }
            });
            oFieldHelp = new ListFieldHelp({
                items: {
                    path: "/" + sPath,
                    template: new ListItem({
                        text: "{" + sItemText + "}",
                        key: "{" + sItemKey + "}"
                    }),
                    templateShareable: true
                }
            });
            return oFieldHelp;
        },

        parseFieldControlAnnotation: function(oFieldControlAnnotation) {
            var sFCPath, oFieldControls = {};
            if (oFieldControlAnnotation.$If) {
                sFCPath = oFieldControlAnnotation.$If[0].$Path;
                var sMode = oFieldControlAnnotation.$If[1].$EnumMember.split("/")[1];
                if (sMode === "Mandatory") {
                    oFieldControls.requiredFormatter = {
                        path: sFCPath,
                        formatter: function(isTrue) {
                            return isTrue;
                        }
                    };
                } else if (sMode === "Optional") {
                    oFieldControls.requiredFormatter = {
                        path: sFCPath,
                        formatter: function(isTrue) {
                            return !isTrue;
                        }
                    };
                } else if (sMode === "ReadOnly") {
                	var oEditCondition = {
                            path: sFCPath,
                            formatter: function(isTrue) {
                                return isTrue ? EditMode.ReadOnly : EditMode.Editable;
                            }
                    };
                	if(oFieldControls.editModeFormatter){
                		oFieldControls.editModeFormatter.parts.push(oEditCondition);
                	} else {
                		oFieldControls.editModeFormatter = oEditCondition;
                	}
                } else if (sMode === "Inapplicable" || sMode === "Hidden") {
                    oFieldControls.visibleFormatter = {
                        path: sFCPath,
                        formatter: function(isTrue) {
                            return !isTrue;
                        }
                    };
                }
            } else if (oFieldControlAnnotation.$Path) {
                sFCPath = oFieldControlAnnotation.$Path;
                oFieldControls.requiredFormatter = {
                    path: sFCPath,
                    type : "sap.ui.model.odata.type.Boolean",
                    formatter: function(bValue) {
                        return bValue === 7; //Mandatory
                    }
                };
                oFieldControls.editModeFormatter = {
                    path: sFCPath,
                    formatter: function(bValue) {
                        return bValue === 1 ? EditMode.ReadOnly : EditMode.Editable; //ReadOnly
                    }
                };
                oFieldControls.visibleFormatter = {
                    path: sFCPath,
                    type : "sap.ui.model.odata.type.Boolean",
                    formatter: function(bValue) {
                        return bValue !== 0; //Inapplicable or Hidden
                    }
                };
            }
            return oFieldControls;     
        }
    };

    $.sap.setObject('sap.sf.surj.shell.util.FormGenerationUtil', FormGenerationUtil);
    return FormGenerationUtil;
});