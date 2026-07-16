const cds = require('@sap/cds');

module.exports = async (srv) => 
{        
    // Using CDS API      
    const ZBA_SALESORDER_ITEM_SRV1 = await cds.connect.to("ZBA_SALESORDER_ITEM_SRV1"); 
      srv.on('READ', 'Salesorder_itemSet', req => ZBA_SALESORDER_ITEM_SRV1.run(req.query)); 
}