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

	switch(month) {
		case "January":
			month = '01';
			break;
		case "February":
			month = '02';
			break;
		case "March":
			month = '03';
			break;
		case "April":
			month = '01';
			break;
		case "May":
			month = '05';
			break;
		case "June":
			month = '06';
			break;
		case "July":
			month = '07';
			break;
		case "August":
			month = '08';
			break;
		case "September":
			month = '09';
			break;
		case "October":
			month = '10';
			break;
		case "November":
			month = '11';
			break;
		case "December":
			month = '12';
			break;
		default:
			month = '01';
	}

	// Replace the query with the actual query
	// You can pass the existing connection to this function.
	// A new connection will be creted if it's not present as the third param 
	let sql = 'SELECT * FROM transaction T INNER JOIN entity E ON T.entity_id = E.id WHERE E.name =? AND date BETWEEN ? AND ?  LIMIT ?,?';
	console.log(month);
	console.log(year);

	// Replace the query with the actual query
	// You can pass the existing connection to this function.
	// A new connection will be creted if it's not present as the third param 
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

			// Replace the query with the actual query
			// You can pass the existing connection to this function.
			// A new connection will be creted if it's not present as the third param 
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
						// Replace the query with the actual query
						// You can pass the existing connection to this function.
						// A new connection will be creted if it's not present as the third param 
						rds.query({
							instanceIdentifier: 'slappbooksdb',
							query: debitSql,
							inserts: [entityName, year.concat("-").concat(month).concat("-01")]
						}, function (error, resultDebit, connection) {
							if (error) {
								console.log("Error occurred while counting debit transactions", error);
								throw error;
							} else {
								console.log("Successfully retreived debit transactions");
								console.log(resultDebit);
								let debit = resultDebit[0].debit;


								// Replace the query with the actual query
								// You can pass the existing connection to this function.
								// A new connection will be creted if it's not present as the third param 
								rds.query({
									instanceIdentifier: 'slappbooksdb',
									query: creditSql,
									inserts: [entityName, year.concat("-").concat(month).concat("-01")]
								}, function (error, resultCredit, connection) {
									if (error) {
										console.log("Error occurred while counting credit transactions", error);
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
					callback(null, finalResult);
					}
					
				}
			}, connection);

		}
	});
}