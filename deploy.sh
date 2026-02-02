zip -r hotspot_auth.zip . -x "./deploy.sh" "./conn.sh"

read -p "Public DNS: " dns
echo $dns
scp -i "./EC2Key.pem" ./hotspot_auth.zip ec2-user@$dns:/home/ec2-user/apps