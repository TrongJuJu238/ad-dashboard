def ldap_escape(value: str) -> str:
    replace_map = {
        "\\": r"\5c",
        "*": r"\2a",
        "(": r"\28",
        ")": r"\29",
        "\0": r"\00",
        "/": r"\2f"
    }
    for k, v in replace_map.items():
        value = value.replace(k, v)
    return value

def build_ldap_filter(keyword: str):

    if not keyword:
        return "(objectClass=user)"

    kw = ldap_escape(keyword)

    return f"(&(objectCategory=person)(objectClass=user)(|(displayName=*{kw}*)(name=*{kw}*)(sAMAccountName=*{kw}*)(userPrincipalName=*{kw}*)(mail=*{kw}*)(employeeID=*{kw}*)(description=*{kw}*)))"