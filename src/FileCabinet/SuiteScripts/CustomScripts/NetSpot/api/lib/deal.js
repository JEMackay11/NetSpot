/**
 * @NApiVersion 2.1
 */

define([
  'N/https',
  'N/record',
  'N/runtime',
  '../../../Helper/SuiteQL/suiteql',
  '../../../Helper/Integration/integration',
  '../../../Helper/sqlmapjson',
  './oauth'
], (https, record, runtime, suiteql, integration, sqlmapjson, oauth) => {
  const get = (options) => {
    let output = {};

    try {
      let sProperties = '';

      if (options.hasOwnProperty('properties')) {
        if (options.properties.length > 0) {
          sProperties = options.properties
            .map(function (a) {
              return '&properties=' + a;
            })
            .toString()
            .replace(/,/g, '');
        }
      }

      const objIntegration = integration.get({
        integration: 'netspot'
      });

      if (objIntegration.status == 'SUCCESS') {
        const objToken = oauth.refreshAccessToken({
          clientid: objIntegration.data.clientid,
          clientsecret: objIntegration.data.clientsecret,
          refreshtoken: objIntegration.data.refreshtoken
        });

        if (objToken.status == 'SUCCESS') {
          const resp = https.get({
            url:
              'https://api.hubapi.com/crm/v3/objects/deals/' +
              options.id +
              '?associations=company&archived=false&' +
              sProperties,
            headers: {
              'Content-Type': 'application/json',
              Accept: '*/*',
              Authorization: 'Bearer ' + objToken.accesstoken
            }
          });

          if (resp.code == 200) {
            const objBody = JSON.parse(resp.body);
            output.status = 'SUCCESS';
            output.data = objBody;
          } else {
            const objBody = {};

            try {
              objBody = JSON.parse(resp.body);
            } catch (err) {
              objBody.message = resp.body;
            }

            output.status = 'FAILED';
            output.message = resp.code + ': ' + objBody.message;
          }
        }
      }
    } catch (error) {
      output.status = 'FAILED';
      output.message = 'ERROR: ' + error;
    }

    return output;
  };

  const getPipeLines = (options) => {
    let output = {};

    try {
      const objIntegration = integration.get({
        integration: options.integration
      });

      if (objIntegration.status == 'SUCCESS') {
        const objToken = oauth.refreshAccessToken({
          clientid: objIntegration.data.clientid,
          clientsecret: objIntegration.data.clientsecret,
          refreshtoken: objIntegration.data.refreshtoken
        });

        if (objToken.status == 'SUCCESS') {
          const resp = https.get({
            url: 'https://api.hubapi.com/crm/v3/pipelines/deals',
            headers: {
              'Content-Type': 'application/json',
              Accept: '*/*',
              Authorization: 'Bearer ' + objToken.accesstoken
            }
          });

          if (resp.code == 200) {
            const objBody = JSON.parse(resp.body);
            output.status = 'SUCCESS';
            output.data = objBody.results;
          } else {
            output.status = 'FAILED';
            output.message = resp.code + ':' + resp.body;
          }
        } else {
          output = objToken;
        }
      } else {
        output = objIntegration;
      }
    } catch (error) {
      output.status = 'FAILED';
      output.message = error;
    }

    return output;
  };

  const search = (options) => {
    var retMe = options;
    var arrDeal = [];

    try {
      var sNext = 'firstrun';

      while (
        sNext != '' &&
        runtime.getCurrentScript().getRemainingUsage() > 100
      ) {
        const objIntegration = integration.get({
          integration: 'netspot'
        });

        if (objIntegration.status == 'SUCCESS') {
          const objToken = oauth.refreshAccessToken({
            clientid: objIntegration.data.clientid,
            clientsecret: objIntegration.data.clientsecret,
            refreshtoken: objIntegration.data.refreshtoken
          });

          if (objToken.status == 'SUCCESS') {
            const resp = promise({
              function: function () {
                return https.post({
                  url: 'https://api.hubapi.com/crm/v3/objects/deals/search',
                  body: JSON.stringify(options.request),
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: '*/*',
                    Authorization: 'Bearer ' + objToken.accesstoken
                  }
                });
              },
              delay: 1000
            });

            if (resp.code == 200 || resp.code == 201) {
              var objBody = JSON.parse(resp.body);
              arrDeal = arrDeal.concat(objBody.results);

              if (objBody.paging != undefined) {
                if (objBody.paging.next.after) {
                  sNext = objBody.paging.next.after;
                  options.request.after = objBody.paging.next.after;
                } else {
                  sNext = '';
                }
              } else {
                sNext = '';
              }

              retMe = {
                status: 'SUCCESS',
                data: arrDeal
              };
            } else {
              var objBody = {};

              try {
                objBody = JSON.parse(resp.body);
              } catch (error) {
                objBody.message = resp.body;
              }

              retMe = {
                status: 'FAILED',
                message: resp.code + ': ' + objBody.message
              };
            }
          }
        }
      }
    } catch (error) {
      retMe = {
        status: 'FAILED',
        message: error
      };
    }

    return retMe;
  };

  const update = (options) => {
    if (runtime.envType == runtime.EnvType.PRODUCTION) {
      return {
        status: 'INFO',
        message: `This function is not available in ${runtime.envType}.`
      };
    }

    let opportunity = {};
    let opportunityData = {};
    let output = {};

    try {
      opportunity = record.load({
        type: record.Type.OPPORTUNITY,
        id: options.id
      });

      const dealUpdate = suiteql.execute({
        sqlfile: '../../NetSpot/sql/dealupdate.sql',
        custparam: {
          paramopps: options.id
        }
      });

      if (dealUpdate.status == 'SUCCESS') {
        if (dealUpdate.data.length > 0) {
          opportunityData = dealUpdate.data[0];

          if (
            opportunityData.hubspotid == null ||
            opportunityData.hubspotid == ''
          ) {
            const hubspotIdInfo = `Opportunity is missing the HubSpot Deal. Please check the opporunity record.`;

            opportunity.setValue({
              fieldId: 'custbody_nshs_logs',
              value: hubspotIdInfo
            });

            output.status = 'INFO';
            output.message = hubspotIdInfo;
          } else {
            opportunityData.job = opportunity.getText({
              fieldId: 'job'
            });

            const integrationConfig = integration.get({
              integration: 'dealupdate'
            });

            if (integrationConfig.status == 'SUCCESS') {
              const mapping = JSON.parse(integrationConfig.data.mapping);

              let payload = {
                inputs: [
                  sqlmapjson.generate({
                    mapping: mapping,
                    sqldata: opportunityData
                  })
                ]
              };

              const ouathToken = oauth.refreshAccessToken({
                clientid: integrationConfig.data.clientid,
                clientsecret: integrationConfig.data.clientsecret,
                refreshtoken: integrationConfig.data.refreshtoken
              });

              if (ouathToken.status == 'SUCCESS') {
                const sPayload = JSON.stringify(payload);

                const resp = https.post({
                  url: integrationConfig.data.url,
                  body: JSON.stringify(payload),
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: '*/*',
                    Authorization: 'Bearer ' + ouathToken.accesstoken
                  }
                });

                if (resp.code == 200) {
                  opportunity.setValue({
                    fieldId: 'custbody_nshs_logs',
                    value: 'HubSpot Deal Updated ' + new Date().toString()
                  });

                  output.status = 'SUCCESS';
                  output.message =
                    'HubSpot Deal Updated ' + new Date().toString();
                } else {
                  opportunity.setValue({
                    fieldId: 'custbody_nshs_logs',
                    value: resp.code + ':' + resp.body
                  });

                  output.status = 'FAILED';
                  output.message = resp.code + ':' + resp.body;
                }
              } else {
                opportunity.setValue({
                  fieldId: 'custbody_nshs_logs',
                  value: objToken.message
                });
                output = objToken;
              }
            } else {
              opportunity.setValue({
                fieldId: 'custbody_nshs_logs',
                value: integrationConfig.message
              });

              output = integrationConfig;
            }
          }
        } else {
          const suiteQLInfo = `The query didn't find any record. Please check the dealupdate.sql and check the filters and joins.`;

          opportunity.setValue({
            fieldId: 'custbody_nshs_logs',
            value: suiteQLInfo
          });

          output.status = 'INFO';
          output.message = suiteQLInfo;
        }
      } else {
        opportunity.setValue({
          fieldId: 'custbody_nshs_logs',
          value: objOpps.message
        });

        output = objOpps;
      }
    } catch (error) {
      opportunity.setValue({
        fieldId: 'custbody_nshs_logs',
        value: error
      });

      output.status = 'FAILED';
      output.message = error;
    }

    opportunity.save();
    return output;
  };

  return {
    get,
    getPipeLines,
    search,
    update
  };
});
