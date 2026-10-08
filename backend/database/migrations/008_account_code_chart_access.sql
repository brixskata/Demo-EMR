USE SmartEHR_Demo;
GO

IF OBJECT_ID(N'dbo.DemoAccount', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.DemoAccount (
    DemoAccountId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_DemoAccount PRIMARY KEY,
    DisplayName nvarchar(120) NOT NULL,
    ClinicalRole varchar(20) NOT NULL CONSTRAINT CK_DemoAccount_Role CHECK (ClinicalRole IN ('PHYSICIAN','CONSULTANT','RESIDENT','INTERN','NURSE')),
    CONSTRAINT UQ_DemoAccount_DisplayName UNIQUE (DisplayName)
  );
  INSERT dbo.DemoAccount (DisplayName, ClinicalRole) VALUES
    (N'Dr. Santos', 'PHYSICIAN'), (N'Nurse Reyes', 'NURSE'), (N'Dr. Cruz', 'CONSULTANT'),
    (N'Dr. Park', 'PHYSICIAN'), (N'Dr. Lee', 'RESIDENT'), (N'Dr. Garcia', 'INTERN');
END;
GO

IF OBJECT_ID(N'dbo.CodeChartUserAccess', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CodeChartUserAccess (
    CodeChartUserAccessId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CodeChartUserAccess PRIMARY KEY,
    AdmissionId int NOT NULL CONSTRAINT FK_CodeChartUserAccess_Admission REFERENCES dbo.Admission(AdmissionId),
    DemoAccountId int NOT NULL CONSTRAINT FK_CodeChartUserAccess_Account REFERENCES dbo.DemoAccount(DemoAccountId),
    Permission varchar(20) NOT NULL CONSTRAINT CK_CodeChartUserAccess_Permission CHECK (Permission IN ('VIEW_ONLY','FULL_ACCESS')),
    ExpiresAt datetime2(3) NULL,
    Reason varchar(30) NOT NULL CONSTRAINT CK_CodeChartUserAccess_Reason CHECK (Reason IN ('CHART_COMPLETION','FOR_REVIEW')),
    GrantedAt datetime2(3) NOT NULL CONSTRAINT DF_CodeChartUserAccess_GrantedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_CodeChartUserAccess_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_CodeChartUserAccess_AdmissionAccount UNIQUE (AdmissionId, DemoAccountId)
  );
  INSERT dbo.CodeChartUserAccess (AdmissionId, DemoAccountId, Permission, Reason)
    SELECT r.AdmissionId, a.DemoAccountId, r.Permission, 'FOR_REVIEW'
    FROM dbo.CodeChartRoleAccess r
    INNER JOIN dbo.DemoAccount a ON a.ClinicalRole = r.ClinicalRole
    WHERE a.DemoAccountId = (SELECT MIN(a2.DemoAccountId) FROM dbo.DemoAccount a2 WHERE a2.ClinicalRole = r.ClinicalRole);
END;
GO
