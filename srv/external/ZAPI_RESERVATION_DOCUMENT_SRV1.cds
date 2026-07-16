/* checksum : 118550128ec6f9d3f09a9343fcc8a973 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZAPI_RESERVATION_DOCUMENT_SRV1 {
  @cds.external : true
  @cds.persistence.skip : true
  @sap.updatable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Document Header'
  entity A_ReservationDocumentHeader {
    @sap.display.format : 'NonNegative'
    @sap.label : 'Reservation'
    @sap.quickinfo : 'Number of reservation/dependent requirements'
    key Reservation : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Order'
    @sap.quickinfo : 'Order Number'
    OrderID : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Movement Type'
    @sap.quickinfo : 'Movement Type (Inventory Management)'
    GoodsMovementType : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Cost Center'
    CostCenter : String(10);
    @sap.label : 'Goods Recipient'
    GoodsRecipientName : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Base date'
    @sap.quickinfo : 'Base date for reservation'
    ReservationDate : Date;
    @sap.label : 'Check against cal.'
    @sap.quickinfo : 'Check date against factory calendar'
    IsCheckedAgainstFactoryCal : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer'
    @sap.quickinfo : 'Account number of customer'
    Customer : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element)'
    WBSElement : String(24);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    ControllingArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Order'
    @sap.quickinfo : 'Sales Order Number'
    SalesOrder : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sales Order Item'
    @sap.quickinfo : 'Item Number in Sales Order'
    SalesOrderItem : String(6);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sales order schedule'
    @sap.quickinfo : 'Delivery schedule for sales order'
    SalesOrderScheduleLine : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Asset'
    @sap.quickinfo : 'Main Asset Number'
    AssetNumber : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sub-number'
    @sap.quickinfo : 'Asset Subnumber'
    AssetSubNumber : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Network'
    @sap.quickinfo : 'Network Number for Account Assignment'
    NetworkNumberForAcctAssgmt : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Receiving plant'
    @sap.quickinfo : 'Receiving plant/issuing plant'
    IssuingOrReceivingPlant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Receiving stor. loc.'
    @sap.quickinfo : 'Receiving/issuing storage location'
    IssuingOrReceivingStorageLoc : String(4);
    to_ReservationDocumentItem : Composition of many A_ReservationDocumentItem {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Document Items'
  entity A_ReservationDocumentItem {
    @sap.display.format : 'NonNegative'
    @sap.label : 'Reservation'
    @sap.quickinfo : 'Number of reservation/dependent requirements'
    key Reservation : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item no.'
    @sap.quickinfo : 'Item Number of Reservation / Dependent Requirements'
    key ReservationItem : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Record type'
    key RecordType : String(1) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    Product : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Requirement type'
    RequirementType : String(2);
    @sap.display.format : 'Date'
    @sap.label : 'Requirements date'
    @sap.quickinfo : 'Requirements date for the component'
    MatlCompRequirementDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Activity'
    @sap.quickinfo : 'Activity Number'
    ManufacturingOrderOperation : String(4);
    @sap.label : 'Movement Allowed'
    @sap.quickinfo : 'Goods Movement for Reservation Allowed'
    GoodsMovementIsAllowed : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Storage Location'
    StorageLocation : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Batch'
    @sap.quickinfo : 'Batch Number'
    Batch : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Debit/Credit Ind.'
    @sap.quickinfo : 'Debit/Credit Indicator'
    DebitCreditCode : String(1);
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'G/L Account'
    @sap.quickinfo : 'G/L Account Number'
    GLAccount : String(10);
    @sap.label : 'Acct manually'
    @sap.quickinfo : 'Acct entered manually'
    ResvnAccountIsEnteredManually : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Movement Type'
    @sap.quickinfo : 'Movement Type (Inventory Management)'
    GoodsMovementType : String(3);
    @sap.label : 'Unit of Entry'
    @sap.quickinfo : 'Unit of entry'
    @sap.semantics : 'unit-of-measure'
    EntryUnit : String(3);
    @sap.label : 'Quantity is fixed'
    QuantityIsFixed : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    CompanyCodeCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Receiving plant'
    @sap.quickinfo : 'Receiving plant/issuing plant'
    IssuingOrReceivingPlant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Receiving stor. loc.'
    @sap.quickinfo : 'Receiving/issuing storage location'
    IssuingOrReceivingStorageLoc : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Document'
    @sap.quickinfo : 'Purchasing Document Number'
    PurchasingDocument : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item'
    @sap.quickinfo : 'Item Number of Purchasing Document'
    PurchasingDocumentItem : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    Supplier : String(10);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Requirement Quantity'
    ResvnItmRequiredQtyInBaseUnit : Decimal(13, 3);
    @sap.label : 'Final Issue'
    @sap.quickinfo : 'Final Issue for Reservation'
    ReservationItemIsFinallyIssued : Boolean;
    @sap.label : 'Item Deleted'
    @sap.quickinfo : 'Item is Deleted'
    ReservationItmIsMarkedForDeltn : Boolean;
    @sap.unit : 'EntryUnit'
    @sap.label : 'Qty in unit of entry'
    @sap.quickinfo : 'Quantity in unit of entry'
    ResvnItmRequiredQtyInEntryUnit : Decimal(13, 3);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Quantity withdrawn'
    ResvnItmWithdrawnQtyInBaseUnit : Decimal(13, 3);
    @sap.unit : 'CompanyCodeCurrency'
    @sap.label : 'Value Withdrawn'
    ResvnItmWithdrawnAmtInCCCrcy : Decimal(14, 3);
    @sap.label : 'Goods Recipient'
    GoodsRecipientName : String(12);
    @sap.label : 'Unloading Point'
    UnloadingPointName : String(25);
    @sap.label : 'Text'
    @sap.quickinfo : 'Item Text'
    ReservationItemText : String(50);
  };
};

