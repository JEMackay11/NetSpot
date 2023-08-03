define(['N/record', 'N/https', './oauth2x', '../../../Helper/Integration/integration2x', '../../../Helper/nsmapjson'],

	function (record, https, oauth, integration, nsmapjson) {

		var getPayload = function (option) {

			var rec = option.record;
			var idMap;

			if (option.action == 'create') {
				idMap = 127;
			}
			else if (option.action == 'update') {
				idMap = 128;
			}

			var recMapping = record.load({
				type: 'customrecord_integration_mapping',
				id: idMap
			});

			var objMap = JSON.parse(recMapping.getValue({
				fieldId: 'custrecord_intmap_mapping'
			}));

			var objPayload = nsmapjson.generate({
				mapping: objMap,
				record: rec
			});

			return objPayload;
		};

		create = function (option) {

			var retMe = option;
			option.action = 'create';
			var objPayload;

			if (option.usemap == false || option.usemap == undefined) {
				objPayload = option.data;
			}
			else {
				objPayload = getPayload(option);
			}

			try {

				const objIntegration = integration.get({
					integration: 'netspot',
				});

				if (objIntegration.status == 'SUCCESS') {

					const objToken = oauth.refreshAccessToken({
						clientid: objIntegration.data.clientid,
						clientsecret: objIntegration.data.clientsecret,
						refreshtoken: objIntegration.data.refreshtoken
					});

					if (objToken.status == 'SUCCESS') {

						const resp = https.post({
							url: "https://api.hubapi.com/crm/v3/objects/contacts",
							body: JSON.stringify(objPayload),
							headers: {
								'Content-Type': 'application/json',
								'Accept': '*/*',
								'Authorization': 'Bearer ' + objToken.accesstoken
							}
						});

						if (resp.code == 200 || resp.code == 201) {

							var objBody = JSON.parse(resp.body);
							retMe.status = 'SUCCESS';
							retMe.message = 'Hubpsot Contact Created ' + (new Date()).toString();
							retMe.id = objBody.id;
						}
						else {

							var objBody = {};

							try {
								objBody = JSON.parse(resp.body);
							}
							catch (error) {
								objBody.message = resp.body;
							}

							retMe.status = 'FAILED';
							retMe.message = resp.code + ': ' + objBody.message;
						}
					}
				}
			}
			catch (error) {
				retMe.status = 'FAILED';
				retMe.message = 'ERROR: ' + error
			}

			return retMe;
		};

		update = function (option) {

			var retMe = option;
			option.action = 'update';
			var objPayload;

			try {

				if (option.usemap == false || option.usemap == undefined) {
					objPayload = option.data
				}
				else {
					objPayload = {
						inputs: [getPayload(option)]
					};
				}

				const objIntegration = integration.get({
					integration: 'netspot',
				});

				if (objIntegration.status == 'SUCCESS') {

					const objToken = oauth.refreshAccessToken({
						clientid: objIntegration.data.clientid,
						clientsecret: objIntegration.data.clientsecret,
						refreshtoken: objIntegration.data.refreshtoken
					});

					if (objToken.status == 'SUCCESS') {

						const resp = https.post({
							url: "https://api.hubapi.com/crm/v3/objects/contacts/batch/update",
							body: JSON.stringify(objPayload),
							headers: {
								'Content-Type': 'application/json',
								'Accept': '*/*',
								'Authorization': 'Bearer ' + objToken.accesstoken
							}
						});

						if (resp.code == 200 || resp.code == 201) {
							retMe.status = 'SUCCESS';
							retMe.message = 'Hubpsot Contact Updated ' + (new Date()).toString();
						}
						else {

							var objBody = {};

							try {
								objBody = JSON.parse(resp.body);
							}
							catch (err) {
								objBody.message = resp.body;
							}

							retMe.status = 'FAILED';
							retMe.message = resp.code + ': ' + objBody.message
						}
					}
				}
			}
			catch (error) {
				retMe.status = 'FAILED';
				retMe.message = 'ERROR' + error;
			}

			return retMe;
		};

		return {
			create: create,
			update: update
		};

	});