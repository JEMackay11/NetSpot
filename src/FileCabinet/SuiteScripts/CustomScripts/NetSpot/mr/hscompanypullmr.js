/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['../api/netspot', '../../Library/momentjs/moment'],

function(netspot, moment) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
	getInputData = function () {
    	
		var arrInput = [];
        var objCompanies = netspot.searchCompany({
            request: {
                "filterGroups": [{
                    "filters": [{
                        "propertyName": "createdate",
                        "operator": "GTE",
                        "value": (moment().subtract(1, 'days')).valueOf()
                    }],
                    "filters": [{
                        "propertyName": "hs_lastmodifieddate",
                        "operator": "GTE",
                        "value": (moment().subtract(1, 'days')).valueOf()
                    }]
                }],
                "sorts": [
                    "hs_object_id"
                ],
                "properties": [
                    "name",
                    "nsid",
                    "domain"
                ],
                limit: 100,
                after: 0
            }
        });
    	
    	if(objCompanies.response.status == 'SUCCESS'){
    		arrInput = objCompanies.response.data;
    	}
        else if (objCompanies.response.data.length > 0){
            arrInput = objCompanies.response.data;
        }
        
        for (var index in arrInput) {
        	arrInput[index].key = arrInput[index].id;
        }
    	
        log.audit({
            title: 'getInputData',
            details: 'Number of Companies: ' + arrInput.length
        });
        
    	return arrInput;
    	
    };

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    map = function (context) {
    	
        var objContext = JSON.parse(context.value);
        var mapKey = objContext.id;
        var mapValue = objContext;
        
        context.write({
            key: mapKey,
            value: mapValue
        });
    };

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    reduce = function (context) {
    	
        var objContext = JSON.parse(context.values[0]);
        var reduceData = objContext;
        
        var id = netspot.createHsCompany(reduceData);
        
    };


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    summarize = function (summary) {
    	
    	var reduceSummary = summary.reduceSummary;
        reduceSummary.errors.iterator().each(function(key, value){
            var msg = 'Process id: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
           
            log.audit({
                title: 'summarize',
                details: 'summarize: ' + msg
            });
            
            return true;
        });
    };

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
