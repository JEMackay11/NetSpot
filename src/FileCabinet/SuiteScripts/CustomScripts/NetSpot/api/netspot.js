/**
 * @NApiVersion 2.1
 */

define([
  './lib/company',
  './lib/contact',
  './lib/customer',
  './lib/deal',
  './lib/hscompany',
  './lib/marketplace',
  './lib/notes',
  './lib/opportunity',
  './lib/owner',
  './lib/timelineevent'
], (
  company,
  contact,
  customer,
  deal,
  hscompany,
  marketplace,
  notes,
  opportunity,
  owner,
  timelineevent
) => {
  const createAtlTransactionTle = (options) => {
    return marketplace.createAtlTransactionTle(options);
  };

  const createAtlLicenseTle = (options) => {
    return marketplace.createAtlLicenseTle(options);
  };

  const createContact = (options) => {
    return contact.create(options);
  };

  const createCompany = (options) => {
    return company.create(options);
  };

  const createCustomer = (options) => {
    return customer.create(options);
  };

  const createDeal = (options) => {
    return deal.create(options);
  };

  const createHsCompany = (options) => {
    return hscompany.create(options);
  };

  const createNotes = (options) => {
    return notes.create(options);
  };

  const createOpportunity = (options) => {
    return opportunity.create(options);
  };

  const createTimelineEvent = (options) => {
    return timelineevent.create(options);
  };

  const createTimelineEvents = (options) => {
    return timelineevent.batchCreate(options);
  };

  const getCompany = (options) => {
    return company.get(options);
  };

  const getDeal = (options) => {
    return deal.get(options);
  };

  const getOwner = (options) => {
    return owner.get(options);
  };

  const getOwners = (options) => {
    return owner.getOwners(options);
  };

  const getDealPipelines = (options) => {
    return deal.getPipeLines(options);
  };

  const searchCompany = (options) => {
    return company.search(options);
  };

  const refreshAccessToken = (options) => {
    return oauth.refreshAccessToken(options);
  };

  const searchDeal = (options) => {
    return deal.search(options);
  };

  const updateCompany = (options) => {
    return company.update(options);
  };

  const updateContact = (options) => {
    return contact.update(options);
  };

  const updateDeal = (options) => {
    return deal.update(options);
  };

  const updateOpportunity = (options) => {
    return opportunity.update(options);
  };

  return {
    createAtlTransactionTle,
    createAtlLicenseTle,
    createContact,
    createCompany,
    createCustomer,
    createDeal,
    createHsCompany,
    createNotes,
    createOpportunity,
    createTimelineEvent,
    createTimelineEvents,
    getCompany,
    getDeal,
    getDealPipelines,
    getOwner,
    getOwners,
    refreshAccessToken,
    searchCompany,
    searchDeal,
    updateCompany,
    updateContact,
    updateDeal,
    updateOpportunity
  };
});
