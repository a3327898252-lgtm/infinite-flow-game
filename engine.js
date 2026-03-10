/**
 * 无限剧本杀 - 游戏引擎
 */

class InfiniteFlowGame {
    constructor() {
        this.currentScenario = null;
        this.currentEvent = null;
        this.player = {
            skills: [],
            inventory: [],
            health: 100,
            completedQuests: []
        };
        this.gameState = {
            currentEventId: null,
            history: [],
            deaths: [],
            visitedEvents: new Set()
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
        this.player.health = 100;
        this.player.inventory = [];
        this.player.completedQuests = [];

        console.log(`✅ 剧本加载成功: ${scenario.title}`);
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
     * 玩家做出选择
     */
    makeChoice(optionId) {
        const currentEvent = this.getCurrentEvent();
        const option = currentEvent.options.find(opt => opt.id === optionId);

        if (!option) {
            throw new Error(`无效的选项: ${optionId}`);
        }

        // 记录历史
        this.gameState.history.push({
            eventId: currentEvent.id,
            optionId: optionId,
            timestamp: Date.now()
        });

        // 标记已访问的事件
        this.gameState.visitedEvents.add(currentEvent.id);

        // 检查是否死亡
        if (option.deathChance > 0) {
            const deathRoll = Math.random();
            if (deathRoll < option.deathChance) {
                this.player.health = 0;
                this.gameState.deaths.push({
                    eventId: currentEvent.id,
                    optionId: optionId,
                    reason: option.deathReason
                });
                return {
                    type: 'death',
                    reason: option.deathReason,
                    ending: this.getBadEnding()
                };
            }
        }

        // 应用技能加成
        const skillBonus = this.applySkillBonus(option);

        // 获得奖励
        if (option.rewards) {
            option.rewards.forEach(reward => {
                this.player.inventory.push(reward);
            });
        }

        // 显示技能加成
        if (skillBonus.length > 0) {
            console.log('技能加成:', skillBonus);
        }

        // 移动到下一事件
        if (option.nextEvent) {
            this.gameState.currentEventId = option.nextEvent;
            this.currentEvent = this.getCurrentEvent();
        }

        return {
            type: 'continue',
            skillBonus: skillBonus,
            rewards: option.rewards || []
        };
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
     * 检查是否达成结局
     */
    checkEnding() {
        const currentEvent = this.getCurrentEvent();

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
        const endings = this.currentScenario.endings;
        const completedQuests = this.gameState.visitedEvents.size;
        const aliveNPCs = this.countAliveNPCs();

        // 检查每个结局的条件
        for (const ending of endings) {
            if (this.checkEndingConditions(ending, completedQuests, aliveNPCs)) {
                return ending;
            }
        }

        // 默认结局（死亡结局）
        return this.getBadEnding();
    }

    /**
     * 检查结局条件
     */
    checkEndingConditions(ending, completedQuests, aliveNPCs) {
        if (!ending.conditions) return true;

        return ending.conditions.every(condition => {
            if (condition.includes('抵达横滨港口')) {
                return this.gameState.currentEventId === 'event-006';
            }
            if (condition.includes('完成隐藏支线')) {
                return this.player.inventory.some(item => item.includes('解药') || item.includes('数据'));
            }
            if (condition.includes('队友全部存活') || condition.includes('至少存活')) {
                const minCount = parseInt(condition.match(/\d+/)?.[0] || '0');
                return aliveNPCs >= minCount;
            }
            if (condition.includes('玩家死亡')) {
                return this.player.health <= 0;
            }
            return true;
        });
    }

    /**
     * 计算存活 NPC 数量
     */
    countAliveNPCs() {
        const totalNPCs = 3; // 田中、美咲、老杰克
        // 简化处理：假设所有 NPC 都存活，除非有特定剧情导致死亡
        return totalNPCs;
    }

    /**
     * 获取坏结局
     */
    getBadEnding() {
        const badEndings = this.currentScenario.endings.filter(e => e.type === 'bad');
        return badEndings.length > 0 ? badEndings[0] : this.currentScenario.endings[0];
    }

    /**
     * 添加玩家技能
     */
    addPlayerSkill(skill) {
        if (!this.player.skills.includes(skill)) {
            this.player.skills.push(skill);
        }
    }

    /**
     * 保存游戏状态
     */
    saveGame() {
        return {
            scenarioId: this.currentScenario.id,
            player: this.player,
            gameState: {
                ...this.gameState,
                visitedEvents: Array.from(this.gameState.visitedEvents)
            }
        };
    }

    /**
     * 加载游戏状态
     */
    loadGame(saveData) {
        this.player = saveData.player;
        this.gameState = {
            ...saveData.gameState,
            visitedEvents: new Set(saveData.gameState.visitedEvents)
        };
    }

    /**
     * 获取游戏状态摘要
     */
    getGameSummary() {
        return {
            scenario: this.currentScenario?.title,
            health: this.player.health,
            skills: this.player.skills,
            inventory: this.player.inventory,
            currentEvent: this.gameState.currentEventId,
            choices: this.gameState.history.length
        };
    }
}
