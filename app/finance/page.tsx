'use client';

import React, { useState } from 'react';

export default function FinanceAIDashboard() {
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    cogs: 0,
    labor: 0,
    primeCostRatio: '0',
    vatPayable: 0,
  });
  const [loading, setLoading] = useState(false);

  const askFinancialAI = async (customQuery?: string) => {
    const queryToSend = customQuery || question;
    if (!queryToSend.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai-cfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryToSend }),
      });
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
      setAiResponse(data.answer || data.error);
    } catch (err) {
      setAiResponse('حدث خطأ أثناء الاتصال بالمدير المالي الذكي.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 p-6 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-amber-900 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">الإدارة المالية الذكية — مطاعم ومطابخ وادي دوعن</h1>
            <p className="text-amber-200 text-sm mt-1">محاسبة الاستحقاق | ضبط التكاليف والولائم | الامتثال الضريبي (ZATCA 15%)</p>
          </div>
          <button
            onClick={() => askFinancialAI('اعطني ملخصاً تنفيذياً شاملاً للوضع المالي ونسبة التكلفة الأساسية والضريبة المستحقة الآن.')}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-xl transition"
          >
            تحديث المؤشرات بالذكاء الاصطناعي
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
            <p className="text-sm text-stone-500">إجمالي الإيرادات (بدون ضريبة)</p>
            <p className="text-2xl font-bold text-emerald-700 mt-2">{metrics.revenue.toLocaleString()} ر.س</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
            <p className="text-sm text-stone-500">تكلفة المواد الغذائية (COGS)</p>
            <p className="text-2xl font-bold text-stone-800 mt-2">{metrics.cogs.toLocaleString()} ر.س</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
            <p className="text-sm text-stone-500">مؤشر التكلفة الأساسية (Prime Cost)</p>
            <p className={`text-2xl font-bold mt-2 ${Number(metrics.primeCostRatio) > 60 ? 'text-red-600' : 'text-emerald-600'}`}>
              {metrics.primeCostRatio}%
            </p>
            <span className="text-xs text-stone-400">الحد الآمن المستهدف: 55% - 60%</span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
            <p className="text-sm text-stone-500">ضريبة القيمة المضافة (15%)</p>
            <p className="text-2xl font-bold text-amber-700 mt-2">{metrics.vatPayable.toLocaleString()} ر.س</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <h2 className="text-lg font-bold text-amber-900">المساعد المالي التنفيذي (AI CFO)</h2>
          
          <div className="flex flex-wrap gap-2">
            {[
              'حلل نسبة الهدر والمخزون الحالي واقترح أوامر الشراء',
              'كيف أحسن هامش ربح قسم المطابخ والولائم؟',
              'ما هي الالتزامات الضريبية والسيولة المتاحة لسداد الموردين؟',
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(preset);
                  askFinancialAI(preset);
                }}
                className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg transition"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="اسأل المدير المالي الذكي عن الأرباح، تكلفة المندي والذبائح، أو التدفقات النقدية..."
              className="flex-1 border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600"
            />
            <button
              onClick={() => askFinancialAI()}
              disabled={loading}
              className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? 'جاري التحليل...' : 'اسأل الآن'}
            </button>
          </div>

          {aiResponse && (
            <div className="bg-stone-50 border border-stone-200 p-5 rounded-xl whitespace-pre-line leading-relaxed text-stone-800">
              {aiResponse}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
