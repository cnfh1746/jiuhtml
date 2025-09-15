// You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { getContext } from "../../../extensions.js";

// ----------------- 初始化 -----------------
const starBtn = document.createElement('button');
starBtn.id = 'friend-circle-btn';
starBtn.textContent = '🌟';
document.body.appendChild(starBtn);

const panel = document.createElement('div');
panel.id = 'friend-circle-panel';
panel.className = 'friend-circle-panel hidden';
document.body.appendChild(panel);

// --- 创建核心布局容器 ---
const panelContent = document.createElement('div');
panelContent.id = 'panel-content';
panel.appendChild(panelContent);

const fixedBtnContainer = document.createElement('div');
fixedBtnContainer.id = 'fixed-btn-container';
panel.appendChild(fixedBtnContainer);

// ----------------- 动态创建所有UI元素 -----------------
panelContent.innerHTML = `
    <button id="toggle-panel-btn">切换大面板</button>
    <div id="slider-container">
        <span>读取聊天条数: </span>
        <input type="range" id="chat-count-slider" min="0" max="20">
        <span id="chat-count-value">10</span>
    </div>
    <div id="friend-circle-debug"></div>

    <button class="collapsible-btn" data-target="api-module">⚙️ API设置</button>
    <div id="api-module" class="collapsible-content">
        <label>API URL: <input type="text" id="api-url-input"></label>
        <label>API Key: <input type="text" id="api-key-input"></label>
        <label>模型: <select id="api-model-select"></select></label>
        <button id="api-refresh-models-btn">刷新</button>
        <button id="api-save-btn">保存配置</button>
        <button id="api-test-btn">测试连接</button>
        <div id="api-status"></div>
    </div>

    <button class="collapsible-btn" data-target="user-prompt-module">🖊️ 提示词管理</button>
    <div id="user-prompt-module" class="collapsible-content">
        <input type="text" id="new-prompt-name-input" placeholder="提示词名称">
        <textarea id="new-prompt-input" placeholder="输入自定义提示词"></textarea>
        <button id="add-prompt-btn">添加</button>
        <div id="prompt-list-container"></div>
    </div>

    <div id="identity-module">
        <h4>AI身份设定</h4>
        <textarea id="ai-identity-input" placeholder="在这里设定AI的身份和行为准则..."></textarea>
    </div>

    <button class="collapsible-btn" data-target="regex-module">📜 正则替换规则</button>
    <div id="regex-module" class="collapsible-content">
        <div id="regex-list"></div>
        <input type="text" id="regex-name-input" placeholder="规则名称">
        <input type="text" id="regex-pattern-input" placeholder="查找正则表达式">
        <textarea id="regex-replacement-input" placeholder="替换为"></textarea>
        <button id="add-regex-btn">添加规则</button>
    </div>

    <div id="friend-circle-output"></div>
    <button id="gen-btn">生成</button>
`;

fixedBtnContainer.innerHTML = `
    <button id="inject-input-btn">注入输入栏</button>
    <button id="inject-swipe-btn">注入最近AI消息</button>
    <button id="inject-addswipe-btn">注入/addswipe</button>
`;

// ----------------- 获取所有元素引用 -----------------
const togglePanelBtn = document.getElementById('toggle-panel-btn');
const sliderInput = document.getElementById('chat-count-slider');
const sliderValue = document.getElementById('chat-count-value');
const debugContainer = document.getElementById('friend-circle-debug');
const outputContainer = document.getElementById('friend-circle-output');
const genBtn = document.getElementById('gen-btn');
const aiIdentityInput = document.getElementById('ai-identity-input');

// ----------------- 功能逻辑 -----------------

function debugLog(step, data) {
    const msg = `[朋友圈调试] ${step} ${data ? JSON.stringify(data, null, 2) : ''}`;
    console.log(msg);
    const line = document.createElement('div');
    line.textContent = msg;
    debugContainer.appendChild(line);
    debugContainer.scrollTop = debugContainer.scrollHeight;
}

// --- 持久化设置 ---
aiIdentityInput.value = localStorage.getItem('aiIdentity') || '';
aiIdentityInput.addEventListener('input', () => localStorage.setItem('aiIdentity', aiIdentityInput.value));

sliderInput.value = localStorage.getItem('chatCount') || '10';
sliderValue.textContent = sliderInput.value;
sliderInput.addEventListener('input', () => {
    sliderValue.textContent = sliderInput.value;
    localStorage.setItem('chatCount', sliderInput.value);
});

// --- 模块折叠 ---
document.querySelectorAll('.collapsible-btn').forEach(button => {
    const content = document.getElementById(button.dataset.target);
    content.style.display = 'none'; // Default to collapsed
    button.addEventListener('click', () => {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
    });
});

// --- 提示词逻辑 ---
const PROMPTS_KEY = 'friendCircleUserPrompts';
let friendCirclePrompts = JSON.parse(localStorage.getItem(PROMPTS_KEY) || '[]');
let selectedPromptIndex = friendCirclePrompts.findIndex(p => p.selected);
if (selectedPromptIndex === -1 && friendCirclePrompts.length > 0) {
    selectedPromptIndex = 0;
    friendCirclePrompts[0].selected = true;
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
    } else if (target.classList.contains('delete-btn')) {
        e.stopPropagation();
        const idx = parseInt(target.dataset.index, 10);
        friendCirclePrompts.splice(idx, 1);
        if (idx === selectedPromptIndex) {
            selectedPromptIndex = friendCirclePrompts.length > 0 ? 0 : -1;
            if (selectedPromptIndex !== -1) friendCirclePrompts[0].selected = true;
        }
        localStorage.setItem(PROMPTS_KEY, JSON.stringify(friendCirclePrompts));
        renderPromptList();
    } else if (target.classList.contains('prompt-name')) {
        const content = target.closest('.prompt-item').querySelector('.prompt-content');
        content.classList.toggle('hidden');
    }
});

document.getElementById('add-prompt-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('new-prompt-name-input');
    const textInput = document.getElementById('new-prompt-input');
    if (!textInput.value.trim()) return alert('请输入提示词内容');
    friendCirclePrompts.push({
        name: nameInput.value.trim() || '无名提示词',
        text: textInput.value.trim(),
        selected: selectedPromptIndex === -1
    });
    if (selectedPromptIndex === -1) selectedPromptIndex = 0;
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(friendCirclePrompts));
    nameInput.value = '';
    textInput.value = '';
    renderPromptList();
});

function getSelectedPrompt() {
    return (selectedPromptIndex > -1 && friendCirclePrompts[selectedPromptIndex]) ? friendCirclePrompts[selectedPromptIndex].text : null;
}

// --- 正则逻辑 ---
let regexRules = JSON.parse(localStorage.getItem('regexRules') || '[]');
// ... (rest of regex logic is similar and assumed correct for now)

// --- 生成逻辑 (流式) ---
async function generateFriendCircle() {
    const url = localStorage.getItem('independentApiUrl');
    const key = localStorage.getItem('independentApiKey');
    const model = localStorage.getItem('independentApiModel');
    if (!url || !key || !model) {
        alert('请先配置独立 API 并保存');
        return;
    }
    genBtn.disabled = true;
    genBtn.textContent = '生成中...';
    outputContainer.innerHTML = '';

    const systemPrompt = aiIdentityInput.value || "你是HTML生成器。";
    let userPrompt = "";
    const selectedPrompt = getSelectedPrompt();
    if (selectedPrompt) userPrompt += `【生成指导】\n${selectedPrompt}\n\n`;
    
    try {
        const chatMessages = await getLastTenMessages();
        if (chatMessages.length > 0) userPrompt += `【参考聊天记录】\n${chatMessages.join('\n')}\n\n`;
        userPrompt += "请根据指导和参考信息生成内容。";

        const res = await fetch(`${url.replace(/\/$/, '')}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                stream: true,
            })
        });

        if (!res.ok) throw new Error(`API请求失败: ${res.status} ${res.statusText}`);
        
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
        // outputContainer.innerHTML = applyRegex(fullResponse); // Apply regex at the end
    } catch (e) {
        outputContainer.textContent = '生成失败: ' + e.message;
        debugLog('生成失败', e.stack);
    } finally {
        genBtn.disabled = false;
        genBtn.textContent = '生成';
    }
}

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

// --- 初始化 ---
starBtn.addEventListener('click', () => panel.classList.toggle('hidden'));
togglePanelBtn.addEventListener('click', () => {
    panel.classList.toggle('large-mode');
    togglePanelBtn.textContent = panel.classList.contains('large-mode') ? '切换小面板' : '切换大面板';
});
genBtn.addEventListener('click', generateFriendCircle);
loadUserPrompts();
renderPromptList();
// renderRegexRules(); // Will add back with full logic
