SELECT customer.companyname as companyname
, customer.id as id
, customer.searchStage as stage
, BUILTIN.DF(customer.entitystatus) as entitystatus
, customer.custentity_domain as domain
FROM customer
WHERE customer.id = paramentity