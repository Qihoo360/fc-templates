#!/bin/sh

TEMPLATE="$1"
VARS_FILE="$2"

while IFS='=' read -r key val || [ -n "$key" ]; do
  key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  val=$(echo "$val" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  [ -z "$key" ] && continue
  case "$key" in \#*) continue ;; esac

  eval "vars_$key=\"\$val\""
done < "$VARS_FILE"

while IFS= read -r line || [ -n "$line" ]; do
  while echo "$line" | grep -q "\${[a-zA-Z_][a-zA-Z0-9_]*}"; do
    match=$(echo "$line" | sed -n 's/.*\(\${[a-zA-Z_][a-zA-Z0-9_]*}\).*/\1/p' | head -n1)
    varname=$(echo "$match" | sed 's/[${}]//g')
    value=$(eval "printf '%s' \"\${vars_$varname}\"")

    if [ -z "$value" ]; then
      echo "Warning: variable \${$varname} is undefined or empty" >&2
    fi

    escaped_value=$(printf '%s\n' "$value" | sed 's/[&/]/\\&/g')
    line=$(echo "$line" | sed "s|\${$varname}|$escaped_value|g")
  done
  echo "$line"
done < "$TEMPLATE"