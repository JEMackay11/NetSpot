/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/crypto', 'N/encode', 'N/record', '../api/lib/security'],
/**
 * @param {crypto} crypto
 * @param {encode} encode
 * @param {record} record
 */
function(serverWidget, crypto, encode, record, security) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	
    	var objForm;
    	var paramReq = context.request.parameters;
    	var sHash = paramReq.h;
    	var sEmail = paramReq.email;
    	var idToken = paramReq.tokenid;

    	log.audit('hash string', sHash);
    	log.audit('email string', sEmail);
    	log.audit('guid string', security.validate(paramReq));
    	
    	if(context.request.method === 'GET'){
    		
    		objForm = serverWidget.createForm({title: 'Project'});
    		var fldCustomer = objForm.addField({ id: 'custpage_customer', type: serverWidget.FieldType.SELECT, source: 'customer', label: 'Customer'});
    			fldCustomer.defaultValue = 'Scoping';
				fldCustomer.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			
    		var fldId = objForm.addField({ id: 'custpage_id', type: serverWidget.FieldType.TEXT, label: 'ID'});
    			fldId.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
    			
    		var fldName = objForm.addField({ id: 'custpage_name', type: serverWidget.FieldType.TEXT, label: 'Name'});
    		var fldStatus = objForm.addField({ id: 'custpage_status', type: serverWidget.FieldType.TEXT, label: 'Status'});
    			fldStatus.defaultValue = 'Scoping';
    			fldStatus.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
    	}
    	else if(context.request.method === 'POST'){
    		
    	}
    	
    	context.response.writePage(objForm);
    }

    return {
        onRequest: onRequest
    };
    
});
