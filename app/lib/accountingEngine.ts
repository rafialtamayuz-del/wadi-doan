import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OrderItem {
  menuItemId: string;
  quantity: number;
  priceWithoutTax: number;
}

export async function recordSaleTransaction(params: {
  invoiceId: string;
  department: 'RESTAURANT' | 'BANQUET';
  paymentMethod: 'CASH' | 'MADA' | 'DELIVERY_APP';
  items: OrderItem[];
  depositUsed?: number;
}) {
  const subtotal = params.items.reduce((sum, item) => sum + item.priceWithoutTax * item.quantity, 0);
  const vatAmount = Number((subtotal * 0.15).toFixed(2));
  const totalWithTax = Number((subtotal + vatAmount).toFixed(2));

  const debitAccount =
    params.paymentMethod === 'CASH' ? '1101' :
    params.paymentMethod === 'MADA' ? '1102' : '1103';

  const revenueAccount = params.department === 'RESTAURANT' ? '4101' : '4102';

  const { data: entry, error } = await supabase
    .from('journal_entries')
    .insert({
      reference_type: 'INVOICE',
      reference_id: params.invoiceId,
      description: `إثبات مبيعات فاتورة رقم ${params.invoiceId}`,
    })
    .select()
    .single();

  if (error) throw new Error(`فشل إنشاء القيد: ${error.message}`);

  const journalLines = [];

  const deposit = params.depositUsed || 0;
  const remainingDue = Number((totalWithTax - deposit).toFixed(2));

  if (deposit > 0) {
    journalLines.push({ entry_id: entry.id, account_code: '2103', debit: deposit, credit: 0 });
  }
  if (remainingDue > 0) {
    journalLines.push({ entry_id: entry.id, account_code: debitAccount, debit: remainingDue, credit: 0 });
  }

  journalLines.push(
    { entry_id: entry.id, account_code: revenueAccount, debit: 0, credit: subtotal },
    { entry_id: entry.id, account_code: '2102', debit: 0, credit: vatAmount }
  );

  await supabase.from('journal_lines').insert(journalLines);

  let totalCostOfGoods = 0;

  for (const item of params.items) {
    const { data: recipes } = await supabase
      .from('menu_recipes')
      .select('quantity_required, waste_factor, inventory_items(id, unit_cost, current_stock)')
      .eq('menu_item_id', item.menuItemId);

    if (recipes) {
      for (const r of recipes as any) {
        const consumedQty = item.quantity * r.quantity_required * (1 + r.waste_factor);
        const itemCost = consumedQty * r.inventory_items.unit_cost;
        totalCostOfGoods += itemCost;

        await supabase
          .from('inventory_items')
          .update({ current_stock: r.inventory_items.current_stock - consumedQty })
          .eq('id', r.inventory_items.id);
      }
    }
  }

  if (totalCostOfGoods > 0) {
    const roundedCost = Number(totalCostOfGoods.toFixed(2));
    await supabase.from('journal_lines').insert([
      { entry_id: entry.id, account_code: '5101', debit: roundedCost, credit: 0 },
      { entry_id: entry.id, account_code: '1201', debit: 0, credit: roundedCost },
    ]);
  }

  return { success: true, entryId: entry.id, totalWithTax, vatAmount, cost: totalCostOfGoods };
}
