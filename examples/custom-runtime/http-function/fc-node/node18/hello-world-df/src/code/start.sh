trap 'kill -TERM $CPID' TERM
trap 'kill -INT $CPID' INT
( echo "start" && node server.js ) &
CPID="$!"
wait $CPID
trap - TERM INT
wait $CPID
