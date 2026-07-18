import json
from flask import current_app
from core.powershell_executor import run_powershell
from core.security import build_ldap_filter
from core.audit_logger import log_unlock


def extract_ou(dn):
    if not dn:
        return "-"

    parts = dn.split(",")

    for part in parts:
        part = part.strip()
        if part.startswith("OU="):
            return part.replace("OU=", "")

    return "-"


def search_ad_users(keyword):

    ldap_filter = build_ldap_filter(keyword)

    ps_command = f"""
    Import-Module ActiveDirectory;

    Get-ADUser -LDAPFilter "{ldap_filter}" `
    -Properties DisplayName,Description,employeeID,
                UserPrincipalName,LockedOut,Mail,DistinguishedName |
    Select-Object DisplayName,Description,employeeID,
                  UserPrincipalName,LockedOut,Mail,
                  DistinguishedName,SamAccountName |
    ConvertTo-Json -Depth 3
    """

    output = run_powershell(ps_command)

    if not output:
        return []

    try:
        data = json.loads(output)
    except Exception:
        return []

    if isinstance(data, dict):
        data = [data]

    users = []

    for user in data:

        sam = user.get("SamAccountName", "")
        upn = user.get("UserPrincipalName")

        if not upn and sam:
            upn = f"{sam}@{current_app.config['AD_DOMAIN']}"

        dn = user.get("DistinguishedName")

        users.append({
            "employeeID": user.get("employeeID") or "-",
            "DisplayName": user.get("DisplayName") or "-",
            "Description": user.get("Description") or "-",
            "AccountUPN": upn or "-",
            "LockedOut": bool(user.get("LockedOut")),
            "Mail": user.get("Mail"),
            "DistinguishedName": dn or "-",
            "DepartmentOU": extract_ou(dn),
            "SamAccountName": sam
        })

    return users


def unlock_user(sam):

    if not sam:
        return False

    ps_command = f"""
    Import-Module ActiveDirectory;
    Unlock-ADAccount -Identity "{sam}"
    """

    output = run_powershell(ps_command)
    success = output is not None

    log_unlock(sam, success)

    return success
