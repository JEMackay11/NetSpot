/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/runtime', 'N/record', 'N/file', 'N/ui/serverWidget', '../api/netspot'],

    (runtime, record, file, serverWidget, netspot) => {

        const beforeLoad = (scriptContext) => {

            const newRec = scriptContext.newRecord;

            if (scriptContext.type == scriptContext.UserEventType.VIEW && newRec.type == record.Type.CUSTOMER
                && newRec.getValue('custentity_hubspot_id') && newRec.getValue('custentity_hubspot_id') != '') {

                let form = scriptContext.form;

                let html = file.load({
                    id: '../btn/btnhtml.html'
                }).getContents();

                let insertHml = form.addField({
                    id: 'custpage_pa_jquery',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'JQ'
                });

                html = html.replace('{params1}', 'entity=' + newRec.id);

                insertHml.defaultValue = html;

                form.addButton({
                    id: 'custpage_btn_sendtle',
                    label: 'Send Timeline Events',
                    functionName: 'sendTimelineEvents'
                });
            }
        };


        const afterSubmit = (scriptContext) => {

            const newRec = scriptContext.newRecord;

            if (scriptContext.type == 'delete') {
                return;
            }

            if (newRec.type == record.Type.CUSTOMER && scriptContext.type == 'create' && runtime.executionContext === runtime.ContextType.USER_INTERFACE) {

                let recCustomer = record.load({
                    type: newRec.type,
                    id: newRec.id,
                    isDynamic: true
                });

                const nsptCompany = netspot.createCompany({
                    record: recCustomer
                });

                recCustomer = record.load({
                    type: newRec.type,
                    id: newRec.id,
                    isDynamic: true
                });

                if (nsptCompany.status == 'SUCCESS') {

                    recCustomer.setValue({
                        fieldId: 'custentity_hubspot_id',
                        value: nsptCompany.id
                    });

                    recCustomer.setValue({
                        fieldId: 'custentity_nshs_logs',
                        value: nsptCompany.message
                    });

                    recCustomer.save();
                }
                else if (result.status == 'FAILED') {

                    recCustomer.setValue({
                        fieldId: 'custentity_nshs_logs',
                        value: result.status + ': ' + result.message
                    });
                }

                try {
                    recCustomer.save();
                }
                catch (err) {
                    log.audit({
                        title: 'netspotue.afterSubmit',
                        details: 'ERROR: ' + err
                    });
                }
            }
            else if (newRec.type == record.Type.CUSTOMER && scriptContext.type == 'edit') {

                let recCustomer = record.load({
                    type: newRec.type,
                    id: newRec.id,
                    isDynamic: true
                });

                const nsptCompany = netspot.updateCompany({
                    record: recCustomer
                });

                recCustomer = record.load({
                    type: newRec.type,
                    id: newRec.id,
                    isDynamic: true
                });

                if (nsptCompany.status == 'SUCCESS') {

                    recCustomer.setValue({
                        fieldId: 'custentity_nshs_logs',
                        value: nsptCompany.message
                    });
                }
                else if (nsptCompany.status == 'FAILED') {

                    recCustomer.setValue({
                        fieldId: 'custentity_nshs_logs',
                        value: nsptCompany.message
                    });
                }

                try {
                    recCustomer.save();
                }
                catch (err) {
                    log.audit({
                        title: 'netspotue.afterSubmit',
                        details: 'ERROR: ' + err
                    });
                }
            }
            else if (newRec.type == record.Type.CONTACT && scriptContext.type == 'create') {

                let recContact = record.load({
                    type: newRec.type,
                    id: newRec.id,
                    isDynamic: true
                });

                const nsptContact = netspot.createContact({
                    record: recContact,
                    usemap: true
                });

                recContact = record.load({
                    type: newRec.type,
                    id: newRec.id,
                    isDynamic: true
                });

                if (nsptContact.status == 'SUCCESS') {

                    recContact.setValue({
                        fieldId: 'custentity_hubspot_id',
                        value: nsptContact.id
                    });

                    recContact.setValue({
                        fieldId: 'custentity_nshs_logs',
                        value: nsptContact.message
                    });
                }
                else if (nsptContact.status == 'FAILED') {

                    recContact.setValue({
                        fieldId: 'custentity_nshs_logs',
                        value: nsptContact.status + ': ' + nsptContact.message
                    });
                }

                try {
                    recContact.save();
                }
                catch (err) {
                    log.audit({
                        title: 'netspotue.afterSubmit',
                        details: 'ERROR: ' + err
                    });
                }
            }
            else if (newRec.type == record.Type.CONTACT && scriptContext.type == 'edit') {

                let recContact = record.load({
                    type: newRec.type,
                    id: newRec.id,
                    isDynamic: true
                });


                let nsptContact;

                if (recContact.getValue('custentity_hubspot_id')) {

                    nsptContact = netspot.updateContact({
                        record: recContact,
                        usemap: true
                    });
                }
                else {

                    nsptContact = netspot.createContact({
                        record: recContact,
                        usemap: true
                    });
                }

                recContact = record.load({
                    type: newRec.type,
                    id: newRec.id,
                    isDynamic: true
                });

                if (nsptContact.status == 'SUCCESS') {

                    recContact.setValue({
                        fieldId: 'custentity_nshs_logs',
                        value: nsptContact.message
                    });
                }
                else if (nsptContact.status == 'FAILED') {

                    recContact.setValue({
                        fieldId: 'custentity_nshs_logs',
                        value: nsptContact.status + ': ' + nsptContact.message
                    });
                }

                try {

                    recContact.save();
                }
                catch (err) {
                
                    log.audit({
                        title: 'netspotue.afterSubmit',
                        details: 'ERROR: ' + err
                    });
                }
            }
            else if (newRec.type == record.Type.OPPORTUNITY && scriptContext.type == 'edit') {

                if (scriptContext.type != 'delete') {
                    netspot.updateDeal({id: newRec.id});
                }
            }
            else if (newRec.type == 'customrecord_atl_marketplace_transaction') {

                if (scriptContext.type != 'delete') {
                    netspot.createAtlTransactionTle({id: newRec.id});
                }
            }
            else if (newRec.type == 'customrecord_atl_marketplace_license') {

                if (scriptContext.type != 'delete') {
                    netspot.createAtlLicenseTle({id: newRec.id});
                }
            }
        }

        return {
            beforeLoad,
            afterSubmit
        };

    });
