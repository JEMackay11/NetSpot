SELECT
    transaction.id AS id,
    CASE
        WHEN custbody_sr_hubspot_deal IS NOT NULL THEN BUILTIN.DF(custbody_sr_hubspot_deal)
        ELSE custbody_hubspot_id
    END AS hubspotid,
    transaction.title AS dealname,
    CASE
        custbody_deal_type
        WHEN 1 THEN 2302573
        WHEN 2 THEN 2330406
        WHEN 3 THEN 2330406
        WHEN 4 THEN 2302573
        WHEN 5 THEN 2302573
        ELSE 0
    END AS pipeline,
    CASE
        transactionline.class || '-' || REPLACE(
            BUILTIN.DF(transaction.status),
            'Opportunity : ',
            ''
        )
        WHEN '85-In Progress' THEN '9440409'
        WHEN '86-In Progress' THEN '9440409'
        WHEN '88-In Progress' THEN '9440409'
        WHEN '87-In Progress' THEN '41884056'
        WHEN '90-In Progress' THEN '41884056'
        WHEN '85-Issued Estimate' THEN '9440410'
        WHEN '86-Issued Estimate' THEN '9440410'
        WHEN '88-Issued Estimate' THEN '9440410'
        WHEN '87-Issued Estimate' THEN '41884057'
        WHEN '90-Issued Estimate' THEN '41884057'
        WHEN '85-Closed - Won' THEN '9440411'
        WHEN '86-Closed - Won' THEN '9440411'
        WHEN '88-Closed - Won' THEN '9440411'
        WHEN '87-Closed - Won' THEN '41884058'
        WHEN '90-Closed - Won' THEN '41884058'
        WHEN '85-Closed - Lost' THEN '9440412'
        WHEN '86-Closed - Lost' THEN '9440412'
        WHEN '88-Closed - Lost' THEN '9440412'
        WHEN '87-Closed - Lost' THEN '41884059'
        WHEN '90-Closed - Lost' THEN '41884059'
        ELSE ''
    END AS dealstage,
    CASE
        WHEN transaction.expectedclosedate IS NOT NULL THEN (
            transaction.expectedclosedate - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
        ) * 86400000
        ELSE (
            transaction.closedate - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
        ) * 86400000
    END AS closedate,
    projectedtotal AS amount,
    custbody_deal_type AS dealtype,
    symbol AS currency,
    transactionline.class AS class,
    transactionline.subsidiary AS subsidiary,
    transactionline.memo AS description,
    'https://3688201.app.netsuite.com/app/accounting/transactions/opprtnty.nl?id=' || transaction.id AS url,
    tranid AS tranid,
    custbody_box_url AS boxurl,
    employee.custentity_hubspot_id AS salesrephsid,
    CASE
        custbody_sr_tx_partner_relationship
        WHEN 1 THEN '33444'
        WHEN 2 THEN '1866'
        WHEN 3 THEN '845326'
        WHEN 4 THEN '655813'
        WHEN 5 THEN '13435'
        ELSE ''
    END AS partnerpractice,
    CASE
        REPLACE(
            BUILTIN.DF(transaction.status),
            'Opportunity : ',
            ''
        ) || '-' || forecasttype
        WHEN 'In Progress-0' THEN 'OMIT'
        WHEN 'In Progress-1' THEN 'COMMIT'
        WHEN 'In Progress-2' THEN 'BEST_CASE'
        WHEN 'In Progress-3' THEN 'PIPELINE'
        WHEN 'Issued Estimate-0' THEN 'OMIT'
        WHEN 'Issued Estimate-1' THEN 'COMMIT'
        WHEN 'Issued Estimate-2' THEN 'BEST_CASE'
        WHEN 'Issued Estimate-3' THEN 'PIPELINE'
        WHEN 'Closed - Lost-0' THEN 'OMIT'
        WHEN 'Closed - Lost-1' THEN 'OMIT'
        WHEN 'Closed - Lost-2' THEN 'OMIT'
        WHEN 'Closed - Lost-3' THEN 'OMIT'
        WHEN 'Closed - Won-0' THEN 'CLOSED'
        WHEN 'Closed - Won-1' THEN 'CLOSED'
        WHEN 'Closed - Won-2' THEN 'CLOSED'
        WHEN 'Closed - Won-3' THEN 'CLOSED'
        ELSE ''
    END AS forecastcategory
FROM
    transaction
    INNER JOIN transactionline ON transaction.id = transactionline.transaction
    AND transactionline.mainline = 'T'
    INNER JOIN currency ON currency = currency.id
    INNER JOIN employee ON employee = employee.id
WHERE
    TYPE = 'Opprtnty'
    AND transaction.id = paramopps