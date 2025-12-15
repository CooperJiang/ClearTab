#!/bin/bash

# ClearTab Chrome 打包脚本
# 生成可直接加载的 Chrome 扩展 zip 包

set -e

echo "🚀 开始构建 Chrome 扩展..."

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

# 读取版本号
VERSION=$(node -p "require('./package.json').version")
OUTPUT_NAME="cleartab-chrome-v${VERSION}.zip"

# 清理旧的构建
echo "📦 清理旧构建..."
rm -rf dist
rm -f "$OUTPUT_NAME"

# 构建项目
echo "🔨 构建项目..."
npm run build

# 创建 zip 包
echo "📦 创建 Chrome 扩展包..."
cd dist
zip -r "../$OUTPUT_NAME" . -x "*.DS_Store"
cd ..

# 显示结果
FILE_SIZE=$(du -h "$OUTPUT_NAME" | cut -f1)
echo ""
echo "✅ Chrome 扩展打包完成！"
echo "📁 文件: $OUTPUT_NAME"
echo "📊 大小: $FILE_SIZE"
echo ""
echo "💡 使用方法:"
echo "   1. 打开 Chrome，访问 chrome://extensions/"
echo "   2. 开启「开发者模式」"
echo "   3. 将 $OUTPUT_NAME 拖入浏览器窗口"
echo "   或解压后点击「加载已解压的扩展程序」选择文件夹"
