USE SmartEHR_Demo;
GO
IF OBJECT_ID(N'dbo.CodeChartRoleAccess', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CodeChartRoleAccess (
    CodeChartRoleAccessId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CodeChartRoleAccess PRIMARY KEY,
    AdmissionId int NOT NULL CONSTRAINT FK_CodeChartRoleAccess_Admission REFERENCES dbo.Admission(AdmissionId),
    ClinicalRole varchar(20) NOT NULL CONSTRAINT CK_CodeChartRoleAccess_Role CHECK (ClinicalRole IN ('PHYSICIAN','CONSULTANT','RESIDENT','INTERN','NURSE')),
    Permission varchar(20) NOT NULL CONSTRAINT CK_CodeChartRoleAccess_Permission CHECK (Permission IN ('VIEW_ONLY','FULL_ACCESS')),
    GrantedAt datetime2(3) NOT NULL CONSTRAINT DF_CodeChartRoleAccess_GrantedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_CodeChartRoleAccess_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_CodeChartRoleAccess_AdmissionRole UNIQUE (AdmissionId, ClinicalRole)
  );
END;
GO
IF OBJECT_ID(N'dbo.CodeChartAccessActivity', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CodeChartAccessActivity (
    CodeChartAccessActivityId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CodeChartAccessActivity PRIMARY KEY,
    AdmissionId int NOT NULL CONSTRAINT FK_CodeChartAccessActivity_Admission REFERENCES dbo.Admission(AdmissionId),
    ClinicalRole varchar(20) NOT NULL CONSTRAINT CK_CodeChartAccessActivity_Role CHECK (ClinicalRole IN ('PHYSICIAN','CONSULTANT','RESIDENT','INTERN','NURSE')),
    Action varchar(30) NOT NULL CONSTRAINT CK_CodeChartAccessActivity_Action CHECK (Action IN ('GRANTED_ACCESS','CHANGED_PERMISSION','REVOKED_ACCESS','VIEWED_DOCUMENT','UPLOADED_DOCUMENT')),
    Permission varchar(20) NULL CONSTRAINT CK_CodeChartAccessActivity_Permission CHECK (Permission IS NULL OR Permission IN ('VIEW_ONLY','FULL_ACCESS')),
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_CodeChartAccessActivity_CreatedAt DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_CodeChartAccessActivity_AdmissionCreatedAt ON dbo.CodeChartAccessActivity(AdmissionId, CreatedAt DESC);
END;
GO
