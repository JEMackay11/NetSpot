/**
 * @NApiVersion 2.1
 */
define(['N/https', '../../../Helper/Integration/integration', './oauth'],

    (https, integration, oauth) => {

        const get = (options) => {

			let output = {};

			try {

				const objIntegration = integration.get({
					integration: options.integration,
				})

				if (objIntegration.status == 'SUCCESS') {

					const objToken = oauth.refreshAccessToken({
						clientid: objIntegration.data.clientid,
						clientsecret: objIntegration.data.clientsecret,
						refreshtoken: objIntegration.data.refreshtoken
					})

					if (objToken.status == 'SUCCESS') {

						const resp = https.get({
							url: objIntegration.data.url + '/' + options.id,
							headers: {
								'Content-Type': 'application/json',
								'Accept': '*/*',
								'Authorization': 'Bearer ' + objToken.accesstoken
							}
						});

						if (resp.code == 200) {

							output.status = 'SUCCESS';
							output.data = JSON.parse(resp.body);
						}
						else {
							output.status = 'FAILED';
							output.message = resp.code + ':' + resp.body
						}
					}
					else {
						output = objToken;
					}
				}
				else {
					output = objIntegration;
				}
			}
			catch (error) {
				output.status = 'FAILED';
				output.message = error
			}

            return output;
        }

		const getOwners = (options) => {

			let output = {};

			try {

				const objIntegration = integration.get({
					integration: options.integration,
				})

				let sEndPoint = 'https://api.hubapi.com/crm/v3/owners/';
				let arrData = []

				if (objIntegration.status == 'SUCCESS') {

					while(sEndPoint != null){

						const objToken = oauth.refreshAccessToken({
							clientid: objIntegration.data.clientid,
							clientsecret: objIntegration.data.clientsecret,
							refreshtoken: objIntegration.data.refreshtoken
						})
	
						if (objToken.status == 'SUCCESS') {
	
							const resp = https.get({
								url: sEndPoint,
								headers: {
									'Content-Type': 'application/json',
									'Accept': '*/*',
									'Authorization': 'Bearer ' + objToken.accesstoken
								}
							});
	
							if (resp.code == 200) {
	
								const objResponse = JSON.parse(resp.body);
								arrData = arrData.concat(objResponse.results);
								output.data = arrData;
								output.status = 'SUCCESS';

								if(objResponse.hasOwnProperty('paging')){
									sEndPoint = JSON.parse(resp.body).paging.next.link;
								}
								else{
									sEndPoint = null;
								}
							}
							else {
								output.status = 'FAILED';
								output.message = resp.code + ':' + resp.body
							}
						}
						else {
							output = objToken;
						}
					}
				}
				else {
					output = objIntegration;
				}
			}
			catch (error) {
				output.status = 'FAILED';
				output.message = error
			}

            return output;
        }

        return {get, getOwners}

    });
