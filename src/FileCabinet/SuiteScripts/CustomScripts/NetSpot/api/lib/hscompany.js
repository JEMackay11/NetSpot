define(['N/query', 'N/record', '../../../Helper/jsonmapns' ],

function(query, record, jsonmapns) {
   
	create = function(option){
		
        var recMapping = record.load({
            type: 'customrecord_integration_mapping',
            id: 121
        });
        
        var objCompanyMapping = JSON.parse(recMapping.getValue({
            fieldId: 'custrecord_intmap_mapping'
        }));
		
    	var arrHScompany = query.runSuiteQL({
			query: "SELECT id FROM customrecord_hscompany WHERE externalid = '" + option.id + "'"
		}).asMappedResults();

		var recCompany; 
        
        if(arrHScompany.length > 0){

            recCompany = record.load({
                type: 'customrecord_hscompany',
                id: arrHScompany[0].id,
                isDynamic: true
            });
        }
        else {
            recCompany = record.create({
                type: 'customrecord_hscompany',
                isDynamic: true
            });
        }

        for (var key in objCompanyMapping) {

        	recCompany = jsonmapns.jsonMap({
                mapping: objCompanyMapping,
                record: recCompany,
                data: option,
                key: key
            });
        }
        
        return recCompany.save();
	};
	
    return {
    	create: create
    };
    
});
