const cds = require('@sap/cds');

module.exports = async (srv) => 
{        
    // Using CDS API      
    const ZAPI_RESERVATION_DOCUMENT_SRV1 = await cds.connect.to("ZAPI_RESERVATION_DOCUMENT_SRV1"); 
      srv.on('READ', 'A_ReservationDocumentItem', req => ZAPI_RESERVATION_DOCUMENT_SRV1.run(req.query)); 
}