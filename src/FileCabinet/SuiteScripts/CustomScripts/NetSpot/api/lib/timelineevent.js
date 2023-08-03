/**
 * @NApiVersion 2.1
 */

define(['N/https', 'N/record', '../../../Helper/Integration/integration', '../../../Helper/nsmapjson', '../../../Helper/sqlmapjson', './oauth'],

	(https, record, integration, nsmapjson, sqlmapjson, oauth) => {

		const create = (options) => {

			let retMe = {};

			try {

				const objIntegration = integration.get({
					integration: options.integration,
				})

				if (objIntegration.status == 'SUCCESS') {

					let objPayload ={};
					const objIntegrationData = objIntegration.data;
					const objMapping = JSON.parse(objIntegrationData.mapping);

					objPayload = sqlmapjson.generate({
						mapping: objMapping,
						sqldata: options.data
					})

					const objToken = oauth.refreshAccessToken({
						clientid: objIntegrationData.clientid,
						clientsecret: objIntegrationData.clientsecret,
						refreshtoken: objIntegrationData.refreshtoken
					})

					if (objToken.status == 'SUCCESS') {

						const sToken = objToken.accesstoken;

						const resp = https.put({
							url: objIntegrationData.url,
							body: JSON.stringify(objPayload),
							headers: {
								'Content-Type': 'application/json',
								'Accept': '*/*',
								'Authorization': 'Bearer ' + sToken
							}
						});

						if (resp.code == 204) {

							retMe.status = 'SUCCESS';
							retMe.message = 'Timeline Event has been created.';
						}
						else {
							retMe.status = 'FAILED';
							retMe.message = resp.code + ':' + resp.body
						}
					}
					else {
						retMe = objToken;
					}
				}
				else {
					retMe = objIntegration;
				}
			}
			catch (error) {
				retMe.status = 'FAILED';
				retMe.message = error
			}

			return retMe;
		};

		const batchCreate = (options) => {

			let retMe = {};

			try {

				const objIntegration = integration.get({
					integration: options.integration,
				})

				if (objIntegration.status == 'SUCCESS') {

					const objIntegrationData = objIntegration.data;
					const objMapping = JSON.parse(objIntegrationData.mapping);

					let objPayload = {
						eventWrappers: []
					};

					options.data.forEach(function (data) {

						objPayload.eventWrappers.push(sqlmapjson.generate({
							mapping: objMapping,
							sqldata: data
						}))

					})

					const objToken = oauth.refreshAccessToken({
						clientid: objIntegrationData.clientid,
						clientsecret: objIntegrationData.clientsecret,
						refreshtoken: objIntegrationData.refreshtoken
					})

					if (objToken.status == 'SUCCESS') {

						const sToken = objToken.accesstoken;

						const resp = https.put({
							url: objIntegrationData.url,
							body: JSON.stringify(objPayload),
							headers: {
								'Content-Type': 'application/json',
								'Accept': '*/*',
								'Authorization': 'Bearer ' + sToken
							}
						});

						if (resp.code == 204) {

							retMe.status = 'SUCCESS';
							retMe.message = 'Timeline Event has been created.';
						}
						else {
							retMe.status = 'FAILED';
							retMe.message = resp.code + ':' + resp.body
						}
					}
					else {
						retMe = objToken;
					}
				}
				else {
					retMe = objIntegration;
				}
			}
			catch (error) {
				retMe.status = 'FAILED';
				retMe.message = error
			}

			return retMe;
		};

		return {
			create, batchCreate
		};

	});
