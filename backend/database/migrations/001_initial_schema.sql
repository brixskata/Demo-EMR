IF DB_ID(N'SmartEHR_Demo') IS NULL
BEGIN
  CREATE DATABASE SmartEHR_Demo;
END;
GO
USE SmartEHR_Demo;
GO
IF OBJECT_ID(N'dbo.SchemaMigration', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.SchemaMigration (
    MigrationId varchar(120) NOT NULL CONSTRAINT PK_SchemaMigration PRIMARY KEY,
    AppliedAt datetime2(3) NOT NULL CONSTRAINT DF_SchemaMigration_AppliedAt DEFAULT SYSUTCDATETIME()
  );
END;
GO
IF OBJECT_ID(N'dbo.Patient', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Patient (
    PatientId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Patient PRIMARY KEY,
    PatientNumber varchar(30) NOT NULL CONSTRAINT UQ_Patient_PatientNumber UNIQUE,
    FirstName nvarchar(80) NOT NULL,
    LastName nvarchar(80) NOT NULL,
    DateOfBirth date NOT NULL,
    Sex varchar(20) NOT NULL CONSTRAINT CK_Patient_Sex CHECK (Sex IN ('Female','Male','Other','Unknown')),
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Patient_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_Patient_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;
GO
IF OBJECT_ID(N'dbo.Admission', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Admission (
    AdmissionId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Admission PRIMARY KEY,
    PatientId int NOT NULL CONSTRAINT FK_Admission_Patient REFERENCES dbo.Patient(PatientId),
    AdmissionNumber varchar(30) NOT NULL CONSTRAINT UQ_Admission_AdmissionNumber UNIQUE,
    AdmissionDate datetime2(3) NOT NULL,
    DischargeDate datetime2(3) NULL,
    Ward nvarchar(80) NOT NULL,
    Status varchar(20) NOT NULL CONSTRAINT CK_Admission_Status CHECK (Status IN ('Active','Discharged','Cancelled')),
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Admission_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_Admission_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_Admission_PatientId_AdmissionDate ON dbo.Admission(PatientId, AdmissionDate DESC);
END;
GO
IF OBJECT_ID(N'dbo.MedicalDocument', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.MedicalDocument (
    DocumentId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_MedicalDocument PRIMARY KEY,
    AdmissionId int NOT NULL CONSTRAINT FK_MedicalDocument_Admission REFERENCES dbo.Admission(AdmissionId),
    DocumentType nvarchar(80) NOT NULL,
    FileName nvarchar(255) NOT NULL,
    DocumentDate date NOT NULL,
    UploadedBy nvarchar(120) NOT NULL,
    UploadedAt datetime2(3) NOT NULL CONSTRAINT DF_MedicalDocument_UploadedAt DEFAULT SYSUTCDATETIME(),
    Status varchar(20) NOT NULL CONSTRAINT DF_MedicalDocument_Status DEFAULT 'ACTIVE' CONSTRAINT CK_MedicalDocument_Status CHECK (Status IN ('ACTIVE','ARCHIVED')),
    StoragePath nvarchar(500) NOT NULL
  );
  CREATE INDEX IX_MedicalDocument_AdmissionId_Date ON dbo.MedicalDocument(AdmissionId, DocumentDate DESC);
END;
GO
