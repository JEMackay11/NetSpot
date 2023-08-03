/**
 * @NApiVersion 2.1
 */

define([
  'N/https',
  './oauth',
  '../../../Helper/Integration/integration',
  '../../../Library/momentjs/moment'
], (https, oauth, integration, moment) => {
  const create = (options) => {
    let output = {};

    const payload = {
      associations: [
        {
          to: {
            id: options.objectid
          },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: options.associationid
            }
          ]
        }
      ],
      properties: {
        hs_note_body: options.notes,
        hs_timestamp: moment().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        hubspot_owner_id: options.owner
      }
    };

    try {
      const integrationData = integration.get({
        integration: 'netspot'
      });

      if (integrationData.status == 'SUCCESS') {
        const token = oauth.refreshAccessToken({
          clientid: integrationData.data.clientid,
          clientsecret: integrationData.data.clientsecret,
          refreshtoken: integrationData.data.refreshtoken
        });

        if (token.status == 'SUCCESS') {
          const response = https.post({
            url: 'https://api.hubapi.com/crm/v3/objects/notes',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
              Accept: '*/*',
              Authorization: 'Bearer ' + token.accesstoken
            }
          });

          if (response.code == 201) {
            return {
              status: 'SUCCESS',
              data: JSON.parse(response.body)
            };
          } else {
            let body = {};

            try {
              body = JSON.parse(response.body);
            } catch (err) {
              body.message = response.body;
            }

            return {
              status: 'FAILED',
              message: response.code + ': ' + response.message
            };
          }
        } else {
          return token;
        }
      } else {
        return integrationData;
      }
    } catch (error) {
      output = {
        status: 'FAILED',
        message: 'ERROR' + ': ' + error
      };
    }

    return output;
  };
  return {
    create: create
  };
});
