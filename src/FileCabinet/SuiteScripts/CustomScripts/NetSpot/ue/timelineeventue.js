/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../../NetSpot/api/netspot', '../../Helper/SuiteQL/suiteql'], (
  netspot,
  suiteql
) => {
  const afterSubmit = (scriptContext) => {
    try {
      if (scriptContext.type === scriptContext.UserEventType.CREATE) {
        const timelineEventData = suiteql.execute({
          sqlfile: `../../NetSpot/sql/${scriptContext.newRecord.type}_tle.sql`,
          custparam: {
            paramid: scriptContext.newRecord.id
          }
        });

        const timelineEvent = netspot.createTimelineEvents({
          integration: `${scriptContext.newRecord.type}_tles`,
          data: timelineEventData.data
        });

        if (timelineEvent.status === 'FAILED') {
          log.error({
            title: 'Timeline Event Error',
            details: `Timeline Event ${timelineEvent.message}`
          });
        }
      }
    } catch (error) {
      log.error({
        title: 'Timeline Event Error',
        details: `Timeline Event UE ${error}`
      });
    }
  };

  return { afterSubmit };
});
