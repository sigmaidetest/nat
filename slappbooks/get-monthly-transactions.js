let AWS = require('aws-sdk');
let connectionManager = require('./ConnectionManager');
let SL = require('@slappforge/slappforge-sdk');
const rds = new SL.AWS.RDS(connectionManager);

exports.handler = function (event, context, callback) {

	let postObject = event;
	let entityName = postObject.entity;
	let pageNo = postObject.page;
	let pageSize = postObject.pageSize;
	let sorted = postObject.sorted;
	let filtered = postObject.filtered;
	let startIndex = +pageNo * +pageSize;
	let endIndex = startIndex + pageSize;
	let pageNumber = 1;
	let year = postObject.year;
	let month = postObject.month;

	// retrieve transactions between the selected time frame
	let sql = 'SELECT * FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name =? AND date BETWEEN ? AND ?  LIMIT ?,?';

	rds.query({
		instanceIdentifier: 'slappbooksdb',
		query: 'SELECT count(*) as count FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name=?',
		inserts: [entityName]
	}, function (error, results, connection) {
		if (error) {
			console.log("Error occurred while retrieving count");
			throw error;
		} else {
			console.log("Successfully obtained database count");
			console.log(results[0].count);
			pageNumber = Math.ceil(parseFloat(results[0].count) / parseFloat(pageSize));

			// retrieve transactions between a given time frame
			rds.query({
				instanceIdentifier: 'slappbooksdb',
				query: sql,
				inserts: [entityName, year.concat("-").concat(month).concat("-01"), year.concat("-").concat(month).concat("-31"), startIndex, pageSize]
			}, function (error, results, connection) {
				if (error) {
					console.log("Error occurred while retreiving transactions", error);
					throw error;
				} else {
					let transactions = [];
					transactionResult = results;
					console.log(transactionResult);
					console.log("Successfully retreived transactions");
					if (startIndex == 0) {

						debitSql = 'SELECT SUM(amount) as debit  FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name = ? AND T.is_credit = 0 AND date < ?';
						creditSql = 'SELECT SUM(amount) as credit FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name = ? AND T.is_credit = 1 AND date < ?';
						// Generate the required credit and debit balances to formulate the balance brought forward query
						rds.query({
							instanceIdentifier: 'slappbooksdb',
							query: debitSql,
							inserts: [entityName, year.concat("-").concat(month).concat("-01")]
						}, function (error, resultDebit, connection) {
							if (error) {
								console.log("Error occurred while retrieving debit transactions", error);
								throw error;
							} else {
								console.log("Successfully retreived debit transactions");
								console.log(resultDebit);
								let debit = resultDebit[0].debit;


								// Retrieve credit transactions from the database
								rds.query({
									instanceIdentifier: 'slappbooksdb',
									query: creditSql,
									inserts: [entityName, year.concat("-").concat(month).concat("-01")]
								}, function (error, resultCredit, connection) {
									if (error) {
										console.log("Error occurred while retrieving credit transactions", error);
										throw error;
									} else {
										console.log("Successfully retrieved credit transactions");
										console.log(resultCredit);
										let credit = resultCredit[0].credit;
										credit = credit === null ? 0 : credit;
										debit = debit === null ? 0 : debit;
										transactions.push({
											trId: '00000000000000000',
											notes: 'Balance Brought Forward',
											date: year.concat("-").concat(month).concat("-01"),
											isCredit: (+debit - +credit) < 0 ? 1 : 0,
											amount: Math.abs(+debit - +credit),
											entityName: entityName
										});
										console.log(transactionResult);
										transactionResult.forEach(result => {
										transactions.push({
											trId: result.transaction_id,
											date: result.date,
											checkNo: result.cheque_no,
											voucherNo: result.voucher_no,
											isCredit: result.is_credit,
											amount: result.amount,
											notes: result.notes,
											reconcile: result.reconcile,
											setId: result.set_id,
											entityName: entityName
										});
									});
									let finalResult = { rows: transactions, pages: pageNumber }
									console.log(finalResult);
									connection.end();
									callback(null, finalResult);
									}
								}, connection);

							}
						}, connection);

					} else {
						results.forEach(result => {
						transactions.push({
							trId: result.transaction_id,
							date: result.date,
							checkNo: result.cheque_no,
							voucherNo: result.voucher_no,
							isCredit: result.is_credit,
							amount: result.amount,
							notes: result.notes,
							reconcile: result.reconcile,
							setId: result.set_id,
							entityName: entityName
						});
					});
					let finalResult = { rows: transactions, pages: pageNumber }
					console.log(finalResult);
					connection.end();
					callback(error, finalResult);
				  	}		
				}
			}, connection);
		}
	});
}