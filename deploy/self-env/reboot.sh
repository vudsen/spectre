#!/bin/bash
export SPECTRE_VERSION=$1

sudo docker compose --project-directory /opt/spectre ps | grep -q "spectre-web" \
    && (docker compose --project-directory /opt/spectre down && docker compose --project-directory /opt/spectre up -d) \
    || docker compose --project-directory /opt/spectre up -d


#-----------delete legacy images-----------
# 定义要匹配的镜像前缀
TARGET_PREFIX="public.ecr.aws/b9z8l9n7/vudsen/spectre"

echo "正在搜索前缀为: $TARGET_PREFIX 的镜像..."

# 获取镜像 ID 列表
# awk '{print $3}' 提取的是 IMAGE ID
IMAGE_IDS=$(docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "^$TARGET_PREFIX" | awk '{print $2}' | sort -u)

if [ -z "$IMAGE_IDS" ]; then
    echo "没有找到匹配的镜像。"
    exit 0
fi

echo "找到以下镜像 ID:"
echo "$IMAGE_IDS"
echo "--------------------------------"

# 执行删除操作
# 如果你想先测试，请注释掉下面这一行
docker rmi -f $IMAGE_IDS

echo "--------------------------------"
echo "删除操作已完成。"