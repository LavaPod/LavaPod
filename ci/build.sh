#! /bin/sh
# exit script when any command ran here returns with non-zero exit code
set -e

rm -R deploy || true
# We must export it so it's available for envsubst
# since the only way for envsubst to work on files is using input/output redirection,
#  it's not possible to do in-place substitution, so we need to save the output to another file
#  and overwrite the original with that one.
apt-get install curl -y || true
curl -L https://github.com/a8m/envsubst/releases/download/v1.1.0/envsubst-`uname -s`-`uname -m` -o envsubst || true
chmod +x envsubst || true
mv envsubst /usr/local/bin || true

mkdir deploy || true
for f in $(ls deployment/dev/kubernetes/*yaml); do
    export FILENAME=${f##*/}
    echo "Detected kubernetes file -> $f"
    envsubst "${COMMIT_SHA1}" < $f > "deploy/$FILENAME.yml"
done