SELECT
    transaction.id AS internalid,
    name AS id,
    custrecord_transaction_id AS transactionid,
    custrecord_customer_domain AS domain,
    (
        custrecord_maintenance_start_date - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS timestamp,
    custrecord_technical_contact_email AS email,
    custrecord_addon_key AS addonkey,
    custrecord_addon_license_id AS addonlicenseid,
    custrecord_addon_name AS addonname,
    custrecord_company AS companyname,
    custrecord_country AS country,
    custrecord_region AS region,
    
    (
        custrecord_last_updated - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS lastupdated,
    custrecord_hosting AS hosting,
    custrecord_license_id AS licenseid,
    custrecord_license_type AS licensetype,
    custrecord_sale_type AS saletype,
    custrecord_billing_period AS billingperiod,
    custrecord_user_count AS users,
    custrecord_item AS nsitem,
    (
        custrecord_maintenance_start_date - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS maintenancestartdate,
    (
        custrecord_maintenance_start_date - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS maintenanceenddate,
    custrecord_partner_name AS partnername,
    custrecord_tier AS tier,
    custrecord_vendor_id AS vendorid,
    techcontact.custentity_hubspot_id AS technicalcontactid,
    billcontact.custentity_hubspot_id AS billingcontactid,
    customer.custentity_hubspot_id AS customerid
FROM
    customrecord_atl_marketplace_transaction transaction
    INNER JOIN customer ON custrecord_customer = customer.id
    LEFT JOIN contact techcontact ON custrecord_technical_contact = techcontact.id
    LEFT JOIN contact billcontact ON custrecord_billing_contact = billcontact.id
WHERE
    transaction.id = paramid