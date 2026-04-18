#!/bin/bash
# 用法: ./sync.sh "你的提交说明"

MSG="${1:-更新游戏内容}"

echo "→ 添加变更..."
git add .

echo "→ 提交: $MSG"
git commit -m "$MSG" || echo "没有新的变更需要提交"

echo "→ 推送到 GitHub..."
git push origin main

echo "✅ 已推送到 GitHub"
echo "   仓库地址: https://github.com/ariespo/zhangmen"
echo "   若 Vercel 已关联 GitHub，部署将自动触发。"
echo "   Vercel 地址: https://vercel.com/klymds-projects/zhangmen"
