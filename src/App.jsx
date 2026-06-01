import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import './App.css'
import './accessibility.css'
import './responsive.css'
import ClickEffect from './ClickEffect'
import { ScrollReveal } from './components/PageTransition'
import { LazyImage, LoadingButton } from './components/Skeleton'
import { safeGetItem, safeSetItem } from './utils/storage'

// 性能优化：路由和状态管理
import { parseRoute } from './routes'

// 页面组件懒加载
const ProfilePage = lazy(() => import('./pages/Profile'))

// 加载占位符
function PageSkeleton() {
  return (
    <div className="page-skeleton" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div className="skeleton-spinner" style={{ margin: '0 auto 16px', width: '40px', height: '40px', border: '3px solid var(--divider)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      加载中...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Scroll Reveal Hook ────────────────────────────────────────────────────
function useScrollReveal(selector, routeName) {
  const observerRef = useRef(null)
  
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    const elements = document.querySelectorAll(selector)
    if (elements.length === 0) return
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observerRef.current?.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    
    elements.forEach((el) => observerRef.current?.observe(el))
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [selector, routeName])
}

// ── Instrument Audio (Web Audio API synthesis) ────────────────────────────
const audioCtxRef = { current: null }
function getAudioCtx() {
  if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
  const ctx = audioCtxRef.current
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playDrum() {
  const ctx = getAudioCtx(), t = ctx.currentTime
  // 低频鼓声
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, t)
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.15)
  gain.gain.setValueAtTime(0.8, t)
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.4)
  // 噪声层
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3
  const noise = ctx.createBufferSource()
  const ng = ctx.createGain()
  noise.buffer = buf
  ng.gain.setValueAtTime(0.5, t)
  ng.gain.exponentialRampToValueAtTime(0.01, t + 0.08)
  noise.connect(ng).connect(ctx.destination)
  noise.start(t)
}

function playBangzi() {
  const ctx = getAudioCtx(), t = ctx.currentTime
  // 高频木质敲击
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(800, t)
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.06)
  gain.gain.setValueAtTime(0.4, t)
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.12)
  // 木质谐波
  const osc2 = ctx.createOscillator()
  const g2 = ctx.createGain()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(1200, t)
  osc2.frequency.exponentialRampToValueAtTime(600, t + 0.05)
  g2.gain.setValueAtTime(0.25, t)
  g2.gain.exponentialRampToValueAtTime(0.01, t + 0.08)
  osc2.connect(g2).connect(ctx.destination)
  osc2.start(t)
  osc2.stop(t + 0.08)
}

function playZhuban() {
  const ctx = getAudioCtx(), t = ctx.currentTime
  // 快板 — 竹片碰撞的尖锐"啪"声，极短衰减
  const clack = (time, vol) => {
    // 核心：极短白噪声脉冲，模拟竹片撞击瞬间
    const len = Math.floor(ctx.sampleRate * 0.015) // 15ms 极短
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      // 前段更响，快速衰减，模拟撞击瞬态
      const env = Math.exp(-i / (len * 0.15))
      d[i] = (Math.random() * 2 - 1) * env
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    // 高通滤波 — 去掉低频，只留清脆的"啪"
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 4000
    // 峰值滤波 — 突出竹子特有的尖锐频率
    const peak = ctx.createBiquadFilter()
    peak.type = 'peaking'
    peak.frequency.value = 6000
    peak.gain.value = 8
    peak.Q.value = 3
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025)
    src.connect(hp).connect(peak).connect(gain).connect(ctx.destination)
    src.start(time)
  }
  // 快板经典节奏：啪 · 啪啪 · 啪（重-轻轻-重）
  clack(t, 0.9)
  clack(t + 0.1, 0.55)
  clack(t + 0.16, 0.55)
  clack(t + 0.28, 0.85)
}

function playXingmu() {
  const ctx = getAudioCtx(), t = ctx.currentTime
  // 短促有力 — 木块敲击
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(500, t)
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.04)
  gain.gain.setValueAtTime(0.6, t)
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.08)
  // 击打噪声
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5
  const noise = ctx.createBufferSource()
  const ng = ctx.createGain()
  noise.buffer = buf
  ng.gain.setValueAtTime(0.5, t)
  ng.gain.exponentialRampToValueAtTime(0.01, t + 0.03)
  noise.connect(ng).connect(ctx.destination)
  noise.start(t)
}

const INSTR_SOUNDS = {
  drum: playDrum, 'sm-drum': playDrum,
  bangzi: playBangzi, 'sm-bang': playBangzi,
  zhuban: playZhuban, xingmu: playXingmu,
}

const INSTR_NAMES = {
  drum: '鼓', 'sm-drum': '小鼓',
  bangzi: '梆子', 'sm-bang': '梆子',
  zhuban: '竹板', xingmu: '醒木',
}

// ── Images ────────────────────────────────────────────────────────────────
const IMG = {
  hero1: '/pptx-imgs/hero1.jpeg',
  hero2: '/pptx-imgs/stage_perf.jpg',
  hero3: '/pptx-imgs/hero3_new.png',
  modCommunity: '/pptx-imgs/mod1.jpeg',
  modDrama: '/pptx-imgs/mod2.png',
  modDigital: '/pptx-imgs/mod3.png',
  prod1: '/pptx-imgs/banggu_drawing.jpg',
  prod2: '/pptx-imgs/mall_diy_kit.jpg',
  prod3: '/pptx-imgs/banggu_instruments.jpg',
  prod4: '/pptx-imgs/mall_pendant.jpg',
  prod5: '/pptx-imgs/mall_ceramic.jpg',
  prod6: '/pptx-imgs/mall_album.jpg',
  course1: '/pptx-imgs/heritage2.png',
  course2: '/pptx-imgs/mod2.png',
  course3: '/pptx-imgs/mod3.png',
  announcement: '/pptx-imgs/heritage1.jpeg',
  dramaCard: '/pptx-imgs/mod4.png',
  lightCard: '/pptx-imgs/mod1.jpeg',
  stagePerf: '/pptx-imgs/stage_perf.jpg',
  teaching: '/pptx-imgs/teaching.jpg',
  pavilionArt: '/pptx-imgs/pavilion_art.jpg',
  newsDangui: '/pptx-imgs/news_dangui.jpg',
  newsMazu: '/pptx-imgs/news_mazu.jpg',
  cultureHall: '/pptx-imgs/culture_hall.jpg',
  bangguInstruments: '/pptx-imgs/banggu_instruments.jpg',
  bangguDrawing: '/pptx-imgs/banggu_drawing.jpg',
}

// ── Hero carousel slides ─────────────────────────────────────────────────────
const heroSlides = [
  { image: IMG.hero1, subtitle: '国家级非物质文化遗产 · 源于宋代，千年鼓乐传承' },
  { image: IMG.hero2, subtitle: '莆田传统曲艺 · 舞台展演 · 省市级曲艺赛事屡获殊荣' },
  { image: IMG.hero3, subtitle: '传承匠心技艺 · 走进梆鼓咚的千年文化世界' },
]

// ── Static data ─────────────────────────────────────────────────────────────
const navItems = [
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


const announcements = [
  { title: '2025年梆鼓咚传习所公开课暨展演活动公告', date: '2025-03-01' },
  { title: '莆田学院梆鼓咚选修课第二期招募公告', date: '2025-03-08' },
  { title: '梆鼓咚申报国家级非遗进展汇报展览公告', date: '2025-03-15' },
  { title: '福建省非遗文化节梆鼓咚濒危曲种专场公告', date: '2025-03-20' },
]

const products = [
  { id: 1, name: '梆鼓咚科普绘本', price: 58.0, originalPrice: 78, category: '文化读物', tags: ['文化教育', '亲子读物'], stock: 200, sales: 860, image: IMG.prod1, desc: '以梆鼓咚为主题的原创科普绘本，图文并茂讲述千年鼓乐故事，配有莆仙方言注音，适合亲子共读与文化启蒙。' },
  { id: 2, name: '梆鼓咚DIY材料包', price: 45.0, originalPrice: 68, category: '手工材料', tags: ['手工体验', '文化教育'], stock: 150, sales: 520, image: IMG.prod2, desc: '含竹筒、蒙皮、彩色缎带等全套材料，附教学手册与视频教程，亲手制作一面属于自己的板鼓，体验非遗传承乐趣。' },
  { id: 3, name: '梆鼓咚超轻粘土套装', price: 36.0, originalPrice: 48, category: '手工材料', tags: ['手工体验', '亲子读物'], stock: 300, sales: 720, image: IMG.prod3, desc: '12色超轻粘土搭配板鼓、竹板模具，附图解说明书，可捏制迷你梆鼓咚乐器全套，适合儿童手工课与亲子活动。' },
  { id: 4, name: '梆鼓咚板鼓迷你挂件', price: 28.0, originalPrice: 38, category: '文创周边', tags: ['文创礼品', '随身配饰'], stock: 500, sales: 1200, image: IMG.prod4, desc: '精致缩小版板鼓造型挂件，手工编织彩色缎带流苏，可挂书包、钥匙扣，既是装饰也是非遗文化的随身名片。' },
  { id: 5, name: '梆鼓咚陶瓷乐器摆件', price: 198.0, originalPrice: 258, category: '文创周边', tags: ['文创礼品', '收藏品'], stock: 60, sales: 156, image: IMG.prod5, desc: '非遗传承人监制，以陶瓷还原板鼓与竹板造型，釉色温润，底座刻有梆鼓咚简介，是馈赠与收藏的文化精品。' },
  { id: 6, name: '梆鼓咚演出纪念册', price: 68.0, originalPrice: 88, category: '文化读物', tags: ['文创礼品', '收藏品'], stock: 100, sales: 280, image: IMG.prod6, desc: '收录梆鼓咚经典演出剧照与幕后故事，含传承人访谈、曲目解读、演奏技巧图解，精装铜版纸印刷，是了解与收藏梆鼓咚艺术的珍贵资料。' },
]

const mallTags = ['全部', '文化教育', '手工体验', '文创礼品', '亲子读物', '随身配饰', '收藏品']


const defaultQuestion = '梆鼓咚适合什么年龄段的学生开始学习？'

// ── Heritage works ─────────────────────────────────────────────────────────
const heritageWorks = [
  { id: 1, title: '梆鼓咚·传统鼓乐展演', category: '曲艺', author: '莆田梆鼓咚传习所', location: '福建莆田', image: IMG.stagePerf, badge: '音乐' },
  { id: 2, title: '梆鼓咚·节庆民俗表演', category: '民俗', author: '莆田市非遗保护中心', location: '福建莆田', image: IMG.modCommunity, badge: '民俗' },
  { id: 3, title: '梆鼓咚·启蒙课程记录', category: '曲艺', author: '莆田市实验小学', location: '福建莆田', image: IMG.teaching, badge: '音乐' },
  { id: 4, title: '梆鼓咚·传统器乐合奏', category: '曲艺', author: '莆田梆鼓咚艺术团', location: '福建莆田', image: IMG.modDrama, badge: '音乐' },
  { id: 5, title: '梆鼓咚·走进社区活动', category: '民俗', author: '荔城区文化馆', location: '福建莆田荔城区', image: IMG.cultureHall, badge: '民俗' },
  { id: 6, title: '梆鼓咚·乐器制作工艺', category: '手工艺', author: '莆田传统乐器工坊', location: '福建莆田', image: IMG.modDigital, badge: '手工艺' },
  { id: 7, title: '梆鼓咚·研学体验营', category: '民俗', author: '莆田市文旅局', location: '福建莆田', image: IMG.pavilionArt, badge: '民俗' },
  { id: 8, title: '梆鼓咚·非遗传承汇演', category: '曲艺', author: '福建省非遗保护协会', location: '福建莆田', image: IMG.announcement, badge: '音乐' },
]

// ── Inheritors ────────────────────────────────────────────────────────────
const inheritorsData = [
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

// ── Activities ────────────────────────────────────────────────────────────
const activitiesData = [
  { id: 1, title: '梆鼓咚传习所公开展演暨体验活动', type: '体验', status: '报名中', location: '福建省莆田市荔城区梆鼓咚传习所', date: '2025-11-25', image: IMG.stagePerf },
  { id: 2, title: '梆鼓咚传承人与青少年交流展演晚会', type: '演出', status: '进行中', location: '福建省莆田市文化艺术中心', date: '2025-11-15', image: IMG.modDrama },
  { id: 3, title: '群众文化大学堂·梆鼓咚专场讲座', type: '讲座', status: '报名中', location: '福建省莆田市群众文化大学堂', date: '2026-03-28', image: IMG.cultureHall },
  { id: 4, title: '梆鼓咚进校园节奏启蒙互动课（莆田学院合作班）', type: '体验', status: '报名中', location: '福建省莆田学院音乐学院', date: '2026-04-05', image: IMG.teaching },
  { id: 5, title: '梆鼓咚研学营·板鼓制作与四技法演奏体验', type: '研学', status: '报名中', location: '福建省莆田市仙游县梆鼓咚工坊', date: '2026-04-20', image: IMG.modDigital },
]

// ── Courses ───────────────────────────────────────────────────────────────
const coursesData = [
  { id: 1, title: '梆鼓咚基础节奏入门：响鼓与边鼓技法', lessons: 6, level: '初级', image: IMG.modDrama },
  { id: 2, title: '板鼓与竹板：乐器构造与持奏方法', lessons: 4, level: '初级', image: IMG.modCommunity },
  { id: 3, title: '梆鼓咚传统曲目精讲（70余首选讲）', lessons: 5, level: '中级', image: IMG.stagePerf },
  { id: 4, title: '梆鼓咚历史源流：宋代起源与千年传承', lessons: 4, level: '初级', image: IMG.pavilionArt },
  { id: 5, title: '四种音响技法：响鼓·边鼓·点鼓·闷鼓', lessons: 5, level: '高级', image: '/pptx-imgs/course1.png' },
  { id: 6, title: '莆仙方言与梆鼓咚：兴化语基础与演唱押韵', lessons: 6, level: '中级', image: '/pptx-imgs/course2.png' },
  { id: 7, title: '梆鼓咚非遗DIY：乐器制作与文创创新', lessons: 4, level: '中级', image: IMG.modDigital },
  { id: 8, title: '梆鼓咚表演实践：从依赖到独立登台', lessons: 8, level: '高级', image: IMG.teaching },
]

const worksCategories = ['全部', '曲艺', '民俗', '手工艺', '戏曲', '舞蹈', '仪典', '医药', '建筑', '音乐', '文学']

// ── Route helper ─────────────────────────────────────────────────────────────
function getRouteFromHash() {
  return parseRoute(window.location.hash)
}

// ── Auth helpers ─────────────────────────────────────────────────────────────
function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function getStoredUsers() {
  const stored = safeGetItem('chuyi_users')
  if (Array.isArray(stored) && stored.length > 0) return stored
  return [{ username: 'adlix', password: '12345678', email: 'adlix@demo.com', nickname: 'John', bio: 'Hello, I am John' }]
}

function saveUsers(users) {
  safeSetItem('chuyi_users', users)
}

function getStoredAuth() {
  return safeGetItem('chuyi_auth_user', null)
}

function avatarUrl(name) {
  const colors = ['9f3b2f', '8B4513', '6B3A2A', 'A0522D', '7B2D26', '5C3317', '804020', '6A3028']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const bg = colors[Math.abs(hash) % colors.length]
  const fontSize = name.length <= 2 ? 40 : name.length === 3 ? 32 : 26
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="%23${bg}"/><text x="64" y="64" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${fontSize}" font-family="'Ma Shan Zheng','STKaiti','KaiTi',sans-serif">${name}</text></svg>`
  return `data:image/svg+xml,${svg}`
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [route, setRoute] = useState(getRouteFromHash)
  const [worksCategory, setWorksCategory] = useState('全部')
  const [question, setQuestion] = useState(defaultQuestion)
  const [answer, setAnswer] = useState('这里会显示课程答疑、术语解释、学习建议和传播方案。')
  const [askedQuestion, setAskedQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [worksSearch, setWorksSearch] = useState('')
  const [inheritorsSearch, setInheritorsSearch] = useState('')
  const [activitiesSearch, setActivitiesSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [activitiesFilter, setActivitiesFilter] = useState('全部')
  const [courseFilter, setCourseFilter] = useState('全部分类')
  const [inheritorsFilter, setInheritorsFilter] = useState('全部')
  const [sortMode, setSortMode] = useState('default')
  const [activeTag, setActiveTag] = useState('全部')
  const [showAllTags, setShowAllTags] = useState(false)
  const [loginMode, setLoginMode] = useState('login')
  const [profileTab, setProfileTab] = useState('个人设置')
  const [heroSlide, setHeroSlide] = useState(0)
  const [toast, setToast] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ── Inheritor panel state ──
  const [selectedInheritor, setSelectedInheritor] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isPanelClosing, setIsPanelClosing] = useState(false)

  // ── Auth state ──
  const [user, setUser] = useState(getStoredAuth)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Login form
  const [loginForm, setLoginForm] = useState({ username: '', password: '', captcha: '' })
  const [loginErrors, setLoginErrors] = useState({})

  // Register form
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', confirmPassword: '', captcha: '' })
  const [regErrors, setRegErrors] = useState({})

  // ── Inheritor panel handlers ──
  const handleInheritorClick = (name) => {
    const canonical = inheritorsData.find(p => p.name === name) ?? {
      name, title: '', location: '', biography: '', achievements: [],
    }
    setSelectedInheritor(canonical)
    setIsPanelClosing(false)
    setIsPanelOpen(false)
    // 下一帧再添加 --open，让浏览器先渲染初始状态，CSS transition 才能触发
    requestAnimationFrame(() => setIsPanelOpen(true))
  }

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
    setIsPanelClosing(true)
  }, [])

  const handlePanelTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return
    if (isPanelClosing) {
      setSelectedInheritor(null)
      setIsPanelClosing(false)
    }
  }

  useEffect(() => {
    setSelectedInheritor(null)
    setIsPanelOpen(false)
    setIsPanelClosing(false)
  }, [route])

  // Close inheritor panel on Escape key
  useEffect(() => {
    if (!selectedInheritor) return
    const handleEsc = (e) => { if (e.key === 'Escape') handleClosePanel() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [selectedInheritor, handleClosePanel])

  // Captcha
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha)

  // Profile edit form
  const [profileForm, setProfileForm] = useState({ nickname: '', bio: '' })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [pwdErrors, setPwdErrors] = useState({})

  // ── Effects ──
  useEffect(() => {
    const updateRoute = () => {
      setRoute(getRouteFromHash())
      setMobileMenuOpen(false)
    }
    window.addEventListener('hashchange', updateRoute)
    if (!window.location.hash) window.location.hash = '#/home'
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const heroTimerRef = useRef(null)
  const isActiveRef = useRef(true)
  
  const resetHeroTimer = useCallback(() => {
    if (heroTimerRef.current) clearInterval(heroTimerRef.current)
    if (!isActiveRef.current) return
    heroTimerRef.current = setInterval(() => {
      if (isActiveRef.current) {
        setHeroSlide((s) => (s + 1) % heroSlides.length)
      }
    }, 5000)
  }, [])
  
  useEffect(() => {
    isActiveRef.current = true
    resetHeroTimer()
    return () => {
      isActiveRef.current = false
      clearInterval(heroTimerRef.current)
    }
  }, [resetHeroTimer])

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({ nickname: user.nickname || user.username, bio: user.bio || '' })
      setAvatarPreview(user.avatar || null)
    }
  }, [user])

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Scroll Reveal ──
  useScrollReveal('.section-heading', route.name)
  useScrollReveal('.reveal-up', route.name)
  useScrollReveal('.reveal-left', route.name)
  useScrollReveal('.reveal-scale', route.name)

  // ── Memo ──
  const filteredProducts = useMemo(() => {
    const byKeyword = products.filter((item) => {
      const keyword = searchText.trim().toLowerCase()
      if (!keyword) return true
      return item.name.toLowerCase().includes(keyword) || item.desc.toLowerCase().includes(keyword) || item.category.toLowerCase().includes(keyword)
    })
    const byTag = activeTag === '全部' ? byKeyword : byKeyword.filter((item) => item.tags.includes(activeTag) || item.category === activeTag)
    const sorted = [...byTag]
    if (sortMode === 'price-asc') sorted.sort((a, b) => a.price - b.price)
    if (sortMode === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sortMode === 'time') sorted.sort((a, b) => b.id - a.id)
    return sorted
  }, [activeTag, searchText, sortMode])

  const currentProduct = route.name === 'product' ? products.find((item) => item.id === route.id) || products[0] : null

  // ── Handlers ──
  async function handleAsk(event) {
    event.preventDefault()
    if (!question.trim()) { setError('请输入问题后再发送。'); return }
    setIsLoading(true); setError(''); setAnswer(''); setAskedQuestion(question)
    try {
      // 若配置了智谱 key（VITE_ZHIPU_API_KEY），浏览器直连 GLM-4-Flash —— 这样纯静态
      // 托管（Gitee / GitHub Pages，国内可访问）也能用 AI 问答，无需后端；否则回退到
      // /api/qa 后端（Vercel，密钥在服务端不外泄）。
      const zhipuKey = import.meta.env.VITE_ZHIPU_API_KEY
      if (zhipuKey) {
        const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${zhipuKey}` },
          body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [
              { role: 'system', content: '你是梆鼓咚非遗课程网站的 AI 助手。请用简洁、自然、面向学生和公众的中文直接回答，不要输出思考过程，优先回答课程学习、非遗背景、传播方式、文创体验等问题。' },
              { role: 'user', content: question },
            ],
            temperature: 0.7,
            max_tokens: 512,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || '问答接口暂时不可用。')
        setAnswer(data.choices?.[0]?.message?.content?.trim() || '接口已连通，但本次没有返回可显示的内容。')
      } else {
        const res = await fetch('/api/qa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || '问答接口暂时不可用。')
        setAnswer(data.answer)
      }
    } catch (requestError) {
      setError(requestError.message || '问答接口暂时不可用。')
    } finally {
      setIsLoading(false)
    }
  }

  function addToCart(productName) {
    setCartCount((c) => c + 1)
    setToast(`商品 ${productName} 已加入购物车`)
  }

  function handleLogin(event) {
    event.preventDefault()
    const errors = {}
    if (!loginForm.username.trim()) errors.username = '请输入账号'
    if (!loginForm.password) errors.password = '请输入密码'
    if (!loginForm.captcha.trim()) errors.captcha = '请输入验证码'
    else if (loginForm.captcha.toLowerCase() !== captchaCode.toLowerCase()) {
      errors.captcha = '验证码错误，请重试'
      setCaptchaCode(generateCaptcha())
    }
    if (Object.keys(errors).length > 0) { setLoginErrors(errors); return }

    const users = getStoredUsers()
    const found = users.find((u) => u.username === loginForm.username && u.password === loginForm.password)
    if (!found) {
      setLoginErrors({ general: '账号或密码错误，请重试' })
      setCaptchaCode(generateCaptcha())
      return
    }

    const authUser = { username: found.username, email: found.email, nickname: found.nickname || found.username, bio: found.bio || '' }
    localStorage.setItem('chuyi_auth_user', JSON.stringify(authUser))
    setUser(authUser)
    setLoginErrors({})
    setLoginForm({ username: '', password: '', captcha: '' })
    setCaptchaCode(generateCaptcha())
    window.location.hash = '#/home'
    setToast(`欢迎回来，${authUser.nickname}！`)
  }

  function handleRegister(event) {
    event.preventDefault()
    const errors = {}
    if (!regForm.username.trim()) errors.username = '请输入用户名'
    else if (regForm.username.length < 3) errors.username = '用户名至少 3 个字符'
    if (!regForm.email.trim()) errors.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) errors.email = '邮箱格式不正确'
    if (!regForm.password) errors.password = '请输入密码'
    else if (regForm.password.length < 6) errors.password = '密码至少 6 个字符'
    if (regForm.password !== regForm.confirmPassword) errors.confirmPassword = '两次密码不一致'
    if (!regForm.captcha.trim()) errors.captcha = '请输入验证码'
    else if (regForm.captcha.toLowerCase() !== captchaCode.toLowerCase()) {
      errors.captcha = '验证码错误，请重试'
      setCaptchaCode(generateCaptcha())
    }
    if (Object.keys(errors).length > 0) { setRegErrors(errors); return }

    const users = getStoredUsers()
    if (users.find((u) => u.username === regForm.username)) {
      setRegErrors({ username: '该用户名已被占用' }); return
    }

    const newUser = { username: regForm.username, password: regForm.password, email: regForm.email, nickname: regForm.username, bio: '' }
    saveUsers([...users, newUser])

    const authUser = { username: newUser.username, email: newUser.email, nickname: newUser.nickname, bio: '' }
    localStorage.setItem('chuyi_auth_user', JSON.stringify(authUser))
    setUser(authUser)
    setRegErrors({})
    setRegForm({ username: '', email: '', password: '', confirmPassword: '', captcha: '' })
    setCaptchaCode(generateCaptcha())
    window.location.hash = '#/home'
    setToast(`注册成功，欢迎 ${authUser.nickname}！`)
  }

  function handleLogout() {
    localStorage.removeItem('chuyi_auth_user')
    setUser(null)
    setShowUserMenu(false)
    window.location.hash = '#/home'
    setToast('已成功退出登录')
  }

  function handleProfileSave(event) {
    event.preventDefault()
    if (!profileForm.nickname.trim()) return
    const updated = { ...user, nickname: profileForm.nickname.trim(), bio: profileForm.bio, avatar: avatarPreview || user.avatar || null }
    localStorage.setItem('chuyi_auth_user', JSON.stringify(updated))
    const users = getStoredUsers().map((u) => u.username === updated.username ? { ...u, nickname: updated.nickname, bio: updated.bio, avatar: updated.avatar } : u)
    saveUsers(users)
    setUser(updated)
    setToast('个人资料已保存')
  }

  function handlePasswordChange(event) {
    event.preventDefault()
    const errors = {}
    const users = getStoredUsers()
    const found = users.find((u) => u.username === user.username)
    if (!pwdForm.current) errors.current = '请输入当前密码'
    else if (found && found.password !== pwdForm.current) errors.current = '当前密码不正确'
    if (!pwdForm.next) errors.next = '请输入新密码'
    else if (pwdForm.next.length < 6) errors.next = '密码至少 6 个字符'
    if (pwdForm.next !== pwdForm.confirm) errors.confirm = '两次密码不一致'
    if (Object.keys(errors).length > 0) { setPwdErrors(errors); return }

    saveUsers(users.map((u) => u.username === user.username ? { ...u, password: pwdForm.next } : u))
    setPwdForm({ current: '', next: '', confirm: '' })
    setPwdErrors({})
    setToast('密码修改成功')
  }

  // ── Renderers ──
  function renderHeader() {
    return (
      <ScrollReveal direction="down" duration={400}>
        <header className="portal-header">
        <div className="nav-inner">
          <a className="portal-logo" href="#/home" aria-label="梆鼓咚非遗门户首页">
            <span className="logo-emblem">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#C0392B"/>
                    <stop offset="100%" stopColor="#7B0D0D"/>
                  </linearGradient>
                  <radialGradient id="drumFace" cx="24" cy="22" r="14" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F5DEB3" stopOpacity="0.9"/>
                    <stop offset="80%" stopColor="#D2B48C" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#8B7355" stopOpacity="0.5"/>
                  </radialGradient>
                </defs>
                {/* 外圈 — 祥云纹圆环 */}
                <circle cx="24" cy="24" r="22" fill="url(#logoGrad)" stroke="#FFD700" strokeWidth="1"/>
                <circle cx="24" cy="24" r="19.5" fill="none" stroke="#FFD700" strokeWidth="0.4" strokeDasharray="2.5 1.8" opacity="0.6"/>
                {/* 祥云装饰 — 四角 */}
                <path d="M24 3.5 Q26 5.5 24 6.5 Q22 5.5 24 3.5Z" fill="#FFD700" opacity="0.7"/>
                <path d="M24 44.5 Q26 42.5 24 41.5 Q22 42.5 24 44.5Z" fill="#FFD700" opacity="0.7"/>
                <path d="M3.5 24 Q5.5 22 6.5 24 Q5.5 26 3.5 24Z" fill="#FFD700" opacity="0.7"/>
                <path d="M44.5 24 Q42.5 22 41.5 24 Q42.5 26 44.5 24Z" fill="#FFD700" opacity="0.7"/>
                {/* 鼓面 — 俯视图 */}
                <ellipse cx="24" cy="22" rx="13" ry="11" fill="url(#drumFace)" stroke="#FFD700" strokeWidth="0.8"/>
                {/* 鼓钉环 */}
                {[0,30,60,90,120,150,180,210,240,270,300,330].map((a) => (
                  <circle key={a} cx={24 + 12 * Math.cos(a * Math.PI / 180)} cy={22 + 10 * Math.sin(a * Math.PI / 180)} r="1" fill="#FFD700" opacity="0.8"/>
                ))}
                {/* 鼓面中心纹样 — 太极/漩涡 */}
                <path d="M21 19 Q24 16 27 19 Q24 22 21 19Z" fill="none" stroke="#8B4513" strokeWidth="0.6" opacity="0.5"/>
                <path d="M21 25 Q24 28 27 25 Q24 22 21 25Z" fill="none" stroke="#8B4513" strokeWidth="0.6" opacity="0.5"/>
                <circle cx="24" cy="22" r="1.5" fill="none" stroke="#8B4513" strokeWidth="0.5" opacity="0.4"/>
                {/* 鼓槌 — 交叉 */}
                <line x1="15" y1="34" x2="22" y2="26" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="14.2" cy="35" r="2.2" fill="#FFD700" opacity="0.8"/>
                <line x1="33" y1="34" x2="26" y2="26" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="33.8" cy="35" r="2.2" fill="#FFD700" opacity="0.8"/>
                {/* 竹板 — 右侧小装饰 */}
                <rect x="36" y="12" width="3" height="12" rx="1.2" fill="#FFD700" opacity="0.5" transform="rotate(10 37.5 18)"/>
                <rect x="39" y="11" width="3" height="12" rx="1.2" fill="#FFD700" opacity="0.4" transform="rotate(15 40.5 17)"/>
              </svg>
            </span>
            <span className="logo-text">
              <span className="logo-text-main">梆鼓咚</span>
              <span className="logo-text-sub">非遗文化门户</span>
            </span>
          </a>
          {/* 移动端汉堡菜单按钮 */}
          <button
            className={`hamburger-btn${mobileMenuOpen ? ' open' : ''}`}
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <nav className={`portal-nav${mobileMenuOpen ? ' mobile-open' : ''}`} aria-label="主导航">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className={route.name === item.route ? 'nav-active' : ''} onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="portal-tools">
            <a className="tool-button" href="#/mall" aria-label="购物车">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span className="tool-badge">{cartCount}</span>
            </a>
            {user ? (
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button
                  className="user-avatar-btn"
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-label="用户菜单"
                  aria-expanded={showUserMenu}
                >
                  <img src={user.avatar || avatarUrl(user.nickname)} alt={user.nickname} width="34" height="34" />
                </button>
                {showUserMenu && (
                  <div className="user-dropdown" role="menu">
                    <div className="user-dropdown-info">
                      <img src={user.avatar || avatarUrl(user.nickname)} alt={user.nickname} width="40" height="40" />
                      <div>
                        <strong>{user.nickname}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <hr className="user-dropdown-divider" />
                    <a href="#/profile" role="menuitem" onClick={() => { setProfileTab('个人设置'); setShowUserMenu(false) }}>个人设置</a>
                    <a href="#/profile" role="menuitem" onClick={() => { setProfileTab('我的订单'); setShowUserMenu(false) }}>我的订单</a>
                    <hr className="user-dropdown-divider" />
                    <button type="button" role="menuitem" className="logout-btn" onClick={handleLogout}>退出登录</button>
                  </div>
                )}
              </div>
            ) : (
              <a className="tool-button login-link" href="#/login" aria-label="登录">登录</a>
            )}
          </div>
        </div>
        </header>
      </ScrollReveal>
    )
  }

  function renderFooter() {
    return (
      <footer className="portal-footer">
        <div className="footer-inner">
          <div className="footer-links">
            <a href="#/home">影像授权</a>
            <a href="#/announcements">隐私政策</a>
            <a href="#/announcements">版权声明</a>
            <a href="#/announcements">留言板</a>
            <a href="#/home">联系我们</a>
            <a href="#/home">关于我们</a>
          </div>
          <p className="footer-copy">网站维护：福建省莆田市梆鼓咚非遗传承项目组 ｜ 联系方式：demo@banggudon.com</p>
          <p className="footer-copy">© 2024-2026 梆鼓咚非遗数字门户 · 福建省莆田市 · All rights reserved.</p>
        </div>
      </footer>
    )
  }

  function renderHome() {
    return (
      <>
        {/* Hero — image carousel */}
        <section className="hero-carousel">
          {heroSlides.map((slide, i) => (
            <div key={i} className={`hero-slide ${i === heroSlide ? 'hero-slide-active' : ''}`}>
              <img src={slide.image} alt="" />
            </div>
          ))}
          <div className="hero-carousel-overlay" aria-hidden="true" />
          <div className="hero-cloud-bottom" aria-hidden="true" />

          {/* 乐器实物图片 — 可点击发声 */}
          <div className="hero-instruments">
            <div className="hero-instr hero-instr-photo hero-instr-photo-left" title="板鼓"
              onClick={(e) => { e.stopPropagation(); playDrum(); e.currentTarget.classList.remove('hero-instr-hit'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('hero-instr-hit') }}>
              <img src={IMG.bangguInstruments} alt="梆鼓咚乐器 — 板鼓与竹板" />
              <span className="hero-instr-label">点击试听 · 板鼓</span>
            </div>
            <div className="hero-instr hero-instr-photo hero-instr-photo-right" title="竹板"
              onClick={(e) => { e.stopPropagation(); playZhuban(); e.currentTarget.classList.remove('hero-instr-hit'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('hero-instr-hit') }}>
              <img src={IMG.bangguDrawing} alt="梆鼓咚民俗演奏线描" />
              <span className="hero-instr-label">点击试听 · 竹板</span>
            </div>
          </div>
          <div className="hero-inner">
            <h1 className="hero-title">梆鼓咚 · 莆田非遗</h1>
            <p className="hero-subtitle">{heroSlides[heroSlide]?.subtitle || ''}</p>
            <div className="hero-actions">
              <a href="#/heritage" className="btn-primary-hero">⊙ 探索非遗</a>
              <a href="#/course" className="btn-outline-hero">□ 学习课程</a>
            </div>
            <div className="hero-dots" aria-label="幻灯片导航">
              {heroSlides.map((_, i) => (
                <button key={i} type="button" className={`hero-dot ${i === heroSlide ? 'hero-dot-active' : ''}`} aria-label={`第${i + 1}张`} onClick={() => { setHeroSlide(i); resetHeroTimer() }} />
              ))}
            </div>
          </div>
        </section>

        {/* 习近平总书记名言 */}
        <div className="xi-quote-banner reveal-scale">
          <div className="xi-quote-inner">
            <div className="xi-quote-icon">"</div>
            <blockquote className="xi-quote-text">
              要扎实做好非物质文化遗产的系统性保护，更好满足人民日益增长的精神文化需求，推进文化自信自强。
            </blockquote>
            <div className="xi-quote-author">——习近平总书记</div>
          </div>
        </div>

        {/* 精选作品 */}
        <div className="section-heading reveal-heading">
          <div className="section-title-bracket">【 精选作品 】</div>
          <p className="section-subtitle-text">探索福建莆田梆鼓咚非物质文化遗产的魅力</p>
        </div>
        <div className="section-wrapper" style={{ paddingTop: 0 }}>
          <div className="section-topbar">
            <span />
            <a href="#/works" className="section-more-link">查看更多 →</a>
          </div>
          <div className="works-grid">
            {heritageWorks.slice(0, 4).map((work) => (
              <a key={work.id} href="#/works" className="work-card reveal-up">
                <div className="work-card-img">
                  <img src={work.image} alt={work.title} />
                  <span className="work-badge">{work.badge}</span>
                </div>
                <div className="work-card-body">
                  <div className="work-card-title">{work.title}</div>
                  <div className="work-card-meta">
                    <span>⚑ {work.author}</span>
                    <span>◎ {work.location}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 传承人风采 */}
        <div className="section-heading reveal-heading">
          <div className="section-title-bracket">【 传承人风采 】</div>
          <p className="section-subtitle-text">传承匠心，守护文化根脉</p>
        </div>
        <div className="section-wrapper" style={{ paddingTop: 0 }}>
          <div className="section-topbar">
            <span />
            <a href="#/inheritors" className="section-more-link">查看更多 →</a>
          </div>
          <div className="inheritors-grid">
            {inheritorsData.slice(0, 4).map((person) => (
              <div key={person.id} className="inheritor-card reveal-up">
                <img
                  src={avatarUrl(person.name)}
                  alt={person.name}
                  className="inheritor-avatar"
                />
                <div className="inheritor-name">
                  <span
                    className="inheritor-name-btn"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleInheritorClick(person.name)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleInheritorClick(person.name) } }}
                  >{person.name}</span>
                </div>
                <div className="inheritor-title">{person.title}</div>
                <div className="inheritor-location">◎ {person.location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 媒体报道 */}
        <div className="section-heading reveal-heading">
          <div className="section-title-bracket">【 媒体报道 】</div>
          <p className="section-subtitle-text">权威媒体关注，梆鼓咚走向全国舞台</p>
        </div>
        <div className="section-wrapper" style={{ paddingTop: 0 }}>
          <div className="activities-grid">
            {[
              {
                id: 'n1',
                img: IMG.newsDangui,
                source: '中国新闻网',
                date: '2015年',
                title: '梆鼓咚荣获福建省第三届曲艺大赛一等奖',
                desc: '中新网报道，莆田梆鼓咚代表队在福建省曲艺大赛中脱颖而出，斩获一等奖，引发广泛关注。',
              },
              {
                id: 'n2',
                img: IMG.newsMazu,
                source: '湄洲日报',
                date: '2017年',
                title: '梆鼓咚代表福建参加全国曲艺展演',
                desc: '湄洲日报报道，梆鼓咚作为福建代表曲种赴京参加全国曲艺展演，展示莆仙文化独特魅力。',
              },
              {
                id: 'n3',
                img: IMG.pavilionArt,
                source: '文创设计',
                date: '近年',
                title: '梆鼓咚数字插画「小小梆鼓讲大事」',
                desc: '以非遗传承为主题的数字文创插画，将梆鼓咚形象融入现代美学，让传统文化走进年轻群体。',
              },
            ].map((n) => (
              <div key={n.id} className="news-card reveal-left">
                <div className="activity-img">
                  <img src={n.img} alt={n.title} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  <span className="activity-status status-open">{n.source}</span>
                </div>
                <div className="activity-body">
                  <span className="activity-type-tag">{n.date}</span>
                  <div className="activity-title">{n.title}</div>
                  <div className="activity-meta" style={{ fontSize: 13, color: '#888', marginTop: 6 }}>{n.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 活动中心 */}
        <div className="section-heading reveal-heading">
          <div className="section-title-bracket">【 近期活动 】</div>
          <p className="section-subtitle-text">探索梆鼓咚非遗文化活动与展演</p>
        </div>
        <div className="section-wrapper" style={{ paddingTop: 0 }}>
          <div className="section-topbar">
            <span />
            <a href="#/activities" className="section-more-link">查看更多 →</a>
          </div>
          <div className="activities-grid">
            {activitiesData.map((act) => (
              <div key={act.id} className="activity-card reveal-up">
                <div className="activity-img">
                  <img src={act.image} alt={act.title} />
                  <span className={`activity-status ${act.status === '进行中' ? 'status-active' : 'status-open'}`}>{act.status}</span>
                </div>
                <div className="activity-body">
                  <span className="activity-type-tag">{act.type}</span>
                  <div className="activity-title">{act.title}</div>
                  <div className="activity-meta">
                    <span>◎ {act.location}</span>
                    <span>⊙ {act.date}</span>
                  </div>
                </div>
                <a href="#/activities" className="activity-btn">立即报名</a>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  function renderWorks() {
    const keyword = worksSearch.trim().toLowerCase()
    const filtered = heritageWorks
      .filter((w) => worksCategory === '全部' || w.badge === worksCategory || w.category.includes(worksCategory))
      .filter((w) => !keyword || w.title.toLowerCase().includes(keyword) || w.author.toLowerCase().includes(keyword) || w.location.toLowerCase().includes(keyword) || w.category.toLowerCase().includes(keyword))
    return (
      <>
        <div className="page-hero" style={{ '--hero-bg': `url(${IMG.modDrama})` }}>
          <div className="page-hero-title">
            <span className="page-hero-dash">一</span>
            非遗作品
            <span className="page-hero-dash">一</span>
          </div>
          <p className="page-hero-subtitle">探索福建莆田梆鼓咚非物质文化遗产</p>
          <div className="page-hero-badge">作<br/>品</div>
        </div>
        <div className="page-toolbar">
          <div className="search-input-wrapper">
            <input type="search" placeholder="搜索作品名称、地区、分类..." value={worksSearch} onChange={(e) => setWorksSearch(e.target.value)} />
            <button className="search-btn" type="button">搜索</button>
          </div>
        </div>
        <div className="category-tabs">
          {worksCategories.map((cat) => (
            <button key={cat} type="button" className={`cat-tab ${worksCategory === cat ? 'cat-tab-active' : ''}`} onClick={() => setWorksCategory(cat)}>{cat}</button>
          ))}
        </div>
        <div className="section-wrapper">
          <div className="works-grid">
            {filtered.map((work) => (
              <a key={work.id} href="#/works" className="work-card">
                <div className="work-card-img">
                  <img src={work.image} alt={work.title} />
                  <span className="work-badge">{work.badge}</span>
                </div>
                <div className="work-card-body">
                  <div className="work-card-title">{work.title}</div>
                  <div className="work-card-meta">
                    <span>⚑ {work.author}</span>
                    <span>◎ {work.location}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </>
    )
  }

  function renderInheritors() {
    return (
      <>
        <div className="page-hero" style={{ '--hero-bg': `url(${IMG.hero1})` }}>
          <div className="page-hero-title">
            <span className="page-hero-dash">一</span>
            非遗传承人
            <span className="page-hero-dash">一</span>
          </div>
          <p className="page-hero-subtitle">传承匠心，守护文化根脉</p>
          <div className="page-hero-badge">传<br/>承</div>
        </div>
        <div className="page-toolbar">
          <div className="search-input-wrapper">
            <input type="search" placeholder="搜索传承人姓名..." value={inheritorsSearch} onChange={(e) => setInheritorsSearch(e.target.value)} />
            <button className="search-btn" type="button">搜索</button>
          </div>
          <select className="filter-select" value={inheritorsFilter} onChange={(e) => setInheritorsFilter(e.target.value)}>
            <option value="全部">全部地区</option>
            {[...new Set(inheritorsData.map((p) => p.location))].map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div className="section-wrapper" style={{ paddingTop: 24 }}>
          <div className="inheritors-grid">
            {inheritorsData.filter((person) => {
              const kw = inheritorsSearch.trim().toLowerCase()
              const matchSearch = !kw || person.name.toLowerCase().includes(kw) || person.title.toLowerCase().includes(kw)
              const matchFilter = inheritorsFilter === '全部' || person.location === inheritorsFilter
              return matchSearch && matchFilter
            }).map((person) => (
              <div key={person.id} className="inheritor-card">
                <img src={avatarUrl(person.name)} alt={person.name} className="inheritor-avatar" />
                <div className="inheritor-name">
                  <span
                    className="inheritor-name-btn"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleInheritorClick(person.name)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleInheritorClick(person.name) } }}
                  >{person.name}</span>
                </div>
                <div className="inheritor-title">{person.title}</div>
                <div className="inheritor-location">◎ {person.location}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  function renderActivities() {
    return (
      <>
        <div className="page-hero" style={{ '--hero-bg': `url(${IMG.stagePerf})` }}>
          <div className="page-hero-title">
            <span className="page-hero-dash">一</span>
            活动中心
            <span className="page-hero-dash">一</span>
          </div>
          <p className="page-hero-subtitle">探索梆鼓咚非遗文化活动与传习展演</p>
          <div className="page-hero-badge">活<br/>动</div>
        </div>
        <div className="page-toolbar">
          <div className="search-input-wrapper">
            <input type="search" placeholder="搜索活动..." value={activitiesSearch} onChange={(e) => setActivitiesSearch(e.target.value)} />
            <button className="search-btn" type="button">搜索</button>
          </div>
          <select className="filter-select" value={activitiesFilter} onChange={(e) => setActivitiesFilter(e.target.value)}>
            <option value="全部">全部状态</option>
            <option value="报名中">报名中</option>
            <option value="进行中">进行中</option>
            <option value="已结束">已结束</option>
          </select>
        </div>
        <div className="section-wrapper" style={{ paddingTop: 24 }}>
          <div className="activities-grid">
            {activitiesData.filter((act) => {
              const kw = activitiesSearch.trim().toLowerCase()
              const matchSearch = !kw || act.title.toLowerCase().includes(kw) || act.location.toLowerCase().includes(kw)
              const matchFilter = activitiesFilter === '全部' || act.status === activitiesFilter
              return matchSearch && matchFilter
            }).map((act) => (
              <div key={act.id} className="activity-card">
                <div className="activity-img">
                  <img src={act.image} alt={act.title} />
                  <span className={`activity-status ${act.status === '进行中' ? 'status-active' : 'status-open'}`}>{act.status}</span>
                </div>
                <div className="activity-body">
                  <span className="activity-type-tag">{act.type}</span>
                  <div className="activity-title">{act.title}</div>
                  <div className="activity-meta">
                    <span>◎ {act.location}</span>
                    <span>⊙ {act.date}</span>
                  </div>
                </div>
                <a href="#/activities" className="activity-btn">立即报名</a>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  function renderCourse() {
    return (
      <>
        <div className="page-hero" style={{ '--hero-bg': `url(${IMG.course1})` }}>
          <div className="page-hero-title">
            <span className="page-hero-dash">一</span>
            在线课程
            <span className="page-hero-dash">一</span>
          </div>
          <p className="page-hero-subtitle">学习非遗文化，传承匠心技艺</p>
          <div className="page-hero-badge">课<br/>程</div>
        </div>
        <div className="page-toolbar">
          <div className="search-input-wrapper">
            <input type="search" placeholder="搜索课程..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} />
            <button className="search-btn" type="button">搜索</button>
          </div>
          <select className="filter-select" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="全部分类">全部分类</option>
            <option value="初级">初级</option>
            <option value="中级">中级</option>
            <option value="高级">高级</option>
          </select>
        </div>
        <div className="section-wrapper" style={{ paddingTop: 24 }}>
          <div className="course-grid">
            {coursesData.filter((c) => {
              const kw = courseSearch.trim().toLowerCase()
              const matchSearch = !kw || c.title.toLowerCase().includes(kw)
              const matchFilter = courseFilter === '全部分类' || c.level === courseFilter
              return matchSearch && matchFilter
            }).map((c) => {
              const levels = { '初级': 1, '中级': 2, '高级': 3 }
              const lvl = levels[c.level] || 1
              return (
                <div key={c.id} className="course-card">
                  <div className="course-card-img">
                    <LazyImage src={c.image} alt={c.title} />
                  </div>
                  <div className="course-card-body">
                    <div className="course-card-title">{c.title}</div>
                    <div className="course-meta-row">
                      <span>共 {c.lessons} 节课</span>
                      <span className="course-level">
                        {[1,2,3].map((d) => <span key={d} className={`level-dot ${d <= lvl ? 'active' : ''}`} />)}
                        {c.level}
                      </span>
                    </div>
                    <button className="course-start-btn" type="button">
              <LoadingButton loading={isLoading}>开始学习</LoadingButton>
            </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="section-wrapper">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 24 }}>课程团队</h2>
          <div className="inheritors-grid">
            {[
              { name: '黄璟', role: '主讲教师', title: '梆鼓咚唯一代表性传承人，莆田学院音乐学院副教授，承担梆鼓咚核心教学与曲谱记录' },
              { name: '卢雪珊', role: '教学辅助', title: '莆田学院音乐学院副教授，梆鼓咚曲本作者，承担课堂教学设计辅助' },
              { name: '马达', role: '顶层设计', title: '中国音乐教育家，莆田学院音乐学院特聘教授，承担课程顶层设计辅导' },
              { name: '林季君', role: '青少年传承', title: '梆鼓咚第五代传承人，莆田学院音乐学院客座教授，省级中学音乐学科教学带头人，专注青少年传承传播' },
              { name: '郑长铃', role: '非遗理论', title: '国际非遗专家，莆田学院音乐学院特聘教授，承担非遗保护理论辅导' },
            ].map((m) => (
              <div key={m.name} className="inheritor-card">
                <img src={avatarUrl(m.name)} alt={m.name} className="inheritor-avatar" />
                <div className="inheritor-name">
                  <span
                    className="inheritor-name-btn"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleInheritorClick(m.name)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleInheritorClick(m.name) } }}
                  >{m.name}</span>
                </div>
                <div className="inheritor-location" style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{m.role}</div>
                <div className="inheritor-title">{m.title}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  function renderQA() {
    return (
      <div className="ai-chat-page">
        <div className="ai-chat-header">
          <div className="ai-chat-icon">🤖</div>
          <div>
            <p className="ai-chat-header-title">非遗智能助手</p>
            <p className="ai-chat-header-sub">探索非遗知识，传承文化瑰宝</p>
          </div>
        </div>
        <div className="ai-chat-body">
          <div className="ai-message-bot">
            你好！很高兴为您服务！我是一个专业的非物质文化遗产智能助手，可以帮助您了解中国各地的非遗项目、传承人、活动和课程。
            <div className="ai-chip-row" style={{ marginTop: 12 }}>
              <button className="ai-chip" type="button" onClick={() => setQuestion(defaultQuestion)}>适合学习年龄</button>
              <button className="ai-chip" type="button" onClick={() => setQuestion('有哪些著名的刺绣类非遗？')}>著名刺绣非遗</button>
              <button className="ai-chip" type="button" onClick={() => setQuestion('梆鼓咚可以和文创集市怎么联动？')}>非遗与文创联动</button>
            </div>
          </div>
          {answer && answer !== '这里会显示课程答疑、术语解释、学习建议和传播方案。' && (
            <>
              <div className="ai-message-user">{askedQuestion}</div>
              <div className="ai-message-bot">{answer}</div>
            </>
          )}
          {error ? <p className="ai-error">{error}</p> : null}
        </div>
        <form onSubmit={handleAsk} style={{ marginTop: 12 }}>
          <div className="ai-input-row">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="请问有什么可以帮您的吗？"
            />
            <button className="ai-send-btn" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    marginRight: '6px',
                    border: '2px solid transparent',
                    borderTopColor: 'currentColor',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    verticalAlign: 'middle'
                  }} />
                  生成中…
                </>
              ) : '发送'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  function renderMall() {
    const tagsToShow = showAllTags ? mallTags : mallTags.slice(0, 7)
    return (
      <>
        <div className="page-hero" style={{ '--hero-bg': `url(${IMG.cultureHall})` }}>
          <div className="page-hero-title">
            <span className="page-hero-dash">一</span>
            手办商城
            <span className="page-hero-dash">一</span>
          </div>
          <p className="page-hero-subtitle">精选非遗文创好物，带回家的文化记忆</p>
          <div className="page-hero-badge">商<br/>城</div>
        </div>
        <div className="mall-page">
          <div className="mall-toolbar">
            <div className="mall-search-row">
              <div className="search-input-wrapper">
                <input type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索商品..." />
                <button className="search-btn" type="button">搜索</button>
              </div>
            </div>
            <div className="sort-row">
              <button type="button" className={sortMode === 'price-asc' ? 'sort-active' : ''} onClick={() => setSortMode('price-asc')}>价格从低到高</button>
              <button type="button" className={sortMode === 'price-desc' ? 'sort-active' : ''} onClick={() => setSortMode('price-desc')}>价格从高到低</button>
              <button type="button" className={sortMode === 'time' ? 'sort-active' : ''} onClick={() => setSortMode('time')}>按时间排序</button>
            </div>
            <div className="tag-bar">
              {tagsToShow.map((tag) => (
                <button key={tag} type="button" className={activeTag === tag ? 'tag-active' : ''} onClick={() => setActiveTag(tag)}>{tag}</button>
              ))}
              <button type="button" className="tag-toggle" onClick={() => setShowAllTags((v) => !v)}>{showAllTags ? '收起' : '更多'}</button>
            </div>
          </div>
          <div className="mall-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <a href={`#/mall/products/${product.id}`} className="product-link">
                  <LazyImage src={product.image} alt={product.name} />
                  <h3>{product.name}</h3>
                </a>
                <p>{product.desc}</p>
                <strong>¥{product.price}</strong>
              </article>
            ))}
          </div>
        </div>
      </>
    )
  }

  function renderProductDetail() {
    if (!currentProduct) return null
    return (
      <div className="product-detail-page">
        <div className="product-detail-card">
          <img src={currentProduct.image} alt={currentProduct.name} />
          <div className="product-detail-copy">
            <h1>{currentProduct.name}</h1>
            <div className="price-row">
              <strong>¥{currentProduct.price}</strong>
              <span>¥{currentProduct.originalPrice}</span>
            </div>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '12px 0' }}>{currentProduct.desc}</p>
            <ul className="detail-meta">
              <li>库存：{currentProduct.stock}</li>
              <li>浏览量：{currentProduct.sales}</li>
              <li>分类：{currentProduct.category}</li>
            </ul>
            <button className="submit-button" style={{ marginTop: 20 }} type="button" onClick={() => addToCart(currentProduct.name)}>加入购物车</button>
          </div>
        </div>
      </div>
    )
  }

  function renderAnnouncements() {
    return (
      <div className="announcements-page">
        <h2 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>官方公告</h2>
        <div className="notice-list-wrap">
          <ul className="notice-list">
            {announcements.map((item) => (
              <li key={item.title} className="notice-item">
                <span className="notice-item-title">{item.title}</span>
                <time className="notice-item-date">{item.date}</time>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  function renderLogin() {
    const isLogin = loginMode === 'login'

    function fieldError(errors, key) {
      return errors[key] ? <p className="field-error" role="alert">{errors[key]}</p> : null
    }

    return (
      <div className="auth-page">
        {/* Left decorative panel */}
        <div className="auth-panel-left" aria-hidden="true">
          <img className="auth-panel-bg" src={IMG.hero1} alt="" />
          <div className="auth-panel-overlay" />
          <div className="auth-panel-artwork">
            <div className="auth-panel-icon">鼓</div>
            <div className="auth-panel-big">梆鼓咚<br/>非遗传承</div>
            <div className="auth-panel-small">传承千年文化 · 守护匠心技艺</div>
            <div className="auth-panel-tags">
              <span className="auth-panel-tag">福建省莆田市</span>
              <span className="auth-panel-tag">国家级非遗</span>
              <span className="auth-panel-tag">传统鼓乐</span>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-panel-right">
        <section className="auth-card" aria-label={isLogin ? '用户登录' : '用户注册'}>
          <div className="auth-brand">
            <span className="auth-logo-badge">梆鼓咚非遗</span>
            <h2>{isLogin ? '欢迎回来' : '创建账号'}</h2>
            <p>{isLogin ? '登录后享有完整功能体验' : '注册成为非遗文化传播者'}</p>
          </div>

          <div className="auth-switch" role="tablist">
            <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? 'auth-active' : ''} onClick={() => { setLoginMode('login'); setLoginErrors({}); setRegErrors({}); setCaptchaCode(generateCaptcha()) }}>登录</button>
            <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? 'auth-active' : ''} onClick={() => { setLoginMode('register'); setLoginErrors({}); setRegErrors({}); setCaptchaCode(generateCaptcha()) }}>注册</button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} noValidate>
              {loginErrors.general && <p className="auth-general-error" role="alert">{loginErrors.general}</p>}
              <div className="auth-field">
                <label htmlFor="login-username">账号</label>
                <input id="login-username" type="text" autoComplete="username" placeholder="输入用户名" value={loginForm.username} onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))} aria-describedby={loginErrors.username ? 'login-username-err' : undefined} />
                {loginErrors.username && <p id="login-username-err" className="field-error" role="alert">{loginErrors.username}</p>}
              </div>
              <div className="auth-field">
                <label htmlFor="login-password">密码</label>
                <div className="password-wrapper">
                  <PasswordInput id="login-password" autoComplete="current-password" placeholder="输入密码" value={loginForm.password} onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} />
                </div>
                {fieldError(loginErrors, 'password')}
              </div>
              <div className="auth-field">
                <label htmlFor="login-captcha">验证码</label>
                <div className="captcha-row">
                  <input id="login-captcha" type="text" placeholder="输入验证码" value={loginForm.captcha} onChange={(e) => setLoginForm((f) => ({ ...f, captcha: e.target.value }))} />
                  <span className="captcha-code" aria-label={`验证码：${captchaCode}`}>{captchaCode}</span>
                  <button type="button" className="captcha-refresh" onClick={() => { setCaptchaCode(generateCaptcha()); setLoginForm((f) => ({ ...f, captcha: '' })) }} aria-label="刷新验证码">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  </button>
                </div>
                {fieldError(loginErrors, 'captcha')}
              </div>
              <button className="submit-button auth-submit" type="submit">登录</button>
              <p className="auth-hint">演示账号：adlix / 12345678</p>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate>
              <div className="auth-field">
                <label htmlFor="reg-username">用户名</label>
                <input id="reg-username" type="text" autoComplete="username" placeholder="至少 3 个字符" value={regForm.username} onChange={(e) => setRegForm((f) => ({ ...f, username: e.target.value }))} />
                {fieldError(regErrors, 'username')}
              </div>
              <div className="auth-field">
                <label htmlFor="reg-email">邮箱</label>
                <input id="reg-email" type="email" autoComplete="email" placeholder="example@mail.com" value={regForm.email} onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))} />
                {fieldError(regErrors, 'email')}
              </div>
              <div className="auth-field">
                <label htmlFor="reg-password">密码</label>
                <PasswordInput id="reg-password" autoComplete="new-password" placeholder="至少 6 个字符" value={regForm.password} onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))} />
                {fieldError(regErrors, 'password')}
              </div>
              <div className="auth-field">
                <label htmlFor="reg-confirm">确认密码</label>
                <PasswordInput id="reg-confirm" autoComplete="new-password" placeholder="再次输入密码" value={regForm.confirmPassword} onChange={(e) => setRegForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
                {fieldError(regErrors, 'confirmPassword')}
              </div>
              <div className="auth-field">
                <label htmlFor="reg-captcha">验证码</label>
                <div className="captcha-row">
                  <input id="reg-captcha" type="text" placeholder="输入验证码" value={regForm.captcha} onChange={(e) => setRegForm((f) => ({ ...f, captcha: e.target.value }))} />
                  <span className="captcha-code" aria-label={`验证码：${captchaCode}`}>{captchaCode}</span>
                  <button type="button" className="captcha-refresh" onClick={() => { setCaptchaCode(generateCaptcha()); setRegForm((f) => ({ ...f, captcha: '' })) }} aria-label="刷新验证码">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  </button>
                </div>
                {fieldError(regErrors, 'captcha')}
              </div>
              <button className="submit-button auth-submit" type="submit">立即注册</button>
            </form>
          )}
        </section>
        </div>
      </div>
    )
  }

  function renderHeritage() {
    return (
      <>
        {/* 页头 Banner */}
        <div className="heritage-banner">
          <img src={IMG.hero3} alt="梆鼓咚非遗介绍" className="heritage-banner-img" />
          <div className="heritage-banner-overlay" />
          <div className="heritage-banner-content">
            <div className="heritage-banner-tag">国家级非物质文化遗产</div>
            <h1 className="heritage-banner-title">梆鼓咚</h1>
            <p className="heritage-banner-sub">俚歌梆鼓 · 源于宋代 · 千年传承</p>
          </div>
        </div>

        <div className="heritage-body">

          {/* 基本信息卡片 */}
          <div className="heritage-info-grid">
            {[
              { label: '别名', value: '板鼓咚 · 乞丐歌 · 俚歌梆鼓' },
              { label: '起源时代', value: '宋代，盛行于清代' },
              { label: '流行地域', value: '福建莆田、仙游等兴化方言地区' },
              { label: '演唱语言', value: '莆田方言（兴化语）' },
              { label: '保护级别', value: '国家级非物质文化遗产（2023年申遗成功）' },
              { label: '传统曲目', value: '保留 70 余个' },
            ].map((item) => (
              <div key={item.label} className="heritage-info-item">
                <span className="heritage-info-label">{item.label}</span>
                <span className="heritage-info-value">{item.value}</span>
              </div>
            ))}
          </div>

          {/* 历史渊源 */}
          <section className="heritage-section">
            <h2 className="heritage-section-title">
              <span className="heritage-section-icon">◈</span> 历史渊源
            </h2>
            <div className="heritage-section-body">
              <p>梆鼓咚源于宋代，盛行于清代，迄今已有逾千年历史，是福建莆田、仙游等兴化方言地区独有的民间曲艺形式。</p>
              <p>民间传说，宋代水利名人钱四娘在莆田修筑木兰陂期间，百姓以竹筒装铜钱相助，事后将竹筒制成打击乐器，配上传唱的歌谣，逐渐演变为梆鼓咚。民谚"抓也十八，捧也十八"即由此而来，广泛流传于民间。</p>
              <p>梆鼓咚最初由街头艺人以莆田方言单人演唱，后逐步发展为对唱、群唱、坐唱等多种形式，并可配以小型乐队伴奏。语言通俗易懂的"俗唱"版本尤为广泛流传。</p>
            </div>
          </section>

          {/* 乐器构成 */}
          <section className="heritage-section">
            <h2 className="heritage-section-title">
              <span className="heritage-section-icon">◈</span> 乐器构成
            </h2>
            <div className="heritage-instruments">
              <div className="heritage-instrument-card">
                <div className="heritage-instrument-name">板鼓（梆鼓）</div>
                <p>长约 25 厘米、口径约 5 厘米的竹筒，两端蒙皮制成，演奏时斜背于右肩，以竹签敲击。</p>
              </div>
              <div className="heritage-instrument-card">
                <div className="heritage-instrument-name">竹板</div>
                <p>两片长约 8 厘米、宽 3 厘米、厚 1 厘米的竹片，夹于左腋下，随演唱节拍合击出声。</p>
              </div>
            </div>
          </section>

          {/* 演奏技法 */}
          <section className="heritage-section">
            <h2 className="heritage-section-title">
              <span className="heritage-section-icon">◈</span> 四种演奏技法
            </h2>
            <div className="heritage-techniques">
              {[
                { name: '响鼓', sound: '咚咚声', desc: '鼓心正击，发出饱满浑厚的低沉鼓声，用于节拍强拍。' },
                { name: '边鼓', sound: '当当声', desc: '击打鼓边，发出清脆金属质感的音色，用于弱拍装饰。' },
                { name: '点鼓', sound: '嘟嘟声', desc: '轻触鼓面，发出短促点状音效，用于节奏细化与装饰。' },
                { name: '闷鼓', sound: '口扑声', desc: '以掌压住鼓面击打，制造闷哑音色，增加音乐层次感。' },
              ].map((t) => (
                <div key={t.name} className="heritage-technique-card">
                  <div className="heritage-technique-name">{t.name}</div>
                  <div className="heritage-technique-sound">"{t.sound}"</div>
                  <p>{t.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 演唱形式 */}
          <section className="heritage-section">
            <h2 className="heritage-section-title">
              <span className="heritage-section-icon">◈</span> 演唱形式
            </h2>
            <div className="heritage-section-body">
              <p>梆鼓咚由最初的街头单人演唱，逐步发展出多种表演形式：</p>
              <ul className="heritage-list">
                <li><strong>单人演唱：</strong>传统形式，演唱者自持板鼓与竹板，边击边唱。</li>
                <li><strong>对唱：</strong>两人一问一答，通常以男女声配合，情趣生动。</li>
                <li><strong>群唱：</strong>多人合唱，多用于节庆、庙会等集体场合。</li>
                <li><strong>坐唱：</strong>演唱者落座，配以小型器乐组合，适合室内堂会演出。</li>
              </ul>
              <p>曲目语言分为"雅唱"与"俗唱"两类，俗唱语言通俗，贴近百姓生活，流传最广。</p>
            </div>
          </section>

          {/* 保护传承 */}
          <section className="heritage-section">
            <h2 className="heritage-section-title">
              <span className="heritage-section-icon">◈</span> 保护与传承
            </h2>
            <div className="heritage-timeline">
              {[
                { year: '2007', text: '列入莆田市非物质文化遗产名录，正式受到官方保护。' },
                { year: '2014', text: '科研起步，梆鼓咚课程植入莆田学院音乐学院课堂，启动高校传承探索。' },
                { year: '2015', text: '荣获福建省第三届曲艺大赛一等奖（中国新闻网等媒体报道）；师带徒同台表演获新人奖一等奖、创作奖一等奖。' },
                { year: '2016', text: '音乐权威顶刊CSSCI发表梆鼓咚研究论文，曲艺重大赛事获奖，获政府文艺精品奖励。' },
                { year: '2017', text: '列入福建省非物质文化遗产代表性项目名录；代表福建参加全国曲艺展演（湄洲日报等媒体报道），梆鼓咚首次亮相全国舞台。' },
                { year: '2019', text: '非遗申报正式启动，省级曲艺重大赛事再获殊荣，濒危曲种纪录片正式开拍。' },
                { year: '2020', text: '一流课程建设立项，CSSCI非遗论文发表，非遗文创重大项目立项。' },
                { year: '2021', text: '莆田市梆鼓咚传习所正式成立；梆鼓咚正式进入本科人才培养方案，开设专门课程。' },
                { year: '2023', text: '申遗成功！学生苏越与陈吉独立表演荣获福建省第五届曲艺大赛新人奖（全省仅3名）。第五代传承人黄璟将无乐谱传统曲目首次记录为五线谱，推动数字化保存。' },
                { year: '现在', text: '莆田学院音乐学院梆鼓咚课程已有逾百名学生参与；构建大中小幼一体化传承体系，覆盖筱塘小学、莆田一中等多所学校，并向社区、乡村延伸传播。' },
              ].map((item) => (
                <div key={item.year} className="heritage-timeline-item">
                  <div className="heritage-timeline-year">{item.year}</div>
                  <div className="heritage-timeline-text">{item.text}</div>
                </div>
              ))}
            </div>
            <p className="heritage-endangered-note">
              ⚑ 梆鼓咚曾是<strong>福建省八大濒危曲种之一</strong>，2023年申遗成功，传承保护工作持续推进。
            </p>
          </section>

          {/* 底部跳转 */}
          <div className="heritage-footer-nav">
            <a href="#/inheritors" className="btn-primary-hero">认识传承人 →</a>
            <a href="#/course" className="btn-outline-hero">开始学习课程 →</a>
            <a href="#/activities" className="btn-outline-hero">参与近期活动 →</a>
          </div>

        </div>
      </>
    )
  }

  function renderGame() {
    return (
      <>
        <div className="page-hero" style={{ '--hero-bg': `url(${IMG.modDrama})` }}>
          <div className="page-hero-title">
            <span className="page-hero-dash">一</span>
            小游戏
            <span className="page-hero-dash">一</span>
          </div>
          <p className="page-hero-subtitle">梆鼓咚音乐节奏游戏，感受非遗韵律之美</p>
          <div className="page-hero-badge">游<br/>戏</div>
        </div>
        <div className="section-wrapper" style={{ padding: '48px 24px' }}>
          <div className="game-intro-card">
            <div className="game-intro-icon">🥁</div>
            <h2 className="game-intro-title">梆鼓咚·音乐节奏游戏</h2>
            <p className="game-intro-desc">本游戏以福建莆田非物质文化遗产「梆鼓咚」为主题，融合传统鼓乐节奏与现代音乐游戏玩法，让你在游玩中感受非遗文化的魅力。</p>
            <div className="game-tags">
              <span className="game-tag">节奏音乐</span>
              <span className="game-tag">非遗主题</span>
              <span className="game-tag">益智休闲</span>
            </div>
          </div>
          <div className="game-frame-wrapper">
            <iframe
              src="/game/index.html"
              title="梆鼓咚音乐节奏游戏"
              width="960"
              height="600"
              style={{ border: 'none', display: 'block', margin: '0 auto', maxWidth: '100%' }}
              allowFullScreen
            />
          </div>
        </div>
      </>
    )
  }

  function renderPage() {
    let content
    if (route.name === 'works') content = renderWorks()
    else if (route.name === 'inheritors') content = renderInheritors()
    else if (route.name === 'activities') content = renderActivities()
    else if (route.name === 'course') content = renderCourse()
    else if (route.name === 'mall') content = renderMall()
    else if (route.name === 'game') content = renderGame()
    else if (route.name === 'product') content = renderProductDetail()
    else if (route.name === 'qa') content = renderQA()
    else if (route.name === 'announcements') content = renderAnnouncements()
    else if (route.name === 'login') content = renderLogin()
    else if (route.name === 'profile') {
      if (!user) {
        content = <ProfileRedirect />
      } else {
        content = (
          <Suspense fallback={<PageSkeleton />}>
            <ProfilePage
              user={user}
              profileTab={profileTab}
              setProfileTab={setProfileTab}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              pwdForm={pwdForm}
              setPwdForm={setPwdForm}
              pwdErrors={pwdErrors}
              setPwdErrors={setPwdErrors}
              handleProfileSave={handleProfileSave}
              handlePasswordChange={handlePasswordChange}
              handleLogout={handleLogout}
              setToast={setToast}
              avatarPreview={avatarPreview}
              setAvatarPreview={setAvatarPreview}
            />
          </Suspense>
        )
      }
    }
    else if (route.name === 'heritage') content = renderHeritage()
    else content = renderHome()
    
    return (
      <div key={route.name}>
        {content}
      </div>
    )
  }

  return (
    <div className="portal-shell">
      <ClickEffect />
      {toast ? <div className="toast-banner" role="status" aria-live="polite">{toast}</div> : null}
      {renderHeader()}
      <main className="portal-main">{renderPage()}</main>
      {renderFooter()}
      {selectedInheritor && (
        <div className="inheritor-overlay" role="button" tabIndex={-1} aria-label="关闭传承人详情" onClick={handleClosePanel} onKeyDown={(e) => { if (e.key === 'Escape') handleClosePanel() }} />
      )}
      {selectedInheritor && (
        <div
          className={`inheritor-panel${isPanelOpen && !isPanelClosing ? ' inheritor-panel--open' : ''}${isPanelClosing ? ' inheritor-panel--closing' : ''}`}
          onTransitionEnd={handlePanelTransitionEnd}
        >
          <div className="inheritor-panel-header">
            <div className="inheritor-panel-name">{selectedInheritor.name}</div>
            <button
              className="inheritor-panel-close"
              onClick={handleClosePanel}
              aria-label="关闭传承人详情"
              type="button"
            >✕</button>
          </div>
          {selectedInheritor.title && (
            <div className="inheritor-panel-title">{selectedInheritor.title}</div>
          )}
          {selectedInheritor.location && (
            <div className="inheritor-panel-location">◎ {selectedInheritor.location}</div>
          )}
          <hr className="inheritor-panel-divider" />
          <div className="inheritor-panel-section-title">传承经历</div>
          {selectedInheritor.biography
            ? <p className="inheritor-panel-bio">{selectedInheritor.biography}</p>
            : <p className="inheritor-panel-empty">暂无详细资料</p>
          }
          <hr className="inheritor-panel-divider" />
          <div className="inheritor-panel-section-title">主要成就</div>
          {selectedInheritor.achievements && selectedInheritor.achievements.length > 0
            ? (
              <ul className="inheritor-panel-achievements">
                {selectedInheritor.achievements.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )
            : <p className="inheritor-panel-empty">暂无详细资料</p>
          }
        </div>
      )}
    </div>
  )
}

// ── ProfileRedirect helper ────────────────────────────────────────────────────
function ProfileRedirect() {
  useEffect(() => { window.location.hash = '#/login' }, [])
  return null
}

// ── PasswordInput helper ──────────────────────────────────────────────────────
function PasswordInput({ id, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="password-wrapper">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? '隐藏密码' : '显示密码'}>
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
    </div>
  )
}

export default App
