/* Functions relating directory to the user object */


/**************************
*  Name: setUserName
*  Description: Sets the name of the current user
*  Params:
*     "name" - the new name of the user
***************************/
Parse.Cloud.define("setUseFirstName", function(request, response) {
   var newName = request.object.get('name')
   Parse.User.
});