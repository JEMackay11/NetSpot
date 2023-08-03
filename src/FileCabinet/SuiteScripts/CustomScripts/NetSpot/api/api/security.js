define(['N/crypto', 'N/encode'],
/**
 * @param {crypto} crypto
 * @param {encode} encode
 */
function(crypto, encode) {
	
	getGuid = function (params){
		
		var sHash = params.h;
		var sEmail = params.email;
		
		return encode.convert({
            string: sHash + params.email,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
		
	};
   
    return {
    	getGuid: getGuid
    };
    
});
