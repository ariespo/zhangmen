#!/bin/bash
FILE="C:/binbin/zhangmen/index.html"
OUT="C:/binbin/zhangmen/index1.html"

# 1. Head start (1-144)
sed -n '1,144p' "$FILE" > "$OUT"

# 2. Add SillyTavern CSS link
cat >> "$OUT" <> "$OUT"

# 4. Native HTML body (1640-2062)
sed -n '1640,2062p' "$FILE" >> "$OUT"

# 5. Native JS (2063-2575)
sed -n '2063,2575p' "$FILE" >> "$OUT"

# 6. Add SillyTavern JS link
cat >> "$OUT" <> "$OUT"

echo "Created $OUT"
