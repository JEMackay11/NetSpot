SELECT
    license.id AS internalid,
    name AS id,
    custrecord_lic_transaction_id AS transactionid,
    custrecord_lic_customer_domain AS domain,
    (
        custrecord_lic_maintenance_start_date - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS timestamp,
    custrecord_lic_tech_contact_email AS email,
    custrecord_lic_addon_key AS addonkey,
    custrecord_lic_addon_license_id AS addonlicenseid,
    custrecord_lic_addon_name AS addonname,
    custrecord_lic_company_name AS companyname,
    custrecord_lic_country AS country,
    custrecord_lic_region AS region,
    
    (
        custrecord_lic_last_updated - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS lastupdated,
    custrecord_lic_hosting AS hosting,
    custrecord_lic_license_id AS licenseid,
    custrecord_lic_license_type AS licensetype,
    custrecord_lic_status AS status,
    custrecord_lic_billingperiod AS billingperiod,
    (
        custrecord_lic_maintenance_start_date - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS maintenancestartdate,
    (
        custrecord_lic_maintenance_end_date - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS maintenanceenddate,
    custrecord_lic_partner_name AS partnername,
    custrecord_lic_tier AS tier,
    custrecord_lic_vendor_id AS vendorid,
    techcontact.custentity_hubspot_id AS technicalcontactid,
    billcontact.custentity_hubspot_id AS billingcontactid,
    customer.custentity_hubspot_id AS customerid
FROM
    customrecord_atl_marketplace_license license
    INNER JOIN customer ON custrecord_lic_company = customer.id
    LEFT JOIN contact techcontact ON custrecord_lic_tech_contact = techcontact.id
    LEFT JOIN contact billcontact ON custrecord_lic_billing_contact = billcontact.id
WHERE
    license.id = paramid