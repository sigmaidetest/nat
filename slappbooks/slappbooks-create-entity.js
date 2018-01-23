let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);
exports.handler = function (event, context, callback) {
	let entity = event;

	let sql = 'INSERT INTO entity (name, currency, type) values (?, ?, ?)';
	// Replace the query with the actual query
	// You can pass the existing connection to this function.
	// A new connection will be creted if it's not present as the third param 
	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: sql,
		inserts: [entity.entity, entity.currency, entity.entityType]
	}, function (error, results, connection) {
		if (error) {
			console.log("Error occurred while inserting the entity", error);
			throw error;
		} else {
			console.log("Successfully inserted the entity");
			console.log(results);
		}
		connection.end();
		callback(null, 'Successfully executed');
	});
}