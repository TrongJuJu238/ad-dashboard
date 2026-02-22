import json
from flask import current_app
from core.powershell_executor import run_powershell


DEPARTMENT_MAP = {
    "MKA": "Advertising",
    "ADD": "All Day Dinning",
    "FBK": "Banquets",
    "FBB": "Beverage",
    "BCN": "Business Center",
    "CAG": "Cage",
    "CMK": "Casino Marketing",
    "CPL": "Casino Player's Club",
    "CVP": "Casino VIP Services",
    "FCT": "Catering",
    "CCB": "Chip Bank",
    "CNT": "Count",
    "FCL": "Culinary",
    "FDG": "Dunes Grill",
    "EDR": "Employee Dining",
    "ENG": "Engineering",
    "EXO": "Executive Offices",
    "FBR": "F&B Restaurant",
    "FAD": "F&B Admin",
    "FIN": "Finance",
    "RFC": "Fitness Center",
    "RFO": "Front Office",
    "RGR": "Garage",
    "CHL": "High Limit Cage",
    "RHK": "Housekeeping",
    "HRD": "Human Resources",
    "ITD": "IT",
    "J01": "Junket Room 01",
    "JXX": "Junket Room XX",
    "KCN": "Kids/Teen Center",
    "LND": "Laundry",
    "FLB": "Lion's Bar",
    "CMB": "Main Bank",
    "FMK": "Main Kitchen",
    "CMT": "Marker Bank",
    "OWN": "Owner",
    "FPH": "Pho Shop",
    "P01": "Pit 01",
    "PXX": "Pit XX",
    "POL": "Pool",
    "PRL": "Public Relations",
    "RES": "Reservation",
    "RET": "Retail",
    "CRL": "Rolling Cage",
    "RMS": "Room Service",
    "RAD": "Rooms Administration",
    "MKS": "Sales",
    "SAL": "Salon",
    "SEC": "Security",
    "CSL": "Slots",
    "SPA": "Spa",
    "REC": "Recreation",
    "FSW": "Stewards",
    "SUR": "Surveillance",
    "CTJ": "Table Games Junket",
    "CTM": "Table Games Mass",
    "TEL": "Telecommunication",
    "RTP": "Transportation",
    "UNF": "Uniform",
    "UTL": "Utilities",
    "RVL": "Valet",
    "CTG": "Table Games Operations",
    "PUB": "Public Area",
    "HOT": "Hotel",
    "FPR": "Payroll",
    "CVC": "VIP Cage",
}


def extract_ou(dn):
    if not dn:
        return "-"

    parts = dn.split(",")

    for part in parts:
        part = part.strip()
        if part.startswith("OU="):
            return part.replace("OU=", "")

    return "-"


def extract_dept_from_name(name):
    if not name:
        return "-"

    for code in DEPARTMENT_MAP.keys():
        if code in name:
            return code

    return "-"


def search_ad_computers(keyword):

    safe_keyword = keyword.replace("'", "''")

    ps_command = f"""
    Import-Module ActiveDirectory;

    $computers = Get-ADComputer -Filter "Name -like '*{safe_keyword}*'" `
        -Properties DistinguishedName,DNSHostName,Description

    $result = foreach ($pc in $computers) {{

        $ip = ""
        try {{
            $ip = (Resolve-DnsName $pc.DNSHostName -ErrorAction Stop |
                  Where-Object {{$_.Type -eq "A"}} |
                  Select-Object -First 1 -ExpandProperty IPAddress)
        }} catch {{
            $ip = "Offline"
        }}

        [PSCustomObject]@{{
            Name = $pc.Name
            DNS  = $pc.DNSHostName
            IP   = $ip
            DN   = $pc.DistinguishedName
            Description = $pc.Description
        }}
    }}

    $result | ConvertTo-Json -Depth 3
    """

    output = run_powershell(ps_command)

    if not output:
        return []

    try:
        data = json.loads(output)
    except:
        return []

    if isinstance(data, dict):
        data = [data]

    computers = []

    for pc in data:
        dn = pc.get("DN")

        computers.append({
            "Name": pc.get("Name"),
            "IP": pc.get("IP") or "Offline",
            "Object": dn,
            "Department": extract_dept_from_name(pc.get("Name")),
            "OU": extract_ou(dn),
            "Description": pc.get("Description") or "-"
        })

    return computers


def open_remote(host):

    ps_command = fr'''
    $exe = "{current_app.config["DAMEWARE_PATH"]}"
    Start-Process $exe -ArgumentList "-m:{host} -a:1 -c:0 -x -h"
    '''

    run_powershell(ps_command)