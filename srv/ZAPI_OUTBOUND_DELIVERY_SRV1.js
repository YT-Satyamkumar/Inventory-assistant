const cds = require('@sap/cds');

module.exports = async (srv) => 
{        
    // Using CDS API      
    const ZAPI_OUTBOUND_DELIVERY_SRV1 = await cds.connect.to("ZAPI_OUTBOUND_DELIVERY_SRV1"); 
      srv.on('READ', 'A_OutbDeliveryDocFlow', req => ZAPI_OUTBOUND_DELIVERY_SRV1.run(req.query)); 
      srv.on('READ', 'A_OutbDeliveryItem', req => ZAPI_OUTBOUND_DELIVERY_SRV1.run(req.query)); 
      srv.on('READ', 'A_OutbDeliveryPartner', req => ZAPI_OUTBOUND_DELIVERY_SRV1.run(req.query)); 
}