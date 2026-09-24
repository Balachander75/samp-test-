/**
 * Specification Metadata & Display Mappings
 * Auto-generated from testing_excel/Characterstics Description & Sequence.xlsx
 */

export interface ClassMetadataItem {
  techName: string;
  rawDescription: string;
  displayName: string;
  sequence: number;
}

export interface CharacteristicMetadataItem {
  techName: string;
  className: string;
  rawDescription: string;
  displayName: string;
  sequence: number;
  type: string;
  tabNote?: string | null;
}

export const CLASS_METADATA: Record<string, ClassMetadataItem> = {
  "PRODUCT_CLASS": {
    "techName": "PRODUCT_CLASS",
    "rawDescription": "PRODUCT CLASS",
    "displayName": "Product Class",
    "sequence": 1
  },
  "NB_BINDING": {
    "techName": "NB_BINDING",
    "rawDescription": "BINDING SPECIFICATION",
    "displayName": "Binding Specification",
    "sequence": 2
  },
  "NB_COMPONENT_1": {
    "techName": "NB_COMPONENT_1",
    "rawDescription": "COMPONENT 1",
    "displayName": "Component 1",
    "sequence": 3
  },
  "NB_COMPONENT_2": {
    "techName": "NB_COMPONENT_2",
    "rawDescription": "COMPONENT 2",
    "displayName": "Component 2",
    "sequence": 4
  },
  "NB_COMPONENT_3": {
    "techName": "NB_COMPONENT_3",
    "rawDescription": "COMPONENT 3",
    "displayName": "Component 3",
    "sequence": 5
  },
  "NB_COMPONENT_4": {
    "techName": "NB_COMPONENT_4",
    "rawDescription": "COMPONENT 4",
    "displayName": "Component 4",
    "sequence": 6
  },
  "NB_COMPONENT_5": {
    "techName": "NB_COMPONENT_5",
    "rawDescription": "COMPONENT 5",
    "displayName": "Component 5",
    "sequence": 7
  },
  "NB_COMPONENT_6": {
    "techName": "NB_COMPONENT_6",
    "rawDescription": "COMPONENT 6",
    "displayName": "Component 6",
    "sequence": 8
  },
  "NB_COMPONENT_7": {
    "techName": "NB_COMPONENT_7",
    "rawDescription": "COMPONENT 7",
    "displayName": "Component 7",
    "sequence": 9
  },
  "NB_DIVIDER_SPECS": {
    "techName": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER SPECIFICATION",
    "displayName": "Divider Specification",
    "sequence": 10
  },
  "PACKAGING_SPECS_1": {
    "techName": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING SPECIFICATION 1",
    "displayName": "Packaging Specification 1",
    "sequence": 11
  },
  "PACKING_DETAILS": {
    "techName": "PACKING_DETAILS",
    "rawDescription": "PACKING DETAILS",
    "displayName": "Packing Details",
    "sequence": 12
  },
  "RULLING_DETAILS": {
    "techName": "RULLING_DETAILS",
    "rawDescription": "RULING DETAILS",
    "displayName": "Ruling Details",
    "sequence": 13
  }
};

export const CHARACTERISTIC_METADATA: Record<string, CharacteristicMetadataItem> = {
  "PRODUCTCLOSESIZELENGTH": {
    "techName": "PRODUCTCLOSESIZELENGTH",
    "className": "PRODUCT_CLASS",
    "rawDescription": "PRODUCT CLOSE SIZE LENGTH",
    "displayName": "Product Close Size Length",
    "sequence": 1,
    "type": "NUM",
    "tabNote": "Concatenate and display with Seprator as \"x\""
  },
  "PRODUCTCLOSESIZEWIDTH": {
    "techName": "PRODUCTCLOSESIZEWIDTH",
    "className": "PRODUCT_CLASS",
    "rawDescription": "PRODUCT CLOSE SIZE WIDTH",
    "displayName": "Product Close Size Width",
    "sequence": 2,
    "type": "NUM",
    "tabNote": null
  },
  "FSCEUTR_REQUIREMENT": {
    "techName": "FSCEUTR_REQUIREMENT",
    "className": "PRODUCT_CLASS",
    "rawDescription": "FSC / EUTR / EUDR REQUIREMENT",
    "displayName": "FSC / EUTR / EUDR Requirement",
    "sequence": 3,
    "type": "CHAR",
    "tabNote": null
  },
  "CLAIMAPPLICABLETOPRODUCT": {
    "techName": "CLAIMAPPLICABLETOPRODUCT",
    "className": "PRODUCT_CLASS",
    "rawDescription": "CLAIM APPLICABLE TO PRODUCT",
    "displayName": "Claim Applicable to Product",
    "sequence": 4,
    "type": "CHAR",
    "tabNote": null
  },
  "PERCENTAGE_TYPE": {
    "techName": "PERCENTAGE_TYPE",
    "className": "PRODUCT_CLASS",
    "rawDescription": "PERCENTAGE & TYPE",
    "displayName": "Percentage & Type",
    "sequence": 5,
    "type": "CHAR",
    "tabNote": null
  },
  "OVERALLPRODUCTNOTE": {
    "techName": "OVERALLPRODUCTNOTE",
    "className": "PRODUCT_CLASS",
    "rawDescription": "OVER ALL PRODUCT NOTE",
    "displayName": "Over All Product Note",
    "sequence": 6,
    "type": "CHAR",
    "tabNote": null
  },
  "BINDINGTYPE1": {
    "techName": "BINDINGTYPE1",
    "className": "NB_BINDING",
    "rawDescription": "BINDING TYPE  1",
    "displayName": "Binding Type 1",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "BINDINGTYPE2": {
    "techName": "BINDINGTYPE2",
    "className": "NB_BINDING",
    "rawDescription": "BINDING TYPE  2",
    "displayName": "Binding Type 2",
    "sequence": 2,
    "type": "CHAR",
    "tabNote": null
  },
  "OPENINGOFPRODUCT": {
    "techName": "OPENINGOFPRODUCT",
    "className": "NB_BINDING",
    "rawDescription": "OPENING OF PRODUCT",
    "displayName": "Opening of Product",
    "sequence": 3,
    "type": "CHAR",
    "tabNote": null
  },
  "BINDINGSIDE": {
    "techName": "BINDINGSIDE",
    "className": "NB_BINDING",
    "rawDescription": "BINDING SIDE",
    "displayName": "Binding Side",
    "sequence": 4,
    "type": "CHAR",
    "tabNote": null
  },
  "BINDINGMATERIAL": {
    "techName": "BINDINGMATERIAL",
    "className": "NB_BINDING",
    "rawDescription": "BINDING MATERIAL",
    "displayName": "Binding Material",
    "sequence": 5,
    "type": "CHAR",
    "tabNote": null
  },
  "BINDINGCOLOR_STYLE": {
    "techName": "BINDINGCOLOR_STYLE",
    "className": "NB_BINDING",
    "rawDescription": "MATERIAL COLOR & STYLE",
    "displayName": "Material Color & Style",
    "sequence": 6,
    "type": "CHAR",
    "tabNote": null
  },
  "SPECIALBINDING": {
    "techName": "SPECIALBINDING",
    "className": "NB_BINDING",
    "rawDescription": "SPECIAL BINDING",
    "displayName": "Special Binding",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "ADDITIONALPROCESSONBINDING": {
    "techName": "ADDITIONALPROCESSONBINDING",
    "className": "NB_BINDING",
    "rawDescription": "PROCESS ON BINDING MATERIAL",
    "displayName": "Process on Binding Material",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "SPIRAL-WIROBINDINGHOLEPUNCH": {
    "techName": "SPIRAL-WIROBINDINGHOLEPUNCH",
    "className": "NB_BINDING",
    "rawDescription": "SPIRAL/WIRO BINDING HOLE PUNCH",
    "displayName": "SPIRAL/WIRO Binding Hole Punch",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "FILINGHOLEPUNCHDIADISTANCE": {
    "techName": "FILINGHOLEPUNCHDIADISTANCE",
    "className": "NB_BINDING",
    "rawDescription": "FILING HOLE PUNCH DIA DISTANCE",
    "displayName": "Filing Hole Punch DIA Distance",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "NOOFFILINGHOLESREQUIRE": {
    "techName": "NOOFFILINGHOLESREQUIRE",
    "className": "NB_BINDING",
    "rawDescription": "NO OF FILING HOLES REQUIRE",
    "displayName": "No of Filing Holes Require",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "FILLINGHOLESREQUIREDON": {
    "techName": "FILLINGHOLESREQUIREDON",
    "className": "NB_BINDING",
    "rawDescription": "FILLING HOLES REQUIRED ON",
    "displayName": "Filling Holes Required on",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "SPIRAL_WIROLOCK": {
    "techName": "SPIRAL_WIROLOCK",
    "className": "NB_BINDING",
    "rawDescription": "SPIRAL / WIRO LOCK",
    "displayName": "Spiral / Wiro Lock",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "SPIRAL_WIRODIA": {
    "techName": "SPIRAL_WIRODIA",
    "className": "NB_BINDING",
    "rawDescription": "SPIRAL / WIRO DIA",
    "displayName": "Spiral / Wiro DIA",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "CORNERROUNDREQUIREON": {
    "techName": "CORNERROUNDREQUIREON",
    "className": "NB_BINDING",
    "rawDescription": "CORNER ROUND REQUIRE ON",
    "displayName": "Corner Round Require on",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "CORNERROUNDINGRADIUS": {
    "techName": "CORNERROUNDINGRADIUS",
    "className": "NB_BINDING",
    "rawDescription": "CORNER ROUNDING RADIUS",
    "displayName": "Corner Rounding Radius",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "EDGEFINISHIGTYPE": {
    "techName": "EDGEFINISHIGTYPE",
    "className": "NB_BINDING",
    "rawDescription": "EDGE FINISHIG TYPE",
    "displayName": "Edge Finishig Type",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "EDGEFINISHINGSIDES": {
    "techName": "EDGEFINISHINGSIDES",
    "className": "NB_BINDING",
    "rawDescription": "EDGE FINISHING SIDES",
    "displayName": "Edge Finishing Sides",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "EDGEFINISHINGNOOFDESIGNS": {
    "techName": "EDGEFINISHINGNOOFDESIGNS",
    "className": "NB_BINDING",
    "rawDescription": "EDGE FINISHING NO OF DESIGNS",
    "displayName": "Edge Finishing No of Designs",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "EDGEFINISHINGDESIGNNOTES": {
    "techName": "EDGEFINISHINGDESIGNNOTES",
    "className": "NB_BINDING",
    "rawDescription": "EDGE FINISHING DESIGN NOTES",
    "displayName": "Edge Finishing Design Notes",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "SHEETGATHERINGSTYLE": {
    "techName": "SHEETGATHERINGSTYLE",
    "className": "NB_BINDING",
    "rawDescription": "SHEET GATHERING STYLE",
    "displayName": "Sheet Gathering Style",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "ACCESSORIES": {
    "techName": "ACCESSORIES",
    "className": "NB_BINDING",
    "rawDescription": "ACCESSORIES",
    "displayName": "Accessories",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "ACCESSORIESDETAILS": {
    "techName": "ACCESSORIESDETAILS",
    "className": "NB_BINDING",
    "rawDescription": "ACCESSORIES DETAILS",
    "displayName": "Accessories Details",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "CARENOTEFORBINDING": {
    "techName": "CARENOTEFORBINDING",
    "className": "NB_BINDING",
    "rawDescription": "CARE NOTE FOR BINDING",
    "displayName": "Care Note for Binding",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "COMPONENT1NAME": {
    "techName": "COMPONENT1NAME",
    "className": "NB_COMPONENT_1",
    "rawDescription": "COMPONENT 1 NAME",
    "displayName": "Component 1 Name",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "C1SIZELENGTH": {
    "techName": "C1SIZELENGTH",
    "className": "NB_COMPONENT_1",
    "rawDescription": "LENGTH SIZE (CM)",
    "displayName": "Length Size (CM)",
    "sequence": 2,
    "type": "NUM",
    "tabNote": null
  },
  "C1SIZEWIDTH": {
    "techName": "C1SIZEWIDTH",
    "className": "NB_COMPONENT_1",
    "rawDescription": "WIDTH SIZE (CM)",
    "displayName": "Width Size (CM)",
    "sequence": 3,
    "type": "NUM",
    "tabNote": null
  },
  "LENGTHAFTERPERFORATION": {
    "techName": "LENGTHAFTERPERFORATION",
    "className": "NB_COMPONENT_1",
    "rawDescription": "LENGTH AFTER PERFORATION",
    "displayName": "Length After Perforation",
    "sequence": 4,
    "type": "NUM",
    "tabNote": null
  },
  "WIDTHAFTERPERFORATION": {
    "techName": "WIDTHAFTERPERFORATION",
    "className": "NB_COMPONENT_1",
    "rawDescription": "WIDTH AFTER PERFORATION",
    "displayName": "Width After Perforation",
    "sequence": 5,
    "type": "NUM",
    "tabNote": null
  },
  "C1NOOFSHEETS": {
    "techName": "C1NOOFSHEETS",
    "className": "NB_COMPONENT_1",
    "rawDescription": "NO OF SHEETS",
    "displayName": "No of Sheets",
    "sequence": 6,
    "type": "NUM",
    "tabNote": null
  },
  "C1MATERIALTYPE": {
    "techName": "C1MATERIALTYPE",
    "className": "NB_COMPONENT_1",
    "rawDescription": "MATERIAL TYPE",
    "displayName": "Material Type",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "C1MILL_SUPPLIERNAME": {
    "techName": "C1MILL_SUPPLIERNAME",
    "className": "NB_COMPONENT_1",
    "rawDescription": "MILL / SUPPLIER NAME",
    "displayName": "Mill / Supplier Name",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "C1MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "C1MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_COMPONENT_1",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "C1MATERIALCOLOR_VARIANCE": {
    "techName": "C1MATERIALCOLOR_VARIANCE",
    "className": "NB_COMPONENT_1",
    "rawDescription": "MATERIAL COLOR / VARIANCE",
    "displayName": "Material Color / Variance",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "C1CALIPER_WEIGHT": {
    "techName": "C1CALIPER_WEIGHT",
    "className": "NB_COMPONENT_1",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "C1MATERIALUNIT": {
    "techName": "C1MATERIALUNIT",
    "className": "NB_COMPONENT_1",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "C1PURCHASECERTIFICATION": {
    "techName": "C1PURCHASECERTIFICATION",
    "className": "NB_COMPONENT_1",
    "rawDescription": "PURCHASE CERTIFICATION",
    "displayName": "Purchase Certification",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "C1CERTIFICATIONADDNLNOTE": {
    "techName": "C1CERTIFICATIONADDNLNOTE",
    "className": "NB_COMPONENT_1",
    "rawDescription": "CERTIFICATION ADDNL NOTE",
    "displayName": "Certification Addnl Note",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "C1TECHNICALRAWMATERIALSPEC": {
    "techName": "C1TECHNICALRAWMATERIALSPEC",
    "className": "NB_COMPONENT_1",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "C1PRINTINGTYPE1": {
    "techName": "C1PRINTINGTYPE1",
    "className": "NB_COMPONENT_1",
    "rawDescription": "PRINTING TYPE",
    "displayName": "Printing Type",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "C1NOOFDESIGNS_PRINT_1": {
    "techName": "C1NOOFDESIGNS_PRINT_1",
    "className": "NB_COMPONENT_1",
    "rawDescription": "NO OF DESIGNS / PRINT",
    "displayName": "No of Designs / Print",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "C1NOOFCOLOURSF_B_1": {
    "techName": "C1NOOFCOLOURSF_B_1",
    "className": "NB_COMPONENT_1",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "C1NAMEOFCOLORSF_B_1": {
    "techName": "C1NAMEOFCOLORSF_B_1",
    "className": "NB_COMPONENT_1",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "C1RULING_PRINTDESIGNNAME1": {
    "techName": "C1RULING_PRINTDESIGNNAME1",
    "className": "NB_COMPONENT_1",
    "rawDescription": "RULING / PRINT DESIGN  NAME",
    "displayName": "Ruling / Print Design Name",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "C1RULE_PRINTCODE1": {
    "techName": "C1RULE_PRINTCODE1",
    "className": "NB_COMPONENT_1",
    "rawDescription": "RULE / PRINT CODE",
    "displayName": "Rule / Print Code",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "C1PRINTINGTYPE2": {
    "techName": "C1PRINTINGTYPE2",
    "className": "NB_COMPONENT_1",
    "rawDescription": "PRINTING TYPE 2",
    "displayName": "Printing Type 2",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "C1NOOFDESIGNS_PRINT": {
    "techName": "C1NOOFDESIGNS_PRINT",
    "className": "NB_COMPONENT_1",
    "rawDescription": "NO OF DESIGNS / PRINT 2",
    "displayName": "No of Designs / Print 2",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "C1NOOFCOLOURSF_B": {
    "techName": "C1NOOFCOLOURSF_B",
    "className": "NB_COMPONENT_1",
    "rawDescription": "NO OF COLOURS F/B 2",
    "displayName": "No of Colours F/B 2",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "C1NAMEOFCOLORSF_B": {
    "techName": "C1NAMEOFCOLORSF_B",
    "className": "NB_COMPONENT_1",
    "rawDescription": "NAME OF COLORS F/B 2",
    "displayName": "Name of Colors F/B 2",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "C1RULING_PRINTDESIGNNAME2": {
    "techName": "C1RULING_PRINTDESIGNNAME2",
    "className": "NB_COMPONENT_1",
    "rawDescription": "RULING / PRINT DESIGN  NAME 2",
    "displayName": "Ruling / Print Design Name 2",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "C1RULE_PRINTCODE2": {
    "techName": "C1RULE_PRINTCODE2",
    "className": "NB_COMPONENT_1",
    "rawDescription": "RULE / PRINT CODE 2",
    "displayName": "Rule / Print Code 2",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "C1PRINTNOTE": {
    "techName": "C1PRINTNOTE",
    "className": "NB_COMPONENT_1",
    "rawDescription": "PRINT NOTE",
    "displayName": "Print Note",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "C1FINISHING": {
    "techName": "C1FINISHING",
    "className": "NB_COMPONENT_1",
    "rawDescription": "FINISHING",
    "displayName": "Finishing",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "C1FINISHINGNOTE": {
    "techName": "C1FINISHINGNOTE",
    "className": "NB_COMPONENT_1",
    "rawDescription": "FINISHING NOTE",
    "displayName": "Finishing Note",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "C1SPECIALNOTE": {
    "techName": "C1SPECIALNOTE",
    "className": "NB_COMPONENT_1",
    "rawDescription": "SPECIAL NOTE",
    "displayName": "Special Note",
    "sequence": 31,
    "type": "CHAR",
    "tabNote": null
  },
  "C1ADDITIONALPROCESS": {
    "techName": "C1ADDITIONALPROCESS",
    "className": "NB_COMPONENT_1",
    "rawDescription": "ADDITIONAL PROCESS",
    "displayName": "Additional Process",
    "sequence": 32,
    "type": "CHAR",
    "tabNote": null
  },
  "C1ADDITIONALINFO1": {
    "techName": "C1ADDITIONALINFO1",
    "className": "NB_COMPONENT_1",
    "rawDescription": "ADDITIONAL INFORMATION 1",
    "displayName": "Additional Information 1",
    "sequence": 33,
    "type": "CHAR",
    "tabNote": null
  },
  "C1ADDITIONALINFO2": {
    "techName": "C1ADDITIONALINFO2",
    "className": "NB_COMPONENT_1",
    "rawDescription": "ADDITIONAL INFORMATION 2",
    "displayName": "Additional Information 2",
    "sequence": 34,
    "type": "CHAR",
    "tabNote": null
  },
  "C1ADDITIONALINFO3": {
    "techName": "C1ADDITIONALINFO3",
    "className": "NB_COMPONENT_1",
    "rawDescription": "ADDITIONAL INFORMATION 3",
    "displayName": "Additional Information 3",
    "sequence": 35,
    "type": "CHAR",
    "tabNote": null
  },
  "COMPONENT2NAME": {
    "techName": "COMPONENT2NAME",
    "className": "NB_COMPONENT_2",
    "rawDescription": "COMPONENT 2 NAME",
    "displayName": "Component 2 Name",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "C2SIZELENGTH": {
    "techName": "C2SIZELENGTH",
    "className": "NB_COMPONENT_2",
    "rawDescription": "LENGTH SIZE (CM)",
    "displayName": "Length Size (CM)",
    "sequence": 2,
    "type": "NUM",
    "tabNote": null
  },
  "C2SIZEWIDTH": {
    "techName": "C2SIZEWIDTH",
    "className": "NB_COMPONENT_2",
    "rawDescription": "WIDTH SIZE (CM)",
    "displayName": "Width Size (CM)",
    "sequence": 3,
    "type": "NUM",
    "tabNote": null
  },
  "C2LENGHTAFTERPERFORATION": {
    "techName": "C2LENGHTAFTERPERFORATION",
    "className": "NB_COMPONENT_2",
    "rawDescription": "LENGTH AFTER PERFORATION",
    "displayName": "Length After Perforation",
    "sequence": 4,
    "type": "NUM",
    "tabNote": null
  },
  "C2WIDTHAFTERPERFORATION": {
    "techName": "C2WIDTHAFTERPERFORATION",
    "className": "NB_COMPONENT_2",
    "rawDescription": "WIDTH AFTER PERFORATION",
    "displayName": "Width After Perforation",
    "sequence": 5,
    "type": "NUM",
    "tabNote": null
  },
  "C2NOOFSHEETS": {
    "techName": "C2NOOFSHEETS",
    "className": "NB_COMPONENT_2",
    "rawDescription": "NO OF SHEETS",
    "displayName": "No of Sheets",
    "sequence": 6,
    "type": "NUM",
    "tabNote": null
  },
  "C2MATERIALTYPE": {
    "techName": "C2MATERIALTYPE",
    "className": "NB_COMPONENT_2",
    "rawDescription": "MATERIAL TYPE",
    "displayName": "Material Type",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "C2MILL_SUPPLIERNAME": {
    "techName": "C2MILL_SUPPLIERNAME",
    "className": "NB_COMPONENT_2",
    "rawDescription": "MILL / SUPPLIER NAME",
    "displayName": "Mill / Supplier Name",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "C2MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "C2MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_COMPONENT_2",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "C2MATERIALCOLOR_VARIANCE": {
    "techName": "C2MATERIALCOLOR_VARIANCE",
    "className": "NB_COMPONENT_2",
    "rawDescription": "MATERIAL COLOR / VARIANCE",
    "displayName": "Material Color / Variance",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "C2CALIPER_WEIGHT": {
    "techName": "C2CALIPER_WEIGHT",
    "className": "NB_COMPONENT_2",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 11,
    "type": "NUM",
    "tabNote": null
  },
  "C2MATERIALUNIT": {
    "techName": "C2MATERIALUNIT",
    "className": "NB_COMPONENT_2",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "C2PURCHASECERTIFICATION": {
    "techName": "C2PURCHASECERTIFICATION",
    "className": "NB_COMPONENT_2",
    "rawDescription": "PURCHASE CERTIFICATION",
    "displayName": "Purchase Certification",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "C2CERTIFICATIONADDNLNOTE": {
    "techName": "C2CERTIFICATIONADDNLNOTE",
    "className": "NB_COMPONENT_2",
    "rawDescription": "CERTIFICATION ADDNL NOTE",
    "displayName": "Certification Addnl Note",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "C2TECHNICALRAWMATERIALSPEC": {
    "techName": "C2TECHNICALRAWMATERIALSPEC",
    "className": "NB_COMPONENT_2",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "C2PRINTINGTYPE1": {
    "techName": "C2PRINTINGTYPE1",
    "className": "NB_COMPONENT_2",
    "rawDescription": "PRINTING TYPE",
    "displayName": "Printing Type",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "C2NOOFDESIGNS_PRINT_1": {
    "techName": "C2NOOFDESIGNS_PRINT_1",
    "className": "NB_COMPONENT_2",
    "rawDescription": "NO OF DESIGNS / PRINT",
    "displayName": "No of Designs / Print",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "C2NOOFCOLOURSF_B_1": {
    "techName": "C2NOOFCOLOURSF_B_1",
    "className": "NB_COMPONENT_2",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "C2NAMEOFCOLORSF_B_1": {
    "techName": "C2NAMEOFCOLORSF_B_1",
    "className": "NB_COMPONENT_2",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "C2RULING_PRINTDESIGNNAME1": {
    "techName": "C2RULING_PRINTDESIGNNAME1",
    "className": "NB_COMPONENT_2",
    "rawDescription": "RULING / PRINT DESIGN  NAME",
    "displayName": "Ruling / Print Design Name",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "C2RULE_PRINTCODE1": {
    "techName": "C2RULE_PRINTCODE1",
    "className": "NB_COMPONENT_2",
    "rawDescription": "RULE / PRINT CODE",
    "displayName": "Rule / Print Code",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "C2PRINTINGTYPE2": {
    "techName": "C2PRINTINGTYPE2",
    "className": "NB_COMPONENT_2",
    "rawDescription": "PRINTING TYPE 2",
    "displayName": "Printing Type 2",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "C2NOOFDESIGNS_PRINT": {
    "techName": "C2NOOFDESIGNS_PRINT",
    "className": "NB_COMPONENT_2",
    "rawDescription": "NO OF DESIGNS / PRINT 2",
    "displayName": "No of Designs / Print 2",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "C2NOOFCOLOURSF_B": {
    "techName": "C2NOOFCOLOURSF_B",
    "className": "NB_COMPONENT_2",
    "rawDescription": "NO OF COLOURS F/B 2",
    "displayName": "No of Colours F/B 2",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "C2NAMEOFCOLORSF_B": {
    "techName": "C2NAMEOFCOLORSF_B",
    "className": "NB_COMPONENT_2",
    "rawDescription": "NAME OF COLORS F/B 2",
    "displayName": "Name of Colors F/B 2",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "C2RULING_PRINTDESIGNNAME2": {
    "techName": "C2RULING_PRINTDESIGNNAME2",
    "className": "NB_COMPONENT_2",
    "rawDescription": "RULING / PRINT DESIGN  NAME 2",
    "displayName": "Ruling / Print Design Name 2",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "C2RULE_PRINTCODE2": {
    "techName": "C2RULE_PRINTCODE2",
    "className": "NB_COMPONENT_2",
    "rawDescription": "RULE / PRINT CODE 2",
    "displayName": "Rule / Print Code 2",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "C2PRINTNOTE": {
    "techName": "C2PRINTNOTE",
    "className": "NB_COMPONENT_2",
    "rawDescription": "PRINT NOTE",
    "displayName": "Print Note",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "C2FINISHING": {
    "techName": "C2FINISHING",
    "className": "NB_COMPONENT_2",
    "rawDescription": "FINISHING",
    "displayName": "Finishing",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "C2COVERENHANCEMENT": {
    "techName": "C2COVERENHANCEMENT",
    "className": "NB_COMPONENT_2",
    "rawDescription": "COVER ENHANCEMENT",
    "displayName": "Cover Enhancement",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "C2FINISHINGNOTE": {
    "techName": "C2FINISHINGNOTE",
    "className": "NB_COMPONENT_2",
    "rawDescription": "FINISHING NOTE",
    "displayName": "Finishing Note",
    "sequence": 31,
    "type": "CHAR",
    "tabNote": null
  },
  "C2SPECIALNOTE": {
    "techName": "C2SPECIALNOTE",
    "className": "NB_COMPONENT_2",
    "rawDescription": "SPECIAL NOTE",
    "displayName": "Special Note",
    "sequence": 32,
    "type": "CHAR",
    "tabNote": null
  },
  "C2ADDITIONALPROCESS": {
    "techName": "C2ADDITIONALPROCESS",
    "className": "NB_COMPONENT_2",
    "rawDescription": "ADDITIONAL PROCESS",
    "displayName": "Additional Process",
    "sequence": 33,
    "type": "CHAR",
    "tabNote": null
  },
  "C2ADDITIONALINFO1": {
    "techName": "C2ADDITIONALINFO1",
    "className": "NB_COMPONENT_2",
    "rawDescription": "ADDITIONAL INFORMATION 1",
    "displayName": "Additional Information 1",
    "sequence": 34,
    "type": "CHAR",
    "tabNote": null
  },
  "C2ADDITIONALINFO2": {
    "techName": "C2ADDITIONALINFO2",
    "className": "NB_COMPONENT_2",
    "rawDescription": "ADDITIONAL INFORMATION 2",
    "displayName": "Additional Information 2",
    "sequence": 35,
    "type": "CHAR",
    "tabNote": null
  },
  "C2ADDITIONALINFO3": {
    "techName": "C2ADDITIONALINFO3",
    "className": "NB_COMPONENT_2",
    "rawDescription": "ADDITIONAL INFORMATION 3",
    "displayName": "Additional Information 3",
    "sequence": 36,
    "type": "CHAR",
    "tabNote": null
  },
  "COMPONENT3NAME": {
    "techName": "COMPONENT3NAME",
    "className": "NB_COMPONENT_3",
    "rawDescription": "COMPONENT 3 NAME",
    "displayName": "Component 3 Name",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "C3SIZELENGTH": {
    "techName": "C3SIZELENGTH",
    "className": "NB_COMPONENT_3",
    "rawDescription": "LENGTH SIZE (CM)",
    "displayName": "Length Size (CM)",
    "sequence": 2,
    "type": "NUM",
    "tabNote": null
  },
  "C3SIZEWIDTH": {
    "techName": "C3SIZEWIDTH",
    "className": "NB_COMPONENT_3",
    "rawDescription": "WIDTH SIZE (CM)",
    "displayName": "Width Size (CM)",
    "sequence": 3,
    "type": "NUM",
    "tabNote": null
  },
  "C3LENGHTAFTERPERFORATION": {
    "techName": "C3LENGHTAFTERPERFORATION",
    "className": "NB_COMPONENT_3",
    "rawDescription": "LENGHT_AFTER_PERFORATION",
    "displayName": "Lenght_after_perforation",
    "sequence": 4,
    "type": "NUM",
    "tabNote": null
  },
  "C3WIDTHAFTERPERFORATION": {
    "techName": "C3WIDTHAFTERPERFORATION",
    "className": "NB_COMPONENT_3",
    "rawDescription": "WIDTH_AFTER_PERFORATION",
    "displayName": "Width_after_perforation",
    "sequence": 5,
    "type": "NUM",
    "tabNote": null
  },
  "C3NOOFSHEETS": {
    "techName": "C3NOOFSHEETS",
    "className": "NB_COMPONENT_3",
    "rawDescription": "NO OF SHEETS",
    "displayName": "No of Sheets",
    "sequence": 6,
    "type": "NUM",
    "tabNote": null
  },
  "C3MATERIALTYPE": {
    "techName": "C3MATERIALTYPE",
    "className": "NB_COMPONENT_3",
    "rawDescription": "MATERIAL TYPE",
    "displayName": "Material Type",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "C3MILL_SUPPLIERNAME": {
    "techName": "C3MILL_SUPPLIERNAME",
    "className": "NB_COMPONENT_3",
    "rawDescription": "MILL / SUPPLIER NAME",
    "displayName": "Mill / Supplier Name",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "C3MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "C3MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_COMPONENT_3",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "C3MATERIALCOLOR_VARIANCE": {
    "techName": "C3MATERIALCOLOR_VARIANCE",
    "className": "NB_COMPONENT_3",
    "rawDescription": "MATERIAL COLOR / VARIANCE",
    "displayName": "Material Color / Variance",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "C3CALIPER_WEIGHT": {
    "techName": "C3CALIPER_WEIGHT",
    "className": "NB_COMPONENT_3",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 11,
    "type": "NUM",
    "tabNote": null
  },
  "C3MATERIALUNIT": {
    "techName": "C3MATERIALUNIT",
    "className": "NB_COMPONENT_3",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "C3PURCHASECERTIFICATION": {
    "techName": "C3PURCHASECERTIFICATION",
    "className": "NB_COMPONENT_3",
    "rawDescription": "PURCHASE CERTIFICATION",
    "displayName": "Purchase Certification",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "C3CERTIFICATIONADDNLNOTE": {
    "techName": "C3CERTIFICATIONADDNLNOTE",
    "className": "NB_COMPONENT_3",
    "rawDescription": "CERTIFICATION ADDNL NOTE",
    "displayName": "Certification Addnl Note",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "C3TECHNICALRAWMATERIALSPEC": {
    "techName": "C3TECHNICALRAWMATERIALSPEC",
    "className": "NB_COMPONENT_3",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "C3PRINTINGTYPE1": {
    "techName": "C3PRINTINGTYPE1",
    "className": "NB_COMPONENT_3",
    "rawDescription": "PRINTING TYPE",
    "displayName": "Printing Type",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "C3NOOFDESIGNS_PRINT_1": {
    "techName": "C3NOOFDESIGNS_PRINT_1",
    "className": "NB_COMPONENT_3",
    "rawDescription": "NO OF DESIGNS / PRINT",
    "displayName": "No of Designs / Print",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "C3NOOFCOLOURSF_B_1": {
    "techName": "C3NOOFCOLOURSF_B_1",
    "className": "NB_COMPONENT_3",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "C3NAMEOFCOLORSF_B_1": {
    "techName": "C3NAMEOFCOLORSF_B_1",
    "className": "NB_COMPONENT_3",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "C3RULING_PRINTDESIGNNAME1": {
    "techName": "C3RULING_PRINTDESIGNNAME1",
    "className": "NB_COMPONENT_3",
    "rawDescription": "RULING / PRINT DESIGN  NAME",
    "displayName": "Ruling / Print Design Name",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "C3RULE_PRINTCODE1": {
    "techName": "C3RULE_PRINTCODE1",
    "className": "NB_COMPONENT_3",
    "rawDescription": "RULE / PRINT CODE",
    "displayName": "Rule / Print Code",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "C3PRINTINGTYPE2": {
    "techName": "C3PRINTINGTYPE2",
    "className": "NB_COMPONENT_3",
    "rawDescription": "PRINTING TYPE 2",
    "displayName": "Printing Type 2",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "C3NOOFDESIGNS_PRINT": {
    "techName": "C3NOOFDESIGNS_PRINT",
    "className": "NB_COMPONENT_3",
    "rawDescription": "NO OF DESIGNS / PRINT 2",
    "displayName": "No of Designs / Print 2",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "C3NOOFCOLOURSF_B": {
    "techName": "C3NOOFCOLOURSF_B",
    "className": "NB_COMPONENT_3",
    "rawDescription": "NO OF COLOURS F/B 2",
    "displayName": "No of Colours F/B 2",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "C3NAMEOFCOLORSF_B": {
    "techName": "C3NAMEOFCOLORSF_B",
    "className": "NB_COMPONENT_3",
    "rawDescription": "NAME OF COLORS F/B 2",
    "displayName": "Name of Colors F/B 2",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "C3RULING_PRINTDESIGNNAME2": {
    "techName": "C3RULING_PRINTDESIGNNAME2",
    "className": "NB_COMPONENT_3",
    "rawDescription": "RULING / PRINT DESIGN  NAME 2",
    "displayName": "Ruling / Print Design Name 2",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "C3RULE_PRINTCODE2": {
    "techName": "C3RULE_PRINTCODE2",
    "className": "NB_COMPONENT_3",
    "rawDescription": "RULE / PRINT CODE 2",
    "displayName": "Rule / Print Code 2",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "C3PRINTNOTE": {
    "techName": "C3PRINTNOTE",
    "className": "NB_COMPONENT_3",
    "rawDescription": "PRINT NOTE",
    "displayName": "Print Note",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "C3FINISHING": {
    "techName": "C3FINISHING",
    "className": "NB_COMPONENT_3",
    "rawDescription": "FINISHING",
    "displayName": "Finishing",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "C3FINISHINGNOTE": {
    "techName": "C3FINISHINGNOTE",
    "className": "NB_COMPONENT_3",
    "rawDescription": "FINISHING NOTE",
    "displayName": "Finishing Note",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "C3SPECIALNOTE": {
    "techName": "C3SPECIALNOTE",
    "className": "NB_COMPONENT_3",
    "rawDescription": "SPECIAL NOTE",
    "displayName": "Special Note",
    "sequence": 31,
    "type": "CHAR",
    "tabNote": null
  },
  "C3ADDITIONALPROCESS": {
    "techName": "C3ADDITIONALPROCESS",
    "className": "NB_COMPONENT_3",
    "rawDescription": "ADDITIONAL PROCESS",
    "displayName": "Additional Process",
    "sequence": 32,
    "type": "CHAR",
    "tabNote": null
  },
  "C3ADDITIONALINFO1": {
    "techName": "C3ADDITIONALINFO1",
    "className": "NB_COMPONENT_3",
    "rawDescription": "ADDITIONAL INFORMATION 1",
    "displayName": "Additional Information 1",
    "sequence": 33,
    "type": "CHAR",
    "tabNote": null
  },
  "C3ADDITIONALINFO2": {
    "techName": "C3ADDITIONALINFO2",
    "className": "NB_COMPONENT_3",
    "rawDescription": "ADDITIONAL INFORMATION 2",
    "displayName": "Additional Information 2",
    "sequence": 34,
    "type": "CHAR",
    "tabNote": null
  },
  "C3ADDITIONALINFO3": {
    "techName": "C3ADDITIONALINFO3",
    "className": "NB_COMPONENT_3",
    "rawDescription": "ADDITIONAL INFORMATION 3",
    "displayName": "Additional Information 3",
    "sequence": 35,
    "type": "CHAR",
    "tabNote": null
  },
  "COMPONENT4NAME": {
    "techName": "COMPONENT4NAME",
    "className": "NB_COMPONENT_4",
    "rawDescription": "COMPONENT 4 NAME",
    "displayName": "Component 4 Name",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "C4SIZELENGTH": {
    "techName": "C4SIZELENGTH",
    "className": "NB_COMPONENT_4",
    "rawDescription": "LENGTH SIZE (CM)",
    "displayName": "Length Size (CM)",
    "sequence": 2,
    "type": "NUM",
    "tabNote": null
  },
  "C4SIZEWIDTH": {
    "techName": "C4SIZEWIDTH",
    "className": "NB_COMPONENT_4",
    "rawDescription": "WIDTH SIZE (CM)",
    "displayName": "Width Size (CM)",
    "sequence": 3,
    "type": "NUM",
    "tabNote": null
  },
  "C4LENGHTAFTERPERFORATION": {
    "techName": "C4LENGHTAFTERPERFORATION",
    "className": "NB_COMPONENT_4",
    "rawDescription": "LENGHT AFTER PERFORATION",
    "displayName": "Lenght After Perforation",
    "sequence": 4,
    "type": "NUM",
    "tabNote": null
  },
  "C4WIDTHAFTERPERFORATION": {
    "techName": "C4WIDTHAFTERPERFORATION",
    "className": "NB_COMPONENT_4",
    "rawDescription": "WIDTH_AFTER_PERFORATION",
    "displayName": "Width_after_perforation",
    "sequence": 5,
    "type": "NUM",
    "tabNote": null
  },
  "C4NOOFSHEETS": {
    "techName": "C4NOOFSHEETS",
    "className": "NB_COMPONENT_4",
    "rawDescription": "NO OF SHEETS",
    "displayName": "No of Sheets",
    "sequence": 6,
    "type": "NUM",
    "tabNote": null
  },
  "C4MATERIALTYPE": {
    "techName": "C4MATERIALTYPE",
    "className": "NB_COMPONENT_4",
    "rawDescription": "MATERIAL TYPE",
    "displayName": "Material Type",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "C4MILL_SUPPLIERNAME": {
    "techName": "C4MILL_SUPPLIERNAME",
    "className": "NB_COMPONENT_4",
    "rawDescription": "MILL / SUPPLIER NAME",
    "displayName": "Mill / Supplier Name",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "C4MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "C4MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_COMPONENT_4",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "C4MATERIALCOLOR_VARIANCE": {
    "techName": "C4MATERIALCOLOR_VARIANCE",
    "className": "NB_COMPONENT_4",
    "rawDescription": "MATERIAL COLOR / VARIANCE",
    "displayName": "Material Color / Variance",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "C4CALIPER_WEIGHT": {
    "techName": "C4CALIPER_WEIGHT",
    "className": "NB_COMPONENT_4",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 11,
    "type": "NUM",
    "tabNote": null
  },
  "C4MATERIALUNIT": {
    "techName": "C4MATERIALUNIT",
    "className": "NB_COMPONENT_4",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "C4PURCHASECERTIFICATION": {
    "techName": "C4PURCHASECERTIFICATION",
    "className": "NB_COMPONENT_4",
    "rawDescription": "PURCHASE CERTIFICATION",
    "displayName": "Purchase Certification",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "C4CERTIFICATIONADDNLNOTE": {
    "techName": "C4CERTIFICATIONADDNLNOTE",
    "className": "NB_COMPONENT_4",
    "rawDescription": "CERTIFICATION ADDNL NOTE",
    "displayName": "Certification Addnl Note",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "C4TECHNICALRAWMATERIALSPEC": {
    "techName": "C4TECHNICALRAWMATERIALSPEC",
    "className": "NB_COMPONENT_4",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "C4PRINTINGTYPE1": {
    "techName": "C4PRINTINGTYPE1",
    "className": "NB_COMPONENT_4",
    "rawDescription": "PRINTING TYPE",
    "displayName": "Printing Type",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "C4NOOFDESIGNS_PRINT_1": {
    "techName": "C4NOOFDESIGNS_PRINT_1",
    "className": "NB_COMPONENT_4",
    "rawDescription": "NO OF DESIGNS / PRINT",
    "displayName": "No of Designs / Print",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "C4NOOFCOLOURSF_B_1": {
    "techName": "C4NOOFCOLOURSF_B_1",
    "className": "NB_COMPONENT_4",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "C4NAMEOFCOLORSF_B_1": {
    "techName": "C4NAMEOFCOLORSF_B_1",
    "className": "NB_COMPONENT_4",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "C4RULING_PRINTDESIGNNAME1": {
    "techName": "C4RULING_PRINTDESIGNNAME1",
    "className": "NB_COMPONENT_4",
    "rawDescription": "RULING / PRINT DESIGN  NAME",
    "displayName": "Ruling / Print Design Name",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "C4RULE_PRINTCODE1": {
    "techName": "C4RULE_PRINTCODE1",
    "className": "NB_COMPONENT_4",
    "rawDescription": "RULE / PRINT CODE",
    "displayName": "Rule / Print Code",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "C4PRINTINGTYPE2": {
    "techName": "C4PRINTINGTYPE2",
    "className": "NB_COMPONENT_4",
    "rawDescription": "PRINTING TYPE 2",
    "displayName": "Printing Type 2",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "C4NOOFDESIGNS_PRINT": {
    "techName": "C4NOOFDESIGNS_PRINT",
    "className": "NB_COMPONENT_4",
    "rawDescription": "NO OF DESIGNS / PRINT 2",
    "displayName": "No of Designs / Print 2",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "C4NOOFCOLOURSF_B": {
    "techName": "C4NOOFCOLOURSF_B",
    "className": "NB_COMPONENT_4",
    "rawDescription": "NO OF COLOURS F/B 2",
    "displayName": "No of Colours F/B 2",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "C4NAMEOFCOLORSF_B": {
    "techName": "C4NAMEOFCOLORSF_B",
    "className": "NB_COMPONENT_4",
    "rawDescription": "NAME OF COLORS F/B 2",
    "displayName": "Name of Colors F/B 2",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "C4RULING_PRINTDESIGNNAME2": {
    "techName": "C4RULING_PRINTDESIGNNAME2",
    "className": "NB_COMPONENT_4",
    "rawDescription": "RULING / PRINT DESIGN  NAME 2",
    "displayName": "Ruling / Print Design Name 2",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "C4RULE_PRINTCODE2": {
    "techName": "C4RULE_PRINTCODE2",
    "className": "NB_COMPONENT_4",
    "rawDescription": "RULE / PRINT CODE 2",
    "displayName": "Rule / Print Code 2",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "C4PRINTNOTE": {
    "techName": "C4PRINTNOTE",
    "className": "NB_COMPONENT_4",
    "rawDescription": "PRINT NOTE",
    "displayName": "Print Note",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "C4FINISHING": {
    "techName": "C4FINISHING",
    "className": "NB_COMPONENT_4",
    "rawDescription": "FINISHING",
    "displayName": "Finishing",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "C4FINISHINGNOTE": {
    "techName": "C4FINISHINGNOTE",
    "className": "NB_COMPONENT_4",
    "rawDescription": "FINISHING NOTE",
    "displayName": "Finishing Note",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "C4SPECIALNOTE": {
    "techName": "C4SPECIALNOTE",
    "className": "NB_COMPONENT_4",
    "rawDescription": "SPECIAL NOTE",
    "displayName": "Special Note",
    "sequence": 31,
    "type": "CHAR",
    "tabNote": null
  },
  "C4ADDITIONALPROCESS": {
    "techName": "C4ADDITIONALPROCESS",
    "className": "NB_COMPONENT_4",
    "rawDescription": "ADDITIONAL PROCESS",
    "displayName": "Additional Process",
    "sequence": 32,
    "type": "CHAR",
    "tabNote": null
  },
  "C4ADDITIONALINFO1": {
    "techName": "C4ADDITIONALINFO1",
    "className": "NB_COMPONENT_4",
    "rawDescription": "ADDITIONAL INFORMATION 1",
    "displayName": "Additional Information 1",
    "sequence": 33,
    "type": "CHAR",
    "tabNote": null
  },
  "C4ADDITIONALINFO2": {
    "techName": "C4ADDITIONALINFO2",
    "className": "NB_COMPONENT_4",
    "rawDescription": "ADDITIONAL INFORMATION 2",
    "displayName": "Additional Information 2",
    "sequence": 34,
    "type": "CHAR",
    "tabNote": null
  },
  "C4ADDITIONALINFO3": {
    "techName": "C4ADDITIONALINFO3",
    "className": "NB_COMPONENT_4",
    "rawDescription": "ADDITIONAL INFORMATION 3",
    "displayName": "Additional Information 3",
    "sequence": 35,
    "type": "CHAR",
    "tabNote": null
  },
  "COMPONENT5NAME": {
    "techName": "COMPONENT5NAME",
    "className": "NB_COMPONENT_5",
    "rawDescription": "COMPONENT 5 NAME",
    "displayName": "Component 5 Name",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "C5SIZELENGTH": {
    "techName": "C5SIZELENGTH",
    "className": "NB_COMPONENT_5",
    "rawDescription": "LENGTH SIZE (CM)",
    "displayName": "Length Size (CM)",
    "sequence": 2,
    "type": "NUM",
    "tabNote": null
  },
  "C5SIZEWIDTH": {
    "techName": "C5SIZEWIDTH",
    "className": "NB_COMPONENT_5",
    "rawDescription": "WIDTH SIZE (CM)",
    "displayName": "Width Size (CM)",
    "sequence": 3,
    "type": "NUM",
    "tabNote": null
  },
  "C5NOOFSHEETS": {
    "techName": "C5NOOFSHEETS",
    "className": "NB_COMPONENT_5",
    "rawDescription": "NO OF SHEETS",
    "displayName": "No of Sheets",
    "sequence": 4,
    "type": "NUM",
    "tabNote": null
  },
  "C5MATERIALTYPE": {
    "techName": "C5MATERIALTYPE",
    "className": "NB_COMPONENT_5",
    "rawDescription": "MATERIAL TYPE",
    "displayName": "Material Type",
    "sequence": 5,
    "type": "CHAR",
    "tabNote": null
  },
  "C5MILL_SUPPLIERNAME": {
    "techName": "C5MILL_SUPPLIERNAME",
    "className": "NB_COMPONENT_5",
    "rawDescription": "MILL / SUPPLIER NAME",
    "displayName": "Mill / Supplier Name",
    "sequence": 6,
    "type": "CHAR",
    "tabNote": null
  },
  "C5MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "C5MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_COMPONENT_5",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "C5MATERIALCOLOR_VARIANCE": {
    "techName": "C5MATERIALCOLOR_VARIANCE",
    "className": "NB_COMPONENT_5",
    "rawDescription": "MATERIAL COLOR / VARIANCE",
    "displayName": "Material Color / Variance",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "C5CALIPER_WEIGHT": {
    "techName": "C5CALIPER_WEIGHT",
    "className": "NB_COMPONENT_5",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 9,
    "type": "NUM",
    "tabNote": null
  },
  "C5MATERIALUNIT": {
    "techName": "C5MATERIALUNIT",
    "className": "NB_COMPONENT_5",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "C5PURCHASECERTIFICATION": {
    "techName": "C5PURCHASECERTIFICATION",
    "className": "NB_COMPONENT_5",
    "rawDescription": "PURCHASE CERTIFICATION",
    "displayName": "Purchase Certification",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "C5CERTIFICATIONADDNLNOTE": {
    "techName": "C5CERTIFICATIONADDNLNOTE",
    "className": "NB_COMPONENT_5",
    "rawDescription": "CERTIFICATION ADDNL NOTE",
    "displayName": "Certification Addnl Note",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "C5TECHNICALRAWMATERIALSPEC": {
    "techName": "C5TECHNICALRAWMATERIALSPEC",
    "className": "NB_COMPONENT_5",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "C5PRINTINGTYPE1": {
    "techName": "C5PRINTINGTYPE1",
    "className": "NB_COMPONENT_5",
    "rawDescription": "PRINTING TYPE",
    "displayName": "Printing Type",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "C5NOOFDESIGNS_PRINT_1": {
    "techName": "C5NOOFDESIGNS_PRINT_1",
    "className": "NB_COMPONENT_5",
    "rawDescription": "NO OF DESIGNS / PRINT",
    "displayName": "No of Designs / Print",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "C5NOOFCOLOURSF_B_1": {
    "techName": "C5NOOFCOLOURSF_B_1",
    "className": "NB_COMPONENT_5",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "C5NAMEOFCOLORSF_B_1": {
    "techName": "C5NAMEOFCOLORSF_B_1",
    "className": "NB_COMPONENT_5",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "C5RULING_PRINTDESIGNNAME1": {
    "techName": "C5RULING_PRINTDESIGNNAME1",
    "className": "NB_COMPONENT_5",
    "rawDescription": "RULING / PRINT DESIGN  NAME",
    "displayName": "Ruling / Print Design Name",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "C5RULE_PRINTCODE1": {
    "techName": "C5RULE_PRINTCODE1",
    "className": "NB_COMPONENT_5",
    "rawDescription": "RULE / PRINT CODE",
    "displayName": "Rule / Print Code",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "C5PRINTINGTYPE2": {
    "techName": "C5PRINTINGTYPE2",
    "className": "NB_COMPONENT_5",
    "rawDescription": "PRINTING TYPE 2",
    "displayName": "Printing Type 2",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "C5NOOFDESIGNS_PRINT": {
    "techName": "C5NOOFDESIGNS_PRINT",
    "className": "NB_COMPONENT_5",
    "rawDescription": "NO OF DESIGNS / PRINT 2",
    "displayName": "No of Designs / Print 2",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "C5NOOFCOLOURSF_B": {
    "techName": "C5NOOFCOLOURSF_B",
    "className": "NB_COMPONENT_5",
    "rawDescription": "NO OF COLOURS F/B 2",
    "displayName": "No of Colours F/B 2",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "C5NAMEOFCOLORSF_B": {
    "techName": "C5NAMEOFCOLORSF_B",
    "className": "NB_COMPONENT_5",
    "rawDescription": "NAME OF COLORS F/B 2",
    "displayName": "Name of Colors F/B 2",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "C5RULING_PRINTDESIGNNAME2": {
    "techName": "C5RULING_PRINTDESIGNNAME2",
    "className": "NB_COMPONENT_5",
    "rawDescription": "RULING / PRINT DESIGN  NAME 2",
    "displayName": "Ruling / Print Design Name 2",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "C5RULE_PRINTCODE2": {
    "techName": "C5RULE_PRINTCODE2",
    "className": "NB_COMPONENT_5",
    "rawDescription": "RULE / PRINT CODE",
    "displayName": "Rule / Print Code",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "C5PRINTNOTE": {
    "techName": "C5PRINTNOTE",
    "className": "NB_COMPONENT_5",
    "rawDescription": "PRINT NOTE",
    "displayName": "Print Note",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "C5FINISHING": {
    "techName": "C5FINISHING",
    "className": "NB_COMPONENT_5",
    "rawDescription": "FINISHING",
    "displayName": "Finishing",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "C5FINISHINGNOTE": {
    "techName": "C5FINISHINGNOTE",
    "className": "NB_COMPONENT_5",
    "rawDescription": "FINISHING NOTE",
    "displayName": "Finishing Note",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "C5SPECIALNOTE": {
    "techName": "C5SPECIALNOTE",
    "className": "NB_COMPONENT_5",
    "rawDescription": "SPECIAL NOTE",
    "displayName": "Special Note",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "C5ADDITIONALPROCESS": {
    "techName": "C5ADDITIONALPROCESS",
    "className": "NB_COMPONENT_5",
    "rawDescription": "ADDITIONAL PROCESS",
    "displayName": "Additional Process",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "COMPONENT6NAME": {
    "techName": "COMPONENT6NAME",
    "className": "NB_COMPONENT_6",
    "rawDescription": "COMPONENT 6 NAME",
    "displayName": "Component 6 Name",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "C6SIZELENGTH": {
    "techName": "C6SIZELENGTH",
    "className": "NB_COMPONENT_6",
    "rawDescription": "LENGTH SIZE (CM)",
    "displayName": "Length Size (CM)",
    "sequence": 2,
    "type": "NUM",
    "tabNote": null
  },
  "C6SIZEWIDTH": {
    "techName": "C6SIZEWIDTH",
    "className": "NB_COMPONENT_6",
    "rawDescription": "WIDTH SIZE (CM)",
    "displayName": "Width Size (CM)",
    "sequence": 3,
    "type": "NUM",
    "tabNote": null
  },
  "C6NOOFSHEETS": {
    "techName": "C6NOOFSHEETS",
    "className": "NB_COMPONENT_6",
    "rawDescription": "NO OF SHEETS",
    "displayName": "No of Sheets",
    "sequence": 4,
    "type": "NUM",
    "tabNote": null
  },
  "C6MATERIALTYPE": {
    "techName": "C6MATERIALTYPE",
    "className": "NB_COMPONENT_6",
    "rawDescription": "MATERIAL TYPE",
    "displayName": "Material Type",
    "sequence": 5,
    "type": "CHAR",
    "tabNote": null
  },
  "C6MILL_SUPPLIERNAME": {
    "techName": "C6MILL_SUPPLIERNAME",
    "className": "NB_COMPONENT_6",
    "rawDescription": "MILL / SUPPLIER NAME",
    "displayName": "Mill / Supplier Name",
    "sequence": 6,
    "type": "CHAR",
    "tabNote": null
  },
  "C6MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "C6MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_COMPONENT_6",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "C6MATERIALCOLOR_VARIANCE": {
    "techName": "C6MATERIALCOLOR_VARIANCE",
    "className": "NB_COMPONENT_6",
    "rawDescription": "MATERIAL COLOR / VARIANCE",
    "displayName": "Material Color / Variance",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "C6CALIPER_WEIGHT": {
    "techName": "C6CALIPER_WEIGHT",
    "className": "NB_COMPONENT_6",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 9,
    "type": "NUM",
    "tabNote": null
  },
  "C6MATERIALUNIT": {
    "techName": "C6MATERIALUNIT",
    "className": "NB_COMPONENT_6",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "C6PURCHASECERTIFICATION": {
    "techName": "C6PURCHASECERTIFICATION",
    "className": "NB_COMPONENT_6",
    "rawDescription": "PURCHASE CERTIFICATION",
    "displayName": "Purchase Certification",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "C6CERTIFICATIONADDNLNOTE": {
    "techName": "C6CERTIFICATIONADDNLNOTE",
    "className": "NB_COMPONENT_6",
    "rawDescription": "CERTIFICATION ADDNL NOTE",
    "displayName": "Certification Addnl Note",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "C6TECHNICALRAWMATERIALSPEC": {
    "techName": "C6TECHNICALRAWMATERIALSPEC",
    "className": "NB_COMPONENT_6",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "C6PRINTINGTYPE1": {
    "techName": "C6PRINTINGTYPE1",
    "className": "NB_COMPONENT_6",
    "rawDescription": "PRINTING TYPE",
    "displayName": "Printing Type",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "C6NOOFDESIGNS_PRINT_1": {
    "techName": "C6NOOFDESIGNS_PRINT_1",
    "className": "NB_COMPONENT_6",
    "rawDescription": "NO OF DESIGNS / PRINT",
    "displayName": "No of Designs / Print",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "C6NOOFCOLOURSF_B_1": {
    "techName": "C6NOOFCOLOURSF_B_1",
    "className": "NB_COMPONENT_6",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "C6NAMEOFCOLORSF_B_1": {
    "techName": "C6NAMEOFCOLORSF_B_1",
    "className": "NB_COMPONENT_6",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "C6RULING_PRINTDESIGNNAME1": {
    "techName": "C6RULING_PRINTDESIGNNAME1",
    "className": "NB_COMPONENT_6",
    "rawDescription": "RULING / PRINT DESIGN  NAME",
    "displayName": "Ruling / Print Design Name",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "C6RULE_PRINTCODE1": {
    "techName": "C6RULE_PRINTCODE1",
    "className": "NB_COMPONENT_6",
    "rawDescription": "RULE / PRINT CODE",
    "displayName": "Rule / Print Code",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "C6PRINTINGTYPE2": {
    "techName": "C6PRINTINGTYPE2",
    "className": "NB_COMPONENT_6",
    "rawDescription": "PRINTING TYPE 2",
    "displayName": "Printing Type 2",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "C6NOOFDESIGNS_PRINT": {
    "techName": "C6NOOFDESIGNS_PRINT",
    "className": "NB_COMPONENT_6",
    "rawDescription": "NO OF DESIGNS / PRINT 2",
    "displayName": "No of Designs / Print 2",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "C6NOOFCOLOURSF_B": {
    "techName": "C6NOOFCOLOURSF_B",
    "className": "NB_COMPONENT_6",
    "rawDescription": "NO OF COLOURS F/B 2",
    "displayName": "No of Colours F/B 2",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "C6NAMEOFCOLORSF_B": {
    "techName": "C6NAMEOFCOLORSF_B",
    "className": "NB_COMPONENT_6",
    "rawDescription": "NAME OF COLORS F/B 2",
    "displayName": "Name of Colors F/B 2",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "C6RULING_PRINTDESIGNNAME2": {
    "techName": "C6RULING_PRINTDESIGNNAME2",
    "className": "NB_COMPONENT_6",
    "rawDescription": "RULING / PRINT DESIGN  NAME 2",
    "displayName": "Ruling / Print Design Name 2",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "C6RULE_PRINTCODE2": {
    "techName": "C6RULE_PRINTCODE2",
    "className": "NB_COMPONENT_6",
    "rawDescription": "RULE / PRINT CODE 2",
    "displayName": "Rule / Print Code 2",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "C6PRINTNOTE": {
    "techName": "C6PRINTNOTE",
    "className": "NB_COMPONENT_6",
    "rawDescription": "PRINT NOTE",
    "displayName": "Print Note",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "C6FINISHING": {
    "techName": "C6FINISHING",
    "className": "NB_COMPONENT_6",
    "rawDescription": "FINISHING",
    "displayName": "Finishing",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "C6FINISHINGNOTE": {
    "techName": "C6FINISHINGNOTE",
    "className": "NB_COMPONENT_6",
    "rawDescription": "FINISHING NOTE",
    "displayName": "Finishing Note",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "C6SPECIALNOTE": {
    "techName": "C6SPECIALNOTE",
    "className": "NB_COMPONENT_6",
    "rawDescription": "SPECIAL NOTE",
    "displayName": "Special Note",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "C6ADDITIONALPROCESS": {
    "techName": "C6ADDITIONALPROCESS",
    "className": "NB_COMPONENT_6",
    "rawDescription": "ADDITIONAL PROCESS",
    "displayName": "Additional Process",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "C7PRODUCT_TYPE": {
    "techName": "C7PRODUCT_TYPE",
    "className": "NB_COMPONENT_7",
    "rawDescription": "PRODUCT TYPE",
    "displayName": "Product Type",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "C7CANVAS_MATERIAL": {
    "techName": "C7CANVAS_MATERIAL",
    "className": "NB_COMPONENT_7",
    "rawDescription": "CANVAS MATERIAL",
    "displayName": "Canvas Material",
    "sequence": 2,
    "type": "CHAR",
    "tabNote": null
  },
  "C7CONSTRUCTION_REEDXPICK": {
    "techName": "C7CONSTRUCTION_REEDXPICK",
    "className": "NB_COMPONENT_7",
    "rawDescription": "CONSTRUCTION REED X PICK",
    "displayName": "Construction Reed X Pick",
    "sequence": 3,
    "type": "CHAR",
    "tabNote": null
  },
  "C7COUNT_REEDXPICK": {
    "techName": "C7COUNT_REEDXPICK",
    "className": "NB_COMPONENT_7",
    "rawDescription": "COUNT REED X PICK",
    "displayName": "Count Reed X Pick",
    "sequence": 4,
    "type": "CHAR",
    "tabNote": null
  },
  "C7NOTE_FOR_CANVAS": {
    "techName": "C7NOTE_FOR_CANVAS",
    "className": "NB_COMPONENT_7",
    "rawDescription": "NOTE FOR CANVAS MATERIAL",
    "displayName": "Note for Canvas Material",
    "sequence": 5,
    "type": "CHAR",
    "tabNote": null
  },
  "C7MATERIAL_TYPE": {
    "techName": "C7MATERIAL_TYPE",
    "className": "NB_COMPONENT_7",
    "rawDescription": "MATERIAL TYPE",
    "displayName": "Material Type",
    "sequence": 6,
    "type": "CHAR",
    "tabNote": null
  },
  "C7MILL_SUPPLIERNAME": {
    "techName": "C7MILL_SUPPLIERNAME",
    "className": "NB_COMPONENT_7",
    "rawDescription": "MILL / SUPPLIER NAME",
    "displayName": "Mill / Supplier Name",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "C7MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "C7MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_COMPONENT_7",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "C7MATERIAL_COLOUR": {
    "techName": "C7MATERIAL_COLOUR",
    "className": "NB_COMPONENT_7",
    "rawDescription": "CANVAS MATERIAL COLOUR",
    "displayName": "Canvas Material Colour",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "C7MATERIAL_CERTIFICATION": {
    "techName": "C7MATERIAL_CERTIFICATION",
    "className": "NB_COMPONENT_7",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "C7FINISHING": {
    "techName": "C7FINISHING",
    "className": "NB_COMPONENT_7",
    "rawDescription": "FINISHING",
    "displayName": "Finishing",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "C7CALIPER_WEIGHT": {
    "techName": "C7CALIPER_WEIGHT",
    "className": "NB_COMPONENT_7",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 12,
    "type": "NUM",
    "tabNote": null
  },
  "C7MATERIALUNIT": {
    "techName": "C7MATERIALUNIT",
    "className": "NB_COMPONENT_7",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "C7PANNEL_TYPE": {
    "techName": "C7PANNEL_TYPE",
    "className": "NB_COMPONENT_7",
    "rawDescription": "PANNEL MATERIAL TYPE",
    "displayName": "Pannel Material Type",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "C71NCALIPER_WEIGHT": {
    "techName": "C71NCALIPER_WEIGHT",
    "className": "NB_COMPONENT_7",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 15,
    "type": "NUM",
    "tabNote": null
  },
  "C71MATERIALUNIT": {
    "techName": "C71MATERIALUNIT",
    "className": "NB_COMPONENT_7",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "C7MILL_SUPPLIERNAME2": {
    "techName": "C7MILL_SUPPLIERNAME2",
    "className": "NB_COMPONENT_7",
    "rawDescription": "MILL NAME",
    "displayName": "Mill Name",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "C7MILL_SUPLIER_QLTY_GRDE_FNSH2": {
    "techName": "C7MILL_SUPLIER_QLTY_GRDE_FNSH2",
    "className": "NB_COMPONENT_7",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "C7MDF_CERT": {
    "techName": "C7MDF_CERT",
    "className": "NB_COMPONENT_7",
    "rawDescription": "CERTIFICATION REQ",
    "displayName": "Certification Req",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "C7SPECIAL_NOTE": {
    "techName": "C7SPECIAL_NOTE",
    "className": "NB_COMPONENT_7",
    "rawDescription": "SPECIAL NOTE",
    "displayName": "Special Note",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "C7FRAME_MAT_TYPE": {
    "techName": "C7FRAME_MAT_TYPE",
    "className": "NB_COMPONENT_7",
    "rawDescription": "FRAME MATERIAL TYPE",
    "displayName": "Frame Material Type",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "C7FRAME_INCH": {
    "techName": "C7FRAME_INCH",
    "className": "NB_COMPONENT_7",
    "rawDescription": "FRAME SIZE IN INCH",
    "displayName": "Frame Size in INCH",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "C7FRAME_THICKNESS": {
    "techName": "C7FRAME_THICKNESS",
    "className": "NB_COMPONENT_7",
    "rawDescription": "FRAME PROFILE THICKNESS IN MM",
    "displayName": "Frame Profile Thickness in MM",
    "sequence": 26,
    "type": "NUM",
    "tabNote": null
  },
  "C7FRAME_BACK_WIDTH": {
    "techName": "C7FRAME_BACK_WIDTH",
    "className": "NB_COMPONENT_7",
    "rawDescription": "FRAME BCK WIDTH THICKNES IN MM",
    "displayName": "Frame Bck Width Thicknes in MM",
    "sequence": 27,
    "type": "NUM",
    "tabNote": null
  },
  "C7FRAME_TYPE": {
    "techName": "C7FRAME_TYPE",
    "className": "NB_COMPONENT_7",
    "rawDescription": "FRAME JOINT TYPE",
    "displayName": "Frame Joint Type",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "C7BEVEL_REQUIRED": {
    "techName": "C7BEVEL_REQUIRED",
    "className": "NB_COMPONENT_7",
    "rawDescription": "BEVEL REQUIRED",
    "displayName": "Bevel Required",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "C7FRAME_CERT": {
    "techName": "C7FRAME_CERT",
    "className": "NB_COMPONENT_7",
    "rawDescription": "PURCHASE CERTIFICATION REQ",
    "displayName": "Purchase Certification Req",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "NOOFDIVIDERSOFTYPE1": {
    "techName": "NOOFDIVIDERSOFTYPE1",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "NO OF DIVIDERS OF TYPE 1",
    "displayName": "No of Dividers of Type 1",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": null
  },
  "DIVIDERSTYPE1": {
    "techName": "DIVIDERSTYPE1",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDERS TYPE",
    "displayName": "Dividers Type",
    "sequence": 2,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "DIVIDERPOSITION1": {
    "techName": "DIVIDERPOSITION1",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER POSITION",
    "displayName": "Divider Position",
    "sequence": 3,
    "type": "CHAR",
    "tabNote": null
  },
  "TABSTYLEOF1STDIVIDERS": {
    "techName": "TABSTYLEOF1STDIVIDERS",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "TAB STYLE OF  DIVIDERS",
    "displayName": "Tab Style of Dividers",
    "sequence": 4,
    "type": "CHAR",
    "tabNote": null
  },
  "POCKETSTYLEOF1STDIVIDERS": {
    "techName": "POCKETSTYLEOF1STDIVIDERS",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "POCKET STYLE OF DIVIDERS",
    "displayName": "Pocket Style of Dividers",
    "sequence": 5,
    "type": "CHAR",
    "tabNote": null
  },
  "DIVIDER1SIZEINCLTABWIDTH": {
    "techName": "DIVIDER1SIZEINCLTABWIDTH",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER SIZE LENGTH",
    "displayName": "Divider Size Length",
    "sequence": 6,
    "type": "NUM",
    "tabNote": null
  },
  "DIVIDER1SIZEWIDTH": {
    "techName": "DIVIDER1SIZEWIDTH",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER SIZE WIDTH",
    "displayName": "Divider Size Width",
    "sequence": 7,
    "type": "NUM",
    "tabNote": null
  },
  "DIVIDER1SIZEINCLTABLENGTH": {
    "techName": "DIVIDER1SIZEINCLTABLENGTH",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER SIZE INCL TAB WIDTH",
    "displayName": "Divider Size Incl Tab Width",
    "sequence": 8,
    "type": "NUM",
    "tabNote": null
  },
  "DIVIDERMATERIALTYPE1": {
    "techName": "DIVIDERMATERIALTYPE1",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER MATERIAL TYPE",
    "displayName": "Divider Material Type",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "D1MILL_SUPPLIER_SNAME": {
    "techName": "D1MILL_SUPPLIER_SNAME",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "MILL / SUPPLIER'S NAME",
    "displayName": "Mill / Supplier's Name",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "D1MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "D1MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "D1MATERIALCOLOR_VARIANCE": {
    "techName": "D1MATERIALCOLOR_VARIANCE",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "MATERIAL COLOR / VARIANCE",
    "displayName": "Material Color / Variance",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "D1DIVIDERCALIPER_WEIGHT": {
    "techName": "D1DIVIDERCALIPER_WEIGHT",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER CALIPER / WEIGHT",
    "displayName": "Divider Caliper / Weight",
    "sequence": 13,
    "type": "NUM",
    "tabNote": null
  },
  "D1DIVIDERMATERIALUNIT": {
    "techName": "D1DIVIDERMATERIALUNIT",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER MATERIAL UNIT",
    "displayName": "Divider Material Unit",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "D1DIVIDERPURCHASECERT": {
    "techName": "D1DIVIDERPURCHASECERT",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER PURCHASE CERTIFICATION",
    "displayName": "Divider Purchase Certification",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "D1DIVIDERTECHMATERIALSPEC": {
    "techName": "D1DIVIDERTECHMATERIALSPEC",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "D1PRINTINGTYPE": {
    "techName": "D1PRINTINGTYPE",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "PRINTING TYPE",
    "displayName": "Printing Type",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "D1NOOFDESIGNS_PRINT": {
    "techName": "D1NOOFDESIGNS_PRINT",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "NO OF DESIGNS / PRINT",
    "displayName": "No of Designs / Print",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "D1NOOFCOLOURSF_B": {
    "techName": "D1NOOFCOLOURSF_B",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "D1NAMEOFCOLORSF_B": {
    "techName": "D1NAMEOFCOLORSF_B",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "D1PRINTFINISHING": {
    "techName": "D1PRINTFINISHING",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "PRINT FINISHING",
    "displayName": "Print Finishing",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "D1ADDITIONALINFOFORDIVIDER": {
    "techName": "D1ADDITIONALINFOFORDIVIDER",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "ADDITIONAL INFO FOR DIVIDERS",
    "displayName": "Additional Info for Dividers",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "D1NOOFDIVIDERSOFTYPE2": {
    "techName": "D1NOOFDIVIDERSOFTYPE2",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "NO OF DIVIDERS OF TYPE 2",
    "displayName": "No of Dividers of Type 2",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "DIVIDERSTYPE2": {
    "techName": "DIVIDERSTYPE2",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDERS TYPE",
    "displayName": "Dividers Type",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "DIVIDERPOSITION2": {
    "techName": "DIVIDERPOSITION2",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER POSITION",
    "displayName": "Divider Position",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "TABSTYLEOF2NDDIVIDERS": {
    "techName": "TABSTYLEOF2NDDIVIDERS",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "TAB STYLE OF  DIVIDERS",
    "displayName": "Tab Style of Dividers",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "POCKETSTYLEOFDIVIDERS": {
    "techName": "POCKETSTYLEOFDIVIDERS",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "POCKET STYLE OF DIVIDERS",
    "displayName": "Pocket Style of Dividers",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "DIVIDERSIZEINCLTABWIDTH": {
    "techName": "DIVIDERSIZEINCLTABWIDTH",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER SIZE INCL TAB WIDTH",
    "displayName": "Divider Size Incl Tab Width",
    "sequence": 28,
    "type": "NUM",
    "tabNote": null
  },
  "DIVIDERSIZEINCLTABLENGTH": {
    "techName": "DIVIDERSIZEINCLTABLENGTH",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER SIZE INCL TAB LENGTH",
    "displayName": "Divider Size Incl Tab Length",
    "sequence": 29,
    "type": "NUM",
    "tabNote": null
  },
  "DIVIDERMATERIALTYPE2": {
    "techName": "DIVIDERMATERIALTYPE2",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER MATERIAL TYPE",
    "displayName": "Divider Material Type",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "D2MILL_SUPPLIER_SNAME": {
    "techName": "D2MILL_SUPPLIER_SNAME",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "MILL / SUPPLIER'S NAME",
    "displayName": "Mill / Supplier's Name",
    "sequence": 33,
    "type": "CHAR",
    "tabNote": null
  },
  "D2MILL_SUPLIER_QLTY_GRDE_FNSH": {
    "techName": "D2MILL_SUPLIER_QLTY_GRDE_FNSH",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "displayName": "MILL/SUPLIER/QLTY/GRADE/FINISH",
    "sequence": 34,
    "type": "CHAR",
    "tabNote": null
  },
  "D2MATERIALCOLOR_VARIANCE": {
    "techName": "D2MATERIALCOLOR_VARIANCE",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "MATERIAL COLOR / VARIANCE",
    "displayName": "Material Color / Variance",
    "sequence": 35,
    "type": "CHAR",
    "tabNote": null
  },
  "D2DIVIDERCALIPER_WEIGHT": {
    "techName": "D2DIVIDERCALIPER_WEIGHT",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER CALIPER / WEIGHT",
    "displayName": "Divider Caliper / Weight",
    "sequence": 36,
    "type": "NUM",
    "tabNote": null
  },
  "D2DIVIDERMATERIALUNIT": {
    "techName": "D2DIVIDERMATERIALUNIT",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER MATERIAL UNIT",
    "displayName": "Divider Material Unit",
    "sequence": 37,
    "type": "CHAR",
    "tabNote": null
  },
  "D2DIVIDERPURCHASECERT": {
    "techName": "D2DIVIDERPURCHASECERT",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "DIVIDER PURCHASE CERTIFICATE",
    "displayName": "Divider Purchase Certificate",
    "sequence": 38,
    "type": "CHAR",
    "tabNote": null
  },
  "D2DIVIDERTECHMATERIALSPEC": {
    "techName": "D2DIVIDERTECHMATERIALSPEC",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "TECHNICAL RAW MATERIAL SPECS",
    "displayName": "Technical Raw Material Specs",
    "sequence": 39,
    "type": "CHAR",
    "tabNote": null
  },
  "D2PRINTINGTYPE": {
    "techName": "D2PRINTINGTYPE",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "PRINTING TYPE",
    "displayName": "Printing Type",
    "sequence": 40,
    "type": "CHAR",
    "tabNote": null
  },
  "D2NOOFDESIGNS_PRINT": {
    "techName": "D2NOOFDESIGNS_PRINT",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "NO OF DESIGNS / PRINT",
    "displayName": "No of Designs / Print",
    "sequence": 41,
    "type": "CHAR",
    "tabNote": null
  },
  "D2NOOFCOLOURSF_B": {
    "techName": "D2NOOFCOLOURSF_B",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 42,
    "type": "CHAR",
    "tabNote": null
  },
  "D2NAMEOFCOLORSF_B": {
    "techName": "D2NAMEOFCOLORSF_B",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 43,
    "type": "CHAR",
    "tabNote": null
  },
  "D2PRINTFINISHING": {
    "techName": "D2PRINTFINISHING",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "PRINT FINISHING",
    "displayName": "Print Finishing",
    "sequence": 44,
    "type": "CHAR",
    "tabNote": null
  },
  "D2ADDITIONALINFOFORDIVIDER": {
    "techName": "D2ADDITIONALINFOFORDIVIDER",
    "className": "NB_DIVIDER_SPECS",
    "rawDescription": "ADDITIONAL INFO FOR DIVIDERS",
    "displayName": "Additional Info for Dividers",
    "sequence": 45,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGETYPE1": {
    "techName": "PACKAGETYPE1",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING TYPE 1",
    "displayName": "Packaging Type 1",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "P1_APPLICATION": {
    "techName": "P1_APPLICATION",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "APPLICATION",
    "displayName": "Application",
    "sequence": 2,
    "type": "CHAR",
    "tabNote": null
  },
  "P1_POSITIONING": {
    "techName": "P1_POSITIONING",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "POSITIONING",
    "displayName": "Positioning",
    "sequence": 3,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGING1SIZELENGTH": {
    "techName": "PACKAGING1SIZELENGTH",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING 1 SIZE LENGTH (CM)",
    "displayName": "Packaging 1 Size Length (CM)",
    "sequence": 4,
    "type": "NUM",
    "tabNote": null
  },
  "PACKAGING1SIZEWIDTH": {
    "techName": "PACKAGING1SIZEWIDTH",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING 1 SIZE WIDTH (CM)",
    "displayName": "Packaging 1 Size Width (CM)",
    "sequence": 5,
    "type": "NUM",
    "tabNote": null
  },
  "PACKAGING1MATERIALTYPE": {
    "techName": "PACKAGING1MATERIALTYPE",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING 1 MATERIAL TYPE",
    "displayName": "Packaging 1 Material Type",
    "sequence": 6,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGINGMILL_SUPPLIERNAME": {
    "techName": "PACKAGINGMILL_SUPPLIERNAME",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING MILL / SUPPLIER NAME",
    "displayName": "Packaging Mill / Supplier Name",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "PCKGMILL_SUPPLIER_QLTY_GRADE": {
    "techName": "PCKGMILL_SUPPLIER_QLTY_GRADE",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "MIL/SUPPLIER/QLTY/GRADE/FINISH",
    "displayName": "MIL/SUPPLIER/QLTY/GRADE/FINISH",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "CALIPER_WEIGHT": {
    "techName": "CALIPER_WEIGHT",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 9,
    "type": "NUM",
    "tabNote": null
  },
  "MATERIALUNIT": {
    "techName": "MATERIALUNIT",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "P1PRINTINGTYPE": {
    "techName": "P1PRINTINGTYPE",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PRINTING TYPE 1",
    "displayName": "Printing Type 1",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "NOOFCOLOURSF_B": {
    "techName": "NOOFCOLOURSF_B",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "NAMEOFCOLORSF_B": {
    "techName": "NAMEOFCOLORSF_B",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGING1FINISHING": {
    "techName": "PACKAGING1FINISHING",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING 1 FINISHING",
    "displayName": "Packaging 1 Finishing",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "ADDITIONALPROCESS": {
    "techName": "ADDITIONALPROCESS",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "ADDITIONAL PROCESS",
    "displayName": "Additional Process",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGING1SPECIALNOTE": {
    "techName": "PACKAGING1SPECIALNOTE",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING  1 SPECIAL  NOTE",
    "displayName": "Packaging 1 Special Note",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGETYPE2": {
    "techName": "PACKAGETYPE2",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING TYPE 2",
    "displayName": "Packaging Type 2",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "P2_APPLICATION": {
    "techName": "P2_APPLICATION",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "APPLICATION P2",
    "displayName": "Application P2",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "P2_POSITIONING": {
    "techName": "P2_POSITIONING",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "POSITIONING P2",
    "displayName": "Positioning P2",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGING2SIZELENGTH": {
    "techName": "PACKAGING2SIZELENGTH",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING 2 SIZE LENGTH",
    "displayName": "Packaging 2 Size Length",
    "sequence": 20,
    "type": "NUM",
    "tabNote": null
  },
  "PACKAGING2SIZEWIDTH": {
    "techName": "PACKAGING2SIZEWIDTH",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING 2 SIZE WIDTH",
    "displayName": "Packaging 2 Size Width",
    "sequence": 21,
    "type": "NUM",
    "tabNote": null
  },
  "PACKAGING2MATERIALTYPE": {
    "techName": "PACKAGING2MATERIALTYPE",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING 2 MATERIAL TYPE",
    "displayName": "Packaging 2 Material Type",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGINGMILL_SUPPLIERNAME2": {
    "techName": "PACKAGINGMILL_SUPPLIERNAME2",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING MILL / SUPPLIER NAME",
    "displayName": "Packaging Mill / Supplier Name",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "PCKGMILL_SUPPLIER_QLTY_GRADE2": {
    "techName": "PCKGMILL_SUPPLIER_QLTY_GRADE2",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "MIL/SUPPLIER/QLTY/GRADE/FINISH",
    "displayName": "MIL/SUPPLIER/QLTY/GRADE/FINISH",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "CALIPER_WEIGHT2": {
    "techName": "CALIPER_WEIGHT2",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "CALIPER / WEIGHT",
    "displayName": "Caliper / Weight",
    "sequence": 25,
    "type": "NUM",
    "tabNote": null
  },
  "MATERIALUNIT2": {
    "techName": "MATERIALUNIT2",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "MATERIAL UNIT",
    "displayName": "Material Unit",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "P2PRINTINGTYPE": {
    "techName": "P2PRINTINGTYPE",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PRINTING TYPE 2",
    "displayName": "Printing Type 2",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "NOOFCOLOURSF_B2": {
    "techName": "NOOFCOLOURSF_B2",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "NO OF COLOURS F/B",
    "displayName": "No of Colours F/B",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "NAMEOFCOLORSF_B2": {
    "techName": "NAMEOFCOLORSF_B2",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "NAME OF COLORS F/B",
    "displayName": "Name of Colors F/B",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGING2FINISHING": {
    "techName": "PACKAGING2FINISHING",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING 2 FINISHING",
    "displayName": "Packaging 2 Finishing",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "ADDITIONALPROCESS2": {
    "techName": "ADDITIONALPROCESS2",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "ADDITIONAL PROCESS",
    "displayName": "Additional Process",
    "sequence": 44,
    "type": "CHAR",
    "tabNote": null
  },
  "PACKAGING2SPECIALNOTE": {
    "techName": "PACKAGING2SPECIALNOTE",
    "className": "PACKAGING_SPECS_1",
    "rawDescription": "PACKAGING  2 SPECIAL  NOTE",
    "displayName": "Packaging 2 Special Note",
    "sequence": 45,
    "type": "CHAR",
    "tabNote": null
  },
  "RETAILPACK_SALEUNITPACK": {
    "techName": "RETAILPACK_SALEUNITPACK",
    "className": "PACKING_DETAILS",
    "rawDescription": "NO OF PCS IN RETAIL/SALE UNIT",
    "displayName": "No of Pcs in RETAIL/SALE Unit",
    "sequence": 1,
    "type": "CHAR",
    "tabNote": null
  },
  "RETAILPACKTYPE": {
    "techName": "RETAILPACKTYPE",
    "className": "PACKING_DETAILS",
    "rawDescription": "RETAIL PACK TYPE",
    "displayName": "Retail Pack Type",
    "sequence": 2,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "MATERIAL_SPECS": {
    "techName": "MATERIAL_SPECS",
    "className": "PACKING_DETAILS",
    "rawDescription": "MATERIAL & SPECS",
    "displayName": "Material & Specs",
    "sequence": 3,
    "type": "CHAR",
    "tabNote": null
  },
  "PRINTINGINSTRUCTION": {
    "techName": "PRINTINGINSTRUCTION",
    "className": "PACKING_DETAILS",
    "rawDescription": "PRINTING INSTRUCTION",
    "displayName": "Printing Instruction",
    "sequence": 4,
    "type": "CHAR",
    "tabNote": null
  },
  "DESIGN_COLORASSORTMENT": {
    "techName": "DESIGN_COLORASSORTMENT",
    "className": "PACKING_DETAILS",
    "rawDescription": "DESIGN / COLOR ASSORTMENT",
    "displayName": "Design / Color Assortment",
    "sequence": 5,
    "type": "CHAR",
    "tabNote": null
  },
  "SPECIALINSTRUCTIONS": {
    "techName": "SPECIALINSTRUCTIONS",
    "className": "PACKING_DETAILS",
    "rawDescription": "SPECIAL INSTRUCTIONS",
    "displayName": "Special Instructions",
    "sequence": 6,
    "type": "CHAR",
    "tabNote": null
  },
  "INNERPACKINGNOOFPCS": {
    "techName": "INNERPACKINGNOOFPCS",
    "className": "PACKING_DETAILS",
    "rawDescription": "INNER PACKING NO OF PCS",
    "displayName": "Inner Packing No of Pcs",
    "sequence": 7,
    "type": "CHAR",
    "tabNote": null
  },
  "INNERPACKINGTYPE": {
    "techName": "INNERPACKINGTYPE",
    "className": "PACKING_DETAILS",
    "rawDescription": "INNER PACKING TYPE",
    "displayName": "Inner Packing Type",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "INNERMATERIALSPECS": {
    "techName": "INNERMATERIALSPECS",
    "className": "PACKING_DETAILS",
    "rawDescription": "INNER MATERIAL SPECS",
    "displayName": "Inner Material Specs",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "INNERSPECIALINSTRUCTIONS": {
    "techName": "INNERSPECIALINSTRUCTIONS",
    "className": "PACKING_DETAILS",
    "rawDescription": "INNER SPECIALINSTRUCTIONS",
    "displayName": "Inner Specialinstructions",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "INNERPRINTINGINSTRUCTION": {
    "techName": "INNERPRINTINGINSTRUCTION",
    "className": "PACKING_DETAILS",
    "rawDescription": "INNER PRINTINGINSTRUCTION",
    "displayName": "Inner Printinginstruction",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "I_WHNUMBEROFSALEUNITS": {
    "techName": "I_WHNUMBEROFSALEUNITS",
    "className": "PACKING_DETAILS",
    "rawDescription": "I-WH NUMBER OF SALE UNITS",
    "displayName": "I-wh Number of Sale Units",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "I_WHINNERPACKTYPE": {
    "techName": "I_WHINNERPACKTYPE",
    "className": "PACKING_DETAILS",
    "rawDescription": "I-WH PACK TYPE",
    "displayName": "I-wh Pack Type",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": null
  },
  "MATERIAL_SPECS2": {
    "techName": "MATERIAL_SPECS2",
    "className": "PACKING_DETAILS",
    "rawDescription": "MATERIAL & SPECS",
    "displayName": "Material & Specs",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  },
  "I_WHPRINTINGINSTRUCTION": {
    "techName": "I_WHPRINTINGINSTRUCTION",
    "className": "PACKING_DETAILS",
    "rawDescription": "I/WH PRINTING INSTRUCTION",
    "displayName": "I/WH Printing Instruction",
    "sequence": 15,
    "type": "CHAR",
    "tabNote": null
  },
  "DESIGN_COLORASSORTMENT2": {
    "techName": "DESIGN_COLORASSORTMENT2",
    "className": "PACKING_DETAILS",
    "rawDescription": "DESIGN / COLOR ASSORTMENT",
    "displayName": "Design / Color Assortment",
    "sequence": 16,
    "type": "CHAR",
    "tabNote": null
  },
  "I_WHSPECIALINSTRUCTIONS": {
    "techName": "I_WHSPECIALINSTRUCTIONS",
    "className": "PACKING_DETAILS",
    "rawDescription": "I/WH SPECIAL INSTRUCTIONS",
    "displayName": "I/WH Special Instructions",
    "sequence": 17,
    "type": "CHAR",
    "tabNote": null
  },
  "MASTERNUMBEROFSALEUNITS": {
    "techName": "MASTERNUMBEROFSALEUNITS",
    "className": "PACKING_DETAILS",
    "rawDescription": "MASTER NUMBER OF SALE UNITS",
    "displayName": "Master Number of Sale Units",
    "sequence": 18,
    "type": "CHAR",
    "tabNote": null
  },
  "MASTERPACKTYPE": {
    "techName": "MASTERPACKTYPE",
    "className": "PACKING_DETAILS",
    "rawDescription": "MASTER PACK TYPE",
    "displayName": "Master Pack Type",
    "sequence": 19,
    "type": "CHAR",
    "tabNote": null
  },
  "MASTERMATERIAL_SPECS": {
    "techName": "MASTERMATERIAL_SPECS",
    "className": "PACKING_DETAILS",
    "rawDescription": "MASTER MATERIAL & SPECS",
    "displayName": "Master Material & Specs",
    "sequence": 20,
    "type": "CHAR",
    "tabNote": null
  },
  "MASTERSTACKING_ASSORTTYPE": {
    "techName": "MASTERSTACKING_ASSORTTYPE",
    "className": "PACKING_DETAILS",
    "rawDescription": "MASTER STACKING & ASSORT. TYPE",
    "displayName": "Master Stacking & Assort. Type",
    "sequence": 21,
    "type": "CHAR",
    "tabNote": null
  },
  "MASTERMARK_PRINTINSTR_POS": {
    "techName": "MASTERMARK_PRINTINSTR_POS",
    "className": "PACKING_DETAILS",
    "rawDescription": "MASTER MARK/PRINT INSTR. & POS",
    "displayName": "Master MARK/PRINT Instr. & Pos",
    "sequence": 22,
    "type": "CHAR",
    "tabNote": null
  },
  "MASTERSPECIALINSTRUCTIONS": {
    "techName": "MASTERSPECIALINSTRUCTIONS",
    "className": "PACKING_DETAILS",
    "rawDescription": "MASTER SPECIAL INSTRUCTIONS",
    "displayName": "Master Special Instructions",
    "sequence": 23,
    "type": "CHAR",
    "tabNote": null
  },
  "STUFFINGTYPE": {
    "techName": "STUFFINGTYPE",
    "className": "PACKING_DETAILS",
    "rawDescription": "STUFFING TYPE",
    "displayName": "Stuffing Type",
    "sequence": 24,
    "type": "CHAR",
    "tabNote": null
  },
  "MAXPALLETSIZEALLOW_LXWXH": {
    "techName": "MAXPALLETSIZEALLOW_LXWXH",
    "className": "PACKING_DETAILS",
    "rawDescription": "MAX PALLET SIZE ALLOW (LXWXH)",
    "displayName": "Max Pallet Size Allow (lxwxh)",
    "sequence": 25,
    "type": "CHAR",
    "tabNote": null
  },
  "MAXPALLETWEIGHT": {
    "techName": "MAXPALLETWEIGHT",
    "className": "PACKING_DETAILS",
    "rawDescription": "MAX WEIGHT ALLOW (INCL PALLET)",
    "displayName": "Max Weight Allow (incl Pallet)",
    "sequence": 26,
    "type": "CHAR",
    "tabNote": null
  },
  "SPECIALINSTRUCTIONS2": {
    "techName": "SPECIALINSTRUCTIONS2",
    "className": "PACKING_DETAILS",
    "rawDescription": "SPECIAL INSTRUCTIONS",
    "displayName": "Special Instructions",
    "sequence": 27,
    "type": "CHAR",
    "tabNote": null
  },
  "TAPPINGDETAILS": {
    "techName": "TAPPINGDETAILS",
    "className": "PACKING_DETAILS",
    "rawDescription": "TAPPING DETAILS",
    "displayName": "Tapping Details",
    "sequence": 28,
    "type": "CHAR",
    "tabNote": null
  },
  "PRODUCTBARCODE": {
    "techName": "PRODUCTBARCODE",
    "className": "PACKING_DETAILS",
    "rawDescription": "PRODUCT BARCODE",
    "displayName": "Product Barcode",
    "sequence": 29,
    "type": "CHAR",
    "tabNote": null
  },
  "INNERBARCODE": {
    "techName": "INNERBARCODE",
    "className": "PACKING_DETAILS",
    "rawDescription": "INNER BARCODE",
    "displayName": "Inner Barcode",
    "sequence": 30,
    "type": "CHAR",
    "tabNote": null
  },
  "MASTERBARCODE": {
    "techName": "MASTERBARCODE",
    "className": "PACKING_DETAILS",
    "rawDescription": "MASTER BARCODE",
    "displayName": "Master Barcode",
    "sequence": 31,
    "type": "CHAR",
    "tabNote": null
  },
  "TOP_MARGIN": {
    "techName": "TOP_MARGIN",
    "className": "RULLING_DETAILS",
    "rawDescription": "TOP MARGIN (In MM)",
    "displayName": "Top Margin (in MM)",
    "sequence": 1,
    "type": "NUM",
    "tabNote": null
  },
  "TOP_MARGIN_COLOR": {
    "techName": "TOP_MARGIN_COLOR",
    "className": "RULLING_DETAILS",
    "rawDescription": "TOP MARGIN COLOR",
    "displayName": "Top Margin Color",
    "sequence": 2,
    "type": "CHAR",
    "tabNote": null
  },
  "LEFT_MARGIN": {
    "techName": "LEFT_MARGIN",
    "className": "RULLING_DETAILS",
    "rawDescription": "LEFT MARGIN (In MM)",
    "displayName": "Left Margin (in MM)",
    "sequence": 3,
    "type": "NUM",
    "tabNote": null
  },
  "LEFT_MARGIN_COLOR": {
    "techName": "LEFT_MARGIN_COLOR",
    "className": "RULLING_DETAILS",
    "rawDescription": "LEFT MARGIN COLOR",
    "displayName": "Left Margin Color",
    "sequence": 4,
    "type": "CHAR",
    "tabNote": null
  },
  "RIGHT_MARGIN": {
    "techName": "RIGHT_MARGIN",
    "className": "RULLING_DETAILS",
    "rawDescription": "RIGHT MARGIN (In MM)",
    "displayName": "Right Margin (in MM)",
    "sequence": 5,
    "type": "NUM",
    "tabNote": null
  },
  "RIGHT_MARGIN_COLOR": {
    "techName": "RIGHT_MARGIN_COLOR",
    "className": "RULLING_DETAILS",
    "rawDescription": "RIGHT MARGIN COLOR",
    "displayName": "Right Margin Color",
    "sequence": 6,
    "type": "CHAR",
    "tabNote": null
  },
  "BOTTOM_MARGIN": {
    "techName": "BOTTOM_MARGIN",
    "className": "RULLING_DETAILS",
    "rawDescription": "BOTTOM MARGIN (In MM)",
    "displayName": "Bottom Margin (in MM)",
    "sequence": 7,
    "type": "NUM",
    "tabNote": null
  },
  "BOTTOM_MARGIN_COLOR": {
    "techName": "BOTTOM_MARGIN_COLOR",
    "className": "RULLING_DETAILS",
    "rawDescription": "BOTTOM MARGIN COLOR",
    "displayName": "Bottom Margin Color",
    "sequence": 8,
    "type": "CHAR",
    "tabNote": null
  },
  "CENTER_MARGIN_COLOR": {
    "techName": "CENTER_MARGIN_COLOR",
    "className": "RULLING_DETAILS",
    "rawDescription": "CENTER MARGIN COLOR",
    "displayName": "Center Margin Color",
    "sequence": 9,
    "type": "CHAR",
    "tabNote": null
  },
  "RULLING_PDF": {
    "techName": "RULLING_PDF",
    "className": "RULLING_DETAILS",
    "rawDescription": "RULLING PDF SENT TO PLANT",
    "displayName": "Rulling Pdf Sent to Plant",
    "sequence": 10,
    "type": "CHAR",
    "tabNote": null
  },
  "SPECIAL_RULING": {
    "techName": "SPECIAL_RULING",
    "className": "RULLING_DETAILS",
    "rawDescription": "SPECIAL RULING (If Any)",
    "displayName": "Special Ruling (if Any)",
    "sequence": 11,
    "type": "CHAR",
    "tabNote": null
  },
  "INSTRUCTION_RULLING": {
    "techName": "INSTRUCTION_RULLING",
    "className": "RULLING_DETAILS",
    "rawDescription": "INSTRUCTIONS FOR RULLING",
    "displayName": "Instructions for Rulling",
    "sequence": 12,
    "type": "CHAR",
    "tabNote": null
  },
  "RULLING_DISTANCE": {
    "techName": "RULLING_DISTANCE",
    "className": "RULLING_DETAILS",
    "rawDescription": "RULLING DISTANCE (IN MM)",
    "displayName": "Rulling Distance (in MM)",
    "sequence": 13,
    "type": "CHAR",
    "tabNote": "This Value to be displayed as Tab Name"
  },
  "RULLING_SHADE": {
    "techName": "RULLING_SHADE",
    "className": "RULLING_DETAILS",
    "rawDescription": "RULLING_SHADE",
    "displayName": "Rulling_shade",
    "sequence": 14,
    "type": "CHAR",
    "tabNote": null
  }
};

export const CLASS_SEQUENCE_ORDER: readonly string[] = [
  "PRODUCT_CLASS",
  "NB_BINDING",
  "NB_COMPONENT_1",
  "NB_COMPONENT_2",
  "NB_COMPONENT_3",
  "NB_COMPONENT_4",
  "NB_COMPONENT_5",
  "NB_COMPONENT_6",
  "NB_COMPONENT_7",
  "NB_DIVIDER_SPECS",
  "PACKAGING_SPECS_1",
  "PACKING_DETAILS",
  "RULLING_DETAILS",
];

/**
 * Returns the human-friendly display name for a specification class
 */
export function getFriendlyClassName(className: string): string {
  const meta = CLASS_METADATA[className];
  if (meta && meta.displayName) {
    return meta.displayName;
  }
  return className
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns the human-friendly display name for a characteristic
 */
export function getFriendlyCharacteristicName(charName: string): string {
  const meta = CHARACTERISTIC_METADATA[charName];
  if (meta && meta.displayName) {
    return meta.displayName;
  }
  return charName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns the sequence of a characteristic based on Excel sequence
 */
export function getCharacteristicSequence(_className: string, charName: string): number {
  const meta = CHARACTERISTIC_METADATA[charName];
  if (meta && meta.sequence !== undefined) {
    return meta.sequence;
  }
  return 999;
}

/**
 * Returns a dynamic tab/card title if the class has a named characteristic (e.g. COMPONENT1NAME)
 */
export function getDynamicClassTitle(
  className: string,
  details: { characteristicName: string; value?: string | null }[]
): string {
  const baseName = getFriendlyClassName(className);
  if (!details || details.length === 0) return baseName;

  const findVal = (name: string): string => {
    const d = details.find(
      (item) => item.characteristicName.toUpperCase() === name.toUpperCase()
    );
    const v = (d?.value || "").trim();
    return v && !["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(v.toUpperCase())
      ? v
      : "";
  };

  if (className === "NB_BINDING") {
    const bindingVal = findVal("BINDINGTYPE1");
    return bindingVal ? `${baseName} (${bindingVal})` : baseName;
  }

  if (className.startsWith("NB_COMPONENT_")) {
    const compNum = className.replace("NB_COMPONENT_", "");
    const compName = findVal(`COMPONENT${compNum}NAME`) || findVal(`C${compNum}PRODUCT_TYPE`);
    return compName ? `${compName} (Component ${compNum})` : baseName;
  }

  if (className === "NB_DIVIDER_SPECS") {
    const divType = findVal("DIVIDERSTYPE1");
    return divType ? `${baseName} (${divType})` : baseName;
  }

  if (className === "PACKAGING_SPECS_1") {
    const pkgType = findVal("PACKAGETYPE1");
    return pkgType ? `${baseName} (${pkgType})` : baseName;
  }

  if (className === "PACKING_DETAILS") {
    const packType = findVal("RETAILPACKTYPE");
    return packType ? `${baseName} (${packType})` : baseName;
  }

  return baseName;
}
