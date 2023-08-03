/**
 * @NApiVersion 2.1
 */
define(['N/record', '../../../Helper/Integration/integration', '../../../Helper/jsonmapns', '../../../Helper/SuiteQL/suiteql'],

	function (record, integration, jsonmapns, suiteql) {

		create = (options) => {

			var output = {};

			try {
				var objCustomerValidation = validateCustomer({
					companyname: options.companyname
				});
				const objIntegration = integration.get({
					integration: 'customercreate',
				});
				if (objCustomerValidation.status == 'SUCCESS' && objIntegration.status == 'SUCCESS') {
					var objMapping = JSON.parse(objIntegration.data.mapping);
					var recCustomer = record.create({
						type: record.Type.CUSTOMER,
						isDynamic: true
					});

					for (var key in objMapping) {

						recCustomer = jsonmapns.jsonMap({
							mapping: objMapping,
							record: recCustomer,
							data: options,
							key: key
						});
					}
					var idCustomer = recCustomer.save();

					output.status = 'SUCCESS';
					output.id = idCustomer;

				} else {
					const objError = objIntegration.status == 'FAILED' ? objIntegration : objCustomerValidation;
					output.status = objError.status;
					output.message = objError.message;
				}
			}
			catch (error) {

				output.status = 'FAILED';
				output.message = 'ERROR' + error;
			}

			return output;
		};

		validateCustomer = (options) => {
			var objCustomer = {}
			try {
				if (options.companyname != null && options.companyname != undefined && options.companyname !== '') {
					const objResult = suiteql.execute({
						query: `SELECT id
							FROM customer
							WHERE companyname = '${options.companyname}'`
					});
					if (objResult.status == 'SUCCESS') {
						if (objResult.data.length > 0) {
							objCustomer = {
								status: 'FAILED',
								exists: true,
								nsid: objResult.data[0].id,
								message: `ERROR: There seems to be a potential conflict between the NetSuite customers and the Hubspot company records. Company with name ${options.companyname} already exists in NetSuite.`
							};
						} else {
							objCustomer = {
								status: 'SUCCESS',
								exists: false
							};
						}
					} else {
						objCustomer = { status: 'FAILED', message: objResult.message };
					}
				} else {
					objCustomer.status = 'FAILED';
					objCustomer.message = 'ERROR: Company name cannot be empty. Please provide a valid company name in your request.';
				}
			} catch (err) {
				objCustomer = { status: 'FAILED', message: err };
			}

			return objCustomer;
		}

		return {
			create
		};

	});
