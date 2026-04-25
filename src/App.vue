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

    <div v-else-if="state === 'result'" class="max-w-2xl w-full flex flex-col items-center text-center space-y-10 animate-fade-in pb-12">
      <div class="space-y-2">
        <p class="text-lg text-ink-gray tracking-widest">你的核心轮回倒影</p>
        <h1 class="text-5xl md:text-7xl font-bold tracking-widest text-ink-black py-4">
          {{ topMatches[0].name }}
        </h1>
        <p class="text-xl text-cinnabar font-bold tracking-wider">契合度：{{ topMatches[0].matchRate }}%</p>
      </div>
      
      <div class="text-xl md:text-2xl leading-relaxed text-ink-gray border-t border-b border-ink-gray/30 py-8 px-4" 
           v-html="formatDesc(topMatches[0].desc)">
      </div>

      <div class="w-full pt-6">
        <p class="text-md text-ink-gray/70 tracking-widest mb-6">— 灵魂深处的副人格 —</p>
        <div class="w-full md:w-4/5 mx-auto p-6 border border-ink-gray/20 bg-white/50 hover:bg-white transition-colors text-left">
          <div class="flex justify-between items-end mb-3">
            <h3 class="text-2xl font-bold text-ink-black">{{ topMatches[1].name }}</h3>
            <span class="text-sm text-cinnabar font-bold">契合度：{{ topMatches[1].matchRate }}%</span>
          </div>
          <p class="text-md text-ink-gray leading-relaxed" v-html="formatDesc(topMatches[1].desc)"></p>
        </div>
      </div>

      <div class="text-sm text-ink-gray/50 space-y-2 pt-4">
        <p>精神坐标：[{{ userScores.join(', ') }}]</p>
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

const state = ref('start')
const currentQuestionIndex = ref(0)
const userScores = ref([0, 0, 0, 0])
const topMatches = ref([])

// 角色库 (19人完整版)
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
  { name: '地虎', coords: [8, -8, 8, -8], desc: '披着强硬的外壳，内心却有着致命的**柔软**与极高的共情。在严酷的秩序下，你习惯独自凭直觉抗下一切。' },
  { name: '地鼠', coords: [-3, 10, 8, -5], desc: '外表逢迎讨好，实则死咬着崇高的**理想**。为了最终的目标，你愿意卑微到尘埃里，在规则边缘隐忍蛰伏。' },
  // 新加入的高人气角色
  { name: '李尚武', coords: [-4, -5, 7, -6], desc: '彻底放下心中的执念，从虚无中**探囊**取物。你是极致纯粹的武者，哪怕深陷绝境，也要用双拳在这虚假的世界里打出真实的裂痕。' },
  { name: '云瑶', coords: [9, 9, 10, 7], desc: '于求而不得的绝境中觉醒**强运**。你相信奇迹与羁绊，凭着无可比拟的直觉，让整个世界的概率都为你倾斜。' },
  { name: '燕知春', coords: [-9, -9, -9, -7], desc: '试图掌控一切反对者，以霸道之音**夺心魄**。你是极道之王，用绝对的掌控欲编织无形的提线，让万物都在你的谋划中起舞。' },
  { name: '宋七', coords: [4, 9, 8, 3], desc: '在生死一线的狂热中引燃**爆燃**。你是行走的炸药桶，用最纯粹的怒火与破坏力，粉碎一切挡在面前的虚伪法则。' },
  { name: '罗十一', coords: [-7, -3, 4, -8], desc: '在无尽的挫败与绝望中选择**忘忧**。你切断了痛苦的感知，化作最坚忍的孤狼，在鲜血与伤痕中麻木却坚定地前行。' }
]

// 优化后的 20 道题
const questions = [
  {
    text: "【小说设定】绝境中，一名与你并肩作战的队友不慎触发了隐藏的“必死规则”。如果放任不管，他失控后会触发机关团灭所有人。但他目前还有 10% 的几率能清醒过来，你会：",
    options: [
      { text: "A. 以大局为重，强忍悲痛亲手“淘汰”他，确保团队火种得以延续。", effect: [-2, 0, 0, 0] },
      { text: "B. 理性止损，带领大部队迅速撤离，将存活的概率交给命运。", effect: [-1, 0, 0, 0] },
      { text: "C. 让大部队先撤，自己留下并保持安全距离，愿意为他等这 10% 的奇迹。", effect: [1, 0, 0, 0] },
      { text: "D. 坚决不放弃，指挥全队建立防御阵型，陪他一起搏这 10% 的生机。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【日常情境】团队正在推进一个重要项目，明天就要交差。某位组员因为突发的个人感情问题情绪崩溃，整个星期进度为零。你需要提交团队贡献度考核表，你会：",
    options: [
      { text: "A. 坚持原则与公平，如实给他打 0 分。成年人需为自己的失职负责。", effect: [-2, 0, 0, 0] },
      { text: "B. 帮他补全工作，但考核表上如实扣分，并严肃提醒他下不为例。", effect: [-1, 0, 0, 0] },
      { text: "C. 帮他补全工作并给及格分免受处罚，但在未来协作中会重新评估他。", effect: [1, 0, 0, 0] },
      { text: "D. 熬夜帮他做完，考核打满分，认为在低谷时拉队友一把比项目更重要。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【小说设定】在危险的游戏中，你找到了一份极其珍贵的恢复药剂。另一名重伤的陌生玩家哀求你分给他一半，否则活不过今晚。但这瓶药明天你应对生死战也需要，你会：",
    options: [
      { text: "A. 拒绝提供。在残酷的轮回中，确保自身 100% 的战力是对生存最大的尊重。", effect: [-2, 0, 0, 0] },
      { text: "B. 拒绝给他药剂，但利用已掌握的情报，向他指引其他物资的路线。", effect: [-1, 0, 0, 0] },
      { text: "C. 犹豫后分给他一半。即便自己明天面临巨大风险，也无法漠视眼前的死亡。", effect: [1, 0, 0, 0] },
      { text: "D. 把整瓶药剂都给他。你坚信哪怕带着劣势，也能凭借意志力斩获明天的生机。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【日常情境】你的好朋友在公共场合因为一件小事和一个陌生人发生了激烈的争吵。你赶到现场了解情况后，发现你的朋友在逻辑和事实上完全不占理。你会：",
    options: [
      { text: "A. 保持客观，当场指出朋友的逻辑漏洞，制止无意义的争端并促成和解。", effect: [-2, 0, 0, 0] },
      { text: "B. 保持沉默不公开站队，等事情平息后再私下帮朋友复盘核心问题。", effect: [-1, 0, 0, 0] },
      { text: "C. 运用高情商化解冲突，先平息事态，把朋友带离尴尬境地。", effect: [1, 0, 0, 0] },
      { text: "D. 情感优先！无条件站在朋友这边，在气势上先撑住场面再说。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【小说设定】你偶然发现，团队里一个极其可靠的队友，偷偷向“生肖”泄露了你们的计划。深究后发现，是因为他在现实世界的家人被生肖要挟了。你会：",
    options: [
      { text: "A. 为了团队绝对的安全，立刻公开处决或驱逐他，剥夺不稳定性。", effect: [-2, 0, 0, 0] },
      { text: "B. 隐忍不发，反向利用他传递假情报，在博弈中将计就计榨取价值。", effect: [-1, 0, 0, 0] },
      { text: "C. 剥夺他的一切核心权限，但出于理解，答应游戏胜利后帮他救家人。", effect: [1, 0, 0, 0] },
      { text: "D. 替他隐瞒泄密的事，坚定地向他承诺全队会一起解决他家人的危机。", effect: [2, 0, 0, 0] }
    ]
  },
  {
    text: "【小说设定】你进入了一个必须投票选出一人牺牲才能开门的死亡游戏。此时人群陷入混乱，你会：",
    options: [
      { text: "A. 挺身而出稳定局面，建立一套最公平的抽签或表决程序并严格执行。", effect: [0, -2, 0, 0] },
      { text: "B. 冷静观察局势，暗中引导选票投向那个对团队贡献最小或最不稳定的人。", effect: [0, -1, 0, 0] },
      { text: "C. 敏锐捕捉系统底层的逻辑漏洞，从框架外寻找诸如“平票”等破局点。", effect: [0, 1, 0, 0] },
      { text: "D. 拒绝顺应被编排的宿命，用绝对的力量或奇招直接“掀翻棋盘”。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【日常情境】处理某项行政手续时，你发现流程极其繁琐且效率低下，但“大家都这么做”，你会：",
    options: [
      { text: "A. 尊重既定秩序，按部就班走完所有流程，确保每一步合法合规无懈可击。", effect: [0, -2, 0, 0] },
      { text: "B. 寻找系统内的快速通道或打擦边球，在不违规的前提下大幅提升效率。", effect: [0, -1, 0, 0] },
      { text: "C. 采用极客思维，只抓核心节点，以最少的精力糊弄过冗余环节。", effect: [0, 1, 0, 0] },
      { text: "D. 直接跳出这套低效系统，用极具颠覆性的手段重构解决路径。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【小说设定】面对一个极其强大且正在高高在上宣讲“生存信条”的生肖，你的第一反应是：",
    options: [
      { text: "A. 表面保持极度的克制，大脑飞速解构他话语中透露出的每一条底层逻辑。", effect: [0, -2, 0, 0] },
      { text: "B. 混在人群中不发一言，像猎人一样冷静观察他能力的边界与限制。", effect: [0, -1, 0, 0] },
      { text: "C. 偶尔出言挑衅或质疑，在言语交锋中测试他的心理底线与思维盲区。", effect: [0, 1, 0, 0] },
      { text: "D. 相信“反派死于话多”，抓住他自满的瞬间直接发动致命奇袭。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【日常情境】你发现了一个可以让你少奋斗十年的漏洞（如系统漏洞或套利机会），但它会轻微扰乱公平秩序，你会：",
    options: [
      { text: "A. 坚守底线。深信只有在公正规则与长期主义下建立的基业才最稳固。", effect: [0, -2, 0, 0] },
      { text: "B. 在法律红线边缘进行精密测算，只要风险可控，就进行极小规模的试水。", effect: [0, -1, 0, 0] },
      { text: "C. 视规则为底层代码，利用漏洞进行“降维打击”是理性的博弈表现。", effect: [0, 1, 0, 0] },
      { text: "D. 毫不犹豫地抓住变量，在别人被陈旧规则束缚时完成阶级跨越。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【小说设定】你获得了一件可以欺骗“世界系统”的道具，但使用它意味着你彻底站到了现有生存秩序的对立面，你会：",
    options: [
      { text: "A. 暂时封存。在没有绝对把握前，不轻易打破现有的生存平衡态。", effect: [0, -2, 0, 0] },
      { text: "B. 制定极其详尽的沙盘推演，分阶段去测试系统的承受极限。", effect: [0, -1, 0, 0] },
      { text: "C. 意识到常规路径无法触及真相，果断选择这种离经叛道的方式破局。", effect: [0, 1, 0, 0] },
      { text: "D. 所谓的“天道”本身就是巨大的谎言，欺骗它就是最高的正义。", effect: [0, 2, 0, 0] }
    ]
  },
  {
    text: "【小说设定】每一场死亡游戏开始前，你最常见的状态是：",
    options: [
      { text: "A. 坐在一旁闭目凝神，在脑海中构建庞大的决策树，推演所有变量。", effect: [0, 0, -2, 0] },
      { text: "B. 细致检查装备和队友的状态，确保基本盘稳固后再行动。", effect: [0, 0, -1, 0] },
      { text: "C. 快速扫描周遭环境捕捉关键要素，保持开放的心态随遇而安。", effect: [0, 0, 1, 0] },
      { text: "D. 保持极高的专注度，相信自己能在千钧一发之际靠顶级本能破局。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【日常情境】在进行高强度的 FPS 竞技（如 CS/Valorant）时，你更偏好哪种打法？",
    options: [
      { text: "A. 极致的战术大师，每一个道具的落点和清点节奏都要分秒不差。", effect: [0, 0, -2, 0] },
      { text: "B. 坚如磐石的防守者，稳扎稳打控制地图资源，绝不给对面抓机会。", effect: [0, 0, -1, 0] },
      { text: "C. 灵活的战场游侠，根据小地图信息频繁转点，永远出现在敌人的盲区。", effect: [0, 0, 1, 0] },
      { text: "D. 压迫感极强的突破手，用绝对的枪法自信和非常规走位撕裂对方防线。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【小说设定】战斗中局势突变，你原本精密布局的计划被某个意外完全打碎，你会：",
    options: [
      { text: "A. 大脑瞬间完成过载重置，迅速启动预先准备好的 Plan B 乃至 Plan C。", effect: [0, 0, -2, 0] },
      { text: "B. 快速整合队友视角的碎片信息，重新评估后制定新的战术。", effect: [0, 0, -1, 0] },
      { text: "C. 放弃繁冗的思考，将身体交给肌肉记忆，本能往往比大脑更快。", effect: [0, 0, 1, 0] },
      { text: "D. 享受这种失控感！混沌无序的变局，恰恰是你猎杀敌人的最佳主场。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【日常情境】准备一次重要的项目汇报或考试时，你的风格倾向于：",
    options: [
      { text: "A. 准备无死角的知识导图，甚至连每一张 PPT 的台词和 Q&A 都严丝合缝。", effect: [0, 0, -2, 0] },
      { text: "B. 运用二八定律，精准打击核心考点和关键逻辑，确保收益最大化。", effect: [0, 0, -1, 0] },
      { text: "C. 依赖平时的框架积累，考前只需简单唤醒记忆即可从容应对。", effect: [0, 0, 1, 0] },
      { text: "D. 拒绝死板的背诵，深信自己强大的临场应变能力和发散思维。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【小说设定】有人提出了一个极其复杂、风险极大但成功后收益极高的“连环局”，你参与的动力在于：",
    options: [
      { text: "A. 沉迷于精妙绝伦的逻辑架构，看着命运的齿轮严丝合缝地转动让你愉悦。", effect: [0, 0, -2, 0] },
      { text: "B. 经过缜密测算后，得出这是跨越当前维度的唯一解，理智促使你入局。", effect: [0, 0, -1, 0] },
      { text: "C. 这种刀尖起舞的极高风险，能极大刺激你的肾上腺素并激发潜能。", effect: [0, 0, 1, 0] },
      { text: "D. 方案越繁琐你越没耐心，你只想以力破巧，最快速度斩获成果。", effect: [0, 0, 2, 0] }
    ]
  },
  {
    text: "【小说设定】如果需要选择一种在这个世界长期生存的姿态，你会选择：",
    options: [
      { text: "A. 成为完美闭环的独立战力，不拖累他人，也绝不将弱点暴露给任何人。", effect: [0, 0, 0, -2] },
      { text: "B. 组建极度精简的小型战术小队，仅接纳能力完全互补的绝对死党。", effect: [0, 0, 0, -1] },
      { text: "C. 融入一个成熟运转的大型组织，利用体制的网络分摊巨大的生存风险。", effect: [0, 0, 0, 1] },
      { text: "D. 登高一呼，建立并领导属于自己的宏大势力，招募千军万马共同破局。", effect: [0, 0, 0, 2] }
    ]
  },
  {
    text: "【日常情境】当你需要完成一项极其繁重的任务（如大作业或策划案）时，你更喜欢：",
    options: [
      { text: "A. 斩断一切社交链接，进入深度心流的“闭关模式”，这是你效率的巅峰。", effect: [0, 0, 0, -2] },
      { text: "B. 在图书馆等场域，偶尔能和同频的伙伴交换一次思路，但不深度绑定。", effect: [0, 0, 0, -1] },
      { text: "C. 发起敏捷小组协作，大家各自认领模块，遇到阻碍立刻进行头脑风暴。", effect: [0, 0, 0, 1] },
      { text: "D. 在语音房里和大家保持高频的交流与协作，团队的火热能为你提供无穷动能。", effect: [0, 0, 0, 2] }
    ]
  },
  {
    text: "【小说设定】如果胜利的关键道具只有一件，且只有持有者能觉醒强大的“回响”，你会：",
    options: [
      { text: "A. 确信交给自己才能发挥最大的战略价值，只有自己无坚不摧才能护住全盘。", effect: [0, 0, 0, -2] },
      { text: "B. 制定量化考核标准，依据战场上的实际贡献度进行公平分配，冷酷但服众。", effect: [0, 0, 0, -1] },
      { text: "C. 精准评估每个人的异能相性，将其分配给能打出最强联动效果的队友。", effect: [0, 0, 0, 1] },
      { text: "D. 毫不犹豫地让给最信任的同伴，你无比享受那种在幕后运筹帷幄成全一切的感觉。", effect: [0, 0, 0, 2] }
    ]
  },
  {
    text: "【日常情境】忙碌了一整周，周末你最渴望的解压方式是：",
    options: [
      { text: "A. 享受高质量的独处时光，沉浸在单机大作或深度阅读中，回血效果极佳。", effect: [0, 0, 0, -2] },
      { text: "B. 邀约一两位知根知底的挚友，在安静的环境里进行极具深度的精神交流。", effect: [0, 0, 0, -1] },
      { text: "C. 投入一场高质量的社交局或剧本杀，在思维的碰撞中汲取新鲜的能量。", effect: [0, 0, 0, 1] },
      { text: "D. 担当大型派对或露营的主理人，协调好每个人的体验，你在人群中闪闪发光。", effect: [0, 0, 0, 2] }
    ]
  },
  {
    text: "【小说设定】最后生还之门就在眼前，但必须有人殿后抵挡追兵，且那个人大概率会死，你会：",
    options: [
      { text: "A. 摒弃一切无谓的感伤，在零点一秒内做出最高效的判断——活下去才有输出。", effect: [0, 0, 0, -2] },
      { text: "B. 大脑在极速运转，冷酷地推算出一套损失最小的“弃子”战术并下达指令。", effect: [0, 0, 0, -1] },
      { text: "C. 承受着撕裂般的痛苦，但在理性的驱使下听从指挥，背负着前人的命走下去。", effect: [0, 0, 0, 1] },
      { text: "D. 发出怒吼转身横刀立于阵前，燃尽生命最后的余晖，为身后的战友斩出黎明。", effect: [0, 0, 0, 2] }
    ]
  }
]

const currentQuestion = computed(() => questions[currentQuestionIndex.value])
const progress = computed(() => (currentQuestionIndex.value / questions.length) * 100)

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
  userScores.value = userScores.value.map((score, index) => score + effect[index])
  if (currentQuestionIndex.value < questions.length - 1) {
    currentQuestionIndex.value++
  } else {
    calculateResult()
  }
}

const calculateResult = () => {
  const maxDistance = 40
  let results = characters.map((char) => {
    let distanceSq = 0
    for (let i = 0; i < 4; i++) {
      distanceSq += Math.pow(userScores.value[i] - char.coords[i], 2)
    }
    let distance = Math.sqrt(distanceSq)
    let matchRate = Math.max(0, ((1 - distance / maxDistance) * 100)).toFixed(1)
    return { ...char, matchRate }
  })
  results.sort((a, b) => b.matchRate - a.matchRate)
  topMatches.value = results.slice(0, 2)
  state.value = 'result'
}

const resetTest = () => {
  state.value = 'start'
}
</script>

<style>
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>