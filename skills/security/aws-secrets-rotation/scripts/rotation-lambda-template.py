"""
AWS Secrets Manager Rotation Lambda — Database Credential Rotation

Source: https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas
License: MIT-0

This Lambda implements the 4-step Secrets Manager rotation protocol for
database credentials (MySQL, PostgreSQL, etc.). It can be used as-is for
single-user rotation, or adapted for multi-user rotation.

Steps:
  1. createSecret — Generate new password, store as AWSPENDING
  2. setSecret    — Apply new password to the database
  3. testSecret   — Verify new credentials work
  4. finishSecret — Promote AWSPENDING version to AWSCURRENT
"""

import boto3
import logging
import os
import json
from typing import Any, Dict

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Database connection parameters are read from the secret JSON
# The secret must contain: host, port, dbname, username, engine
DB_SECRET_KEY_HOST = "host"
DB_SECRET_KEY_PORT = "port"
DB_SECRET_KEY_DBNAME = "dbname"
DB_SECRET_KEY_USERNAME = "username"
DB_SECRET_KEY_PASSWORD = "password"
DB_SECRET_KEY_ENGINE = "engine"

# Exclude characters that could cause SQL injection or parsing issues
EXCLUDE_CHARACTERS = os.environ.get("EXCLUDE_CHARACTERS", "/@\"'\\")


# ---------------------------------------------------------------------------
# Lambda Handler
# ---------------------------------------------------------------------------

def lambda_handler(event: Dict[str, Any], context: Any) -> None:
    """
    Entry point called by AWS Secrets Manager during rotation.

    Event keys:
        SecretId           (str) — ARN or name of the secret to rotate
        ClientRequestToken (str) — Unique token for this rotation request
        Step               (str) — One of: createSecret, setSecret, testSecret, finishSecret
    """
    arn = event["SecretId"]
    token = event["ClientRequestToken"]
    step = event["Step"]

    # Initialize the Secrets Manager client
    # The endpoint URL is injected by Secrets Manager at runtime
    secrets_manager = boto3.client(
        "secretsmanager",
        endpoint_url=os.environ.get("SECRETS_MANAGER_ENDPOINT")
    )

    # -----------------------------------------------------------------------
    # Validation: ensure the secret is rotation-enabled and version is staged
    # -----------------------------------------------------------------------
    metadata = secrets_manager.describe_secret(SecretId=arn)

    if not metadata.get("RotationEnabled"):
        logger.error("Secret %s is not enabled for rotation", arn)
        raise ValueError(f"Secret {arn} is not enabled for rotation")

    versions = metadata["VersionIdsToStages"]
    if token not in versions:
        logger.error(
            "Secret version %s has no stage for rotation of secret %s.",
            token, arn
        )
        raise ValueError(
            f"Secret version {token} has no stage for rotation of secret {arn}."
        )

    if "AWSCURRENT" in versions[token]:
        # Already current — nothing to do
        logger.info(
            "Secret version %s already set as AWSCURRENT for secret %s.",
            token, arn
        )
        return

    if "AWSPENDING" not in versions[token]:
        logger.error(
            "Secret version %s not set as AWSPENDING for rotation of secret %s.",
            token, arn
        )
        raise ValueError(
            f"Secret version {token} is not staged as AWSPENDING."
        )

    # -----------------------------------------------------------------------
    # Route to the correct step handler
    # -----------------------------------------------------------------------
    if step == "createSecret":
        _create_secret(secrets_manager, arn, token)
    elif step == "setSecret":
        _set_secret(secrets_manager, arn, token)
    elif step == "testSecret":
        _test_secret(secrets_manager, arn, token)
    elif step == "finishSecret":
        _finish_secret(secrets_manager, arn, token)
    else:
        raise ValueError(f"Invalid step parameter: {step}")


# ---------------------------------------------------------------------------
# Step 1: Create Secret (AWSPENDING)
# ---------------------------------------------------------------------------

def _create_secret(
    secrets_manager: boto3.client, arn: str, token: str
) -> None:
    """
    Generate a new random password and store it as the AWSPENDING version.

    If an AWSPENDING version already exists (e.g., from a previous attempt),
    this step retrieves it instead of generating a new one.
    """
    # Ensure AWSCURRENT exists before proceeding
    secrets_manager.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")

    try:
        # Check if AWSPENDING already exists
        secrets_manager.get_secret_value(
            SecretId=arn, VersionId=token, VersionStage="AWSPENDING"
        )
        logger.info("createSecret: AWSPENDING version already exists for %s.", arn)
    except secrets_manager.exceptions.ResourceNotFoundException:
        # No pending secret — generate a new one
        # Get the current secret structure to preserve metadata
        current_secret = json.loads(
            secrets_manager.get_secret_value(
                SecretId=arn, VersionStage="AWSCURRENT"
            )["SecretString"]
        )

        # Generate a new random password
        new_password = secrets_manager.get_random_password(
            ExcludeCharacters=EXCLUDE_CHARACTERS,
            PasswordLength=32,
            ExcludePunctuation=False,
            ExcludeUppercase=False,
            ExcludeLowercase=False,
            ExcludeNumbers=False,
            RequireEachIncludedType=True
        )["RandomPassword"]

        # Build the new secret payload (preserve all other fields)
        new_secret = current_secret.copy()
        new_secret[DB_SECRET_KEY_PASSWORD] = new_password

        # Store as AWSPENDING
        secrets_manager.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps(new_secret),
            VersionStages=["AWSPENDING"]
        )
        logger.info(
            "createSecret: New password stored as AWSPENDING for %s.", arn
        )


# ---------------------------------------------------------------------------
# Step 2: Set Secret (apply to database)
# ---------------------------------------------------------------------------

def _set_secret(
    secrets_manager: boto3.client, arn: str, token: str
) -> None:
    """
    Read the AWSPENDING secret and update the database user's password.

    Adapt this function for your specific database engine:
      - MySQL:  ALTER USER 'user'@'host' IDENTIFIED BY 'password';
      - PG:     ALTER USER "user" PASSWORD 'password';
      - MSSQL:  ALTER LOGIN [user] WITH PASSWORD = 'password';
      - Oracle: ALTER USER user IDENTIFIED BY password;
    """
    # Retrieve the pending secret
    pending_secret_str = secrets_manager.get_secret_value(
        SecretId=arn, VersionId=token, VersionStage="AWSPENDING"
    )["SecretString"]
    pending_secret = json.loads(pending_secret_str)

    # Extract database connection details
    username = pending_secret[DB_SECRET_KEY_USERNAME]
    password = pending_secret[DB_SECRET_KEY_PASSWORD]
    host = pending_secret[DB_SECRET_KEY_HOST]
    port = pending_secret[DB_SECRET_KEY_PORT]
    dbname = pending_secret.get(DB_SECRET_KEY_DBNAME, "")
    engine = pending_secret.get(DB_SECRET_KEY_ENGINE, "mysql").lower()

    try:
        if engine.startswith("mysql") or engine.startswith("mariadb"):
            _set_mysql_password(host, port, username, password)
        elif engine.startswith("postgres") or engine.startswith("postgresql"):
            _set_postgres_password(host, port, username, password, dbname)
        elif engine.startswith("sqlserver") or engine.startswith("mssql"):
            _set_mssql_password(host, port, username, password)
        elif engine.startswith("oracle"):
            _set_oracle_password(host, port, username, password, dbname)
        else:
            raise ValueError(f"Unsupported database engine: {engine}")

        logger.info(
            "setSecret: Successfully updated password for %s on %s.",
            username, host
        )
    except Exception as exc:
        logger.error(
            "setSecret: Failed to update password for %s on %s: %s",
            username, host, str(exc)
        )
        raise


def _set_mysql_password(
    host: str, port: int, username: str, password: str
) -> None:
    """Update MySQL/MariaDB user password."""
    import pymysql
    conn = pymysql.connect(host=host, port=port, user=username, password=password)
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"ALTER USER '{username}'@'%' IDENTIFIED BY %s",
                (password,)
            )
        conn.commit()
    finally:
        conn.close()


def _set_postgres_password(
    host: str, port: int, username: str, password: str, dbname: str
) -> None:
    """Update PostgreSQL user password."""
    import psycopg2
    conn = psycopg2.connect(host=host, port=port, user=username, dbname=dbname)
    try:
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute(
                f"ALTER USER \"{username}\" PASSWORD %s",
                (password,)
            )
    finally:
        conn.close()


def _set_mssql_password(
    host: str, port: int, username: str, password: str
) -> None:
    """Update Microsoft SQL Server login password."""
    import pymssql
    conn = pymssql.connect(server=host, port=port, user=username, password=password)
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"ALTER LOGIN [{username}] WITH PASSWORD = %s",
                (password,)
            )
        conn.commit()
    finally:
        conn.close()


def _set_oracle_password(
    host: str, port: int, username: str, password: str, dbname: str
) -> None:
    """Update Oracle database user password."""
    import oracledb
    dsn = oracledb.makedsn(host, port, service_name=dbname)
    conn = oracledb.connect(user=username, password=password, dsn=dsn)
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"ALTER USER {username} IDENTIFIED BY \"{password}\"")
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Step 3: Test Secret
# ---------------------------------------------------------------------------

def _test_secret(
    secrets_manager: boto3.client, arn: str, token: str
) -> None:
    """
    Validate that the AWSPENDING credentials work against the database.

    This step confirms connectivity with the new password before the
    secret is promoted to AWSCURRENT.
    """
    pending_secret_str = secrets_manager.get_secret_value(
        SecretId=arn, VersionId=token, VersionStage="AWSPENDING"
    )["SecretString"]
    pending_secret = json.loads(pending_secret_str)

    username = pending_secret[DB_SECRET_KEY_USERNAME]
    password = pending_secret[DB_SECRET_KEY_PASSWORD]
    host = pending_secret[DB_SECRET_KEY_HOST]
    port = pending_secret[DB_SECRET_KEY_PORT]
    dbname = pending_secret.get(DB_SECRET_KEY_DBNAME, "")
    engine = pending_secret.get(DB_SECRET_KEY_ENGINE, "mysql").lower()

    try:
        if engine.startswith("mysql") or engine.startswith("mariadb"):
            _test_mysql_connection(host, port, username, password)
        elif engine.startswith("postgres") or engine.startswith("postgresql"):
            _test_postgres_connection(host, port, username, password, dbname)
        elif engine.startswith("sqlserver") or engine.startswith("mssql"):
            _test_mssql_connection(host, port, username, password)
        elif engine.startswith("oracle"):
            _test_oracle_connection(host, port, username, password, dbname)
        else:
            raise ValueError(f"Unsupported database engine: {engine}")

        logger.info(
            "testSecret: Successfully connected to %s with pending credentials.",
            host
        )
    except Exception as exc:
        logger.error(
            "testSecret: Connection failed for %s: %s", host, str(exc)
        )
        raise


def _test_mysql_connection(
    host: str, port: int, username: str, password: str
) -> None:
    """Test MySQL/MariaDB connection with given credentials."""
    import pymysql
    conn = pymysql.connect(host=host, port=port, user=username, password=password)
    conn.close()


def _test_postgres_connection(
    host: str, port: int, username: str, password: str, dbname: str
) -> None:
    """Test PostgreSQL connection with given credentials."""
    import psycopg2
    conn = psycopg2.connect(host=host, port=port, user=username, password=password, dbname=dbname)
    conn.close()


def _test_mssql_connection(
    host: str, port: int, username: str, password: str
) -> None:
    """Test SQL Server connection with given credentials."""
    import pymssql
    conn = pymssql.connect(server=host, port=port, user=username, password=password)
    conn.close()


def _test_oracle_connection(
    host: str, port: int, username: str, password: str, dbname: str
) -> None:
    """Test Oracle connection with given credentials."""
    import oracledb
    dsn = oracledb.makedsn(host, port, service_name=dbname)
    conn = oracledb.connect(user=username, password=password, dsn=dsn)
    conn.close()


# ---------------------------------------------------------------------------
# Step 4: Finish Secret (promote AWSPENDING to AWSCURRENT)
# ---------------------------------------------------------------------------

def _finish_secret(
    secrets_manager: boto3.client, arn: str, token: str
) -> None:
    """
    Promote the AWSPENDING version to AWSCURRENT by moving the stage label.

    The old AWSCURRENT version retains only AWSPREVIOUS stage.
    """
    metadata = secrets_manager.describe_secret(SecretId=arn)
    current_version = None

    for version, stages in metadata["VersionIdsToStages"].items():
        if "AWSCURRENT" in stages:
            if version == token:
                # Already current — nothing to do
                logger.info(
                    "finishSecret: Version %s is already AWSCURRENT.", version
                )
                return
            current_version = version
            break

    # Promote pending -> current, demote old current -> previous
    secrets_manager.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
    logger.info(
        "finishSecret: Promoted version %s to AWSCURRENT for %s.",
        token, arn
    )


# ---------------------------------------------------------------------------
# Required IAM Policy for this Lambda
# ---------------------------------------------------------------------------
#
# Attach the following IAM policy to the Lambda execution role:
#
# {
#     "Version": "2012-10-17",
#     "Statement": [
#         {
#             "Effect": "Allow",
#             "Action": [
#                 "secretsmanager:DescribeSecret",
#                 "secretsmanager:GetSecretValue",
#                 "secretsmanager:PutSecretValue",
#                 "secretsmanager:UpdateSecretVersionStage",
#                 "secretsmanager:GetRandomPassword"
#             ],
#             "Resource": "arn:aws:secretsmanager:*:*:secret:my-db-secret-*"
#         },
#         {
#             "Effect": "Allow",
#             "Action": "secretsmanager:GetSecretValue",
#             "Resource": "*"
#         },
#         {
#             "Effect": "Allow",
#             "Action": [
#                 "ec2:CreateNetworkInterface",
#                 "ec2:DescribeNetworkInterfaces",
#                 "ec2:DeleteNetworkInterface"
#             ],
#             "Resource": "*"
#         }
#     ]
# }
#
# NOTES:
#   - The `ec2:CreateNetworkInterface` permissions are required when the
#     Lambda is attached to a VPC (needed to reach an RDS instance).
#   - Scope the Secrets Manager resource ARN to the specific secret or
#     use a prefix pattern as shown above.
#   - For multi-user rotation, additional permissions are needed for
#     the master user to change the target user's password.
#
# ---------------------------------------------------------------------------
