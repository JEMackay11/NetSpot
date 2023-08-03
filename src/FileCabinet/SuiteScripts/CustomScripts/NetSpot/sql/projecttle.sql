SELECT
    job.id AS nsinternalid,
    job.companyname AS projectname,
    BUILTIN.DF(job.entitystatus) AS status,
    (
        job.startdate - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS startdate,
    (
        job.projectedenddate - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS enddate,
    job.calculatedwork AS totalhours,
    job.actualtime AS hoursused,
    job.timeremaining AS hoursleft,
    job.custentity_sr_box_folder_url AS boxurl,
    (
        TO_DATE(job.lastmodifieddate) - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS updated,
    (
        TO_DATE(job.datecreated) - TO_DATE('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    ) * 86400000 AS timestamp,
    hsobject.objectid AS objectid
FROM
    job
    INNER JOIN (
        SELECT
            job.id,
            CASE
                WHEN opportunity.custbody_hubspot_id IS NULL THEN opportunity.custbody_hubspot_id
                WHEN opportunity.custbody_sr_hubspot_deal IS NOT NULL THEN SUBSTR(
                    BUILTIN.DF(opportunity.custbody_sr_hubspot_deal),
                    1,
                    INSTR(
                        BUILTIN.DF(opportunity.custbody_sr_hubspot_deal),
                        ' '
                    ) - 1
                )
                ELSE ''
            END AS objectid
        FROM
            job
            LEFT JOIN transaction salesorder ON SUBSTR(entityid, INSTR(entityid, ' ') + 1) = salesorder.tranid
            LEFT JOIN transaction opportunity ON salesorder.opportunity = opportunity.id
        WHERE
            job.customer = paramentity
    ) hsobject ON job.id = hsobject.id
WHERE
    hsobject.objectid IS NOT NULL
    AND job.customer = paramentity