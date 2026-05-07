/**
 * 矿助 - 主前端逻辑脚本
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素引用
  const contentArea = document.getElementById('content-area');
  const searchInput = document.getElementById('search-input');
  const navLinks = document.querySelectorAll('.nav-item');
  const logo = document.getElementById('logo');
  
  // 状态管理
  let allData = [];
  let currentModule = '首页'; // 默认状态
  let searchQuery = '';

  // 1. 获取数据
  fetchData();

  async function fetchData() {
    try {
      // 尝试加载 content.json。注意本地双击 HTML 可能遇 CORS 问题，最好使用本地服务器
      const response = await fetch('./data/content.json');
      if (!response.ok) {
        throw new Error('网络响应错误');
      }
      allData = await response.json();
      renderPage(); // 数据加载后渲染一次
    } catch (error) {
      console.error('加载数据失败:', error);
      contentArea.innerHTML = `
        <div class="empty-state">
          <h3>数据加载失败</h3>
          <p>请确保您在 HTTP 环境下运行（例如 Live Server），而不是直接双击 HTML 文件打开。</p>
        </div>
      `;
    }
  }

  // 2. 导航与路由机制 (简单基于 JS 状态)
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // 清空搜索状态
      searchInput.value = '';
      searchQuery = '';
      
      currentModule = e.target.getAttribute('data-module');
      updateNavActiveState();
      renderPage();
    });
  });

  // 点击 Logo 回首页
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    searchQuery = '';
    currentModule = '首页';
    updateNavActiveState();
    renderPage();
  });

  function updateNavActiveState() {
    navLinks.forEach(link => {
      if (link.getAttribute('data-module') === currentModule) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // 3. 搜索功能机制（实时监听）
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    
    // 如果在首页搜索且有内容，临时切出到聚合结果视图；如果清空则回首页视图
    if (currentModule === '首页' && searchQuery !== '') {
      // 保持 currentModule 为首页不改变状态，但视图随 searchQuery 变化
    }
    
    renderPage();
  });

  /**
   * 4. 核心渲染逻辑
   * 根据 currentModule 和 searchQuery 过滤数据，分发给不同渲染函数
   */
  function renderPage() {
    contentArea.innerHTML = ''; // 清空内容

    // 如果处于搜索态（无论在哪一个模块）
    if (searchQuery) {
      const filteredResult = filterData(allData, currentModule, searchQuery);
      renderSearchResults(filteredResult);
      return;
    }

    // 默认展示态
    if (currentModule === '首页') {
      renderHome();
    } else {
      const moduleData = filterData(allData, currentModule, '');
      renderModuleContent(currentModule, moduleData);
    }
  }

  // 过滤函数
  function filterData(data, targetModule, query) {
    return data.filter(item => {
      // 1. 判断模块归属 (如果在首页搜，则扫描所有模块；否则只扫描当前模块)
      const moduleMatch = (targetModule === '首页' || item.module === targetModule);
      
      // 2. 判断关键词匹配 (如果 query 为空则必匹配)
      const queryMatch = query === '' || 
                         item.title.toLowerCase().includes(query) || 
                         item.content.toLowerCase().includes(query);
      
      return moduleMatch && queryMatch;
    });
  }

  // ============== 视图拼装函数 ==============

  // 渲染首页
  function renderHome() {
    // 渲染欢迎区
    const welcomeHtml = `
      <div class="welcome-section">
        <h1>欢迎来到 矿助</h1>
        <p>你的个人专属信息整理与导航工作区。清晰分类，精准检索。</p>
      </div>
    `;
    
    // 渲染三个大入口
    const entriesHtml = `
      <div class="card-grid">
        <div class="card module-entry" onclick="switchToModule('学习')">
          <h3>📚 学习</h3>
          <p>技术/文档/沉淀</p>
        </div>
        <div class="card module-entry" onclick="switchToModule('旅行')">
          <h3>🎒 旅行</h3>
          <p>攻略/清单/见闻</p>
        </div>
        <div class="card module-entry" onclick="switchToModule('饮食')">
          <h3>🍳 饮食</h3>
          <p>菜谱/探店/营养</p>
        </div>
      </div>
    `;
    
    // 聚合最近的数据（每个模块取一个展示）展示“最新动态”
    // 为了简单演示，这里不赘述逻辑，直接拼装全页
    contentArea.innerHTML = welcomeHtml + entriesHtml;
  }

  // 渲染单模块页面
  function renderModuleContent(moduleName, dataList) {
    const titleHtml = `<div class="section-title"><h3>🏷️ ${moduleName} 专区</h3></div>`;
    contentArea.innerHTML = titleHtml + buildCardsHtml(dataList);
  }

  // 渲染搜索结果页
  function renderSearchResults(dataList) {
    const scope = currentModule === '首页' ? '全站' : `“${currentModule}”模块`;
    const titleHtml = `<div class="section-title"><h3>🔍 ${scope}搜索结果: "${searchQuery}"</h3></div>`;
    contentArea.innerHTML = titleHtml + buildCardsHtml(dataList);
  }

  // 构建通用的卡片网格 HTML
  function buildCardsHtml(dataList) {
    if (dataList.length === 0) {
      return `
        <div class="empty-state">
          <h3>未找到相关内容</h3>
          <p>换个关键词或者去其他模块看看吧</p>
        </div>
      `;
    }

    const cardsHtml = dataList.map(item => {
      // 标签组
      const tagsHtml = item.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
      
      return `
        <div class="card">
          <span class="card-module-badge">${item.module}</span>
          <h3 class="card-title">${item.title}</h3>
          <p class="card-content">${item.content}</p>
          <div class="card-tags">
            ${tagsHtml}
          </div>
        </div>
      `;
    }).join('');

    return `<div class="card-grid">${cardsHtml}</div>`;
  }

  // ======= 暴露给内联 onclick 的全局方法 =======
  window.switchToModule = function(moduleName) {
    currentModule = moduleName;
    updateNavActiveState();
    renderPage();
  };
});
