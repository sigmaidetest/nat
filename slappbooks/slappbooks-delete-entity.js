let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);
exports.handler = function (event, context, callback) {

	let entityName = event.entityName;
	// Replace the query with the actual query
	// You can pass the existing connection to this function.
	// A new connection will be created if it's not present as the third param 
	// You must always end the DB connection after it's used
	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: 'DELETE FROM entity WHERE name=?',
		inserts: [entityName]
	}, function (error, results, connection) {
		if (error) {
			console.log("Error occurred while deleting the entity");
			throw error;
		} else {
			console.log("Successfully deleted the entity")
			console.log(results);
		}

		connection.end();
	});

	callback(null, 'Successfully executed');
}