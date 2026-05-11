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

  // 0. 优先检查书签同步传回来的参数
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'sync' && urlParams.get('data')) {
    try {
      const kbList = JSON.parse(decodeURIComponent(urlParams.get('data')));
      localStorage.setItem('kuangzhu_schedule', JSON.stringify(kbList));
      // 清除 URL 参数，避免直接分享URL泄露课表
      window.history.replaceState({}, document.title, window.location.pathname);
      currentModule = '课表';
    } catch(e) {
      console.error('解析课表数据失败', e);
      alert('同步发生错误，数据解析失败...');
    }
  }

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
    } else if (currentModule === '课表') {
      renderScheduleModule();
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

  // 渲染课表同步模块
  function renderScheduleModule() {
    const savedScheduleStr = localStorage.getItem('kuangzhu_schedule');
    let savedSchedule = null;
    if (savedScheduleStr) {
      try {
        savedSchedule = JSON.parse(savedScheduleStr);
      } catch (e) {}
    }

    let startDateStr = localStorage.getItem('kuangzhu_start_date');

    contentArea.innerHTML = `
      <div class="schedule-wrapper" style="max-width: 100%; overflow-x: auto;">
        <div class="schedule-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
          <h3 style="margin: 0; font-size: 1.25rem;">📅 我的课表</h3>
          <div style="display: flex; align-items: center; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
            <button id="prev-week-btn" style="padding: 0.4rem 0.8rem; cursor:pointer; background: none; border: none; border-right: 1px solid var(--border-color); font-weight: 500; font-size: 0.9rem;">&lt; 上周</button>
            <span id="current-week-display" style="padding: 0 1rem; font-weight: 600; font-size: 0.9rem;">第 1 周</span>
            <button id="next-week-btn" style="padding: 0.4rem 0.8rem; cursor:pointer; background: none; border: none; border-left: 1px solid var(--border-color); font-weight: 500; font-size: 0.9rem;">下周 &gt;</button>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.4rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.2rem 0.5rem;" title="设定开学第一周的星期一">
               <label for="start-date-input" style="font-size: 0.8rem; color: var(--text-muted); cursor: pointer;">第一周周一:</label>
               <input type="date" id="start-date-input" style="border: none; outline: none; background: transparent; font-size: 0.85rem; color: var(--text-main); font-family: inherit; cursor: pointer;" ${startDateStr ? `value="${startDateStr}"` : ''}>
            </div>
            <button id="import-schedule-btn" style="padding: 0.45rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500; font-size: 0.9rem; box-shadow: var(--shadow-sm);">
              ${savedSchedule && savedSchedule.length > 0 ? '更新课表' : '导入课表'}
            </button>
            ${savedSchedule && savedSchedule.length > 0 ? '<button id="clear-schedule-btn" style="padding: 0.45rem 0.8rem; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: var(--radius-md); cursor: pointer; font-weight: 500; font-size: 0.9rem;">清除</button>' : ''}
          </div>
        </div>

        <div class="schedule-calendar" style="display: flex; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; min-width: 800px; background: white; box-shadow: var(--shadow-sm);">
          <!-- 左侧时间列 -->
          <div class="time-col" style="width: 75px; background: #f9fafb; border-right: 1px solid var(--border-color); flex-shrink: 0;">
            <div style="height: 50px; border-bottom: 1px solid var(--border-color);"></div> <!-- 占位对齐表头 -->
            ${[
              { n: 1, t: '08:00', t2: '08:50' },
              { n: 2, t: '08:55', t2: '09:45' },
              { n: 3, t: '10:15', t2: '11:05' },
              { n: 4, t: '11:10', t2: '12:00' },
              { n: 5, t: '14:00', t2: '14:50' },
              { n: 6, t: '14:55', t2: '15:45' },
              { n: 7, t: '16:15', t2: '17:05' },
              { n: 8, t: '17:10', t2: '18:00' },
              { n: 9, t: '19:00', t2: '19:50' },
              { n: 10, t: '19:55', t2: '20:45' },
              { n: 11, t: '20:50', t2: '21:40' },
              { n: 12, t: '21:45', t2: '22:35' }
             ].map(item => `
             <div style="height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">
               <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); line-height: 1.1;">${item.n}</div>
               <div style="font-size: 0.65rem; transform: scale(0.85); transform-origin: top center; line-height: 1.1; margin-top: 1px; display: flex; flex-direction: column; align-items: center;">
                  <span>${item.t}</span>
                  <span style="font-size: 0.5rem; margin: -2px 0;">|</span>
                  <span>${item.t2}</span>
               </div>
             </div>`).join('')}
          </div>

          <!-- 右侧星期列容器 -->
          <div class="days-container" id="schedule-days-container" style="display: flex; flex: 1;">
            <!-- 内容由 JS 生成 -->
          </div>
        </div>
      </div>

      <!-- 导入书签的弹窗容器 -->
      <div id="import-modal" style="display: ${savedSchedule && savedSchedule.length > 0 ? 'none' : 'block'}; margin-top: 1.5rem; background: var(--card-bg); padding: 1.5rem; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
           <h4 style="margin: 0; color: var(--text-main); font-size: 1.1rem;">⛏️ 提取教务课表</h4>
           <button id="close-import-modal-btn" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        <p style="margin-bottom: 1.5rem; font-size: 0.95rem; color: var(--text-muted);">无需手动查 Cookie！网站提供了一个“小书签”按键。它会在你的教务系统网页里自动抓取课表并带回来。</p>
        
        <div style="margin-bottom: 1.5rem;">
          <strong style="display:inline-block; margin-bottom: 0.5rem; color: var(--primary-color);">第一步：设定要提取的学期</strong>
          <div style="display: flex; gap: 1rem;">
            <div style="flex: 1;">
              <label for="bm-xnm" style="display: block; font-size: 0.9rem; margin-bottom: 0.3rem;">学年 (如 2023)</label>
              <input type="text" id="bm-xnm" value="2023" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); outline: none;">
            </div>
            <div style="flex: 1;">
              <label for="bm-xqm" style="display: block; font-size: 0.9rem; margin-bottom: 0.3rem;">学期 (如 3 或 12)</label>
              <input type="text" id="bm-xqm" value="3" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); outline: none;">
            </div>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <strong style="display:inline-block; margin-bottom: 0.5rem; color: var(--primary-color);">第二步：添加提取书签</strong>
          <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 0.8rem;">
            请使用鼠标按住下方蓝色按钮，把它<strong>往上拖拽</strong>到你的浏览器标题下方的【书签栏】里。
          </p>
          <div style="text-align: center; padding: 1.5rem; border: 2px dashed var(--border-color); border-radius: var(--radius-md); background: #f9fafb;">
            <a id="bookmark-btn" href="#" style="background: var(--primary-color); color: white; padding: 0.75rem 1.5rem; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block; cursor: grab; box-shadow: var(--shadow-sm); transition: transform 0.2s;">⛏️ 提取矿大课表 (拖拽我)</a>
          </div>
        </div>

        <div style="margin-bottom: 0.5rem;">
          <strong style="display:inline-block; margin-bottom: 0.5rem; color: var(--primary-color);">第三步：进入教务系统并点击提取</strong>
          <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">
            1. 在电脑浏览器新窗口打开 <a href="http://jwxt.cumt.edu.cn/jwglxt/kbcx/xskbcx_cxXskbcxIndex.html?gnmkdm=N2151&layout=default" target="_blank" style="color: var(--primary-color); text-decoration: underline; font-weight: 500;">教务系统课表页面</a>（遇到登录页面请先登录）。<br>
            2. 成功进入页面后，直接<strong>点击</strong>你刚刚保存在顶部书签栏里的 <b>“⛏️ 提取矿大课表”</b>。<br>
            3. 等待网页拉取数据并自动跳回本站！然后你可以在右上角选择【第一周周一】的时间。
          </p>
        </div>
      </div>
    `;

    const formattedData = savedSchedule ? formatRawKbList(savedSchedule) : [];
    let currentWeek = 1;
    
    function renderWeek(weekNum, courseData) {
      document.getElementById('current-week-display').textContent = '第 ' + weekNum + ' 周';
      const daysContainer = document.getElementById('schedule-days-container');
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      
      let startDateStr = localStorage.getItem('kuangzhu_start_date');
      let startUserDate = null;
      if (startDateStr) {
         const parts = startDateStr.split('-');
         if (parts.length === 3) {
            startUserDate = new Date(parts[0], parts[1] - 1, parts[2]);
         }
      }
      
      let daysHtml = '';
      for(let i=0; i<7; i++) {
        const weekday = i + 1;
        const dayCourses = courseData.filter(c => c.weekday === weekday && parseZcd(c.rawZcd).includes(weekNum));

        let dateHtml = '';
        if (startUserDate && !isNaN(startUserDate.getTime())) {
            const currentDayDate = new Date(startUserDate.getTime() + ((weekNum - 1) * 7 + i) * 24 * 60 * 60 * 1000);
            const m = currentDayDate.getMonth() + 1;
            const d = currentDayDate.getDate();
            dateHtml = `<div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 400; margin-top: 2px;">${m}/${d}</div>`;
        }

        let courseBlocksHtml = '';
        dayCourses.forEach(course => {
           if (course.sections && course.sections.length > 0) {
              const startSection = Math.min(...course.sections);
              const endSection = Math.max(...course.sections);
              const duration = endSection - startSection + 1;
              const topOffset = (startSection - 1) * 60;
              const blockHeight = duration * 60;
              
              courseBlocksHtml += `
                <div style="position: absolute; top: ${topOffset}px; left: 4px; right: 4px; height: ${blockHeight - 4}px; background: rgba(37, 99, 235, 0.1); border-left: 3px solid var(--primary-color); border-radius: 4px; padding: 4px 6px; font-size: 0.75rem; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); z-index: 10;" title="${course.course} \n${course.location} \n${course.teacher}">
                  <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 2px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${course.course}</div>
                  <div style="color: var(--text-main); line-height: 1.2;">@${course.location}</div>
                  <div style="color: var(--text-muted); margin-top: 2px;">${course.teacher}</div>
                </div>
              `;
           }
        });

        daysHtml += `
          <div class="day-col" style="flex: 1; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; position: relative; min-width: 100px;">
            <div style="height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f9fafb; border-bottom: 1px solid var(--border-color); font-weight: 500; color: var(--text-main); font-size: 0.9rem;">
              <div>${dayNames[i]}</div>
              ${dateHtml}
            </div>
            <div class="day-grid" style="flex: 1; position: relative; background-image: linear-gradient(var(--border-color) 1px, transparent 1px); background-size: 100% 60px;">
              ${courseBlocksHtml}
            </div>
          </div>
        `;
      }
      daysContainer.innerHTML = daysHtml;
    }

    renderWeek(currentWeek, formattedData);

    // Event listeners
    document.getElementById('prev-week-btn').addEventListener('click', () => { if(currentWeek > 1) { currentWeek--; renderWeek(currentWeek, formattedData); } });
    document.getElementById('next-week-btn').addEventListener('click', () => { currentWeek++; renderWeek(currentWeek, formattedData); });
    
    const startDateInput = document.getElementById('start-date-input');
    if (startDateInput) {
       startDateInput.addEventListener('change', (e) => {
          localStorage.setItem('kuangzhu_start_date', e.target.value);
          renderWeek(currentWeek, formattedData);
       });
    }

    const clearBtn = document.getElementById('clear-schedule-btn');
    if (clearBtn) {
       clearBtn.addEventListener('click', () => {
          if (confirm('确定要清除本地保存的课表数据吗？')) {
             localStorage.removeItem('kuangzhu_schedule');
             renderScheduleModule();
          }
       });
    }

    document.getElementById('import-schedule-btn').addEventListener('click', () => {
      const modal = document.getElementById('import-modal');
      modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
      if(modal.style.display === 'block') {
         updateBookmarklet();
      }
    });

    document.getElementById('close-import-modal-btn').addEventListener('click', () => {
      document.getElementById('import-modal').style.display = 'none';
    });

    // 动态生成书签代码
    const xnmInput = document.getElementById('bm-xnm');
    const xqmInput = document.getElementById('bm-xqm');
    const bBtn = document.getElementById('bookmark-btn');

    function updateBookmarklet() {
      if(!xnmInput || !xqmInput || !bBtn) return;
      const xnm = xnmInput.value.trim();
      const xqm = xqmInput.value.trim();
      const appUrl = window.location.origin;
      const code = `javascript:(function(){var m=document.createElement('div');m.innerHTML='正在提取，请稍等...';m.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;z-index:999999;font-weight:bold;';document.body.appendChild(m);fetch('/jwglxt/kbcx/xskbcx_cxXsKb.html?gnmkdm=N2151',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:'xnm=${xnm}&xqm=${xqm}'}).then(r=>r.text()).then(t=>{try{var d=JSON.parse(t);if(d&&d.kbList){window.location.href='${appUrl}?action=sync&data='+encodeURIComponent(JSON.stringify(d.kbList));return;}}catch(e){}alert('提取失败！请确保你已经成功登录，且当前学期真有课。');m.remove();}).catch(e=>{alert('网络请求出错: '+e.message);m.remove();});})();`;
      bBtn.setAttribute('href', code);
    }

    if (xnmInput && xqmInput) {
      xnmInput.addEventListener('input', updateBookmarklet);
      xqmInput.addEventListener('input', updateBookmarklet);
    }
  }

  // 将学校原生的 kbList 格式化为内部易读的结构
  function formatRawKbList(kbList) {
    return kbList.map(item => {
      // 解析节次 "1-2" -> [1, 2]
      const sections = [];
      if (item.jcs) {
        const sectionMatch = item.jcs.match(/(\d+)-(\d+)/);
        if (sectionMatch) {
          for (let i = parseInt(sectionMatch[1]); i <= parseInt(sectionMatch[2]); i++) {
            sections.push(i);
          }
        } else {
           const v = parseInt(item.jcs);
           if (!isNaN(v)) sections.push(v);
        }
      }

      return {
        course: item.kcmc,
        teacher: item.xm,
        location: item.cdmc,
        weekday: parseInt(item.xqj),
        sections: sections,
        rawJcs: item.jcs,
        rawZcd: item.zcd
      };
    });
  }

  // 辅助方法：解析周次字符串，例如 "1-10周", "1,3,5周", "4-7,9-12周(单)"
  function parseZcd(zcdStr) {
    const weeks = [];
    if(!zcdStr) return weeks;
    const parts = zcdStr.replace(/[^0-9,-]/g, '').split(',');
    parts.forEach(p => {
       if (p.includes('-')) {
          const [start, end] = p.split('-');
          const s = parseInt(start), e = parseInt(end);
          if(!isNaN(s) && !isNaN(e)) {
             for(let w=s; w<=e; w++) weeks.push(w);
          }
       } else {
          const w = parseInt(p);
          if(!isNaN(w)) weeks.push(w);
       }
    });
    return weeks;
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
