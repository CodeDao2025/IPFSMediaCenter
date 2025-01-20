// 测试数据
let mediaData = {
    images: [],
    videos: [],
    music: [],
    others: []  // 添加others数组
};

// 收藏列表数据
let playlists = [];

// 当前选中的媒体类型
let currentMediaType = 'images';

// 在文件开头添加全局变量
let musicPlayer = null;

// 文件类型图标映射
const fileTypeIcons = {
    // 图片类型
    'jpg': 'bi-file-image',
    'jpeg': 'bi-file-image',
    'png': 'bi-file-image',
    'gif': 'bi-file-image',
    'webp': 'bi-file-image',
    'svg': 'bi-file-image',
    'bmp': 'bi-file-image',
    'ico': 'bi-file-image',
    
    // 视频类型
    'mp4': 'bi-file-play',
    'webm': 'bi-file-play',
    'avi': 'bi-file-play',
    'mov': 'bi-file-play',
    'wmv': 'bi-file-play',
    'flv': 'bi-file-play',
    'mkv': 'bi-file-play',
    'm4v': 'bi-file-play',
    
    // 音频类型
    'mp3': 'bi-file-music',
    'wav': 'bi-file-music',
    'ogg': 'bi-file-music',
    'flac': 'bi-file-music',
    'm4a': 'bi-file-music',
    'aac': 'bi-file-music',
    'wma': 'bi-file-music',
    
    // 文档类型
    'pdf': 'bi-file-pdf',
    'doc': 'bi-file-word',
    'docx': 'bi-file-word',
    'xls': 'bi-file-excel',
    'xlsx': 'bi-file-excel',
    'ppt': 'bi-file-ppt',
    'pptx': 'bi-file-ppt',
    'txt': 'bi-file-text',
    'rtf': 'bi-file-text',
    'md': 'bi-markdown',
    
    // 压缩文件
    'zip': 'bi-file-zip',
    'rar': 'bi-file-zip',
    '7z': 'bi-file-zip',
    'tar': 'bi-file-zip',
    'gz': 'bi-file-zip',
    'bz2': 'bi-file-zip',
    
    // 代码文件
    'js': 'bi-filetype-js',
    'py': 'bi-filetype-py',
    'java': 'bi-filetype-java',
    'html': 'bi-filetype-html',
    'css': 'bi-filetype-css',
    'scss': 'bi-filetype-scss',
    'less': 'bi-filetype-less',
    'json': 'bi-filetype-json',
    'xml': 'bi-filetype-xml',
    'sql': 'bi-filetype-sql',
    'php': 'bi-filetype-php',
    'cs': 'bi-filetype-cs',
    'cpp': 'bi-filetype-cpp',
    'h': 'bi-filetype-cpp',
    'rb': 'bi-filetype-ruby',
    'go': 'bi-filetype-go',
    'ts': 'bi-filetype-ts',
    'jsx': 'bi-filetype-jsx',
    'vue': 'bi-filetype-vue',
    
    // 字体文件
    'ttf': 'bi-file-font',
    'otf': 'bi-file-font',
    'woff': 'bi-file-font',
    'woff2': 'bi-file-font',
    'eot': 'bi-file-font',
    
    // 3D文件
    'obj': 'bi-box',
    'fbx': 'bi-box',
    'gltf': 'bi-box',
    'glb': 'bi-box',
    'stl': 'bi-box',
    '3ds': 'bi-box',
    
    // 数据库文件
    'db': 'bi-database',
    'sqlite': 'bi-database',
    'mdb': 'bi-database',
    
    // 可执行文件
    'exe': 'bi-file-binary',
    'dll': 'bi-file-binary',
    'app': 'bi-file-binary',
    'msi': 'bi-file-binary',
    
    // 默认图标
    'default': 'bi-file-earmark'
};

// 导航切换
$('.nav-link').click(function(e) {
    if (!$(this).data('type')) return; // 如果不是媒体类型导航项，不处理
    
    e.preventDefault();
    $('.nav-link').removeClass('active'); // 清除所有导航项的选中状态
    $(this).addClass('active');
    
    const type = $(this).data('type');
    currentMediaType = type;
    $('#currentSection').text($(this).text());
    
    // 更新上传按钮的accept属性
    updateUploadAccept(type);
    
    renderMedia(type);
});

// 更新上传按钮的accept属性
function updateUploadAccept(type) {
    const uploadInput = $('#uploadFile');
    switch(type) {
        case 'images':
            uploadInput.attr('accept', 'image/*');
            break;
        case 'videos':
            uploadInput.attr('accept', 'video/*');
            break;
        case 'music':
            uploadInput.attr('accept', 'audio/*');
            break;
        case 'others':
            uploadInput.attr('accept', '*');  // 允许所有文件类型
            break;
    }
}

// 获取文件图标
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    return fileTypeIcons[ext] || fileTypeIcons.default;
}

// 创建收藏列表
$('#createPlaylistBtn').click(async function() {
    const playlistName = $('#newPlaylistName').val().trim();
    if (playlistName) {
        const newPlaylist = { items: [] };
        try {
            await window.ipfs.savePlaylistData(newPlaylist, playlistName);
            $('#newPlaylistName').val('');
            // 重新加载所有收藏列表
            await loadStoredData();
            // 关闭模态框
            $('#playlistModal').modal('hide');
        } catch (error) {
            console.error('创建播放列表失败:', error);
            alert('创建播放列表失败: ' + error.message);
        }
    }
});

// 导入收藏列表
$('#importPlaylistBtn').click(async function() {
    const playlistCid = $('#importPlaylistCid').val().trim();
    
    if (!playlistCid) {
        alert('请输入列表CID');
        return;
    }

    try {
        // 显示导入进度提示
        const alertHtml = `
            <div class="alert alert-info" id="importProgress">
                <i class="bi bi-arrow-repeat me-2"></i>
                正在导入收藏列表...
            </div>
        `;
        $('#playlistModal .modal-body').prepend(alertHtml);

        // 使用时间戳创建文件名
        const timestamp = Date.now();
        // 创建从 CID 到 MFS 文件的链接
        await fetch(`${window.ipfs.apiUrl}/files/cp?arg=/ipfs/${playlistCid}&arg=${window.ipfs.collectionsPath}/${timestamp}.json`, {
            method: 'POST'
        });

        // 清空输入框
        $('#importPlaylistCid').val('');

        // 重新加载所有收藏列表
        await loadStoredData();

        // 移除进度提示，显示成功提示
        $('#importProgress').removeClass('alert-info').addClass('alert-success')
            .html('<i class="bi bi-check-circle-fill me-2"></i>导入成功');

        // 3秒后关闭模态框
        setTimeout(() => {
            $('#playlistModal').modal('hide');
        }, 2000);

    } catch (error) {
        console.error('导入收藏列表失败:', error);
        // 显示错误提示
        $('#importProgress').removeClass('alert-info').addClass('alert-danger')
            .html(`<i class="bi bi-exclamation-circle-fill me-2"></i>导入失败: ${error.message}`);
    }
});

// 渲染收藏列表
function renderPlaylists() {
    const playlistNav = $('#playlistNav');
    playlistNav.empty();

    playlists.forEach((playlist) => {
        // 渲染侧边栏二级菜单
        const navItem = `
            <li class="nav-item">
                <a class="nav-link d-flex align-items-center" href="#" data-playlist-id="${playlist.id}">
                    <i class="bi bi-collection-play me-2"></i>
                    <span class="text-truncate">${playlist.name}</span>
                    <span class="playlist-count">${playlist.items.length}</span>
                    <button class="btn btn-link text-secondary btn-sm ms-2 p-0 delete-playlist" data-playlist-id="${playlist.id}" title="删除收藏列表">
                        <i class="bi bi-trash"></i>
                    </button>
                </a>
            </li>`;
        playlistNav.append(navItem);
    });

    // 绑定删除收藏列表事件
    $('.delete-playlist').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        const playlistId = $(this).data('playlist-id').toString();
        const playlist = playlists.find(p => p.id.toString() === playlistId);
        
        showConfirmModal({
            title: '确认删除',
            message: `确定要删除收藏列表 "${playlist.name}" 吗？`,
            type: 'primary',
            confirmText: '删除',
            onConfirm: async () => {
                try {
                    await window.ipfs.deletePlaylist(playlistId);
                    await loadStoredData();
                } catch (error) {
                    console.error('删除失败:', error);
                    const errorAlert = $(`
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="bi bi-exclamation-circle-fill me-2"></i>
                            删除失败: ${error.message}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `);
                    $('#mediaContainer').prepend(errorAlert);
                }
            }
        });
    });

    // 绑定收藏列表点击事件
    $('#playlistNav .nav-link').click(function(e) {
        e.preventDefault();
        const playlistId = $(this).data('playlist-id').toString();
        const playlist = playlists.find(p => p.id.toString() === playlistId);
        
        // 更新UI状态：清除所有导航项的选中状态
        $('.nav-link').removeClass('active'); // 清除所有导航项的选中状态，包括图片、视频、音乐菜单
        $(this).addClass('active');
        $('#currentSection').text(playlist.name);
        
        // 渲染收藏列表内容
        renderPlaylistContent(playlist);
    });
}

// 检查音乐播放器状态
function checkMusicPlayerState() {
    if (musicPlayer) {
        if (!musicPlayer.audio || musicPlayer.audio.paused || musicPlayer.list.audios.length === 0) {
            $('#aplayer').hide();
        } else {
            $('#aplayer').show();
        }
    }
}

// 渲染收藏列表内容
async function renderPlaylistContent(playlist) {
    const container = $('#mediaContainer');
    container.empty();
    container.removeClass('row g-3');

    // 检查音乐播放器状态
    checkMusicPlayerState();

    // 获取列表文件的 CID
    const playlistCid = await window.ipfs.getFileInfo(`${window.ipfs.collectionsPath}/${playlist.id}.json`);

    // 添加工具栏
    container.append(`
        <div class="d-flex flex-column gap-2 mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-primary btn-sm" onclick="showBatchAddModal(${playlist.id})">
                        <i class="bi bi-plus-circle me-1"></i>批量添加
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="syncPlaylist('${playlist.id}')" title="同步列表文件到IPFS">
                        <i class="bi bi-cloud-arrow-up me-1"></i>同步到IPFS
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" id="batchDeleteBtn" style="display: none">
                        <i class="bi bi-trash me-1"></i>删除选中
                    </button>
                    <button class="btn btn-outline-success btn-sm" onclick="playAllMusic('${playlist.id}')" title="播放所有音乐">
                        <i class="bi bi-play-fill me-1"></i>播放全部
                    </button>
                </div>
                <div class="text-muted small">
                    共 ${playlist.items.length} 个项目
                </div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span class="text-muted small">列表CID:</span>
                <code class="text-truncate" style="max-width: 200px;">${playlistCid.Hash}</code>
                <button class="btn btn-sm btn-outline-secondary copy-cid" data-cid="${playlistCid.Hash}" title="复制列表CID">
                    <i class="bi bi-clipboard me-1"></i>CID
                </button>
            </div>
        </div>
    `);

    // 如果列表为空，显示空状态
    if (playlist.items.length === 0) {
        container.append(`
            <div class="text-center py-5">
                <i class="bi bi-collection display-1 text-muted"></i>
                <h3 class="mt-3 text-muted">收藏列表为空</h3>
                <p class="text-muted">点击"批量添加"按钮添加内容到此列表</p>
            </div>
        `);
        return;
    }

    // 创建表格
    const table = $(`
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th width="40">
                            <input type="checkbox" class="form-check-input" id="selectAll">
                        </th>
                        <th>文件名</th>
                        <th width="100">类型</th>
                        <th width="100">大小</th>
                        <th width="180">CID</th>
                        <th width="100">操作</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    // 获取所有收藏项的详细信息并添加到表格
    const tbody = table.find('tbody');
    for (const item of playlist.items) {
        try {
            // 尝试获取文件信息，如果失败则显示未同步状态
            let fileInfo;
            try {
                fileInfo = await window.ipfs.getFileInfo(item.path);
            } catch (error) {
                fileInfo = {
                    Name: item.name,
                    Hash: item.cid,
                    Size: null
                };
            }

            const tr = $(`
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input item-check" data-path="${item.path}">
                    </td>
                    <td class="text-truncate" style="max-width: 200px;">
                        <a href="#" class="text-decoration-none file-link preview-item" data-type="${item.type}" data-url="${window.ipfs.gatewayUrl}/${fileInfo.Hash}" data-name="${fileInfo.Name}">
                            ${fileInfo.Name}
                        </a>
                    </td>
                    <td>${item.type}</td>
                    <td>${fileInfo.Size ? formatFileSize(fileInfo.Size) : '<span class="text-secondary">未同步</span>'}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <button class="btn btn-sm btn-outline-secondary copy-cid" data-cid="${fileInfo.Hash}" title="复制CID">
                                <i class="bi bi-clipboard me-1"></i>CID
                            </button>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary delete-item" data-path="${item.path}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
            tbody.append(tr);
        } catch (error) {
            console.error('获取收藏项信息失败:', error);
        }
    }

    container.append(table);

    // 绑定事件
    // 全选/取消全选
    $('#selectAll').change(function() {
        const checked = $(this).prop('checked');
        $('.item-check').prop('checked', checked);
        updateBatchDeleteBtn();
    });

    // 单个选择框变化
    $('.item-check').change(function() {
        updateBatchDeleteBtn();
    });

    // 更新批量删除按钮显示状态
    function updateBatchDeleteBtn() {
        const checkedCount = $('.item-check:checked').length;
        $('#batchDeleteBtn').toggle(checkedCount > 0);
    }

    // 批量删除
    $('#batchDeleteBtn').click(async function() {
        const checkedItems = $('.item-check:checked');
        if (checkedItems.length === 0) return;

        showConfirmModal({
            title: '确认删除',
            message: `确定要删除选中的 ${checkedItems.length} 个项目吗？`,
            type: 'primary',
            onConfirm: async () => {
                try {
                    for (const item of checkedItems) {
                        const path = $(item).data('path');
                        await window.ipfs.removeFromPlaylist(playlist.id, path);
                    }
                    // 重新加载列表
                    await loadStoredData();
                    // 重新渲染当前列表
                    const updatedPlaylist = playlists.find(p => p.id === playlist.id);
                    if (updatedPlaylist) {
                        renderPlaylistContent(updatedPlaylist);
                    }
                } catch (error) {
                    console.error('批量删除失败:', error);
                    // 显示错误提示
                    const errorAlert = $(`
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="bi bi-exclamation-circle-fill me-2"></i>
                            批量删除失败: ${error.message}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `);
                    $('#mediaContainer').prepend(errorAlert);
                }
            }
        });
    });

    // 单个删除
    $('.delete-item').click(async function() {
        const path = $(this).data('path');
        
        showConfirmModal({
            title: '确认删除',
            message: '确定要删除此项目吗？',
            type: 'primary',
            onConfirm: async () => {
                try {
                    await window.ipfs.removeFromPlaylist(playlist.id, path);
                    // 重新加载列表
                    await loadStoredData();
                    // 重新渲染当前列表
                    const updatedPlaylist = playlists.find(p => p.id === playlist.id);
                    if (updatedPlaylist) {
                        renderPlaylistContent(updatedPlaylist);
                    }
                } catch (error) {
                    console.error('删除失败:', error);
                    const errorAlert = $(`
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="bi bi-exclamation-circle-fill me-2"></i>
                            删除失败: ${error.message}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `);
                    $('#mediaContainer').prepend(errorAlert);
                }
            }
        });
    });

    // 预览项目
    $('.preview-item').click(function(e) {
        e.preventDefault();
        const type = $(this).data('type');
        const url = $(this).data('url');
        const name = $(this).data('name');
        
        switch (type) {
            case 'images':
                // 显示图片预览
                const viewer = $('.image-viewer');
                const viewerImg = viewer.find('img');
                viewerImg.attr('src', url);
                viewer.addClass('active');
                break;
            case 'videos':
                // 显示视频播放器
                $('#videoModalLabel').text(name);
                const videoModal = $('#videoModal');
                videoModal.modal('show');
                
                // 销毁之前的播放器实例（如果存在）
                if (window.currentPlayer) {
                    window.currentPlayer.destroy();
                }
                
                // 初始化新的 DPlayer 实例
                window.currentPlayer = new DPlayer({
                    container: document.getElementById('dplayer'),
                    screenshot: true,
                    autoplay: true,
                    video: {
                        url: url,
                        type: 'auto'
                    }
                });

                // 模态框关闭时销毁播放器
                videoModal.on('hidden.bs.modal', function () {
                    if (window.currentPlayer) {
                        window.currentPlayer.destroy();
                        window.currentPlayer = null;
                    }
                });
                break;
            case 'music':
                // 播放音乐
                if (!musicPlayer) {
                    musicPlayer = new APlayer({
                        container: document.getElementById('aplayer'),
                        fixed: false,
                        autoplay: false,
                        theme: '#4f46e5',
                        audio: []
                    });
                }

                // 确保播放器显示
                $('#aplayer').show();

                const audioList = musicPlayer.list.audios;
                const existingIndex = audioList.findIndex(audio => audio.url === url);

                if (existingIndex === -1) {
                    musicPlayer.list.add({
                        name: name,
                        artist: '未知艺术家',
                        url: url,
                        cover: url + '.cover'
                    });
                    musicPlayer.list.switch(audioList.length);
                } else {
                    musicPlayer.list.switch(existingIndex);
                }
                
                musicPlayer.play();
                break;
        }
    });

    // 绑定复制CID功能
    bindMediaEvents();
}

// 显示批量添加模态框
function showBatchAddModal(playlistId) {
    const playlist = playlists.find(p => p.id.toString() === playlistId.toString());
    if (!playlist) return;

    // 如果已存在模态框，先移除
    $('#batchAddModal').remove();

    // 创建新的模态框
    $('body').append(`
        <div class="modal fade" id="batchAddModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">添加到收藏列表: ${playlist.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <ul class="nav nav-pills">
                                <li class="nav-item">
                                    <a class="nav-link active" data-bs-toggle="tab" href="#imagesTab">图片</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#videosTab">视频</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#musicTab">音乐</a>
                                </li>
                            </ul>
                            <div class="d-flex gap-2">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text">
                                        <i class="bi bi-search"></i>
                                    </span>
                                    <input type="text" class="form-control batch-search" placeholder="搜索文件名...">
                                </div>
                                <select class="form-select form-select-sm batch-sort" style="width: 120px;">
                                    <option value="name-asc">名称 ↑</option>
                                    <option value="name-desc">名称 ↓</option>
                                    <option value="size-asc">大小 ↑</option>
                                    <option value="size-desc">大小 ↓</option>
                                </select>
                            </div>
                        </div>
                        <div class="tab-content" id="mediaTabContent">
                            <div class="tab-pane fade show active" id="imagesTab">
                                <div class="media-grid" data-type="images"></div>
                            </div>
                            <div class="tab-pane fade" id="videosTab">
                                <div class="media-grid" data-type="videos"></div>
                            </div>
                            <div class="tab-pane fade" id="musicTab">
                                <div class="media-grid" data-type="music"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-between">
                        <div class="text-muted small">
                            已选择 <span class="selected-count">0</span> 个项目
                        </div>
                        <div>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" id="confirmBatchAdd" disabled>
                                <i class="bi bi-plus-circle me-1"></i>添加选中项
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);

    // 初始化模态框
    const modal = new bootstrap.Modal('#batchAddModal');

    // 绑定事件 - 在模态框显示后加载内容
    $('#batchAddModal').on('shown.bs.modal', function() {
        loadMediaForBatchAdd('images');
    });

    // 导入列表标签页切换
    $('.nav-pills .nav-link').on('click', async function(e) {
        e.preventDefault();
        // 移除所有标签页的active类
        $('.nav-pills .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // 添加当前标签页的active类
        $(this).addClass('active');
        const targetPane = $($(this).attr('href'));
        targetPane.addClass('show active');
        
        const type = targetPane.find('.media-grid').data('type');
        await loadMediaForBatchAdd(type);
    });

    // 搜索功能
    $('.batch-search').on('input', debounce(function() {
        const searchTerm = $(this).val().toLowerCase();
        const currentType = $('.nav-pills .nav-link.active').attr('href');
        const rows = $(`${currentType} .batch-add-check`).closest('tr');
        
        rows.each(function() {
            const fileName = $(this).find('td:nth-child(2)').text().toLowerCase();
            $(this).toggle(fileName.includes(searchTerm));
        });
    }, 300));

    // 排序功能
    $('.batch-sort').on('change', function() {
        const sortValue = $(this).val();
        const currentType = $('.nav-pills .nav-link.active').attr('href');
        const tbody = $(`${currentType} tbody`);
        const rows = tbody.find('tr').get();

        rows.sort((a, b) => {
            const aValue = $(a).find('td:nth-child(2)').text();
            const bValue = $(b).find('td:nth-child(2)').text();
            const aSize = parseInt($(a).data('size'));
            const bSize = parseInt($(b).data('size'));

            switch(sortValue) {
                case 'name-asc':
                    return aValue.localeCompare(bValue);
                case 'name-desc':
                    return bValue.localeCompare(aValue);
                case 'size-asc':
                    return aSize - bSize;
                case 'size-desc':
                    return bSize - aSize;
            }
        });

        tbody.empty().append(rows);
    });

    // 更新选中项数量和按钮状态
    function updateSelectedCount() {
        const count = $('.batch-add-check:checked').length;
        $('.selected-count').text(count);
        $('#confirmBatchAdd').prop('disabled', count === 0);
    }

    // 全选/取消全选事件
    $(document).on('change', '.batch-select-all', function() {
        const type = $(this).data('type');
        const checked = $(this).prop('checked');
        $(`.batch-add-check[data-type="${type}"]:visible`).prop('checked', checked);
        updateSelectedCount();
    });

    // 单个选择框变化事件
    $(document).on('change', '.batch-add-check', function() {
        const type = $(this).data('type');
        const totalVisible = $(`.batch-add-check[data-type="${type}"]:visible`).length;
        const checkedVisible = $(`.batch-add-check[data-type="${type}"]:visible:checked`).length;
        $(`.batch-select-all[data-type="${type}"]`).prop('checked', totalVisible === checkedVisible);
        updateSelectedCount();
    });

    // 确认批量添加
    $('#confirmBatchAdd').on('click', async function() {
        const checkedItems = $('.batch-add-check:checked');
        if (checkedItems.length === 0) {
            alert('请选择要添加的项目');
            return;
        }

        try {
            const button = $(this);
            button.prop('disabled', true);
            button.html('<i class="bi bi-arrow-repeat me-1"></i>添加中...');

            // 获取当前播放列表中的所有CID
            const existingCids = new Set();
            for (const item of playlist.items) {
                try {
                    const fileInfo = await window.ipfs.getFileInfo(item.path);
                    existingCids.add(fileInfo.Hash);
                } catch (error) {
                    console.warn('获取文件信息失败:', error);
                }
            }

            let addedCount = 0;
            let duplicateCount = 0;

            for (const item of checkedItems) {
                const $item = $(item);
                const path = $item.data('path');
                const type = $item.data('type');

                try {
                    // 获取文件的CID
                    const fileInfo = await window.ipfs.getFileInfo(path);
                    
                    // 检查CID是否已存在
                    if (existingCids.has(fileInfo.Hash)) {
                        duplicateCount++;
                        continue; // 跳过已存在的文件
                    }

                    // 添加到播放列表
                    await window.ipfs.addToPlaylist(playlist.id, { path, type });
                    addedCount++;
                } catch (error) {
                    console.error('添加文件失败:', error);
                }
            }

            // 关闭模态框
            modal.hide();

            // 重新加载列表
            await loadStoredData();
            // 重新渲染当前列表
            const updatedPlaylist = playlists.find(p => p.id === playlist.id);
            if (updatedPlaylist) {
                renderPlaylistContent(updatedPlaylist);
            }

            // 显示添加结果提示
            const container = $('#mediaContainer');
            container.prepend(`
                <div class="alert ${duplicateCount > 0 ? 'alert-warning' : 'alert-success'}" id="batchAddResult">
                    <i class="bi ${duplicateCount > 0 ? 'bi-exclamation-circle' : 'bi-check-circle-fill'} me-2"></i>
                    ${addedCount > 0 ? `成功添加 ${addedCount} 个项目` : ''}
                    ${duplicateCount > 0 ? `${addedCount > 0 ? '，' : ''}${duplicateCount} 个项目已存在，已自动跳过` : ''}
                </div>
            `);

            setTimeout(() => {
                $('#batchAddResult').fadeOut('slow', function() {
                    $(this).remove();
                });
            }, 3000);

        } catch (error) {
            console.error('批量添加失败:', error);
            alert('批量添加失败: ' + error.message);
        } finally {
            $('#confirmBatchAdd').prop('disabled', false).html('<i class="bi bi-plus-circle me-1"></i>添加选中项');
        }
    });

    // 显示模态框
    modal.show();
}

// 加载媒体内容用于批量添加
async function loadMediaForBatchAdd(type) {
    const container = $(`.media-grid[data-type="${type}"]`);
    container.empty();

    try {
        const files = await window.ipfs.getDirectoryFiles(type);
        if (files.length === 0 || (files.length === 1 && files[0].Name === '.metadata.json')) {
            container.html(`
                <div class="text-center py-4">
                    <p class="text-muted">暂无${type === 'music' ? '音乐' : type === 'videos' ? '视频' : '图片'}</p>
                </div>
            `);
            return;
        }

        // 创建表格
        const table = $(`
            <div class="table-responsive" style="max-height: 400px;">
                <table class="table table-hover">
                    <thead class="sticky-top bg-body">
                        <tr>
                            <th width="40">
                                <input type="checkbox" class="form-check-input batch-select-all" data-type="${type}">
                            </th>
                            <th>文件名</th>
                            <th width="100">大小</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        const tbody = table.find('tbody');
        files.forEach(file => {
            if (file.Name === '.metadata.json') return;
            
            tbody.append(`
                <tr data-size="${file.Size}">
                    <td>
                        <input type="checkbox" class="form-check-input batch-add-check" 
                               data-path="/media-center/${type}/${file.Name}" data-type="${type}">
                    </td>
                    <td class="text-truncate">${file.Name}</td>
                    <td>${formatFileSize(file.Size)}</td>
                </tr>
            `);
        });

        container.append(table);

    } catch (error) {
        console.error('加载媒体内容失败:', error);
        container.html(`
            <div class="alert alert-danger">
                加载失败: ${error.message}
            </div>
        `);
    }
}

// IPFS连接状态
let ipfsConnected = false;

// 初始化IPFS连接
async function initIPFS() {
    try {
        ipfsConnected = await window.ipfs.checkConnection();
        if (ipfsConnected) {
            const nodeInfo = await window.ipfs.getNodeId();
            console.log('IPFS节点已连接:', nodeInfo.ID);
            updateConnectionStatus(true);
            
            // 加载已存储的媒体和播放列表
            await loadStoredData();
        } else {
            console.error('无法连接到IPFS节点');
            updateConnectionStatus(false);
        }
    } catch (error) {
        console.error('IPFS连接错误:', error);
        updateConnectionStatus(false);
    }
}

// 加载已存储的数据
async function loadStoredData() {
    try {
        // 获取所有收藏列表
        playlists = await window.ipfs.loadAllPlaylists();
        // 重新渲染界面
        renderPlaylists();
    } catch (error) {
        console.error('加载存储数据失败:', error);
    }
}

// 更新连接状态显示
function updateConnectionStatus(connected) {
    const statusElement = $('#ipfsStatus');
    if (connected) {
        statusElement.html('<i class="bi bi-circle-fill text-success"></i> IPFS已连接');
    } else {
        statusElement.html('<i class="bi bi-circle-fill text-danger"></i> IPFS未连接');
    }
}

// 文件上传处理
$('#uploadFile').on('change', async function(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
        // 显示上传进度提示
        const container = $('#mediaContainer');
        container.prepend(`
            <div class="alert alert-info" id="uploadProgress">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-arrow-repeat me-2"></i>
                    <div class="flex-grow-1">
                        <div>正在上传文件...</div>
                        <div class="progress mt-2" style="height: 5px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="small upload-status">0/${files.length}</div>
                </div>
                <div class="small text-muted mt-1 current-file"></div>
            </div>
        `);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // 根据文件类型决定上传目录
                let mediaType;
                const fileType = file.type.split('/')[0]; // 'image', 'video', 'audio'
                
                if (currentMediaType === 'others') {
                    // 如果当前在others页面，所有文件都上传到others
                    mediaType = 'others';
                } else {
                    // 在其他页面时，根据文件类型判断
                    switch (fileType) {
                        case 'image':
                            mediaType = 'images';
                            break;
                        case 'video':
                            mediaType = 'videos';
                            break;
                        case 'audio':
                            mediaType = 'music';
                            break;
                        default:
                            mediaType = 'others';
                    }
                    
                    // 检查文件类型是否匹配当前页面
                    if (mediaType !== currentMediaType && currentMediaType !== 'others') {
                        throw new Error(`请在${$('#currentSection').text()}页面上传${$('#currentSection').text()}`);
                    }
                }

                // 更新进度提示
                const percentage = ((i + 1) / files.length * 100).toFixed(0);
                $('#uploadProgress .progress-bar').css('width', `${percentage}%`);
                $('#uploadProgress .upload-status').text(`${i + 1}/${files.length}`);
                $('#uploadProgress .current-file').text(`正在上传: ${file.name}`);

                // 添加文件到对应的MFS目录
                await window.ipfs.addMediaFile(file, mediaType);
                successCount++;
            } catch (error) {
                console.error('上传失败:', error);
                failCount++;
            }
        }

        // 移除上传进度提示
        $('#uploadProgress').remove();

        // 显示上传结果提示
        const resultAlert = $(`
            <div class="alert ${failCount > 0 ? 'alert-warning' : 'alert-success'}" id="uploadResult">
                <i class="bi ${failCount > 0 ? 'bi-exclamation-circle' : 'bi-check-circle-fill'} me-2"></i>
                ${successCount > 0 ? `成功上传 ${successCount} 个文件` : ''}
                ${failCount > 0 ? `${successCount > 0 ? '，' : ''}${failCount} 个文件上传失败` : ''}
            </div>
        `);
        container.prepend(resultAlert);

        // 3秒后移除结果提示
        setTimeout(() => {
            resultAlert.fadeOut('slow', function() {
                $(this).remove();
            });
        }, 3000);

        // 重新渲染当前类型的媒体列表
        renderMedia(currentMediaType);

    } catch (error) {
        console.error('上传失败:', error);
        // 显示错误提示
        $('#uploadProgress')?.remove();
        const container = $('#mediaContainer');
        container.prepend(`
            <div class="alert alert-danger" id="uploadError">
                <i class="bi bi-exclamation-circle-fill me-2"></i>
                上传失败: ${error.message}
            </div>
        `);
        
        // 3秒后移除错误提示
        setTimeout(() => {
            $('#uploadError').fadeOut('slow', function() {
                $(this).remove();
            });
        }, 3000);
    }

    // 清空文件输入框，允许重复上传相同文件
    $(this).val('');
});

// 统一的渲染函数
async function renderMediaContent(files, type) {
    const container = $('#mediaContainer');
    container.empty();
    
    // 只有在非others类型时添加row g-3类
    if (type !== 'others') {
        container.addClass('row g-3');
    }
        
    if (type === 'others') {
        // others类型使用表格视图
        const table = $(`
            <div>
                <div class="mb-3">
                    <button class="btn btn-danger btn-sm d-none" id="batchDeleteBtn">
                        <i class="bi bi-trash me-1"></i>批量删除
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th style="width: 40px">
                                    <input type="checkbox" class="form-check-input" id="selectAll">
                                </th>
                                <th style="width: 40px"></th>
                                <th>文件名</th>
                                <th style="width: 120px">大小</th>
                                <th style="width: 100px">CID</th>
                                <th style="width: 80px">操作</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `);
        
        // 添加文件行
        files.forEach((file) => {
            if (file.Name === '.metadata.json') return;
            
            const fileUrl = `${window.ipfs.gatewayUrl}/${file.Hash}`;
            const fileIcon = getFileIcon(file.Name);
            
            const row = $(`
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input file-checkbox" data-filename="${file.Name}">
                    </td>
                    <td>
                        <i class="bi ${fileIcon} fs-4"></i>
                    </td>
                    <td>
                        <a href="${fileUrl}" target="_blank" class="text-decoration-none file-link">
                            ${file.Name}
                        </a>
                    </td>
                    <td>${formatFileSize(file.Size)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary copy-cid" data-cid="${file.Hash}" title="复制CID">
                            <i class="bi bi-clipboard me-1"></i>CID
                        </button>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger delete-media" data-filename="${file.Name}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
            
            table.find('tbody').append(row);
        });

        // 绑定全选/取消全选事件
        table.find('#selectAll').on('change', function() {
            const isChecked = $(this).prop('checked');
            table.find('.file-checkbox').prop('checked', isChecked);
            updateBatchDeleteButton();
        });

        // 绑定单个复选框事件
        table.find('.file-checkbox').on('change', function() {
            const totalCheckboxes = table.find('.file-checkbox').length;
            const checkedCheckboxes = table.find('.file-checkbox:checked').length;
            table.find('#selectAll').prop('checked', totalCheckboxes === checkedCheckboxes);
            updateBatchDeleteButton();
        });

        // 绑定批量删除按钮事件
        table.find('#batchDeleteBtn').on('click', async function() {
            const checkedFiles = table.find('.file-checkbox:checked').map(function() {
                return $(this).data('filename');
            }).get();

            if (checkedFiles.length === 0) return;

            showConfirmModal({
                title: '确认删除',
                message: `确定要删除选中的 ${checkedFiles.length} 个文件吗？`,
                type: 'danger',
                confirmText: '删除',
                onConfirm: async () => {
                    try {
                        for (const filename of checkedFiles) {
                            await window.ipfs.deleteMediaFile(currentMediaType, filename);
                        }
                        // 重新渲染列表
                        renderMedia(currentMediaType);
                        
                        // 显示成功提示
                        const container = $('#mediaContainer');
                        container.prepend(`
                            <div class="alert alert-success" id="batchDeleteSuccess">
                                <i class="bi bi-check-circle-fill me-2"></i>
                                成功删除 ${checkedFiles.length} 个文件
                            </div>
                        `);
                        
                        setTimeout(() => {
                            $('#batchDeleteSuccess').fadeOut('slow', function() {
                                $(this).remove();
                            });
                        }, 3000);
                    } catch (error) {
                        console.error('批量删除失败:', error);
                        const container = $('#mediaContainer');
                        container.prepend(`
                            <div class="alert alert-danger" id="batchDeleteError">
                                <i class="bi bi-exclamation-circle-fill me-2"></i>
                                批量删除失败: ${error.message}
                            </div>
                        `);
                        
                        setTimeout(() => {
                            $('#batchDeleteError').fadeOut('slow', function() {
                                $(this).remove();
                            });
                        }, 3000);
                    }
                }
            });
        });

        // 更新批量删除按钮显示状态的函数
        function updateBatchDeleteButton() {
            const checkedCount = table.find('.file-checkbox:checked').length;
            table.find('#batchDeleteBtn').toggleClass('d-none', checkedCount === 0);
        }
        
        // 如果没有文件，显示空状态
        if (files.length === 0 || (files.length === 1 && files[0].Name === '.metadata.json')) {
            container.html(`
                <div class="text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h3 class="mt-3 text-muted">暂无内容</h3>
                    <p class="text-muted">点击上传按钮添加文件</p>
                </div>
            `);
        } else {
            container.append(table);
        }

        // 绑定事件处理
        bindMediaEvents();
        
        return; // 直接返回，不执行后面的代码
    }

    // 非others类型的渲染逻辑
    files.forEach((file, index) => {
        if (file.Name === '.metadata.json') return;
        
        let card = '';
        const fileUrl = `${window.ipfs.gatewayUrl}/${file.Hash}`;
        const deleteButton = `
            <button class="btn btn-sm btn-outline-danger delete-media" data-filename="${file.Name}">
                <i class="bi bi-trash"></i>
            </button>`;
        
        switch(type) {
            case 'images':
                card = `
                    <div class="col-sm-4 col-md-3 col-lg-2" style="animation: fadeIn 0.5s ease forwards; animation-delay: ${index * 0.1}s">
                        <div class="card image-card" data-action="preview" data-image-src="${fileUrl}">
                            <div class="media-item image">
                                <img src="${fileUrl}" alt="${file.Name}" class="preview-image">
                                <div class="media-actions">
                                    ${deleteButton}
                                </div>
                            </div>
                            <div class="card-body">
                                <h6 class="card-title text-truncate">${file.Name}</h6>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-muted small">${formatFileSize(file.Size)}</span>
                                    <button class="btn btn-sm btn-outline-secondary copy-cid" data-cid="${file.Hash}" title="复制CID">
                                        <i class="bi bi-clipboard me-1"></i>CID
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                break;
                
            case 'videos':
                card = `
                    <div class="col-sm-4 col-md-3 col-lg-2" style="animation: fadeIn 0.5s ease forwards; animation-delay: ${index * 0.1}s">
                        <div class="card">
                            <div class="media-item video">
                                <div class="video-thumbnail" data-video-url="${fileUrl}" data-video-name="${file.Name}">
                                    <canvas class="thumbnail-canvas"></canvas>
                                <div class="play-button">
                                    <i class="bi bi-play-fill"></i>
                                    </div>
                                </div>
                                <div class="media-actions">
                                    ${deleteButton}
                                </div>
                            </div>
                            <div class="card-body">
                                <h6 class="card-title text-truncate">${file.Name}</h6>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-muted small">${formatFileSize(file.Size)}</span>
                                    <button class="btn btn-sm btn-outline-secondary copy-cid" data-cid="${file.Hash}" title="复制CID">
                                        <i class="bi bi-clipboard me-1"></i>CID
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                break;
                
            case 'music':
                card = `
                    <div class="col-sm-4 col-md-3 col-lg-2" style="animation: fadeIn 0.5s ease forwards; animation-delay: ${index * 0.1}s">
                    <div class="card music-card" data-music-url="${fileUrl}" data-music-name="${file.Name}">
                            <div class="media-item music">
                            <div class="music-cover">
                                <img src="${fileUrl}.cover" alt="音乐封面" onerror="this.src='https://api.iconify.design/ph:music-notes-fill.svg?color=%23ffffff'">
                                <div class="play-button" data-action="play">
                                    <i class="bi bi-play-fill"></i>
                                </div>
                            </div>
                                <div class="music-info">
                                <div>
                                    <h6 class="text-truncate">${file.Name}</h6>
                                    <p class="text-truncate small">${formatFileSize(file.Size)}</p>
                                </div>
                                </div>
                                <div class="media-actions">
                                    ${deleteButton}
                                </div>
                            <div class="cid-actions">
                                <button class="btn btn-sm btn-outline-light copy-cid" data-cid="${file.Hash}" title="复制CID">
                                    <i class="bi bi-clipboard"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                break;
        }
        
        container.append(card);
    });

    // 如果没有文件，显示空状态
    if (files.length === 0 || (files.length === 1 && files[0].Name === '.metadata.json')) {
        container.html(`
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h3 class="mt-3 text-muted">暂无内容</h3>
                <p class="text-muted">点击上传按钮添加${$('#currentSection').text()}</p>
            </div>
        `);
    }

    // 在渲染完成后绑定事件
    bindMediaEvents();
}

// 修改原有的renderMedia函数
async function renderMedia(type = 'images') {
    currentMediaType = type;
    const container = $('#mediaContainer');
    container.empty();
    container.addClass('row g-3');

    // 检查音乐播放器状态
    checkMusicPlayerState();

    // 获取并显示媒体文件
    try {
        const files = await window.ipfs.getDirectoryFiles(type);
        await renderMediaContent(files, type);
    } catch (error) {
        console.error('渲染媒体内容失败:', error);
        $('#mediaContainer').html(`
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle-fill me-2"></i>
                加载失败: ${error.message}
            </div>
        `);
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 初始化
$(document).ready(function() {
    // 设置默认导航项为激活状态
    $('.nav-link[data-type="images"]').addClass('active');
    
    // 设置默认的上传类型为图片
    updateUploadAccept('images');
    
    // 初始化主题
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        $('#themeToggle').prop('checked', true);
    }
    
    // 初始化IPFS连接
    initIPFS();
    renderMedia();
    renderPlaylists();

    // 添加CID按钮点击事件
    $('#addCidBtn').click(async function() {
        const cid = $('#cidInput').val().trim();
        const fileName = $('#fileNameInput').val().trim();
        const modal = $('#addCidModal');
        
        // 验证输入
        if (!cid) {
            alert('请输入CID');
            return;
        }
        if (!fileName) {
            alert('请输入文件名');
            return;
        }

        try {
            // 根据文件扩展名判断媒体类型
            const ext = fileName.split('.').pop().toLowerCase();
            let mediaType;
            
            // 定义文件类型映射
            const typeMap = {
                images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
                videos: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv'],
                music: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']
            };

            // 判断文件类型
            for (const [type, extensions] of Object.entries(typeMap)) {
                if (extensions.includes(ext)) {
                    mediaType = type;
                    break;
                }
            }

            // 如果无法判断文件类型
            if (!mediaType) {
                throw new Error('不支持的文件类型');
            }

            // 检查文件类型是否与当前页面匹配
            if (mediaType !== currentMediaType) {
                throw new Error(`请在${$('#currentSection').text()}页面添加${$('#currentSection').text()}`);
            }

            // 显示添加进度提示
            const container = $('#mediaContainer');
            container.prepend(`
                <div class="alert alert-info" id="addProgress">
                    <i class="bi bi-arrow-repeat me-2"></i>
                    正在添加: ${fileName}
                </div>
            `);

            // 调用IPFS客户端方法添加文件
            await window.ipfs.addMediaByCid(cid, fileName, mediaType);

            // 移除进度提示
            $('#addProgress').remove();

            // 显示成功提示
            container.prepend(`
                <div class="alert alert-success" id="addSuccess">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    添加成功: ${fileName}
                </div>
            `);

            // 3秒后移除成功提示
            setTimeout(() => {
                $('#addSuccess').fadeOut('slow', function() {
                    $(this).remove();
                });
            }, 3000);

            // 重新渲染媒体列表
            renderMedia(currentMediaType);

            // 关闭模态框并清空输入
            modal.modal('hide');
            $('#cidInput').val('');
            $('#fileNameInput').val('');

        } catch (error) {
            console.error('添加失败:', error);
            // 移除进度提示
            $('#addProgress')?.remove();
            
            // 显示错误提示
            const container = $('#mediaContainer');
            container.prepend(`
                <div class="alert alert-danger" id="addError">
                    <i class="bi bi-exclamation-circle-fill me-2"></i>
                    添加失败: ${error.message}
                </div>
            `);

            // 3秒后移除错误提示
            setTimeout(() => {
                $('#addError').fadeOut('slow', function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });
});

// 主题切换
$('#themeToggle').change(function() {
    const isDarkMode = $(this).is(':checked');
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
    
    // 更新播放器主题
    if (musicPlayer) {
        musicPlayer.theme = isDarkMode ? '#818cf8' : '#4f46e5';
    }
});

// 修改搜索功能的实现
$('.search-container input').on('input', debounce(async function() {
    const searchTerm = $('.search-container input').val().toLowerCase().trim();
    
    try {
        // 如果搜索词为空，恢复显示所有内容
        if (!searchTerm) {
            await renderMedia(currentMediaType);
            return;
        }

        // 搜索逻辑
        const files = await window.ipfs.getDirectoryFiles(currentMediaType);
        const filteredFiles = files.filter(file => 
            file.Name.toLowerCase().includes(searchTerm) || // 匹配文件名
            file.Hash.toLowerCase().includes(searchTerm)    // 匹配CID
        );

        // 使用统一的渲染函数显示过滤后的结果
        await renderMediaContent(filteredFiles, currentMediaType);

    } catch (error) {
        console.error('搜索失败:', error);
        $('#mediaContainer').html(`
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle-fill me-2"></i>
                搜索失败: ${error.message}
            </div>
        `);
    }
}, 300));

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 绑定媒体交互事件
function bindMediaEvents() {
    // 图片预览功能
    if (currentMediaType === 'images') {
        console.log('绑定图片预览事件');
        
        // 移除之前的事件绑定
        $(document).off('click', '.image-card');
        $('.image-viewer').off('click');
        $('.image-viewer img').off('click');
        $(document).off('keydown.imageViewer');

        // 点击卡片打开预览
        $(document).on('click', '.image-card', function(e) {
            // 如果点击的是删除按钮或CID按钮，不触发预览
            if ($(e.target).closest('.media-actions').length || 
                $(e.target).closest('.copy-cid').length) {
                return;
            }
            
            console.log('图片卡片被点击');
            e.preventDefault();
            e.stopPropagation();
            
            const viewer = $('.image-viewer');
            const viewerImg = viewer.find('img');
            const imgSrc = $(this).data('image-src');
            console.log('设置预览图片:', imgSrc);
            viewerImg.attr('src', imgSrc);
            viewer.addClass('active');
        });

        // 点击预览背景关闭
        $('.image-viewer').on('click', function(e) {
            if (e.target === this) {
            $(this).removeClass('active');
            }
        });

        // 阻止点击预览图片时关闭
        $('.image-viewer img').on('click', function(e) {
            e.stopPropagation();
        });

        // ESC键关闭预览
        $(document).on('keydown.imageViewer', function(e) {
            if (e.key === 'Escape') {
                $('.image-viewer').removeClass('active');
            }
        });
    }

    // 视频播放功能
    if (currentMediaType === 'videos') {
        // 移除之前的事件绑定
        $(document).off('click', '.video-thumbnail');
        
        let player = null;

        // 生成视频缩略图
        $('.video-thumbnail').each(function() {
            const thumbnail = $(this);
            const videoUrl = thumbnail.data('video-url');
            const canvas = thumbnail.find('.thumbnail-canvas')[0];
            const video = document.createElement('video');
            
            video.crossOrigin = 'anonymous';
            video.src = videoUrl;
            video.currentTime = 2; // 改为2秒位置
            
            video.addEventListener('loadeddata', function() {
                // 等待视频加载完成后再设置时间
                video.currentTime = 2;
            });

            video.addEventListener('seeked', function() {
                // 视频定位完成后，将当前帧绘制到canvas上
                const context = canvas.getContext('2d');
                canvas.width = thumbnail.width();
                canvas.height = thumbnail.height();
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                video.remove(); // 清理video元素
            });
        });
        
        // 点击缩略图播放视频
        $(document).on('click', '.video-thumbnail', function(e) {
            // 如果点击的是删除按钮，不触发播放
            if ($(e.target).closest('.media-actions').length) {
                return;
            }
            
            const videoUrl = $(this).data('video-url');
            const videoName = $(this).data('video-name');
            
            // 更新模态框标题
            $('#videoModalLabel').text(videoName);
            
            // 显示模态框
            const videoModal = $('#videoModal');
            videoModal.modal('show');
            
            // 销毁之前的播放器实例
            if (player) {
                player.destroy();
            }
            
            // 初始化DPlayer
            player = new DPlayer({
                container: document.getElementById('dplayer'),
                screenshot: true,
                autoplay: true,
                video: {
                    url: videoUrl,
                    type: 'auto'
                }
            });
            
            // 模态框关闭时销毁播放器
            videoModal.on('hidden.bs.modal', function () {
                if (player) {
                    player.destroy();
                    player = null;
                }
            });
        });
    }

    // 删除功能
    $('.delete-media').click(async function() {
        const fileName = $(this).data('filename');
        
        showConfirmModal({
            title: '确认删除',
            message: `确定要删除 ${fileName} 吗？`,
            type: 'primary',
            confirmText: '删除',
            onConfirm: async () => {
            try {
                await window.ipfs.deleteMediaFile(currentMediaType, fileName);
                    // 显示成功提示
                const container = $('#mediaContainer');
                container.prepend(`
                    <div class="alert alert-success" id="deleteSuccess">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        删除成功: ${fileName}
                    </div>
                `);
                
                    // 3秒后移除成功提示
                setTimeout(() => {
                    $('#deleteSuccess').fadeOut('slow', function() {
                        $(this).remove();
                    });
                }, 3000);
                
                // 重新渲染媒体列表
                renderMedia(currentMediaType);
            } catch (error) {
                console.error('删除失败:', error);
                const container = $('#mediaContainer');
                container.prepend(`
                    <div class="alert alert-danger" id="deleteError">
                        <i class="bi bi-exclamation-circle-fill me-2"></i>
                        删除失败: ${error.message}
                    </div>
                `);
                
                    // 3秒后移除错误提示
                setTimeout(() => {
                    $('#deleteError').fadeOut('slow', function() {
                        $(this).remove();
                    });
                }, 3000);
            }
        }
        });
    });

    // 复制CID功能
    $('.copy-cid').click(async function() {
        const cid = $(this).data('cid');
        const button = $(this);
        const originalHtml = button.html();
        
        try {
            await navigator.clipboard.writeText(cid);
            // 更新按钮文本
            button.html('<i class="bi bi-check-lg"></i> 已复制');
            
            // 3秒后恢复按钮状态
            setTimeout(() => {
                button.html(originalHtml);
            }, 2000);
        } catch (error) {
            console.error('复制失败:', error);
            // 更新按钮文本为错误状态
            button.html('<i class="bi bi-x-lg"></i> 失败');
            
            // 3秒后恢复按钮状态
            setTimeout(() => {
                button.html(originalHtml);
            }, 2000);
        }
    });

    // 音乐播放功能
    if (currentMediaType === 'music') {
        // 初始化 APlayer
        if (!musicPlayer) {
            musicPlayer = new APlayer({
                container: document.getElementById('aplayer'),
                fixed: false,
                autoplay: false,
                theme: '#4f46e5',
                audio: []
            });

            // 监听播放器状态变化
            musicPlayer.on('play', function() {
                $('#aplayer').show();
            });

            musicPlayer.on('pause', function() {
                checkMusicPlayerState();
            });

            musicPlayer.on('ended', function() {
                checkMusicPlayerState();
            });

            // 监听播放列表变化
            musicPlayer.on('listclear', function() {
                $('#aplayer').hide();
            });
        }

        // 检查播放器状态
        checkMusicPlayerState();

        // 点击播放按钮播放音乐
        $(document).off('click', '[data-action="play"]').on('click', '[data-action="play"]', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const musicCard = $(this).closest('.music-card');
            const musicUrl = musicCard.data('music-url');
            const musicName = musicCard.data('music-name');
            const coverUrl = musicUrl + '.cover';

            // 确保播放器显示
            $('#aplayer').show();

            // 检查歌曲是否已经在播放列表中
            const audioList = musicPlayer.list.audios;
            const existingIndex = audioList.findIndex(audio => audio.url === musicUrl);

            if (existingIndex === -1) {
                // 添加到播放列表
                musicPlayer.list.add({
                    name: musicName,
                    artist: '未知艺术家',
                    url: musicUrl,
                    cover: coverUrl
                });
                // 播放新添加的歌曲
                musicPlayer.list.switch(audioList.length);
            } else {
                // 切换到已存在的歌曲
                musicPlayer.list.switch(existingIndex);
            }
            
            // 开始播放
            musicPlayer.play();
        });
    }
}

// 同步收藏列表到IPFS
async function syncPlaylist(playlistId) {
    const playlist = playlists.find(p => p.id.toString() === playlistId.toString());
    if (!playlist) return;

    try {
        // 显示同步进度提示
        const container = $('#mediaContainer');
        container.prepend(`
            <div class="alert alert-info" id="syncProgress">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-arrow-repeat me-2"></i>
                    <div class="flex-grow-1">
                        <div>正在同步收藏列表...</div>
                        <div class="progress mt-2" style="height: 5px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="small sync-status">0/${playlist.items.length}</div>
                </div>
                <div class="small text-muted mt-1 current-file"></div>
            </div>
        `);

        // 移除之前的事件监听器
        window.removeEventListener('syncProgress', handleSyncProgress);

        // 创建事件处理函数
        function handleSyncProgress(e) {
            const progress = e.detail;
            const progressAlert = $('#syncProgress');
            
            switch(progress.status) {
                case 'syncing':
                    // 更新进度条
                    const percentage = (progress.current / progress.total * 100).toFixed(0);
                    progressAlert.find('.progress-bar').css('width', `${percentage}%`);
                    progressAlert.find('.sync-status').text(`${progress.current}/${progress.total}`);
                    progressAlert.find('.current-file').text(`正在同步: ${progress.file}`);
                    break;

                case 'error':
                    // 显示错误信息
                    progressAlert.find('.current-file').html(`
                        <span class="text-danger">
                            <i class="bi bi-exclamation-circle me-1"></i>
                            同步失败: ${progress.file} - ${progress.error}
                        </span>
                    `);
                    break;
                    
                case 'completed':
                    // 显示完成信息
                    progressAlert.removeClass('alert-info').addClass('alert-success');
                    progressAlert.html(`
                        <div class="d-flex align-items-center">
                            <i class="bi bi-check-circle-fill me-2"></i>
                            <div>
                                同步完成！共同步 ${progress.synced} 个文件
                            </div>
                        </div>
                    `);
                    
                    // 3秒后移除提示
                    setTimeout(() => {
                        progressAlert.fadeOut('slow', function() {
                            $(this).remove();
                        });
                    }, 3000);

                    // 重新加载收藏列表
                    loadStoredData().then(() => {
                        // 重新渲染当前列表
                        const updatedPlaylist = playlists.find(p => p.id === playlistId);
                        if (updatedPlaylist) {
                            renderPlaylistContent(updatedPlaylist);
                        }
                    });

                    // 移除事件监听器
                    window.removeEventListener('syncProgress', handleSyncProgress);
                    break;
            }
        }

        // 添加事件监听器
        window.addEventListener('syncProgress', handleSyncProgress);

        // 开始同步
        await window.ipfs.syncPlaylistToIPFS(playlistId);

    } catch (error) {
        console.error('同步失败:', error);
        // 显示错误提示
        $('#syncProgress').removeClass('alert-info').addClass('alert-danger')
            .html(`
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-circle-fill me-2"></i>
                    <div>同步失败: ${error.message}</div>
                </div>
            `);
        // 移除事件监听器
        window.removeEventListener('syncProgress', handleSyncProgress);
    }
}

// 通用确认对话框
function showConfirmModal(options) {
    const { title, message, type = 'primary', confirmText = '确认', onConfirm } = options;
    
    // 创建模态框
    const modal = $(`
        <div class="modal fade" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-${type} confirm-btn">${confirmText}</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    // 添加到body
    $('body').append(modal);
    
    // 初始化Bootstrap模态框
    const modalInstance = new bootstrap.Modal(modal[0]);
    
    // 绑定确认按钮事件
    modal.find('.confirm-btn').on('click', async () => {
        if (typeof onConfirm === 'function') {
            await onConfirm();
        }
        modalInstance.hide();
    });
    
    // 模态框隐藏后清理DOM
    modal.on('hidden.bs.modal', function () {
        modal.remove();
    });
    
    // 显示模态框
    modalInstance.show();
}

// 修改删除收藏列表的确认对话框
$('.delete-playlist').click(function(e) {
    e.preventDefault();
    e.stopPropagation();
    const playlistId = $(this).data('playlist-id').toString();
    const playlist = playlists.find(p => p.id.toString() === playlistId);
    
    showConfirmModal({
        title: '确认删除',
        message: `确定要删除收藏列表 "${playlist.name}" 吗？`,
        type: 'primary',
        onConfirm: async () => {
            await window.ipfs.deletePlaylist(playlistId);
            await loadStoredData();
        }
    });
});

// 修改批量删除的确认对话框
$('#batchDeleteBtn').click(async function() {
    const checkedItems = $('.item-check:checked');
    if (checkedItems.length === 0) return;

    showConfirmModal({
        title: '确认删除',
        message: `确定要删除选中的 ${checkedItems.length} 个项目吗？`,
        type: 'primary',
        onConfirm: async () => {
            try {
                for (const item of checkedItems) {
                    const path = $(item).data('path');
                    await window.ipfs.removeFromPlaylist(playlist.id, path);
                }
                // 重新加载列表
                await loadStoredData();
                // 重新渲染当前列表
                const updatedPlaylist = playlists.find(p => p.id === playlist.id);
                if (updatedPlaylist) {
                    renderPlaylistContent(updatedPlaylist);
                }
            } catch (error) {
                console.error('批量删除失败:', error);
                // 显示错误提示
                const errorAlert = $(`
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <i class="bi bi-exclamation-circle-fill me-2"></i>
                        批量删除失败: ${error.message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `);
                $('#mediaContainer').prepend(errorAlert);
            }
        }
    });
});

// 修改单个删除的确认对话框
$('.delete-item').click(async function() {
    const path = $(this).data('path');
    
    showConfirmModal({
        title: '确认删除',
        message: '确定要删除此项目吗？',
        type: 'primary',
        onConfirm: async () => {
            try {
                await window.ipfs.removeFromPlaylist(playlist.id, path);
                // 重新加载列表
                await loadStoredData();
                // 重新渲染当前列表
                const updatedPlaylist = playlists.find(p => p.id === playlist.id);
                if (updatedPlaylist) {
                    renderPlaylistContent(updatedPlaylist);
                }
            } catch (error) {
                console.error('删除失败:', error);
                const errorAlert = $(`
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <i class="bi bi-exclamation-circle-fill me-2"></i>
                        删除失败: ${error.message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `);
                $('#mediaContainer').prepend(errorAlert);
            }
        }
    });
});

// 添加播放全部音乐的函数
async function playAllMusic(playlistId) {
    const playlist = playlists.find(p => p.id.toString() === playlistId.toString());
    if (!playlist || playlist.items.length === 0) return;

    // 初始化音乐播放器
    if (!musicPlayer) {
        musicPlayer = new APlayer({
            container: document.getElementById('aplayer'),
            fixed: false,
            autoplay: false,
            theme: '#4f46e5',
            audio: []
        });
    }

    // 确保播放器显示
    $('#aplayer').show();

    // 清空当前播放列表
    musicPlayer.list.clear();

    // 筛选出所有音乐文件
    const musicFiles = playlist.items.filter(item => item.type === 'music');
    if (musicFiles.length === 0) {
        alert('当前列表中没有音乐文件');
        // 如果没有音乐文件,隐藏播放器
        $('#aplayer').hide();
        return;
    }

    // 显示加载提示
    const loadingAlert = $(`
        <div class="alert alert-info" id="loadingMusic">
            <i class="bi bi-arrow-repeat me-2"></i>
            正在加载音乐列表...
        </div>
    `);
    $('#mediaContainer').prepend(loadingAlert);

    try {
        // 添加所有音乐到播放列表
        for (const item of musicFiles) {
            const fileInfo = await window.ipfs.getFileInfo(item.path);
            const fileUrl = `${window.ipfs.gatewayUrl}/${fileInfo.Hash}`;
            
            musicPlayer.list.add({
                name: fileInfo.Name,
                artist: '未知艺术家',
                url: fileUrl,
                cover: fileUrl + '.cover'
            });
        }

        // 开始播放第一首歌
        musicPlayer.list.switch(0);
        musicPlayer.play();

        // 显示成功提示
        loadingAlert.removeClass('alert-info').addClass('alert-success')
            .html(`<i class="bi bi-check-circle-fill me-2"></i>已添加 ${musicFiles.length} 首音乐到播放列表`);

        // 3秒后移除提示
        setTimeout(() => {
            loadingAlert.fadeOut('slow', function() {
                $(this).remove();
            });
        }, 3000);

    } catch (error) {
        console.error('加载音乐列表失败:', error);
        loadingAlert.removeClass('alert-info').addClass('alert-danger')
            .html(`<i class="bi bi-exclamation-circle-fill me-2"></i>加载音乐列表失败: ${error.message}`);
        // 发生错误时隐藏播放器
        $('#aplayer').hide();
    }
}