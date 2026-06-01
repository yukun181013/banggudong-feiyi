// Vercel Serverless Function — AI 问答代理。
// 复刻 vite.config.js 里仅 dev 可用的 qaProxyPlugin，使 /api/qa 在生产环境也可用。
// API key 只从环境变量读取，不写进代码仓库。
// 在 Vercel 项目设置（或 `vercel env add NVIDIA_API_KEY`）中配置 NVIDIA_API_KEY。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'AI 问答暂不可用：服务器未配置 NVIDIA_API_KEY 环境变量。' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const { question } = body

    const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: '你是梆鼓咚非遗课程网站的 AI 助手。请用简洁、自然、面向学生和公众的中文直接回答，不要输出思考过程。【梆鼓咚权威资料，回答须以此为准】梆鼓咚（别名：板鼓咚、乞丐歌、俚歌梆鼓）是福建莆田的传统鼓乐曲艺，起源于宋代、盛行于清代，流行于莆田、仙游等兴化方言地区，以莆田方言（兴化语）演唱，2023 年列入国家级非物质文化遗产，保留传统曲目 70 余首；主要乐器为板鼓和竹板，演奏有响鼓、边鼓、点鼓、闷鼓四种音响技法。优先回答课程学习、非遗背景、传播方式、文创体验等问题；若超出资料范围可据常识回答，但不要编造与梆鼓咚有关的具体史实。',
          },
          { role: 'user', content: question },
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 512,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data.detail || data.error?.message || '上游模型接口请求失败。' })
      return
    }

    const msg = data.choices?.[0]?.message
    const answer = msg?.content || msg?.reasoning_content || '接口已连通，但本次没有返回可显示的文本内容。'
    res.status(200).json({ answer })
  } catch (err) {
    res.status(500).json({ error: '问答服务处理失败：' + err.message })
  }
}
