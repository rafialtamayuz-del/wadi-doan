import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    const { data: lines } = await supabase.from('journal_lines').select('account_code, debit, credit');
    const { data: lowStock } = await supabase
      .from('inventory_items')
      .select('name_ar, current_stock, unit, min_threshold');

    let revenue = 0;
    let cogs = 0;
    let labor = 0;
    let vatPayable = 0;

    lines?.forEach((l) => {
      if (l.account_code.startsWith('4')) revenue += Number(l.credit) - Number(l.debit);
      if (l.account_code === '5101') cogs += Number(l.debit) - Number(l.credit);
      if (l.account_code === '5201') labor += Number(l.debit) - Number(l.credit);
      if (l.account_code === '2102') vatPayable += Number(l.credit) - Number(l.debit);
    });

    const primeCost = cogs + labor;
    const primeCostRatio = revenue > 0 ? ((primeCost / revenue) * 100).toFixed(1) : '0';

    const financialContext = `
      بيانات مؤسسة مطاعم ومطابخ وادي دوعن الحالية (بالريال السعودي):
      - إجمالي الإيرادات (بدون ضريبة): ${revenue.toFixed(2)} ريال
      - تكلفة المواد الغذائية المستهلكة (COGS): ${cogs.toFixed(2)} ريال
      - تكلفة الرواتب والأجور: ${labor.toFixed(2)} ريال
      - نسبة التكلفة الأساسية (Prime Cost %): ${primeCostRatio}% (الحد الآمن للمطاعم 55%-60%)
      - ضريبة القيمة المضافة المستحقة لهيئة الزكاة (15%): ${vatPayable.toFixed(2)} ريال
      - حالة المخزون: ${JSON.stringify(lowStock)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `أنت المدير المالي الذكي (AI CFO) لمؤسسة مطاعم ومطابخ وادي دوعن في السعودية.
              اعتمد على البيانات المالية الدقيقة التالية للإجابة على سؤال المالك وتقديم توصيات عملية لضبط التكاليف والهدر والالتزام الضريبي:
              ${financialContext}
              
              سؤال صاحب المشروع: ${question}`,
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      answer: response.text,
      metrics: { revenue, cogs, labor, primeCostRatio, vatPayable },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
