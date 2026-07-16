const cds = require('@sap/cds');

module.exports = async (srv) => 
{        
    // Using CDS API      
    const ZAPI_MATERIAL_STOCK_SRV1 = await cds.connect.to("ZAPI_MATERIAL_STOCK_SRV1"); 
      srv.on('READ', 'A_MatlStkInAcctMod', req => ZAPI_MATERIAL_STOCK_SRV1.run(req.query)); 
}