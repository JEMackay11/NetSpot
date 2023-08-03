SELECT
    transaction.id AS id,
    customer.custentity_hubspot_id AS objectid,
    transaction.id AS nsinternalid,
    transaction.tranid AS tranid,
    transaction.title AS title,
    transaction.trandate AS trandate,
    transaction.expectedclosedate AS expectedclosedate,
    transaction.foreignTotal AS total,
    currency.symbol AS currency,
    BUILTIN.DF(transaction.entitystatus) AS stage,
    transaction.lastmodifieddate AS updated,
    transaction.custbody_box_url AS boxurl,
    transaction.createdDate AS timestamp
FROM
    transaction
    INNER JOIN currency ON transaction.currency = currency.id
    INNER JOIN customer ON transaction.entity = customer.id
WHERE
    transaction.type = 'Opprtnty'
    AND entity = paramentity