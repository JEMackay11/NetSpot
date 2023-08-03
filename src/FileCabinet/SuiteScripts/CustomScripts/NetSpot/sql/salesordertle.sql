SELECT
    transaction.id AS id,
    customer.custentity_hubspot_id AS objectid,
    transaction.id AS nsinternalid,
    transaction.tranid AS tranid,
    transaction.trandate AS trandate,
    transaction.otherrefnum AS otherrefnum,
    BUILTIN.DF(transaction.employee) AS salesrep,
    BUILTIN.DF(transactionline.entity) AS project,
    transaction.foreignTotal AS total,
    currency.symbol AS currency,
    BUILTIN.DF(transaction.status) AS status,
    transaction.lastmodifieddate AS updated,
    transaction.createdDate AS timestamp
FROM
    transaction
    INNER JOIN currency ON transaction.currency = currency.id
    INNER JOIN customer ON transaction.entity = customer.id
    LEFT JOIN transactionline ON transaction.id = transactionline.transaction
    AND transaction.entity != transactionline.entity
    AND transactionline.taxline = 'F'
WHERE
    transaction.type = 'SalesOrd'
    AND transaction.entity = paramentity