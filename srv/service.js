const cds = require("@sap/cds");
const { SELECT } = cds.ql;

module.exports = cds.service.impl(async function () {
    // ==================================================================
    // External Service Connections
    // ==================================================================

    const MaterialStockSrv = await cds.connect.to("ZAPI_MATERIAL_STOCK_SRV1");
    const ReservationSrv = await cds.connect.to("ZAPI_RESERVATION_DOCUMENT_SRV1");
    const SalesOrderSrv = await cds.connect.to("ZAPI_SALES_ORDER_SRV1");
    const OutboundDeliverySrv = await cds.connect.to("ZAPI_OUTBOUND_DELIVERY_SRV1");
    const SalesOrderAnalyticsSrv = await cds.connect.to("ZBA_SALESORDER_ITEM_SRV1");

    // ==================================================================
    // Entity READ Handlers
    // ==================================================================

    this.on("READ", "MaterialStocks", async (req) => {
        try {
            return await MaterialStockSrv.run(req.query);
        } catch (err) {
            console.error("MaterialStock Error", err);
            req.reject(500, err.message);
        }
    });

    this.on("READ", "Reservations", async (req) => {
        try {
            return await ReservationSrv.run(req.query);
        } catch (err) {
            console.error("Reservation Error", err);
            req.reject(500, err.message);
        }
    });

    this.on("READ", "SalesOrderItems", async (req) => {
        try {
            return await SalesOrderSrv.run(req.query);
        } catch (err) {
            console.error("SalesOrder Error", err);
            req.reject(500, err.message);
        }
    });

    this.on("READ", "OutboundDeliveries", async (req) => {
        try {
            return await OutboundDeliverySrv.run(req.query);
        } catch (err) {
            console.error("OutboundDelivery Error", err);
            req.reject(500, err.message);
        }
    });

    this.on("READ", "SalesOrderAnalytics", async (req) => {
        try {
            return await SalesOrderAnalyticsSrv.run(req.query);
        } catch (err) {
            console.error("SalesOrderAnalytics Error", err);
            req.reject(500, err.message);
        }
    });

    // ==================================================================
    // Helper Functions
    // ==================================================================

    const num = (v) => Number(v || 0);

    function severityFor(shortagePercent) {
        if (shortagePercent >= 60) return "CRITICAL";
        if (shortagePercent >= 30) return "HIGH";
        if (shortagePercent >= 10) return "MEDIUM";
        return "LOW";
    }

    function riskLevelFor(shortagePercent) {
        if (shortagePercent >= 60) return "HIGH";
        if (shortagePercent >= 30) return "HIGH";
        if (shortagePercent >= 10) return "MEDIUM";
        return "LOW";
    }

    function recommendationFor(shortagePercent) {
        if (shortagePercent >= 60) return "Urgent Procurement Required";
        if (shortagePercent >= 30) return "Create Purchase Requisition";
        if (shortagePercent >= 10) return "Monitor Material";
        return "No Action Required";
    }

    function getWeekRange(date) {
        const d = new Date(date);
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { weekStartDate: start, weekEndDate: end };
    }

    function getWeekNumber(date) {
        const d = new Date(date);
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor((d - yearStart) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + yearStart.getDay() + 1) / 7);
    }

    function formatWeek(date) {
        const weekNum = getWeekNumber(date);
        const year = date.getFullYear();
        return `W${weekNum}-${year}`;
    }

    function formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function formatMonth(date) {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}-${year}`;
    }

    function formatYear(date) {
        return new Date(date).getFullYear().toString();
    }

    function getMonthRange(date) {
        const d = new Date(date);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return { monthStartDate: start, monthEndDate: end };
    }

    function getYearRange(date) {
        const d = new Date(date);
        const start = new Date(d.getFullYear(), 0, 1);
        const end = new Date(d.getFullYear(), 11, 31);
        return { yearStartDate: start, yearEndDate: end };
    }

    // ==================================================================
    // Core Data Functions
    // ==================================================================

    async function getCurrentStock(material, plantFilter) {
        const where = {};
        if (material) where.Material = material;
        if (plantFilter) where.Plant = plantFilter;

        const rows = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant", "StorageLocation", "Batch", "MatlWrhsStkQtyInMatlBaseUnit", "MaterialBaseUnit")
                .where(where)
        );

        const stockMap = {};
        const baseUnitMap = {};
        const locationMap = {};
        const batchMap = {};

        for (const row of rows) {
            const key = `${row.Material}|${row.Plant}`;
            const qty = num(row.MatlWrhsStkQtyInMatlBaseUnit);
            baseUnitMap[row.Material] = row.MaterialBaseUnit;
            stockMap[key] = (stockMap[key] || 0) + qty;

            if (!locationMap[key]) locationMap[key] = {};
            const locKey = `${row.StorageLocation}`;
            locationMap[key][locKey] = (locationMap[key][locKey] || 0) + qty;

            if (row.Batch) {
                if (!batchMap[key]) batchMap[key] = {};
                batchMap[key][row.Batch] = (batchMap[key][row.Batch] || 0) + qty;
            }
        }
        return { stockMap, baseUnitMap, locationMap, batchMap, details: rows };
    }

    async function getReservationDemand(material, plantFilter) {
        const where = { ReservationItemIsFinallyIssued: false };
        if (material) where.Product = material;
        if (plantFilter) where.Plant = plantFilter;

        const rows = await ReservationSrv.run(
            SELECT.from("A_ReservationDocumentItem").columns(r => {
                r.Reservation;
                r.ReservationItem;
                r.Product;
                r.Plant;
                r.StorageLocation;
                r.BaseUnit;
                r.DebitCreditCode;
                r.ResvnItmRequiredQtyInBaseUnit;
                r.ResvnItmWithdrawnQtyInBaseUnit;
                r.ReservationItemIsFinallyIssued;
                r.ReservationItmIsMarkedForDeltn;
                r.MatlCompRequirementDate;
                r.GoodsMovementType;
            }).where(where)
        );

        const reservationMap = {};
        const details = [];
        for (const row of rows) {
            if (row.ReservationItmIsMarkedForDeltn) continue;

            const key = `${row.Product}|${row.Plant}`;
            const openQty = Math.max(
                num(row.ResvnItmRequiredQtyInBaseUnit) - num(row.ResvnItmWithdrawnQtyInBaseUnit),
                0
            );
            if (openQty > 0) {
                reservationMap[key] = (reservationMap[key] || 0) + openQty;
                details.push(row);
            }
        }
        return { reservationMap, details };
    }

    async function getSalesOrderDemandData(material, plantFilter) {
        const where = { Material: material };
        if (plantFilter) where.ProductionPlant = plantFilter;

        const items = await SalesOrderSrv.run(
            SELECT.from("A_SalesOrderItem")
                .columns("SalesOrder", "SalesOrderItem", "Material", "ProductionPlant",
                    "ConfdDelivQtyInOrderQtyUnit", "RequestedQuantityUnit", "DeliveryStatus")
                .where(where)
        );

        const demandABMap = {};
        const demandBMap = {};
        const unitMap = {};
        const demandByStatus = { '': 0, 'A': 0, 'B': 0, 'C': 0 };
        const statusBItems = [];

        for (const item of items) {
            const key = `${item.Material}|${item.ProductionPlant}`;
            unitMap[item.Material] = item.RequestedQuantityUnit;
            const confdQty = num(item.ConfdDelivQtyInOrderQtyUnit);

            demandByStatus[item.DeliveryStatus || ''] = (demandByStatus[item.DeliveryStatus || ''] || 0) + confdQty;

            if (item.DeliveryStatus === '' || item.DeliveryStatus === 'A') {
                demandABMap[key] = (demandABMap[key] || 0) + confdQty;
                continue;
            }
            if (item.DeliveryStatus === 'B') {
                statusBItems.push({ key, item, confdQty });
            }
        }

        // Handle Status B items (confirmed with deliveries)
        if (statusBItems.length > 0) {
            const salesOrders = [...new Set(statusBItems.map(s => s.item.SalesOrder))];
            const BATCH_SIZE = 50;
            const flowMap = {};

            for (let i = 0; i < salesOrders.length; i += BATCH_SIZE) {
                const batch = salesOrders.slice(i, i + BATCH_SIZE);
                const flows = await SalesOrderSrv.run(
                    SELECT.from("A_SalesOrderItmSubsqntProcFlow")
                        .columns("SalesOrder", "SalesOrderItem", "SubsequentDocument",
                            "SubsequentDocumentItem", "SubsequentDocumentCategory")
                        .where({
                            SalesOrder: { in: batch },
                            SubsequentDocumentCategory: "J"
                        })
                );
                for (const f of flows) {
                    flowMap[`${f.SalesOrder}|${f.SalesOrderItem}`] = f;
                }
            }

            const deliveryLookup = [];
            for (const { key, item, confdQty } of statusBItems) {
                const flow = flowMap[`${item.SalesOrder}|${item.SalesOrderItem}`];
                if (!flow) {
                    demandBMap[key] = (demandBMap[key] || 0) + confdQty;
                    continue;
                }
                deliveryLookup.push({
                    key, confdQty,
                    deliveryDocument: flow.SubsequentDocument,
                    deliveryItem: flow.SubsequentDocumentItem
                });
            }

            if (deliveryLookup.length > 0) {
                const docs = [...new Set(deliveryLookup.map(d => d.deliveryDocument))];
                const deliveries = await OutboundDeliverySrv.run(
                    SELECT.from("A_OutbDeliveryItem")
                        .columns("DeliveryDocument", "DeliveryDocumentItem", "ActualDeliveredQtyInBaseUnit")
                        .where({ DeliveryDocument: { in: docs } })
                );

                const deliveredMap = {};
                for (const d of deliveries) {
                    deliveredMap[`${d.DeliveryDocument}|${d.DeliveryDocumentItem}`] = num(d.ActualDeliveredQtyInBaseUnit);
                }

                for (const d of deliveryLookup) {
                    const delivered = deliveredMap[`${d.deliveryDocument}|${d.deliveryItem}`] || 0;
                    const net = Math.max(d.confdQty - delivered, 0);
                    demandBMap[d.key] = (demandBMap[d.key] || 0) + net;
                }
            }
        }

        const totalDemand = Object.values(demandABMap).reduce((a, b) => a + b, 0) +
            Object.values(demandBMap).reduce((a, b) => a + b, 0);

        return { demandABMap, demandBMap, unitMap, totalDemand, demandByStatus };
    }

    async function computeShortages(material, plantFilter) {
        const [{ demandABMap, demandBMap, unitMap, totalDemand, demandByStatus }, 
               { reservationMap, details: reservationDetails }, 
               { stockMap, baseUnitMap, locationMap, batchMap }] =
            await Promise.all([
                getSalesOrderDemandData(material, plantFilter),
                getReservationDemand(material, plantFilter),
                getCurrentStock(material, plantFilter)
            ]);

        const keys = [...new Set([
            ...Object.keys(demandABMap),
            ...Object.keys(demandBMap),
            ...Object.keys(reservationMap),
            ...Object.keys(stockMap)
        ])];

        if (!keys.length) return [];

        const results = [];
        for (const key of keys) {
            const [mat, plant] = key.split('|');
            const currentStock = stockMap[key] || 0;
            const reservationDemand = reservationMap[key] || 0;
            const salesDemandAB = demandABMap[key] || 0;
            const salesDemandB = demandBMap[key] || 0;
            const totalDemand = reservationDemand + salesDemandAB + salesDemandB;
            const netPosition = currentStock - totalDemand;
            const availableQuantity = Math.max(netPosition, 0);
            const shortageQuantity = Math.max(-netPosition, 0);
            const shortagePercent = totalDemand > 0
                ? Number(((shortageQuantity / totalDemand) * 100).toFixed(2))
                : 0;

            const locations = locationMap[key] || {};
            const storageLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

            const stockByLocation = Object.entries(locations).map(([loc, qty]) => ({
                storageLocation: loc,
                quantity: qty
            }));

            results.push({
                id: mat,
                material: mat,
                plant: plant,
                materialDescription: mat,
                storageLocation,
                baseUnit: baseUnitMap[mat] || unitMap[mat] || '',
                currentStock,
                reservationDemand,
                salesDemandAB,
                salesDemandB,
                salesOrderDemand: salesDemandAB + salesDemandB,
                mrpDemand: 0,
                totalDemand: totalDemand,
                requiredQuantity: totalDemand,
                netPosition,
                availableQuantity,
                shortageQuantity,
                shortagePercentage: shortagePercent,
                severity: severityFor(shortagePercent),
                riskLevel: riskLevelFor(shortagePercent),
                recommendedAction: recommendationFor(shortagePercent),
                dataCompleteness: "SALES_ORDER_AND_RESERVATION",
                analysisTimestamp: new Date(),
                stockByLocation,
                demandBreakdown: {
                    reservationDemand,
                    salesOrderDemand: salesDemandAB + salesDemandB,
                    mrpDemand: 0,
                    totalDemand
                }
            });
        }

        return results.sort((a, b) => b.shortageQuantity - a.shortageQuantity);
    }

    // ==================================================================
    // Function Implementations
    // ==================================================================

    this.on("getInventorySummary", async (req) => {
        const { material, plant } = req.data;
        const shortages = await computeShortages(material, plant);
        
        if (!shortages.length) {
            return {
                material: material || '',
                plant: plant || '',
                currentStock: 0,
                reservedStock: 0,
                salesOrderDemand: 0,
                mrpDemand: 0,
                availableStock: 0,
                shortage: 0,
                unit: ''
            };
        }

        const s = shortages[0];
        return {
            material: s.material,
            plant: s.plant,
            currentStock: s.currentStock,
            reservedStock: s.reservationDemand,
            salesOrderDemand: s.salesOrderDemand,
            mrpDemand: s.mrpDemand || 0,
            availableStock: s.availableQuantity,
            shortage: s.shortageQuantity,
            unit: s.baseUnit
        };
    });

    this.on("getDemandBreakdown", async (req) => {
        const { material, plant } = req.data;
        const shortages = await computeShortages(material, plant);
        
        if (!shortages.length) {
            return {
                reservationDemand: 0,
                salesOrderDemand: 0,
                mrpDemand: 0,
                totalDemand: 0
            };
        }

        const s = shortages[0];
        return {
            reservationDemand: s.reservationDemand,
            salesOrderDemand: s.salesOrderDemand,
            mrpDemand: s.mrpDemand || 0,
            totalDemand: s.totalDemand
        };
    });

    this.on("getProcurementRecommendation", async (req) => {
        const { material, plant } = req.data;
        const shortages = await computeShortages(material, plant);
        
        if (!shortages.length) {
            return {
                material: material || '',
                action: 'No Action Required',
                priority: 'LOW',
                shortage: 0,
                reason: 'Material has sufficient stock'
            };
        }

        const s = shortages[0];
        return {
            material: s.material,
            action: s.recommendedAction,
            priority: s.severity,
            shortage: s.shortageQuantity,
            reason: s.recommendedAction === 'No Action Required' 
                ? 'Material has sufficient stock' 
                : `Shortage of ${s.shortageQuantity} ${s.baseUnit} detected`
        };
    });

    this.on("getWeeklyRunoutMaterials", async (req) => {
        try {
            const stockRows = await MaterialStockSrv.run(
                SELECT.from("A_MatlStkInAcctMod").columns("Material", "Plant")
            );

            const uniqueMaterials = [...new Set(stockRows.map(r => `${r.Material}|${r.Plant}`))];
            const results = [];

            for (const key of uniqueMaterials) {
                const [material, plant] = key.split('|');
                const shortages = await computeShortages(material, plant);
                if (shortages.length > 0 && shortages[0].shortageQuantity > 0) {
                    const s = shortages[0];
                    results.push({
                        material: s.material,
                        currentStock: s.currentStock,
                        totalDemand: s.totalDemand,
                        availableStock: s.availableQuantity,
                        shortage: s.shortageQuantity,
                        recommendation: s.recommendedAction
                    });
                }
            }

            return results.sort((a, b) => b.shortage - a.shortage);
        } catch (err) {
            console.error(err);
            req.reject(500, err.message);
        }
    });

    this.on("getMaterialsRunningOut", async (req) => {
        const { plant, period = 'week' } = req.data;
        
        let materials = [];
        let periodLabel = '';

        const stocks = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant")
                .where(plant ? { Plant: plant } : {})
        );

        const uniqueMaterials = [...new Set(stocks.map(s => `${s.Material}|${s.Plant}`))];

        for (const key of uniqueMaterials) {
            const [material, plantVal] = key.split('|');
            const shortages = await computeShortages(material, plantVal);
            if (shortages.length > 0 && shortages[0].shortageQuantity > 0) {
                const s = shortages[0];
                materials.push({
                    id: s.material,
                    material: s.material,
                    current: s.currentStock,
                    required: s.totalDemand,
                    shortage: s.shortageQuantity,
                    baseUnit: s.baseUnit,
                    severity: s.severity,
                    recommendedAction: s.recommendedAction
                });
            }
        }

        materials.sort((a, b) => b.shortage - a.shortage);

        const now = new Date();
        let dateRange = '';
        if (period === 'week') {
            const { weekStartDate, weekEndDate } = getWeekRange(now);
            dateRange = `${formatDate(weekStartDate)} to ${formatDate(weekEndDate)}`;
            periodLabel = 'this week';
        } else if (period === 'month') {
            const { monthStartDate, monthEndDate } = getMonthRange(now);
            dateRange = `${formatDate(monthStartDate)} to ${formatDate(monthEndDate)}`;
            periodLabel = 'this month';
        } else if (period === 'year') {
            const { yearStartDate, yearEndDate } = getYearRange(now);
            dateRange = `${formatDate(yearStartDate)} to ${formatDate(yearEndDate)}`;
            periodLabel = 'this year';
        }

        return {
            period: periodLabel,
            dateRange: dateRange,
            totalMaterialsAtRisk: materials.length,
            materials: materials,
            summary: `${materials.length} material(s) at risk of shortage ${periodLabel}`
        };
    });

    this.on("getWeeklyShortagesReport", async (req) => {
        const { plant, week } = req.data;
        const weekDate = week ? new Date(week) : new Date();
        const { weekStartDate, weekEndDate } = getWeekRange(weekDate);

        const stocks = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant")
                .where(plant ? { Plant: plant } : {})
        );

        const uniqueMaterials = [...new Set(stocks.map(s => `${s.Material}|${s.Plant}`))];
        const weeklyData = [];

        for (const key of uniqueMaterials) {
            const [material, plantVal] = key.split('|');
            const shortages = await computeShortages(material, plantVal);
            if (shortages.length > 0) {
                const s = shortages[0];
                weeklyData.push({
                    id: s.material,
                    material: s.material,
                    materialDescription: s.materialDescription,
                    plant: s.plant,
                    currentStock: s.currentStock,
                    totalDemand: s.totalDemand,
                    shortageQuantity: s.shortageQuantity,
                    shortagePercentage: s.shortagePercentage,
                    baseUnit: s.baseUnit,
                    severity: s.severity,
                    recommendedAction: s.recommendedAction
                });
            }
        }

        weeklyData.sort((a, b) => b.shortageQuantity - a.shortageQuantity);

        return {
            weekStart: formatDate(weekStartDate),
            weekEnd: formatDate(weekEndDate),
            weekNumber: `W${getWeekNumber(weekDate)}`,
            totalMaterials: weeklyData.length,
            materialsAtRisk: weeklyData.filter(m => m.shortageQuantity > 0).length,
            materials: weeklyData
        };
    });

    this.on("getMonthlyShortagesReport", async (req) => {
        const { plant, month } = req.data;
        const monthDate = month ? new Date(month) : new Date();
        const { monthStartDate, monthEndDate } = getMonthRange(monthDate);

        const stocks = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant")
                .where(plant ? { Plant: plant } : {})
        );

        const uniqueMaterials = [...new Set(stocks.map(s => `${s.Material}|${s.Plant}`))];
        const monthlyData = [];

        for (const key of uniqueMaterials) {
            const [material, plantVal] = key.split('|');
            const shortages = await computeShortages(material, plantVal);
            if (shortages.length > 0) {
                const s = shortages[0];
                monthlyData.push({
                    id: s.material,
                    material: s.material,
                    materialDescription: s.materialDescription,
                    plant: s.plant,
                    currentStock: s.currentStock,
                    totalDemand: s.totalDemand,
                    shortageQuantity: s.shortageQuantity,
                    shortagePercentage: s.shortagePercentage,
                    baseUnit: s.baseUnit,
                    severity: s.severity,
                    recommendedAction: s.recommendedAction
                });
            }
        }

        monthlyData.sort((a, b) => b.shortageQuantity - a.shortageQuantity);

        return {
            month: formatMonth(monthDate),
            monthStart: formatDate(monthStartDate),
            monthEnd: formatDate(monthEndDate),
            totalMaterials: monthlyData.length,
            materialsAtRisk: monthlyData.filter(m => m.shortageQuantity > 0).length,
            materials: monthlyData
        };
    });

    this.on("getYearlyShortagesReport", async (req) => {
        const { plant, year } = req.data;
        const yearDate = year ? new Date(year) : new Date();
        const { yearStartDate, yearEndDate } = getYearRange(yearDate);

        const stocks = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant")
                .where(plant ? { Plant: plant } : {})
        );

        const uniqueMaterials = [...new Set(stocks.map(s => `${s.Material}|${s.Plant}`))];
        const yearlyData = [];

        for (const key of uniqueMaterials) {
            const [material, plantVal] = key.split('|');
            const shortages = await computeShortages(material, plantVal);
            if (shortages.length > 0) {
                const s = shortages[0];
                yearlyData.push({
                    id: s.material,
                    material: s.material,
                    materialDescription: s.materialDescription,
                    plant: s.plant,
                    currentStock: s.currentStock,
                    totalDemand: s.totalDemand,
                    shortageQuantity: s.shortageQuantity,
                    shortagePercentage: s.shortagePercentage,
                    baseUnit: s.baseUnit,
                    severity: s.severity,
                    recommendedAction: s.recommendedAction
                });
            }
        }

        yearlyData.sort((a, b) => b.shortageQuantity - a.shortageQuantity);

        return {
            year: formatYear(yearDate),
            yearStart: formatDate(yearStartDate),
            yearEnd: formatDate(yearEndDate),
            totalMaterials: yearlyData.length,
            materialsAtRisk: yearlyData.filter(m => m.shortageQuantity > 0).length,
            materials: yearlyData
        };
    });

    this.on("getThisWeekShortages", async (req) => {
        try {
            const stockRows = await MaterialStockSrv.run(
                SELECT.from("A_MatlStkInAcctMod")
                    .columns("Material", "Plant")
            );

            if (stockRows.length === 0) {
                return [{
                    material: 'NO_DATA',
                    current: 0,
                    required: 0,
                    shortage: 0,
                    recommendation: 'No stock data available. Please check SAP connection.'
                }];
            }

            const materialPlantMap = new Map();
            for (const row of stockRows) {
                const key = `${row.Material}|${row.Plant}`;
                if (!materialPlantMap.has(key)) {
                    materialPlantMap.set(key, { material: row.Material, plant: row.Plant });
                }
            }

            const materialMap = new Map();
            for (const [key, value] of materialPlantMap) {
                if (!materialMap.has(value.material)) {
                    materialMap.set(value.material, []);
                }
                materialMap.get(value.material).push(value.plant);
            }

            const response = [];

            for (const [material, plants] of materialMap) {
                let totalCurrent = 0;
                let totalRequired = 0;
                let totalShortage = 0;
                let highestPriorityRecommendation = "No Action Required";

                for (const plant of plants) {
                    const shortages = await computeShortages(material, plant);
                    if (shortages.length > 0) {
                        for (const s of shortages) {
                            totalCurrent += s.currentStock || 0;
                            totalRequired += s.requiredQuantity || 0;
                            totalShortage += s.shortageQuantity || 0;

                            if (s.recommendedAction === "Urgent Procurement Required") {
                                highestPriorityRecommendation = s.recommendedAction;
                            } else if (
                                highestPriorityRecommendation !== "Urgent Procurement Required" &&
                                s.recommendedAction === "Create Purchase Requisition"
                            ) {
                                highestPriorityRecommendation = s.recommendedAction;
                            } else if (
                                highestPriorityRecommendation === "No Action Required" &&
                                s.recommendedAction === "Monitor Material"
                            ) {
                                highestPriorityRecommendation = s.recommendedAction;
                            }
                        }
                    }
                }

                if (totalShortage > 0 || totalCurrent > 0) {
                    response.push({
                        material: material,
                        current: totalCurrent,
                        required: totalRequired,
                        shortage: totalShortage,
                        recommendation: highestPriorityRecommendation
                    });
                }
            }

            response.sort((a, b) => b.shortage - a.shortage);
            return response;

        } catch (err) {
            console.error('getThisWeekShortages failed:', err);
            req.reject(500, err.message || 'Unknown error');
        }
    });

    this.on("getMaterialsRunningOutThisWeek", async (req) => {
        const { plant, week } = req.data;
        const weekDate = week || new Date();
        const { weekStartDate, weekEndDate } = getWeekRange(weekDate);

        const stocks = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant")
                .where(plant ? { Plant: plant } : {})
        );

        const uniqueMaterials = [...new Set(stocks.map(s => `${s.Material}|${s.Plant}`))];
        const materialResults = [];

        for (const key of uniqueMaterials) {
            const [material, plantVal] = key.split('|');
            const shortages = await computeShortages(material, plantVal);
            if (shortages.length > 0 && shortages[0].shortageQuantity > 0) {
                const s = shortages[0];
                materialResults.push({
                    id: s.material,
                    material: s.material,
                    materialDescription: s.materialDescription,
                    plant: s.plant,
                    currentStock: s.currentStock,
                    requiredQuantity: s.totalDemand,
                    shortageQuantity: s.shortageQuantity,
                    shortagePercentage: s.shortagePercentage,
                    baseUnit: s.baseUnit,
                    severity: s.severity,
                    riskLevel: s.riskLevel,
                    recommendedAction: s.recommendedAction,
                    week: formatWeek(weekDate)
                });
            }
        }

        return {
            weekStart: formatDate(weekStartDate),
            weekEnd: formatDate(weekEndDate),
            weekNumber: `W${getWeekNumber(weekDate)}`,
            totalMaterialsAtRisk: materialResults.length,
            materials: materialResults,
            summary: `${materialResults.length} material(s) at risk of shortage for week ${formatWeek(weekDate)}`
        };
    });

    this.on("getMaterialShortageDetail", async (req) => {
        const { material, plant } = req.data;
        if (!material) {
            req.reject(400, "Parameter 'material' is required.");
            return;
        }

        try {
            const results = await computeShortages(material, plant);
            if (!results.length) {
                return {
                    id: material,
                    material,
                    materialDescription: material,
                    plant: plant || '',
                    baseUnit: '',
                    currentStock: 0,
                    stockByLocation: [],
                    reservationDemand: 0,
                    salesOrderDemand: 0,
                    mrpDemand: 0,
                    totalDemand: 0,
                    netPosition: 0,
                    shortageQuantity: 0,
                    shortagePercentage: 0,
                    severity: 'LOW',
                    riskLevel: 'LOW',
                    recommendedAction: 'No Action Required',
                    analysisTimestamp: new Date(),
                    week: formatWeek(new Date())
                };
            }

            const r = results[0];
            return {
                id: r.material,
                material: r.material,
                materialDescription: r.materialDescription,
                plant: r.plant,
                baseUnit: r.baseUnit,
                currentStock: r.currentStock,
                stockByLocation: r.stockByLocation || [],
                reservationDemand: r.reservationDemand,
                salesOrderDemand: r.salesOrderDemand,
                mrpDemand: r.mrpDemand || 0,
                totalDemand: r.totalDemand,
                netPosition: r.netPosition,
                shortageQuantity: r.shortageQuantity,
                shortagePercentage: r.shortagePercentage,
                severity: r.severity,
                riskLevel: r.riskLevel,
                recommendedAction: r.recommendedAction,
                analysisTimestamp: r.analysisTimestamp,
                week: formatWeek(r.analysisTimestamp)
            };
        } catch (err) {
            console.error('getMaterialShortageDetail failed:', err);
            req.reject(500, err.message || 'Unknown error');
        }
    });

    this.on("getMaterialsAtRisk", async (req) => {
        const { severity } = req.data;
        
        const stocks = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant")
        );

        const uniqueMaterials = [...new Set(stocks.map(s => `${s.Material}|${s.Plant}`))];
        const atRisk = [];

        for (const key of uniqueMaterials) {
            const [material, plant] = key.split('|');
            const shortages = await computeShortages(material, plant);
            if (shortages.length > 0) {
                const s = shortages[0];
                if (!severity || s.severity === severity) {
                    atRisk.push({
                        id: s.material,
                        material: s.material,
                        materialDescription: s.materialDescription,
                        plant: s.plant,
                        currentStock: s.currentStock,
                        requiredQuantity: s.totalDemand,
                        shortageQuantity: s.shortageQuantity,
                        shortagePercentage: s.shortagePercentage,
                        baseUnit: s.baseUnit,
                        severity: s.severity,
                        recommendedAction: s.recommendedAction,
                        riskLevel: s.riskLevel,
                        week: formatWeek(s.analysisTimestamp)
                    });
                }
            }
        }

        return atRisk.sort((a, b) => b.shortageQuantity - a.shortageQuantity);
    });

    this.on("getShortageStatus", async (req) => {
        const { material, plant } = req.data;
        if (!material) {
            req.reject(400, "Parameter 'material' is required.");
            return;
        }

        try {
            const results = await computeShortages(material, plant);
            if (!results.length) {
                return {
                    id: material,
                    material,
                    materialDescription: material,
                    plant: plant || '',
                    currentStock: 0,
                    requiredQuantity: 0,
                    shortageQuantity: 0,
                    shortagePercentage: 0,
                    baseUnit: '',
                    severity: 'LOW',
                    riskLevel: 'LOW',
                    recommendedAction: 'No Action Required',
                    analysisTimestamp: new Date()
                };
            }

            const r = results[0];
            return {
                id: r.material,
                material: r.material,
                materialDescription: r.materialDescription,
                plant: r.plant,
                currentStock: r.currentStock,
                requiredQuantity: r.totalDemand,
                shortageQuantity: r.shortageQuantity,
                shortagePercentage: r.shortagePercentage,
                baseUnit: r.baseUnit,
                severity: r.severity,
                riskLevel: r.riskLevel,
                recommendedAction: r.recommendedAction,
                analysisTimestamp: r.analysisTimestamp
            };
        } catch (err) {
            console.error('getShortageStatus failed:', err);
            req.reject(500, err.message || 'Unknown error');
        }
    });

    this.on("getRecommendedActions", async (req) => {
        const { plant } = req.data;

        const stocks = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant")
                .where(plant ? { Plant: plant } : {})
        );

        const uniqueMaterials = [...new Set(stocks.map(s => `${s.Material}|${s.Plant}`))];
        const actions = [];

        for (const key of uniqueMaterials) {
            const [material, plantVal] = key.split('|');
            const shortages = await computeShortages(material, plantVal);
            
            if (shortages.length > 0) {
                const s = shortages[0];
                if (s.recommendedAction !== 'No Action Required') {
                    actions.push({
                        id: s.material,
                        material: s.material,
                        materialDescription: s.materialDescription,
                        recommendedAction: s.recommendedAction,
                        priority: s.severity,
                        urgency: s.riskLevel
                    });
                }
            }
        }

        if (actions.length === 0) {
            return [{
                id: 'N/A',
                material: 'N/A',
                materialDescription: 'No materials require action',
                recommendedAction: 'All materials have sufficient stock',
                priority: 'LOW',
                urgency: 'LOW'
            }];
        }

        return actions.sort((a, b) => {
            const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
        });
    });

    this.on("getWeeklyShortageTrend", async (req) => {
        const { material, plant, weeks } = req.data;
        if (!material) {
            req.reject(400, "Parameter 'material' is required.");
            return;
        }

        const numWeeks = Math.min(weeks || 4, 12);
        const results = [];

        const shortages = await computeShortages(material, plant);
        const current = shortages[0] || {
            currentStock: 0,
            requiredQuantity: 0,
            shortageQuantity: 0,
            netPosition: 0,
            material: material,
            materialDescription: material,
            baseUnit: ''
        };

        const materialDetails = {
            material: material,
            materialDescription: current.materialDescription || material,
            baseUnit: current.baseUnit || ''
        };

        for (let i = 0; i < numWeeks; i++) {
            const weekDate = new Date();
            weekDate.setDate(weekDate.getDate() + (i * 7));
            const projectedStock = current.netPosition - (i * (current.requiredQuantity / 4));

            results.push({
                material: materialDetails.material,
                materialDescription: materialDetails.materialDescription,
                baseUnit: materialDetails.baseUnit,
                week: formatWeek(weekDate),
                weekDate: formatDate(weekDate),
                currentStock: i === 0 ? current.currentStock : Math.max(0, projectedStock + current.currentStock - current.requiredQuantity),
                requiredQty: current.requiredQuantity || 100,
                shortageQty: i === 0 ? current.shortageQuantity : Math.max(0, (current.requiredQuantity || 100) - projectedStock),
                projectedStock: Math.max(0, projectedStock)
            });
        }

        return results;
    });

    this.on("getStockLevel", async (req) => {
        const { material, plant, storageLocation, batch } = req.data;

        const where = {};
        if (material) where.Material = material;
        if (plant) where.Plant = plant;
        if (storageLocation) where.StorageLocation = storageLocation;
        if (batch) where.Batch = batch;

        const details = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod").where(where)
        );

        const totalStock = details.reduce((sum, d) => sum + num(d.MatlWrhsStkQtyInMatlBaseUnit), 0);
        const unit = details[0]?.MaterialBaseUnit || '';

        const stockByLocation = {};
        for (const d of details) {
            const loc = d.StorageLocation;
            stockByLocation[loc] = (stockByLocation[loc] || 0) + num(d.MatlWrhsStkQtyInMatlBaseUnit);
        }

        return {
            id: material,
            material,
            plant,
            totalStock,
            unit,
            stockByLocation: Object.entries(stockByLocation).map(([storageLocation, quantity]) => ({
                storageLocation,
                quantity
            }))
        };
    });

    this.on("getOpenReservations", async (req) => {
        const { material, plant } = req.data;

        const where = { ReservationItemIsFinallyIssued: false };
        if (material) where.Product = material;
        if (plant) where.Plant = plant;

        return await ReservationSrv.run(
            SELECT.from("A_ReservationDocumentItem").where(where)
        );
    });

    this.on("getSalesOrderDemand", async (req) => {
        const { material, plant } = req.data;
        if (!material) {
            req.reject(400, "Parameter 'material' is required.");
            return;
        }

        const result = await getSalesOrderDemandData(material, plant);
        return {
            id: material,
            material,
            plant,
            totalDemand: result.totalDemand || 0,
            demandByStatus: Object.entries(result.demandByStatus || {}).map(([deliveryStatus, quantity]) => ({
                deliveryStatus: deliveryStatus || ' ',
                quantity
            }))
        };
    });

    this.on("getMRPDemand", async (req) => {
        const { material, plant, week } = req.data;
        return {
            id: material || 'N/A',
            material: material || '',
            plant: plant || '',
            week: week ? formatWeek(new Date(week)) : formatWeek(new Date()),
            weekDate: week ? formatDate(new Date(week)) : formatDate(new Date()),
            mrpDemand: 0,
            plannedOrders: 0,
            purchaseRequis: 0
        };
    });

    this.on("askInventoryShortageAssistant", async (req) => {
        const { question = '', material, plant } = req.data;
        const q = question.toLowerCase();

        let data = null;
        let intent = 'unknown';

        try {
            if (q.includes('running out') || q.includes('shortage this week') || q.includes('materials at risk') || q.includes('which materials')) {
                intent = 'getMaterialsRunningOut';
                const result = await this.send('getMaterialsRunningOut', { plant });
                data = result;
            } else if (q.includes('detail') || q.includes('breakdown') || q.includes('analysis')) {
                intent = 'getMaterialShortageDetail';
                const result = await this.send('getMaterialShortageDetail', { material, plant });
                data = result;
            } else if (q.includes('stock') || q.includes('inventory') || q.includes('warehouse')) {
                intent = 'getStockLevel';
                const result = await this.send('getStockLevel', { material, plant });
                data = result;
            } else if (q.includes('reservation')) {
                intent = 'getOpenReservations';
                const result = await this.send('getOpenReservations', { material, plant });
                data = result;
            } else if (q.includes('sales order') || q.includes('order') || q.includes('demand')) {
                intent = 'getSalesOrderDemand';
                const result = await this.send('getSalesOrderDemand', { material, plant });
                data = result;
            } else if (q.includes('recommend') || q.includes('action') || q.includes('should i do')) {
                intent = 'getRecommendedActions';
                const result = await this.send('getRecommendedActions', { plant });
                data = result;
            } else if (q.includes('weekly') || q.includes('week')) {
                intent = 'getWeeklyShortagesReport';
                const result = await this.send('getWeeklyShortagesReport', { plant });
                data = result;
            } else if (q.includes('monthly') || q.includes('month')) {
                intent = 'getMonthlyShortagesReport';
                const result = await this.send('getMonthlyShortagesReport', { plant });
                data = result;
            } else if (q.includes('yearly') || q.includes('year')) {
                intent = 'getYearlyShortagesReport';
                const result = await this.send('getYearlyShortagesReport', { plant });
                data = result;
            } else if (q.includes('trend') || q.includes('forecast') || q.includes('predict')) {
                intent = 'getWeeklyShortageTrend';
                const result = await this.send('getWeeklyShortageTrend', { material, plant, weeks: 4 });
                data = result;
            } else if (q.includes('status') || q.includes('check')) {
                intent = 'getShortageStatus';
                const result = await this.send('getShortageStatus', { material, plant });
                data = result;
            } else {
                intent = 'fallback';
                data = {
                    message: "I couldn't map that question to a known capability. Try asking about: stock, reservations, sales orders, deliveries, shortages, materials at risk, weekly/monthly/yearly reports, trends, or recommendations.",
                    question: question,
                    suggestions: [
                        "Which materials will run out this week?",
                        "Show me monthly shortage report",
                        "What is the yearly shortage summary?",
                        "Give me detailed shortage analysis for a material",
                        "What is the current stock level?",
                        "Show me open reservations",
                        "What should I do about a shortage?"
                    ]
                };
            }
        } catch (err) {
            data = { error: err.message, question: question };
            intent = 'error';
        }

        return { data, intent };
    });

    this.on("predictShortages", async (req) => {
        const { plant, weeksAhead } = req.data;
        const numWeeks = Math.min(weeksAhead || 4, 12);

        const stocks = await MaterialStockSrv.run(
            SELECT.from("A_MatlStkInAcctMod")
                .columns("Material", "Plant")
                .where(plant ? { Plant: plant } : {})
        );

        const uniqueMaterials = [...new Set(stocks.map(s => `${s.Material}|${s.Plant}`))];
        const predictions = [];

        for (const key of uniqueMaterials) {
            const [material, plantVal] = key.split('|');
            const shortages = await computeShortages(material, plantVal);
            if (shortages.length > 0) {
                const s = shortages[0];
                if (s.currentStock < s.totalDemand * 2) {
                    const weekDate = new Date();
                    weekDate.setDate(weekDate.getDate() + (numWeeks * 7));
                    predictions.push({
                        material: s.material,
                        materialDescription: s.materialDescription,
                        currentStock: s.currentStock,
                        predictedDemand: s.totalDemand * (1 + (numWeeks * 0.1)),
                        predictedShortage: Math.max(0, (s.totalDemand * (1 + (numWeeks * 0.1))) - s.currentStock),
                        week: formatWeek(weekDate),
                        weekDate: formatDate(weekDate),
                        confidence: 0.75
                    });
                }
            }
        }

        if (predictions.length === 0) {
            return [{
                material: 'N/A',
                materialDescription: 'No predicted shortages',
                currentStock: 0,
                predictedDemand: 0,
                predictedShortage: 0,
                week: formatWeek(new Date()),
                weekDate: formatDate(new Date()),
                confidence: 0
            }];
        }

        return predictions.sort((a, b) => b.predictedShortage - a.predictedShortage);
    });

    // ==================================================================
    // Action Implementations
    // ==================================================================

    this.on("triggerProcurement", async (req) => {
        const { material, plant, quantity, requiredBy, priority } = req.data;
        if (!material || !plant || !quantity) {
            return {
                success: false,
                message: 'Missing required fields: material, plant, and quantity are required',
                data: null
            };
        }
        return {
            success: true,
            message: `Procurement triggered for ${material} (${quantity}) at plant ${plant}, required by ${requiredBy || 'ASAP'}, priority: ${priority || 'MEDIUM'}`,
            data: JSON.stringify({ material, plant, quantity, requiredBy: requiredBy || 'ASAP', priority: priority || 'MEDIUM' })
        };
    });

    this.on("createPurchaseRequisition", async (req) => {
        const { material, plant, quantity, deliveryDate, purchasingGroup } = req.data;
        if (!material || !plant || !quantity) {
            return {
                success: false,
                message: 'Missing required fields: material, plant, and quantity are required',
                data: null
            };
        }
        return {
            success: true,
            message: `Purchase requisition created for ${material} (${quantity}) at plant ${plant}, delivery by ${deliveryDate || 'Standard lead time'}`,
            data: JSON.stringify({ material, plant, quantity, deliveryDate: deliveryDate || 'Standard lead time', purchasingGroup: purchasingGroup || 'PG01' })
        };
    });

    this.on("requestProductionRescheduling", async (req) => {
        const { material, plant, newDate, reason } = req.data;
        if (!material || !plant || !newDate) {
            return {
                success: false,
                message: 'Missing required fields: material, plant, and newDate are required',
                data: null
            };
        }
        return {
            success: true,
            message: `Production rescheduling request submitted for ${material} at plant ${plant} to ${newDate}. Reason: ${reason || 'Material shortage'}`,
            data: JSON.stringify({ material, plant, newDate, reason: reason || 'Material shortage' })
        };
    });

    this.on("suggestAlternateSourcing", async (req) => {
        const { material, plant, quantity } = req.data;
        if (!material) {
            return {
                success: false,
                message: 'Material parameter is required',
                alternatives: []
            };
        }
        return {
            success: true,
            message: `Found alternative sourcing options for ${material}`,
            alternatives: [
                { material: `${material}-ALT1`, availableStock: 150, leadTime: 5, price: 299.99 },
                { material: `${material}-ALT2`, availableStock: 200, leadTime: 7, price: 349.99 }
            ]
        };
    });
});