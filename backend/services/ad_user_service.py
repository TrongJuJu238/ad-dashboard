import json
from backend.config import Config
from backend.core.powershell_executor import run_powershell
from backend.core.security import build_ldap_filter
from backend.core.audit_logger import log_unlock

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
    -Properties DisplayName,Description,employeeID,UserPrincipalName,LockedOut,Mail,DistinguishedName |
    Select-Object DisplayName,Description,employeeID,UserPrincipalName,LockedOut,Mail,DistinguishedName,SamAccountName |
    ConvertTo-Json -Depth 3
    """
    output = run_powershell(ps_command)
    if not output: return []
    try: data = json.loads(output)
    except Exception: return []
    if isinstance(data, dict): data = [data]
    users = []
    for user in data:
        sam = user.get("SamAccountName", "")
        upn = user.get("UserPrincipalName")
        if not upn and sam: upn = f"{sam}@{Config.AD_DOMAIN}"
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
    if not sam: return False
    ps_command = f"""
    Import-Module ActiveDirectory;
    Unlock-ADAccount -Identity "{sam}"
    """
    output = run_powershell(ps_command)
    success = output is not None
    log_unlock(sam, success)
    return success

def get_user_groups(username):
    username = username.replace('"', '')
    ps_command = f'''
    Get-ADUser "{username}" -Properties MemberOf |
    Select -ExpandProperty MemberOf |
    ForEach-Object {{ ($_ -split ",")[0] -replace "CN=","" }} |
    ConvertTo-Json
    '''
    output = run_powershell(ps_command)
    if not output: return []
    try:
        data = json.loads(output)
        if isinstance(data, str): return [data]
        return data
    except Exception:
        return []

def compare_groups(user1, user2):
    groups1 = get_user_groups(user1)
    groups2 = get_user_groups(user2)
    all_groups = set(groups1) | set(groups2)
    result = []
    for g in sorted(all_groups):
        result.append({
            "group": g,
            "user1": g in groups1,
            "user2": g in groups2
        })
    return result
