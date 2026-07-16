using ZAPI_RESERVATION_DOCUMENT_SRV1 from './external/ZAPI_RESERVATION_DOCUMENT_SRV1.cds';

service ZAPI_RESERVATION_DOCUMENT_SRV1SampleService {
    @readonly
    entity A_ReservationDocumentItem as projection on ZAPI_RESERVATION_DOCUMENT_SRV1.A_ReservationDocumentItem
    {        key Reservation, key ReservationItem, key RecordType, Product, RequirementType, MatlCompRequirementDate, Plant, ManufacturingOrderOperation, GoodsMovementIsAllowed, StorageLocation, Batch, DebitCreditCode, BaseUnit, GLAccount, ResvnAccountIsEnteredManually, GoodsMovementType, EntryUnit, QuantityIsFixed, CompanyCodeCurrency, IssuingOrReceivingPlant, IssuingOrReceivingStorageLoc, PurchasingDocument, PurchasingDocumentItem, Supplier, ResvnItmRequiredQtyInBaseUnit, ReservationItemIsFinallyIssued, ReservationItmIsMarkedForDeltn, ResvnItmRequiredQtyInEntryUnit, ResvnItmWithdrawnQtyInBaseUnit, ResvnItmWithdrawnAmtInCCCrcy, GoodsRecipientName, UnloadingPointName, ReservationItemText     }    
;
}