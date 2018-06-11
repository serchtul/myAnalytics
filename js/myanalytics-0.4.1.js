/*
======================================================================
myAnalytics v0.4.1
myanalytics-0.4.1.js
NOW it uses JS Promises! Includes functions for:
-Process Time
-Conversion Rate
-Basic Analytics
By: Sergio García [https://github.com/secasema/myAnalytics]

Please note that this is not meant to be a standalone script, instead
it is meant to be used with the html view. I do know that the callback
functions can be separated from the logic and thus the code can be
modified to be standalone, but I just decided not to, as it was not in
my original plans to release this to the world.

(Still, you are very much encouraged to tweak the code to fit your
very own needs and purpose :D)

Distributed under the MIT License
======================================================================
*/

//TO-DO sometime: - csv exports (maybe even xlsx export)
//                - proper documentation (lol :P)
//                - saving user preferences (last query, in cookies)

//Global request variables (retrieved from html view)
var req_entity = 1589; //Mexico as starting EY.
var req_start_date,req_end_date;
var access_token;
var total_items;
var retrieved_items;
var timer = null;

//Constants used by EXPA's API v2
//  ->type = ["opportunity"|"person"] (Corresponding to ICX and OGX respectively)
//  ->programme = [1|2] (Corresponding to GC and GT respectively)
const names = Object.freeze({
	iGT: {"name":"iGT", "type" : "opportunity", "programme": 2},
	oGT: {"name":"oGT", "type" : "person", "programme": 2},
	iGV: {"name":"iGV", "type" : "opportunity", "programme": 1},
	oGV: {"name":"oGV", "type" : "person", "programme": 1},
	iGE: {"name":"iGE", "type" : "opportunity", "programme": 5},
	oGE: {"name":"oGE", "type" : "person", "programme": 5},
});

access_token = getCookie("access_token");


/*
======================================================================
      Main function. To be loaded when on document 'ready' event      
======================================================================
*/

function callFunction(fn,fn2) {
	//Pre-loads default settings
	presetDate("thisyear");

	//Looks for an existent token from cookies
	if(getCookie("access_token")) {
		$("#atoken").val(getCookie("access_token")); //Gets the cookie, even if invalid
		//TO-DO: Check with API whether token is still valid and not use it in that case
		
		//Submit an analytics request
		analyticsreq(fn,fn2);
	}

	//Attach an event handler when Submit button gets a new request
	$("#submitbtn").click(function (){
		if(timer == null) {
			timer = setInterval(() => {
				$("#submitbtn").trigger( "click" );
			},10*60*1000); //refresh results every 10 minutes
		}
		analyticsreq(fn,fn2); //Submit an analytics request
	});

	//TO-DO: Either respond to "GET" analytics requests, or attach event to "Enter" keystroke
}

/*
======================================================================
                         Auxiliary functions                          
======================================================================
*/


/* 
 * cleanup
 *  
 * Description:
 * Cleans up all variables in order for a new request to take place
 * 
 */

function cleanup(){
	document.getElementById("results").tBodies[0].innerHTML = ""; //Cleans up table rows except for headers
	$("th[data-sorted='true']").removeAttr("data-sorted-direction")
	$("th[data-sorted='true']").attr('data-sorted','false');

	document.getElementById("statusbar").innerHTML = "Last Updated: "+new Date().toTimeString();

	Sortable.init(); //External Sortable library from Hubspot
}


/* 
 * generalreq
 *  
 * Description:
 * Performs GET request with the specified callback. Failures are handled as a general feature
 * 
 * @params: {string} url - The url to be used for the GET HTTP request
 * @params: {Object} params - The parameters to be send alongside the url
 * @params: {callback} callback - The callback function to be called upon success
 */

function generalreq(url,params,callback,resolve,reject) {
	$.get(url,params,callback).fail(reject);
}

/* 
 * analyticsreq
 *  
 * Description:
 * Triggers analytics request for the children of the specified entity.
 */

function analyticsreq(fn1,fn2){

	//Get variable values from the HTML Form
	//TO-DO: Maybe add some field validation (?) [Not sure how necessary though]
	req_entity = $("#ey").val();
	req_start_date = $("#fini").val();
	req_end_date = $("#ffin").val();
	aux_token = $("#atoken").val();
	if(aux_token != ""){ //Check's the access token field
		access_token = aux_token;
		//If there's not a cookie yet, then set one for a third of a day
		//Note-to-self: How convenient is to have this for a third of a day? What's the ideal time?
		if(!getCookie("access_token"))
			setCookie("access_token",access_token,1/3); 
	}

	if(!access_token) { //If there's no access token send an error to the user and do nothing
		$('#statusbar').html("Error: Please provide an access token.");
	}
	else if(req_entity == -1) { //User requested all entitites
		total_items = 28; //There's a total of 28 retrievable objects (7 for each region)
		retrieved_items = 0;

		var reqs = [{"region":1632},{"region":1630},{"region":1629},{"region":1627}];

		reqs.forEach(el => {
			el.promise = new Promise((resolve,reject) => baseAsyncReq(access_token,el.region,fn1,resolve,reject));
		});

		Promise.all(reqs.map(el => el.promise)).then(regions => {
			console.log("Regions done!");
			
			var regions_info = [];

			regions.forEach(arr => {
				arr.forEach((data,id) => {
					if(data!=undefined) {
						regions_info[id] = data;
					}
				});
			});

			//Cleans layout for showing results
			cleanup();
			fn2(regions_info);
			$( "#eysort" ).trigger( "click" );
			$( "#total-apd" ).trigger( "click" );
		},msg => console.error(msg));

	}
	else if(req_entity === 'lcs_americas') { //User requested all LCs Americas
		retrieved_items = 0;

		//This is harcoded MCs in Americas, it's better to update a store regularly in the search for new MCs (or deleting obsolete ones)
		var mcs = [{"id":30,"name":"Barbados"},{"id":2107,"name":"Cuba"},{"id":178,"name":"Nicaragua"},{"id":2339,"name":"Haiti"},{"id":1553,"name":"Peru"},{"id":1557,"name":"Venezuela"},{"id":1538,"name":"Puerto Rico"},{"id":1535,"name":"Argentina"},{"id":1566,"name":"Chile"},{"id":1589,"name":"Mexico"},{"id":2108,"name":"Honduras"},{"id":1556,"name":"Guatemala"},{"id":1582,"name":"Panama"},{"id":1593,"name":"Bolivia"},{"id":1614,"name":"Uruguay"},{"id":177,"name":"Paraguay"},{"id":1621,"name":"United States"},{"id":577,"name":"Costa Rica"},{"id":1606,"name":"Brazil"},{"id":1599,"name":"Dominican Republic"},{"id":1572,"name":"El Salvador"},{"id":1567,"name":"Ecuador"},{"id":1554,"name":"Canada"},{"id":1551,"name":"Colombia"}];
		total_items = mcs.length*7;

		Promise.all(mcs.map(el => new Promise((resolve,reject) => baseAsyncReq(access_token,el.id,fn1,resolve,reject)))).then(regions => {
			console.log("MCs done!");
			
			var regions_info = [];

			regions.forEach(arr => {
				arr.forEach((data,id) => {
					if(data!=undefined) {
						regions_info[id] = data;
					}
				});
			});

			//Cleans layout for showing results
			cleanup();
			fn2(regions_info);
			$( "#eysort" ).trigger( "click" );
			$( "#total-apd" ).trigger( "click" );
		},msg => console.error(msg));

	}
	else { //There's an access token & it's a normal request
		total_items = 7; //There's a total of 7 retrievable objects (6 Xers + LCs)
		retrieved_items = 0;


		var reqPromise = new Promise((resolve,reject) => baseAsyncReq(access_token,req_entity,fn1,resolve,reject));
		
		reqPromise.then(eys_info => {
			//Cleans layout for showing results
			cleanup();
			fn2(eys_info);
			$( "#eysort" ).trigger( "click" );
			$( "#total-apd" ).trigger( "click" );
		},msg => console.error(msg));

		$('#statusbar').html("Loading... (0%)");
	}

}

function baseAsyncReq(access_token,ey,indreq,res,rej) {
	var iGVpromise,iGTpromise,iGEpromise,oGVpromise,oGTpromise,oGEpromise,EYpromise;
	var scope= {
		error:false
	};

	//Calls up a general data request to the API for each product
	iGVpromise = new Promise((resolve,reject) => indreq(access_token,ey,names.iGV,resolve,reject)).then(showProgress.bind(scope));
	iGTpromise = new Promise((resolve,reject) => indreq(access_token,ey,names.iGT,resolve,reject)).then(showProgress.bind(scope));
	iGEpromise = new Promise((resolve,reject) => indreq(access_token,ey,names.iGE,resolve,reject)).then(showProgress.bind(scope));
	oGVpromise = new Promise((resolve,reject) => indreq(access_token,ey,names.oGV,resolve,reject)).then(showProgress.bind(scope));
	oGTpromise = new Promise((resolve,reject) => indreq(access_token,ey,names.oGT,resolve,reject)).then(showProgress.bind(scope));
	oGEpromise = new Promise((resolve,reject) => indreq(access_token,ey,names.oGE,resolve,reject)).then(showProgress.bind(scope));
	EYpromise = new Promise((resolve,reject) => reqeys(access_token,ey,resolve,reject)).then(showProgress.bind(scope));


	//If all request promises are fulfilled show information, if not, show error in status bar and console
	Promise.all([EYpromise,iGVpromise,iGTpromise,iGEpromise,oGVpromise,oGTpromise,oGEpromise]).then(values => {
		let eys_info = values.shift(); //Get EY names as a base for the array.

		//Form array with all information required.
		values.forEach(el => {
			el.forEach((data,id) => {
				if(data!=undefined && eys_info[id]!=undefined) {
					$.extend(eys_info[id], data); //Maybe find a vanilla.js function later (?)
				}
			});
		});
		console.info("Success!");
		if(res) {
			res(eys_info); 
		}
	},xhr => {

		console.info(xhr);
		error_text = xhr.status == 401
		? "Access token is invalid. Try again with another one." + (setCookie("access_token","",-1)||"")
		: "EXPA hates you, thus your request failed :C Please try again.";

		scope.error=true;
		$('#statusbar').html(error_text);

		console.info("failure :C");
		if(rej) {
			rej(error_text);
		}
		else {
			console.warn("No Reject for main promise");
		}
	});
}

function reqeys(access_token,ey,resolve,reject){
	if(ey==-1) {
		req_entity = ey;
		console.log("Empty request")
	}
	else {
		var url = "https://gis-api.aiesec.org/v2/committees/"+ey+".json"; //Changed to use V2
		generalreq(url,{"access_token" : access_token},function (data){
			console.log("Retrieved LC names");

			resolve(formatEYs(data));
		},resolve,reject);
	}
}

function showProgress(data) {
	if(this.error === false) {
		$('#statusbar').html("Loading... ("+getPercentage()+"%)");
	}
	else {
		console.warn("Error in showProgress function");
	}
	return data;
}

function reqprocess(access_token,ey,selected,resolve,reject){
	var type = selected.type;
	var programme = selected.programme;
	var name = selected.name;


	//console.log("Entered Data Request");

	var url = "https://gis-api.aiesec.org/v2/applications/analyze.json";
	var params = {
		"access_token" : access_token,
		"start_date" : req_start_date,
		"end_date" : req_end_date,
		"process_time[home_office_id]" : ey,
		"process_time[type]" : type,
		"programmes[]" : programme,
	}
	//console.log(params);
	generalreq(url,params,function (data){

		//$('#statusbar').html("Loading... ("+getPercentage()+"%)");
		console.log("Retrieved "+name);

		resolve(formatTimeAnalytics(data,name));
	},resolve,reject);
}

function reqdata(access_token,ey,selected,resolve,reject){
	var type = selected.type;
	var programme = selected.programme;
	var name = selected.name;


	//console.log("Entered Data Request");

	var url = "https://gis-api.aiesec.org/v2/applications/analyze.json";
	var params = {
		"access_token" : access_token,
		"start_date" : req_start_date,
		"end_date" : req_end_date,
		"basic[home_office_id]" : ey,
		"basic[type]" : type,
		"programmes[]" : programme,
	}
	//console.log(params);
	generalreq(url,params,function (data){

		console.log("Retrieved "+name);

		resolve(formatAnalytics(data,name));
	},resolve,reject);
}

function getPercentage(){
	//Uses global variables
	return Math.round(++retrieved_items/total_items*100);
}

function formatTimeAnalytics(data,programme){
	//Check format analytics.children.buckets (Array)
	//key,doc_count, total_an_accepted (unique_profiles),total_applications (applicants),total_approvals,total_completed,total_matched,total_realized
	//total_x => doc_count

	var res = [];

	try {
		var arr = data.analytics.children.buckets;
		console.log(arr[0]);
		for (var i = arr.length - 1; i >= 0; i--) {
			if(res[arr[i].key] == undefined)
				res[arr[i].key] = {};
			res[arr[i].key][programme+"_acc"] = arr[i].acceptance_time;
			res[arr[i].key][programme+"_apd"] = arr[i].approval_time;
			res[arr[i].key][programme+"_re"] = arr[i].delivery_time;
		}
	}
	catch(err){
		$('#errorbar').html("Hubo un error interno! :S");
		console.error("formatAnalytics failed for "+programme+": "+err);
	}
	finally {
		return res;
	}
}

function formatAnalytics(data,programme){
	//Check format analytics.children.buckets (Array)
	//key,doc_count, total_an_accepted (unique_profiles),total_applications (applicants),total_approvals,total_completed,total_matched,total_realized
	//total_x => doc_count

	var res = [];

	try {
		var arr = data.analytics.children.buckets;
		console.log(arr[0]);
		for (var i = arr.length - 1; i >= 0; i--) {
			if(res[arr[i].key] == undefined)
				res[arr[i].key] = {};
			res[arr[i].key][programme+"_app_unique"] = arr[i].total_applications.applicants.value;
			res[arr[i].key][programme+"_acc_unique"] = arr[i].total_matched.unique_profiles.value;
			res[arr[i].key][programme+"_ap"] = arr[i].total_approvals.doc_count;
			res[arr[i].key][programme+"_re"] = arr[i].total_realized.doc_count;
			res[arr[i].key][programme+"_fin"] = arr[i].total_finished.doc_count;
			res[arr[i].key][programme+"_co"] = arr[i].total_completed.doc_count;
		}
	}
	catch(err){
		$('#errorbar').html("Hubo un error interno! :S");
		console.error("formatAnalytics failed for "+programme+": "+err);
	}
	finally {
		return res;
	}
}

function formatEYs(data){
	var res = [];

	try {
		var arr = data.suboffices;
		for (var i = arr.length - 1; i >= 0; i--) {
			if(res[arr[i].id] == undefined)
				res[arr[i].id] = {};
			res[arr[i].id].name = arr[i].name;
		}
	}
	catch(err){
		$('#statusbar').html("There was an error with the request! :S");
	}
	finally {
		return res;
	}
}

function populate(data,programme){
	//Check format analytics.children.buckets (Array)
	//key,doc_count, total_an_accepted (unique_profiles),total_applications (applicants),total_approvals,total_completed,total_matched,total_realized
	//total_x => doc_count
	try {
		var arr = data.analytics.children.buckets;
		for (var i = arr.length - 1; i >= 0; i--) {
			if(eys_array[arr[i].key] == undefined)
				eys_array[arr[i].key] = {};
			eys_array[arr[i].key][programme+"_ap"] = arr[i].total_approvals.doc_count;
			eys_array[arr[i].key][programme+"_re"] = arr[i].total_realized.doc_count;
		}
		retrieved[programme] += 1;
	}
	catch(err){
		$('#statusbar').html("Hubo un error interno! :S");
	}
}

function populateLCs(data){
	try {
		var arr = data.suboffices;
		for (var i = arr.length - 1; i >= 0; i--) {
			if(eys_array[arr[i].id] == undefined)
				eys_array[arr[i].id] = {};
			eys_array[arr[i].id].name = arr[i].name;
		}
		retrieved.name += 1;
	}
	catch(err){
		$('#statusbar').html("Hubo un error interno! :S");
	}
}

function showTimeResults(a){
	for (var i = a.length - 1; i >= 0; i--) { //For all EYs inside the bucket
		if(a[i]!=undefined && i!=req_entity) {
			var tres = document.getElementById("results").tBodies.item(0);
			var newrow = tres.insertRow(-1);
			var col;
			//Creates new rows with data from all EYs and inserts it in the right order
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].name;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGV_acc||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGV_apd||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGV_re||0;

			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGT_acc||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGT_apd||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGT_re||0;

			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGE_acc||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGE_apd||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].iGE_re||0;

			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGV_acc||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGV_apd||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGV_re||0;

			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGT_acc||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGT_apd||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGT_re||0;

			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGE_acc||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGE_apd||0;
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].oGE_re||0;
		}
	}
	//$('#statusbar').html("");
	var exampleTable = document.querySelector('table#results')
	Sortable.init(); //Restarts sortable script
}

function showConversionResults(a){
	console.log(a)
	for (var i = a.length - 1; i >= 0; i--) { //For all EYs inside the bucket
		if(a[i]!=undefined && i!=req_entity) {
			var tres = document.getElementById("results").tBodies.item(0);
			var newrow = tres.insertRow(-1);
			var col;
			//Creates new rows with data from all EYs and inserts it in the right order
			col = newrow.insertCell(-1);
			col.innerHTML=a[i].name;

			//For each product
			//Step 1: Make sure both values are defined. If not, mark as unavailable i.e.:"-"
			//Step 2: If dividend is cero, mark as unavailable i.e.:"-"
			//Step 3: If neither of above, do the division and put it as a value.
			//Step 4: AddClassName to cell

			fDiv = (a,b) => {
				return a&&b?(b!=0?new Number(a/b*100).toFixed(2)+"%":"-"):"-";
			}; //Function to format division

			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGV_acc_unique,a[i].iGV_app_unique);
			col.classList.add("iGV");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGV_ap,a[i].iGV_acc_unique);
			col.classList.add("iGV");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGV_re,a[i].iGV_ap);
			col.classList.add("iGV");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGV_co,a[i].iGV_fin);
			col.classList.add("iGV");
			toggle('iGV');

			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGT_acc_unique,a[i].iGT_app_unique);
			col.classList.add("iGT");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGT_ap,a[i].iGT_acc_unique);
			col.classList.add("iGT");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGT_re,a[i].iGT_ap);
			col.classList.add("iGT");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGT_co,a[i].iGT_fin);
			col.classList.add("iGT");
			toggle('iGT');

			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGE_acc_unique,a[i].iGE_app_unique);
			col.classList.add("iGE");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGE_ap,a[i].iGE_acc_unique);
			col.classList.add("iGE");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGE_re,a[i].iGE_ap);
			col.classList.add("iGE");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].iGE_co,a[i].iGE_fin);
			col.classList.add("iGE");
			toggle('iGE');

			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGV_acc_unique,a[i].oGV_app_unique);
			col.classList.add("oGV");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGV_ap,a[i].oGV_acc_unique);
			col.classList.add("oGV");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGV_re,a[i].oGV_ap);
			col.classList.add("oGV");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGV_co,a[i].oGV_fin);
			col.classList.add("oGV");
			toggle('oGV');

			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGT_acc_unique,a[i].oGT_app_unique);
			col.classList.add("oGT");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGT_ap,a[i].oGT_acc_unique);
			col.classList.add("oGT");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGT_re,a[i].oGT_ap);
			col.classList.add("oGT");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGT_co,a[i].oGT_fin);
			col.classList.add("oGT");
			toggle('oGT');

			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGE_acc_unique,a[i].oGE_app_unique);
			col.classList.add("oGE");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGE_ap,a[i].oGE_acc_unique);
			col.classList.add("oGE");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGE_re,a[i].oGE_ap);
			col.classList.add("oGE");
			col = newrow.insertCell(-1);
			col.innerHTML=fDiv(a[i].oGE_co,a[i].oGE_fin);
			col.classList.add("oGE");
			toggle('oGE');


		}
	}
	//$('#statusbar').html("");
	var exampleTable = document.querySelector('table#results')
	Sortable.init(); //Restarts sortable script
}



function showResults(a){
	if(true){ //There used to be a condition here, but using promises makes it overhead
		for (var i = a.length - 1; i >= 0; i--) { //For all EYs inside the bucket
			if(a[i]!=undefined && i!=req_entity) {
				var tres = document.getElementById("results").tBodies.item(0);
				var newrow = tres.insertRow(-1);
				var col;
				//Creates new rows with data from all EYs and inserts it in the right order
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].name;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGV_ap||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGT_ap||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGE_ap||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGV_ap||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGT_ap||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGE_ap||0;
				col = newrow.insertCell(-1);
				col.innerHTML=(a[i].iGT_ap||0)+(a[i].oGT_ap||0)+(a[i].iGV_ap||0)+(a[i].oGV_ap||0)+(a[i].iGE_ap||0)+(a[i].oGE_ap||0);

				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGV_re||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGT_re||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGE_re||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGV_re||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGT_re||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGE_re||0;
				col = newrow.insertCell(-1);
				col.innerHTML=(a[i].iGT_re||0)+(a[i].oGT_re||0)+(a[i].iGV_re||0)+(a[i].oGV_re||0)+(a[i].iGE_re||0)+(a[i].oGE_re||0);

				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGV_fin||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGT_fin||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGE_fin||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGV_fin||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGT_fin||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGE_fin||0;
				col = newrow.insertCell(-1);
				col.innerHTML=(a[i].iGT_fin||0)+(a[i].oGT_fin||0)+(a[i].iGV_fin||0)+(a[i].oGV_fin||0)+(a[i].iGE_fin||0)+(a[i].oGE_fin||0);

				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGV_co||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGT_co||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].iGE_co||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGV_co||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGT_co||0;
				col = newrow.insertCell(-1);
				col.innerHTML=a[i].oGE_co||0;
				col = newrow.insertCell(-1);
				col.innerHTML=(a[i].iGT_co||0)+(a[i].oGT_co||0)+(a[i].iGV_co||0)+(a[i].oGV_co||0)+(a[i].iGE_co||0)+(a[i].oGE_co||0);
			}
		}
		//$('#statusbar').html("");
		var exampleTable = document.querySelector('table#results')
		Sortable.init(); //Restarts sortable script
	}
}

/* 
 * setCookie
 *  
 * Description:
 * Auto-fills the start date and end date fields of the user view with the most used date ranges
 * 
 * @params: {string} cname - the name of the cookie
 * @params: {string} cvalue - the value of the cookie
 * @params: {string} cdays - the number of days in which the cookie will expire
 */

function setCookie(cname, cvalue, exdays) {
	//Note: Retrieved from W3CSchool. This can only hold 1 cookie, right?
	console.log("Set cookie executed");
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return null;
}

/* 
 * presetDate
 *  
 * Description:
 * Auto-fills the start date and end date fields of the user view with the most used date ranges
 * 
 * @params: {string} value - A string representing a pre-settable Date
 *                         Currently supporting:
 *                           - This week so far
 *                           - This month so far
 *                           - This year so far
 *                           - This MC term so far
 *                           - Last week
 *                           - Last month
 *                         Coming soon (to be defined):
 *                           - This Q so far
 *                           - Last MC term
 */

function presetDate(value){
	var currdate = new Date(); //Get current Datetime (local time, not UTC)
	var start,end;

	switch(value){
		case "thisweek": //Note: Week starts on monday for the purposes of the program
			//Calculate how many days of the week have passed since monday
			var days = currdate.getDay()-1;
			if(days==-1) //If getDay is Sunday [0] (i.e. days==-1)
				days=6; //Then 6 days have passed since monday

			//Start date is Monday of that week
			//(i.e. substract to current day the number of days since monday)
			start = new Date(currdate);
			start.setDate(start.getDate()-days);

			document.getElementById("fini").value = formatDate(start);
			document.getElementById("ffin").value = formatDate(currdate); //End date is current date
			break;
		case "lastweek":
			//Calculate how many days of the week have passed since monday
			var days = currdate.getDay()-1;
			if(days==-1) //If getDay is Sunday [0] (i.e. days==-1)
				days=6; //Then 6 days have passed since monday

			//Start date is Monday of LAST week (Hence the minus 7)
			start = new Date(currdate);
			start.setDate(start.getDate()-days-7);

			//End date is Sunday of last week (Start date plus 6 days)
			end = new Date(start);
			end.setDate(end.getDate()+6);

			document.getElementById("fini").value = formatDate(start);
			document.getElementById("ffin").value = formatDate(end);
			break;
		case "thisyear":
			//Start date is February the 1st of this year (we change month and date)
			start = new Date(currdate); //This year info (oversimplified)
			start.setDate(1); //1st of
			start.setMonth(1); //February

			document.getElementById("fini").value = formatDate(start);
			document.getElementById("ffin").value = formatDate(currdate); //End date is current date
			break;
		case "thismc":
			//Start date is the August 1st that's closer in the past (either this year or last year,
			//depending on whether request is made after/during August this year or before that)
			
			//Set start Date to be August the 1st of this year
			start = new Date(currdate); //This year info (oversimplified)
			start.setDate(1); //1st of
			start.setMonth(7); //August
			//If August the 1st hasn't happened yet
			if(start > currdate)
				start.setFullYear(start.getFullYear()-1); //Then set it to last year's

			document.getElementById("fini").value = formatDate(start);
			document.getElementById("ffin").value = formatDate(currdate);
			break;
		case "thismonth":
			start = new Date(currdate); //This month and year info (oversimplified)
			start.setDate(1); //1st day of the month

			document.getElementById("fini").value = formatDate(start);
			document.getElementById("ffin").value = formatDate(currdate); //End date is current date
			break;	
		case "lastmonth":
			//TO-DO: Verify whether this works on January (it should, given that the bit down below does)
			
			//Set the start date to be the 1st day of last month
			start = new Date(currdate);
			start.setDate(1);
			start.setMonth(start.getMonth()-1);

			//This next use of the setDate method, I find very cool. Setting the date of the currdate
			//object to be zero causes the date to be set to "one day before the first day of the month",
			//which in turn leads to the date being the last day of the previous month. B)
			end = new Date(currdate);
			end.setDate(0); //Sets the date to the last day of the previous month

			document.getElementById("fini").value = formatDate(start);
			document.getElementById("ffin").value = formatDate(end);
			break;
		case "today":
			//TO-DO: Verify whether this works on January (it should, given that the bit down below does)
			
			//Set the start date to be the 1st day of last month
			start = new Date(currdate);
			end = start;

			document.getElementById("fini").value = formatDate(start);
			document.getElementById("ffin").value = formatDate(end);
			break;
	}

	function formatDate(d){
		return d.getFullYear()+"-"+(d.getMonth()<9?"0":"")+(d.getMonth()+1)+"-"+(d.getDate()<10?"0":"")+d.getDate();
	}
}
