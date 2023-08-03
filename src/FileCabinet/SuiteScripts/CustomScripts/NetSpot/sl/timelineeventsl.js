/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/redirect', '../../Helper/SuiteQL/suiteql', '../api/netspot'],

    (redirect, suiteql, netspot) => {

        const onRequest = (scriptContext) => {

            const paramReq = scriptContext.request.parameters;

            const objOpportunity = suiteql.execute({
                sqlfile: '../../NetSpot/sql/opportunitytle.sql',
                custparam: {
                    paramentity: paramReq.entity
                }
            });

            if (objOpportunity.status == 'FAILED') {

                log.audit({
                    title: 'SEND_OPPORTUNITY_TLE',
                    details: objOpportunity.message
                });
            }
            else {

                const nsptOppTle = netspot.createTimelineEvents({
                    integration: "opportunitytles",
                    data: objOpportunity.data
                });

                if (nsptOppTle.status == 'FAILED') {

                    log.audit({
                        title: 'SEND_OPPORTUNITY_TLE',
                        details: nsptOppTle.message
                    });
                }

            }

            const objEstimate = suiteql.execute({
                sqlfile: '../../NetSpot/sql/estimatetle.sql',
                custparam: {
                    paramentity: paramReq.entity
                }
            });

            if (objEstimate.status == 'FAILED') {

                log.audit({
                    title: 'SEND_ESTIMATE_TLE',
                    details: objEstimate.message
                });
            }
            else {

                const nsptEstTle = netspot.createTimelineEvents({
                    integration: "estimatetles",
                    data: objEstimate.data
                });

                if (nsptEstTle.status == 'FAILED') {

                    log.audit({
                        title: 'SEND_ESTIMATE_TLE',
                        details: nsptEstTle.message
                    });
                }
            }

            const objSalesOrder = suiteql.execute({
                sqlfile: '../../NetSpot/sql/salesordertle.sql',
                custparam: {
                    paramentity: paramReq.entity
                }
            });

            if (objSalesOrder.status == 'FAILED') {

                log.audit({
                    title: 'SEND_SALESORDER_TLE',
                    details: objSalesOrder.message
                });
            }
            else {
                
                const nsptSoTle = netspot.createTimelineEvents({
                    integration: "salesordertles",
                    data: objSalesOrder.data
                });

                if (nsptSoTle.status == 'FAILED') {

                    log.audit({
                        title: 'SEND_SALESORDER_TLE',
                        details: nsptSoTle.message
                    });
                }
            }

            const objInvoice = suiteql.execute({
                sqlfile: '../../NetSpot/sql/invoicetle.sql',
                custparam: {
                    paramentity: paramReq.entity
                }
            });

            if (objInvoice.status == 'FAILED') {

                log.audit({
                    title: 'SEND_INVOICE_TLE',
                    details: objInvoice.message
                });
            }
            else {

                const nsptInvTle = netspot.createTimelineEvents({
                    integration: "invoicetles",
                    data: objInvoice.data
                });

                if (nsptInvTle.status == 'FAILED') {

                    log.audit({
                        title: 'SEND_INVOICE_TLE',
                        details: nsptInvTle.message
                    });
                }
            }

            const objProject = suiteql.execute({
                sqlfile: '../../NetSpot/sql/projecttle.sql',
                custparam: {
                    paramentity: paramReq.entity
                }
            });

            if (objProject.status == 'FAILED') {

                log.audit({
                    title: 'SEND_PROJECT_TLE',
                    details: objProject.message
                });
            }
            else {

                const nsptProjTle = netspot.createTimelineEvents({
                    integration: "projectdealtles",
                    data: objProject.data
                });

                if (nsptProjTle.status == 'FAILED') {

                    log.audit({
                        title: 'SEND_PROJECT_TLE',
                        details: nsptProjTle.message
                    });
                }
            }

            redirect.toRecord({
                type: 'customer',
                id: paramReq.entity
            });

        }

        return { onRequest }

    });
