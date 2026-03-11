/**
 * 无限剧本杀 - 重构版游戏引擎 v3.0
 * 设计原则：清晰的数据结构、完整的功能实现、可扩展的架构
 */

class InfiniteFlowEngine {
    constructor() {
        // 游戏状态（与剧本无关的核心状态）
        this.state = {
            currentEventId: null,
            history: [],           // 选择历史
            flags: new Map(),      // 剧情标志位（如"met_nightengale": true）
            variables: new Map(),  // 数值变量（如"trust_npc001": 80）
            visitedEvents: new Set(),
            startTime: null,
            lastSaveTime: null
        };

        // 玩家数据（跨剧本继承）
        this.player = {
            id: null,              // 玩家ID
            name: '无名玩家',
            skills: new Map(),     // 技能等级 Map<skillId, level>
            achievements: new Set(), // 已解锁成就
            totalPlayTime: 0,      // 总游戏时长（分钟）
            completedScenarios: new Set(), // 已完成剧本
            unlockedContent: new Set()     // 解锁的额外内容
        };

        // 当前剧本数据
        this.scenario = null;
        
        // 运行时NPC状态（基于剧本模板生成实例）
        this.npcs = new Map();
        
        // 运行时物品状态
        this.inventory = new Map(); // Map<itemId, {data, quantity}>
        
        // 系统配置
        this.config = {
            autoSave: true,
            autoSaveInterval: 5,   // 每5个选择自动存档
            difficulty: 'normal'   // easy/normal/hard
        };

        // 回调函数（供UI层注册）
        this.callbacks = {
            onEventChange: null,    // 事件切换时
            onChoice: null,         // 做出选择时
            onNPCChange: null,      // NPC状态变化时
            onItemGet: null,        // 获得物品时
            onFlagSet: null,        // 设置标志位时
            onEnding: null,         // 触发结局时
            onAchievement: null     // 解锁成就时
        };
    }

    // ==================== 核心生命周期 ====================

    /**
     * 初始化新游戏
     */
    initGame(scenarioData, playerData = null) {
        // 加载剧本
        this.scenario = this.validateScenario(scenarioData);
        if (!this.scenario) {
            throw new Error('剧本数据无效');
        }

        // 加载或创建玩家
        if (playerData) {
            this.loadPlayer(playerData);
        } else {
            this.createNewPlayer();
        }

        // 初始化游戏状态
        this.state.currentEventId = this.scenario.initialEventId;
        this.state.history = [];
        this.state.flags = new Map();
        this.state.variables = new Map();
        this.state.visitedEvents = new Set();
        this.state.startTime = Date.now();
        this.state.lastSaveTime = Date.now();

        // 初始化NPC实例
        this.initNPCs();

        // 初始化物品
        this.inventory = new Map();
        if (this.scenario.initialItems) {
            this.scenario.initialItems.forEach(item => {
                this.addItem(item.id, item.quantity || 1);
            });
        }

        // 设置初始标志位
        this.setFlag('game_started', true);

        console.log(`[引擎] 游戏初始化完成: ${this.scenario.title}`);
        return this.getCurrentState();
    }

    /**
     * 验证剧本格式
     */
    validateScenario(data) {
        if (!data) return null;

        const required = ['id', 'title', 'version', 'events'];
        for (const field of required) {
            if (!data[field]) {
                console.error(`[引擎] 剧本缺少必填字段: ${field}`);
                return null;
            }
        }

        // 验证事件
        if (!Array.isArray(data.events) || data.events.length === 0) {
            console.error('[引擎] 剧本事件数组为空');
            return null;
        }

        // 设置默认初始事件
        if (!data.initialEventId && data.events[0]) {
            data.initialEventId = data.events[0].id;
        }

        return data;
    }

    /**
     * 创建新玩家
     */
    createNewPlayer(name = '无名玩家') {
        this.player = {
            id: this.generateId(),
            name: name,
            skills: new Map(),
            achievements: new Set(),
            totalPlayTime: 0,
            completedScenarios: new Set(),
            unlockedContent: new Set(),
            createdAt: Date.now()
        };
    }

    /**
     * 加载玩家数据
     */
    loadPlayer(data) {
        this.player = {
            id: data.id || this.generateId(),
            name: data.name || '无名玩家',
            skills: new Map(data.skills || []),
            achievements: new Set(data.achievements || []),
            totalPlayTime: data.totalPlayTime || 0,
            completedScenarios: new Set(data.completedScenarios || []),
            unlockedContent: new Set(data.unlockedContent || []),
            createdAt: data.createdAt || Date.now()
        };
    }

    /**
     * 初始化NPC实例
     */
    initNPCs() {
        this.npcs = new Map();
        
        if (!this.scenario.npcs) return;

        this.scenario.npcs.forEach(npcTemplate => {
            const npc = {
                ...npcTemplate,
                instanceId: this.generateId(),
                health: npcTemplate.maxHealth || 100,
                currentMood: npcTemplate.initialMood || 'neutral',
                relationship: npcTemplate.initialRelationship || 0,
                flags: new Set(),
                location: npcTemplate.initialLocation || null,
                isAlive: true,
                metPlayer: false,
                dialogueHistory: []
            };
            this.npcs.set(npc.id, npc);
        });
    }

    // ==================== 核心游戏逻辑 ====================

    /**
     * 获取当前事件（处理条件分支）
     */
    getCurrentEvent() {
        if (!this.scenario || !this.state.currentEventId) {
            return null;
        }

        const event = this.scenario.events.find(e => e.id === this.state.currentEventId);
        if (!event) {
            console.error(`[引擎] 找不到事件: ${this.state.currentEventId}`);
            return null;
        }

        // 处理条件分支事件
        if (event.conditionalBranches) {
            for (const branch of event.conditionalBranches) {
                if (this.checkConditions(branch.conditions)) {
                    // 返回分支覆盖后的事件
                    return { ...event, ...branch.override };
                }
            }
        }

        return event;
    }

    /**
     * 获取有效选项（过滤掉不满足条件的）
     */
    getAvailableOptions() {
        const event = this.getCurrentEvent();
        if (!event || !event.options) return [];

        return event.options.map(option => {
            const available = this.checkOptionAvailability(option);
            return {
                ...option,
                available: available.available,
                unavailableReason: available.reason,
                skillBonus: this.calculateSkillBonus(option)
            };
        });
    }

    /**
     * 检查选项是否可用
     */
    checkOptionAvailability(option) {
        // 检查前提条件
        if (option.conditions) {
            const result = this.checkConditions(option.conditions);
            if (!result.passed) {
                return { available: false, reason: result.reason };
            }
        }

        // 检查需要物品
        if (option.requiredItems) {
            for (const itemReq of option.requiredItems) {
                const hasItem = this.hasItem(itemReq.id, itemReq.quantity || 1);
                if (!hasItem) {
                    return { 
                        available: false, 
                        reason: `需要物品: ${itemReq.name || itemReq.id}` 
                    };
                }
            }
        }

        // 检查需要技能
        if (option.requiredSkills) {
            for (const skillReq of option.requiredSkills) {
                const level = this.getSkillLevel(skillReq.id);
                if (level < (skillReq.level || 1)) {
                    return { 
                        available: false, 
                        reason: `需要技能: ${skillReq.name || skillReq.id} Lv.${skillReq.level || 1}` 
                    };
                }
            }
        }

        // 检查NPC状态
        if (option.requiredNPCState) {
            const npc = this.npcs.get(option.requiredNPCState.npcId);
            if (!npc) {
                return { available: false, reason: 'NPC不存在' };
            }
            if (option.requiredNPCState.alive !== undefined && npc.isAlive !== option.requiredNPCState.alive) {
                return { available: false, reason: 'NPC状态不符合' };
            }
            if (option.requiredNPCState.minRelationship && npc.relationship < option.requiredNPCState.minRelationship) {
                return { available: false, reason: `需要与${npc.name}的关系达到${option.requiredNPCState.minRelationship}` };
            }
        }

        return { available: true, reason: null };
    }

    /**
     * 做出选择
     */
    makeChoice(optionId) {
        const event = this.getCurrentEvent();
        const option = event.options.find(o => o.id === optionId);

        if (!option) {
            return { success: false, error: '选项不存在' };
        }

        // 检查是否可用
        const availability = this.checkOptionAvailability(option);
        if (!availability.available) {
            return { success: false, error: availability.unavailableReason };
        }

        // 记录历史
        this.state.history.push({
            eventId: event.id,
            optionId: optionId,
            timestamp: Date.now()
        });

        // 标记访问
        this.state.visitedEvents.add(event.id);

        // 执行选项效果
        const results = this.executeOptionEffects(option);

        // 触发回调
        if (this.callbacks.onChoice) {
            this.callbacks.onChoice({
                event: event,
                option: option,
                results: results
            });
        }

        // 检查自动存档
        if (this.config.autoSave && this.state.history.length % this.config.autoSaveInterval === 0) {
            this.autoSave();
        }

        // 检查结局
        const ending = this.checkEnding();
        if (ending) {
            return this.triggerEnding(ending);
        }

        // 转移到下一事件
        if (option.nextEventId) {
            this.state.currentEventId = option.nextEventId;
        }

        return {
            success: true,
            state: this.getCurrentState(),
            results: results
        };
    }

    /**
     * 执行选项效果
     */
    executeOptionEffects(option) {
        const results = [];

        // 设置标志位
        if (option.setFlags) {
            option.setFlags.forEach(flag => {
                this.setFlag(flag.id, flag.value !== undefined ? flag.value : true);
                results.push({ type: 'flag', id: flag.id, value: flag.value });
            });
        }

        // 修改变量
        if (option.modifyVariables) {
            option.modifyVariables.forEach(mod => {
                const oldValue = this.getVariable(mod.id, 0);
                const newValue = mod.operation === 'add' 
                    ? oldValue + mod.value 
                    : mod.operation === 'subtract'
                    ? oldValue - mod.value
                    : mod.value;
                this.setVariable(mod.id, newValue);
                results.push({ type: 'variable', id: mod.id, oldValue, newValue });
            });
        }

        // 获得物品
        if (option.giveItems) {
            option.giveItems.forEach(item => {
                this.addItem(item.id, item.quantity || 1, item.data);
                results.push({ type: 'item', id: item.id, quantity: item.quantity || 1 });
            });
        }

        // 失去物品
        if (option.removeItems) {
            option.removeItems.forEach(item => {
                this.removeItem(item.id, item.quantity || 1);
                results.push({ type: 'item_remove', id: item.id, quantity: item.quantity || 1 });
            });
        }

        // 修改NPC
        if (option.modifyNPCs) {
            option.modifyNPCs.forEach(mod => {
                const npc = this.npcs.get(mod.id);
                if (npc) {
                    if (mod.health !== undefined) npc.health = Math.max(0, mod.health);
                    if (mod.healthDelta !== undefined) {
                        npc.health = Math.max(0, npc.health + mod.healthDelta);
                        if (npc.health <= 0) npc.isAlive = false;
                    }
                    if (mod.relationship !== undefined) npc.relationship = mod.relationship;
                    if (mod.relationshipDelta !== undefined) npc.relationship += mod.relationshipDelta;
                    if (mod.mood !== undefined) npc.currentMood = mod.mood;
                    if (mod.flag) npc.flags.add(mod.flag);
                    npc.metPlayer = true;
                    results.push({ type: 'npc', id: mod.id, changes: mod });
                }
            });
        }

        // 获得技能/提升技能
        if (option.giveSkills) {
            option.giveSkills.forEach(skill => {
                const currentLevel = this.getSkillLevel(skill.id);
                const newLevel = Math.max(currentLevel, skill.level || 1);
                this.player.skills.set(skill.id, newLevel);
                results.push({ type: 'skill', id: skill.id, level: newLevel });
            });
        }

        // 触发事件
        if (option.triggerEvents) {
            option.triggerEvents.forEach(event => {
                // 可以触发额外的事件效果
                results.push({ type: 'event_trigger', eventId: event.id });
            });
        }

        return results;
    }

    // ==================== 条件系统 ====================

    /**
     * 检查条件组
     */
    checkConditions(conditions) {
        if (!conditions) return { passed: true };

        for (const condition of conditions) {
            const result = this.checkSingleCondition(condition);
            if (!result.passed) {
                return result;
            }
        }

        return { passed: true };
    }

    /**
     * 检查单个条件
     */
    checkSingleCondition(condition) {
        switch (condition.type) {
            case 'flag':
                const flagValue = this.getFlag(condition.id);
                const expectedValue = condition.value !== undefined ? condition.value : true;
                return {
                    passed: flagValue === expectedValue,
                    reason: flagValue ? null : `需要满足条件: ${condition.id}`
                };

            case 'variable':
                const varValue = this.getVariable(condition.id, 0);
                let varPassed = false;
                switch (condition.operator) {
                    case 'eq': varPassed = varValue === condition.value; break;
                    case 'gt': varPassed = varValue > condition.value; break;
                    case 'gte': varPassed = varValue >= condition.value; break;
                    case 'lt': varPassed = varValue < condition.value; break;
                    case 'lte': varPassed = varValue <= condition.value; break;
                    default: varPassed = varValue === condition.value;
                }
                return {
                    passed: varPassed,
                    reason: varPassed ? null : `${condition.id} 数值不满足条件`
                };

            case 'item':
                const hasItem = this.hasItem(condition.id, condition.quantity || 1);
                return {
                    passed: hasItem,
                    reason: hasItem ? null : `需要物品: ${condition.id}`
                };

            case 'skill':
                const skillLevel = this.getSkillLevel(condition.id);
                return {
                    passed: skillLevel >= (condition.level || 1),
                    reason: skillLevel >= (condition.level || 1) ? null : `需要技能: ${condition.id} Lv.${condition.level || 1}`
                };

            case 'npc_alive':
                const npc = this.npcs.get(condition.npcId);
                const alive = npc ? npc.isAlive === condition.alive : false;
                return {
                    passed: alive,
                    reason: alive ? null : `NPC状态不符合: ${condition.npcId}`
                };

            case 'npc_relationship':
                const npcRel = this.npcs.get(condition.npcId);
                const relValue = npcRel ? npcRel.relationship : 0;
                return {
                    passed: relValue >= (condition.min || 0),
                    reason: relValue >= (condition.min || 0) ? null : `关系值不足`
                };

            case 'visited':
                const visited = this.state.visitedEvents.has(condition.eventId);
                return {
                    passed: visited === condition.visited,
                    reason: null
                };

            default:
                console.warn(`[引擎] 未知条件类型: ${condition.type}`);
                return { passed: true };
        }
    }

    // ==================== 结局系统 ====================

    /**
     * 检查是否触发结局
     */
    checkEnding() {
        if (!this.scenario.endings) return null;

        // 按优先级排序：true > hidden > good > neutral > bad
        const priority = { 'true': 5, 'hidden': 4, 'good': 3, 'neutral': 2, 'bad': 1 };
        const sortedEndings = [...this.scenario.endings].sort((a, b) => 
            (priority[b.type] || 0) - (priority[a.type] || 0)
        );

        for (const ending of sortedEndings) {
            if (this.checkEndingConditions(ending)) {
                return ending;
            }
        }

        return null;
    }

    /**
     * 检查结局条件
     */
    checkEndingConditions(ending) {
        if (!ending.conditions || ending.conditions.length === 0) {
            // 如果没有条件，检查是否是强制触发（比如死亡）
            return ending.forceTrigger || false;
        }

        return this.checkConditions(ending.conditions).passed;
    }

    /**
     * 触发结局
     */
    triggerEnding(ending) {
        // 解锁成就
        if (ending.achievements) {
            ending.achievements.forEach(achId => {
                this.unlockAchievement(achId);
            });
        }

        // 给予奖励
        if (ending.rewards) {
            ending.rewards.forEach(reward => {
                if (reward.type === 'skill') {
                    this.player.skills.set(reward.id, reward.level || 1);
                } else if (reward.type === 'item') {
                    this.addItem(reward.id, reward.quantity || 1);
                } else if (reward.type === 'content') {
                    this.player.unlockedContent.add(reward.id);
                }
            });
        }

        // 标记完成剧本
        this.player.completedScenarios.add(this.scenario.id);

        // 累计游戏时间
        const playTime = Math.floor((Date.now() - this.state.startTime) / 60000);
        this.player.totalPlayTime += playTime;

        // 回调
        if (this.callbacks.onEnding) {
            this.callbacks.onEnding(ending);
        }

        return {
            success: true,
            isEnding: true,
            ending: ending,
            state: this.getCurrentState()
        };
    }

    // ==================== 技能系统 ====================

    /**
     * 获取技能等级
     */
    getSkillLevel(skillId) {
        return this.player.skills.get(skillId) || 0;
    }

    /**
     * 计算技能加成
     */
    calculateSkillBonus(option) {
        if (!option.skillBonuses) return [];

        const bonuses = [];
        option.skillBonuses.forEach(bonus => {
            const level = this.getSkillLevel(bonus.skillId);
            if (level >= (bonus.minLevel || 1)) {
                bonuses.push({
                    skillId: bonus.skillId,
                    name: bonus.name || bonus.skillId,
                    effect: bonus.effect,
                    value: bonus.value || 0
                });
            }
        });

        return bonuses;
    }

    // ==================== 物品系统 ====================

    /**
     * 添加物品
     */
    addItem(itemId, quantity = 1, data = null) {
        const existing = this.inventory.get(itemId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.inventory.set(itemId, {
                id: itemId,
                quantity: quantity,
                data: data,
                acquiredAt: Date.now()
            });
        }

        if (this.callbacks.onItemGet) {
            this.callbacks.onItemGet({ id: itemId, quantity: quantity });
        }
    }

    /**
     * 移除物品
     */
    removeItem(itemId, quantity = 1) {
        const existing = this.inventory.get(itemId);
        if (!existing) return false;

        existing.quantity -= quantity;
        if (existing.quantity <= 0) {
            this.inventory.delete(itemId);
        }
        return true;
    }

    /**
     * 检查是否有物品
     */
    hasItem(itemId, quantity = 1) {
        const item = this.inventory.get(itemId);
        return item && item.quantity >= quantity;
    }

    /**
     * 获取物品列表
     */
    getItems() {
        return Array.from(this.inventory.values());
    }

    // ==================== 标志位/变量系统 ====================

    setFlag(id, value = true) {
        this.state.flags.set(id, value);
        if (this.callbacks.onFlagSet) {
            this.callbacks.onFlagSet({ id, value });
        }
    }

    getFlag(id, defaultValue = false) {
        return this.state.flags.has(id) ? this.state.flags.get(id) : defaultValue;
    }

    setVariable(id, value) {
        this.state.variables.set(id, value);
    }

    getVariable(id, defaultValue = 0) {
        return this.state.variables.has(id) ? this.state.variables.get(id) : defaultValue;
    }

    // ==================== 成就系统 ====================

    unlockAchievement(achievementId) {
        if (this.player.achievements.has(achievementId)) return;

        this.player.achievements.add(achievementId);
        
        const achievement = this.scenario.achievements?.find(a => a.id === achievementId);
        if (this.callbacks.onAchievement) {
            this.callbacks.onAchievement({
                id: achievementId,
                ...achievement
            });
        }
    }

    // ==================== 存档系统 ====================

    /**
     * 生成存档数据
     */
    generateSaveData() {
        return {
            version: '3.0',
            timestamp: Date.now(),
            scenario: {
                id: this.scenario.id,
                version: this.scenario.version
            },
            state: {
                currentEventId: this.state.currentEventId,
                history: this.state.history,
                flags: Array.from(this.state.flags.entries()),
                variables: Array.from(this.state.variables.entries()),
                visitedEvents: Array.from(this.state.visitedEvents),
                startTime: this.state.startTime
            },
            player: {
                id: this.player.id,
                name: this.player.name,
                skills: Array.from(this.player.skills.entries()),
                achievements: Array.from(this.player.achievements),
                totalPlayTime: this.player.totalPlayTime,
                completedScenarios: Array.from(this.player.completedScenarios),
                unlockedContent: Array.from(this.player.unlockedContent)
            },
            npcs: Array.from(this.npcs.entries()).map(([id, npc]) => ({
                id,
                health: npc.health,
                isAlive: npc.isAlive,
                relationship: npc.relationship,
                currentMood: npc.currentMood,
                flags: Array.from(npc.flags),
                metPlayer: npc.metPlayer
            })),
            inventory: Array.from(this.inventory.entries())
        };
    }

    /**
     * 从存档数据恢复
     */
    loadSaveData(saveData, scenarioData) {
        // 加载剧本
        this.scenario = this.validateScenario(scenarioData);
        if (!this.scenario) return false;

        // 恢复状态
        this.state.currentEventId = saveData.state.currentEventId;
        this.state.history = saveData.state.history || [];
        this.state.flags = new Map(saveData.state.flags || []);
        this.state.variables = new Map(saveData.state.variables || []);
        this.state.visitedEvents = new Set(saveData.state.visitedEvents || []);
        this.state.startTime = saveData.state.startTime || Date.now();

        // 恢复玩家
        this.player = {
            id: saveData.player.id,
            name: saveData.player.name,
            skills: new Map(saveData.player.skills || []),
            achievements: new Set(saveData.player.achievements || []),
            totalPlayTime: saveData.player.totalPlayTime || 0,
            completedScenarios: new Set(saveData.player.completedScenarios || []),
            unlockedContent: new Set(saveData.player.unlockedContent || []),
            createdAt: saveData.player.createdAt || Date.now()
        };

        // 重新初始化NPC然后恢复状态
        this.initNPCs();
        if (saveData.npcs) {
            saveData.npcs.forEach(savedNpc => {
                const npc = this.npcs.get(savedNpc.id);
                if (npc) {
                    npc.health = savedNpc.health;
                    npc.isAlive = savedNpc.isAlive;
                    npc.relationship = savedNpc.relationship;
                    npc.currentMood = savedNpc.currentMood;
                    npc.flags = new Set(savedNpc.flags || []);
                    npc.metPlayer = savedNpc.metPlayer;
                }
            });
        }

        // 恢复物品
        this.inventory = new Map(saveData.inventory || []);

        return true;
    }

    autoSave() {
        this.state.lastSaveTime = Date.now();
        // 实际的存储逻辑由外部处理
        return this.generateSaveData();
    }

    // ==================== 工具方法 ====================

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentState() {
        return {
            event: this.getCurrentEvent(),
            options: this.getAvailableOptions(),
            npcs: Array.from(this.npcs.values()).filter(n => n.metPlayer || !n.isAlive),
            items: this.getItems(),
            flags: Array.from(this.state.flags.entries()),
            variables: Array.from(this.state.variables.entries()),
            player: {
                name: this.player.name,
                skills: Array.from(this.player.skills.entries()),
                achievements: Array.from(this.player.achievements)
            }
        };
    }

    // ==================== 调试工具 ====================

    debug() {
        console.log('=== 引擎调试信息 ===');
        console.log('当前事件:', this.state.currentEventId);
        console.log('已访问事件数:', this.state.visitedEvents.size);
        console.log('历史记录数:', this.state.history.length);
        console.log('NPC数量:', this.npcs.size);
        console.log('物品数量:', this.inventory.size);
        console.log('标志位:', Array.from(this.state.flags.entries()));
        console.log('变量:', Array.from(this.state.variables.entries()));
        console.log('===================');
    }
}

// 导出到全局
window.InfiniteFlowEngine = InfiniteFlowEngine;