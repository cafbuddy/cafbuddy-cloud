require('cloud/app.js');
// This function finds matches for all of the events that do not already match
Parse.Cloud.define("getMatches", function(request, response) {
     
    // Set the query parameters
    var query1 = new Parse.Query("Meals");
	var query2 = new Parse.Query("Meals"); 
    var innerQuery = new Parse.Query(Parse.User);
	var user1 = JSON.parse(JSON.stringify(request.user));
	var user1IdString = user1.objectId;
	var user1Id = new Parse.User({objectId:user1IdString});
	//var user1Id = request.user.objectId;
    innerQuery.equalTo("objectId", user1IdString);
	
	//Added Conditions to eliminate meal objects made by the requesting user
	query1.doesNotMatchQuery("userId", innerQuery);
	
    query1.greaterThanOrEqualTo("start", request.params.start);
    query1.lessThanOrEqualTo("end", request.params.end);
    query1.equalTo("type", request.params.type);
    query1.equalTo("matched", false);
 	
	query2.doesNotMatchQuery("userId", innerQuery);
	
    query2.greaterThanOrEqualTo("end", request.params.end);
    query2.lessThanOrEqualTo("start", request.params.start);
    query2.equalTo("type", request.params.type);
    query2.equalTo("matched", false);
    
	var mainQuery = Parse.Query.or(query1,query2);
    // Run the query
    mainQuery.find({
        // Success Function - results is an array of Parse Objects matching the query
        success: function(results) {
            if(results != []) {
				console.log(JSON.stringify(results));
				//console.log("results = "+results);
                // Select a random match
				
                var randMatch = Math.floor(Math.random() * results.length);
				//var user1 = JSON.parse(JSON.stringify(request.user));
				var user2 = JSON.parse(JSON.stringify(results[randMatch]));
				var user2IdString = user2.userId.objectId;
				var user2Id = new Parse.User({objectId:user2IdString});
				//console.log("Request.User is "+JSON.stringify(request.user));
				//console.log("user1Id is " +user1Id);
				//console.log("randMatch is "+JSON.stringify(results[randMatch]));
				//console.log("user2Id is " +user2Id);
				
 			   	
                // Create a match object
                var Matches = Parse.Object.extend("Matches");
                var match = new Matches();
                 
                //newmatch.set("user1Id", request.user.objectId);
                //newmatch.set("user2Id", results[randMatch].objectId);
				
				match.set("user1Id", user1Id);
				match.set("user2Id", user2Id);
                match.set("type", request.params.type);
                match.set("start", request.params.start);//Doesnt have to be requesters start time, can be buddies time also
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
                 
				//response.success()
                // return the results
                //response.success(JSON.stringify(results[randMatch]));
                //response.success(JSON.stringify(results[randMatch]));
            } else {
                response.success("No Match");
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
    query.greaterThanOrEqualTo("end", mealtime);
    query.lessThanOrEqualTo("start", mealtime);
     
	
    query.find({
        success: function(results) {
            // Modify the resulting rows and save them
			//console.log(JSON.stringify(results));
			for(var i=0;i<results.length;i++)
			{
				results[i].set("matched",true);
				results[i].set("matchId",matchId);
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

/*
// This function notifies users when a match was made between them
Parse.Cloud.afterSave("Matches", function(request) {
    // Match contains the two user Ids we need to send notifications to
    var user1Id = request.object.get('user1Id');
    var user2Id = request.object.get('user2Id');
     
    var pushQuery = new Parse.Query(Parse.Installation);
    var innerQuery = new Parse.Query(Parse.User);
     
    innerQuery.containedIn("objectId", [user1Id, user2Id]);
     
    pushQuery.matchesQuery("userId", innerQuery);
     
    Parse.Push.send({
        where: pushQuery,
        data: {
            alert: "A match was found!"
        }
    }, {
        success: function() {
            // Push was successful
        },
        error: function(error) {
            throw "Error: " + error.code + " " + error.message;
        }
    });
});
*/
// This function converts the UTC timestamps to CST (by subtracting 6 hrs)

Parse.Cloud.afterSave("Meals", function(request) {

    // Run the matching algorithm
    Parse.Cloud.run('getMatches', {
        start: request.object.get("start"), 
        end: request.object.get("end"), 
        type: request.object.get("type")
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
