/**
 * @NApiVersion 2.1
 */
define([
  'N/https',
  'N/record',
  'N/runtime',
  '../../../Helper/SuiteQL/suiteql',
  '../../../Helper/sqlmapjson',
  './oauth',
  '../../../Helper/Integration/integration'
], (https, record, runtime, suiteql, sqlmapjson, oauth, integration) => {
  const create = (options) => {
    let retMe = {};

    try {
      let objCustomer = suiteql.execute({
        sqlfile: '../../NetSpot/sql/companycreate.sql',
        custparam: {
          paramentity: options.record.id
        }
      });
      const objIntegration = integration.get({
        integration: 'companycreate'
      });

      if (objIntegration.status == 'SUCCESS') {
        let objPayload = {};
        const objMapping = JSON.parse(objIntegration.data.mapping);

        objPayload = sqlmapjson.generate({
          mapping: objMapping,
          sqldata: objCustomer.data[0]
        });

        const objToken = oauth.refreshAccessToken({
          clientid: objIntegration.data.clientid,
          clientsecret: objIntegration.data.clientsecret,
          refreshtoken: objIntegration.data.refreshtoken
        });

        if (objToken.status == 'SUCCESS') {
          const resp = https.post({
            url: objIntegration.data.url,
            body: JSON.stringify(objPayload),
            headers: {
              'Content-Type': 'application/json',
              Accept: '*/*',
              Authorization: 'Bearer ' + objToken.accesstoken
            }
          });

          if (resp.code == 200 || resp.code == 201) {
            let objBody = JSON.parse(resp.body);

            retMe.status = 'SUCCESS';
            retMe.message = 'Hubpsot Company Created ' + new Date().toString();
            retMe.id = objBody.id;
          } else {
            let objBody = {};

            try {
              objBody = JSON.parse(resp.body);
            } catch (error) {
              objBody.message = resp.body;
            }

            retMe.status = 'FAILED';
            retMe.message = resp.code + ': ' + objBody.message;
          }
        }
      }
    } catch (error) {
      retMe.status = 'FAILED';
      retMe.message = 'ERROR: ' + error;
    }

    return retMe;
  };

  const update = (options) => {
    var retMe = {
      action: 'update',
      request: options
    };

    options.action = 'update';

    try {
      var objPayload = { inputs: [getPayload(options)] };

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
          const resp = https.post({
            url: 'https://api.hubapi.com/crm/v3/objects/companies/batch/update',
            body: JSON.stringify(objPayload),
            headers: {
              'Content-Type': 'application/json',
              Accept: '*/*',
              Authorization: 'Bearer ' + objToken.accesstoken
            }
          });

          if (resp.code == 200 || resp.code == 201) {
            var objBody = JSON.parse(resp.body).results[0];

            retMe.status = 'SUCCESS';
            retMe.message = 'Hubpsot Company Updated ' + new Date().toString();
          } else {
            var objBody = {};

            try {
              objBody = JSON.parse(resp.body);
            } catch (err) {
              objBody.message = resp.body;
            }

            retMe.status = 'FAILED';
            retMe.message = resp.code + ': ' + objBody.message;
          }
        }
      }
    } catch (err) {
      retMe.status = 'FAILED';
      retMe.message = resp.code + ': ' + objBody.message;
    }

    return retMe;
  };

  const getPayload = (options) => {
    let rec = options.record;
    let idMap = 118;

    if (options.action == 'update') {
      idMap = 119;
    }

    let recMapping = record.load({
      type: 'customrecord_integration_mapping',
      id: idMap
    });

    let objPayload = nsmapjson.generate({
      mapping: JSON.parse(recMapping.getValue('custrecord_intmap_mapping')),
      record: rec
    });

    return objPayload;
  };

  const get = (options) => {
    var retMe = {
      request: options
    };

    try {
      var sProperties = '';

      if (options.properties.length > 0) {
        sProperties = options.properties
          .map(function (a) {
            return '&properties=' + a;
          })
          .toString()
          .replace(/,/g, '');
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
              'https://api.hubapi.com/crm/v3/objects/companies/' +
              options.id +
              '?archived=false' +
              sProperties,
            headers: {
              'Content-Type': 'application/json',
              Accept: '*/*',
              Authorization: 'Bearer ' + objToken.accesstoken
            }
          });

          if (resp.code == 200 || resp.code == 201) {
            var objBody = JSON.parse(resp.body);
            retMe = {
              status: 'SUCCESS',
              data: objBody
            };
          } else {
            var objBody = {};

            try {
              objBody = JSON.parse(resp.body);
            } catch (err) {
              objBody.message = resp.body;
            }

            retMe = {
              status: 'FAILED',
              message: resp.code + ': ' + objBody.message
            };
          }
        }
      }
    } catch (error) {
      retMe = {
        status: 'FAILED',
        message: 'ERROR: ' + error
      };
    }

    return retMe;
  };

  const search = (options) => {
    var retMe = options;
    var arrCompanies = [];

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
                  url: 'https://api.hubapi.com/crm/v3/objects/companies/search',
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
              arrCompanies = arrCompanies.concat(objBody.results);
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
                data: arrCompanies
              };
            } else {
              var objBody = {};

              try {
                objBody = JSON.parse(resp.body);
              } catch (err) {
                var e = err;
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
        message: 'ERROR' + error
      };
    }

    return retMe;
  };

  const promise = (options) => {
    var date = new Date();
    date.setMilliseconds(date.getMilliseconds() + options.delay);
    while (new Date() < date) {}

    return options.function();
  };

  return { create, update, get, search };
});
