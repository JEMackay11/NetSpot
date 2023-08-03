/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/https', '../api/netspot', '../api/lib/oauth', '../api/project', '../../Helper/Integration/integration'],

	(https, netspot, oauth, project, integration) => {

		doGet = (requestParams) => {

			let retMe = {};

			// if (requestParams.associatedObjectType == 'DEAL') {
			// 	retMe = netspot.generateHubCard(requestParams, 'opportunity');
			// }
			// else if (requestParams.associatedObjectType == 'COMPANY') {
			// 	retMe = netspot.generateHubCard(requestParams, 'customer');
			// }

			return retMe;
		}

		doPut = (requestBody) => {

		}

		doPost = (requestBody) => {

			log.audit({
				title: 'doPost',
				details: JSON.stringify(requestBody)
			});

			let retMe = {};

			try {

				if (requestBody != undefined && requestBody != '') {

					if (requestBody.action == 'create' && requestBody.record == 'pmojob') {
						retMe = project.createPmo(requestBody);
					}
					else if (requestBody.action == 'create' && requestBody.record == 'opportunity') {

						const nsptOpp = netspot.createOpportunity(requestBody);

						if (nsptOpp.status == 'FAILED') {

							const objPayload = {
								inputs: [{
									id: requestBody.id,
									properties: {
										dealstage: 14514079
									}
								}]
							};

							const objIntegration = integration.get({
								integration: 'netspot',
							})

							if (objIntegration.status == 'SUCCESS') {

								const objToken = oauth.refreshAccessToken({
									clientid: objIntegration.data.clientid,
									clientsecret: objIntegration.data.clientsecret,
									refreshtoken: objIntegration.data.refreshtoken
								})

								if (objToken.status == 'SUCCESS') {

									const resp = https.post({
										url: 'https://api.hubapi.com/crm/v3/objects/deals/batch/update',
										body: JSON.stringify(objPayload),
										headers: {
											'Content-Type': 'application/json',
											'Accept': '*/*',
											'Authorization': 'Bearer ' + objToken.accesstoken
										}
									});

									if (resp.code != 200) {
										retMe.status = 'FAILED';
										retMe.message = resp.code + ':' + resp.body
									}
								}
								else {
									retMe = objToken;
								}
							}

							const nsptNotes = netspot.createNotes({
								notes: {
									data: {
										properties: {
											hs_note_body: nsptOpp.message.name + ': ' + nsptOpp.message.message
										}
									}
								},
								associate: {
									data: {
										to: 'deal',
										toid: requestBody.id,
										type: 'note_to_deal'
									}
								}
							});
						};
					}
					else if (requestBody.associatedObjectType == 'DEAL') {
						retMe = netspot.updateOpportunity(requestBody);
					}
					else {
						retMe = netspot.getHubRequest(requestBody);
					}
				}
				else {

					retMe = {
						status: 'FAILED',
						response: 'ERROR: emtpy request body'
					};

				}
			}
			catch (error) {

				retMe = {
					status: 'FAILED',
					response: 'ERROR: ' + error
				};
			}

			log.audit({
				title: 'doPost',
				details: JSON.stringify(retMe)
			});

			return retMe;
		}

		doDelete = (requestParams) => {

		}

		return {
			'get': doGet,
			put: doPut,
			post: doPost,
			'delete': doDelete
		};

	});
