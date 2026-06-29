insert into skills (name, ordering) values
    ('US Bookkeeping/Accounting', 1),
    ('Client Communication', 2),
    ('US Accounts Payable', 3),
    ('US Accounts Receivable', 4),
    ('Bank Reconciliations', 5),
    ('Financial Reporting', 6),
    ('Payroll', 7),
    ('Billing / Invoicing', 8),
    ('1099 Preparation', 9),
    ('1040 Preparation', 10),
    ('1120s Preparation', 11),
    ('Team Supervision/Review', 12),
    ('Virtual Assistance', 13),
    ('Data Analysis and Problem Solving', 14)
on conflict (name) do nothing;

insert into software (name, ordering) values
    ('QuickBooks Online', 1),
    ('QuickBooks Desktop', 2),
    ('Xero', 3),
    ('Bill.com', 4),
    ('Hubdoc', 5),
    ('Dext', 6),
    ('Gusto', 7),
    ('Microsoft Excel', 8),
    ('Google Workspace', 9),
    ('NetSuite', 10),
    ('SAP', 11),
    ('Oracle', 12),
    ('Salesforce', 13),
    ('Workday', 14),
    ('Slack', 15),
    ('Microsoft Teams', 16)
on conflict (name) do nothing;

insert into assessments (name, ordering) values
    ('Accounting', 1),
    ('QuickBooks', 2),
    ('Critical Thinking', 3),
    ('Communication', 4),
    ('Attention to Detail', 5)
on conflict (name) do nothing;
