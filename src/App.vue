<template>
  <div class="min-h-screen bg-rice-paper text-ink-black font-serif flex flex-col items-center justify-center p-4 md:p-8 transition-opacity duration-700">
    
    <div v-if="state === 'start'" class="max-w-2xl w-full text-center space-y-12 animate-fade-in">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold tracking-widest text-ink-black">十日终焉</h1>
        <p class="text-xl md:text-2xl tracking-widest text-ink-gray">轮回性格测试 (SRTI)</p>
      </div>
      <p class="text-md md:text-lg text-ink-gray leading-relaxed max-w-lg mx-auto">
        在这个充满谎言、杀戮与规则的轮回世界里，<br>
        剥去现世的伪装，你究竟会觉醒怎样的回响？<br>
        完成 20 个生死抉择，寻找你灵魂最深处的阵营。
      </p>
      <button @click="startTest" class="px-8 py-3 border border-ink-black text-ink-black hover:bg-ink-black hover:text-rice-paper transition-all duration-300 tracking-widest">
        入局
      </button>
    </div>

    <div v-else-if="state === 'testing'" class="max-w-3xl w-full flex flex-col items-center animate-fade-in">
      <div class="w-full flex items-center justify-between mb-12 text-sm text-ink-gray">
        <span>第 {{ currentQuestionIndex + 1 }} 局</span>
        <div class="flex-1 mx-4 h-px bg-ink-gray/30 relative">
          <div class="absolute left-0 top-0 h-full bg-ink-black transition-all duration-500" :style="{ width: progress + '%' }"></div>
        </div>
        <span>共 20 局</span>
      </div>

      <div class="w-full space-y-8">
        <h2 class="text-xl md:text-2xl leading-relaxed font-semibold text-ink-black min-h-[4rem]">
          {{ currentQuestion.text }}
        </h2>
        
        <div class="flex flex-col space-y-4">
          <button 
            v-for="(option, index) in currentQuestion.options" 
            :key="index"
            @click="handleAnswer(option.effect)"
            class="text-left w-full p-4 border border-ink-gray/30 hover:border-ink-black hover:bg-ink-black/5 transition-all duration-300 group"
          >
            <span class="text-ink-gray group-hover:text-ink-black transition-colors">{{ option.text }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="state === 'result'" class="max-w-2xl w-full flex flex-col items-center text-center space-y-10 animate-fade-in">
      <div class="space-y-2">
        <p class="text-lg text-ink-gray tracking-widest">你的轮回倒影是</p>
        <h1 class="text-5xl md:text-7xl font-bold tracking-widest text-ink-black py-4">{{ matchedCharacter.name }}</h1>
      </div>
      
      <div class="text-xl md:text-2xl leading-relaxed text-ink-gray border-t border-b border-ink-gray/30 py-8 px-4" 
           v-html="formatDesc(matchedCharacter.desc)">
      </div>

      <div class="text-sm text-ink-gray/70 space-y-2">
        <p>你的精神坐标：[{{ userScores.join(', ') }}]</p>
        <p>理智/共情 · 守序/破局 · 谋定/随机 · 独狼/团队</p>
      </div>

      <button @click="resetTest" class="px-8 py-3 mt-8 border border-ink-black text-ink-black hover:bg-ink-black hover:text-rice-paper transition-all duration-300 tracking-widest">
        再次轮回
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 状态管理：'start' | 'testing' | 'result'
const state = ref('start')
const currentQuestionIndex = ref(0)
// 用户初始四维坐标 [决策, 规则, 行动, 羁绊]
const userScores = ref([0, 0, 0, 0])
const resultChar = ref(null)

// 角色库坐标数据 (根据原著设定深度修订版)
const characters = [
  { name: '齐夏', coords: [-10, 9, -10, -8], desc: '从悲伤中觉醒**灵闻**，于心安处**生生不息**。你终将选择背负一切，骗过天道，孤独地走向终局。' },
  { name: '楚天秋', coords: [-8, -9, -8, 9], desc: '见证终焉，化身**癫人**。为了虚假世界里的真理，哪怕吞噬同伴的眼球，也要建立绝对的天堂。' },
  { name: '乔家劲', coords: [8, 5, 9, 8], desc: '为了心中守护的道义，挥拳**破万法**。你是纯粹的利刃，只要认定了路，便一往无前绝不回头。' },
  { name: '陈俊南', coords: [5, 8, 10, 6], desc: '出于同情而觉醒**替罪**。即使身为京城第一社恐，也要用最烂的牌打出最野的局，替大家挡下所有死劫。' },
  { name: '郑英雄', coords: [2, 3, 5, 9], desc: '呼吸之间，**灵嗅**万物。你用最孩童般的纯粹，在浑浊的轮回里嗅出最真实的善恶与灵魂。' },
  { name: '韩一墨', coords: [5, -2, -3, 6], desc: '由极致的恐惧引发**招灾**。看似怯懦退缩的旁观者，却能在绝境中召唤七黑剑，斩断一切绝望。' },
  { name: '章晨泽', coords: [7, -10, -7, 8], desc: '坚守法理却在崩溃中觉醒**魂迁**。你是团队的定海神针，用灵魂的天平，审判这无序的轮回。' },
  { name: '张山', coords: [3, 4, 9, 9], desc: '只因一句“想要赢”，便觉醒**天行健**。你是最热血忠诚的猛将，用不断强化的血肉之躯为队友铺开生路。' },
  { name: '许流年', coords: [-7, 10, 10, -9], desc: '在潜意识中**化形**万千。为了那唯一的生机，你愿意舍弃原本的皮囊，在虚假中成为最锋利的变数。' },
  { name: '秦丁冬', coords: [-2, 8, 6, 5], desc: '手握**赝品**，在死局中狸猫换太子。你古灵精怪，总能在最绝望的规则里，制造出扭转乾坤的奇迹。' },
  { name: '江若雪', coords: [9, 1, -5, -6], desc: '清冷孤傲，执掌**因果**。你深信符合逻辑之事必将发生，用长线布局在命运的棋盘上落子无悔。' },
  { name: '钱五', coords: [4, -9, -6, 10], desc: '一花绽双花放，觉醒**双生花**只为保留抗争的火种。你是庇护所有人的老大哥，死亦不悔。' },
  { name: '地虎', coords: [-6, -10, -2, -3], desc: '披着冷酷无情的外壳，内心却藏着致命的**柔软**。你是面冷心热的矛盾体，在杀戮规则下苦苦挣扎。' },
  { name: '地鼠', coords: [-3, 10, 8, -5], desc: '外表逢迎讨好，实则死咬着崇高的**理想**。为了最终的目标，你愿意卑微到尘埃里，在规则边缘隐忍蛰伏。' }
]

// 题库数据 (20题)
// effect数组对应 [决策轴, 规则轴, 行动轴, 羁绊轴] 的分数增减
const questions = [
  // --- 维度一：决策轴（理智- 共情+） ---
  {
    text: "【小说设定】绝境中，一名与你并肩作战的队友不慎触发了隐藏的“必死规则”。如果放任不管，他失控后会触发机关团灭所有人。但他目前还有 10% 的几率能清醒过来，你会：",
    options: [
      { text: "A. 毫不犹豫地亲手“淘汰”他，物理层面掐断一切团灭风险。", effect: [-2, 0, 0, 0] },
      { text: "B. 带领大部队迅速撤离，把他单独留在这里自生自灭。", effect: [-1, 0, 0, 0] },
      { text: "C. 让大部队先撤，自己留下并保持安全距离，等这 10% 的奇迹。", effect: [1, 0, 0, 0] },
      { text: "D. 坚决不放弃，指挥全队建立防御阵型，陪他一起赌这 10% 的生机。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【日常情境】团队正在推进一个重要项目，明天就要交差。某位组员因为突发的个人感情问题情绪崩溃，整个星期进度为零。你需要提交团队贡献度考核表，你会：",
    options: [
      { text: "A. 实话实说，给他打 0 分。成年人必须为自己的失职负责。", effect: [-2, 0, 0, 0] },
      { text: "B. 帮他补全工作，但考核表上如实扣分，并私下告诉他下不为例。", effect: [-1, 0, 0, 0] },
      { text: "C. 帮他补全工作，考核表上给他及格分让他免受处罚，但后续避免和他同组。", effect: [1, 0, 0, 0] },
      { text: "D. 熬夜帮他做完，考核打满分，并花时间安慰他，认为团队互助高于一切。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【小说设定】在危险的游戏中，你找到了一份极其珍贵的恢复药剂。另一名重伤的陌生玩家哀求你分给他一半，否则活不过今晚。但这瓶药明天你应对生死战也需要，你会：",
    options: [
      { text: "A. 捂紧药剂冷漠离开。我必须保证自己 100% 的状态。", effect: [-2, 0, 0, 0] },
      { text: "B. 拒绝给他药剂，但向他指引一条可能有其他物资的路线。", effect: [-1, 0, 0, 0] },
      { text: "C. 犹豫后分给他一半。虽然会导致自己明天状态不满，但无法见死不救。", effect: [1, 0, 0, 0] },
      { text: "D. 把整瓶药剂都给他。你坚信哪怕带着debuff，也能靠意志力活过明天。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【日常情境】你的好朋友在公共场合因为一件小事和一个陌生人发生了激烈的争吵。你赶到现场了解情况后，发现你的朋友在逻辑和事实上完全不占理。你会：",
    options: [
      { text: "A. 当场指出朋友的逻辑漏洞，制止他的无理取闹，并要求他道歉。", effect: [-2, 0, 0, 0] },
      { text: "B. 保持沉默不站队，等事情平息后再私下给朋友复盘他的错误。", effect: [-1, 0, 0, 0] },
      { text: "C. 不讲道理地“和稀泥”，强行拉着朋友离开现场，避免他继续丢脸。", effect: [1, 0, 0, 0] },
      { text: "D. 枪口一致对外！无条件站在朋友这边，用气势把陌生人压倒再说。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【小说设定】你偶然发现，团队里一个极其可靠的队友，偷偷向“生肖”泄露了你们的计划。深究后发现，是因为他在现实世界的家人被生肖要挟了。你会：",
    options: [
      { text: "A. 背叛就是背叛。立刻公开处决或驱逐他，以绝后患。", effect: [-2, 0, 0, 0] },
      { text: "B. 装作不知道，反向利用他传递假情报，把他榨干最后一丝价值。", effect: [-1, 0, 0, 0] },
      { text: "C. 剥夺他的一切核心权限，但答应游戏胜利后帮他救家人。", effect: [1, 0, 0, 0] },
      { text: "D. 替他隐瞒泄密的事，并承诺全队一起帮他解决家人的危机。", effect: [2, 0, 0, 0] }
    ]
  },
  // --- 维度二：规则轴（守序- 破局+） ---
  {
    text: "【小说设定】你进入了一个必须投票选出一人牺牲才能开门的死亡游戏。此时人群陷入混乱，你会：",
    options: [
      { text: "A. 呼吁大家保持冷静，建立一套公平的抽签或投票程序并严格执行。", effect: [0, -2, 0, 0] },
      { text: "B. 引导投票投向那个对团队贡献最小或最不稳定的人。", effect: [0, -1, 0, 0] },
      { text: "C. 寻找规则文字中的逻辑漏洞，尝试利用“弃权”或“平票”来卡BUG。", effect: [0, 1, 0, 0] },
      { text: "D. 拒绝参与投票，直接尝试物理破坏出口或杀死发令的“生肖”。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【日常情境】处理某项行政手续时，你发现流程极其繁琐且效率低下，但“大家都这么做”，你会：",
    options: [
      { text: "A. 哪怕觉得麻烦也按部就班走完所有流程，确保合法合规。", effect: [0, -2, 0, 0] },
      { text: "B. 寻找熟人或者在规则框架内打擦边球，尽可能加快进度。", effect: [0, -1, 0, 0] },
      { text: "C. 只做关键环节，其余繁琐流程直接忽略或填个假数据糊弄过去。", effect: [0, 1, 0, 0] },
      { text: "D. 彻底无视这个流程，用自己的方式把事办成，哪怕事后会被投诉。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【小说设定】面对一个极其强大且正在高高在上宣讲“生存信条”的生肖，你的第一反应是：",
    options: [
      { text: "A. 表面保持极度的敬畏，大脑飞速分析他话语中透露出的硬性规则。", effect: [0, -2, 0, 0] },
      { text: "B. 混在人群中不发一言，冷静观察规则的边界在哪里。", effect: [0, -1, 0, 0] },
      { text: "C. 偶尔出言挑衅或质疑，干扰他的注意力，寻找破绽。", effect: [0, 1, 0, 0] },
      { text: "D. 在他话音未落时就突然发动奇袭，完全打乱他的节奏。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【日常情境】你发现了一个可以让你少奋斗十年的漏洞（如系统漏洞或套利机会），但它会轻微扰乱公平秩序，你会：",
    options: [
      { text: "A. 绝对不碰。坚信只有在公正规则下获得的成功才有意义。", effect: [0, -2, 0, 0] },
      { text: "B. 在法律红线边缘反复确认，只要不犯法就小规模尝试。", effect: [0, -1, 0, 0] },
      { text: "C. 认为规则是强者制定的，利用漏洞本身也是高智商的表现。", effect: [0, 1, 0, 0] },
      { text: "D. 迅速钻过去并顺便把梯子撤掉，规则存在的意义就是被利用的。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【小说设定】你获得了一件可以欺骗“世界系统”的道具，但使用它意味着你彻底站到了现有生存秩序的对立面，你会：",
    options: [
      { text: "A. 锁进箱底。认为维持现状最稳妥，打破秩序风险不可控。", effect: [0, -2, 0, 0] },
      { text: "B. 制定详尽的试探计划，分阶段去测试系统的承受极限。", effect: [0, -1, 0, 0] },
      { text: "C. 既然常规路走不通，那就得靠这种离经叛道的方式博一把。", effect: [0, 1, 0, 0] },
      { text: "D. 所谓的“天道”本身就是最大的虚伪，骗它才是寻找真相的唯一出路。", effect: [0, 2, 0, 0] }
    ]
  },
  // --- 维度三：行动轴（谋定- 随机+） ---
  {
    text: "【小说设定】每一场死亡游戏开始前，你最常见的状态是：",
    options: [
      { text: "A. 坐在一旁闭目凝神，推演可能遇到的所有变量和应对方案。", effect: [0, 0, -2, 0] },
      { text: "B. 检查装备和队友的状态，确保基本盘稳固。", effect: [0, 0, -1, 0] },
      { text: "C. 观察周遭环境，心里有个大概轮廓，剩下的随遇而安。", effect: [0, 0, 1, 0] },
      { text: "D. 兴奋地跃跃欲试，你更相信自己炸裂的临场反应。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【日常情境】在进行高强度的 FPS 竞技（如 CS/Valorant）时，你更偏好哪种打法？",
    options: [
      { text: "A. 严格执行战术板，每一个道具的位置和投掷时机都要分秒不差。", effect: [0, 0, -2, 0] },
      { text: "B. 守住固定点位稳扎稳打，不求出彩但求无过。", effect: [0, 0, -1, 0] },
      { text: "C. 根据小地图局势频繁转点，哪里有破绽就去哪里补位。", effect: [0, 0, 1, 0] },
      { text: "D. 极具侵略性的“疯狗型”突破，用极致的操作强行打乱对方节奏。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【小说设定】战斗中局势突变，你原本精密布局的计划被某个意外完全打碎，你会：",
    options: [
      { text: "A. 心态短暂波动后强制冷静，迅速寻找备份计划（Plan B）。", effect: [0, 0, -2, 0] },
      { text: "B. 快速询问队友的看法，汇总信息后再重组战术。", effect: [0, 0, -1, 0] },
      { text: "C. 跟着直觉走，有时候身体的本能反应比大脑算出的结果更快。", effect: [0, 0, 1, 0] },
      { text: "D. 完全不慌，这种意料之外的混沌变局反而是你最擅长的战场。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【日常情境】准备一次重要的项目汇报或考试时，你的风格倾向于：",
    options: [
      { text: "A. 准备详尽的提纲，甚至连每一张 PPT 的台词都背熟。", effect: [0, 0, -2, 0] },
      { text: "B. 抓住几个核心考点或重点进行强化，不追求面面俱到。", effect: [0, 0, -1, 0] },
      { text: "C. 考前突击看几眼，剩下的全靠平时的积累。", effect: [0, 0, 1, 0] },
      { text: "D. 基本不准备，认为临场的状态和即兴发挥远比死记硬背重要。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【小说设定】有人提出了一个极其复杂、风险极大但成功后收益极高的“连环局”，你参与的动力在于：",
    options: [
      { text: "A. 对精妙逻辑布局本身的欣赏，看到齿轮严丝合缝转动让你舒适。", effect: [0, 0, -2, 0] },
      { text: "B. 经过计算后认为这是目前胜率最高的方案，理智上支持。", effect: [0, 0, -1, 0] },
      { text: "C. 这种“走钢丝”的极高风险带来的肾上腺素激增让你兴奋。", effect: [0, 0, 1, 0] },
      { text: "D. 觉得这种花里胡哨的计划没意义，你只想冲过去速战速决。", effect: [0, 0, 2, 0] }
    ]
  },
  // --- 维度四：羁绊轴（独狼- 团队+） ---
  {
    text: "【小说设定】如果需要选择一种在这个世界长期生存的姿态，你会选择：",
    options: [
      { text: "A. 隐藏在黑暗中的独行者，不轻易相信任何人，也不被拖累。", effect: [0, 0, 0, -2] },
      { text: "B. 寻找 1-2 个能力互补的死党，形成极度紧密的小型核心团体。", effect: [0, 0, 0, -1] },
      { text: "C. 尽量加入一个成熟的大型组织，利用集体的力量分摊生存风险。", effect: [0, 0, 0, 1] },
      { text: "D. 建立并领导一个属于自己的势力，招募各路人才共同破局。", effect: [0, 0, 0, 2] }
    ]
  },
  {
    text: "【日常情境】当你需要完成一项极其繁重的任务（如大作业或策划案）时，你更喜欢：",
    options: [
      { text: "A. 独自关在房间里，断开一切社交干扰，效率最高。", effect: [0, 0, 0, -2] },
      { text: "B. 在图书馆等公共场所，偶尔能和身边的人交换一下进度。", effect: [0, 0, 0, -1] },
      { text: "C. 喜欢小组协作，大家分工明确，遇到难题立刻开会脑暴。", effect: [0, 0, 0, 1] },
      { text: "D. 在语音群里和朋友们边聊天边干活，这会让你更有动力。", effect: [0, 0, 0, 2] }
    ]
  },
  {
    text: "【小说设定】如果胜利的关键道具只有一件，且只有持有者能觉醒强大的“回响”，你会：",
    options: [
      { text: "A. 认为这东西在自己手里最稳当，只有自己变强才能保住大家的命。", effect: [0, 0, 0, -2] },
      { text: "B. 公平竞争，谁在战斗中功劳最大谁拿，绝不相让。", effect: [0, 0, 0, -1] },
      { text: "C. 谁最需要或谁的异能与此最匹配就给谁，为了团队利益最大化。", effect: [0, 0, 0, 1] },
      { text: "D. 主动让给最信任的队友，你更享受那种“幕后成全”的感觉。", effect: [0, 0, 0, 2] }
    ]
  },
  {
    text: "【日常情境】忙碌了一整周，周末你最渴望的解压方式是：",
    options: [
      { text: "A. 在家安安静静地打单机游戏或看书，不被打扰。", effect: [0, 0, 0, -2] },
      { text: "B. 约上一两个死党去吃顿好的，互相吐槽一下生活。", effect: [0, 0, 0, -1] },
      { text: "C. 参加一场十几人的聚会或剧本杀，在热闹中认识新面孔。", effect: [0, 0, 0, 1] },
      { text: "D. 组织一个大型团建活动，作为发起人协调行程并乐在其中。", effect: [0, 0, 0, 2] }
    ]
  },
  {
    text: "【小说设定】最后生还之门就在眼前，但必须有人殿后抵挡追兵，且那个人大概率会死，你会：",
    options: [
      { text: "A. 在所有人反应过来前，第一个冲进大门。生存是唯一的真理。", effect: [0, 0, 0, -2] },
      { text: "B. 快速评估每个人的剩余价值，推举出那个“最合理”的牺牲者。", effect: [0, 0, 0, -1] },
      { text: "C. 极度纠结痛苦，但在大家的劝说下流着泪先走。", effect: [0, 0, 0, 1] },
      { text: "D. 毫不迟疑地停下脚步转身横刀而立，把生的希望留给所有人。", effect: [0, 0, 0, 2] }
    ]
  }
]

const currentQuestion = computed(() => questions[currentQuestionIndex.value])
const progress = computed(() => (currentQuestionIndex.value / questions.length) * 100)
const matchedCharacter = computed(() => characters[resultChar.value] || {})

// 格式化判词：将 **文字** 替换为红色加粗样式
const formatDesc = (text) => {
  if (!text) return ''
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-cinnabar font-bold">$1</strong>')
}

const startTest = () => {
  state.value = 'testing'
  currentQuestionIndex.value = 0
  userScores.value = [0, 0, 0, 0]
}

const handleAnswer = (effect) => {
  // 累加分数
  userScores.value = userScores.value.map((score, index) => score + effect[index])
  
  if (currentQuestionIndex.value < questions.length - 1) {
    currentQuestionIndex.value++
  } else {
    calculateResult()
  }
}

// 核心算法：欧几里得距离计算最匹配角色
const calculateResult = () => {
  let minDistance = Infinity
  let matchIndex = 0

  characters.forEach((char, index) => {
    // 计算四维空间距离 d = sqrt((x1-x2)^2 + (y1-y2)^2 + ...)
    let distanceSq = 0
    for (let i = 0; i < 4; i++) {
      distanceSq += Math.pow(userScores.value[i] - char.coords[i], 2)
    }
    let distance = Math.sqrt(distanceSq)

    if (distance < minDistance) {
      minDistance = distance
      matchIndex = index
    }
  })

  resultChar.value = matchIndex
  state.value = 'result'
}

const resetTest = () => {
  state.value = 'start'
}
</script>

<style>
/* 添加一些渐入动画 */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>