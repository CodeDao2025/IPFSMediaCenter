// IPFS HTTP API 客户端
class IPFSClient {
    constructor() {
        // 从本地存储加载配置
        const savedSettings = this.loadSettings();
        
        // 默认配置
        this.apiUrl = savedSettings.apiUrl || 'http://localhost:5001/api/v0';
        this.gatewayUrl = savedSettings.gatewayUrl || 'http://localhost:8080/ipfs';
        this.isConnected = false;
        this.mediaPath = '/media-center';
        this.imagesPath = `${this.mediaPath}/images`;
        this.videosPath = `${this.mediaPath}/videos`;
        this.musicPath = `${this.mediaPath}/music`;
        this.othersPath = `${this.mediaPath}/others`;
        this.collectionsPath = `${this.mediaPath}/collections`;
        
        // 初始化设置事件监听
        this.initSettingsHandlers();
    }

    // 加载保存的设置
    loadSettings() {
        const settings = localStorage.getItem('ipfs-settings');
        return settings ? JSON.parse(settings) : {};
    }

    // 保存设置
    async saveSettings(settings) {
        const { apiUrl, gatewayUrl } = settings;
        
        // 更新实例属性
        this.apiUrl = apiUrl.endsWith('/api/v0') ? apiUrl : `${apiUrl}/api/v0`;
        this.gatewayUrl = gatewayUrl.endsWith('/ipfs') ? gatewayUrl : `${gatewayUrl}/ipfs`;
        
        // 保存到本地存储
        localStorage.setItem('ipfs-settings', JSON.stringify({
            apiUrl: this.apiUrl,
            gatewayUrl: this.gatewayUrl
        }));

        // 测试连接
        const isConnected = await this.checkConnection();
        if (isConnected) {
            // 连接成功，刷新页面
            window.location.reload();
            return true;
        } else {
            throw new Error('无法连接到IPFS节点，请检查地址是否正确');
        }
    }

    // 初始化设置界面的事件处理
    initSettingsHandlers() {
        // 当设置对话框打开时，填充当前设置
        document.getElementById('settingsModal')?.addEventListener('show.bs.modal', () => {
            const apiHost = this.apiUrl.replace('/api/v0', '');
            const gatewayHost = this.gatewayUrl.replace('/ipfs', '');
            
            document.getElementById('ipfsApiHost').value = apiHost;
            document.getElementById('ipfsGatewayHost').value = gatewayHost;
        });

        // 保存设置按钮点击事件
        document.getElementById('saveSettings')?.addEventListener('click', async () => {
            const apiHost = document.getElementById('ipfsApiHost').value.trim();
            const gatewayHost = document.getElementById('ipfsGatewayHost').value.trim();

            try {
                await this.saveSettings({
                    apiUrl: apiHost,
                    gatewayUrl: gatewayHost
                });
                
                // 关闭对话框
                const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
                modal.hide();
                
                // 显示成功提示
                // alert('设置已保存，IPFS连接已更新');
            } catch (error) {
                alert('保存设置失败：' + error.message);
            }
        });
    }

    // 检查IPFS节点连接状态
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/version`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            this.isConnected = true;
            console.log('IPFS Version:', data.Version);
            
            // 初始化MFS目录
            await this.initMFS();
            return true;
        } catch (error) {
            console.error('IPFS连接失败:', error);
            this.isConnected = false;
            return false;
        }
    }

    // 初始化MFS目录结构
    async initMFS() {
        try {
            // 创建所有必要的目录
            const directories = [
                this.mediaPath,
                this.imagesPath,
                this.videosPath,
                this.musicPath,
                this.othersPath,
                this.collectionsPath
            ];

            for (const dir of directories) {
                await fetch(`${this.apiUrl}/files/mkdir?arg=${dir}&parents=true`, {
                    method: 'POST'
                });
            }

            // 列出整个目录结构
            //console.log('媒体中心目录结构:');
            //await this.listMFSRecursive(this.mediaPath);

        } catch (error) {
            console.error('初始化MFS失败:', error);
            throw error;
        }
    }

    // 递归列出目录内容
    async listMFSRecursive(path, depth = 0) {
        try {
            const entries = await this.listMFS(path);
            for (const entry of entries) {
                if (entry.Type === 1) { // 如果是目录
                    await this.listMFSRecursive(`${path}/${entry.Name}`, depth + 1);
                }
            }
        } catch (error) {
            console.error(`列出目录失败: ${path}`, error);
        }
    }

    // 列出MFS目录内容
    async listMFS(path = '/') {
        try {
            const response = await fetch(`${this.apiUrl}/files/ls?arg=${path}&long=true`, {
                method: 'POST'
            });
            const data = await response.json();
            // console.log('MFS目录内容:', path);
            // data.Entries?.forEach(entry => {
            //     console.log(`${'  '.repeat(path.split('/').length - 1)}${entry.Type === 1 ? '📁' : '📄'} ${entry.Name} (${entry.Size} bytes)`);
            // });
            return data.Entries || [];
        } catch (error) {
            console.error('列出MFS目录失败:', error);
            throw error;
        }
    }

    // 添加媒体文件到对应目录
    async addMediaFile(file, type) {
        try {
            // 上传文件到IPFS
            const result = await this.addFile(file);
            const targetPath = this[`${type}Path`];
            
            // 将文件写入到对应的MFS目录，使用原始文件名
            const filePath = `${targetPath}/${file.name}`;
            const formData = new FormData();
            formData.append('file', file);
            await fetch(`${this.apiUrl}/files/write?arg=${filePath}&create=true`, {
                method: 'POST',
                body: formData
            });

            return {
                ...result,
                mfsPath: filePath,
                name: file.name
            };
        } catch (error) {
            console.error('添加媒体文件失败:', error);
            throw error;
        }
    }

    // 获取目录内容
    async getDirectoryFiles(type) {
        try {
            const path = this[`${type}Path`];
            const entries = await this.listMFS(path);
            return entries || [];
        } catch (error) {
            console.error('获取目录内容失败:', error);
            return [];
        }
    }

    // 获取目录的元数据
    async getDirectoryMetadata(type) {
        try {
            const metadataPath = `${this[`${type}Path`]}/.metadata.json`;
            try {
                return await this.readFromMFS(metadataPath);
            } catch (error) {
                // 如果元数据文件不存在，先创建它
                await this.writeToMFS(metadataPath, []);
                return [];
            }
        } catch (error) {
            console.error('获取目录元数据失败:', error);
            return [];
        }
    }

    // 创建收藏列表
    async createCollection(name, items = []) {
        try {
            const collectionPath = `${this.collectionsPath}/${name}.json`;
            await this.writeToMFS(collectionPath, items);
            return name;
        } catch (error) {
            console.error('创建收藏列表失败:', error);
            throw error;
        }
    }

    // 获取收藏列表
    async getCollection(name) {
        try {
            const collectionPath = `${this.collectionsPath}/${name}.json`;
            return await this.readFromMFS(collectionPath);
        } catch (error) {
            console.error('获取收藏列表失败:', error);
            throw error;
        }
    }

    // 获取所有收藏列表
    async getAllCollections() {
        try {
            const entries = await this.listMFS(this.collectionsPath);
            const collections = [];
            for (const entry of entries) {
                if (entry.Name.endsWith('.json')) {
                    const name = entry.Name.replace('.json', '');
                    const items = await this.getCollection(name);
                    collections.push({ name, items });
                }
            }
            return collections;
        } catch (error) {
            console.error('获取所有收藏列表失败:', error);
            return [];
        }
    }

    // 更新收藏列表
    async updateCollection(name, items) {
        return await this.createCollection(name, items);
    }

    // 删除收藏列表
    async deleteCollection(name) {
        try {
            const collectionPath = `${this.collectionsPath}/${name}.json`;
            await fetch(`${this.apiUrl}/files/rm?arg=${collectionPath}`, {
                method: 'POST'
            });
            return true;
        } catch (error) {
            console.error('删除收藏列表失败:', error);
            throw error;
        }
    }

    // 添加文件到IPFS
    async addFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiUrl}/add`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            return {
                hash: data.Hash,
                name: data.Name,
                size: data.Size,
                url: `${this.gatewayUrl}/${data.Hash}`
            };
        } catch (error) {
            console.error('添加文件失败:', error);
            throw error;
        }
    }

    // 从IPFS获取文件
    async getFile(hash) {
        try {
            const response = await fetch(`${this.gatewayUrl}/${hash}`);
            return response;
        } catch (error) {
            console.error('获取文件失败:', error);
            throw error;
        }
    }

    // 通过CID添加文件到MFS
    async addMediaByCid(cid, fileName, type) {
        try {
            const targetPath = this[`${type}Path`];
            const filePath = `${targetPath}/${fileName}`;
            
            // 使用cp命令将IPFS中的文件复制到MFS
            const response = await fetch(`${this.apiUrl}/files/cp?arg=/ipfs/${cid}&arg=${filePath}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('添加文件失败');
            }

            // 获取文件信息
            const statResponse = await fetch(`${this.apiUrl}/files/stat?arg=${filePath}`, {
                method: 'POST'
            });
            const statData = await statResponse.json();

            return {
                Hash: cid,
                Name: fileName,
                Size: statData.Size,
                mfsPath: filePath
            };
        } catch (error) {
            console.error('通过CID添加文件失败:', error);
            throw error;
        }
    }

    // 写入文件到MFS
    async writeToMFS(path, content) {
        try {
            const blob = new Blob([JSON.stringify(content)], { type: 'application/json' });
            const file = new File([blob], 'data.json');
            const formData = new FormData();
            formData.append('file', file);

            await fetch(`${this.apiUrl}/files/write?arg=${path}&create=true&truncate=true`, {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.error('写入MFS失败:', error);
            throw error;
        }
    }

    // 从MFS读取文件
    async readFromMFS(path) {
        try {
            const response = await fetch(`${this.apiUrl}/files/read?arg=${path}`, {
                method: 'POST'
            });
            const text = await response.text();
            return JSON.parse(text);
        } catch (error) {
            console.error('读取MFS失败:', error);
            throw error;
        }
    }

    // 获取本地节点ID
    async getNodeId() {
        try {
            const response = await fetch(`${this.apiUrl}/id`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('获取节点ID失败:', error);
            throw error;
        }
    }

    // 删除媒体文件
    async deleteMediaFile(type, fileName) {
        try {
            const filePath = `${this[`${type}Path`]}/${fileName}`;
            await fetch(`${this.apiUrl}/files/rm?arg=${filePath}`, {
                method: 'POST'
            });
            return true;
        } catch (error) {
            console.error('删除文件失败:', error);
            throw error;
        }
    }

    // 保存收藏列表数据
    async savePlaylistData(playlist, playlistName) {
        try {
            // 使用时间戳作为文件名
            const timestamp = Date.now();
            const playlistPath = `${this.collectionsPath}/${timestamp}.json`;
            // 将列表名称存储在文件内容中
            const playlistData = {
                name: playlistName,
                items: playlist.items || [],
                createdAt: timestamp
            };
            await this.writeToMFS(playlistPath, playlistData);
            return timestamp;
        } catch (error) {
            console.error('保存收藏列表失败:', error);
            throw error;
        }
    }

    // 加载所有收藏列表
    async loadAllPlaylists() {
        try {
            // 获取收藏列表目录下的所有文件
            const response = await fetch(`${this.apiUrl}/files/ls?arg=${this.collectionsPath}&long=true`, {
                method: 'POST'
            });
            const data = await response.json();
            const files = data.Entries || [];
            
            // 过滤出.json文件并加载它们
            const playlists = [];
            for (const file of files) {
                if (file.Name.endsWith('.json')) {
                    try {
                        const playlist = await this.readFromMFS(`${this.collectionsPath}/${file.Name}`);
                        playlists.push({
                            id: file.Name.replace('.json', ''),
                            name: playlist.name,
                            items: playlist.items || [],
                            createdAt: playlist.createdAt
                        });
                    } catch (error) {
                        console.error(`加载收藏列表 ${file.Name} 失败:`, error);
                    }
                }
            }
            // 按创建时间排序
            playlists.sort((a, b) => b.createdAt - a.createdAt);
            return playlists;
        } catch (error) {
            console.error('加载收藏列表失败:', error);
            return [];
        }
    }

    // 删除收藏列表
    async deletePlaylist(playlistId) {
        try {
            const playlistPath = `${this.collectionsPath}/${playlistId}.json`;
            await fetch(`${this.apiUrl}/files/rm?arg=${playlistPath}`, {
                method: 'POST'
            });
            return true;
        } catch (error) {
            console.error('删除收藏列表失败:', error);
            throw error;
        }
    }

    // 添加到收藏列表
    async addToPlaylist(playlistId, item) {
        try {
            const playlistPath = `${this.collectionsPath}/${playlistId}.json`;
            const playlist = await this.readFromMFS(playlistPath);
            
            // 获取文件信息，包括 CID
            const fileInfo = await this.getFileInfo(item.path);
            
            // 将文件信息添加到列表项中，只保留必要字段
            playlist.items.push({
                ...item,
                cid: fileInfo.Hash,
                name: fileInfo.Name
            });
            
            await this.writeToMFS(playlistPath, playlist);
            return true;
        } catch (error) {
            console.error('添加到收藏列表失败:', error);
            throw error;
        }
    }

    // 从收藏列表移除
    async removeFromPlaylist(playlistId, itemPath) {
        try {
            const playlistPath = `${this.collectionsPath}/${playlistId}.json`;
            const playlist = await this.readFromMFS(playlistPath);
            playlist.items = playlist.items.filter(item => item.path !== itemPath);
            await this.writeToMFS(playlistPath, playlist);
            return true;
        } catch (error) {
            console.error('从收藏列表移除失败:', error);
            throw error;
        }
    }

    // 获取文件信息
    async getFileInfo(path) {
        try {
            const response = await fetch(`${this.apiUrl}/files/stat?arg=${path}`, {
                method: 'POST'
            });
            const data = await response.json();
            return {
                ...data,
                Name: path.split('/').pop(),
                Hash: data.Hash,
                Size: data.Size
            };
        } catch (error) {
            console.error('获取文件信息失败:', error);
            throw error;
        }
    }

    // 同步列表文件到IPFS
    async syncPlaylistToIPFS(playlistId) {
        try {
            // 读取列表数据
            const playlistPath = `${this.collectionsPath}/${playlistId}.json`;
            const playlist = await this.readFromMFS(playlistPath);
            
            // 显示同步进度
            let syncedCount = 0;
            const totalItems = playlist.items.length;
            
            // 遍历列表中的所有文件
            for (const item of playlist.items) {
                try {
                    // 在 MFS 中创建文件
                    const targetPath = `${this[`${item.type}Path`]}/${item.name}`;
                    await fetch(`${this.apiUrl}/files/cp?arg=/ipfs/${item.cid}&arg=${targetPath}`, {
                        method: 'POST'
                    });
                    
                    syncedCount++;
                    // 返回进度信息
                    const progress = {
                        current: syncedCount,
                        total: totalItems,
                        status: 'syncing',
                        file: item.name
                    };
                    window.dispatchEvent(new CustomEvent('syncProgress', { detail: progress }));
                    
                } catch (error) {
                    console.error(`同步文件失败: ${item.name}`, error);
                    // 返回错误信息
                    window.dispatchEvent(new CustomEvent('syncProgress', { 
                        detail: {
                            status: 'error',
                            file: item.name,
                            error: error.message
                        }
                    }));
                }
            }
            
            // 返回完成信息
            window.dispatchEvent(new CustomEvent('syncProgress', { 
                detail: {
                    status: 'completed',
                    total: totalItems,
                    synced: syncedCount
                }
            }));
            
            return true;
        } catch (error) {
            console.error('同步列表失败:', error);
            throw error;
        }
    }
}

// 创建IPFS客户端实例并挂载到window对象
window.ipfs = new IPFSClient(); 