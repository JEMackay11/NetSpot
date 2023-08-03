SELECT
    transaction.id AS id,
    customer.custentity_hubspot_id AS objectid,
    transaction.id AS nsinternalid,
    transaction.tranid AS tranid,
    transaction.trandate AS trandate,
    transaction.duedate AS duedate,
    transaction.custbody_expected_paymentdate AS expectedpaymentdate,
    transaction.custbody_expected_payment_notes AS expectedpaymentnotes,
    transaction.foreignTotal AS total,
    currency.symbol AS currency,
    BUILTIN.DF(transaction.status) AS status,
    transaction.lastmodifieddate AS updated,
    transaction.createdDate AS timestamp
FROM
    transaction
    INNER JOIN currency ON transaction.currency = currency.id
    INNER JOIN customer ON transaction.entity = customer.id
WHERE
    transaction.type = 'CustInvc'
    AND transaction.entity = paramentity