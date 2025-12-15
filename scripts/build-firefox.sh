#!/bin/bash

# ClearTab Firefox 打包脚本
# 生成可直接提交到 Firefox Add-ons 的 zip 包

set -e

echo "🦊 开始构建 Firefox 扩展..."

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

# 读取版本号
VERSION=$(node -p "require('./package.json').version")
OUTPUT_NAME="cleartab-firefox-v${VERSION}.zip"

# 清理旧的构建
echo "📦 清理旧构建..."
rm -rf dist
rm -f "$OUTPUT_NAME"

# 构建项目
echo "🔨 构建项目..."
npm run build

# Firefox 特殊处理：确保 manifest.json 包含 gecko 配置
echo "🔧 检查 Firefox 兼容性配置..."
if ! grep -q "browser_specific_settings" dist/manifest.json; then
    echo "⚠️  警告: manifest.json 缺少 browser_specific_settings 配置"
fi

# 创建 zip 包
echo "📦 创建 Firefox 扩展包..."
cd dist
zip -r "../$OUTPUT_NAME" . -x "*.DS_Store"
cd ..

# 显示结果
FILE_SIZE=$(du -h "$OUTPUT_NAME" | cut -f1)
echo ""
echo "✅ Firefox 扩展打包完成！"
echo "📁 文件: $OUTPUT_NAME"
echo "📊 大小: $FILE_SIZE"
echo ""
echo "💡 发布到 Firefox Add-ons:"
echo "   1. 访问 https://addons.mozilla.org/developers/"
echo "   2. 找到你的扩展，点击「提交新版本」"
echo "   3. 上传 $OUTPUT_NAME"
echo ""
echo "💡 本地测试:"
echo "   1. 打开 Firefox，访问 about:debugging"
echo "   2. 点击「此 Firefox」"
echo "   3. 点击「临时载入附加组件」"
echo "   4. 选择 dist/manifest.json"
