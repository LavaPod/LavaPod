kubectl create secret generic -n lavapod nats-auth --from-file=auth.json
kubectl apply -f *.yaml -n lavapod
