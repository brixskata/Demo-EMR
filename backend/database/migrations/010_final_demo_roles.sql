USE SmartEHR_Demo;
GO

IF OBJECT_ID(N'dbo.DemoAccount', N'U') IS NOT NULL
BEGIN
  IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DemoAccount_Role')
    ALTER TABLE dbo.DemoAccount DROP CONSTRAINT CK_DemoAccount_Role;
  UPDATE dbo.DemoAccount SET ClinicalRole = CASE WHEN ClinicalRole = 'PHYSICIAN' THEN 'AUDITOR' WHEN ClinicalRole IN ('CONSULTANT','RESIDENT','INTERN','NURSE') THEN 'RECORDS_VIEWER' ELSE ClinicalRole END;
  ALTER TABLE dbo.DemoAccount ADD CONSTRAINT CK_DemoAccount_Role CHECK (ClinicalRole IN ('ADMIN','AUDITOR','RECORDS_VIEWER'));
END;
GO

IF OBJECT_ID(N'dbo.CodeChartRoleAccess', N'U') IS NOT NULL
BEGIN
  DELETE FROM dbo.CodeChartRoleAccess;
  IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CodeChartRoleAccess_Role')
    ALTER TABLE dbo.CodeChartRoleAccess DROP CONSTRAINT CK_CodeChartRoleAccess_Role;
  ALTER TABLE dbo.CodeChartRoleAccess ADD CONSTRAINT CK_CodeChartRoleAccess_Role CHECK (ClinicalRole IN ('ADMIN','AUDITOR','RECORDS_VIEWER'));
END;
IF OBJECT_ID(N'dbo.CodeChartAccessActivity', N'U') IS NOT NULL
BEGIN
  IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CodeChartAccessActivity_Role')
    ALTER TABLE dbo.CodeChartAccessActivity DROP CONSTRAINT CK_CodeChartAccessActivity_Role;
  UPDATE dbo.CodeChartAccessActivity SET ClinicalRole = CASE WHEN ClinicalRole = 'PHYSICIAN' THEN 'AUDITOR' ELSE 'RECORDS_VIEWER' END;
  ALTER TABLE dbo.CodeChartAccessActivity ADD CONSTRAINT CK_CodeChartAccessActivity_Role CHECK (ClinicalRole IN ('ADMIN','AUDITOR','RECORDS_VIEWER'));
END;
GO
