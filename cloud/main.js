require('cloud/app.js');
// This function finds matches for all of the events that do not already match
Parse.Cloud.define("getMatches", function(request, response) {
     
    // Set the query parameters
    var query1 = new Parse.Query("Meals");
	var query2 = new Parse.Query("Meals"); 
	var query3 = new Parse.Query("Meals");
	var query4 = new Parse.Query("Meals");
    var checkSelfQuery = new Parse.Query(Parse.User);
	var user1 = JSON.parse(JSON.stringify(request.user));
	var user1IdString = user1.objectId;
	var user1Id = new Parse.User({objectId:user1IdString});

	//console.log("user1IdString is "+user1IdString);
    checkSelfQuery.equalTo("objectId", user1IdString);
	
    query1.greaterThanOrEqualTo("start", request.params.start);//715 > 6 True
    query1.lessThanOrEqualTo("end", request.params.start);//8:15 < 6 False
    query1.equalTo("type", request.params.type);
    query1.equalTo("matched", false);
	//Check to remove all matches that include yourself
	query1.doesNotMatchQuery("userId", checkSelfQuery);
	
    query2.greaterThanOrEqualTo("start", request.params.end);//7:15 > 11 False
    query2.lessThanOrEqualTo("end", request.params.end);//8:15 < 11 True
    query2.equalTo("type", request.params.type);
    query2.equalTo("matched", false);
	//Check to remove all matches that include yourself
	query2.doesNotMatchQuery("userId", checkSelfQuery);
	
    query3.greaterThanOrEqualTo("start", request.params.start);//7:15 > 6 True
    query3.lessThanOrEqualTo("start", request.params.end);//7:15 < 11 True
    query3.equalTo("type", request.params.type);
    query3.equalTo("matched", false);
	//Check to remove all matches that include yourself
	query3.doesNotMatchQuery("userId", checkSelfQuery);
	
    query4.greaterThanOrEqualTo("end", request.params.start);//8:15 > 6 True
    query4.lessThanOrEqualTo("end", request.params.end);//8:15 < 11 True
    query4.equalTo("type", request.params.type);
    query4.equalTo("matched", false);
	//Check to remove all matches that include yourself
	query4.doesNotMatchQuery("userId", checkSelfQuery);

	var firstQuery = Parse.Query.or(query1,query2);
	var secondQuery = Parse.Query.or(query3,query4);
	var mainQuery = Parse.Query.or(firstQuery,secondQuery);
    
    // Run the query
    mainQuery.find({
        // Success Function - results is an array of Parse Objects matching the query
        success: function(results) {
            if(results.length > 0) {
				console.log("results is "+JSON.stringify(results));
				//console.log("results = "+results);
                // Select a random match
				
                var randMatch = Math.floor(Math.random() * results.length);
				//var user1 = JSON.parse(JSON.stringify(request.user));
				var user2 = JSON.parse(JSON.stringify(results[randMatch]));
				var user2IdString = user2.userId.objectId;
				console.log("Look at This "+user2);
				var mealId2 = user2.objectId;
				var user2Id = new Parse.User({objectId:user2IdString});
 			   	
                // Create a match object
                var Matches = Parse.Object.extend("Matches");
                var match = new Matches();
                var mealId1 = request.params.mealId;
				var user1StartTime = new Date(request.params.start);
				var user2StartTime = user2.start;
				console.log("user1StartTime-> "+user1StartTime);
				console.log("user2StartTime-> "+user2StartTime);
                var finalStartTime = 0;
				if (user1StartTime.get > user2StartTime)
				{
					finalStartTime = user1StartTime;
				}
				else
				{
					finalStartTime = user2StartTime;
				}
				match.set("user1Id", user1Id);
				match.set("user2Id", user2Id);
                match.set("type", request.params.type);
				match.set("mealIdOne",mealId1);
				match.set("mealIdTwo",mealId2);
                match.set("start", finalStartTime);//Doesnt have to be requesters start time, can be buddies time also
				//match.set("user1Id","Nooney");
                
                //console.log(newmatch);
               
                match.save(null, {
                    success: function(result) {
						console.log("Successfully Saved Matches Object");
                    },
                    error: function(result, error) {
						console.log("Error: Get Matches" + error.code + " " + error.message);
                    }
                });
                 
            } else {
                //response.success("No Match");
            }
            response.success();
        },
         
        // Error Function
        error: function(error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
});
 
// This function gets a user's meals for the day
Parse.Cloud.define("getMealsToday", function(request, response) {
    // Set the query parameters
    var begin = new Date();
    begin.setHours(0, 0, 0, 0);
    var end = new Date();
    end.setHours(23, 59, 59, 999);
     
    var query = new Parse.Query("Meals");
    var innerQuery = new Parse.Query(Parse.User);
     
    innerQuery.equalTo("objectId", request.params.objectID);
     
    query.matchesQuery("userId", innerQuery);
    //query.greaterThan("start", begin);
    //query.lessThan("end", end);
     
    // Run the query
    query.find({
     
        // Success
        success: function(results) {
            response.success(JSON.stringify(results));
        },
         
        // Error
        error: function(error) {
            response.error("Error: Get Meals Today " + error.code + " " + error.message);
        }
    });
});
 
// This function changes the Users individual meals by setting matched = true

Parse.Cloud.afterSave("Matches", function(request) {//, response
    var user1Id = request.object.get('user1Id');
    var user2Id = request.object.get('user2Id');
	var mealId1 = request.object.get('mealIdOne');
	var mealId2 = request.object.get('mealIdTwo');
	var matchId = request.object.id;
	var user1 = JSON.parse(JSON.stringify(user1Id));
	var user1IdString = user1.objectId;
	var user2 = JSON.parse(JSON.stringify(user2Id));
	var user2IdString = user2.objectId;
	
    var mealtime = request.object.get('start');
    //console.log("user1Id is "+JSON.stringify(user1Id));
	//console.log("user2Id is "+JSON.stringify(user2Id));
	//console.log("mealtime is "+JSON.stringify(mealtime));
    var query = new Parse.Query("Meals");
    var innerQuery = new Parse.Query(Parse.User);
     
    innerQuery.containedIn("objectId", [user1IdString, user2IdString]);
     
    query.matchesQuery("userId", innerQuery);
	query.containedIn("objectId",[mealId1,mealId2]); 
	
    query.find({
        success: function(results) {
            // Modify the resulting rows and save them
			//console.log(JSON.stringify(results));
			for(var i=0; i<results.length; i++)
			{
				results[i].set("matched",true);
				results[i].set("matchId",matchId);
				results[i].set("start",mealtime);
				results[i].save();
			}
			
        },
        error: function(error) {
            console.log("Error: Matches Before Save " + error.code + " " + error.message);
        }
    });
	
    var pushQuery = new Parse.Query(Parse.Installation);
    var insideQuery = new Parse.Query(Parse.User);
     
    insideQuery.containedIn("objectId", [user1IdString, user2IdString]);
     
    pushQuery.matchesQuery("userId", insideQuery);
     
    Parse.Push.send({
        where: pushQuery,
        data: {
            alert: "A match was found!",
			user1Id: user1IdString,
			user2Id: user2IdString,
			matchId: matchId,
			pushType: "MealMatch",
			sound: "MealMatch.wav"
			
        }
    }, {
        success: function() {
            // Push was successful
        },
        error: function(error) {
            throw "Error: " + error.code + " " + error.message;
        }
    });
	
	//response.success();
});

Parse.Cloud.afterSave("Meals", function(request) {
	
	console.log("Meals After Save Function Called");
	var mealId = request.object.id;
	console.log("mealId is "+mealId);
    // Run the matching algorithm
    Parse.Cloud.run('getMatches', {
        start: request.object.get("start"), 
        end: request.object.get("end"), 
        type: request.object.get("type"),
		mealId: mealId
        }, {        
        success: function(result) {
            console.log("getMatches success!");
            console.log(JSON.stringify(result));
        },
        error: function(error) {
            console.log("Error: " + error.code + " " + error.message);
        }
    });

});
/*
Parse.Cloud.afterSave("Chat", function(request) {
	
	var mealId = request.object.id;
    var pushQuery = new Parse.Query(Parse.Installation);
    var insideQuery = new Parse.Query(Parse.User);
     
    insideQuery.containedIn("objectId", [user1IdString, user2IdString]);
     
    pushQuery.matchesQuery("userId", insideQuery);
     
    Parse.Push.send({
        where: pushQuery,
        data: {
            alert: "A match was found!",
			user1Id: user1IdString,
			user2Id: user2IdString,
			matchId: matchId,
			pushType: "MealMatch",
			sound: "MealMatch.wav"
			
        }
    }, {
        success: function() {
            // Push was successful
        },
        error: function(error) {
            throw "Error: " + error.code + " " + error.message;
        }
    });

});*/

Parse.Cloud.beforeSave("Meals", function(request, response) {
     
    var start = request.object.get("start");
    start = new Date(start);
    //start.setHours(start.getHours()-6);
    request.object.set("start", start);
     
    var end = request.object.get("end");
    end = new Date(end);
    //end.setHours(end.getHours()-6);
    request.object.set("end", end);
    
    response.success();
});
