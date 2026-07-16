// namespace inventoryshortage;

// using { cuid, managed } from '@sap/cds/common';

// /**
//  * Configuration per material/plant: the minimum stock threshold and reorder
//  * quantity used by the shortage-detection logic (see runShortageCheck /
//  * getWeeklyShortages / getMaterialShortage).
//  */
// entity ShortageConfig : cuid, managed {
//   material    : String(40);
//   plant       : String(4);
//   minStockQty : Decimal(13,3) default 0;
//   reorderQty  : Decimal(13,3) default 0;
//   isActive    : Boolean default true;
// }

// /**
//  * Point-in-time snapshot of warehouse stock. Intended to be populated by a
//  * scheduled job so getWeeklyShortages can look at a trend over `windowDays`
//  * rather than only the current instant. Not yet populated by any handler in
//  * this codebase — wire up a job/action to insert rows here on a schedule.
//  */
// entity MaterialStockSnapshot : cuid {
//   material        : String(40);
//   plant           : String(4);
//   storageLocation : String(4);
//   stockQty        : Decimal(13,3);
//   unit            : String(3);
//   snapshotAt      : DateTime;
// }

// /**
//  * Persisted shortage alerts raised by runShortageCheck / getWeeklyShortages.
//  * Can be acknowledged once handled (see the bound `acknowledge` action and
//  * the `acknowledgeByMaterial` service action).
//  */
// entity ShortageAlerts : cuid, managed {
//   material        : String(40);
//   plant           : String(4);
//   storageLocation : String(4);
//   availableQty    : Decimal(13,3);
//   requiredQty     : Decimal(13,3);
//   shortfallQty    : Decimal(13,3);
//   severity        : String(10) enum { low; medium; high; critical; };
//   status          : String(10) default 'OPEN'; // OPEN | ACKNOWLEDGED
//   acknowledgedAt  : DateTime;
//   acknowledgedBy  : String(100);
//   message         : String(255);
// }

// /**
//  * Non-persisted analysis result combining stock, open reservations, open
//  * sales demand and incoming deliveries for one material/plant. Returned by
//  * the read functions — ShortageAlerts is the persisted record, this is the
//  * live computed view.
//  */
// type ShortageAnalysis {
//   material            : String(40);
//   plant               : String(4);
//   availableStock      : Decimal(13,3);
//   reservedQty         : Decimal(13,3);
//   openSalesDemand     : Decimal(13,3);
//   incomingDeliveryQty : Decimal(13,3);
//   netAvailable        : Decimal(13,3);
//   minStockQty         : Decimal(13,3);
//   isShortage          : Boolean;
//   severity            : String(10);
//   recommendedAction   : String(255);
// }