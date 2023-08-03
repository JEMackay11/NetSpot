define(['N/record', 'N/https', 'N/search', 'N/url', 'N/format'],
/**
 * @param {record} record
 */
function(record, https, search, url, format) {
	
	var recHub = record.load({type:'customrecord_int_config_hubspot', id: 1});
	
	generateHubPayload = function (newRec){
		
		log.audit({title: 'netspot.generateHubPayload: ' + newRec.id, details: 'entry'});
		
		var objMapping = {};
		
		if(['prospect', 'customer'].indexOf(newRec.type) > -1){
			objMapping = JSON.parse(recHub.getValue({fieldId: 'custrecord_nshs_customer'}).replace(/(\r\n|\n|\r)/gm,' '));
		}
		else if (newRec.type == 'contact'){
			objMapping = JSON.parse(recHub.getValue({fieldId: 'custrecord_nshs_contact'}).replace(/(\r\n|\n|\r)/gm,' '));
		}
		else if (newRec.type == 'opportunity'){
			objMapping = JSON.parse(recHub.getValue({fieldId: 'custrecord_nshs_deal'}).replace(/(\r\n|\n|\r)/gm,' '));
		}
		else if (newRec.type == 'customrecord_atl_marketplace_license'){
			objMapping = JSON.parse(recHub.getValue({fieldId: 'custrecord_nshs_license'}).replace(/(\r\n|\n|\r)/gm,' '));
		}
		
		var objPayload = {};
		objPayload.properties = {};
		
		for (var key in objMapping ) {
			
			if(typeof objMapping[key] != 'object'){
				objPayload.properties[key] = objMapping[key];
			}
			else if(objMapping[key].hasOwnProperty('number')){
				objPayload.properties[key] = objMapping[key].number;
			}
			else if(objMapping[key].hasOwnProperty('value')){
				objPayload.properties[key] = newRec.getValue({fieldId: objMapping[key].value});
			}
			else if(objMapping[key].hasOwnProperty('text')){
				objPayload.properties[key] = newRec.getText({fieldId: objMapping[key].text});
			}
			else if(objMapping[key].hasOwnProperty('epoch')){
				
				if(newRec.getValue({fieldId: objMapping[key].epoch})){
					var dDate =   newRec.getValue({fieldId: objMapping[key].epoch});
					objPayload.properties[key] = dDate.getTime().toString();
				}
				else{
					objPayload.properties[key] = '';
				}
				
				if(objMapping[key].hasOwnProperty('ifnull') && objPayload.properties[key] == ''){
					
					var objIfNull = objMapping[key].ifnull;
					
					if(newRec.getValue({fieldId: objIfNull.epoch})){
						var dDate =  newRec.getValue({fieldId: objIfNull.epoch});
						objPayload.properties[key] = dDate.getTime().toString();
					}
					else{
						objPayload.properties[key] = '';
					}
				}
				
				
			}
			else if(objMapping[key].hasOwnProperty('split')){
				
				var objSplit = objMapping[key].split;
				var sSplitMe = '';
				var sValue = '';
				
				if(objSplit.hasOwnProperty('value')){
					sSplitMe += newRec.getValue({fieldId: objSplit.value});
				}
				else if(objSplit.hasOwnProperty('text')){
					sSplitMe += newRec.getText({fieldId: objSplit.text});
				}
				
				var arrSplit = sSplitMe.split(objSplit.delimiter);
				
				objSplit['return'].forEach(function(ret) {
					
						if(typeof ret == 'number'){
							sValue += arrSplit[ret];
						}
						else if(typeof ret == 'string'){
							
							sValue += ret;
						}
						else if(ret instanceof Array){
							
							var arrSub = ret;
							
							if(arrSub.length > 0 && arrSub.length <= 2){
								
								if(arrSub.length == 1 && arrSub[0] >= 0){
									for (var idx = arrSub[0]; idx < arrSplit.length; idx++) {
										sValue += arrSplit[idx] + objSplit.delimiter;
									}
								}
								else if(arrSub.length == 1 && arrSub[0] < 0){
								
									var nStart = arrSplit.length + arrSub[0];
									
									for (var idx = nStart; idx < arrSplit.length; idx++) {
										sValue += arrSplit[idx] + objSplit.delimiter;
									}
								}
								else if(arrSub.length > 0){
									
									for (var idx =  arrSub[0] ; idx <= arrSub[1]; idx++) {
										sValue += arrSplit[idx] + objSplit.delimiter;
									}
								}
							}
						}
					}
				);
				
				objPayload.properties[key] = sValue.trim();
			}
			else if(objMapping[key].hasOwnProperty('concat')){
				
				var objConcats = objMapping[key].concat;
				var sValue = '';
				
				objConcats.forEach(function(objConcat) {
					
					if(typeof objConcat != 'object'){
						sValue += objConcat;
					}
					else if(objConcat.hasOwnProperty('number')){
						sValue += objConcat.number;
					}
					else if(objConcat.hasOwnProperty('value')){
						sValue += newRec.getValue({fieldId: objConcat.value});
					}
					else if(objConcat.hasOwnProperty('text')){
						sValue += newRec.getText({fieldId: objConcat.text});
					}
				});
				
				objPayload.properties[key] = sValue;
			}
		}
		
		log.audit({title: 'netspot.generateHubPayload: ' + newRec.id, details: 'exit: '+  JSON.stringify(objPayload)});
		
		return objPayload;
	};
	
	generateHubCard = function(requestParams, card){
		
		var src;
		var arrCardInfo = [];
		var newRec;
		
		if(card == 'opportunity'){
			
			src = search.create({type: 'transaction', columns: ['internalid']});
    			src.filters = [];
    			src.filters.push(search.createFilter({name: 'custbody_hubspot_id', operator: 'is', values: requestParams.hs_object_id}));
    			src.filters.push(search.createFilter({name: 'mainline', operator: 'is', values: true}));
    		res = getAllResults(src);
    		
			objMapping = JSON.parse(recHub.getValue({fieldId: 'custrecord_nshs_oppcard'}).replace(/(\r\n|\n|\r)/gm,' '));
		}
		
		res.forEach(function(result) {
			
			newRec = record.load({type: 'opportunity', id: result.id});
			
			var objCardInfo = {};
			var	arrProperties = [];

			for (var key in objMapping ) {
				
				var objProperty = {};
				
				if(typeof objMapping[key] != 'object'){
					objCardInfo[key] = objMapping[key];
				}
				else if(objMapping[key].hasOwnProperty('value')){
					
					if(objMapping[key].hasOwnProperty('property')){

						objProperty.label = objMapping[key].label;
						objProperty.dataType = 'STRING';
						objProperty.value = newRec.getValue({fieldId: objMapping[key].value});
						
						arrProperties.push(objProperty);
					}
					else{
						objCardInfo[key] =  newRec.getValue({fieldId: objMapping[key].value});
					}
				}
				else if(objMapping[key].hasOwnProperty('date')){
					
					var dDate = newRec.getValue({fieldId: objMapping[key].date})

					if(objMapping[key].hasOwnProperty('property')){

						objProperty.label = objMapping[key].label;
						objProperty.dataType = 'STRING';
						objProperty.value = dDate.getFullYear() + '-' + (parseInt(dDate.getMonth()) + 1) + '-' + dDate.getDate();
						
						arrProperties.push(objProperty);
					}
					else{
						objCardInfo[key] =  dDate.getFullYear() + '-' + (parseInt(dDate.getMonth()) + 1) + '-' + dDate.getDate();
					}
				}

				else if(objMapping[key].hasOwnProperty('text')){
					
					if(objMapping[key].hasOwnProperty('property')){

						objProperty.label = objMapping[key].label;
						objProperty.dataType = 'STRING';
						objProperty.value = newRec.getText({fieldId: objMapping[key].text});
						
						log.audit({title: 'generateHubCard', details: JSON.stringify(objCardInfo)});
						
						arrProperties.push(objProperty);
					}
					else{
						objCardInfo[key] = newRec.getText({fieldId: objMapping[key].text});
					}
				}
				else if(objMapping[key].hasOwnProperty('currency')){
					
					
					if(objMapping[key].hasOwnProperty('property')){

						objProperty.label = objMapping[key].label;
						objProperty.dataType = 'CURRENCY';
						objProperty.value = newRec.getValue({fieldId: objMapping[key].currency}).toString();
						objProperty.currencyCode = newRec.getValue({fieldId: 'currencysymbol'});
						
						arrProperties.push(objProperty);
					}
					else{
						objCardInfo[key] =  newRec.getValue({fieldId: objMapping[key].currency});
					}
				}
				
				else if(objMapping[key].hasOwnProperty('concat')){
					
					var objConcats = objMapping[key].concat;
					var sValue = '';
					
					objConcats.forEach(function(objConcat) {
						
						if(typeof objConcat != 'object'){
							sValue += objConcat;
						}
						else if(objConcat.hasOwnProperty('number')){
							sValue += objConcat.number;
						}
						else if(objConcat.hasOwnProperty('value')){
							sValue += newRec.getValue({fieldId: objConcat.value});
						}
						else if(objConcat.hasOwnProperty('text')){
							sValue += newRec.getText({fieldId: objConcat.text});
						}
					});
					
					objCardInfo[key] = sValue;
				}
			}
			
			objCardInfo.link = 'https://3688201.app.netsuite.com' + url.resolveRecord({recordType: 'opportunity', recordId: newRec.id});
			
			objCardInfo.actions = [];
			
			if(requestParams.hs_lastmodifieddate == newRec.getValue({fieldId: 'custbody_hubspot_hs_lastmodifieddate'})){
				objProperty = {};
				objProperty.label = 'Sync Status';
				objProperty.dataType = 'STATUS';
				objProperty.value = 'IN SYNC';
				objProperty.optionType = 'SUCCESS';
				arrProperties.unshift(objProperty);              
			}
			else{
				objProperty = {};
				objProperty.label = 'Sync Status';
				objProperty.dataType = 'STATUS';
				objProperty.value = 'OUT OF SYNC';
				objProperty.optionType = 'DANGER';
				arrProperties.unshift(objProperty);
				
				var objPushAction = {
						   "type":"CONFIRMATION_ACTION_HOOK",
						   "httpMethod":"POST",
						   "uri":"https://us-central1-pmo-408-netsuite-to-hubspot.cloudfunctions.net/netsuite-opportunity-update-1",
						   "label":"Push to NetSuite",
						   "associatedObjectProperties":["dealId"],
						   "confirmationMessage":"Are you sure you want to update this Opportunity in NetSuite?",
						   "confirmButtonText":"Yes",
						   "cancelButtonText":"No"
						};
				objCardInfo.actions.push(objPushAction);
			}
			
			objCardInfo.properties = arrProperties;
			
			
			if(newRec.getValue({fieldId: 'custbody_box_url'}) != ''){
				
				objCardInfo.actions.unshift(
				     		            {
				     		               "type":"IFRAME",
				     		               "width":890,
				     		               "height":748,
				     		               "uri": newRec.getValue({fieldId: 'custbody_box_url'}),
				     		               "label":"View Box Folder",
				     		               "associatedObjectProperties":[]
				     		            }
				     		         );
			}

			arrCardInfo.push(objCardInfo);
		    return true;
		});
				
		//log.audit({title: 'netspot.generateHubCard: ' + hubspotid, details: 'exit: '+  JSON.stringify(arrCardInfo)});
		
		return {results: arrCardInfo};
	};
	
	generateNetSuitePayload = function(newRec, objMapping){
		
		var sMainUrl = recHub.getValue({fieldId: 'custrecord_nshs_endpoint'});
		var sKey = recHub.getValue({fieldId: 'custrecord_nshs_apikey'});
		var objHeader = {'Content-Type': 'application/json', 'Accept': '*/*'};
		
		if(['prospect', 'customer'].indexOf(newRec.type) > -1){
			hsType = 'companies';	
		}
		else if(newRec.type == 'contact'){
			hsType = 'contacts';
		}
		else if(newRec.type == 'opportunity'){
			hsType = 'deals';
		}
		else if(newRec.type == 'customrecord_atl_marketplace_license'){
			hsType = 'timelineevent';
		}
	
		var sUrl = sMainUrl + hsType +'/' + newRec.getValue({fieldId: 'custbody_hubspot_id'}) + '?hapikey=' + sKey;
		var objResp = https.get({url: sUrl, headers: objHeader});
		
		if(objResp.code == 200){
			
			log.audit({ title: 'generateNetSuitePayload', details: 'response: ' + objResp.body});
			
			var objProperties = JSON.parse(objResp.body).properties;
			
			
			for (var key in objMapping ) {
				
				if(objMapping[key].hasOwnProperty('value')){
					newRec.setValue({fieldId: objMapping[key].value, value : objProperties[key]});
				}
				else if(objMapping[key].hasOwnProperty('text')){
					newRec.setText({fieldId: objMapping[key].text, text : objProperties[key]});
				}
				else if(objMapping[key].hasOwnProperty('epoch')){
					var dDate =   new Date(objProperties[key]);
					newRec.setValue({fieldId: objMapping[key].epoch, value : dDate.getTime().toString()});
				}
				else if(objMapping[key].hasOwnProperty('date')){
					
					
					if(objProperties[key].indexOf('.') == -1){
						objProperties[key] = objProperties[key].replace('Z', '.000Z');
					}
					
					var dDate = format.parse({ value: new Date(objProperties[key]), type: format.Type.DATE});
					newRec.setValue({fieldId: objMapping[key].date, value : dDate});
				}
			}
			
			return newRec;
		}
		else{
			return objResp;
		}
		
		
	};
	
	sendHubRequest = function(newRec){
		
		log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'entry'});
		var idHs;
		var fldHsId = '';
		var fldHsUpdate = '';
		var fldHsLogs = '';
		var sMainUrl = recHub.getValue({fieldId: 'custrecord_nshs_endpoint'});
		var sKey = recHub.getValue({fieldId: 'custrecord_nshs_apikey'});
		var objHeader = {'Content-Type': 'application/json', 'Accept': '*/*'};
		var objPropPayload = generateHubPayload(newRec);
		var objPayload = {};
		
		if(['prospect', 'customer'].indexOf(newRec.type) > -1){
			fldHsId = 'custentity_hubspot_id';
			fldHsLogs = 'custentity_nshs_logs';
			hsType = 'companies';	
		}
		else if(newRec.type == 'contact'){
			fldHsId = 'custentity_hubspot_id';
			fldHsLogs = 'custentity_nshs_logs';
			hsType = 'contacts';
		}
		else if(newRec.type == 'opportunity'){
			fldHsId = 'custbody_hubspot_id';
			fldHsLogs = 'custbody_nshs_logs';
			fldHsUpdate = 'custbody_hubspot_hs_lastmodifieddate';
			hsType = 'deals';
		}
		else if(newRec.type == 'customrecord_atl_marketplace_license'){
			hsType = 'timelineevent';
		}
		
		if(hsType == 'timelineevent'){

			//custrecord_nshs_token
			
			log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'Put timeline event'});
			
			sUrl = 'https://api.hubapi.com/integrations/v1/222211/timeline/event';
			
			objPayload = objPropPayload.properties;

			objPayload.timelineIFrame = {
	            "linkLabel": "View in NetSuite",
	            "iframeLabel": "NetSuite",
	            "iframeUri": "https://3688201.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=706&id=" + newRec.id,
	            "width": 800,
	            "height": 600
	        };
			
			var idCompany = objPayload.companyId;
			var idTech = objPayload.techContactId;
			var idBill = objPayload.billContactId;
			var idEvent = objPayload.id;
			
			delete objPayload['companyId'];
			delete objPayload['techContactId'];
			delete objPayload['billContactId'];
			
			objHeader.Authorization = 'Bearer ' + recHub.getValue({fieldId :'custrecord_nshs_token'});
			objPayload.objectId = idTech;
			objPayload.id = idEvent + '-TC';
			
			var objResp = https.put({url: sUrl, body: JSON.stringify(objPayload), headers: objHeader});
			
			if(objResp.code == 200){
				
				log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'Update HS'});
				var objBody = JSON.parse(objResp.body);
			}
			else{
				newRec.setValue({fieldId: 'custentity_nshs_logs', value: objResp.code + ':' + objResp.body});
			}
			
			if(idCompany){
				
				objPayload.objectId = idCompany;
				objPayload.eventTypeId = 1005722;
				objPayload.id = idEvent;
				
				var objResp = https.put({url: sUrl, body: JSON.stringify(objPayload), headers: objHeader});
				if(objResp.code == 200){
					
					log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'Update HS'});
					var objBody = JSON.parse(objResp.body);
				}
				else{
					newRec.setValue({fieldId: 'custentity_nshs_logs', value: objResp.code + ':' + objResp.body});
				}
			}
			
			if(idBill){
				
				objPayload.objectId = idBill;
				objPayload.eventTypeId = 1005723;
				objPayload.id = idEvent + '-BC';
				
				var objResp = https.put({url: sUrl, body: JSON.stringify(objPayload), headers: objHeader});
				if(objResp.code == 200){
					
					log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'Update HS'});
					var objBody = JSON.parse(objResp.body);
				}
				else{
					newRec.setValue({fieldId: 'custentity_nshs_logs', value: objResp.code + ':' + objResp.body});
				}
			}
		}
		else if(((newRec.getValue({fieldId: 'custentity_hubspot_id'}) == '' ||
				newRec.getValue({fieldId: 'custentity_hubspot_id'}) == null) && ['contact', 'prospect', 'customer'].indexOf(newRec.type) > -1) || 
				((newRec.getValue({fieldId: 'custbody_hubspot_id'}) == '' ||
				newRec.getValue({fieldId: 'custbody_hubspot_id'}) == null) && ['opportunity'].indexOf(newRec.type) > -1)){
			

			log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'empty hubspot id'});
			var objNameFilter = {};
			
			if(['prospect', 'customer'].indexOf(newRec.type) > -1){
				objNameFilter.propertyName = 'name';
				objNameFilter.operator = 'EQ';
				objNameFilter.value = objPropPayload.properties.name;
			}
			else if(newRec.type == 'contact'){
				objNameFilter.propertyName = 'email';
				objNameFilter.operator = 'EQ';
				objNameFilter.value = objPropPayload.properties.email;
			}
			else if (newRec.type == 'opportunity'){
				objNameFilter.propertyName = 'dealname';
				objNameFilter.operator = 'EQ';
				objNameFilter.value = objPropPayload.properties.dealname;
			}

			var objSearchPayload = {};
				objSearchPayload.filterGroups = [{'filters': [objNameFilter]}];
				objSearchPayload.limit = 1;
				
			sUrl = sMainUrl + hsType +'/search?hapikey=' + sKey;
			
			var objResp = https.post({url: sUrl, body: JSON.stringify(objSearchPayload), headers: objHeader});
			
			if(objResp.code == 200){
			
				log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'HS searched'});
				
				var objBody = JSON.parse(objResp.body);
				
				if(parseInt(objBody.total) > 0){
					
					log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'Update HS'});
					
					sUrl = sMainUrl + hsType +'/batch/update?hapikey=' + sKey;
					
					objPayload.inputs = [];
					objPayload.inputs.push ({id: objBody.results[0].id, properties: objPropPayload.properties });
						
					var objResp = https.post({url: sUrl, body: JSON.stringify(objPayload), headers: objHeader});
					
					if(objResp.code == 200){
						
						var objBody = JSON.parse(objResp.body);
						var objResult = objBody.results[0];
						idHs =  objResult.id;
						
						newRec.setValue({fieldId: fldHsId, value: idHs});
						newRec.setValue({fieldId: fldHsUpdate, value: new Date(objResult.properties.hs_lastmodifieddate).getTime().toString()});
						
						///Association
						if(newRec.type == 'opportunity'){
							sUrl = sMainUrl + hsType + '/' + idHs + '/associations/companies/' + newRec.getValue({fieldId: 'custbody_hubspot_customer_id'})+'/5?hapikey=' + sKey;
							var objResp = https.put({url: sUrl, headers: objHeader});
						}
					}
					else{
						newRec.setValue({fieldId: fldHsLogs, value: objResp.code + ':' + objResp.body});
					}
				}
				else{
					
					log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'New HS'});
					
					sUrl = sMainUrl + hsType +'?hapikey=' + sKey;
					objPayload = objPropPayload;
					
					var objResp = https.post({url: sUrl, body: JSON.stringify(objPayload), headers: objHeader});
					
					if(objResp.code == 201){
						
						log.audit({title: 'netspot.sendHubRequest: ' + newRec.id , details: 'Created HS'});
						
						var objBody = JSON.parse(objResp.body);
						idHs =  objBody.id;
						newRec.setValue({fieldId: fldHsId, value: idHs});
						newRec.setValue({fieldId: fldHsUpdate, value: new Date(objBody.properties.hs_lastmodifieddate).getTime().toString()});
						
						///Association
						if(newRec.type == 'contact'){
							//sUrl = sMainUrl + hsType + '/' + idHs + '/associations/companies/' + newRec.getValue({fieldId: 'custbody_hubspot_customer_id'})+'/5?hapikey=' + sKey;
							//var objResp = https.put({url: sUrl, headers: objHeader});
						}
						else if(newRec.type == 'opportunity'){
							sUrl = sMainUrl + hsType + '/' + idHs + '/associations/companies/' + newRec.getValue({fieldId: 'custbody_hubspot_customer_id'})+'/5?hapikey=' + sKey;
							var objResp = https.put({url: sUrl, headers: objHeader});
						}
					}
					else{
						newRec.setValue({fieldId: fldHsLogs, value: objResp.code + ':' + objResp.body});
					}
				}
			}
		}
		else{
			
			log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'Update HS'});
			
			sUrl = sMainUrl + hsType +'/batch/update?hapikey=' + sKey;
			
			objPayload.inputs = [];
			objPayload.inputs.push ({id: newRec.getValue({fieldId: fldHsId}), properties: objPropPayload.properties });
			
			var objResp = https.post({url: sUrl, body: JSON.stringify(objPayload), headers: objHeader});
			
			if(objResp.code == 200){
				
				log.audit({title: 'netspot.sendHubRequest: ' + newRec.id, details: 'Update HS'});
				var objBody = JSON.parse(objResp.body);
				var objResult;

				try{
					objResult = objBody.results[0];
					idHs =  objResult.id;
				}
				catch(err){
					//catching errors for response without HS Id.
				}
				
				newRec.setValue({fieldId: fldHsId, value: idHs});
				newRec.setValue({fieldId: fldHsUpdate, value: new Date(objResult.properties.hs_lastmodifieddate).getTime().toString()});
				
				///Association
				if(newRec.type == 'contact'){
					//sUrl = sMainUrl + hsType + '/' + idHs + '/associations/companies/' + newRec.getValue({fieldId: 'custbody_hubspot_customer_id'})+'/5?hapikey=' + sKey;
					//var objResp = https.put({url: sUrl, headers: objHeader});
				}
				else if(newRec.type == 'opportunity'){
					sUrl = sMainUrl + hsType + '/' + idHs + '/associations/companies/' + newRec.getValue({fieldId: 'custbody_hubspot_customer_id'})+'/5?hapikey=' + sKey;
					var objResp = https.put({url: sUrl, headers: objHeader});
				}
			}
			else{
				newRec.setValue({fieldId: fldHsLogs, value: objResp.code + ':' + objResp.body});
			}
		}
		
		return newRec;
	};
		
	getHubRequest = function(requestBody) {

		var src;
		var rec;
		var retMe;
		
		if(requestBody.associatedObjectType = 'DEAL'){
			
			if(requestBody.associatedObjectId != undefined && requestBody.associatedObjectId != ''){
				src = search.create({type: 'transaction', columns: ['internalid']});
					src.filters = [];
					src.filters.push(search.createFilter({name: 'custbody_hubspot_id', operator: 'is', values: requestBody.associatedObjectId}));
					src.filters.push(search.createFilter({name: 'mainline', operator: 'is', values: true}));
				res = getAllResults(src);
	
				objMapping = JSON.parse(recHub.getValue({fieldId: 'custrecord_hsns_deal'}).replace(/(\r\n|\n|\r)/gm,' '));
			
				if(res.length > 0){
					
					rec = record.load({type: 'opportunity', id: res[0].id });
					rec = generateNetSuitePayload(rec, objMapping);
					var id = rec.save();
					
					retMe = {'message': 'Deal Updated Successfully. Please Refresh!'};
					
				}
				else{
					retMe = {'error': 'associatedObjectId is missing' };
				}
			}
			else{
				retMe = {'error': 'associatedObjectId is missing' };
			}
		}
		else{
			retMe = {'message': 'no existing mapping' };
		}
		
		return retMe;
		
	};
	
	generateToken = function() {
		
		var recToken = record.load({type:'customrecord_netspot', id: 1});
		var objHeader = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': '*/*'}; 
		var sUrl = 'https://api.hubapi.com/oauth/v1/token';
		var data = 'grant_type=authorization_code&client_id=' + recToken.getValue({fieldId: 'custrecord_ntspt_clientid'}) + '&client_secret='+ recToken.getValue({fieldId: 'custrecord_ntspt_clientsec'}) + 
					'&redirect_uri=https%3A%2F%2F3551004.extforms.netsuite.com%2Fapp%2Fsite%2Fhosting%2Fscriptlet.nl%3Fscript%3D419%26deploy%3D1%26compid%3D3551004%26h%3Dbb3bb1d735c6b9e3e7fe&code=' + recToken.getValue({fieldId: 'custrecord_ntspt_code'});

		var objResp = https.post({url: sUrl, body: data, headers: objHeader});

		if (objResp.code == 200) {
			var objTokens = JSON.parse(objResp.body);
			recToken.setValue({fieldId: 'custrecord_ntspt_refresh_token', value: objTokens.refresh_token});
			recToken.setValue({fieldId: 'custrecord_ntspt_access_token', value: objTokens.access_token});
			recToken.save();
		}
	};
	
	refreshToken = function() {
		
		var recToken = record.load({type:'customrecord_int_config_hubspot', id: 1});
		var objHeader = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': '*/*'}; 
		var sUrl = 'https://api.hubapi.com/oauth/v1/token';
		var data = 'grant_type=refresh_token&client_id=' + recToken.getValue({fieldId: 'custrecord_nshs_clientid'}) + '&client_secret='+ recToken.getValue({fieldId: 'custrecord_nshs_clientsecret'}) + 
					'&refresh_token=' + recToken.getValue({fieldId: 'custrecord_nshs_refreshtoken'});
		
		var objResp = https.post({url: sUrl, body: data, headers: objHeader});
		
		if (objResp.code == 200) {
			var objTokens = JSON.parse(objResp.body);
			recToken.setValue({fieldId: 'custrecord_nshs_token', value: objTokens.access_token});
			recToken.save();
		}
	};
	
	getAllResults = function(s) {
        var results = s.run();
        var searchResults = [];
        var searchid = 0;
        do {
            var resultslice = results.getRange({start:searchid,end:searchid+1000});
            resultslice.forEach(function(slice) {
                searchResults.push(slice);
                searchid++;
                }
            );
        } while (resultslice.length >=1000);
        return searchResults;
    } 
	
	
    return {
    	sendHubRequest: sendHubRequest,
    	getHubRequest: getHubRequest,
    	generateHubCard: generateHubCard,
    	generateToken: generateToken,
    	refreshToken: refreshToken
    };
    
});

