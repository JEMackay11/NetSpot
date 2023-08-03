/**
 * @NApiVersion 2.1
 */

define([
  'N/https',
  'N/query',
  'N/record',
  'N/runtime',
  './deal',
  '../netspot',
  './oauth',
  '../../../Helper/Integration/integration',
  '../../../Helper/jsonmapns',
  '../../../Helper/SuiteQL/suiteql'
], (
  https,
  query,
  record,
  runtime,
  deal,
  netspot,
  oauth,
  integration,
  jsonmapns,
  suiteql
) => {
  const variables =
    runtime.getCurrentScript().getParameter({
      name: 'custscript_nspt_variables'
    }) == null
      ? {
          currencies: {
            USD: '1',
            GBP: '2',
            CAD: '3',
            EUR: '4',
            AUD: '5',
            NZD: '6',
            SGD: '7',
            MYR: '8',
            CLP: '9',
            INR: '10'
          },
          notesdealassociation: 12,
          85: {
            error: 14514079,
            inprogress: 9440409
          },
          90: {
            error: 41884054,
            inprogress: 41884056
          }
        }
      : JSON.parse(
          runtime
            .getCurrentScript()
            .getParameter({ name: 'custscript_nspt_variables' })
        );

  const create = (options) => {
    let output = {};

    const nsptDeal = netspot.getDeal({
      id: options.id,
      properties: [
        'amount',
        'deal_currency_code',
        'dealname',
        'hubspot_owner_id',
        'nsclass',
        'nssubsidiary',
        'partner_practice',
        'pipeline'
      ]
    });

    let deal = {};
    let company = {};
    let dealOwner = {};

    if (nsptDeal.status == 'SUCCESS') {
      deal = nsptDeal.data;

      if (deal.associations) {
        deal.properties.customerid = deal.associations.companies.results[0].id;

        const nsptCompany = netspot.getCompany({
          id: deal.properties.customerid,
          properties: [
            'name',
            'domain',
            'nsid',
            'address',
            'address2',
            'city',
            'state',
            'country',
            'zip'
          ]
        });

        if (nsptCompany.status == 'SUCCESS') {
          company = nsptCompany.data;

          const customerChecked = checkCustomer({
            companyname: company.properties.name,
            subsidiary: deal.properties.nssubsidiary,
            hubspotid: company.id,
            domain: company.properties.domain,
            currency: variables.currencies[deal.properties.deal_currency_code],
            address: {
              address1: company.properties.address,
              address2: company.properties.address2,
              city: company.properties.city,
              zip: company.properties.zip,
              state: company.properties.state,
              country: company.properties.country
            }
          });

          deal.customer = customerChecked.id;
        } else if (nsptCompany.status == 'FAILED') {
          netspot.createNotes({
            associationid: variables.notesdealassociation,
            notes: nsptCompany.message,
            objectid: options.id
          });

          updateDealOnError({ class: options.class, id: options.id });

          return nsptCompany;
        }

        dealOwner = getDealOwner({
          id: deal.properties.hubspot_owner_id,
          deal: options.id
        });

        if (dealOwner.status === 'SUCCESS') {
          deal.salesrep = dealOwner.id;
        } else if (dealOwner.status === 'FAILED') {
          netspot.createNotes({
            associationid: variables.notesdealassociation,
            notes: dealOwner.message,
            objectid: options.id
          });

          updateDealOnError({ class: options.class, id: options.id });
          return { status: 'FAILED', message: dealOwner.message };
        }
      } else {
        netspot.createNotes({
          associationid: variables.notesdealassociation,
          notes: 'No company associated with deal',
          objectid: options.id
        });
        updateDealOnError({ class: deal.properties.nsclass, id: options.id });
        return { status: 'FAILED', message: 'No company associated with deal' };
      }
    } else if (nsptDeal.status == 'FAILED') {
      netspot.createNotes({
        associationid: variables.notesdealassociation,
        notes: nsptDeal.message,
        objectid: options.id
      });

      updateDealOnError({ class: options.class, id: options.id });

      return nsptDeal;
    }

    try {
      let opportunity = {};
      const integrationConfig = integration.get({
        integration: 'opportunitycreate'
      });

      if (integrationConfig.status === 'SUCCESS') {
        const fieldMapping = JSON.parse(integrationConfig.data.mapping);

        const nsOpportunity = suiteql.execute({
          query: `SELECT id FROM transaction WHERE custbody_hubspot_id = ${options.id}`
        });

        if (nsOpportunity.data.length > 0) {
          opportunity = jsonmapns.map({
            data: deal,
            mapping: fieldMapping,
            record: record.Type.OPPORTUNITY,
            recordid: nsOpportunity[0].id
          });
        } else {
          opportunity = jsonmapns.map({
            data: deal,
            mapping: fieldMapping,
            record: record.Type.OPPORTUNITY,
            recordid: null
          });
        }

        opportunity.setValue({
          fieldId: 'custbody_nshs_logs',
          value: 'NetSuite Opportunity Created ' + new Date().toString()
        });
      }

      const opportunityId = opportunity.save();

      updateDealAfterCreate({
        class: deal.properties.nsclass,
        id: options.id,
        nsid: opportunityId
      });

      output = {
        status: 'SUCCESS',
        id: opportunityId
      };
    } catch (error) {
      netspot.createNotes({
        associationid: variables.notesdealassociation,
        notes: 'ERROR: ' + error,
        objectid: options.id
      });

      updateDealOnError({ class: options.class, id: options.id });

      return { status: 'FAILED', message: 'ERROR: ' + error };
    }

    return output;
  };

  const checkCustomer = (options) => {
    const customer = suiteql.execute({
      query: `SELECT customer.id AS nsid,
                TO_CHAR(customerCurrencyBalance.currency) AS currency,
                TO_CHAR(EntitySubsidiaryRelationship.subsidiary) AS subsidiary
              FROM customer
              LEFT JOIN customerCurrencyBalance
                ON Customer.id = customerCurrencyBalance.customer
              LEFT JOIN EntitySubsidiaryRelationship
                ON customer.id = EntitySubsidiaryRelationship.entity
              INNER JOIN currency 
                ON customerCurrencyBalance.currency = currency.id
              WHERE customer.custentity_hubspot_id = ${options.hubspotid}`
    });

    if (customer.status == 'SUCCESS') {
      if (customer.data.length > 0) {
        const groupedObject = customer.data.reduce((acc, obj) => {
          const { nsid, currency, subsidiary } = obj;

          if (!acc[nsid]) {
            acc[nsid] = {
              nsid,
              subsidiaries: [],
              currencies: []
            };
          }

          if (!acc[nsid].currencies.includes(currency)) {
            acc[nsid].currencies.push(currency);
          }

          if (!acc[nsid].subsidiaries.includes(subsidiary)) {
            acc[nsid].subsidiaries.push(subsidiary);
          }

          return acc;
        }, {});

        let groupedCustomer = {};
        let missingSubsidiary = false;
        let missingCurrency = false;

        for (const key in groupedObject) {
          groupedCustomer = groupedObject[key];
        }

        if (!groupedCustomer.subsidiaries.includes(options.subsidiary)) {
          missingSubsidiary = true;
        }

        if (!groupedCustomer.currencies.includes(options.currency)) {
          missingCurrency = true;
        }

        if (missingSubsidiary || missingCurrency) {
          let updatedCustomer = record.load({
            type: record.Type.CUSTOMER,
            id: groupedCustomer.nsid,
            isDynamic: true
          });

          if (missingSubsidiary) {
            updatedCustomer.selectNewLine({
              sublistId: 'submachine'
            });

            updatedCustomer.setCurrentSublistValue({
              sublistId: 'submachine',
              fieldId: 'subsidiary',
              value: options.subsidiary,
              ignoreFieldChange: true
            });
            updatedCustomer.commitLine({ sublistId: 'submachine' });
          }

          if (missingCurrency) {
            updatedCustomer.selectNewLine({
              sublistId: 'currency'
            });

            updatedCustomer.setCurrentSublistValue({
              sublistId: 'currency',
              fieldId: 'currency',
              value: options.currency,
              ignoreFieldChange: true
            });
            updatedCustomer.commitLine({ sublistId: 'currency' });
          }

          updatedCustomer.save();
        }

        return {
          status: 'SUCCESS',
          id: groupedCustomer.nsid
        };
      } else {
        const nsptCustomer = netspot.createCustomer(options);

        if (nsptCustomer.status == 'SUCCESS') {
          return {
            status: 'SUCCESS',
            id: nsptCustomer.id
          };
        } else {
          netspot.createNotes({
            associationid: variables.notesdealassociation,
            notes: 'ERROR: ' + nsptCustomer.message,
            objectid: options.id
          });

          return nsptCustomer;
        }
      }
    }
  };

  const getDealOwner = (options) => {
    const hupspotOwner = suiteql.execute({
      query: `SELECT id FROM employee WHERE isinactive = 'F' AND custentity_hubspot_id = ${options.id}`
    });

    if (hupspotOwner.data.length === 0) {
      return {
        status: 'ERROR',
        message: 'The Deal owner is not linked to a NetSuite Employee record.'
      };
    }

    return { status: 'SUCCESS', id: hupspotOwner.data[0].id };
  };

  const search = (options) => {
    var arrResult = query
      .runSuiteQL({
        query:
          'SELECT id FROM transaction WHERE custbody_hubspot_id = ' +
          options.associatedObjectId
      })
      .asMappedResults();

    if (arrResult.length > 0) {
      return arrResult[0].id;
    } else {
      return null;
    }
  };

  const update = (options) => {
    var retMe = {
      request: options
    };

    var idOpps = this.search(options);

    if (idOpps) {
      var recMapping = record.load({
        type: 'customrecord_integration_mapping',
        id: 123
      });

      var objOppsMapping = JSON.parse(
        recMapping.getValue({
          fieldId: 'custrecord_intmap_mapping'
        })
      );

      var objData;
      var nsptDeal = deal.get({
        id: options.associatedObjectId
      });

      var opportunity = record.load({
        type: record.Type.OPPORTUNITY,
        id: idOpps,
        isDynamic: true
      });

      if (nsptDeal.status == 'SUCCESS') {
        objData = nsptDeal.data;

        for (var key in objOppsMapping) {
          opportunity = jsonmapns.jsonMap({
            mapping: objOppsMapping,
            record: opportunity,
            data: objData,
            key: key
          });
        }

        opportunity.setValue({
          fieldId: 'custbody_nshs_logs',
          value: 'NetSuite Opportunity Updated ' + new Date().toString()
        });

        var idOpps = opportunity.save();

        retMe = {
          status: 'SUCCESS',
          id: idOpps
        };
      } else if (nsptDeal.status == 'FAILED') {
        return nsptDeal;
      }
    } else {
      this.create(options);
    }

    return retMe;
  };

  const updateDealAfterCreate = (options) => {
    const opportunity = suiteql.execute({
      query: `SELECT id, tranid FROM transaction WHERE custbody_hubspot_id = ${options.id}`
    });

    const payload = {
      inputs: [
        {
          id: options.id,
          properties: {
            nsid: options.nsid,
            nstranid: opportunity.data[0].tranid,
            nsurl: `https://3688201.app.netsuite.com/app/accounting/transactions/opprtnty.nl?id=${options.nsid}`,
            dealstage: variables[options.class].inprogress
          }
        }
      ]
    };

    const integrationConfig = integration.get({
      integration: 'netspot'
    });

    if (integrationConfig.status == 'SUCCESS') {
      const objToken = oauth.refreshAccessToken({
        clientid: integrationConfig.data.clientid,
        clientsecret: integrationConfig.data.clientsecret,
        refreshtoken: integrationConfig.data.refreshtoken
      });

      if (objToken.status == 'SUCCESS') {
        const resp = https.post({
          url: 'https://api.hubapi.com/crm/v3/objects/deals/batch/update',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            Authorization: 'Bearer ' + objToken.accesstoken
          }
        });
      }
    } else if (integrationConfig.status == 'FAILED') {
      netspot.createNotes({
        associationid: 12,
        notes: integrationConfig.message,
        objectid: options.id
      });

      return integrationConfig;
    }
  };

  const updateDealOnError = (options) => {
    const payload = {
      inputs: [
        {
          id: options.id,
          properties: {
            dealstage: variables[options.class].error
          }
        }
      ]
    };

    const integrationConfig = integration.get({
      integration: 'netspot'
    });

    if (integrationConfig.status == 'SUCCESS') {
      const objToken = oauth.refreshAccessToken({
        clientid: integrationConfig.data.clientid,
        clientsecret: integrationConfig.data.clientsecret,
        refreshtoken: integrationConfig.data.refreshtoken
      });

      if (objToken.status == 'SUCCESS') {
        const resp = https.post({
          url: 'https://api.hubapi.com/crm/v3/objects/deals/batch/update',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            Authorization: 'Bearer ' + objToken.accesstoken
          }
        });
      }
    } else if (integrationConfig.status == 'FAILED') {
      netspot.createNotes({
        associationid: 12,
        notes: integrationConfig.message,
        objectid: options.id
      });

      return integrationConfig;
    }
  };

  return {
    create,
    search,
    update
  };
});
