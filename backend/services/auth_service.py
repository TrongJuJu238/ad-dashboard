from ldap3 import Server, Connection, ALL
from backend.config import Config

def authenticate(username, password):
    """
    Xác thực user bằng LDAP bind.
    """
    try:
        server = Server(Config.LDAP_SERVER, get_info=ALL)
        user_dn = f"{username}@{Config.AD_DOMAIN}"
        conn = Connection(server, user=user_dn, password=password, auto_bind=True)
        
        return {
            "username": username,
            "domain": Config.AD_DOMAIN
        }
    except Exception as e:
        print(f"LDAP Auth Error: {e}")
        return None
