// ==================================================================
// External Service Imports - Using ZAPI prefixed services
// ==================================================================

using { ZAPI_MATERIAL_STOCK_SRV1       as MaterialStockAPI }       from './external/ZAPI_MATERIAL_STOCK_SRV1';
using { ZAPI_RESERVATION_DOCUMENT_SRV1 as ReservationDocumentAPI } from './external/ZAPI_RESERVATION_DOCUMENT_SRV1';
using { ZAPI_SALES_ORDER_SRV1          as SalesOrderAPI }          from './external/ZAPI_SALES_ORDER_SRV1';
using { ZAPI_OUTBOUND_DELIVERY_SRV1    as OutboundDeliveryAPI }    from './external/ZAPI_OUTBOUND_DELIVERY_SRV1';
using { ZBA_SALESORDER_ITEM_SRV1       as SalesOrderAnalyticsAPI } from './external/ZBA_SALESORDER_ITEM_SRV1';

/**
 * Inventory Shortage Assistant Service
 * Designed specifically for SAP Joule integration to identify material shortages
 * across reservations, sales orders, and MRP data.
 */
@path: '/inventory-shortage-assistant'
service InventoryShortageAssistantService {

  // ==================================================================
  // External Entity Projections (Read-only)
  // ==================================================================

  @readonly entity MaterialStocks as projection on MaterialStockAPI.A_MatlStkInAcctMod {
    key Material,
    key Plant,
    key StorageLocation,
    key Batch,
    key Supplier,
    key Customer,
    key WBSElementInternalID,
    key SDDocument,
    key SDDocumentItem,
    key InventorySpecialStockType,
    InventoryStockType,
    MaterialBaseUnit,
    MatlWrhsStkQtyInMatlBaseUnit
  };

  @readonly entity Reservations as projection on ReservationDocumentAPI.A_ReservationDocumentItem {
    key Reservation,
    key ReservationItem,
    key RecordType,
    Product,
    Plant,
    StorageLocation,
    Batch,
    MatlCompRequirementDate,
    BaseUnit,
    DebitCreditCode,
    GoodsMovementType,
    ResvnItmRequiredQtyInBaseUnit,
    ResvnItmWithdrawnQtyInBaseUnit,
    ReservationItemIsFinallyIssued,
    ReservationItmIsMarkedForDeltn
  };

  @readonly entity SalesOrderItems as projection on SalesOrderAPI.A_SalesOrderItem {
    key SalesOrder,
    key SalesOrderItem,
    Material,
    ProductionPlant,
    ConfdDelivQtyInOrderQtyUnit,
    RequestedQuantityUnit,
    DeliveryStatus
  };

  @readonly entity OutboundDeliveries as projection on OutboundDeliveryAPI.A_OutbDeliveryItem {
    key DeliveryDocument,
    key DeliveryDocumentItem,
    Material,
    Plant,
    ActualDeliveredQtyInBaseUnit,
    ActualDeliveryQuantity,
    DeliveryQuantityUnit,
    GoodsMovementStatus
  };

  @readonly entity SalesOrderAnalytics as projection on SalesOrderAnalyticsAPI.Salesorder_itemSet {
    key ProductID,
    Year,
    Month,
    Plant,
    BillingDoc,
    ProdDesc,
    Total_Qnty,
    Purchased_Qnty,
    Weight,
    PurchaseUoM
  };

  // ==================================================================
  // Custom Types for Business Responses
  // ==================================================================

  type MaterialShortageResponse {
    id                    : String(40);
    material              : String(40);
    materialDescription   : String(100);
    plant                 : String(4);
    storageLocation       : String(4);
    baseUnit              : String(3);
    currentStock          : Decimal(15,3);
    reservationDemand     : Decimal(15,3);
    salesOrderDemand      : Decimal(15,3);
    mrpDemand             : Decimal(15,3);
    totalDemand           : Decimal(15,3);
    availableStock        : Decimal(15,3);
    shortageQuantity      : Decimal(15,3);
    shortagePercentage    : Decimal(5,2);
    severity              : String(20);
    riskLevel             : String(20);
    recommendedAction     : String(255);
    analysisTimestamp     : Timestamp;
  }

  type InventorySummary {
    material            : String(40);
    plant               : String(4);
    currentStock        : Decimal(15,3);
    reservedStock       : Decimal(15,3);
    salesOrderDemand    : Decimal(15,3);
    mrpDemand           : Decimal(15,3);
    availableStock      : Decimal(15,3);
    shortage            : Decimal(15,3);
    unit                : String(3);
  }

  type DemandBreakdown {
    reservationDemand : Decimal(15,3);
    salesOrderDemand  : Decimal(15,3);
    mrpDemand         : Decimal(15,3);
    totalDemand       : Decimal(15,3);
  }

  type ProcurementRecommendation {
    material : String(40);
    action : String(100);
    priority : String(20);
    shortage : Decimal(15,3);
    reason : String(255);
  }

  type WeeklyRunoutResponse {
    material : String(40);
    currentStock : Decimal(15,3);
    totalDemand : Decimal(15,3);
    availableStock : Decimal(15,3);
    shortage : Decimal(15,3);
    recommendation : String(255);
  }

  type MaterialRunningOutResponse {
    id                  : String(40);
    material            : String(40);
    current             : Decimal(15,3);
    required            : Decimal(15,3);
    shortage            : Decimal(15,3);
    baseUnit            : String(3);
    severity            : String(20);
    recommendedAction   : String(255);
  }

  type WeeklyShortageSummary {
    weekStart           : String(10);
    weekEnd             : String(10);
    weekNumber          : String(10);
    totalMaterialsAtRisk: Integer;
    materials           : array of MaterialShortageResponse;
    summary             : String(500);
  }

  type RunningOutResponse {
    period              : String(20);
    dateRange           : String(50);
    totalMaterialsAtRisk: Integer;
    materials           : array of MaterialRunningOutResponse;
    summary             : String(500);
  }

  type DetailedShortageAnalysis {
    id                  : String(40);
    material            : String(40);
    materialDescription : String(100);
    plant               : String(4);
    baseUnit            : String(3);
    currentStock        : Decimal(15,3);
    stockByLocation     : array of StockLocationDetail;
    reservationDemand   : Decimal(15,3);
    salesOrderDemand    : Decimal(15,3);
    mrpDemand           : Decimal(15,3);
    totalDemand         : Decimal(15,3);
    netPosition         : Decimal(15,3);
    shortageQuantity    : Decimal(15,3);
    shortagePercentage  : Decimal(5,2);
    severity            : String(20);
    riskLevel           : String(20);
    recommendedAction   : String(255);
    analysisTimestamp   : Timestamp;
    week                : String(10);
  }

  type StockLocationDetail {
    storageLocation : String(4);
    quantity        : Decimal(15,3);
  }

  type WeeklyShortageReport {
    weekStart          : String(10);
    weekEnd            : String(10);
    weekNumber         : String(10);
    totalMaterials     : Integer;
    materialsAtRisk    : Integer;
    materials          : array of MaterialShortageResponse;
  }

  type MonthlyShortageReport {
    month              : String(7);
    monthStart         : String(10);
    monthEnd           : String(10);
    totalMaterials     : Integer;
    materialsAtRisk    : Integer;
    materials          : array of MaterialShortageResponse;
  }

  type YearlyShortageReport {
    year               : String(4);
    yearStart          : String(10);
    yearEnd            : String(10);
    totalMaterials     : Integer;
    materialsAtRisk    : Integer;
    materials          : array of MaterialShortageResponse;
  }

  type ActionResponse {
    success : Boolean;
    message : String(500);
    data    : LargeString;
  }

  type ShortageJouleResponse {
    material : String(40);
    current  : Decimal(15,3);
    required : Decimal(15,3);
    shortage : Decimal(15,3);
  }

  type PlantMaterialResponse {
    material : String(40);
    plant : String(4);
    storageLocation : String(4);
    quantity : Decimal(15,3);
    baseUnit : String(3);
  }

  // ==================================================================
  // Functions
  // ==================================================================

  function getInventorySummary(material : String, plant : String) returns InventorySummary;
  function getDemandBreakdown(material : String, plant : String) returns DemandBreakdown;
  function getProcurementRecommendation(material : String, plant : String) returns ProcurementRecommendation;
  function getWeeklyRunoutMaterials() returns array of WeeklyRunoutResponse;
  function getMaterialsRunningOut(plant : String, period : String) returns RunningOutResponse;
  function getWeeklyShortagesReport(plant : String, week : Date) returns WeeklyShortageReport;
  function getMonthlyShortagesReport(plant : String, month : Date) returns MonthlyShortageReport;
  function getYearlyShortagesReport(plant : String, year : Date) returns YearlyShortageReport;
  function getThisWeekShortages() returns array of {
    material       : String(40);
    current        : Decimal(15,3);
    required       : Decimal(15,3);
    shortage       : Decimal(15,3);
    recommendation : String(255);
  };
  function getMaterialsRunningOutThisWeek(plant : String, week : Date) returns WeeklyShortageSummary;
  function getMaterialShortageDetail(material : String, plant : String) returns DetailedShortageAnalysis;
  function getMaterialsAtRisk(severity : String) returns array of MaterialShortageResponse;
  function getShortageStatus(material : String, plant : String) returns MaterialShortageResponse;
  function getRecommendedActions(plant : String) returns array of {
    id                  : String(40);
    material            : String(40);
    materialDescription : String(100);
    recommendedAction   : String(255);
    priority            : String(20);
    urgency             : String(20);
  };
  function getWeeklyShortageTrend(material : String, plant : String, weeks : Integer) returns array of {
    material            : String(40);
    materialDescription : String(100);
    baseUnit            : String(3);
    week                : String(10);
    weekDate            : String(10);
    currentStock        : Decimal(15,3);
    requiredQty         : Decimal(15,3);
    shortageQty         : Decimal(15,3);
    projectedStock      : Decimal(15,3);
  };
  function getStockLevel(material : String, plant : String, storageLocation : String, batch : String) returns {
    id              : String(40);
    material        : String(40);
    plant           : String(4);
    totalStock      : Decimal(13,3);
    unit            : String(3);
    stockByLocation : array of StockLocationDetail;
  };
  function getOpenReservations(material : String, plant : String) returns array of Reservations;
  function getSalesOrderDemand(material : String, plant : String) returns {
    id             : String(40);
    material       : String(40);
    plant          : String(4);
    totalDemand    : Decimal(15,3);
    demandByStatus : array of {
      deliveryStatus : String(2);
      quantity       : Decimal(15,3);
    };
  };
  function getMRPDemand(material : String, plant : String, week : Date) returns {
    id            : String(40);
    material      : String(40);
    plant         : String(4);
    week          : String(10);
    weekDate      : String(10);
    mrpDemand     : Decimal(15,3);
    plannedOrders : Decimal(15,3);
    purchaseRequis: Decimal(15,3);
  };
  function askInventoryShortageAssistant(question : String, material : String, plant : String) returns {
    data   : LargeString;
    intent : String(50);
  };
  function predictShortages(plant : String, weeksAhead : Integer) returns array of {
    material           : String(40);
    materialDescription: String(100);
    currentStock       : Decimal(15,3);
    predictedDemand    : Decimal(15,3);
    predictedShortage  : Decimal(15,3);
    week               : String(10);
    weekDate           : String(10);
    confidence         : Decimal(5,2);
  };

  // ==================================================================
  // Actions
  // ==================================================================

  action triggerProcurement(material : String, plant : String, quantity : Decimal, requiredBy : Date, priority : String) returns ActionResponse;
  action createPurchaseRequisition(material : String, plant : String, quantity : Decimal, deliveryDate : Date, purchasingGroup : String) returns ActionResponse;
  action requestProductionRescheduling(material : String, plant : String, newDate : Date, reason : String) returns ActionResponse;
  action suggestAlternateSourcing(material : String, plant : String, quantity : Decimal) returns {
    success      : Boolean;
    message      : String(500);
    alternatives : array of {
      material       : String(40);
      availableStock : Decimal(15,3);
      leadTime       : Integer;
      price          : Decimal(13,2);
    };
  };
}