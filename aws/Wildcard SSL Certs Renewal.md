Wildcard SSL Certs Renewal

1. Log in to instance.

ssh -i ~/.ssh/xrtour-prod-key-pair.pem ec2-user@xrtour-prod.us-west-1.elasticbeanstalk.com

2. Become superuser.

sudo su

2. Activate the python virtual environment with the newer version of certbot.

source certbot-env/bin/activate

3. Pull down the relevant environment variables from AWS

LETSENCRYPT_OPTS=`/opt/elasticbeanstalk/bin/get-config environment -k LETSENCRYPT_OPTS`
LETSENCRYPT_EMAIL=`/opt/elasticbeanstalk/bin/get-config environment -k LETSENCRYPT_EMAIL`
LETSENCRYPT_ALL_DOMAINS=`/opt/elasticbeanstalk/bin/get-config environment -k LETSENCRYPT_ALL_DOMAINS`

4. Execute certbot renewal, adding wildcard domains

certbot certonly ${LETSENCRYPT_OPTS} --manual --debug --email ${LETSENCRYPT_EMAIL} --agree-tos --domains ${LETSENCRYPT_ALL_DOMAINS},_.xrtour.org,_.staging.xrtour.org --keep-until-expiring

5. Follow instructions to create needed files, logging in through another tab.

sudo su
cd /var/app/current/nginx/webroot/.well-known/acme-challenge
echo "[data from certbot]" > [filename from certbot]

6. Log in to CloudFlare, set up TXT records from certbot

7. Reboot nginx

docker exec [nginx container id] nginx -s reload
