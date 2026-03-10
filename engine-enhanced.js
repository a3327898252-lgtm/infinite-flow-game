/**
 * 无限剧本杀 - 增强版游戏引擎
 * 版本: 2.0
 * 新增功能: NPC系统、资源管理、技能成长、成就系统、随机事件
 */

class InfiniteFlowGameEnhanced {
    constructor() {
        this.currentScenario = null;
        this.currentEvent = null;
        this.player = {
            skills: [],
            inventory: [],
            health: 100,
            stamina: 100,           // 体力
            sanity: 100,            // 理智（恐怖剧本专用）
            completedQuests: [],
            achievements: [],       // 成就系统
            totalPlayTime: 0,       // 总游戏时间
            deaths: 0               // 死亡次数
        };
        this.gameState = {
            currentEventId: null,
            history: [],
            deaths: [],
            visitedEvents: new Set(),
            playTime: 0,            // 本次游戏时长
            randomEventsTriggered: new Set()  // 已触发的随机事件
        };
        this.npcs = {};             // NPC 动态状态
        this.achievements = [];     // 成就定义
        this.resources = {          // 资源系统
            food: 3,
            water: 3,
            medical: 2,
            ammo: 0
        };
    }

    /**
     * 加载剧本
     */
    loadScenario(scenario) {
        this.currentScenario = scenario;
        this.currentEvent = scenario.events.find(e => e.id === 'event-001');
        this.gameState.currentEventId = 'event-001';
        this.gameState.history = [];
        this.gameState.deaths = [];
        this.gameState.visitedEvents = new Set();
        this.gameState.playTime = 0;
        this.gameState.randomEventsTriggered = new Set();

        // 初始化玩家状态
        this.player.health = 100;
        this.player.stamina = 100;
        this.player.sanity = 100;
        this.player.inventory = [];
        this.player.completedQuests = [];
        this.player.deaths = 0;

        // 初始化资源
        this.resources = {
            food: 3,
            water: 3,
            medical: 2,
            ammo: 0
        };

        // 初始化 NPC 状态
        this.npcs = {};
        scenario.characters.forEach(char => {
            if (char.type !== 'player') {
                this.npcs[char.id] = {
                    ...char,
                    health: 100,
                    alive: true,
                    trust: char.relationships?.player || 50,  // 默认信任度 50
                    mood: 'normal'  // normal/happy/angry/scared
                };
            }
        });

        // 初始化成就
        this.achievements = [
            { id: 'ach-001', title: '初次冒险', description: '完成第一个事件', completed: false },
            { id: 'ach-002', title: '生存专家', description: '存活超过 10 个事件', completed: false },
            { id: 'ach-003', title: '完美主义者', description: '获得真结局', completed: false },
            { id: 'ach-004', title: '收藏家', description: '收集 10 个物品', completed: false },
            { id: 'ach-005', title: '技能大师', description: '学会 5 个技能', completed: false }
        ];

        console.log(`✅ 剧本加载成功: ${scenario.title}`);
        console.log(`📊 难度: ${scenario.difficulty} | 预计时长: ${scenario.estimatedPlaytime}分钟`);
        return this.currentEvent;
    }

    /**
     * 获取当前事件
     */
    getCurrentEvent() {
        if (!this.currentScenario) {
            throw new Error('未加载剧本');
        }
        return this.currentScenario.events.find(e => e.id === this.gameState.currentEventId);
    }

    /**
     * 检查是否触发随机事件
     */
    checkRandomEvent() {
        // 20% 概率触发随机事件
        if (Math.random() > 0.8) {
            const randomEvents = this.currentScenario.randomEvents || [];
            if (randomEvents.length > 0) {
                // 选择一个未触发的随机事件
                const availableEvents = randomEvents.filter(
                    e => !this.gameState.randomEventsTriggered.has(e.id)
                );

                if (availableEvents.length > 0) {
                    const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
                    this.gameState.randomEventsTriggered.add(randomEvent.id);
                    return randomEvent;
                }
            }
        }
        return null;
    }

    /**
     * 玩家做出选择
     */
    makeChoice(optionId) {
        const currentEvent = this.getCurrentEvent();
        const option = currentEvent.options.find(opt => opt.id === optionId);

        if (!option) {
            throw new Error(`无效的选项: ${optionId}`);
        }

        // 检查选项要求
        if (option.requirements) {
            const checkResult = this.checkRequirements(option.requirements);
            if (!checkResult.passed) {
                return {
                    type: 'requirement_failed',
                    message: checkResult.message
                };
            }
        }

        // 记录历史
        this.gameState.history.push({
            eventId: currentEvent.id,
            optionId: optionId,
            timestamp: Date.now()
        });

        // 标记已访问的事件
        this.gameState.visitedEvents.add(currentEvent.id);

        // 消耗资源
        this.consumeResources(option);

        // 检查 NPC 状态变化
        this.updateNPCs(option);

        // 检查技能加成
        const skillBonus = this.applySkillBonus(option);

        // 计算死亡概率（考虑技能加成）
        let actualDeathChance = option.deathChance || 0;
        skillBonus.forEach(bonus => {
            if (bonus.effect.includes('降低死亡概率')) {
                actualDeathChance *= 0.7;  // 技能降低 30% 死亡概率
            }
        });

        // 检查是否死亡
        if (actualDeathChance > 0) {
            const deathRoll = Math.random();
            if (deathRoll < actualDeathChance) {
                return this.handleDeath(option.deathReason);
            }
        }

        // 检查生命值
        if (this.player.health <= 0) {
            return this.handleDeath('生命值耗尽');
        }

        // 检查资源耗尽
        if (this.resources.food <= 0 || this.resources.water <= 0) {
            return this.handleDeath('资源耗尽');
        }

        // 获得奖励
        if (option.rewards) {
            option.rewards.forEach(reward => {
                this.addReward(reward);
            });
        }

        // 检查成就
        this.checkAchievements();

        // 检查随机事件
        const randomEvent = this.checkRandomEvent();

        // 移动到下一事件
        if (option.nextEvent) {
            this.gameState.currentEventId = option.nextEvent;
            this.currentEvent = this.getCurrentEvent();
        }

        return {
            type: 'continue',
            skillBonus: skillBonus,
            rewards: option.rewards || [],
            randomEvent: randomEvent
        };
    }

    /**
     * 检查选项要求
     */
    checkRequirements(requirements) {
        if (requirements.item) {
            const hasItem = this.player.inventory.includes(requirements.item);
            if (!hasItem) {
                return {
                    passed: false,
                    message: `需要物品: ${requirements.item}`
                };
            }
        }

        if (requirements.skill) {
            const hasSkill = this.player.skills.includes(requirements.skill);
            if (!hasSkill) {
                return {
                    passed: false,
                    message: `需要技能: ${requirements.skill}`
                };
            }
        }

        return { passed: true };
    }

    /**
     * 消耗资源
     */
    consumeResources(option) {
        // 根据动作类型消耗不同资源
        const action = option.action || 'talk';
        switch (action) {
            case 'fight':
                this.player.stamina -= 10;
                break;
            case 'search':
                this.player.stamina -= 5;
                break;
            case 'run':
                this.player.stamina -= 15;
                break;
            case 'escape':
                this.player.stamina -= 20;
                break;
        }

        // 恐怖剧本消耗理智值
        if (this.currentScenario.type === '恐怖') {
            this.player.sanity -= 5;
        }

        // 每次行动消耗食物和水
        if (this.gameState.playTime % 3 === 0) {
            this.resources.food -= 1;
            this.resources.water -= 1;
        }

        // 确保资源不低于 0
        this.player.stamina = Math.max(0, this.player.stamina);
        this.player.sanity = Math.max(0, this.player.sanity);
    }

    /**
     * 更新 NPC 状态
     */
    updateNPCs(option) {
        if (option.consequences) {
            Object.keys(option.consequences).forEach(npcId => {
                const npc = this.npcs[npcId];
                if (npc) {
                    const consequence = option.consequences[npcId];

                    // 更新生命值
                    if (consequence.health !== undefined) {
                        npc.health += consequence.health;
                        if (npc.health <= 0) {
                            npc.alive = false;
                            this.gameState.deaths.push({
                                npcId: npcId,
                                reason: '在行动中死亡'
                            });
                        }
                    }

                    // 更新信任度
                    if (consequence.trust !== undefined) {
                        npc.trust = Math.max(0, Math.min(100, npc.trust + consequence.trust));
                    }

                    // 更新存活状态
                    if (consequence.alive !== undefined) {
                        npc.alive = consequence.alive;
                    }
                }
            });
        }
    }

    /**
     * 应用技能加成
     */
    applySkillBonus(option) {
        const bonuses = [];
        if (!option.skillBonus) return bonuses;

        this.player.skills.forEach(skill => {
            if (option.skillBonus[skill]) {
                bonuses.push({
                    skill: skill,
                    effect: option.skillBonus[skill]
                });
            }
        });

        return bonuses;
    }

    /**
     * 添加奖励
     */
    addReward(reward) {
        // 检查是否是技能
        if (reward.includes('技能') || reward.includes('能力')) {
            // 提取技能名称
            const skillName = reward.replace(/获得|习得|解锁/g, '').trim();
            if (!this.player.skills.includes(skillName)) {
                this.player.skills.push(skillName);
            }
        }

        // 检查是否是资源
        if (reward.includes('食物')) this.resources.food += 1;
        if (reward.includes('水')) this.resources.water += 1;
        if (reward.includes('医疗包')) this.resources.medical += 1;
        if (reward.includes('弹药')) this.resources.ammo += parseInt(reward.match(/\d+/)?.[0] || 1);

        // 其他物品加入背包
        this.player.inventory.push(reward);
    }

    /**
     * 处理死亡
     */
    handleDeath(reason) {
        this.player.health = 0;
        this.player.deaths += 1;
        this.gameState.deaths.push({
            eventId: this.gameState.currentEventId,
            reason: reason,
            timestamp: Date.now()
        });

        return {
            type: 'death',
            reason: reason,
            ending: this.getDeathEnding()
        };
    }

    /**
     * 检查成就
     */
    checkAchievements() {
        // 初次冒险
        if (this.gameState.visitedEvents.size >= 1 && !this.achievements[0].completed) {
            this.achievements[0].completed = true;
            this.player.achievements.push('ach-001');
        }

        // 生存专家
        if (this.gameState.visitedEvents.size >= 10 && !this.achievements[1].completed) {
            this.achievements[1].completed = true;
            this.player.achievements.push('ach-002');
        }

        // 收藏家
        if (this.player.inventory.length >= 10 && !this.achievements[3].completed) {
            this.achievements[3].completed = true;
            this.player.achievements.push('ach-004');
        }

        // 技能大师
        if (this.player.skills.length >= 5 && !this.achievements[4].completed) {
            this.achievements[4].completed = true;
            this.player.achievements.push('ach-005');
        }
    }

    /**
     * 检查是否达成结局
     */
    checkEnding() {
        const currentEvent = this.getCurrentEvent();

        // 检查玩家是否死亡
        if (this.player.health <= 0) {
            return this.getDeathEnding();
        }

        // 检查理智值（恐怖剧本）
        if (this.currentScenario.type === '恐怖' && this.player.sanity <= 0) {
            return this.getInsanityEnding();
        }

        // 检查资源耗尽
        if (this.resources.food <= 0 || this.resources.water <= 0) {
            return this.getResourceEnding();
        }

        // 如果没有下一事件或没有选项，检查结局
        if (!currentEvent || !currentEvent.options || currentEvent.options.length === 0) {
            return this.determineEnding();
        }

        return null;
    }

    /**
     * 判定结局
     */
    determineEnding() {
        const endings = this.currentScenario.endings || [];
        const aliveNPCs = this.countAliveNPCs();
        const completedSideQuests = this.countCompletedSideQuests();
        const hiddenItemsCollected = this.countHiddenItems();

        // 按优先级检查结局（真结局 > 隐藏结局 > 普通结局）
        // 先检查真结局
        const trueEnding = endings.find(e => e.type === 'true' && this.checkEndingConditions(e, aliveNPCs, completedSideQuests, hiddenItemsCollected));
        if (trueEnding) {
            // 完成完美主义者成就
            if (!this.achievements[2].completed) {
                this.achievements[2].completed = true;
                this.player.achievements.push('ach-003');
            }
            return trueEnding;
        }

        // 检查隐藏结局
        const hiddenEnding = endings.find(e => e.type === 'hidden' && this.checkEndingConditions(e, aliveNPCs, completedSideQuests, hiddenItemsCollected));
        if (hiddenEnding) {
            return hiddenEnding;
        }

        // 检查普通结局
        const goodEnding = endings.find(e => e.type === 'good' && this.checkEndingConditions(e, aliveNPCs, completedSideQuests, hiddenItemsCollected));
        if (goodEnding) {
            return goodEnding;
        }

        const neutralEnding = endings.find(e => e.type === 'neutral' && this.checkEndingConditions(e, aliveNPCs, completedSideQuests, hiddenItemsCollected));
        if (neutralEnding) {
            return neutralEnding;
        }

        const badEnding = endings.find(e => e.type === 'bad' && this.checkEndingConditions(e, aliveNPCs, completedSideQuests, hiddenItemsCollected));
        if (badEnding) {
            return badEnding;
        }

        // 默认结局
        return this.getDefaultEnding();
    }

    /**
     * 检查结局条件
     */
    checkEndingConditions(ending, aliveNPCs, completedSideQuests, hiddenItemsCollected) {
        if (!ending.conditions) return true;

        return ending.conditions.every(condition => {
            // 检查特定事件
            if (condition.includes('抵达') || condition.includes('到达')) {
                return this.gameState.currentEventId === ending.triggerEvent;
            }

            // 检查 NPC 存活
            if (condition.includes('队友全部存活')) {
                return aliveNPCs === Object.keys(this.npcs).length;
            }

            if (condition.includes('至少存活')) {
                const minCount = parseInt(condition.match(/\d+/)?.[0] || '0');
                return aliveNPCs >= minCount;
            }

            // 检查隐藏支线
            if (condition.includes('完成隐藏支线') || condition.includes('解药') || condition.includes('数据')) {
                return hiddenItemsCollected > 0;
            }

            // 检查特定物品
            if (condition.includes('物品')) {
                const itemName = condition.match(/物品:\s*(.+)/)?.[1];
                return this.player.inventory.includes(itemName);
            }

            // 检查特定技能
            if (condition.includes('技能')) {
                const skillName = condition.match(/技能:\s*(.+)/)?.[1];
                return this.player.skills.includes(skillName);
            }

            return true;
        });
    }

    /**
     * 计算存活 NPC 数量
     */
    countAliveNPCs() {
        return Object.values(this.npcs).filter(npc => npc.alive).length;
    }

    /**
     * 计算完成支线数量
     */
    countCompletedSideQuests() {
        // 简化处理：根据访问的事件数判断
        return this.gameState.visitedEvents.size;
    }

    /**
     * 计算收集的隐藏物品数量
     */
    countHiddenItems() {
        return this.player.inventory.filter(item =>
            item.includes('解药') || item.includes('数据') || item.includes('秘籍') || item.includes('配方')
        ).length;
    }

    /**
     * 获取死亡结局
     */
    getDeathEnding() {
        return {
            type: 'bad',
            title: '死亡',
            description: '你在冒险中不幸身亡。但这并不是终点，你的经验将带到下一个世界...',
            image: 'assets/images/death.jpg',
            rewards: ['保留已学技能', '保留 50% 经验']
        };
    }

    /**
     * 获取理智崩溃结局（恐怖剧本）
     */
    getInsanityEnding() {
        return {
            type: 'bad',
            title: '理智崩溃',
            description: '你的理智已经无法承受这个世界。你陷入了疯狂，成为这个世界的一部分...',
            image: 'assets/images/insanity.jpg',
            rewards: ['保留已学技能', '获得【疯狂】特质']
        };
    }

    /**
     * 获取资源耗尽结局
     */
    getResourceEnding() {
        return {
            type: 'bad',
            title: '资源耗尽',
            description: '你的食物和水已经耗尽，在这个残酷的世界中，没有资源意味着死亡...',
            image: 'assets/images/resource.jpg',
            rewards: ['保留已学技能', '学会珍惜资源']
        };
    }

    /**
     * 获取默认结局
     */
    getDefaultEnding() {
        return {
            type: 'neutral',
            title: '未完成',
            description: '你的冒险结束了，但你没有完成主线任务。也许下次你会有更好的选择...',
            image: 'assets/images/neutral.jpg',
            rewards: ['保留已学技能']
        };
    }

    /**
     * 保存游戏状态
     */
    saveGame() {
        const saveData = {
            scenarioId: this.currentScenario.id,
            gameState: {
                currentEventId: this.gameState.currentEventId,
                history: this.gameState.history,
                visitedEvents: Array.from(this.gameState.visitedEvents),
                playTime: this.gameState.playTime,
                randomEventsTriggered: Array.from(this.gameState.randomEventsTriggered)
            },
            player: {
                skills: this.player.skills,
                inventory: this.player.inventory,
                health: this.player.health,
                stamina: this.player.stamina,
                sanity: this.player.sanity,
                achievements: this.player.achievements,
                deaths: this.player.deaths
            },
            npcs: this.npcs,
            resources: this.resources,
            timestamp: Date.now()
        };

        localStorage.setItem('infiniteflow_save', JSON.stringify(saveData));
        return true;
    }

    /**
     * 加载游戏状态
     */
    loadGame() {
        const saveDataStr = localStorage.getItem('infiniteflow_save');
        if (!saveDataStr) {
            return false;
        }

        try {
            const saveData = JSON.parse(saveDataStr);

            // 恢复游戏状态
            this.gameState.currentEventId = saveData.gameState.currentEventId;
            this.gameState.history = saveData.gameState.history;
            this.gameState.visitedEvents = new Set(saveData.gameState.visitedEvents);
            this.gameState.playTime = saveData.gameState.playTime;
            this.gameState.randomEventsTriggered = new Set(saveData.gameState.randomEventsTriggered);

            // 恢复玩家状态
            this.player.skills = saveData.player.skills;
            this.player.inventory = saveData.player.inventory;
            this.player.health = saveData.player.health;
            this.player.stamina = saveData.player.stamina;
            this.player.sanity = saveData.player.sanity;
            this.player.achievements = saveData.player.achievements;
            this.player.deaths = saveData.player.deaths;

            // 恢复 NPC 状态
            this.npcs = saveData.npcs;

            // 恢复资源
            this.resources = saveData.resources;

            // 重新加载剧本（需要从文件加载）
            // 这里需要调用外部逻辑来重新加载剧本

            return true;
        } catch (error) {
            console.error('加载存档失败:', error);
            return false;
        }
    }

    /**
     * 获取游戏统计信息
     */
    getGameStats() {
        return {
            playTime: this.gameState.playTime,
            eventsVisited: this.gameState.visitedEvents.size,
            deaths: this.player.deaths,
            skillsLearned: this.player.skills.length,
            itemsCollected: this.player.inventory.length,
            achievementsUnlocked: this.player.achievements.length,
            aliveNPCs: this.countAliveNPCs(),
            totalNPCs: Object.keys(this.npcs).length
        };
    }

    /**
     * 获取 NPC 状态
     */
    getNPCStatus() {
        return Object.values(this.npcs).map(npc => ({
            id: npc.id,
            name: npc.name,
            alive: npc.alive,
            health: npc.health,
            trust: npc.trust,
            mood: npc.mood
        }));
    }
}

// 导出到全局
window.InfiniteFlowGameEnhanced = InfiniteFlowGameEnhanced;
