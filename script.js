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
        
        <div id="paste-content">
          <div style="padding: 1rem; background: #eff6ff; color: #1d4ed8; border-left: 4px solid var(--primary-color); border-radius: 4px; margin-bottom: 1.5rem; font-size: 0.9rem;">
            💡 提示：本页支持教务系统【个人课表查询】列表的直接粘贴！更简单、成功率更高！
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">
              1. 登录并打开教务系统的 <a href="http://jwxt.cumt.edu.cn/jwglxt/kbcx/xskbcx_cxXskbcxIndex.html?gnmkdm=N2151" target="_blank" style="color: var(--primary-color); text-decoration: underline; font-weight: 500;">学生个人课表查询</a>（建议使用列表形式的页面）。<br>
              2. 直接按下键盘的 <b>Ctrl + A</b>（全选），再按 <b>Ctrl + C</b>（复制全部文字内容）。<br>
              3. 回到本页，鼠标点击下方虚线框内部，按下 <b>Ctrl + V</b> 粘贴！
            </p>
          </div>
          
          <div id="schedule-paste-area" contenteditable="true" style="border: 2px dashed var(--primary-color); border-radius: var(--radius-md); background: #f8fafc; min-height: 120px; padding: 2rem; text-align: center; color: var(--text-muted); font-size: 1.1rem; outline: none; cursor: pointer;">
            👉 点击这里，按 Ctrl+V 粘贴
          </div>
          <p id="paste-error" style="color: #dc2626; font-size: 0.9rem; display: none; margin-top: 0.5rem;"></p>
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
          localStorage.removeItem('kuangzhu_schedule');
          renderScheduleModule();
       });
    }

    document.getElementById('import-schedule-btn').addEventListener('click', () => {
      const modal = document.getElementById('import-modal');
      modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('close-import-modal-btn').addEventListener('click', () => {
      document.getElementById('import-modal').style.display = 'none';
    });

    // Handle HTML & Text Paste Parsing
    const pasteArea = document.getElementById('schedule-paste-area');
    if (pasteArea) {
        pasteArea.addEventListener('paste', (e) => {
            e.preventDefault();
            const html = e.clipboardData.getData('text/html');
            const plain = e.clipboardData.getData('text/plain');
            const errorEl = document.getElementById('paste-error');
            
            if (!html && !plain) {
                errorEl.textContent = '❌ 未检测到粘贴内容！请先复制。';
                errorEl.style.display = 'block';
                return;
            }
            
            try {
                let parsedCourses = [];
                // 优先尝试“个人课表查询”的纯文本列表模式因为更稳定
                if (plain && plain.includes('周数：') && plain.includes('上课地点：')) {
                    parsedCourses = parseTextSchedule(plain);
                }
                
                // 退后尝试复杂课表表格结构
                if ((!parsedCourses || parsedCourses.length === 0) && html) {
                    parsedCourses = parseHtmlSchedule(html);
                }

                if (!parsedCourses || parsedCourses.length === 0) {
                    errorEl.textContent = '❌ 未能在粘贴信息中找到课表，或格式不支持。请尝试进入“个人课表查询”以列表形式复制。';
                    errorEl.style.display = 'block';
                    return;
                }
                
                // 将自定义解析结构，转换为格式统一的原生 kbList 结构
                const kbListSimulated = parsedCourses.map(c => ({
                    kcmc: c.course,
                    xm: c.teacher,
                    cdmc: c.location,
                    xqj: c.weekday.toString(),
                    jcs: c.rawJcs,
                    zcd: c.rawZcd
                }));

                localStorage.setItem('kuangzhu_schedule', JSON.stringify(kbListSimulated));
                errorEl.style.color = '#10b981';
                errorEl.textContent = `✅ 成功解析并导入 ${kbListSimulated.length} 节课！`;
                errorEl.style.display = 'block';
                setTimeout(() => { renderScheduleModule(); }, 1500);
                
            } catch (err) {
                errorEl.textContent = '❌ 解析出错：' + err.message;
                errorEl.style.display = 'block';
            }
        });
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

  // 文本列表形式课表解析器 (支持个人课表查询列表复制模式)
  function parseTextSchedule(text) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const courses = [];
      let currentWeekday = null;
      let currentSectionRange = null;

      const weekdayMap = {
          '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4,
          '星期五': 5, '星期六': 6, '星期日': 7
      };

      for (let line of lines) {
          let matchedWk = null;
          for (const wk in weekdayMap) {
              if (line.startsWith(wk)) {
                  matchedWk = weekdayMap[wk];
                  break;
              }
          }
          if (matchedWk) {
              currentWeekday = matchedWk;
              // 判断是否独占一行
              if (line.replace(new RegExp(`^星期[一二三四五六日]`), '').trim() === '') {
                  continue;
              }
          }

          const secMatch = line.match(/^(\d+)-(\d+)(?:\s+|$)/);
          if (secMatch) {
              currentSectionRange = {
                  start: parseInt(secMatch[1]),
                  end: parseInt(secMatch[2])
              };
              const remaining = line.slice(secMatch[0].length).trim();
              if (remaining) {
                  line = remaining;
              } else {
                  continue;
              }
          }

          if (currentWeekday && currentSectionRange && line.includes('周数：')) {
              const courseNameMatch = line.match(/^(.*?)[●○◆◇★]*\s*周数：/);
              const cName = courseNameMatch ? courseNameMatch[1].replace(/【调】/g, '').trim() : "未知课程";
              
              const zcdMatch = line.match(/周数：(.*?)(?:\s+校区|\s+上课地点|$)/);
              const zcd = zcdMatch ? zcdMatch[1].trim() : "";
              
              const locMatch = line.match(/上课地点：(.*?)(?:\s+教师|$)/);
              const loc = locMatch ? locMatch[1].trim() : "待定";
              
              const teaMatch = line.match(/教师\s*[：:]\s*(.*?)(?:\s+教学班|$)/);
              const tea = teaMatch ? teaMatch[1].trim() : "未知老师";
              
              if (cName && cName !== '未知课程') {
                  courses.push({
                      course: cName,
                      teacher: tea,
                      location: loc,
                      weekday: currentWeekday,
                      sections: Array.from({length: currentSectionRange.end - currentSectionRange.start + 1}, (_, i) => currentSectionRange.start + i),
                      rawJcs: `${currentSectionRange.start}-${currentSectionRange.end}`,
                      rawZcd: zcd
                  });
              }
          }
      }
      
      // 去重
      const uniqueCourses = [];
      const seen = new Set();
      courses.forEach(c => {
         const key = `${c.weekday}-${c.rawJcs}-${c.course}-${c.rawZcd}`;
         if (!seen.has(key)) {
             seen.add(key);
             uniqueCourses.push(c);
         }
      });

      return uniqueCourses;
  }

  // 核心 HTML 表格解析器：用于处理浏览器复制保留的富文本DOM结构
  function parseHtmlSchedule(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tables = doc.querySelectorAll('table');
      let table = null;
      
      // 寻找教务系统的课表主表格：通常包含“星期一”、“节次”等字眼
      for(const tb of tables) {
          if (tb.textContent.includes('星期一') || tb.textContent.includes('节次')) {
              table = tb;
              break;
          }
      }
      if (!table) table = tables[0];
      if (!table) return [];

      const grid = [];
      // 将 rowspan 和 colspan 展开为完整的二维网格，因为课表往往具有大跨度的单元格
      table.querySelectorAll('tr').forEach((tr, rIndex) => {
         grid[rIndex] = grid[rIndex] || [];
         let cIndex = 0;
         tr.querySelectorAll('td, th').forEach(cell => {
             while(grid[rIndex][cIndex]) cIndex++;
             const rowSpan = parseInt(cell.getAttribute('rowspan')) || 1;
             const colSpan = parseInt(cell.getAttribute('colspan')) || 1;
             
             // 安全提取文本及其换行，避免断开的DOM节点导致 innerText 糊在一起
             let cellHtml = cell.innerHTML;
             cellHtml = cellHtml.replace(/<br\s*\/?>/gi, '\n')
                                .replace(/<\/p>|<\/div>|<\/h\d>|<\/li>|<\/tr>/gi, '\n');
             const cellDoc = new DOMParser().parseFromString(cellHtml, 'text/html');
             const lines = cellDoc.body.textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
             const rawText = lines.join('\n');
             
             for(let r=0; r<rowSpan; r++) {
                 for(let c=0; c<colSpan; c++) {
                     grid[rIndex+r] = grid[rIndex+r] || [];
                     grid[rIndex+r][cIndex+c] = { lines: lines, raw: rawText };
                 }
             }
             cIndex += colSpan;
         });
      });

      let weekdayCols = {};
      // 找到表示星期几的列索引
      for(let r=0; r < grid.length; r++) {
          for(let c=0; c < grid[r].length; c++) {
             if (!grid[r][c]) continue;
             const text = grid[r][c].raw.replace(/\s+/g, '');
             if (text.includes('星期一')) weekdayCols[c] = 1;
             if (text.includes('星期二')) weekdayCols[c] = 2;
             if (text.includes('星期三')) weekdayCols[c] = 3;
             if (text.includes('星期四')) weekdayCols[c] = 4;
             if (text.includes('星期五')) weekdayCols[c] = 5;
             if (text.includes('星期六')) weekdayCols[c] = 6;
             if (text.includes('星期日')) weekdayCols[c] = 7;
          }
          if (Object.keys(weekdayCols).length > 0) break;
      }

      const courses = [];
      // 遍历所有数据行，寻找含有课程的单元格
      for(let r=0; r < grid.length; r++) {
          const useFallback = Object.keys(weekdayCols).length === 0;

          for(let c=0; c < grid[r].length; c++) {
              let weekday = null;
              if (useFallback) {
                 // 若未发现明显的星期表头，则假定最右侧的7列为周一到周日（正方系统典型特征）
                 const dayOffset = 7 - (grid[r].length - c);
                 if (dayOffset >= 0 && dayOffset <= 6) weekday = dayOffset + 1;
              } else {
                 weekday = weekdayCols[c];
              }

              if (!weekday) continue;
              const cellData = grid[r][c];
              if (!cellData) continue;
              
              const lines = cellData.lines;
              if (lines.length === 0 || !cellData.raw.includes('节)')) continue; // 快速过滤非课程文本

              // 按照换行符分割，查找特征如: (3-4节)1-18周
              for(let i=0; i<lines.length; i++) {
                  const line = lines[i];
                  const match = line.match(/\(.*?(?:第)?(\d+)-(\d+)节\s*\)(.*?周)/);
                  if (match) {
                     const courseName = lines[i-1] ? lines[i-1] : "未知课程";
                     if (courseName.includes('星期') || courseName === '上午' || courseName === '下午' || courseName === '晚上') continue;

                     const startSection = parseInt(match[1]);
                     const endSection = parseInt(match[2]);
                     const sections = [];
                     for(let s=startSection; s<=endSection; s++) sections.push(s);
                     
                     let location = "待定";
                     let teacher = "未知老师";
                     
                     // 探针预测位置与老师：通常在时间节次之后的两行内
                     if (lines[i+1] && !lines[i+1].includes('节)')) {
                         location = lines[i+1];
                         if (lines[i+2] && !lines[i+2].includes('节)')) {
                             teacher = lines[i+2];
                         }
                     }

                     courses.push({
                         course: courseName.replace(/●|○|◆|◇|★|【调】/g, ''),
                         teacher: teacher,
                         location: location,
                         weekday: weekday,
                         sections: sections,
                         rawJcs: `${startSection}-${endSection}`,
                         rawZcd: match[3]
                     });
                  }
              }
          }
      }
      
      // 去重机制：因为合并的单元格在二维数组展开后会导致相同课程在多个行中被重复扫描
      const uniqueCourses = [];
      const seen = new Set();
      courses.forEach(c => {
         // 生成唯一标识：星期几-节次-课程名
         const key = `${c.weekday}-${c.rawJcs}-${c.course}`;
         if (!seen.has(key)) {
             seen.add(key);
             uniqueCourses.push(c);
         }
      });
      
      return uniqueCourses;
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
        <div class="card" onclick="window.renderArticle('${item.id}')">
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
  window.renderArticle = function(id) {
    const article = allData.find(item => item.id === id);
    if (!article) return;
    
    const tagsHtml = article.tags && article.tags.length ? article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : '';

    const articleHtml = `
      <div class="article-view">
        <button class="back-btn" onclick="window.renderPageGlobal()">← 返回</button>
        <div class="article-header">
          <span class="card-module-badge">${article.module}</span>
          <h1 class="article-title">${article.title}</h1>
          <div class="card-tags" style="margin-top: 1rem;">
            ${tagsHtml}
          </div>
        </div>
        <div class="article-body">
          <p>${article.content.replace(/\\n/g, '<br>')}</p>
        </div>
      </div>
    `;
    
    contentArea.innerHTML = articleHtml;
    window.scrollTo(0, 0);
  }

  window.switchToModule = function(moduleName) {
    currentModule = moduleName;
    updateNavActiveState();
    renderPage();
  };

  window.renderPageGlobal = function() {
    renderPage();
  };
});
