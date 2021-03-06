let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);
exports.handler = function (event, context, callback) {

	postObject = event;
	transactions = postObject.transactions;
	conversions = postObject.conversionDetails;
	console.log(conversions);

	transactions.forEach((transaction, index) => {
		if ((transaction.amount).toString().startsWith("(") && transaction.amount.toString().endsWith(")")) {
			transaction.amount = transaction.amount.slice(1, transaction.amount.length - 1);
		}
		transaction.isCredit = transaction.isCredit ? 1 : 0;
	});


	rds.beginTransaction({
		instanceIdentifier: 'slappbooksdb'
	}, function (error, connection) {
		if (error) { throw err; }

		let sql = 'INSERT INTO transaction (transaction_id, set_id, date, entity_id, is_credit, cheque_no, voucher_no, amount, notes, reconcile) VALUES (?,?,?,?,?, ?, ?, ?, ?, ?);'
		transactions.forEach((transaction, index) => {

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


							sql = 'INSERT INTO conversion (transaction_id, to_currency, from_currency, rate) VALUES (?,?,?,?)';
							
							rds.query({
								instanceIdentifier: 'slappbooksdb',
								query: sql,
								inserts: [transaction.trId, conversions[index]._toCurrency,  conversions[index]._fromCurrency, conversions[index]._conversionRate]
							}, function (error, results, connection) {
								if (error) {
									connection.rollback();
									console.log("Error occurred while inserting conversions");
									throw error;
								} else {
									console.log("Successfully inserted a conversion object");
									console.log(results);
								}

								connection.end();
							});

						}

						if (index === transactions.length) {
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