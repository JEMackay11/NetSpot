/**
 * @NApiVersion 2.1
 */

define(['N/https'],

    (https) => {

        const refreshAccessToken = (options) => {

            let retMe = {};

            const resp = https.post({
                body: 'grant_type=refresh_token&client_id={' + options.clientid + '}&client_secret={' + options.clientsecret + '}&refresh_token={' + options.refreshtoken +'}' ,
                url: 'https://api.hubapi.com/oauth/v1/token',
                headers:  { 
                    'Content-Type': 'application/x-www-form-urlencoded', 
                    'Accept': '*/*' 
                },
                credentials: [options.clientid, options.clientsecret, options.refreshtoken]
            });

			if (resp.code == 200) {
                retMe.status = 'SUCCESS';
                retMe.accesstoken = JSON.parse(resp.body).access_token;
		    }
            else{
                const objResp =  JSON.parse(resp.body);
                retMe.status = 'FAILED';
                retMe.message = objResp.status +': ' + objResp.message;
            }

            return retMe;
        };

        return {refreshAccessToken}

    });