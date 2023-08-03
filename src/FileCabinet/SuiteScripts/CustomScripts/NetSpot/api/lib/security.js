define(['N/record', 'N/crypto', 'N/encode'],
/**
 * @param {crypto} crypto
 * @param {encode} encode
 */
function(record, crypto, encode) {
	
	var TOKEN = {
			type : 'customrecord_hubcard_token',
			field : {
				record : 'custrecord_hct_record',
				email : 'custrecord_hct_email',
				id : '	custrecord_hct_id'
			}
	};
	
	generateTokenRecord = function(params) {
		
		var recToken = record.create({type: TOKEN.type});
			recToken.setValue({
				fieldId: TOKEN.field.record, 
				value: params.associatedObjectType
			});
			
			recToken.setValue({
				fieldId: TOKEN.field.email, 
				value: params.userEmail
			});
			
			recToken.setValue({
				fieldId: TOKEN.field.id, 
				value: params.associatedObjectId
			});
			
		var id = recToken.save();
		
		var idToken = encode.convert({
            string: id,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
		
		return  Math.random().toString(36).slice(-4) + idToken;
	};
	
	getGuid = function (params){
		
		return encode.convert({
            string: params.h + param.token  + params.email,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
		
	};
	
	getSecureHashKey = function(params){
		
		var sToken = params.token;
        var sGuid = getGuid(params);

        var sKey = crypto.createSecretKey({
            guid: sGuid,
            encoding: encode.Encoding.UTF_8
        });

        var hmacSHA512 = crypto.createHmac({
            algorithm: crypto.HashAlg.SHA512,
            key: sKey
        });
        hmacSHA512.update({
            input: sToken,
            inputEncoding: encode.Encoding.BASE_64
        });
        var digestSHA512 = hmacSHA512.digest({
            outputEncoding: encode.Encoding.HEX
        });
        
        
        
        return digestSHA512;
	};
	
	getEmailFiller = function(email){
		var idx = email.indexOf('@');
		return email.substring(idx -1 , idx + 2) ;
	};
	
	validate = function(param){
		
		var b64Token = param.token.substring(4);
		var sKey = param.key;
		
		var idToken = encode.convert({
            string: b64Token,
            inputEncoding: encode.Encoding.BASE_64,
            outputEncoding: encode.Encoding.UTF_8
        });
		
		var recToken = record.load({
			type: TOKEN.type, 
			id : idToken 
		});
		
		
		
		
	};
   
    return {
    	getGuid: getGuid,
    	getSecureHashKey : getSecureHashKey
    };
    
});
