/**
 * @NApiVersion 2.1
 */

require([
    "N/record",
    "SuiteScripts/CustomScripts/Helper/Integration/integration",
    "SuiteScripts/CustomScripts/Helper/jsonmapns",
    "SuiteScripts/CustomScripts/Helper/SuiteQL/suiteql",
    "SuiteScripts/CustomScripts/NetSpot/api/lib/customer",
], function (record, integration, jsonmapns, suiteql, customer) {
    checkCustomer = (options) => {
        options = {
            companyname: "Test Customer SB 4",
            subsidiary: "2",
            hubspotid: '9022654',
            currency: 'EUR',
            address: {
                country: "PH",
                address: "Test address",
                address2: "Test address2",
                city: "Test city",
                state: "Test state",
                zip: "Test zip"
            }
        }
        let objValidation = getCustomerData(options);
        log.debug('objValidation', objValidation)
        return objValidation
    }

    function checkHubSpotOwnerId(options) {
        let empId = "";
        const objResult = suiteql.execute({
            query: `
                SELECT
                    employee.id AS employeeid
                FROM employee
                WHERE employee.custentity_hubspot_id = '${options.hubspotid}'
        `,
        });
        log.debug("HubSpotOwnerId", objResult)
        if (objResult.status == "SUCCESS") {
            if (objResult.data.length == 0) {
                log.debug("HubSpotOwnerId", "CALL NOTES")
            }
            else {
                empId = objResult.data[0].employeeid;
            }
        }
        return empId
    }

    function updateCurrency(result, options) {
        const objResult = suiteql.execute({
            query: `
                SELECT
                    currency.id AS currency
                FROM currency
                WHERE currency.symbol = '${options.currency}'
        `,
        });
        log.debug("currencyId", objResult.data[0].currency)
        if (objResult.status == "SUCCESS") {
            if (objResult.data.length > 0) {
                var customerRecord = record.load({
                    type: record.Type.CUSTOMER,
                    id: result.recordid,
                    isDynamic: true
                });
                customerRecord.selectNewLine({
                    sublistId: "currency",
                });
                customerRecord.setValue({
                    sublistId: "currency",
                    fieldId: "currency",
                    value: objResult.data[0].currency,
                });
                customerRecord.commitLine({
                    sublistId: "currency",
                });
                var customerId = customerRecord.save()
                log.debug("updateCurrency customerId", customerId)
            }
        }
        return customerId
    }

    function updateSubsidiary(result, options) {
        var customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: result.recordid,
            isDynamic: true
        });
        customerRecord.selectNewLine({
            sublistId: "submachine",
        });
        customerRecord.setCurrentSublistValue({
            sublistId: "submachine",
            fieldId: "subsidiary",
            value: parseInt(options.subsidiary),
        });
        customerRecord.commitLine({
            sublistId: "submachine",
        });
        let customerId = customerRecord.save()
        log.debug("updateSubsidiary customerId", customerId)
        return customerId
    }

    function getCustomerData(options) {
        try {
            var objValidation = {};
            const objResult = suiteql.execute({
                query: `
                SELECT
                    custentity_hubspot_id AS hubspotid,
                    entityid AS companyname,
                    subsidiary AS subsidiary,
                    customer.id AS recordid,
                    currency.symbol AS currency,
                    customerCurrencyBalance.currency AS currencyid,
                FROM customer
                    INNER JOIN customerCurrencyBalance ON customer.id = customerCurrencyBalance.customer
                    INNER JOIN CustomerSubsidiaryRelationship ON customer.id = CustomerSubsidiaryRelationship.entity
                    INNER JOIN currency ON currency.id = customerCurrencyBalance.currency
                WHERE customer.custentity_hubspot_id = '${options.hubspotid}'
            `,
            });
            log.debug("objResult", objResult)
            if (objResult.status == "SUCCESS") {
                if (objResult.data.length > 0) {
                    objValidation.status = "SUCCESS";
                    const result = objResult.data.reduce((accumulator, current) => {
                        if (!accumulator.recordid) {
                            accumulator.recordid = current.recordid;
                            accumulator.currency = [];
                            accumulator.hubspotid = current.hubspotid;
                            accumulator.entityname = current.entityname;
                            accumulator.subsidiary = [];
                        }

                        if (!accumulator.currency.includes(current.currency)) {
                            accumulator.currency.push(current.currency);
                        }
                        if (!accumulator.subsidiary.includes(current.subsidiary)) {
                            accumulator.subsidiary.push(current.subsidiary);
                        }
                        return accumulator;
                    }, {});
                    log.debug("result", result)
                    objValidation.customerid = result.recordid;
                    let blnSubsidiary = result.subsidiary.includes(parseInt(options.subsidiary));
                    let blnCurrency = result.currency.includes(options.currency);
                    log.debug("blnSubsidiary", blnSubsidiary)
                    log.debug("blnCurrency", blnCurrency)
                    if (blnSubsidiary === false) {
                        log.debug("Update Customer Subsidiary")
                        let customerId = updateSubsidiary(result, options);
                        objValidation.customerid = customerId;
                    }
                    if (blnCurrency === false) {
                        log.debug("Update Customer Currency")
                        let customerId = updateCurrency(result, options)
                        objValidation.customerid = customerId;
                    }
                    let employeeId = checkHubSpotOwnerId(options)
                    log.debug("employeeId", employeeId)
                    if (employeeId){
                        objValidation.employeeid = employeeId;
                    }
                } else {
                    let customerId = customer.create(options)
                    log.debug("customerId", customerId)
                    if (objResult.status == "SUCCESS") {
                        if (objResult.data.length > 0) {
                            objValidation.customerid = customerId;
                        }
                    }
                }
            } else {
                objValidation.status = "FAILED";
                objValidation.message = "ERROR: Company name cannot be empty. Please provide a valid company name in your request.";
            }
        } catch (err) {
            objValidation.status = "FAILED";
            objValidation.message = err;
        }
        return objValidation
    }

    checkCustomer()
    return {
        checkCustomer,
    };
});