let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {

	let entity = event;

	let x = [entity.entity, entity.currency, entity.entityType];
	let sql = 'INSERT INTO entity (name, currency, type) values (?, ?, ?)';
	// Insert entity value to the database
	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: sql,
		inserts: x
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