let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');

const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {
	console.log(event);
	let transactions = [];
	let dates = [];
	let checkNo = [];
	let notes = [];
	let amounts = [];
	let creditArray = [];
	let entityNames = [];

	transactions = event.slice();
	transactions.forEach((transaction, index) => {
		dates.push(transaction.date);
		checkNo.push(transaction.checkNo);
		notes.push(transaction.notes);
		amounts.push(transaction.amount);
		creditArray.push(transaction.isCredit);
		entityNames.push(transaction.entityName);
		if((transaction.amount).toString().startsWith("(") && transaction.amount.toString().endsWith(")")) {
			transaction.amount = transaction.amount.slice(1, transaction.amount.length-1);
		} 
		transaction.isCredit = transaction.isCredit ? 1 : 0;
	});


	rds.beginTransaction({
		instanceIdentifier: 'slappbooksdb'
	}, function (error, connection) {
		if (error) { throw err; }

		// Replace the query with the actual query
		// You can pass the existing connection to this function.
		// A new connection will be creted if it's not present as the third param


		// Replace the query with the actual query
		// You can pass the existing connection to this function.
		// A new connection will be creted if it's not present as the third param 

		let sql = 'INSERT INTO transaction (transaction_id, set_id, date, entity_id, is_credit, cheque_no, voucher_no, amount, notes, reconcile) VALUES (?,?,?,?,?, ?, ?, ?, ?, ?);'
		transactions.forEach( (transaction, index) => {

			rds.query({
				instanceIdentifier: 'slappbooksdb',
				query: 'SELECT id FROM entity WHERE name = ?',
				inserts: [transaction.entityName]
			}, function (error, results, connection) {
				if (error) {
					console.log("Error occurred while retreiving the entity id from the database", error);
					connection.rollback();
					throw error;
				} else {
					console.log("Successfully retrieved the entity id")
					let entity_id = results[0].id;
					console.log(transaction.trId);
					// Replace the query with the actual query
					// You can pass the existing connection to this function.
					// A new connection will be creted if it's not present as the third param 
					rds.query({
						identifier: 'slappbooksdb',
						query: sql,
						inserts: [transaction.trId, transaction.setId, transaction.date, entity_id, transaction.isCredit, transaction.checkNo, transaction.voucherNo, transaction.amount, transaction.notes, transaction.reconcile]
					}, function (error, results, connection) {
						if (error) {
							connection.rollback();
							console.log("Error occurred while inserting the transaction", error);
							throw error;
						} else {
							console.log("Successfully inserted the transaction")
							console.log(results);
						}

						if(index === transactions.length) {
							connection.end();
						}
					}, connection);

				}

			}, connection);

			connection.commit();
		});

	});


	callback(null, JSON.stringify(event));
}