# 无限剧本杀 - v3引擎迁移指南

## 概述

v3引擎是一次彻底重构，解决了v2引擎的架构问题：
- 清晰的状态管理（State/Player/NPCs分离）
- 完整的条件系统（支持标志位、变量、物品、技能、NPC状态等）
- 真正可运作的NPC系统（关系度、情绪、存活状态）
- 可扩展的成就系统
- 标准化的存档格式

## 主要变更

### 1. 引擎类名变更
```javascript
// 旧
new InfiniteFlowGameEnhanced()

// 新
new InfiniteFlowEngine()
```

### 2. 剧本结构标准化

#### 必填字段
```json
{
  "id": "剧本唯一ID",
  "title": "剧本标题",
  "version": "3.0.0",
  "initialEventId": "event-001",
  "events": []
}
```

#### NPC定义（新）
```json
{
  "npcs": [
    {
      "id": "npc-001",
      "name": "NPC名称",
      "role": "角色定位",
      "maxHealth": 100,
      "initialHealth": 100,
      "initialMood": "friendly",
      "initialRelationship": 50,
      "dialogues": {
        "friendly": ["你好！"],
        "angry": ["走开！"]
      }
    }
  ]
}
```

#### 事件结构（新）
```json
{
  "events": [
    {
      "id": "event-001",
      "type": "story",
      "title": "事件标题",
      "text": "事件描述",
      "npcsPresent": ["npc-001"],
      "options": [
        {
          "id": "opt-1",
          "text": "选项文本",
          "conditions": [...],
          "setFlags": [...],
          "modifyVariables": [...],
          "giveItems": [...],
          "modifyNPCs": [...],
          "nextEventId": "event-002"
        }
      ]
    }
  ]
}
```

### 3. 条件系统

v3支持的条件类型：

```json
// 标志位检查
{ "type": "flag", "id": "flag_name", "value": true }

// 变量检查
{ "type": "variable", "id": "var_name", "operator": "gte", "value": 10 }
// operator可选: eq, gt, gte, lt, lte

// 物品检查
{ "type": "item", "id": "item_id", "quantity": 1 }

// 技能检查
{ "type": "skill", "id": "skill_id", "level": 2 }

// NPC存活检查
{ "type": "npc_alive", "npcId": "npc-001", "alive": true }

// NPC关系检查
{ "type": "npc_relationship", "npcId": "npc-001", "min": 50 }

// 访问检查
{ "type": "visited", "eventId": "event-001", "visited": true }
```

### 4. 选项效果

v3支持的选项效果：

```json
{
  "setFlags": [
    { "id": "flag_name", "value": true }
  ],
  "modifyVariables": [
    { "id": "var_name", "operation": "add", "value": 10 }
    // operation可选: add, subtract, set
  ],
  "giveItems": [
    { "id": "item_id", "quantity": 1, "data": {...} }
  ],
  "removeItems": [
    { "id": "item_id", "quantity": 1 }
  ],
  "modifyNPCs": [
    {
      "id": "npc-001",
      "healthDelta": -20,
      "relationshipDelta": 10,
      "mood": "friendly",
      "flag": "helped_player"
    }
  ],
  "giveSkills": [
    { "id": "skill_id", "level": 1 }
  ]
}
```

### 5. 结局系统

```json
{
  "endings": [
    {
      "id": "ending-001",
      "type": "good",  // good/bad/true/hidden/neutral
      "title": "结局标题",
      "description": "结局描述",
      "conditions": [...],
      "achievements": ["ach-001"],
      "rewards": [
        { "type": "skill", "id": "skill_id", "level": 2 },
        { "type": "item", "id": "item_id", "quantity": 1 },
        { "type": "content", "id": "unlock_id" }
      ],
      "epilogue": {
        "text": "后记文本",
        "image": "assets/endings/image.jpg"
      }
    }
  ]
}
```

## API变更

### 初始化游戏
```javascript
// 旧
game.loadScenario(scenarioData);

// 新
game.initGame(scenarioData, playerData);
```

### 获取当前状态
```javascript
// 旧
game.getCurrentEvent();

// 新 - 返回完整状态
game.getCurrentState();
// 返回: { event, options, npcs, items, flags, variables, player }
```

### 做出选择
```javascript
// 相同
game.makeChoice(optionId);

// 新 - 返回更详细的结果
{
  success: true,
  state: {...},
  results: [
    { type: 'flag', id: 'xxx', value: true },
    { type: 'item', id: 'xxx', quantity: 1 },
    { type: 'npc', id: 'xxx', changes: {...} }
  ]
}
```

### 存档/读档
```javascript
// 生成存档数据
const saveData = game.generateSaveData();
// 外部存储到localStorage

// 读档
game.loadSaveData(saveData, scenarioData);
```

## 迁移步骤

1. **更新引擎引用**
   ```html
   <script src="engine-v3.js"></script>
   ```

2. **修改剧本格式**
   - 添加`initialEventId`
   - 将`characters`改为`npcs`
   - 确保事件有`options`数组

3. **更新UI代码**
   - 使用`game.getCurrentState()`获取完整状态
   - 根据`option.available`显示可用性
   - 显示技能加成信息

4. **更新存档逻辑**
   - 使用`generateSaveData()`代替直接访问属性
   - 使用`loadSaveData()`恢复游戏

## 示例：完整游戏流程

```javascript
// 1. 创建引擎实例
const game = new InfiniteFlowEngine();

// 2. 注册回调
game.callbacks.onChoice = ({ event, option, results }) => {
  console.log(`选择了: ${option.text}`);
  results.forEach(r => console.log(`- ${r.type}: ${r.id}`));
};

game.callbacks.onEnding = (ending) => {
  console.log(`触发结局: ${ending.title}`);
};

// 3. 加载剧本
fetch('scenarios/my-scenario.json')
  .then(r => r.json())
  .then(scenario => {
    game.initGame(scenario);
    renderGame();
  });

// 4. 渲染游戏
function renderGame() {
  const state = game.getCurrentState();
  
  // 显示事件文本
  document.getElementById('text').innerHTML = state.event.text;
  
  // 显示选项（带可用性检查）
  state.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.disabled = !opt.available;
    btn.title = opt.unavailableReason || '';
    
    // 显示技能加成
    if (opt.skillBonus.length > 0) {
      btn.textContent += ` [${opt.skillBonus.map(s => s.name).join(', ')}]`;
    }
    
    btn.onclick = () => {
      const result = game.makeChoice(opt.id);
      if (result.success) {
        if (result.isEnding) {
          showEnding(result.ending);
        } else {
          renderGame();
        }
      }
    };
  });
}
```

## 调试工具

```javascript
// 打印引擎状态
game.debug();

// 手动设置标志位
game.setFlag('test_flag', true);

// 手动修改变量
game.setVariable('test_var', 100);

// 获取当前值
console.log(game.getFlag('test_flag'));
console.log(game.getVariable('test_var', 0));
console.log(game.getSkillLevel('skill_id'));
```

## 注意事项

1. v3引擎与v2剧本**不兼容**，需要转换
2. NPC关系系统现在真正影响游戏（通过条件检查）
3. 存档格式变更，旧存档需要迁移脚本转换
4. 建议先使用`scenario-template-v3.json`作为起点

## 完整示例

参见 `templates/scenario-template-v3.json`