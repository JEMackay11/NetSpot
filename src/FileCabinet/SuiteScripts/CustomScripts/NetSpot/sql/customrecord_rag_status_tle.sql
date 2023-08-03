SELECT
    *
FROM
    (
        SELECT
            rag.id AS nsinternalid,
            'DR-' || rag.id AS id,
            CASE
                WHEN custbody_sr_hubspot_deal IS NOT NULL THEN SUBSTR(
                    BUILTIN.DF(custbody_sr_hubspot_deal),
                    1,
                    INSTR(BUILTIN.DF(custbody_sr_hubspot_deal), ' - ')
                )
                ELSE custbody_hubspot_id
            END AS objectid,
            rag.name AS summary,
            BUILTIN.DF(custrecord_rgs_status) AS ragcolor,
            BUILTIN.DF(custrecord_rgs_author) AS author,
            custrecord_rgs_notes AS notes,
            custrecord_rgs_date AS date,
            rag.created AS timestamp,
            BUILTIN.DF(opportunityline.entity) AS project,
            '1189456' AS eventid,
            ROW_NUMBER() OVER (
                ORDER BY
                    opportunityline.linesequencenumber ASC
            ) AS row_num
        FROM
            customrecord_rag_status rag
            INNER JOIN transactionline opportunityline ON custrecord_rgs_project = opportunityline.entity
            INNER JOIN transaction opportunity ON opportunityline.transaction = opportunity.id
        WHERE
            TYPE = 'Opprtnty'
            AND opportunityline.mainline = 'F'
            AND opportunityline.entity IS NOT NULL
            AND rag.id = paramid
        UNION
        ALL
        SELECT
            rag.id AS nsinternalid,
            'CR-' || rag.id AS id,
            customer.custentity_hubspot_id AS objectid,
            rag.name AS summary,
            BUILTIN.DF(custrecord_rgs_status) AS ragcolor,
            BUILTIN.DF(custrecord_rgs_author) AS author,
            custrecord_rgs_notes AS notes,
            custrecord_rgs_date AS date,
            rag.created AS timestamp,
            project.entityid AS project,
            '1236862' AS eventid,
            1 AS row_num
        FROM
            customrecord_rag_status rag
            INNER JOIN job project ON rag.custrecord_rgs_project = project.id
            INNER JOIN customer ON project.customer = customer.id
        WHERE
            rag.id = paramid
    )
WHERE
    row_num = 1