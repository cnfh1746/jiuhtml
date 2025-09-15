// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced } from "../../../../script.js";

// ----------------- 初始化按钮与面板 -----------------
const starBtn = document.createElement('button');
starBtn.id = 'friend-circle-btn';
starBtn.textContent = '🌟';
document.body.appendChild(starBtn);

const panel = document.createElement('div');
panel.id = 'friend-circle-panel';
panel.className = 'friend-circle-panel hidden';
document.body.appendChild(panel);

const panelContent = document.createElement('div');
panelContent.id = 'panel-content';
panel.appendChild(panelContent);

// ----------------- 所有控件都加入 panelContent -----------------

// 面板切换按钮
const togglePanelBtn = document.createElement('button');
togglePanelBtn.textContent = '切换大面板';
togglePanelBtn.addEventListener('click', () => {
    const isLarge = panel.classList.toggle('large-mode');
    togglePanelBtn.textContent = isLarge ? '切换小面板' : '切换大面板';
    if (!isLarge) {
        panel.style.width = '';
        panel.style.height = '';
    }
});
panelContent.appendChild(togglePanelBtn);

// 读取聊天记录数量滑块
const sliderContainer = document.createElement('div');
sliderContainer.id = 'slider-container';
sliderContainer.innerHTML = `
    <span>读取聊天条数: </span>
    <input type="range" id="chat-count-slider" min="0" max="20" value="10">
    <span id="chat-count-value">10</span>
`;
panelContent.appendChild(sliderContainer);
const sliderInput = document.getElementById('chat-count-slider');
const sliderValue = document.getElementById('chat-count-value');

// 调试日志区域
const debugContainer = document.createElement('div');
debugContainer.id = 'friend-circle-debug';
panelContent.appendChild(debugContainer);

function debugLog(step, data) {
    const msg = `[朋友圈调试] ${step} ${data ? JSON.stringify(data, null, 2) : ''}`;
    console.log(msg);
    const line = document.createElement('div');
    line.textContent = msg;
    debugContainer.appendChild(line);
    debugContainer.scrollTop = debugContainer.scrollHeight;
}

// API 模块
const apiBtn = document.createElement('button');
apiBtn.textContent = '⚙️ API设置';
panelContent.appendChild(apiBtn);
const apiModule = document.createElement('div');
apiModule.id = 'api-module';
apiModule.style.display = 'none';
apiModule.innerHTML = `
    <label>API URL: <input type="text" id="api-url-input"></label><br>
    <label>API Key: <input type="text" id="api-key-input"></label><br>
    <label>模型: <select id="api-model-select"></select></label>
    <button id="api-refresh-models-btn">刷新</button><br>
    <button id="api-save-btn">保存配置</button>
    <button id="api-test-btn">测试连接</button>
    <div id="api-status"></div>
`;
panelContent.appendChild(apiModule);

// 用户自定义提示词模块
const promptBtn = document.createElement('button');
promptBtn.textContent = '🖊️ 提示词管理';
panelContent.appendChild(promptBtn);
const userPromptModule = document.createElement('div');
userPromptModule.id = 'user-prompt-module';
userPromptModule.style.display = 'none';
userPromptModule.innerHTML = `
    <input type="text" id="new-prompt-name-input" placeholder="提示词名称">
    <textarea id="new-prompt-input" placeholder="输入自定义提示词"></textarea>
    <button id="add-prompt-btn">添加</button>
    <div id="prompt-list-container"></div>
`;
panelContent.appendChild(userPromptModule);

// AI身份设定
const identityModule = document.createElement('div');
identityModule.id = 'identity-module';
identityModule.innerHTML = `
    <h4>AI身份设定</h4>
    <textarea id="ai-identity-input" placeholder="在这里设定AI的身份和行为准则..."></textarea>
`;
panelContent.appendChild(identityModule);

// 正则替换模块
const regexBtn = document.createElement('button');
regexBtn.textContent = '📜 正则替换规则';
panelContent.appendChild(regexBtn);
const regexModule = document.createElement('div');
regexModule.id = 'regex-module';
regexModule.style.display = 'none';
regexModule.innerHTML = `
    <div id="regex-list"></div>
    <input type="text" id="regex-name-input" placeholder="规则名称">
    <input type="text" id="regex-pattern-input" placeholder="查找正则表达式">
    <textarea id="regex-replacement-input" placeholder="替换为"></textarea>
    <button id="add-regex-btn">添加规则</button>
`;
panelContent.appendChild(regexModule);

// 生成结果容器
const outputContainer = document.createElement('div');
outputContainer.id = 'friend-circle-output';
panelContent.appendChild(outputContainer);

// 生成与停止按钮容器
const generationControlContainer = document.createElement('div');
generationControlContainer.id = 'generation-control-container';
panelContent.appendChild(generationControlContainer);

const genBtn = document.createElement('button');
genBtn.id = 'gen-btn';
genBtn.textContent = '生成';
generationControlContainer.appendChild(genBtn);

const stopBtn = document.createElement('button');
stopBtn.id = 'stop-btn';
stopBtn.textContent = '停止';
stopBtn.style.display = 'none'; // 默认隐藏
generationControlContainer.appendChild(stopBtn);


// 固定注入按钮容器
const fixedBtnContainer = document.createElement('div');
fixedBtnContainer.id = 'fixed-btn-container';
panel.appendChild(fixedBtnContainer);


// ----------------- 功能逻辑 -----------------

// --- 持久化设置 ---
const aiIdentityInput = document.getElementById('ai-identity-input');
aiIdentityInput.value = localStorage.getItem('aiIdentity') || '';
aiIdentityInput.addEventListener('input', () => {
    localStorage.setItem('aiIdentity', aiIdentityInput.value);
});

sliderInput.value = localStorage.getItem('chatCount') || '10';
sliderValue.textContent = sliderInput.value;
sliderInput.addEventListener('input', () => {
    sliderValue.textContent = sliderInput.value;
    localStorage.setItem('chatCount', sliderInput.value);
});

// --- 模块折叠 ---
apiBtn.addEventListener('click', () => {
    apiModule.style.display = apiModule.style.display === 'none' ? 'block' : 'none';
});
promptBtn.addEventListener('click', () => {
    userPromptModule.style.display = userPromptModule.style.display === 'none' ? 'block' : 'none';
});
regexBtn.addEventListener('click', () => {
    regexModule.style.display = regexModule.style.display === 'none' ? 'block' : 'none';
});

// --- API 逻辑 ---
const apiUrlInput = document.getElementById('api-url-input');
const apiKeyInput = document.getElementById('api-key-input');
const modelSelect = document.getElementById('api-model-select');
const apiStatus = document.getElementById('api-status');

apiUrlInput.value = localStorage.getItem('independentApiUrl') || '';
apiKeyInput.value = localStorage.getItem('independentApiKey') || '';
const savedModel = localStorage.getItem('independentApiModel');

function populateModelSelect(models) {
    modelSelect.innerHTML = '';
    const uniq = Array.from(new Set(models || []));
    uniq.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m;
        modelSelect.appendChild(option);
    });
    if (savedModel) {
        let existing = Array.from(modelSelect.options).find(o => o.value === savedModel);
        if (existing) {
            existing.textContent = savedModel + '（已保存）';
            modelSelect.value = savedModel;
        } else {
            const opt = document.createElement('option');
            opt.value = savedModel;
            opt.textContent = savedModel + '（已保存）';
            modelSelect.insertBefore(opt, modelSelect.firstChild);
            modelSelect.value = savedModel;
        }
    } else if (modelSelect.options.length > 0) {
        modelSelect.selectedIndex = 0;
    }
}

(async function initApiModels() {
    const storedModelsRaw = localStorage.getItem('independentApiModels');
    if (storedModelsRaw) {
        try {
            const arr = JSON.parse(storedModelsRaw);
            if (Array.isArray(arr)) populateModelSelect(arr);
        } catch (e) { /* ignore */ }
    } else if (savedModel) {
        populateModelSelect([savedModel]);
    }
})();


document.getElementById('api-save-btn').addEventListener('click', () => {
    const url = apiUrlInput.value;
    const key = apiKeyInput.value;
    const model = modelSelect.value;
    if (!url || !key || !model) {
        alert('请完整填写API信息');
        return;
    }
    localStorage.setItem('independentApiUrl', url);
    localStorage.setItem('independentApiKey', key);
    localStorage.setItem('independentApiModel', model);
    Array.from(modelSelect.options).forEach(o => {
        o.textContent = o.value;
        if (o.value === model) o.textContent += '（已保存）';
    });
    apiStatus.textContent = '已保存';
});

document.getElementById('api-test-btn').addEventListener('click', async () => {
    const urlRaw = apiUrlInput.value;
    const key = apiKeyInput.value;
    const model = modelSelect.value;
    if (!urlRaw || !key || !model) return alert('请完整填写API信息');
    const baseUrl = urlRaw.replace(/\/$/, '');
    apiStatus.textContent = '正在测试...';
    try {
        const res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await res.json();
        apiStatus.textContent = '连接成功';
    } catch (e) {
        apiStatus.textContent = '连接失败: ' + e.message;
    }
});

document.getElementById('api-refresh-models-btn').addEventListener('click', async () => {
    const url = apiUrlInput.value;
    const key = apiKeyInput.value;
    if (!url || !key) return alert('请填写URL和Key');
    apiStatus.textContent = '正在拉取...';
    try {
        const res = await fetch(`${url.replace(/\/$/, '')}/v1/models`, { headers: { 'Authorization': `Bearer ${key}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const ids = (data.data || data.models || []).map(m => m.id || m.model || m.name).filter(Boolean);
        if (ids.length === 0) {
            apiStatus.textContent = '未找到模型';
            return;
        }
        localStorage.setItem('independentApiModels', JSON.stringify(ids));
        populateModelSelect(ids);
        apiStatus.textContent = `成功拉取 ${ids.length} 个模型`;
    } catch (e) {
        apiStatus.textContent = '拉取失败: ' + e.message;
    }
});


// --- 提示词逻辑 ---
const PROMPTS_KEY = 'friendCircleUserPrompts';
let friendCirclePrompts = [];
let selectedPromptIndex = -1;

function loadUserPrompts() {
    const raw = localStorage.getItem(PROMPTS_KEY);
    friendCirclePrompts = raw ? JSON.parse(raw) : [];
    selectedPromptIndex = friendCirclePrompts.findIndex(p => p.selected);
    if (selectedPromptIndex === -1 && friendCirclePrompts.length > 0) {
        selectedPromptIndex = 0;
        friendCirclePrompts[0].selected = true;
    }
}

function renderPromptList() {
    const container = document.getElementById('prompt-list-container');
    container.innerHTML = '';
    friendCirclePrompts.forEach((p, idx) => {
        const div = document.createElement('div');
        div.classList.add('prompt-item');
        div.innerHTML = `
            <div class="prompt-header">
                <input type="radio" name="prompt-selection" ${idx === selectedPromptIndex ? 'checked' : ''} data-index="${idx}">
                <strong class="prompt-name">${p.name || '无名提示词'}</strong>
                <button class="delete-btn" data-type="prompt" data-index="${idx}">❌</button>
            </div>
            <div class="prompt-content hidden">${p.text}</div>
        `;
        container.appendChild(div);
    });
}

document.getElementById('prompt-list-container').addEventListener('click', (e) => {
    const target = e.target;
    if (target.name === 'prompt-selection') {
        selectedPromptIndex = parseInt(target.dataset.index, 10);
        friendCirclePrompts.forEach((p, i) => p.selected = (i === selectedPromptIndex));
        localStorage.setItem(PROMPTS_KEY, JSON.stringify(friendCirclePrompts));
    }
    if (target.classList.contains('delete-btn') && target.dataset.type === 'prompt') {
        e.stopPropagation();
        const idx = parseInt(target.dataset.index, 10);
        friendCirclePrompts.splice(idx, 1);
        if (idx === selectedPromptIndex) {
            selectedPromptIndex = friendCirclePrompts.length > 0 ? 0 : -1;
            if (selectedPromptIndex !== -1) friendCirclePrompts[0].selected = true;
        }
        localStorage.setItem(PROMPTS_KEY, JSON.stringify(friendCirclePrompts));
        renderPromptList();
    }
    if (target.classList.contains('prompt-name')) {
        const content = target.closest('.prompt-item').querySelector('.prompt-content');
        content.classList.toggle('hidden');
    }
});

document.getElementById('add-prompt-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('new-prompt-name-input');
    const textInput = document.getElementById('new-prompt-input');
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!text) return alert('请输入提示词内容');
    const isFirstPrompt = friendCirclePrompts.length === 0;
    friendCirclePrompts.push({ name: name || '无名提示词', text, selected: isFirstPrompt });
    if (isFirstPrompt) selectedPromptIndex = 0;
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(friendCirclePrompts));
    nameInput.value = '';
    textInput.value = '';
    renderPromptList();
});

function getSelectedPrompt() {
    if (selectedPromptIndex > -1 && friendCirclePrompts[selectedPromptIndex]) {
        return friendCirclePrompts[selectedPromptIndex].text;
    }
    return null;
}

// --- 正则逻辑 ---
let regexRules = JSON.parse(localStorage.getItem('regexRules') || '[]');

function renderRegexRules() {
    const list = document.getElementById('regex-list');
    list.innerHTML = '';
    regexRules.forEach((rule, index) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <span><strong>${rule.name || '无名'}</strong></span>
            <button class="delete-btn" data-type="regex" data-index="${index}">删除</button>
        `;
        list.appendChild(div);
    });
}

document.getElementById('regex-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn') && e.target.dataset.type === 'regex') {
        const index = parseInt(e.target.dataset.index, 10);
        if (!isNaN(index)) {
            regexRules.splice(index, 1);
            localStorage.setItem('regexRules', JSON.stringify(regexRules));
            renderRegexRules();
        }
    }
});

document.getElementById('add-regex-btn').addEventListener('click', () => {
    const name = document.getElementById('regex-name-input').value.trim();
    const pattern = document.getElementById('regex-pattern-input').value;
    const replacement = document.getElementById('regex-replacement-input').value;
    if (pattern) {
        regexRules.push({ name, pattern, replacement });
        localStorage.setItem('regexRules', JSON.stringify(regexRules));
        renderRegexRules();
        document.getElementById('regex-name-input').value = '';
        document.getElementById('regex-pattern-input').value = '';
        document.getElementById('regex-replacement-input').value = '';
    }
});

function applyRegex(text) {
    let result = text;
    for (const rule of regexRules) {
        try {
            const regex = new RegExp(rule.pattern, 'g');
            result = result.replace(regex, rule.replacement);
        } catch (e) { console.error('正则错误:', e); }
    }
    return result;
}

// --- 生成逻辑 (流式) ---
let abortController = null;

async function generateFriendCircle() {
    const url = localStorage.getItem('independentApiUrl');
    const key = localStorage.getItem('independentApiKey');
    const model = localStorage.getItem('independentApiModel');
    if (!url || !key || !model) {
        alert('请先配置独立 API 并保存');
        return;
    }

    genBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    outputContainer.innerHTML = '';

    abortController = new AbortController();
    const signal = abortController.signal;

    const systemPrompt = aiIdentityInput.value || "你是HTML生成器。";
    let userPrompt = "";
    const selectedPrompt = getSelectedPrompt();
    if (selectedPrompt) userPrompt += `【生成指导】\n${selectedPrompt}\n\n`;
    
    const chatMessages = await getLastTenMessages();
    if (chatMessages.length > 0) userPrompt += `【参考聊天记录】\n${chatMessages.join('\n')}\n\n`;
    userPrompt += "请根据指导和参考信息生成内容。";

    try {
        const res = await fetch(`${url.replace(/\/$/, '')}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                stream: true,
            }),
            signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullResponse = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.substring(6).trim();
                    if (jsonStr === '[DONE]') continue;
                    try {
                        const chunk = JSON.parse(jsonStr);
                        const content = chunk.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullResponse += content;
                            outputContainer.innerHTML = fullResponse;
                        }
                    } catch (e) { /* 忽略JSON解析错误 */ }
                }
            }
        }
        outputContainer.innerHTML = applyRegex(fullResponse);
    } catch (e) {
        if (e.name === 'AbortError') {
            outputContainer.innerHTML += '<br><small style="color: orange;">生成已由用户停止。</small>';
        } else {
            outputContainer.textContent = '生成失败: ' + e.message;
        }
    } finally {
        genBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    }
}

genBtn.addEventListener('click', generateFriendCircle);
stopBtn.addEventListener('click', () => {
    if (abortController) {
        abortController.abort();
    }
});

// --- 其他逻辑 ---
async function getLastTenMessages() {
    try {
        const context = getContext();
        const count = parseInt(sliderInput.value, 10) || 10;
        return context.chat.slice(-count).map(msg => msg.mes || "").filter(Boolean);
    } catch (e) {
        debugLog('getLastTenMessages 出错', e.message || e);
        return [];
    }
}

function makeBtn(label) {
    const btn = document.createElement('button');
    btn.textContent = label;
    return btn;
}
const injectInputBtn = makeBtn('注入输入栏');
const injectSwipeBtn = makeBtn('注入最近AI消息');
const injectAddSwipeBtn = makeBtn('注入/addswipe');
fixedBtnContainer.append(injectInputBtn, injectSwipeBtn, injectAddSwipeBtn);

injectInputBtn.addEventListener('click', () => {
    if (!outputContainer) return alert('没有生成内容');
    const texts = outputContainer.innerHTML;
    const inputEl = document.getElementById('send_textarea');
    if (inputEl) {
        inputEl.value = texts;
        inputEl.focus();
    } else {
        alert('未找到输入框 send_textarea');
    }
});

injectSwipeBtn.addEventListener('click', () => {
    if (!outputContainer) return alert('没有生成内容');
    const texts = outputContainer.innerHTML;
    if (!texts) return alert('生成内容为空');
    const allMes = Array.from(document.querySelectorAll('.mes'));
    if (allMes.length === 0) return alert('未找到任何消息');
    let aiMes = null;
    for (let i = allMes.length - 1; i >= 0; i--) {
        if (!allMes[i].classList.contains('user')) { aiMes = allMes[i]; break; }
    }
    if (!aiMes) return alert('未找到AI消息');
    const mesTextEl = aiMes.querySelector('.mes_text');
    if (!mesTextEl) return alert('AI消息中未找到 mes_text 元素');
    mesTextEl.innerHTML += texts;
    try { if (window.eventBus?.emit) window.eventBus.emit("SAVE_CHAT"); } catch {}
});

injectAddSwipeBtn.addEventListener('click', () => {
    if (!outputContainer) return alert('没有生成内容');
    const texts = outputContainer.innerHTML;
    if (!texts) return alert('生成内容为空');
    const command = `/addswipe ${texts}`;
    const inputEl = document.getElementById('send_textarea');
    if (!inputEl) return alert('未找到输入框 send_textarea');
    inputEl.value = command;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    const sendBtn = document.getElementById('send_but') || document.querySelector('button');
    if (sendBtn) {
        sendBtn.click();
    } else {
        alert('未找到发送按钮');
    }
});

// --- 初始化 ---
starBtn.addEventListener('click', () => {
    panel.classList.toggle('hidden');
});
loadUserPrompts();
renderPromptList();
renderRegexRules();
