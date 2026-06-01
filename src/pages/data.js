/**
 * 静态数据配置
 */

// 图片资源
// 资源前缀：适配子路径部署（如 Gitee Pages）。根路径时为空字符串。
const ASSET_BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
export const IMG = {
  hero1: ASSET_BASE + '/pptx-imgs/hero1.jpeg',
  hero2: ASSET_BASE + '/pptx-imgs/stage_perf.jpg',
  hero3: ASSET_BASE + '/pptx-imgs/hero3_new.png',
  modCommunity: ASSET_BASE + '/pptx-imgs/mod1.jpeg',
  modDrama: ASSET_BASE + '/pptx-imgs/mod2.png',
  modDigital: ASSET_BASE + '/pptx-imgs/mod3.png',
  prod1: ASSET_BASE + '/pptx-imgs/banggu_drawing.jpg',
  prod2: ASSET_BASE + '/pptx-imgs/mall_diy_kit.jpg',
  prod3: ASSET_BASE + '/pptx-imgs/banggu_instruments.jpg',
  prod4: ASSET_BASE + '/pptx-imgs/mall_pendant.jpg',
  prod5: ASSET_BASE + '/pptx-imgs/mall_ceramic.jpg',
  prod6: ASSET_BASE + '/pptx-imgs/mall_album.jpg',
  course1: ASSET_BASE + '/pptx-imgs/heritage2.png',
  course2: ASSET_BASE + '/pptx-imgs/mod2.png',
  course3: ASSET_BASE + '/pptx-imgs/mod3.png',
  announcement: ASSET_BASE + '/pptx-imgs/heritage1.jpeg',
  dramaCard: ASSET_BASE + '/pptx-imgs/mod4.png',
  lightCard: ASSET_BASE + '/pptx-imgs/mod1.jpeg',
  stagePerf: ASSET_BASE + '/pptx-imgs/stage_perf.jpg',
  teaching: ASSET_BASE + '/pptx-imgs/teaching.jpg',
  pavilionArt: ASSET_BASE + '/pptx-imgs/pavilion_art.jpg',
  newsDangui: ASSET_BASE + '/pptx-imgs/news_dangui.jpg',
  newsMazu: ASSET_BASE + '/pptx-imgs/news_mazu.jpg',
  cultureHall: ASSET_BASE + '/pptx-imgs/culture_hall.jpg',
  bangguInstruments: ASSET_BASE + '/pptx-imgs/banggu_instruments.jpg',
  bangguDrawing: ASSET_BASE + '/pptx-imgs/banggu_drawing.jpg',
}

// Hero 幻灯片
export const heroSlides = [
  { image: IMG.hero1, subtitle: '国家级非物质文化遗产 · 源于宋代，千年鼓乐传承' },
  { image: IMG.hero2, subtitle: '莆田传统曲艺 · 舞台展演 · 省市级曲艺赛事屡获殊荣' },
  { image: IMG.hero3, subtitle: '传承匠心技艺 · 走进梆鼓咚的千年文化世界' },
]

// 导航项
export const navItems = [
  { label: '首页', href: '#/home', route: 'home' },
  { label: '非遗作品', href: '#/works', route: 'works' },
  { label: '传承人', href: '#/inheritors', route: 'inheritors' },
  { label: '活动中心', href: '#/activities', route: 'activities' },
  { label: '在线课程', href: '#/course', route: 'course' },
  { label: '手办商城', href: '#/mall', route: 'mall' },
  { label: '小游戏', href: '#/game', route: 'game' },
  { label: 'AI助手', href: '#/qa', route: 'qa' },
  { label: '个人中心', href: '#/profile', route: 'profile' },
]

// 公告
export const announcements = [
  { title: '2025年梆鼓咚传习所公开课暨展演活动公告', date: '2025-03-01' },
  { title: '莆田学院梆鼓咚选修课第二期招募公告', date: '2025-03-08' },
  { title: '梆鼓咚申报国家级非遗进展汇报展览公告', date: '2025-03-15' },
  { title: '福建省非遗文化节梆鼓咚濒危曲种专场公告', date: '2025-03-20' },
]

// 产品列表
export const products = [
  { id: 1, name: '梆鼓咚科普绘本', price: 58.0, originalPrice: 78, category: '文化读物', tags: ['文化教育', '亲子读物'], stock: 200, sales: 860, image: IMG.prod1, desc: '以梆鼓咚为主题的原创科普绘本，图文并茂讲述千年鼓乐故事，配有莆仙方言注音，适合亲子共读与文化启蒙。' },
  { id: 2, name: '梆鼓咚DIY材料包', price: 45.0, originalPrice: 68, category: '手工材料', tags: ['手工体验', '文化教育'], stock: 150, sales: 520, image: IMG.prod2, desc: '含竹筒、蒙皮、彩色缎带等全套材料，附教学手册与视频教程，亲手制作一面属于自己的板鼓，体验非遗传承乐趣。' },
  { id: 3, name: '梆鼓咚超轻粘土套装', price: 36.0, originalPrice: 48, category: '手工材料', tags: ['手工体验', '亲子读物'], stock: 300, sales: 720, image: IMG.prod3, desc: '12色超轻粘土搭配板鼓、竹板模具，附图解说明书，可捏制迷你梆鼓咚乐器全套，适合儿童手工课与亲子活动。' },
  { id: 4, name: '梆鼓咚板鼓迷你挂件', price: 28.0, originalPrice: 38, category: '文创周边', tags: ['文创礼品', '随身配饰'], stock: 500, sales: 1200, image: IMG.prod4, desc: '精致缩小版板鼓造型挂件，手工编织彩色缎带流苏，可挂书包、钥匙扣，既是装饰也是非遗文化的随身名片。' },
  { id: 5, name: '梆鼓咚陶瓷乐器摆件', price: 198.0, originalPrice: 258, category: '文创周边', tags: ['文创礼品', '收藏品'], stock: 60, sales: 156, image: IMG.prod5, desc: '非遗传承人监制，以陶瓷还原板鼓与竹板造型，釉色温润，底座刻有梆鼓咚简介，是馈赠与收藏的文化精品。' },
  { id: 6, name: '梆鼓咚演出纪念册', price: 68.0, originalPrice: 88, category: '文化读物', tags: ['文创礼品', '收藏品'], stock: 100, sales: 280, image: IMG.prod6, desc: '收录梆鼓咚经典演出剧照与幕后故事，含传承人访谈、曲目解读、演奏技巧图解，精装铜版纸印刷，是了解与收藏梆鼓咚艺术的珍贵资料。' },
]

// 商品标签
export const mallTags = ['全部', '文化教育', '手工体验', '文创礼品', '亲子读物', '随身配饰', '收藏品']

// 非遗作品
export const heritageWorks = [
  { id: 1, title: '梆鼓咚·传统鼓乐展演', category: '曲艺', author: '莆田梆鼓咚传习所', location: '福建莆田', image: IMG.stagePerf, badge: '音乐' },
  { id: 2, title: '梆鼓咚·节庆民俗表演', category: '民俗', author: '莆田市非遗保护中心', location: '福建莆田', image: IMG.modCommunity, badge: '民俗' },
  { id: 3, title: '梆鼓咚·启蒙课程记录', category: '曲艺', author: '莆田市实验小学', location: '福建莆田', image: IMG.teaching, badge: '音乐' },
  { id: 4, title: '梆鼓咚·传统器乐合奏', category: '曲艺', author: '莆田梆鼓咚艺术团', location: '福建莆田', image: IMG.modDrama, badge: '音乐' },
  { id: 5, title: '梆鼓咚·走进社区活动', category: '民俗', author: '荔城区文化馆', location: '福建莆田荔城区', image: IMG.cultureHall, badge: '民俗' },
  { id: 6, title: '梆鼓咚·乐器制作工艺', category: '手工艺', author: '莆田传统乐器工坊', location: '福建莆田', image: IMG.modDigital, badge: '手工艺' },
  { id: 7, title: '梆鼓咚·研学体验营', category: '民俗', author: '莆田市文旅局', location: '福建莆田', image: IMG.pavilionArt, badge: '民俗' },
  { id: 8, title: '梆鼓咚·非遗传承汇演', category: '曲艺', author: '福建省非遗保护协会', location: '福建莆田', image: IMG.announcement, badge: '音乐' },
]

// 传承人数据
export const inheritorsData = [
  {
    id: 1,
    name: '黄文栋',
    title: '梆鼓咚第四代核心传承人（1931—2019）',
    location: '福建莆田',
    biography: '黄文栋自幼随父学习梆鼓咚技艺，是梆鼓咚第四代核心传承人。他长期活跃于莆田民间演出舞台，一生参与演出逾千场，是中国曲艺志福建卷中有正式记录的传承人之一。晚年仍积极参与传习活动，将核心曲目口传给第五代传承人，为梆鼓咚技艺的延续作出了不可替代的贡献。',
    achievements: ['福建省民间文化优秀十大传承人荣誉获得者', '收录于《中国曲艺志·福建卷》正式记录', '晚年完成梆鼓咚核心曲目的完整口传'],
  },
  {
    id: 2,
    name: '陈德来',
    title: '梆鼓咚省级非物质文化遗产代表性传承人',
    location: '福建莆田荔城区',
    biography: '陈德来长期扎根荔城区，是梆鼓咚省级非遗代表性传承人。他专注于民间演出与曲目口传，参与整理了多首濒临失传的梆鼓咚传统曲目，多次在省市非遗展演中登台表演，是荔城区梆鼓咚传习的重要骨干力量。',
    achievements: ['省级非物质文化遗产代表性传承人', '参与整理多首濒危传统曲目', '多次参与省市级非遗展演'],
  },
  {
    id: 3,
    name: '林秀珍',
    title: '梆鼓咚省级非物质文化遗产代表性传承人',
    location: '福建莆田城厢区',
    biography: '林秀珍是城厢区梆鼓咚省级非遗代表性传承人，多年来积极投身非遗传播与社区推广活动。她参与过多届福建省非遗文化节，并曾赴各地展演，是梆鼓咚女性传承人的代表性人物。',
    achievements: ['省级非物质文化遗产代表性传承人', '多届福建省非遗文化节参演者', '城厢区非遗推广骨干'],
  },
  {
    id: 4,
    name: '郑明辉',
    title: '梆鼓咚省级非物质文化遗产代表性传承人',
    location: '福建莆田涵江区',
    biography: '郑明辉是涵江区梆鼓咚省级非遗代表性传承人，负责涵江区传习推广工作。他长期在社区和学校组织梆鼓咚体验活动，致力于将传统曲艺引入现代文化生活，是梆鼓咚在涵江地区传播的主要推动者。',
    achievements: ['省级非物质文化遗产代表性传承人', '涵江区梆鼓咚进校园活动组织者', '社区传习推广负责人'],
  },
  {
    id: 5,
    name: '吴春燕',
    title: '梆鼓咚市级非物质文化遗产代表性传承人',
    location: '福建莆田秀屿区',
    biography: '吴春燕是秀屿区梆鼓咚市级非遗代表性传承人，长期参与梆鼓咚进校园系列活动。她以亲身示范的方式，向中小学生传授梆鼓咚的基本节奏与演唱技巧，是秀屿区青少年传承工作的核心推动人。',
    achievements: ['市级非物质文化遗产代表性传承人', '秀屿区梆鼓咚进校园活动主导者'],
  },
  {
    id: 6,
    name: '黄志远',
    title: '梆鼓咚市级非物质文化遗产代表性传承人',
    location: '福建莆田仙游县',
    biography: '黄志远是仙游县梆鼓咚市级非遗代表性传承人，扎根乡村与社区，长期开展梆鼓咚的社区推广活动。他积极参与仙游县各类民俗节庆演出，将梆鼓咚融入地方文化生活，为技艺在仙游地区的留存发挥了重要作用。',
    achievements: ['市级非物质文化遗产代表性传承人', '仙游县梆鼓咚社区推广负责人'],
  },
  {
    id: 7,
    name: '黄璟',
    title: '梆鼓咚第五代传承人，唯一代表性传承人，莆田学院音乐学院副教授，首位将传统曲目记谱为五线谱的传承者',
    location: '福建莆田',
    biography: '黄璟是梆鼓咚第五代传承人，现任莆田学院音乐学院副教授。他是梆鼓咚唯一现任代表性传承人，长期承担核心教学与学术研究工作。2023年，在他的主导推动下，梆鼓咚成功申报省级非遗，并于同年首次将无乐谱的传统曲目完整记录为五线谱，实现了技艺的数字化保存。他带领学生苏越与陈吉在福建省第五届曲艺大赛中荣获新人奖。',
    achievements: ['梆鼓咚唯一现任代表性传承人', '首位将传统曲目记谱为五线谱的传承者', '主导2023年梆鼓咚申遗成功', '莆田学院音乐学院副教授'],
  },
  {
    id: 8,
    name: '林季君',
    title: '梆鼓咚第五代传承人，莆田学院音乐学院客座教授，省级中学音乐学科教学带头人，专注青少年传承传播',
    location: '福建莆田',
    biography: '林季君是梆鼓咚第五代传承人，现任莆田学院音乐学院客座教授，同时是省级中学音乐学科教学带头人。她专注于青少年传承体系建设，推动梆鼓咚进入筱塘小学、莆田一中等多所学校的常规课程，并参与构建大中小幼一体化传承模式，是梆鼓咚向年轻世代传播的重要推手。',
    achievements: ['梆鼓咚第五代传承人', '省级中学音乐学科教学带头人', '大中小幼一体化传承体系建设者'],
  },
]

// 活动数据
export const activitiesData = [
  { id: 1, title: '梆鼓咚传习所公开展演暨体验活动', type: '体验', status: '报名中', location: '福建省莆田市荔城区梆鼓咚传习所', date: '2025-11-25', image: IMG.stagePerf },
  { id: 2, title: '梆鼓咚传承人与青少年交流展演晚会', type: '演出', status: '进行中', location: '福建省莆田市文化艺术中心', date: '2025-11-15', image: IMG.modDrama },
  { id: 3, title: '群众文化大学堂·梆鼓咚专场讲座', type: '讲座', status: '报名中', location: '福建省莆田市群众文化大学堂', date: '2026-03-28', image: IMG.cultureHall },
  { id: 4, title: '梆鼓咚进校园节奏启蒙互动课（莆田学院合作班）', type: '体验', status: '报名中', location: '福建省莆田学院音乐学院', date: '2026-04-05', image: IMG.teaching },
  { id: 5, title: '梆鼓咚研学营·板鼓制作与四技法演奏体验', type: '研学', status: '报名中', location: '福建省莆田市仙游县梆鼓咚工坊', date: '2026-04-20', image: IMG.modDigital },
]

// 课程数据
export const coursesData = [
  { id: 1, title: '梆鼓咚基础节奏入门：响鼓与边鼓技法', lessons: 6, level: '初级', image: IMG.modDrama },
  { id: 2, title: '板鼓与竹板：乐器构造与持奏方法', lessons: 4, level: '初级', image: IMG.modCommunity },
  { id: 3, title: '梆鼓咚传统曲目精讲（70余首选讲）', lessons: 5, level: '中级', image: IMG.stagePerf },
  { id: 4, title: '梆鼓咚历史源流：宋代起源与千年传承', lessons: 4, level: '初级', image: IMG.pavilionArt },
  { id: 5, title: '四种音响技法：响鼓·边鼓·点鼓·闷鼓', lessons: 5, level: '高级', image: ASSET_BASE + '/pptx-imgs/course1.png' },
  { id: 6, title: '莆仙方言与梆鼓咚：兴化语基础与演唱押韵', lessons: 6, level: '中级', image: ASSET_BASE + '/pptx-imgs/course2.png' },
  { id: 7, title: '梆鼓咚非遗DIY：乐器制作与文创创新', lessons: 4, level: '中级', image: IMG.modDigital },
  { id: 8, title: '梆鼓咚表演实践：从依赖到独立登台', lessons: 8, level: '高级', image: IMG.teaching },
]

// 作品分类
export const worksCategories = ['全部', '曲艺', '民俗', '手工艺', '戏曲', '舞蹈', '仪典', '医药', '建筑', '音乐', '文学']

// AI问答默认问题
export const defaultQuestion = '梆鼓咚适合什么年龄段的学生开始学习？'

export default {
  IMG,
  heroSlides,
  navItems,
  announcements,
  products,
  mallTags,
  heritageWorks,
  inheritorsData,
  activitiesData,
  coursesData,
  worksCategories,
  defaultQuestion
}
