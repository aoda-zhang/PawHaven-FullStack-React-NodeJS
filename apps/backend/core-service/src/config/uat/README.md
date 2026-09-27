# github action 中如何登录 azure

1. 先到 App registrations 注册 app 获取 appid 和 tenantId， 一定要记住 secret value
2. 绑定权限 az role assignment create \
   --assignee <appId> \
   --role Contributor \
   --scope /subscriptions/<subscription-id>

{
"clientId": "**\*\***\***\*\***",
"clientSecret": "\***\*\*\*\*\*\*\***",
"subscriptionId": "**\*\***\***\*\***",
"tenantId": "**\*\***\***\*\***"
}

3. 将获取的内容绑定到 github action 中

# API 端口如何设置

1. 具体 app 中会监听特定端口，如 3000
2. app 中监听的 host 必须为 0.0.0.0
3. service 的 targetPort 必须保持和 app 中监听的端口一致

# AKS 如何设置 gateway

1.  注册 nginx
    在 azure port command 中运行
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.4/deploy/static/provider/cloud/deploy.yaml
2.  部署 ingress nginx 到 aks ， 参考 aksSettings 中的 proxy

# 微服务之间相互调用出现无法 call 通

记住微服务之间通过端口号 call，必须在 deploy 和 service 中详细写明端口号的映射

例如

service：
ports: - protocol: TCP
port: 8081
targetPort: 8081

deploy：

ports: - containerPort: 8081

# 微服务调用一直 pening

- 确定监听的 host 必须为 0.0.0.0
- 微服务的 clusterIP 地址不需要加前缀 http 或者 https
- deploy 和 service 的端口必须和实际运行的端口保持一致！！！
