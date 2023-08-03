
define(['N/record', 'N/query', 'N/url', '../../Helper/srhelper', '../../SuiteBox/api/suitebox'],

function(record, query, url, srhelper, suitebox) {
		
	createPmo = function(data){
		
		try{
			
			const jobRec = query.runSuiteQL({
				query: 'select id, from job where externalid='+'\''+data.id+'\''
			}).asMappedResults();
	    	const emProjManager =  data.fields['projectmanager'].value;
	    	
	    	data.fields['projectmanager'].value = srhelper.empEmailToInternalId(data.fields['projectmanager'].value); 
	    	
            if(data.fields['custentity_sr_project_class'].text == 'All' ){
	    		data.fields['custentity_sr_project_class'].text = 'Operations';
	    	}

	    	if(jobRec.length > 0){
	    		var recProject = record.load({type: record.Type.JOB, isDynamic : true, id: jobRec[0].id });
				recProject.setValue({fieldId: 'customform', value : 53});
				recProject.setValue({fieldId: 'autoname', value : false});
				recProject.setValue({fieldId: 'entityid', value : data.id});
				recProject.setValue({fieldId: 'subsidiary', value : 3});
				recProject.setValue({fieldId: 'jobtype', value : 110});
				recProject.setValue({fieldId: 'projectexpensetype', value : -2});
				recProject.setValue({fieldId: 'allowtime', value : true});
				recProject.setValue({fieldId: 'allowtasktimeforrsrcalloc', value : true});
				recProject.setValue({fieldId: 'isutilizedtime', value : false});
				recProject.setValue({fieldId: 'custentity_unit_type', value : 3});
	    		
	    		for (var fieldId in data.fields) {
	    			
	    			if(data.fields[fieldId].hasOwnProperty('value')){
	    				recProject.setValue({fieldId: fieldId, value: data.fields[fieldId].value});	
	    			}
	    			else if(data.fields[fieldId].hasOwnProperty('text')){
	    				recProject.setText({fieldId: fieldId, text: data.fields[fieldId].text});
	    			}
	    		}
	    		
	    		if(recProject.getValue({fieldId: 'custentity_sr_box_folder_url'}) == null || 
	    				recProject.getValue({fieldId: 'custentity_sr_box_folder_url'}) == ''){

		    		var objFolder = suitebox.createFolder({	
							name: data.id, 
							parent: null
						}, 
						{ 
							record: 'job', 
							id: jobRec[0].id 
					});
		    		if(objFolder.status == 'success'){
		    			
		    			var objCollab = suitebox.addCollab({
							type: 'folder', 
							id: objFolder.id , 
							email: emProjManager,
							role: 'co-owner',
							usertype: 'user'},
							'job'
						);
					}
		    		
		    		const sURL = 'https://servicerocket.app.box.com/folder/' + objFolder.id;
		    		
		    		recProject.setValue({fieldId: 'custentity_sr_box_folder_url', value: sURL});
	    		}
	            
	    	    const id = recProject.save();
	    	    
	    	    var sProjUrl = 'https://3688201.app.netsuite.com/' + url.resolveRecord({
	    	        recordType: record.Type.JOB,
	    	        recordId: id,
	    	        isEditMode: false
	    	    });
	    	    	    	    
	    		return { boxurl : recProject.getValue({fieldId: 'custentity_sr_box_folder_url'}), id: id, projecturl: sProjUrl};
	    		
	    	}
	    	else{
	    		
	    		var recProject = record.create({type: record.Type.JOB, isDynamic : true });
				recProject.setValue({fieldId: 'customform', value : 53});
				recProject.setValue({fieldId: 'autoname', value : false});
				recProject.setValue({fieldId: 'entityid', value : data.id});
				recProject.setValue({fieldId: 'externalid', value : data.id });
				recProject.setValue({fieldId: 'subsidiary', value : 3});
				recProject.setValue({fieldId: 'jobtype', value : 110});
				recProject.setValue({fieldId: 'projectexpensetype', value : -2});
				recProject.setValue({fieldId: 'allowtime', value : true});
				recProject.setValue({fieldId: 'allowtasktimeforrsrcalloc', value : true});
				recProject.setValue({fieldId: 'custentity_unit_type', value : 3});
	    		
	    		for (var fieldId in data.fields) {
	    			
	    			if(data.fields[fieldId].hasOwnProperty('value')){
	    				recProject.setValue({fieldId: fieldId, value: data.fields[fieldId].value});	
	    			}
	    			else if(data.fields[fieldId].hasOwnProperty('text')){
	    				recProject.setText({fieldId: fieldId, text: data.fields[fieldId].text});
	    			}
	    		}
	    		
	    		const idProject = recProject.save();
	    		
	    		var objFolder = suitebox.createFolder({	
						name: data.id, 
						parent: null
					}, 
					{ 
						record: 'job', 
						id: idProject 
					});
	    		
				if(objFolder.status == 'success'){
				
					var objCollab = suitebox.addCollab({
						type: 'folder', 
						id: objFolder.id , 
						email: emProjManager,
						role: 'co-owner',
						usertype: 'user'
					},'job');
				}
	    		
	    	    const stURL = 'https://servicerocket.app.box.com/folder/' + objFolder.id;
	    	    
	    	    var sProjUrl = 'https://3688201.app.netsuite.com/' + url.resolveRecord({
	    	        recordType: record.Type.JOB,
	    	        recordId: idProject,
	    	        isEditMode: false
	    	    });
	             
	    		return { boxurl : stURL, id: idProject, projecturl: sProjUrl};
	    	}
		}
		catch(err){
			return {'message': 'error ' +  err};
		}
	};
	
    return {
    	createPmo : createPmo
    };
    
});
