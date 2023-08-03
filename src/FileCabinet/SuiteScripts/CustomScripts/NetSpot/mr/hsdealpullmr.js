/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['../api/netspot', '../../Deal/api/deal', '../../Library/momentjs/moment'],

    (netspot, deal, moment) => {

        const getInputData = (scriptContext) => {

            let arrInput = [];

            let objPayload = {
                "filterGroups": [{
                    "filters": [{
                        "propertyName": "dealname",
                        "operator": "HAS_PROPERTY"
                    }, {
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

                "sorts": ["createdate"],
                "properties": ["dealname", "dealstage", "pipeline",
                    "nsclass", "amount", "deal_currency_code",
                    "hubspot_owner_id", "nsid", "closedate", "hs_next_step"],
                limit: 100,
                after: 0

            };

            const ntsptDeal = netspot.searchDeal({
                request: objPayload
            });

            if (ntsptDeal.status == 'SUCCESS') {

                arrInput = ntsptDeal.data;

                const ntsptPipelines = netspot.getDealPipelines({
                    integration: 'netspot'
                });

                let objStages = {};

                if (ntsptPipelines.status == 'SUCCESS') {

                    for (let index in ntsptPipelines.data) {

                        const objPipeline = ntsptPipelines.data[index];

                        for (let index in objPipeline.stages) {
                            const objStage = objPipeline.stages[index];

                            objStages['' + objStage.id] = {
                                name: objStage.label,
                                pipelineid: objPipeline.id,
                                pipelinename: objPipeline.label
                            };
                        }
                    }
                }

                const ntsptOwners = netspot.getOwners({
                    integration: 'netspot'
                });

                let objOwners = {};

                if (ntsptOwners.status == 'SUCCESS') {

                    for(let index in ntsptOwners.data){
                        const objOwner = ntsptOwners.data[index];
                        objOwners['' + objOwner.id] = {
                            name: objOwner.firstName + ' ' + objOwner.lastName,
                        };
                    }
                }

                for (let index in arrInput) {

                    const objInput = arrInput[index];

                    
                    try{
                        arrInput[index].properties.stagename = objStages['' + objInput.properties.dealstage].name;
                    }
                    catch(error){
                        arrInput[index].properties.stagename = 'Deactivated Stage ' + objInput.properties.dealstage
                    }

                    try{
                        arrInput[index].properties.ownername = objOwners['' + objInput.properties.hubspot_owner_id].name;
                    }
                    catch(error){
                        arrInput[index].properties.ownername = 'Deactivated Owner ' + objInput.properties.hubspot_owner_id
                    }
                    
                    arrInput[index].key = arrInput[index].id;
                }
            }

            return arrInput;
        };

        const map = (scriptContext) => {

            const objContext = JSON.parse(scriptContext.value);

            scriptContext.write({
                key: objContext.id,
                value: objContext
            });
        };

        const reduce = (scriptContext) => {

            let reduceData = JSON.parse(scriptContext.values[0]);

            const nsptDeal = netspot.getDeal({
                id: reduceData.id,
                properties: ['']
            });

            if (nsptDeal.status == 'SUCCESS') {

                if (nsptDeal.data.associations) {

                    reduceData.properties.customerid = nsptDeal.data.associations.companies.results[0].id;

                    const nsptCompany = netspot.getCompany({
                        id: reduceData.properties.customerid,
                        properties: ['nsid', 'name']
                    });

                    if (nsptCompany.status == 'SUCCESS') {
                        reduceData.properties.customer = nsptCompany.data.properties.name;
                    }

                }
            }

            deal.createHsDeal(reduceData);

        };

        const summarize = (scriptContext) => {

            var reduceSummary = scriptContext.reduceSummary;
            reduceSummary.errors.iterator().each(function (key, value) {
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