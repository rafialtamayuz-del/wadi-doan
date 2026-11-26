import Link from 'next/link'

const items = [
  { cat: 'restaurant', title: 'مطعم يومي', desc: 'مندي وحنيذ ومضغوط طازج كل يوم.', image: '/images/mandi-chicken.png' },
  { cat: 'thabaeh', title: 'مطبخ ذبائح', desc: 'ذبائح نعيمي وحري مندي أو حنيذ.', image: '/images/whole-lamb.png' },
  { cat: 'walaem', title: 'ولائم ومناسبات', desc: 'تجهيز الأفراح والعزائم بكامل الخدمة.', image: '/images/feast.png' },
  { cat: 'eaasha', title: 'وجبات إعاشة', desc: 'عقود يومية وشهرية للشركات والمؤسسات.', image: '/images/catering.png' },
  { cat: 'iftar', title: 'إفطار صائم', desc: 'وجبات وسفر إفطار للأفراد والجمعيات.', image: '/images/iftar.png' },
]

export function Specialties() {
  return (
    <section aria-labelledby="spec-title" className="mx-auto max-w-7xl px-4 py-20">
      <div className="mb-10 flex flex-col gap-2">
        <p className="text-sm font-semibold text-primary">تخصصاتنا</p>
        <h2 id="spec-title" className="font-heading text-3xl font-bold text-balance md:text-4xl">
          من سفرة يومك إلى أكبر مناسباتك
        </h2>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.cat}>
            <Link
              href={`/restaurant?cat=${item.cat}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition hover:border-primary"
            >
              <img src={item.image} alt="" className="aspect-square w-full object-cover transition group-hover:scale-105" />
              <div className="flex flex-col gap-1 p-4">
                <h3 className="font-heading text-lg font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
