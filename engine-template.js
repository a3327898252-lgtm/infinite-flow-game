/**
 * 无限剧本杀 - 游戏引擎模板
 *
 * 使用说明：
 * 1. 此模板供 OpenClaw 的 AI 使用
 * 2. AI 可以根据新剧本的需要修改或扩展此引擎
 * 3. 保持向后兼容性，确保旧剧本也能运行
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
            deaths: []
        };
    }

    /**
     * 加载剧本
     * @param {Object} scenario - 剧本 JSON 数据
     */
    loadScenario(scenario) {
        this.currentScenario = scenario;
        this.currentEvent = scenario.events.find(e => e.id === 'event-001');
        this.gameState.currentEventId = 'event-001';
        this.gameState.history = [];
        this.gameState.deaths = [];
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
     * @param {string} optionId - 选项 ID
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

        // 检查是否死亡
        if (option.deathChance > 0) {
            const deathRoll = Math.random();
            if (deathRoll < option.deathChance) {
                this.player.health = 0;
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
     * @param {Object} option - 选项对象
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

        // 如果没有下一事件，检查结局
        if (!currentEvent || !currentEvent.options) {
            return this.determineEnding();
        }

        return null;
    }

    /**
     * 判定结局
     */
    determineEnding() {
        const endings = this.currentScenario.endings;

        // 检查每个结局的条件
        for (const ending of endings) {
            if (this.checkEndingConditions(ending.conditions)) {
                return ending;
            }
        }

        // 默认结局（死亡结局）
        return this.getBadEnding();
    }

    /**
     * 检查结局条件
     * @param {Array} conditions - 条件列表
     */
    checkEndingConditions(conditions) {
        if (!conditions) return true;

        // 简化版检查，实际需要更复杂的逻辑
        return conditions.every(condition => {
            // 检查主任务完成
            if (condition.includes('完成主任务')) {
                return this.gameState.history.some(h => h.eventId === 'quest-completed');
            }
            return true;
        });
    }

    /**
     * 获取坏结局
     */
    getBadEnding() {
        return this.currentScenario.endings.find(e => e.type === 'bad') ||
               this.currentScenario.endings[0];
    }

    /**
     * 添加玩家技能
     * @param {string} skill - 技能名称
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
            gameState: this.gameState
        };
    }

    /**
     * 加载游戏状态
     * @param {Object} saveData - 保存的数据
     */
    loadGame(saveData) {
        this.player = saveData.player;
        this.gameState = saveData.gameState;
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

// 导出供浏览器使用
if (typeof window !== 'undefined') {
    window.InfiniteFlowGame = InfiniteFlowGame;
}

// 导出供 Node.js 使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InfiniteFlowGame;
}
