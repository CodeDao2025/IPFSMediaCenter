# IPFS Media Center

IPFS Media Center 是一个基于 IPFS（星际文件系统）的媒体管理应用，提供了一个直观的界面来管理和访问您的媒体文件。

## 功能特性

- 🖼️ 图片管理：支持查看、上传和管理图片文件
- 🎥 视频播放：内置视频播放器，支持多种视频格式
- 🎵 音乐播放：集成 APlayer 音乐播放器，支持播放列表管理
- 📁 收藏列表：创建和管理媒体收藏列表
- 🔄 CID 导入：支持通过 IPFS CID 导入媒体文件
- 🌓 深色模式：支持明暗主题切换
- ⚙️ 自定义设置：可配置 IPFS API 和网关地址

## 系统要求

- 本地 IPFS 节点（推荐使用 IPFS Desktop 或 go-ipfs）
- 记得修改IPFS配置，允许跨域访问
- ```
  "API": {
		"HTTPHeaders": {
			"Access-Control-Allow-Methods": [
				"PUT",
				"POST",
				"GET"
			],
			"Access-Control-Allow-Origin": [
				"*"
			]
		}
	},
  ```
- 现代浏览器（支持 ES6+）

## 安装说明

1. 确保您已安装并运行了本地 IPFS 节点
2. 通过浏览器访问应用

## 配置说明

首次使用时，需要在设置中配置：

- IPFS API 地址（默认：`http://localhost:5001`）
- IPFS Gateway 地址（默认：`http://localhost:8080`）

## 使用方法

1. **上传文件**
   - 点击界面上的"上传"按钮
   - 选择要上传的媒体文件
   - 文件将自动上传到对应类型的目录

2. **通过 CID 添加文件**
   - 点击"添加 CID"按钮
   - 输入文件的 CID 和文件名
   - 文件将被添加到对应类型的目录

3. **创建收藏列表**
   - 点击侧边栏的"收藏列表"
   - 选择"新建列表"
   - 输入列表名称并创建

4. **导入收藏列表**
   - 在收藏列表菜单中选择"导入列表"
   - 输入列表的 CID
   - 确认导入

## 技术栈

- Bootstrap 5：UI 框架
- APlayer：音乐播放器
- DPlayer：视频播放器
- IPFS HTTP API：与 IPFS 节点交互 
