using ZAPI_MATERIAL_STOCK_SRV1 from './external/ZAPI_MATERIAL_STOCK_SRV1.cds';

service ZAPI_MATERIAL_STOCK_SRV1SampleService {
    @readonly
    entity A_MatlStkInAcctMod as projection on ZAPI_MATERIAL_STOCK_SRV1.A_MatlStkInAcctMod
    {        key Material, key Plant, key StorageLocation, key Batch, key Supplier, key Customer, key WBSElementInternalID, key SDDocument, key SDDocumentItem, key InventorySpecialStockType, key InventoryStockType, MaterialBaseUnit, MatlWrhsStkQtyInMatlBaseUnit     }    
;
}