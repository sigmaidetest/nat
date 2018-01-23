let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);
exports.handler = function (event, context, callback) {
	let setId = event.setId;

	rds.beginTransaction({
		instanceIdentifier: 'slappbooksdb'
	}, function (error, connection) {
		if (error) { throw err; }


		let sql = 'DELETE FROM transaction WHERE set_id=?';
		// Replace the query with the actual query
		// You can pass the existing connection to this function.
		// A new connection will be creted if it's not present as the third param 
		rds.query({
			instanceIdentifier: 'slappbooksdb',
			query: sql,
			inserts: [setId]
		}, function (error, results, connection) {
			if (error) {
				connection.rollback();
				console.log("Error occurred while deleting the transaction");
				throw error;
			} else {
				console.log("Successfully deleted the transaction");
				connection.commit();
				console.log(results);
			}

			connection.end();
		});

	});


	callback(null, 'Successfully executed');
}