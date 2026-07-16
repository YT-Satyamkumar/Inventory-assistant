/* checksum : 5cb5510e3ded61543ead3f33e5ae5e48 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZAPI_MATERIAL_STOCK_SRV1 {
  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Serial Numbers with Material Stock'
  entity A_MaterialSerialNumber {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    key Material : String(40) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Serial Number'
    key SerialNumber : String(18) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Storage Location'
    StorageLocation : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Special Stock'
    @sap.quickinfo : 'Special Stock Indicator'
    InventorySpecialStockType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Stock batch'
    @sap.quickinfo : 'Batch Number'
    Batch : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Stock Type'
    @sap.quickinfo : 'Stock Type of Goods Movement (Primary Posting)'
    InventoryStockType : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Equipment'
    @sap.quickinfo : 'Equipment Number'
    Equipment : String(18);
    to_MatlStkInAcctMod : Association to many A_MatlStkInAcctMod {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Material Master'
  entity A_MaterialStock {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    key Material : String(40) not null;
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    MaterialBaseUnit : String(3);
    to_MatlStkInAcctMod : Association to many A_MatlStkInAcctMod {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Material Stock'
  entity A_MatlStkInAcctMod {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Stock Material'
    @sap.quickinfo : 'Material in Respect of Which Stock is Managed'
    key Material : String(40) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    key Plant : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Storage Location'
    key StorageLocation : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Batch SID'
    @sap.quickinfo : 'Batch Number (Stock Identifier)'
    key Batch : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier SID'
    @sap.quickinfo : 'Supplier for Special Stock'
    key Supplier : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer SID'
    @sap.quickinfo : 'Customer for Special Stock'
    key Customer : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Valuated Sales Order Stock WBS Element'
    key WBSElementInternalID : String(24) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales order'
    @sap.quickinfo : 'Sales order number of valuated sales order stock'
    key SDDocument : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sales order item'
    @sap.quickinfo : 'Sales Order Item of Valuated Sales Order Stock'
    key SDDocumentItem : String(6) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Special Stock Type'
    key InventorySpecialStockType : String(1) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Stock Type'
    @sap.quickinfo : 'Stock Type of Goods Movement (Stock Identifier)'
    key InventoryStockType : String(2) not null;
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    MaterialBaseUnit : String(3);
    @sap.unit : 'MaterialBaseUnit'
    MatlWrhsStkQtyInMatlBaseUnit : Decimal(31, 14);
    to_MaterialSerialNumber : Association to many A_MaterialSerialNumber {  };
    to_MaterialStock : Association to A_MaterialStock {  };
  };
};

