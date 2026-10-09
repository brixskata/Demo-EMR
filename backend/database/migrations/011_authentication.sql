USE SmartEHR_Demo;
GO

IF OBJECT_ID(N'dbo.AppUser', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AppUser (
    UserId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_AppUser PRIMARY KEY,
    Username varchar(120) NOT NULL CONSTRAINT UQ_AppUser_Username UNIQUE,
    DisplayName nvarchar(120) NOT NULL,
    PasswordHash nvarchar(255) NOT NULL,
    Role varchar(20) NOT NULL CONSTRAINT CK_AppUser_Role CHECK (Role IN ('ADMIN','AUDITOR','RECORDS_VIEWER')),
    IsEnabled bit NOT NULL CONSTRAINT DF_AppUser_IsEnabled DEFAULT 1,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_AppUser_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_AppUser_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;
GO

IF OBJECT_ID(N'dbo.AuthSession', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AuthSession (
    SessionId uniqueidentifier NOT NULL CONSTRAINT PK_AuthSession PRIMARY KEY,
    UserId int NOT NULL CONSTRAINT FK_AuthSession_AppUser REFERENCES dbo.AppUser(UserId),
    TokenHash varchar(64) NOT NULL CONSTRAINT UQ_AuthSession_TokenHash UNIQUE,
    ExpiresAt datetime2(3) NOT NULL,
    LastSeenAt datetime2(3) NOT NULL,
    RevokedAt datetime2(3) NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_AuthSession_CreatedAt DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_AuthSession_UserId ON dbo.AuthSession(UserId, RevokedAt, ExpiresAt);
  CREATE INDEX IX_AuthSession_Expiry ON dbo.AuthSession(ExpiresAt, RevokedAt);
END;
GO
