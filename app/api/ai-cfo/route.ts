import { getFinancialSummary, listTransactions } from '@/app/lib/accountingEngine'
import { getSettings } from '@/lib/data'
import { getCurrentUser } from '@/lib/supabase/server'

/**
 * المدير المالي الذكي (AI CFO): يحلّل المعاملات المالية المسجّلة عبر محرك المحاسبة
 * ويولّد رؤى وتوصيات باستخدام Gemini API. يتطلب تسجيل دخول صاحب المشروع.
 *
 * POST /api/ai-cfo
 * body: { question?: string }  — سؤال اختياري من صاحب المشروع؛ إن لم يُوفَّر يُقدّم تحليلًا عامًا.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    return Response.json(
      { error: 'مفتاح Gemini API غير مُعَّد. أضف GEMINI_API_KEY إلى متغيرات البيئة.', localError: true },
      { status: 503 },
    )
  }

  let question = ''
  try {
    const body = (await req.json()) as { question?: string }
    question = String(body.question ?? '').trim().slice(0, 1000)
  } catch {
    question = ''
  }

  try {
    const [summary, transactions, settings] = await Promise.all([
      getFinancialSummary(),
      listTransactions(),
      getSettings(),
    ])

    const recent = transactions.slice(0, 30).map((t) => ({
      date: t.createdAt.slice(0, 10),
      source: t.source,
      amount: t.amount,
      vat: t.vat,
      description: t.description,
    }))

    const systemPrompt =
      `أنت المدير المالي الذكي (AI CFO) لمطعم "${settings.name}" في ${settings.city}. ` +
      `تحلّل المعاملات المالية وتقدّم توصيات عملية موجزة باللغة العربية. ` +
      `لا تختلق أرقامًا؛ استخدم فقط البيانات المُقدَّمة. اجعل الإجابة منظمة بعناوين قصيرة ونقاط واضحة.`

    const userPrompt = [
      question ? `سؤال صاحب المشروع: ${question}` : 'قدّم تحليلًا ماليًا عامًا وأهم التوصيات.',
      '',
      'البيانات المالية:',
      `- إجمالي الإيرادات (شامل الضريبة): ${summary.totalRevenue.toFixed(2)} ر.س`,
      `- إجمالي ضريبة القيمة المضافة: ${summary.totalVat.toFixed(2)} ر.س`,
      `- صافي الإيرادات قبل الضريبة: ${summary.totalNet.toFixed(2)} ر.س`,
      `- عدد المعاملات: ${summary.count}`,
      '- التوزيع حسب المصدر:',
      ...Object.entries(summary.bySource).map(([k, v]) => `  • ${k}: ${v.count} معاملة بمبلغ ${v.amount.toFixed(2)} ر.س`),
      '',
      'آخر المعاملات:',
      JSON.stringify(recent, null, 2),
    ].join('\n')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
          ],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      },
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return Response.json({ error: `فشل استدعاء Gemini: ${res.status}`, detail: text.slice(0, 500) }, { status: 502 })
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
      error?: { message?: string }
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return Response.json({ error: data.error?.message ?? 'لم يُرجع Gemini ردًا نصيًا' }, { status: 502 })
    }

    return Response.json({
      answer: text,
      summary: {
        totalRevenue: summary.totalRevenue,
        totalVat: summary.totalVat,
        totalNet: summary.totalNet,
        count: summary.count,
        bySource: summary.bySource,
      },
    })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
