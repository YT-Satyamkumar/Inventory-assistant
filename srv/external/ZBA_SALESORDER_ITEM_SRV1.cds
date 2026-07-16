/* checksum : 45f0b4062fc7b9ab2550a794b1fac94d */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZBA_SALESORDER_ITEM_SRV1 {
  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity Salesorder_itemSet {
    @sap.unicode : 'false'
    @sap.label : 'ProductID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key ProductID : String not null;
    @sap.unicode : 'false'
    @sap.label : 'Year'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Year : String(4) not null;
    @sap.unicode : 'false'
    @sap.label : 'Month'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Month : String(2) not null;
    @sap.unicode : 'false'
    @sap.label : 'Plant'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Plant : String(4) not null;
    @sap.unicode : 'false'
    @sap.label : 'Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ProdDesc : String(40) not null;
    @sap.unicode : 'false'
    @sap.label : 'Quantity'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Total_Qnty : Integer not null;
    @sap.unicode : 'false'
    @sap.label : 'purchasedQ'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Purchased_Qnty : Decimal(13, 3) not null;
    @sap.unicode : 'false'
    @sap.label : 'Weight'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Weight : String(3) not null;
    @sap.unicode : 'false'
    @sap.label : 'PurchaseUoM'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurchaseUoM : String(3) not null;
    @sap.unicode : 'false'
    @sap.label : 'BillingDoc'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    BillingDoc : String(10) not null;
  };
};

