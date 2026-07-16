using ZBA_SALESORDER_ITEM_SRV1 from './external/ZBA_SALESORDER_ITEM_SRV1.cds';

service ZBA_SALESORDER_ITEM_SRV1SampleService {
    @readonly
    entity Salesorder_itemSet as projection on ZBA_SALESORDER_ITEM_SRV1.Salesorder_itemSet
    {        Year, Month, Plant, key ProductID, ProdDesc, Total_Qnty, Purchased_Qnty, Weight, PurchaseUoM, BillingDoc     }    
;
}